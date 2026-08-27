"""
Azure OpenAI Service for AI-powered features
"""
from openai import AzureOpenAI, AsyncAzureOpenAI
from typing import Optional, List, Dict, Any, Tuple
import json
import asyncio
from app.config import settings

# Token pricing constants (USD per 1K tokens) - Azure OpenAI pricing
# These can be adjusted based on actual Azure pricing
COST_PER_1K_TOKENS = {
    "gpt-4": {"prompt": 0.03, "completion": 0.06},
    "gpt-4-turbo": {"prompt": 0.01, "completion": 0.03},
    "gpt-4o": {"prompt": 0.005, "completion": 0.015},
    "gpt-4o-mini": {"prompt": 0.00015, "completion": 0.0006},
    "gpt-5-mini": {"prompt": 0.0003, "completion": 0.0012},  # GPT-5 mini pricing estimate
    "gpt-35-turbo": {"prompt": 0.0005, "completion": 0.0015},
    "default": {"prompt": 0.01, "completion": 0.03}
}


def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """Calculate cost in USD based on token usage"""
    model_key = model.lower() if model.lower() in COST_PER_1K_TOKENS else "default"
    pricing = COST_PER_1K_TOKENS[model_key]
    prompt_cost = (prompt_tokens / 1000) * pricing["prompt"]
    completion_cost = (completion_tokens / 1000) * pricing["completion"]
    return prompt_cost + completion_cost


class AzureOpenAIService:
    """
    Service for interacting with Azure OpenAI API
    """
    
    def __init__(self):
        """Initialize Azure OpenAI client"""
        self.client = AzureOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            timeout=60.0,
        )
        self.async_client = AsyncAzureOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            timeout=60.0,
        )
        self.model = settings.AZURE_OPENAI_DEPLOYMENT
    
    def _log_usage(
        self,
        user_id: int,
        operation_type: str,
        prompt_tokens: int,
        completion_tokens: int,
        total_tokens: int,
        model: str
    ) -> None:
        """Log token usage to database (synchronous)"""
        try:
            from app.database import SessionLocal
            from app.models.token_usage import TokenUsage
            
            cost = calculate_cost(model, prompt_tokens, completion_tokens)
            
            db = SessionLocal()
            try:
                usage = TokenUsage(
                    user_id=user_id,
                    operation_type=operation_type,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    total_tokens=total_tokens,
                    cost_usd=cost,
                    model=model
                )
                db.add(usage)
                db.commit()
            finally:
                db.close()
        except Exception as e:
            print(f"Failed to log token usage: {e}")
    
    async def _log_usage_async(
        self,
        user_id: int,
        operation_type: str,
        prompt_tokens: int,
        completion_tokens: int,
        total_tokens: int,
        model: str
    ) -> None:
        """Log token usage to database (async using run_in_executor)"""
        import asyncio
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            self._log_usage,
            user_id,
            operation_type,
            prompt_tokens,
            completion_tokens,
            total_tokens,
            model
        )

    
    def generate_response(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 1500,
        temperature: float = 0.7,
        user_id: Optional[int] = None,
        operation_type: str = "general"
    ) -> str:
        """
        Generate a response from Azure OpenAI (Synchronous)
        
        Args:
            messages: List of message dicts with role and content
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature
            user_id: User ID for tracking (optional)
            operation_type: Type of operation for tracking
        """
        try:
            print(f"[AI] generate_response: model={self.model}, msg_count={len(messages)}", flush=True)
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages
            )
            
            # Log token usage if user_id provided
            if user_id and response.usage:
                self._log_usage(
                    user_id=user_id,
                    operation_type=operation_type,
                    prompt_tokens=response.usage.prompt_tokens,
                    completion_tokens=response.usage.completion_tokens,
                    total_tokens=response.usage.total_tokens,
                    model=self.model
                )
            
            print(f"[AI] generate_response: completed, response length={len(response.choices[0].message.content or '')}")
            return response.choices[0].message.content
        except Exception as e:
            print(f"Azure OpenAI Error: {str(e)}")
            raise

    async def generate_response_async(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 1500,
        temperature: float = 0.7,
        user_id: Optional[int] = None,
        operation_type: str = "general"
    ) -> str:
        """
        Generate a response from Azure OpenAI (Asynchronous)
        
        Args:
            messages: List of message dicts with role and content
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature
            user_id: User ID for tracking (optional)
            operation_type: Type of operation for tracking
        """
        try:
            response = await self.async_client.chat.completions.create(
                model=self.model,
                messages=messages
            )
            
            # Log token usage if user_id provided
            if user_id and response.usage:
                await self._log_usage_async(
                    user_id=user_id,
                    operation_type=operation_type,
                    prompt_tokens=response.usage.prompt_tokens,
                    completion_tokens=response.usage.completion_tokens,
                    total_tokens=response.usage.total_tokens,
                    model=self.model
                )
            
            return response.choices[0].message.content
        except Exception as e:
            print(f"Async Azure OpenAI Error: {str(e)}")
            raise
    
    # ... existing sync methods ...

    def calculate_scholarship_eligibility(
        self,
        user_profile: Dict[str, Any],
        scholarship: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate eligibility for a scholarship (Synchronous Wrapper)
        """
        return asyncio.run(self.calculate_scholarship_eligibility_async(user_profile, scholarship))

    async def calculate_scholarship_eligibility_async(
        self,
        user_profile: Dict[str, Any],
        scholarship: Dict[str, Any],
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Calculate eligibility for a scholarship based on user profile (Async)
        
        Args:
            user_profile: User's academic profile
            scholarship: Scholarship data
            user_id: User ID for token tracking (optional)
        
        Returns:
            Dict with eligibility_score, reasons, concerns, and missing_fields
        """
        prompt = f"""Analyze if this student is eligible for this scholarship.

Student Profile:
- Current Degree: {user_profile.get('current_degree', 'Not provided')}
- Field of Study: {user_profile.get('field_of_study', 'Not provided')}
- CGPA: {user_profile.get('cgpa', 'Not provided')}/{user_profile.get('gpa_scale', '4.0')}
- English Level: {user_profile.get('english_level', 'Not provided')}
- German Level: {user_profile.get('german_level', 'Not provided')}
- Desired Degree: {user_profile.get('desired_degree', 'Not provided')}
- Nationality: {user_profile.get('nationality', 'Not provided')}
- Needs Funding: {user_profile.get('needs_funding', 'Not provided')}

Scholarship:
- Title: {scholarship.get('title', 'N/A')}
- Eligibility Requirements: {scholarship.get('eligibility', 'N/A')}
- Duration: {scholarship.get('duration', 'N/A')}
- Value/Benefits: {scholarship.get('value_benefits', 'N/A')}
- Deadline: {scholarship.get('deadline', 'N/A')}

IMPORTANT:
1. Analyze the eligibility requirements carefully
2. If user profile is missing key information needed to determine eligibility, list those in missing_fields
3. Be generous with scoring if requirements are vague or "Not specified"

Return ONLY this JSON:
{{
  "eligibility_score": <number 0-100>,
  "reasons": ["why they match requirement 1", "why they match requirement 2"],
  "concerns": ["potential issue 1", "potential issue 2"],
  "missing_fields": ["field_name_1", "field_name_2"],
  "recommendation": "brief recommendation about applying"
}}

Valid missing_fields options: current_degree, field_of_study, cgpa, english_level, german_level, nationality, desired_degree"""

        try:
            messages = [
                {"role": "system", "content": "You are a scholarship eligibility advisor. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.generate_response_async(
                messages, 
                max_tokens=500, 
                temperature=0.3,
                user_id=user_id,
                operation_type="scholarship_eligibility"
            )
            
            # Parse JSON response
            text = response.strip().replace('```json', '').replace('```', '').strip()
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            
            if json_start != -1 and json_end > json_start:
                result = json.loads(text[json_start:json_end])
                # Ensure all expected fields exist
                result.setdefault('eligibility_score', 50)
                result.setdefault('reasons', [])
                result.setdefault('concerns', [])
                result.setdefault('missing_fields', [])
                result.setdefault('recommendation', '')
                return result
            
            return {"eligibility_score": 50, "reasons": ["Unable to analyze"], "concerns": [], "missing_fields": [], "recommendation": ""}
            
        except Exception as e:
            print(f"Scholarship eligibility calculation error: {e}")
            return {"eligibility_score": 50, "reasons": ["Error in analysis"], "concerns": [], "missing_fields": [], "recommendation": ""}
    
    def parse_document(
        self, 
        document_text: str, 
        doc_type: str = "transcript",
        user_id: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Parse a document and extract structured information
        
        Args:
            document_text: Raw text from document
            doc_type: Type of document (transcript, cv, degree, language_cert)
            user_id: User ID for token tracking (optional)
        
        Returns:
            Extracted structured data as dict
        """
        prompt = f"""You are an expert at extracting information from academic documents.
Analyze this {doc_type} document carefully and extract ALL available information.

Document text:
{document_text[:6000]}

Extract and return ONLY this JSON (use null for missing fields):
{{
  "student_name": "Full name of the person",
  "email": "Email address if found",
  "phone": "Phone number if found",
  "nationality": "Nationality if mentioned",
  "university": "Name of university/institution",
  "degree": "Degree program (e.g., Bachelor of Science in Computer Science)",
  "major": "Major/Field of study",
  "cgpa": null,
  "gpa_scale": null,
  "graduation_date": "Graduation date or expected",
  "courses": ["Course 1", "Course 2"],
  "honors": "Any honors/awards",
  "skills": ["Skill 1", "Skill 2"],
  "work_experience": "Brief work experience if CV",
  "research_experience": "Research experience if mentioned",
  "english_level": "English proficiency level if mentioned (A1-C2)",
  "german_level": "German proficiency level if mentioned (A1-C2)",
  "language_certificates": ["Certificate name and score"]
}}

IMPORTANT: 
1. Return ONLY the JSON object
2. No markdown code blocks
3. No explanations
4. Parse the actual text carefully - extract real data from the document"""

        try:
            messages = [
                {"role": "system", "content": "You are a document parsing assistant. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ]
            
            print(f"[AI] parse_document: calling generate_response...")
            response = self.generate_response(
                messages, 
                max_tokens=1000, 
                temperature=0.1,
                user_id=user_id,
                operation_type="document_parse"
            )
            print(f"[AI] parse_document: got response, length={len(response or '')}")
            
            # Clean the response
            text = response.strip()
            text = text.replace('```json', '').replace('```', '').strip()
            
            # Find JSON in response
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            
            if json_start != -1 and json_end > json_start:
                json_text = text[json_start:json_end]
                return json.loads(json_text)
            
            print(f"[WARN] parse_document: no JSON found in response: {text[:200]}")
            return None
            
        except json.JSONDecodeError as e:
            print(f"[ERROR] JSON parsing error: {e}", flush=True)
            return None
        except Exception as e:
            print(f"[ERROR] Document parsing error: {e}", flush=True)
            return None
    
    def generate_recommendation_analysis(
        self,
        user_profile: str,
        programs: List[Dict[str, Any]],
        query: Optional[str] = None
    ) -> str:
        """
        Generate AI analysis of program recommendations
        
        Args:
            user_profile: User's academic profile context
            programs: List of program data
            query: Optional user query
        
        Returns:
            AI-generated analysis and recommendations
        """
        programs_text = "\n\n".join([
            f"Program {i+1}:\n"
            f"- Name: {p.get('program_name', 'N/A')}\n"
            f"- University: {p.get('university_name', 'N/A')}\n"
            f"- Degree: {p.get('degree', 'N/A')}\n"
            f"- City: {p.get('city', 'N/A')}\n"
            f"- Teaching Language: {p.get('teaching_language', 'N/A')}\n"
            f"- Duration: {p.get('programme_duration', 'N/A')}\n"
            f"- Requirements: {p.get('academic_admission_requirements', 'N/A')[:500]}\n"
            f"- Language Requirements: {p.get('language_requirements', 'N/A')[:300]}"
            for i, p in enumerate(programs[:10])
        ])
        
        prompt = f"""You are a helpful study abroad advisor for German universities.

User Profile:
{user_profile}

{f"User's Question: {query}" if query else "The user is looking for program recommendations."}

Available Programs:
{programs_text}

Please provide:
1. A brief analysis of which programs best match the user's profile
2. Specific recommendations with reasons
3. Any important requirements or deadlines the user should note
4. Helpful tips for the application process

Be friendly, encouraging, and specific in your recommendations."""

        messages = [
            {"role": "system", "content": "You are a knowledgeable and friendly study abroad advisor specializing in German universities."},
            {"role": "user", "content": prompt}
        ]
        
        return self.generate_response(messages, max_tokens=1500, temperature=0.7)
    
    def chat_about_programs(
        self,
        user_message: str,
        context_programs: List[Dict[str, Any]],
        user_profile: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        user_id: Optional[int] = None
    ) -> str:
        """
        Chat interface for Q&A about programs
        
        Args:
            user_message: User's question
            context_programs: Relevant programs for context
            user_profile: Optional user profile context
            chat_history: Previous messages in conversation
            user_id: User ID for token tracking (optional)
        
        Returns:
            AI response
        """
        # Build context from programs
        context = "Here are relevant DAAD courses/programs:\n\n"
        for i, p in enumerate(context_programs[:5], 1):
            context += f"--- Program {i} ---\n"
            context += f"Name: {p.get('program_name', 'N/A')}\n"
            context += f"University: {p.get('university_name', 'N/A')}\n"
            context += f"Degree: {p.get('degree', 'N/A')}\n"
            context += f"City: {p.get('city', 'N/A')}\n"
            context += f"URL: {p.get('url', 'N/A')}\n"
            if p.get('description_content'):
                context += f"Description: {p['description_content'][:500]}...\n"
            if p.get('academic_admission_requirements'):
                context += f"Admission Requirements: {p['academic_admission_requirements'][:400]}\n"
            if p.get('language_requirements'):
                context += f"Language Requirements: {p['language_requirements'][:300]}\n"
            context += "\n"
        
        system_message = """You are a helpful study abroad advisor for German universities.
Answer questions based on the provided program information.
Include specific course names and institutions when relevant.
Do NOT provide direct links (URLs) to the programs in your text response. 
Instead, refer to the "program cards" that will be shown below your response.
If admission or language requirements are mentioned in the context, include those details.
Be friendly and encouraging!"""
        
        if user_profile:
            system_message += f"\n\nUser Profile: {user_profile}"
        
        messages = [{"role": "system", "content": system_message}]
        
        # Add chat history if provided
        if chat_history:
            messages.extend(chat_history[-6:])  # Last 6 messages for context
        
        # Add context and user message
        messages.append({
            "role": "user",
            "content": f"{context}\n\nUser Question: {user_message}"
        })
        
        return self.generate_response(
            messages, 
            max_tokens=1000, 
            temperature=0.7,
            user_id=user_id,
            operation_type="chat"
        )
    
    def calculate_match_score(
        self,
        user_profile: Dict[str, Any],
        program: Dict[str, Any],
        german_grade: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate match score between user profile and program
        
        Args:
            user_profile: User's academic profile
            program: Program data
            german_grade: Pre-calculated German grade equivalent (optional)
        
        Returns:
            Dict with score and reasons
        """
        
        # Prepare grade context string
        grade_context = ""
        if german_grade and "error" not in german_grade:
            grade_context = f"- Converted German Grade: {german_grade.get('german_grade_display')} (1.0 is Best, 4.0 is Pass, >4.0 Fail)"

        prompt = f"""Analyze the match between this student profile and program.

Student Profile:
- Current Degree: {user_profile.get('current_degree', 'N/A')}
- Field of Study: {user_profile.get('field_of_study', 'N/A')}
- CGPA: {user_profile.get('cgpa', 'N/A')}/{user_profile.get('gpa_scale', '4.0')}
{grade_context}
- English Level: {user_profile.get('english_level', 'N/A')}
- German Level: {user_profile.get('german_level', 'N/A')}
- Desired Degree: {user_profile.get('desired_degree', 'N/A')}
- Preferred Language: {user_profile.get('preferred_language', 'N/A')}
- Nationality: {user_profile.get('nationality', 'N/A')}

Program:
- Name: {program.get('program_name', 'N/A')}
- Degree: {program.get('degree', 'N/A')}
- University: {program.get('university_name', 'N/A')}
- Teaching Language: {program.get('teaching_language', 'N/A')}
- Admission Requirements: {program.get('academic_admission_requirements', 'N/A')[:500]}
- Language Requirements: {program.get('language_requirements', 'N/A')[:300]}

IMPORTANT CONTEXT:
- Degree hierarchy: PhD > Masters > Bachelor. If someone has a Masters or PhD, they already have a Bachelor's degree (do NOT flag missing Bachelor's).
- If current degree is Masters/PhD and applying for Masters program, they meet the Bachelor's requirement.
- Focus on field relevance, language requirements, and GPA in your analysis.
- Use the Converted German Grade if provided to determine academic eligibility.

Return ONLY this JSON:
{{
  "match_score": <number 0-100>,
  "match_reasons": ["reason1", "reason2", "reason3"],
  "concerns": ["concern1", "concern2"],
  "recommendation": "brief recommendation"
}}"""

        try:
            messages = [
                {"role": "system", "content": "You are an academic advisor. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ]
            
            response = self.generate_response(messages, max_tokens=500, temperature=0.3)
            
            # Parse JSON response
            text = response.strip().replace('```json', '').replace('```', '').strip()
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            
            if json_start != -1 and json_end > json_start:
                return json.loads(text[json_start:json_end])
            
            return {"match_score": 50, "match_reasons": ["Unable to analyze"], "concerns": [], "recommendation": ""}
            
        except Exception as e:
            print(f"Match score calculation error: {e}")
            return {"match_score": 50, "match_reasons": ["Error in analysis"], "concerns": [], "recommendation": ""}
    
    async def calculate_match_score_async(
        self,
        user_profile: Dict[str, Any],
        program: Dict[str, Any],
        user_id: Optional[int] = None,
        german_grade: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate match score between user profile and program (Async version)
        
        Args:
            user_profile: User's academic profile
            program: Program data
            user_id: User ID for token tracking (optional)
            german_grade: Pre-calculated German grade equivalent (optional)
        
        Returns:
            Dict with score and reasons
        """
        
        # Prepare grade context string
        grade_context = ""
        if german_grade and "error" not in german_grade:
            grade_context = f"- Converted German Grade: {german_grade.get('german_grade_display')} (1.0 is Best, 4.0 is Pass, >4.0 Fail)"
        
        # Language context — only include proficiency the student actually provided.
        # If it's missing, treat language as a non-blocking item they can certify
        # later, NOT a concern or a score penalty.
        _cert_parts = [p for p in [user_profile.get('english_certificate'), user_profile.get('english_score')] if p]
        _lang_lines = []
        if user_profile.get('english_level'):
            _cert = f" ({' '.join(map(str, _cert_parts))})" if _cert_parts else ""
            _lang_lines.append(f"- English Level: {user_profile.get('english_level')}{_cert}")
        if user_profile.get('german_level'):
            _lang_lines.append(f"- German Level: {user_profile.get('german_level')}")
        if _lang_lines:
            language_block = "\n".join(_lang_lines)
            language_rule = "- Language: factor the provided level in, but a shortfall is at most a MINOR concern — never cap the score for language alone."
        else:
            language_block = "- Language Proficiency: Not provided yet (student will certify later)"
            language_rule = "- Language: NOT provided yet. Do NOT lower the score and do NOT list IELTS/TOEFL/language as a concern; assume they certify before applying."

        prompt = f"""Analyze the match between this student profile and program.

Student Profile:
- Current Degree: {user_profile.get('current_degree', 'N/A')}
- Field of Study: {user_profile.get('field_of_study', 'N/A')}
- Desired Fields: {', '.join(user_profile.get('desired_fields', [])) if isinstance(user_profile.get('desired_fields'), list) else user_profile.get('desired_fields', 'N/A')}
- CGPA: {user_profile.get('cgpa', 'N/A')}/{user_profile.get('gpa_scale', '4.0')}
{grade_context}
{language_block}
- Desired Degree: {user_profile.get('desired_degree', 'N/A')}

Program:
- Name: {program.get('program_name', 'N/A')}
- Degree: {program.get('degree', 'N/A')}
- Teaching Language: {program.get('teaching_language', 'N/A')}
- Admission Requirements: {program.get('academic_admission_requirements', 'N/A')[:200]}
- Language Requirements: {program.get('language_requirements', 'N/A')[:100]}

CRITICAL TWO-STEP EVALUATION:
Step 1: Domain Relevance
- FIRST, determine if the Program Name and Degree align with the student's explicitly stated 'Field of Study' or 'Desired Fields'. 
- For example, if the student wants "Data Science & AI", an "Economics" or "Geoinformatics" program is a HORRIBLE match, even if the student's grades are perfect.
- If the domain does NOT match the student's explicit field preferences, you MUST immediately cap the `match_score` at a maximum of 45. DO NOT proceed to Step 2.

Step 2: Peripheral Scoring
- IF AND ONLY IF the domain is highly relevant, proceed to score secondary factors.
- Award points for high GPA and degree hierarchy (PhD > Masters > Bachelor).
{language_rule}

Return ONLY this structured JSON with VERY CONCISE reasons (max 5-7 words per reason):
{{
  "match_score": <number 0-100>,
  "match_reasons": ["<short reason 1>", "<short reason 2>"],
  "concerns": ["<short concern 1>", "<short concern 2>"]
}}"""

        try:
            messages = [
                {"role": "system", "content": "You are a fast academic advisor API. Return ONLY minified JSON without any thinking blocks."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.generate_response_async(
                messages, 
                max_tokens=150,  # Reduced from 500 to ensure fast response 
                temperature=0.1, # Reduced strictly for json
                user_id=user_id,
                operation_type="match_score"
            )
            
            # Parse JSON response
            text = response.strip().replace('```json', '').replace('```', '').strip()
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            
            if json_start != -1 and json_end > json_start:
                return json.loads(text[json_start:json_end])
            
            return {"match_score": 50, "match_reasons": ["Unable to analyze"], "concerns": [], "recommendation": ""}
            
        except Exception as e:
            return {"match_score": 50, "match_reasons": ["Error in analysis"], "concerns": [], "recommendation": ""}

    async def calculate_batch_match_score_async(
        self,
        user_profile: Dict[str, Any],
        programs: List[Dict[str, Any]],
        user_id: Optional[int] = None,
        german_grade: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Calculate match scores for multiple programs in a single prompt to avoid rate-limits and timeout.
        """
        if not programs:
            return []
            
        # Prepare grade context string
        grade_context = ""
        if german_grade and "error" not in german_grade:
            grade_context = f"- Converted German Grade: {german_grade.get('german_grade_display')} (1.0 is Best, 4.0 is Pass, >4.0 Fail)"
        
        programs_text = ""
        for i, program in enumerate(programs):
            programs_text += f"""
Program {i}:
- Name: {program.get('program_name', 'N/A')}
- Degree: {program.get('degree', 'N/A')}
- University: {program.get('university_name', 'N/A')}
- Teaching Language: {program.get('teaching_language', 'N/A')}
- Admission Requirements: {program.get('academic_admission_requirements', 'N/A')[:300]}
- Language Requirements: {program.get('language_requirements', 'N/A')[:150]}
"""

        # Language context — only include proficiency the student actually provided.
        # If it's missing, treat language as a non-blocking item they can certify
        # later, NOT a concern or a score penalty.
        _cert_parts = [p for p in [user_profile.get('english_certificate'), user_profile.get('english_score')] if p]
        _lang_lines = []
        if user_profile.get('english_level'):
            _cert = f" ({' '.join(map(str, _cert_parts))})" if _cert_parts else ""
            _lang_lines.append(f"- English Level: {user_profile.get('english_level')}{_cert}")
        if user_profile.get('german_level'):
            _lang_lines.append(f"- German Level: {user_profile.get('german_level')}")
        if _lang_lines:
            language_block = "\n".join(_lang_lines)
            language_rule = "- LANGUAGE: factor provided levels in, but a shortfall is at most a MINOR concern — never the sole reason for a low score."
        else:
            language_block = "- Language Proficiency: Not provided yet (student will certify later)"
            language_rule = "- LANGUAGE: NOT provided yet. Do NOT lower match_score for this and do NOT list IELTS/TOEFL/language as a concern; assume they certify before applying."

        prompt = f"""Analyze the match between this student profile and {len(programs)} programs.

Student Profile:
- Current Degree: {user_profile.get('current_degree', 'N/A')}
- Field of Study: {user_profile.get('field_of_study', 'N/A')}
- CGPA: {user_profile.get('cgpa', 'N/A')}/{user_profile.get('gpa_scale', '4.0')}
{grade_context}
{language_block}
- Desired Degree: {user_profile.get('desired_degree', 'N/A')}
- Desired Field: {user_profile.get('desired_fields', 'N/A')}
- Preferred Language: {user_profile.get('preferred_language', 'N/A')}
- Nationality: {user_profile.get('nationality', 'N/A')}

Programs to evaluate:
{programs_text}

IMPORTANT CONTEXT:
- STRICT FIELD MATCH: If a program's field or name does NOT align with the student's 'Desired Field', the match_score MUST be below 40.
- STRICT DEGREE MATCH: If the student wants a 'Master' and the program is a 'Bachelor', the match_score MUST be below 20.
- Degree hierarchy: PhD > Masters > Bachelor. If someone has a Masters or PhD, they already have a Bachelor's degree.
{language_rule}
- Focus on field relevance and GPA. Language is secondary and must never be the sole reason for a low score.

Return ONLY this structured JSON format representing an array of results with VERY CONCISE reasons (max 5-7 words per reason), EXACTLY {len(programs)} items in the same order.
[
  {{
    "program_index": 0,
    "match_score": <number 0-100>,
    "match_reasons": ["<short reason 1>", "<short reason 2>"],
    "concerns": ["<short concern 1>"]
  }},
  ...
]"""

        try:
            messages = [
                {"role": "system", "content": "You are a fast, strict academic advisor API. Return ONLY minified JSON array without any thinking blocks or markdown backticks."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.generate_response_async(
                messages, 
                max_tokens=800,
                temperature=0.1,
                user_id=user_id,
                operation_type="batch_match_score"
            )
            
            # Parse JSON response
            text = response.strip().replace('```json', '').replace('```', '').strip()
            json_start = text.find('[')
            json_end = text.rfind(']') + 1
            
            if json_start != -1 and json_end > json_start:
                results = json.loads(text[json_start:json_end])
                
                # Make sure we map answers back correctly by index
                final_results = [{"match_score": 50, "match_reasons": ["Error parsing result"], "concerns": []} for _ in programs]
                for result in results:
                    if isinstance(result, dict) and 'program_index' in result:
                        idx = result['program_index']
                        if 0 <= idx < len(programs):
                            final_results[idx] = {
                                "match_score": result.get("match_score", 50),
                                "match_reasons": result.get("match_reasons", []),
                                "concerns": result.get("concerns", [])
                            }
                return final_results

        except Exception as e:
            print(f"Batch scoring failed: {e}")
            pass
            
        # Fallback to default scores
        return [{"match_score": 50, "match_reasons": ["Error in batch analysis"], "concerns": []} for _ in programs]

    async def extract_search_filters(self, query: str, user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Extract search filters (city, degree type) from user query
        
        Args:
            query: User search query or message
            user_id: User ID for tracking
            
        Returns:
            Dict with potential filters
        """
        prompt = f"""Extract search filters from this user query about German university programs:
"{query}"

Return ONLY this JSON:
{{
  "cities": ["List of city names mentioned (e.g. Bamberg, Nuremberg), or empty list"],
  "degree_type": "Bachelor, Masters, or PhD if mentioned, or null",
  "search_query": "The core subject/search terms without the city/degree words"
}}"""

        try:
            messages = [
                {"role": "system", "content": "You are a search query parser. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.generate_response_async(
                messages, 
                max_tokens=150, 
                temperature=0.1,
                user_id=user_id,
                operation_type="filter_extraction"
            )
            
            # Parse JSON
            text = response.strip().replace('```json', '').replace('```', '').strip()
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            
            if json_start != -1 and json_end > json_start:
                return json.loads(text[json_start:json_end])
            
            return {"city": None, "degree_type": None, "search_query": query}
            
        except Exception as e:
            print(f"Filter extraction error: {e}")
            return {"city": None, "degree_type": None, "search_query": query}

    async def chat_with_tools_async(
        self,
        messages: List[Dict[str, Any]],
        tools: List[Dict[str, Any]],
        tool_executor,
        tool_executor_kwargs: Optional[Dict[str, Any]] = None,
        max_turns: int = 5,
        user_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Multi-turn function-calling loop.

        Sends *messages* + *tools* to Azure OpenAI.  If the model returns
        ``tool_calls``, each call is executed via *tool_executor*, the
        results are appended as ``tool`` messages, and the model is called
        again.  This repeats until the model returns a plain text response
        or *max_turns* is reached.

        Returns
        -------
        dict
            {
              "response": str,            # final text answer
              "tool_calls_made": list,     # log of every tool invocation
            }
        """
        kwargs = tool_executor_kwargs or {}
        tool_calls_log: List[Dict[str, Any]] = []

        for turn in range(max_turns):
            try:
                completion = await self.async_client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    tools=tools,
                    tool_choice="auto",
                )
            except Exception as e:
                print(f"[TOOL-LOOP] Azure OpenAI error on turn {turn}: {e}")
                raise

            # Log token usage
            if user_id and completion.usage:
                await self._log_usage_async(
                    user_id=user_id,
                    operation_type="chat_tools",
                    prompt_tokens=completion.usage.prompt_tokens,
                    completion_tokens=completion.usage.completion_tokens,
                    total_tokens=completion.usage.total_tokens,
                    model=self.model,
                )

            choice = completion.choices[0]
            assistant_message = choice.message

            # ── Model wants to call one or more tools ───────────────────
            # If there are NO tool calls, it means the model is ready to give its final answer.
            if choice.finish_reason == "stop" or not assistant_message.tool_calls:
                
                # We already have the full text generated in `assistant_message.content`.
                # To support the streaming UI smoothly without making a redundant API call
                # (which doubles token cost and latency), we can yield to the client
                # token-by-token directly from backend.
                async def stream_generator():
                    full_text = assistant_message.content or ""
                    # Yield in small chunks
                    chunk_size = 3
                    import asyncio
                    for i in range(0, len(full_text), chunk_size):
                        chunk = full_text[i:i + chunk_size]
                        yield {"type": "text", "content": chunk}
                        await asyncio.sleep(0.01) # Small delay to pace the stream
                
                return {
                    "is_stream": True,
                    "stream_generator": stream_generator(),
                    "tool_calls_made": tool_calls_log,
                    "response": assistant_message.content or ""
                }

            # ── Model wants to call one or more tools ───────────────────
            # Append the assistant message (with tool_calls) to history
            messages.append(assistant_message)

            for tc in assistant_message.tool_calls:
                fn_name = tc.function.name
                try:
                    fn_args = json.loads(tc.function.arguments)
                except json.JSONDecodeError:
                    fn_args = {}

                print(f"[TOOL-LOOP] turn={turn}  tool={fn_name}  args={fn_args}")

                # Execute the tool
                result_str = await tool_executor(
                    tool_name=fn_name,
                    tool_args=fn_args,
                    **kwargs,
                )

                tool_calls_log.append({
                    "tool": fn_name,
                    "args": fn_args,
                    "result_preview": result_str[:200],
                })

                # Append tool result as a message
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": result_str,
                })

        # If we exhaust max_turns, return whatever the last message was
        return {
            "response": "I'm still processing your request. Could you try again?",
            "tool_calls_made": tool_calls_log,
        }

    def calculate_scholarship_eligibility(
        self,
        user_profile: Dict[str, Any],
        scholarship: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate eligibility for a scholarship based on user profile
        
        Args:
            user_profile: User's academic profile
            scholarship: Scholarship data
        
        Returns:
            Dict with eligibility_score, reasons, concerns, and missing_fields
        """
        prompt = f"""Analyze if this student is eligible for this scholarship.

Student Profile:
- Current Degree: {user_profile.get('current_degree', 'Not provided')}
- Field of Study: {user_profile.get('field_of_study', 'Not provided')}
- CGPA: {user_profile.get('cgpa', 'Not provided')}/{user_profile.get('gpa_scale', '4.0')}
- English Level: {user_profile.get('english_level', 'Not provided')}
- German Level: {user_profile.get('german_level', 'Not provided')}
- Desired Degree: {user_profile.get('desired_degree', 'Not provided')}
- Nationality: {user_profile.get('nationality', 'Not provided')}
- Needs Funding: {user_profile.get('needs_funding', 'Not provided')}

Scholarship:
- Title: {scholarship.get('title', 'N/A')}
- Eligibility Requirements: {scholarship.get('eligibility', 'N/A')}
- Duration: {scholarship.get('duration', 'N/A')}
- Value/Benefits: {scholarship.get('value_benefits', 'N/A')}
- Deadline: {scholarship.get('deadline', 'N/A')}

IMPORTANT:
1. Analyze the eligibility requirements carefully
2. If user profile is missing key information needed to determine eligibility, list those in missing_fields
3. Be generous with scoring if requirements are vague or "Not specified"

Return ONLY this JSON:
{{
  "eligibility_score": <number 0-100>,
  "reasons": ["why they match requirement 1", "why they match requirement 2"],
  "concerns": ["potential issue 1", "potential issue 2"],
  "missing_fields": ["field_name_1", "field_name_2"],
  "recommendation": "brief recommendation about applying"
}}

Valid missing_fields options: current_degree, field_of_study, cgpa, english_level, german_level, nationality, desired_degree"""

        try:
            messages = [
                {"role": "system", "content": "You are a scholarship eligibility advisor. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ]
            
            response = self.generate_response(messages, max_tokens=500, temperature=0.3)
            
            # Parse JSON response
            text = response.strip().replace('```json', '').replace('```', '').strip()
            json_start = text.find('{')
            json_end = text.rfind('}') + 1
            
            if json_start != -1 and json_end > json_start:
                result = json.loads(text[json_start:json_end])
                # Ensure all expected fields exist
                result.setdefault('eligibility_score', 50)
                result.setdefault('reasons', [])
                result.setdefault('concerns', [])
                result.setdefault('missing_fields', [])
                result.setdefault('recommendation', '')
                return result
            
            return {"eligibility_score": 50, "reasons": ["Unable to analyze"], "concerns": [], "missing_fields": [], "recommendation": ""}
            
        except Exception as e:
            print(f"Scholarship eligibility calculation error: {e}")
            return {"eligibility_score": 50, "reasons": ["Error in analysis"], "concerns": [], "missing_fields": [], "recommendation": ""}


    async def generate_sop(
        self,
        program_data: Dict[str, Any],
        user_data: Dict[str, Any],
        user_id: Optional[int] = None,
        template_type: str = "course",
        target_word_count: int = 750
    ) -> str:
        """
        Generate a personalized Statement of Purpose (SOP)
        
        Args:
            program_data: Details about the target program
            user_data: User's background and motivation
            user_id: User ID for token tracking (optional)
            template_type: "research", "course", or "daad"
            target_word_count: Target word count (400-1200)
        
        Returns:
            Generated SOP text
        """
        # Template-specific instructions
        template_instructions = {
            "research": """
SPECIFIC FOCUS (Research-Oriented SOP):
- Emphasize research interests, methodology, and academic contributions
- Discuss specific research questions or problems you want to address
- Highlight any publications, conference presentations, or research projects
- Connect your research interests with faculty members or labs at the target university
- Structure should prioritize: Research Background → Research Goals → Why This Lab/Program → Future Research Plans
""",
            "course": """
SPECIFIC FOCUS (Career-Oriented SOP):
- Emphasize practical skills, career goals, and industry relevance
- Connect academic learning to professional aspirations
- Highlight work experience, internships, and practical projects
- Discuss how the program will advance your career trajectory
- Structure should prioritize: Career Journey → Skills & Experience → Program Fit → Career Goals
""",
            "daad": """
SPECIFIC FOCUS (DAAD Scholarship Application):
- Follow DAAD's preferred structure strictly (Background, Motivation, Program Choice, Career Goals)
- Emphasize how studying in Germany will benefit your home country upon return
- Be specific about why Germany and why this particular program/university
- Include how you plan to contribute to international understanding
- Demonstrate research about the program and its unique features
- Keep it concise but comprehensive - DAAD values clarity and structure
"""
        }
        
        template_instruction = template_instructions.get(template_type, template_instructions["course"])
        
        prompt = f"""Write a highly personalized, compelling, and human-like Statement of Purpose (SOP) for an application to a German university.
        
TARGET PROGRAM:
- Program: {program_data.get('program_name', 'N/A')}
- University: {program_data.get('university_name', 'N/A')}
- Description: {str(program_data.get('description_content', ''))[:500]}...

APPLICANT PROFILE:
- Name: {user_data.get('full_name', 'The Applicant')}
- Academic Background: {user_data.get('academic_background', 'N/A')}
- Key Achievements: {user_data.get('key_achievements', 'N/A')}
- Future Goals: {user_data.get('future_goals', 'N/A')}
- Motivation (Why this program?): {user_data.get('why_this_program', 'N/A')}

{template_instruction}

GENERAL INSTRUCTIONS:
1. TONE: Professional yet passionate, authentic, and convincing. AVOID generic AI phrases.
2. STRUCTURE (Use Markdown Headings):
   - ## Introduction: Hook + succinct statement of intent.
   - ## Academic Background: Connect past studies/projects to the target program.
   - ## Professional Experience: Highlight relevant skills and achievements.
   - ## Why This Program: Specifically mention unique features of {program_data.get('university_name', 'N/A')}.
   - ## Future Goals: Clear career vision and how this degree is the bridge.
   - ## Conclusion: Confident closing.
3. CUSTOMIZATION: Use the specific "Motivation" provided by the user.
4. LENGTH: Approximately {target_word_count} words (+-10%). Must be well-structured.
5. FORMAT: Use clear paragraphs with Markdown headings.

IMPORTANT: Do not include placeholders like "[Insert Date]" or "[Signature]". Write it as a ready-to-use essay.
"""

        messages = [
            {"role": "system", "content": "You are an expert academic admissions consultant who writes world-class Statements of Purpose. Your writing is indistinguishable from a high-aptitude human applicant."},
            {"role": "user", "content": prompt}
        ]
        
        # Adjust max_tokens based on target word count
        max_tokens = min(3000, int(target_word_count * 2.5))
        
        return await self.generate_response_async(
            messages, 
            max_tokens=max_tokens, 
            temperature=0.7, 
            user_id=user_id,
            operation_type="generate_sop"
        )

    async def generate_cv(
        self,
        user_data: str,
        job_description: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> str:
        """
        Generate a professional CV based on user data and optional job description.
        
        Args:
            user_data: User's raw input or profile data
            job_description: Optional job description to tailor the CV for
            user_id: User ID for token tracking
            
        Returns:
            Generated CV content in Markdown format
        """
        prompt = f"""Create a professional, ATS-friendly CV (Curriculum Vitae) based on the following information.
        
USER INFORMATION:
{user_data}

{f"TARGET JOB DESCRIPTION: {job_description}" if job_description else ""}

INSTRUCTIONS:
1. Format the CV using clear Markdown headings (##) and bullet points.
2. Structure:
   - ## Evaluation (Briefly analyze the profile strength first)
   - ## Professional Summary
   - ## Skills
   - ## Experience (Focus on achievements)
   - ## Education
   - ## Projects (if applicable)
3. Tone: Professional, action-oriented, and concise.
4. If a job description is provided, tailor the keywords and summary to matches it.
5. If information is missing (e.g., dates), use placeholders or realistic estimates based on context, but prefer accuracy.
6. Make it look professional when rendered in Markdown.
"""

        messages = [
            {"role": "system", "content": "You are an expert career coach and professional resume writer."},
            {"role": "user", "content": prompt}
        ]
        
        return await self.generate_response_async(
            messages, 
            max_tokens=2000, 
            temperature=0.7, 
            user_id=user_id,
            operation_type="generate_cv"
        )
        
    # Singleton instance
_azure_openai_service: Optional[AzureOpenAIService] = None


def get_azure_openai_service() -> AzureOpenAIService:
    """Get or create Azure OpenAI service instance"""
    global _azure_openai_service
    if _azure_openai_service is None:
        _azure_openai_service = AzureOpenAIService()
    return _azure_openai_service
