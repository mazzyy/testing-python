"""
Chat Tools — Function calling definitions and executor for Nova Chat.

Defines the tool schemas that Azure OpenAI can invoke, and the executor
that maps tool-call names to real database/service operations.
"""
import json
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session

# ---------------------------------------------------------------------------
# 1.  TOOL DEFINITIONS  (JSON-Schema format required by Azure OpenAI)
# ---------------------------------------------------------------------------

CHAT_TOOLS: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "search_programs",
            "description": (
                "Search for specific university PROGRAMS or COURSES in Germany. "
                "Use ONLY when the user asks about study programs, courses, "
                "subjects, or majors (e.g. 'data science programs', 'CS courses in Berlin'). "
                "Do NOT use for scholarship or funding questions."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Subject or field to search for (e.g. 'data science', 'mechanical engineering')"
                    },
                    "degree_type": {
                        "type": "string",
                        "enum": ["Bachelor", "Masters", "PhD"],
                        "description": "Filter by degree level"
                    },
                    "city": {
                        "type": "string",
                        "description": "Filter by German city (e.g. Munich, Berlin)"
                    },
                    "language": {
                        "type": "string",
                        "enum": ["English", "German"],
                        "description": "Teaching language filter"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Number of results to return (default 5)",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_scholarships",
            "description": (
                "Search for SCHOLARSHIPS, FUNDING, or FINANCIAL AID for studying in Germany. "
                "Use ONLY when the user asks about scholarships, grants, stipends, DAAD funding, "
                "or financial support. Do NOT use for program or course searches."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query for scholarships (e.g. 'DAAD funding', 'masters scholarship')"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Number of results to return (default 5)",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_universities",
            "description": (
                "Search for UNIVERSITIES or INSTITUTIONS in Germany. "
                "Use ONLY when the user asks about universities themselves "
                "(e.g. 'universities in Munich', 'which unis offer CS?', "
                "'tell me about TU Munich'). Returns university name, city, "
                "program count, and available degree types. "
                "Do NOT use for specific program or scholarship searches."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "search": {
                        "type": "string",
                        "description": "University name or keyword to search (e.g. 'TU Munich', 'technical university')"
                    },
                    "city": {
                        "type": "string",
                        "description": "Filter by city (e.g. 'Berlin', 'Munich')"
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Number of results to return (default 10)",
                        "default": 10
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_application_checklist",
            "description": (
                "Get the step-by-step APPLICATION PROCESS checklist for studying in Germany, "
                "customised by nationality. Covers: profile setup, eligibility checks, "
                "language requirements, document preparation, country-specific verification "
                "(APS, HEC, Apostille), university application, admission confirmation, "
                "financial documents, and visa process. "
                "Use when the user asks about the application process, required documents, "
                "visa steps, APS/HEC verification, or 'how to apply'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "nationality": {
                        "type": "string",
                        "description": "Student's nationality (e.g. 'India', 'Pakistan', 'China', 'Turkey'). Determines country-specific verification steps."
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_user_profile",
            "description": (
                "Retrieve the current user's academic profile including degree, "
                "CGPA, field of study, language levels, nationality, and preferences. "
                "Use when you need to personalise advice or check eligibility."
            ),
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_german_grade",
            "description": (
                "Convert a CGPA (on any grading scale) to the German grading "
                "system using the Modified Bavarian Formula. Use when the user "
                "asks about their GPA conversion, eligibility, or academic standing "
                "in German terms."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "cgpa": {
                        "type": "number",
                        "description": "The student's CGPA"
                    },
                    "gpa_scale": {
                        "type": "number",
                        "description": "Maximum possible GPA (e.g. 4.0, 10.0)"
                    },
                    "nationality": {
                        "type": "string",
                        "description": "Student's nationality (can affect conversion)"
                    }
                },
                "required": ["cgpa", "gpa_scale"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_user_vault_documents",
            "description": (
                "Retrieve all of the user's personal files/documents stored in their Vault. "
                "Use ONLY when the user asks about their own uploaded files, CVs, transcripts, "
                "or documents (e.g. 'show me my files', 'what documents do I have in the vault?', 'where is my cv?'). "
                "Requires user authentication."
            ),
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    }
]


# ---------------------------------------------------------------------------
# 2.  TOOL EXECUTOR
# ---------------------------------------------------------------------------

async def execute_tool(
    tool_name: str,
    tool_args: Dict[str, Any],
    db: Session,
    user_id: Optional[int] = None,
    user_profile: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Execute a tool call and return JSON-serialised results.
    """

    if tool_name == "search_programs":
        return await _tool_search_programs(tool_args, db)

    elif tool_name == "search_scholarships":
        return await _tool_search_scholarships(tool_args, db)

    elif tool_name == "search_universities":
        return await _tool_search_universities(tool_args, db)

    elif tool_name == "get_application_checklist":
        return _tool_get_application_checklist(tool_args, user_profile)

    elif tool_name == "get_user_profile":
        return _tool_get_user_profile(user_profile)

    elif tool_name == "calculate_german_grade":
        return _tool_calculate_german_grade(tool_args, user_profile)
        
    elif tool_name == "get_user_vault_documents":
        return _tool_get_user_vault_documents(db, user_id)

    else:
        return json.dumps({"error": f"Unknown tool: {tool_name}"})


# ---------------------------------------------------------------------------
# 3.  INDIVIDUAL TOOL IMPLEMENTATIONS
# ---------------------------------------------------------------------------

async def _tool_search_programs(
    args: Dict[str, Any], db: Session
) -> str:
    """Search programs via the existing RAG pipeline."""
    from app.services.rag_service import get_rag_service
    from app.models.program import Program

    rag = get_rag_service()

    query = args.get("query", "university program Germany")
    n = min(args.get("max_results", 5), 10)
    degree_type = args.get("degree_type")
    city = args.get("city")

    cities = [city] if city else None

    results = rag.search_programs(
        query=query,
        n_results=n,
        degree_type=degree_type,
        cities=cities,
        db=db,
    )

    programs = []
    for r in results[:n]:
        db_id = r.get("db_id")
        if db_id:
            program = db.query(Program).filter(Program.id == int(db_id)).first()
            if program:
                programs.append({
                    "id": program.id,
                    "program_name": program.program_name,
                    "university_name": program.university_name,
                    "degree_type": program.degree_type,
                    "degree": program.degree,
                    "city": program.city,
                    "teaching_language": program.teaching_language,
                    "url": program.url,
                    "admission_requirements": (program.academic_admission_requirements or "")[:400],
                    "language_requirements": (program.language_requirements or "")[:300],
                    "description": (program.description_content or "")[:300],
                })

    return json.dumps({"programs": programs, "total": len(programs)})


async def _tool_search_scholarships(
    args: Dict[str, Any], db: Session
) -> str:
    """Search scholarships via vector or SQL search."""
    from app.models.scholarship import Scholarship
    from sqlalchemy import or_

    query = args.get("query", "scholarship")
    n = min(args.get("max_results", 5), 10)

    # Try vector search first if available
    try:
        from app.services.rag_service import get_rag_service
        rag = get_rag_service()
        if rag.use_chromadb:
            try:
                sch_collection = rag.client.get_collection(
                    name="daad_scholarships",
                    embedding_function=rag.embedding_function,
                )
                vector_results = sch_collection.query(
                    query_texts=[query], n_results=n
                )
                if vector_results and vector_results["metadatas"]:
                    db_ids = [
                        m.get("db_id")
                        for m in vector_results["metadatas"][0]
                        if m and m.get("db_id")
                    ]
                    scholarships = []
                    for sid in db_ids:
                        sch = db.query(Scholarship).filter(
                            Scholarship.id == int(sid)
                        ).first()
                        if sch:
                            scholarships.append(_serialize_scholarship(sch))
                    if scholarships:
                        return json.dumps({"scholarships": scholarships, "total": len(scholarships)})
            except Exception:
                pass  # fall through to SQL search
    except Exception:
        pass

    # SQL fallback
    terms = query.lower().split()
    base = db.query(Scholarship).filter(Scholarship.is_active == True)
    if terms:
        conditions = []
        for term in terms:
            like = f"%{term}%"
            conditions.append(or_(
                Scholarship.title.ilike(like),
                Scholarship.objective.ilike(like),
                Scholarship.eligibility.ilike(like),
            ))
        from sqlalchemy import and_
        base = base.filter(and_(*conditions))

    rows = base.limit(n).all()
    scholarships = [_serialize_scholarship(s) for s in rows]
    return json.dumps({"scholarships": scholarships, "total": len(scholarships)})


def _serialize_scholarship(sch) -> Dict[str, Any]:
    return {
        "id": sch.id,
        "title": sch.title,
        "eligibility": (sch.eligibility or "")[:400],
        "value_benefits": (sch.value_benefits or "")[:300],
        "duration": sch.duration,
        "deadline": sch.deadline,
        "link": sch.link,
    }


async def _tool_search_universities(
    args: Dict[str, Any], db: Session
) -> str:
    """Search universities from the programs table (aggregated)."""
    from app.models.program import Program
    from sqlalchemy import func, distinct

    search = args.get("search")
    city = args.get("city")
    n = min(args.get("max_results", 10), 20)

    # Build base query — aggregate from programs
    base = db.query(
        Program.university_name,
        func.count(Program.id).label("program_count"),
    ).filter(Program.is_active == True)

    if city:
        base = base.filter(Program.city.ilike(f"%{city}%"))

    if search:
        base = base.filter(Program.university_name.ilike(f"%{search}%"))

    base = base.group_by(Program.university_name)
    base = base.order_by(func.count(Program.id).desc())
    rows = base.limit(n).all()

    universities = []
    for uni_name, prog_count in rows:
        # Get extra info for this university
        sample = db.query(Program).filter(
            Program.university_name == uni_name,
            Program.is_active == True,
        ).first()

        degree_types_q = db.query(distinct(Program.degree_type)).filter(
            Program.university_name == uni_name,
            Program.is_active == True,
            Program.degree_type.isnot(None),
        ).all()
        degree_types = [d[0] for d in degree_types_q if d[0]]

        universities.append({
            "name": uni_name,
            "city": sample.city if sample else None,
            "program_count": prog_count,
            "degree_types": degree_types,
        })

    return json.dumps({"universities": universities, "total": len(universities)})


def _tool_get_application_checklist(
    args: Dict[str, Any],
    user_profile: Optional[Dict[str, Any]] = None,
) -> str:
    """Return the application process checklist, customised by nationality."""
    from app.routers.applications import (
        DEFAULT_CHECKLIST,
        COUNTRY_CONFIG,
    )

    # Determine nationality
    nationality = args.get("nationality")
    if not nationality and user_profile:
        nationality = user_profile.get("nationality")

    # Build the default checklist
    checklist = []
    for category, item_name, description in DEFAULT_CHECKLIST:
        checklist.append({
            "category": category.value if hasattr(category, "value") else str(category),
            "step": item_name,
            "description": description,
        })

    # Add country-specific verification steps
    country_steps = []
    matched_country = None
    if nationality:
        key = nationality.lower().strip()
        for country, steps in COUNTRY_CONFIG.items():
            if key in country or country in key:
                matched_country = country.title()
                for category, item_name, description in steps:
                    country_steps.append({
                        "category": category.value if hasattr(category, "value") else str(category),
                        "step": item_name,
                        "description": description,
                    })
                break

    return json.dumps({
        "checklist": checklist,
        "country_specific_steps": country_steps,
        "nationality_matched": matched_country,
        "total_steps": len(checklist) + len(country_steps),
    })


def _tool_get_user_profile(
    user_profile: Optional[Dict[str, Any]],
) -> str:
    """Return the pre-fetched user profile dict."""
    if not user_profile:
        return json.dumps({"error": "No profile data available. The user has not completed their profile yet."})

    # Return a clean copy (drop None values for readability)
    clean = {k: v for k, v in user_profile.items() if v is not None}
    return json.dumps({"profile": clean})


def _tool_calculate_german_grade(
    args: Dict[str, Any],
    user_profile: Optional[Dict[str, Any]] = None,
) -> str:
    """Convert CGPA to German grade using the Modified Bavarian Formula."""
    from app.utils.gpa_utils import calculate_german_grade

    cgpa = args.get("cgpa")
    gpa_scale = args.get("gpa_scale")
    nationality = args.get("nationality")

    # Fall back to user profile values if not supplied
    if cgpa is None and user_profile:
        cgpa = user_profile.get("cgpa")
    if gpa_scale is None and user_profile:
        gpa_scale = user_profile.get("gpa_scale")
    if nationality is None and user_profile:
        nationality = user_profile.get("nationality")

    if cgpa is None or gpa_scale is None:
        return json.dumps({"error": "CGPA and GPA scale are required for conversion."})

    try:
        result = calculate_german_grade(
            gpa=float(cgpa),
            scale=float(gpa_scale),
            nationality=nationality,
        )
        return json.dumps(result)
    except Exception as e:
        return json.dumps({"error": f"Grade conversion failed: {str(e)}"})


def _tool_get_user_vault_documents(db: Session, user_id: Optional[int] = None) -> str:
    """Return all the user's documents from the Vault."""
    if not user_id:
        return json.dumps({"error": "User is not authenticated. Cannot access Vault documents."})
    
    try:
        from app.models.user import User
        from app.routers.vault import get_all_user_documents
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return json.dumps({"error": "User not found."})
            
        docs = get_all_user_documents(user, db)
        print(f"[VAULT_TOOL] Found {len(docs)} documents for user {user.email}")
        
        # We need to serialize the list of DocumentResponse objects to dicts
        import pydantic
        import os
        from app.services.document_parser import get_document_parser_service
        
        parser = get_document_parser_service()
        docs_data = []
        
        for doc in docs:
            doc_dict = json.loads(doc.json()) if isinstance(doc, pydantic.BaseModel) else doc.dict()
            
            # Try to read file and extract content preview
            try:
                if doc.file_path and os.path.exists(doc.file_path):
                    with open(doc.file_path, "rb") as f:
                        file_bytes = f.read()
                        text = parser.extract_text(file_bytes, doc.file_name)
                        if text:
                            # Provide up to 5000 characters as a preview
                            doc_dict["content_preview"] = text[:5000]
            except Exception as e:
                print(f"[VAULT_TOOL] Failed to extract text for {doc.file_name}: {e}")
                
            docs_data.append(doc_dict)
        
        output = json.dumps({
            "vault_documents": docs_data,
            "message": f"Found {len(docs_data)} files in your vault."
        })
        print(f"[VAULT_TOOL] Serialized output: {output[:100]}...")
        return output
    except Exception as e:
        import traceback
        traceback.print_exc()
        return json.dumps({"error": f"Failed to retrieve Vault documents: {str(e)}", "trace": traceback.format_exc()})
