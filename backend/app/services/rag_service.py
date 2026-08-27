"""
RAG (Retrieval Augmented Generation) Service for program recommendations
With fallback to SQL-based search when ChromaDB is unavailable

Embeddings are generated via Azure OpenAI API (text-embedding-3-small) to
avoid loading the ~776MB ONNX model locally. This keeps memory under 200MB.
"""
import threading
import httpx
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, text

from app.config import settings
from app.models.program import Program
from app.models.cached_recommendation import CachedRecommendation
from app.services.azure_openai import get_azure_openai_service

# Try to import ChromaDB module (the package import itself is cheap).
try:
    import chromadb
    from chromadb.api.types import EmbeddingFunction, Documents, Embeddings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    EmbeddingFunction = object  # Fallback base class
    Documents = List[str]
    Embeddings = List[List[float]]
    print("[WARN]  ChromaDB not available, using SQL-based search fallback")


class AzureOpenAIEmbeddingFunction(EmbeddingFunction):
    """
    ChromaDB-compatible embedding function using Azure OpenAI API.
    Generates embeddings via HTTP instead of loading a local ONNX model,
    saving ~776MB of RAM.
    """

    def __init__(
        self,
        api_key: str = None,
        endpoint: str = None,
        deployment: str = None,
        api_version: str = None,
    ):
        self.api_key = api_key or settings.AZURE_EMBEDDING_API_KEY
        self.endpoint = (endpoint or settings.AZURE_EMBEDDING_ENDPOINT).rstrip("/")
        self.deployment = deployment or settings.AZURE_EMBEDDING_DEPLOYMENT
        self.api_version = api_version or settings.AZURE_EMBEDDING_API_VERSION

        if not self.api_key:
            raise ValueError(
                "AZURE_EMBEDDING_API_KEY not set. "
                "Please configure embedding credentials in .env"
            )

        self._url = (
            f"{self.endpoint}/openai/deployments/{self.deployment}"
            f"/embeddings?api-version={self.api_version}"
        )
        self._client = httpx.Client(timeout=60.0)

    def __call__(self, input: Documents) -> Embeddings:
        """Generate embeddings for a list of documents with retry on rate limits."""
        if not input:
            return []

        import time as _time

        max_retries = 5
        for attempt in range(max_retries):
            response = self._client.post(
                self._url,
                headers={"api-key": self.api_key, "Content-Type": "application/json"},
                json={"input": input},
            )

            if response.status_code == 429:
                # Rate limited — exponential backoff
                retry_after = int(response.headers.get("Retry-After", 2 ** attempt))
                wait = max(retry_after, 2 ** attempt)
                print(f"[EMBED] Rate limited (429), retrying in {wait}s (attempt {attempt + 1}/{max_retries})")
                _time.sleep(wait)
                continue

            response.raise_for_status()
            data = response.json()
            embeddings = [item["embedding"] for item in data["data"]]
            return embeddings

        # Exhausted retries
        response.raise_for_status()
        return []


class RAGService:
    """
    RAG Pipeline for DAAD Course Search and Recommendations
    Falls back to SQL-based search if ChromaDB is not installed.

    Uses Azure OpenAI embeddings API (zero local memory overhead).
    """

    def __init__(self, db_path: str = None):
        """
        Lightweight constructor — ChromaDB is initialised lazily.
        """
        print("[START] Initializing RAG Service (lazy-load mode)...")

        self.db_path = db_path or settings.CHROMA_DB_PATH
        self._chromadb_enabled = CHROMADB_AVAILABLE   # whether the package exists
        self._chromadb_ready = False                  # whether it has been initialised
        self._chromadb_lock = threading.Lock()         # guards lazy init

        # These are set on first use by _ensure_chromadb()
        self.client = None
        self.embedding_function = None
        self.collection = None

        # The OpenAI service is cheap to create — keep it eager
        self.ai_service = get_azure_openai_service()

        print("[OK] RAG Service ready (ChromaDB will load on first search)")

    # ------------------------------------------------------------------
    # Lazy initialisation
    # ------------------------------------------------------------------
    def _ensure_chromadb(self) -> bool:
        """
        Initialise ChromaDB client + Azure OpenAI embeddings on first use.
        Thread-safe: concurrent calls block until init is complete.

        Returns True if ChromaDB is available and ready, False otherwise
        (service will fall back to SQL search).
        """
        if self._chromadb_ready:
            return True
        if not self._chromadb_enabled:
            return False

        with self._chromadb_lock:
            # Double-check after acquiring the lock
            if self._chromadb_ready:
                return True

            print("[LAZY] Initialising ChromaDB + Azure OpenAI embeddings...")
            try:
                self.client = chromadb.PersistentClient(path=self.db_path)

                # Use Azure OpenAI API for embeddings (zero local RAM)
                self.embedding_function = AzureOpenAIEmbeddingFunction()

                self.collection = self.client.get_or_create_collection(
                    name="daad_programs",
                    embedding_function=self.embedding_function
                )

                self._chromadb_ready = True
                print(f"[OK] ChromaDB ready ({self.collection.count()} programs indexed)")
                return True
            except Exception as e:
                print(f"[WARN]  ChromaDB lazy-init failed: {e}")
                print("        Falling back to SQL-based search for this session")
                self._chromadb_enabled = False  # disable for future calls
                return False

    # convenience: were we using chromadb? (mirrors old self.use_chromadb usage)
    @property
    def use_chromadb(self) -> bool:
        return self._chromadb_ready


    def index_programs(self, db: Session, force_reload: bool = False) -> int:
        """
        Index all programs from database into vector store.

        If ChromaDB is already populated this returns immediately.
        Embeddings are generated via Azure OpenAI API.
        """
        if not self._chromadb_enabled:
            # Package not installed — SQL-only mode
            count = db.query(Program).filter(Program.is_active == True).count()
            print(f"[INFO]  SQL fallback mode: {count} programs available for search")
            return count

        # Peek at the collection count WITHOUT loading the ONNX model if possible
        # (PersistentClient doesn't need the embedding function just to count)
        try:
            _tmp_client = chromadb.PersistentClient(path=self.db_path)
            _tmp_col = _tmp_client.get_or_create_collection(name="daad_programs")
            existing_count = _tmp_col.count()
        except Exception:
            existing_count = 0

        if existing_count > 0 and not force_reload:
            print(f"[INFO]  Vector DB already has {existing_count} programs — skipping index (lazy mode)")
            return existing_count

        # Need to actually index → now we load ChromaDB + ONNX model
        if not self._ensure_chromadb():
            count = db.query(Program).filter(Program.is_active == True).count()
            return count

        if force_reload and self.collection.count() > 0:
            print(f"[DELETE]  Clearing existing programs...")
            self.client.delete_collection("daad_programs")
            self.collection = self.client.get_or_create_collection(
                name="daad_programs",
                embedding_function=self.embedding_function
            )

        # Get all active programs from database in batches to save memory
        programs_query = db.query(Program).filter(Program.is_active == True)

        total_count = programs_query.count()
        if total_count == 0:
            print("[ERROR] No programs to index!")
            return 0

        print(f"[INDEX] Indexing {total_count} programs...")

        documents = []
        metadatas = []
        ids = []

        for program in programs_query.yield_per(50):
            doc_text = program.to_searchable_text()
            documents.append(doc_text)

            metadata = {
                'program_id': program.program_id,
                'program_name': program.program_name or 'N/A',
                'university_name': program.university_name or 'N/A',
                'degree_type': program.degree_type or 'N/A',
                'city': program.city or 'N/A',
                'url': program.url or 'N/A',
                'db_id': str(program.id)
            }
            metadatas.append(metadata)
            ids.append(f"program_{program.id}")

            if len(documents) >= 50:
                self.collection.add(documents=documents, metadatas=metadatas, ids=ids)
                print(f"   [OK] Indexed {len(documents)} programs...")
                documents, metadatas, ids = [], [], []
                import time; time.sleep(2)  # Pace requests to avoid 429 rate limits

        if documents:
            self.collection.add(documents=documents, metadatas=metadatas, ids=ids)
            print(f"   [OK] Indexed {len(documents)} programs...")

        total = self.collection.count()
        print(f"[OK] Vector DB now contains {total} programs")
        return total

    def index_scholarships(self, db: Session, force_reload: bool = False) -> int:
        """
        Index all scholarships from database into vector store
        """
        if not self._chromadb_enabled:
            from app.models.scholarship import Scholarship
            count = db.query(Scholarship).filter(Scholarship.is_active == True).count()
            print(f"[INFO]  SQL fallback mode: {count} scholarships available")
            return count

        if not self._ensure_chromadb():
            from app.models.scholarship import Scholarship
            return db.query(Scholarship).filter(Scholarship.is_active == True).count()

        # Create or get scholarship collection
        collection = self.client.get_or_create_collection(
            name="daad_scholarships",
            embedding_function=self.embedding_function
        )

        existing_count = collection.count()

        if existing_count > 0 and not force_reload:
            print(f"[INFO]  Vector DB already contains {existing_count} scholarships")
            return existing_count

        if force_reload and existing_count > 0:
            print(f"[DELETE]  Clearing {existing_count} existing scholarships...")
            self.client.delete_collection("daad_scholarships")
            collection = self.client.get_or_create_collection(
                name="daad_scholarships",
                embedding_function=self.embedding_function
            )

        from app.models.scholarship import Scholarship
        scholarships = db.query(Scholarship).filter(Scholarship.is_active == True).all()

        if not scholarships:
            print("[ERROR] No scholarships to index!")
            return 0

        print(f"[INDEX] Indexing {len(scholarships)} scholarships...")

        documents = []
        metadatas = []
        ids = []

        for scholarship in scholarships:
            doc_text = f"Scholarship: {scholarship.title}\n"
            if scholarship.objective: doc_text += f"Objective: {scholarship.objective}\n"
            if scholarship.eligibility: doc_text += f"Eligibility: {scholarship.eligibility}\n"
            if scholarship.value_benefits: doc_text += f"Benefits: {scholarship.value_benefits}\n"

            documents.append(doc_text)

            metadata = {
                'scholarship_id': str(scholarship.scholarship_id),
                'title': scholarship.title,
                'db_id': str(scholarship.id)
            }
            metadatas.append(metadata)
            ids.append(f"scholarship_{scholarship.id}")

            if len(documents) >= 50:
                collection.add(documents=documents, metadatas=metadatas, ids=ids)
                print(f"   [OK] Indexed {len(documents)} scholarships...")
                documents, metadatas, ids = [], [], []
                import time; time.sleep(1)  # Pace to avoid 429

        if documents:
            collection.add(documents=documents, metadatas=metadatas, ids=ids)
            print(f"   [OK] Indexed {len(documents)} scholarships...")

        total = collection.count()
        print(f"[OK] Vector DB now contains {total} scholarships")
        return total

    def search_programs(
        self,
        query: str,
        n_results: int = 10,
        degree_type: Optional[str] = None,
        cities: Optional[List[str]] = None,
        teaching_language: Optional[str] = None,
        db: Session = None
    ) -> List[Dict[str, Any]]:
        """
        Search for programs using semantic similarity or SQL fallback.
        Triggers lazy ChromaDB initialisation on first call.
        """
        print(f"\n[SEARCH] Searching for: '{query}'")

        # Trigger lazy init; fall back to SQL if ChromaDB can't start
        chromadb_ok = self._ensure_chromadb()

        if not chromadb_ok:
            return self._sql_search(query, n_results, degree_type, cities, teaching_language, db)

        # Build filters for ChromaDB
        where_filter = None
        print(f"[DEBUG] Building filters: degree_type={degree_type}, cities={cities}")
        
        conditions = []
        if degree_type:
            conditions.append({"degree_type": degree_type})
        
        if cities and len(cities) > 0:
            # Handle city filtering
            if len(cities) == 1:
                conditions.append({"city": cities[0]})
            else:
                # Multiple cities -> OR condition
                # ChromaDB requires $or for multiple conditions within a field context or top level
                city_conditions = [{"city": c} for c in cities]
                conditions.append({"$or": city_conditions})
            
        if len(conditions) == 1:
            where_filter = conditions[0]
        elif len(conditions) > 1:
            where_filter = {"$and": conditions}
        
        # Search in vector database
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where_filter
        )
        print(f"[DEBUG] Vector search raw results count: {len(results['ids'][0]) if results['ids'] else 0}")
        
        # Format vector results
        formatted_results = []
        seen_ids = set()
        
        if results and results['metadatas'] and len(results['metadatas']) > 0:
            for i, metadata in enumerate(results['metadatas'][0]):
                if metadata is None:
                    continue  # Skip entries with no metadata
                
                # Check if this result matches our filters (double check because Chroma sometimes is fuzzy)
                # Actually Chroma filter is strict, so we trust it.
                
                result = {
                    **metadata,
                    'document_text': results['documents'][0][i] if results['documents'] else '',
                    'distance': results['distances'][0][i] if results.get('distances') else 0,
                    'source': 'vector'
                }
                formatted_results.append(result)
                seen_ids.add(result.get('program_id'))
        
        # ALWAYS perform SQL fallback/supplemental search if we have filters, 
        # to ensure we don't miss obvious keyword matches that might have low semantic score
        print(f"[SEARCH] Supplementing with SQL keyword search...")
        sql_results = self._sql_search(query, n_results, degree_type, cities, teaching_language, db)
        
        for res in sql_results:
            if res.get('program_id') not in seen_ids:
                # Add SQL result
                res['distance'] = 0.0 # Treat as exact match or high relevance
                res['source'] = 'sql'
                formatted_results.append(res)
                seen_ids.add(res.get('program_id'))
                
        print(f"[OK] Found {len(formatted_results)} matching programs (hybrid)")
        return formatted_results[:n_results*2] # Return ample results for re-ranking or selection
    
    def _sql_search(
        self,
        query: str,
        n_results: int,
        degree_type: Optional[str],
        cities: Optional[List[str]],
        teaching_language: Optional[str],
        db: Session
    ) -> List[Dict[str, Any]]:
        """
        SQL-based fallback search using LIKE queries
        """
        if db is None:
            print("[ERROR] Database session required for SQL fallback search")
            return []
        
        # Build base query
        base_query = db.query(Program).filter(Program.is_active == True)
        
        # Apply filters
        if degree_type:
            base_query = base_query.filter(Program.degree_type == degree_type)
        if cities and len(cities) > 0:
            # Filter by any of the cities (OR)
            city_conditions = [Program.city.ilike(f"%{c}%") for c in cities]
            base_query = base_query.filter(or_(*city_conditions))
        if teaching_language:
            from sqlalchemy.types import String
            base_query = base_query.filter(Program.teaching_language.cast(String).ilike(f"%{teaching_language}%"))
        
        # Text search across multiple fields - use OR for broader results
        # Filter out generic stopwords that don't help narrow results
        stopwords = {'degree', 'program', 'university', 'taught', 'in', 'the', 'a', 'an', 'and', 'or', 'of', 'for', 'to'}
        search_terms = [t for t in query.lower().split() if t not in stopwords and len(t) > 2]
        if search_terms:
            conditions = []
            # Build OR conditions for each search term across multiple fields
            for term in search_terms:
                term_pattern = f"%{term}%"
                term_conditions = [
                    Program.program_name.ilike(term_pattern),
                    Program.university_name.ilike(term_pattern),
                    Program.description_content.ilike(term_pattern),
                    Program.academic_admission_requirements.ilike(term_pattern)
                ]
                conditions.append(or_(*term_conditions))
            
            # Use OR: match ANY of the search terms (broader results)
            if conditions:
                base_query = base_query.filter(or_(*conditions))
        
        # Execute query to get ALL potential matches (with a generous limit)
        programs = base_query.limit(100).all()
        
        # Format results and calculate basic relevance score
        formatted_results = []
        for program in programs:
            # Calculate a simple relevance score based on how many terms match
            score = 0
            name_matched = False
            if search_terms:
                searchable_text = f"{program.program_name or ''} {program.university_name or ''} {program.description_content or ''}".lower()
                for term in search_terms:
                    if term in searchable_text:
                        # Bonus points if it's in the program name
                        if program.program_name and term in program.program_name.lower():
                            score += 5
                            name_matched = True
                        else:
                            score += 1
                            
                # Heavy penalty if none of the core search terms appeared in the program's actual name/degree
                # This prevents an "Economics" degree from ranking high for a "Data Science" query 
                # just because it mentions "data science" in its description.
                if not name_matched and len(search_terms) > 0:
                    score -= 50

            formatted_results.append({
                'program_id': program.program_id,
                'program_name': program.program_name or 'N/A',
                'university_name': program.university_name or 'N/A',
                'degree_type': program.degree_type or 'N/A',
                'city': program.city or 'N/A',
                'url': program.url or 'N/A',
                'db_id': str(program.id),
                'document_text': program.to_searchable_text(),
                'distance': 0.5,  # Placeholder
                'relevance_score': score
            })
            
        # Sort by relevance score descending
        formatted_results.sort(key=lambda x: x.get('relevance_score', 0), reverse=True)
        
        print(f"[OK] Found {len(formatted_results)} matching programs (SQL search), returning top {n_results}")
        return formatted_results[:n_results]
    
    async def get_recommendations(
        self,
        db: Session,
        user_profile: Dict[str, Any],
        query: Optional[str] = None,
        n_results: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get personalized program recommendations based on user profile
        
        Args:
            db: Database session
            user_profile: User's academic profile
            query: Optional search query
            n_results: Number of recommendations
        
        Returns:
            List of recommended programs with match scores
        """
        # Build search query from profile
        search_parts = []
        
        if query:
            search_parts.append(query)
        
        if user_profile.get('desired_degree'):
            search_parts.append(f"{user_profile['desired_degree']} degree")
        
        if user_profile.get('desired_fields'):
            fields = user_profile['desired_fields']
            if isinstance(fields, list):
                search_parts.extend(fields)
            else:
                search_parts.append(fields)
        
        if user_profile.get('field_of_study'):
            search_parts.append(user_profile['field_of_study'])
        
        if user_profile.get('preferred_language'):
            search_parts.append(f"taught in {user_profile['preferred_language']}")
        
        # Create combined query
        search_query = " ".join(search_parts) if search_parts else "university program Germany"
        
        # Get degree type filter
        degree_filter = None
        if user_profile.get('desired_degree'):
            degree_map = {
                'bachelor': 'Bachelor',
                'masters': 'Masters',
                'master': 'Masters',
                'phd': 'PhD',
                'doctorate': 'PhD'
            }
            degree_filter = degree_map.get(user_profile['desired_degree'].lower())
        
        # Search programs (synchronous DB query)
        search_results = self.search_programs(
            query=search_query,
            n_results=n_results * 2,  # Get more to filter
            degree_type=degree_filter,
            db=db
        )
        
        # Pre-fetch programs and German grade
        from app.utils.gpa_utils import calculate_german_grade
        from app.database import SessionLocal
        
        german_grade_info = None
        if user_profile.get('cgpa') and user_profile.get('gpa_scale'):
            try:
                german_grade_info = calculate_german_grade(
                    gpa=float(user_profile['cgpa']),
                    scale=float(user_profile['gpa_scale']),
                    nationality=user_profile.get('nationality')
                )
            except Exception:
                pass

        # Prepare programs for batch scoring
        program_data_list = []
        program_models_map = {}
        distances_map = {}
        
        for idx, result in enumerate(search_results):
            program_db_id = result.get('db_id')
            if not program_db_id:
                continue
                
            program = db.query(Program).filter(Program.id == int(program_db_id)).first()
            if not program:
                continue
                
            prog_data = {
                'program_name': program.program_name,
                'degree': program.degree,
                'university_name': program.university_name,
                'teaching_language': program.teaching_language,
                'academic_admission_requirements': program.academic_admission_requirements,
                'language_requirements': program.language_requirements,
                'db_id': program.id
            }
            
            program_data_list.append(prog_data)
            program_models_map[idx] = program
            distances_map[idx] = result.get('distance', 0)

        # Truncate to save tokens (limit batch to 10 programs maximum)
        max_batch = min(10, n_results)
        program_data_list_truncated = program_data_list[:max_batch]
        
        # Batch score
        batch_scores = []
        if program_data_list_truncated:
            batch_scores = await self.ai_service.calculate_batch_match_score_async(
                user_profile, 
                program_data_list_truncated,
                german_grade=german_grade_info
            )
            
        recommendations = []
        for idx, rec in enumerate(batch_scores):
            prog_model = program_models_map.get(idx)
            if prog_model:
                recommendations.append({
                    'program': prog_model,
                    'match_score': rec.get('match_score', 50),
                    'match_reasons': rec.get('match_reasons', []),
                    'concerns': rec.get('concerns', []),
                    'distance': distances_map.get(idx, 0)
                })
        
        # Sort by match score
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        
        return recommendations[:n_results]
    
    async def chat(
        self,
        query: str,
        db: Session,
        user_profile: Optional[Dict[str, Any]] = None,
        n_context_programs: int = 5,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Chat interface powered by Azure OpenAI function calling.

        The model autonomously decides which tools to invoke (search_programs,
        search_scholarships, get_user_profile, calculate_german_grade), executes
        them, and produces a final natural-language answer.

        After the tool-calling loop, we extract program IDs that were returned
        by ``search_programs`` and run parallel AI match scoring to build the
        recommendation cards the frontend renders below the chat bubble.
        """
        import json as _json
        import hashlib
        import asyncio
        from app.services.chat_tools import CHAT_TOOLS, execute_tool

        # ── 1. Build messages ──────────────────────────────────────────
        system_prompt = (
            "You are Nova, a friendly and knowledgeable AI study-abroad advisor "
            "for German universities, created by Musawar.\n\n"
            "ROUTING RULES — follow these strictly:\n"
            "1. If the user asks about study PROGRAMS, COURSES, or SUBJECTS → "
            "   call search_programs.  Do NOT also call search_scholarships.\n"
            "2. If the user asks about SCHOLARSHIPS, FUNDING, or FINANCIAL AID → "
            "   call search_scholarships.  Do NOT also call search_programs.\n"
            "3. If the user asks about UNIVERSITIES or INSTITUTIONS → "
            "   call search_universities.\n"
            "4. If the user asks about the APPLICATION PROCESS, VISA, DOCUMENTS, "
            "   or 'how to apply' → call get_application_checklist.\n"
            "5. If the user asks about their PROFILE, GPA, or ELIGIBILITY → "
            "   call get_user_profile and/or calculate_german_grade.\n"
            "6. If the user asks about their own UPLOADED FILES, CV, TRANSCRIPTS, "
            "   or VAULT → call get_user_vault_documents.\n"
            "7. If the user asks to generate or create a CV/Resume, redirect them to the CV Generator by outputting the following exact message: 'I can help with that! [Click here to go to the CV Generator](/tools/cv-generator)'\n"
            "8. If the user asks to generate or create an SOP/Statement of Purpose, redirect them to the SOP Generator by outputting the following exact message: 'I can help with that! [Click here to go to the SOP Generator](/tools/sop-generator)'\n"
            "9. For general or conversational questions (greetings, about you, "
            "   etc.) → answer directly, no tool needed.\n"
            "10. Only combine tools when truly needed (e.g. 'Am I eligible for "
            "   CS programs?' → get_user_profile + search_programs).\n\n"
            "OUTPUT RULES:\n"
            "- Do NOT fabricate program names, URLs, or document names.\n"
            "- Do NOT include external URLs in your text — internal tool links are allowed.\n"
            "- Be concise, warm, and encouraging.\n\n"
            "## PROACTIVE INTELLIGENCE RULES\n\n"
            "After answering the user's question, check their profile for opportunities to proactively help. Only add ONE nudge per response.\n"
            "Use this priority order:\n\n"
            "1. URGENT DEADLINES: If any application deadline is within 14 days\n"
            '-> "Heads up: Your [Program] deadline is in [X] days!"\n\n'
            "2. MISSING DOCUMENTS: If user discusses a program but hasn't uploaded required documents for it\n"
            '-> "I noticed your document vault is missing [X]. You\'ll need this for [Program]. Want me to take you there?"\n\n'
            "3. INCOMPLETE PROFILE: If user's profile is < 80% complete and they're asking for recommendations\n"
            '-> "Your recommendations would be more accurate if you add [missing field]. It takes just a minute."\n\n'
            "4. SCHOLARSHIP OPPORTUNITY: If user discusses costs and matches an unchecked scholarship\n"
            '-> "By the way, the [Scholarship] might cover your costs. Want me to check your eligibility?"\n\n'
            "Format nudges as a brief note at the end, separated by a line.\n"
            "Never add more than one nudge. Skip if the user seems frustrated or is asking a quick factual question.\n"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query},
        ]

        # ── 2. Run function-calling loop ───────────────────────────────
        tool_result = await self.ai_service.chat_with_tools_async(
            messages=messages,
            tools=CHAT_TOOLS,
            tool_executor=execute_tool,
            tool_executor_kwargs={
                "db": db,
                "user_id": user_id,
                "user_profile": user_profile,
            },
            max_turns=5,
            user_id=user_id,
        )

        response_text = tool_result["response"]
        tool_calls_made = tool_result.get("tool_calls_made", [])
        print(f"[CHAT] Tool calls made: {[t['tool'] for t in tool_calls_made]}")

        # ── 3. Extract program IDs from search_programs results ────────
        found_program_ids: list[int] = []
        for tc in tool_calls_made:
            if tc["tool"] == "search_programs":
                try:
                    data = _json.loads(tc["result_preview"] + "}")  # might be truncated
                except Exception:
                    pass
                # Parse from the full result stored in the messages
                # We need to look through the messages for tool results
                pass

        # Better approach: re-query DB for programs matching what the model found
        # by parsing the tool results from the message history
        for msg in messages:
            if isinstance(msg, dict) and msg.get("role") == "tool":
                try:
                    content = _json.loads(msg["content"])
                    if "programs" in content:
                        for p in content["programs"]:
                            pid = p.get("id")
                            if pid and pid not in found_program_ids:
                                found_program_ids.append(pid)
                except Exception:
                    continue
            elif hasattr(msg, "role"):
                # Skip ChatCompletionMessage objects
                continue

        # ── 4. Build recommendations with AI match scores ──────────────
        recommendations = []

        if found_program_ids and user_profile:
            from app.utils.gpa_utils import calculate_german_grade

            # Pre-calculate German grade
            german_grade_info = None
            profile_hash = ""
            try:
                if user_profile.get("cgpa") and user_profile.get("gpa_scale"):
                    german_grade_info = calculate_german_grade(
                        gpa=float(user_profile["cgpa"]),
                        scale=float(user_profile["gpa_scale"]),
                        nationality=user_profile.get("nationality"),
                    )
            except Exception:
                pass

            # Profile hash for caching
            key_fields = [
                "desired_degree", "desired_fields", "field_of_study",
                "english_level", "german_level", "preferred_language",
                "current_degree", "cgpa",
            ]
            hash_data = {k: user_profile.get(k) for k in key_fields if user_profile.get(k)}
            profile_hash = hashlib.sha256(
                _json.dumps(hash_data, sort_keys=True).encode()
            ).hexdigest()[:32]

            async def _score_program(program):
                """Score a single program, using cache when available."""
                # Check cache
                if profile_hash and user_id:
                    cached = db.query(CachedRecommendation).filter(
                        CachedRecommendation.user_id == user_id,
                        CachedRecommendation.program_id == program.id,
                        CachedRecommendation.profile_hash == profile_hash,
                    ).first()
                    if cached:
                        return {
                            "program": program,
                            "match_score": cached.match_score,
                            "match_reasons": cached.match_reasons or [],
                            "gaps": cached.gaps or [],
                            "highlights": cached.highlights,
                        }

                # AI match scoring
                try:
                    match_info = await self.ai_service.calculate_match_score_async(
                        user_profile,
                        {
                            "program_name": program.program_name,
                            "degree": program.degree,
                            "university_name": program.university_name,
                            "teaching_language": program.teaching_language,
                            "academic_admission_requirements": program.academic_admission_requirements,
                            "language_requirements": program.language_requirements,
                        },
                        user_id=user_id,
                        german_grade=german_grade_info,
                    )

                    # Cache result
                    if profile_hash and user_id:
                        try:
                            cached_rec = CachedRecommendation(
                                user_id=user_id,
                                program_id=program.id,
                                match_score=match_info.get("match_score", 50),
                                match_reasons=match_info.get("match_reasons", []),
                                gaps=match_info.get("concerns", []),
                                highlights=match_info.get("recommendation"),
                                profile_hash=profile_hash,
                            )
                            db.add(cached_rec)
                            db.commit()
                        except Exception:
                            db.rollback()

                    return {
                        "program": program,
                        "match_score": match_info.get("match_score", 50),
                        "match_reasons": match_info.get("match_reasons", []),
                        "gaps": match_info.get("concerns", []),
                        "highlights": match_info.get("recommendation"),
                    }
                except Exception as e:
                    print(f"Match scoring error: {e}")
                    return {
                        "program": program,
                        "match_score": 70,
                        "match_reasons": ["Based on search relevance"],
                        "gaps": [],
                        "highlights": None,
                    }

            # Fetch program objects and score in parallel
            programs = [
                db.query(Program).filter(Program.id == pid).first()
                for pid in found_program_ids
            ]
            programs = [p for p in programs if p]

            if programs:
                scored = await asyncio.gather(
                    *[_score_program(p) for p in programs],
                    return_exceptions=True,
                )
                for s in scored:
                    if not isinstance(s, Exception):
                        recommendations.append(s)

                recommendations.sort(key=lambda x: x.get("match_score", 0), reverse=True)

        elif found_program_ids:
            # No user profile → basic recommendations without AI scoring
            for pid in found_program_ids:
                program = db.query(Program).filter(Program.id == pid).first()
                if program:
                    recommendations.append({
                        "program": program,
                        "match_score": 75,
                        "match_reasons": ["Matches your search"],
                        "gaps": [],
                        "highlights": None,
                    })

        # ── 5. Extract scholarship IDs from search_scholarships results ──
        from app.models.scholarship import Scholarship
        found_scholarship_ids: list[int] = []
        for msg in messages:
            if isinstance(msg, dict) and msg.get("role") == "tool":
                try:
                    content = _json.loads(msg["content"])
                    if "scholarships" in content:
                        for s in content["scholarships"]:
                            sid = s.get("id")
                            if sid and sid not in found_scholarship_ids:
                                found_scholarship_ids.append(sid)
                except Exception:
                    continue

        scholarship_objects = []
        for sid in found_scholarship_ids:
            sch = db.query(Scholarship).filter(Scholarship.id == sid).first()
            if sch:
                scholarship_objects.append(sch)

        # ── 6. Extract universities from search_universities results ────
        found_universities: list[dict] = []
        for msg in messages:
            if isinstance(msg, dict) and msg.get("role") == "tool":
                try:
                    content = _json.loads(msg["content"])
                    if "universities" in content:
                        for u in content["universities"]:
                            if u not in found_universities:
                                found_universities.append(u)
                except Exception:
                    continue

        # ── 7. Extract vault documents from tool results ────────────────
        found_vault_documents: list[dict] = []
        for msg in messages:
            if isinstance(msg, dict) and msg.get("role") == "tool":
                try:
                    content = _json.loads(msg["content"])
                    if "vault_documents" in content:
                        for doc in content["vault_documents"]:
                            if doc not in found_vault_documents:
                                found_vault_documents.append(doc)
                except Exception:
                    continue

        # ── 8. Build source list ───────────────────────────────────────
        sources = [r["program"].program_name for r in recommendations if r.get("program")]

        structured_data = {
            "recommendations": recommendations,
            "scholarships": scholarship_objects,
            "universities": found_universities,
            "vault_documents": found_vault_documents,
            "sources": sources,
        }

        if tool_result.get("is_stream"):
            return {
                "is_stream": True,
                "stream_generator": tool_result["stream_generator"],
                "response": response_text,
                **structured_data
            }
        else:
            return {
                "response": response_text,
                **structured_data
            }



# Singleton instance  (thread-safe via a module-level lock)
_rag_service: Optional[RAGService] = None
_rag_service_lock = threading.Lock()


def get_rag_service() -> RAGService:
    """Get or create the singleton RAG service instance."""
    global _rag_service
    if _rag_service is None:
        with _rag_service_lock:
            if _rag_service is None:
                _rag_service = RAGService()
    return _rag_service
