"""
CV Generator - Academic CV Generator for European/German University Applications

Combined best practices from both implementations:
- Separate endpoints for upload, analyze (your approach - better REST design)
- Detailed feedback models with sections/priorities (my approach - richer data)
- pdfplumber for PDF parsing (my approach - better extraction)
- Support for user notes in refinement (your approach - better UX)
- Multi-template PDF generation support using reusable components

Usage:
    from app.routers.cv_generator import router
    app.include_router(router)
"""

import io
import json
import base64
from typing import Optional, List, Dict, Any, Tuple

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# PDF Generation
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, KeepTogether, HRFlowable, 
    Table, TableStyle, Image, Frame, PageTemplate, BaseDocTemplate, PageBreak, FrameBreak,
    KeepInFrame, NextPageTemplate
)

# PDF Reading - using pdfplumber (better text extraction than PyPDF2)
import pdfplumber

# DOCX Generation & Reading
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
try:
    from docx.oxml import OxmlElement
except ImportError:
    from docx.oxml.shared import OxmlElement

# Image Processing
from PIL import Image as PILImage, ImageDraw, ImageOps

# Import your existing Azure OpenAI service
from app.services.azure_openai import AzureOpenAIService, get_azure_openai_service
from app.auth import get_optional_current_user
from app.models.user import User


# =============================================================================
# PYDANTIC MODELS - CV Data
# =============================================================================

class PersonalInfo(BaseModel):
    full_name: str = ""
    email: str = ""
    phone: str = ""
    address: str = ""
    linkedin: str = ""
    github: str = ""
    nationality: str = ""
    date_of_birth: str = ""
    place_of_birth: str = ""  # Added for German standards
    photo_base64: Optional[str] = None  # Added for photo support


class Education(BaseModel):
    degree: str = ""
    institution: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    thesis_title: str = ""
    grade: str = ""
    description: str = ""


class Experience(BaseModel):
    position: str = ""
    organization: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    description: str = ""


class Publication(BaseModel):
    title: str = ""
    authors: str = ""
    journal_conference: str = ""
    year: str = ""
    doi: str = ""


class Award(BaseModel):
    title: str = ""
    issuer: str = ""
    year: str = ""
    description: str = ""


class Language(BaseModel):
    language: str = ""
    proficiency: str = ""


class CVFormatSettings(BaseModel):
    """User-controlled formatting options for PDF/DOCX export."""
    font_size: str = "medium"       # small, medium, large
    font_family: str = "serif"      # serif, sans-serif, modern
    accent_color: str = "#1a1a1a"   # hex color for section headings
    sidebar_color: str = "#2c3e50"  # hex color for the modern sidebar
    spacing: str = "normal"         # compact, normal, relaxed
    margins: str = "normal"         # narrow, normal, wide


class CustomSection(BaseModel):
    """A user-defined free-text section."""
    title: str = ""
    content: str = ""


class CVData(BaseModel):
    personal_info: PersonalInfo = Field(default_factory=PersonalInfo)
    profile_summary: str = ""
    education: List[Education] = Field(default_factory=list)
    research_experience: List[Experience] = Field(default_factory=list)
    work_experience: List[Experience] = Field(default_factory=list)
    publications: List[Publication] = Field(default_factory=list)
    awards: List[Award] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    languages: List[Language] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    references: str = ""
    template_id: str = "academic"  # classic, modern, academic
    format_settings: Optional[CVFormatSettings] = None
    custom_sections: List[CustomSection] = Field(default_factory=list)
    section_order: List[str] = Field(default_factory=list)  # ordered list of section keys


# =============================================================================
# PYDANTIC MODELS - Requests & Responses
# =============================================================================

class CVRequest(BaseModel):
    user_input: str
    job_description: Optional[str] = None
    target_program: Optional[str] = None
    target_university: Optional[str] = None
    template_type: Optional[str] = "academic"


class CVUpdateRequest(BaseModel):
    cv_data: CVData
    section_changed: Optional[str] = None
    user_notes: Optional[str] = None  # User's specific feedback/notes
    job_description: Optional[str] = None
    target_program: Optional[str] = None
    target_university: Optional[str] = None


class CVResponse(BaseModel):
    cv_data: CVData
    formatted_cv: str
    suggestions: Optional[List[str]] = None


class FileUploadResponse(BaseModel):
    """Response from file upload - returns extracted text for user to review."""
    filename: str
    content: str
    message: str


# =============================================================================
# PYDANTIC MODELS - Enhanced Feedback (Detailed structure)
# =============================================================================

class CVStrengthItem(BaseModel):
    """A specific strength in the CV."""
    section: str = Field(description="Which section this relates to (e.g., Education, Profile)")
    point: str = Field(description="The strength identified")
    explanation: str = Field(description="Why this is effective")


class CVImprovementItem(BaseModel):
    """An area that needs improvement."""
    section: str = Field(description="Which section this relates to")
    issue: str = Field(description="What the problem is")
    suggestion: str = Field(description="How to fix it")
    priority: str = Field(default="medium", description="high, medium, or low priority")


class CVMissingItem(BaseModel):
    """Something missing from the CV."""
    item: str = Field(description="What's missing")
    importance: str = Field(description="required, recommended, or optional")
    reason: str = Field(description="Why this should be added")


class CVFeedback(BaseModel):
    """Comprehensive CV feedback with detailed breakdown."""
    overall_score: int = Field(default=0, ge=0, le=100, description="Overall quality score")
    summary: str = Field(default="", description="Brief overall assessment")
    strengths: List[CVStrengthItem] = Field(default_factory=list)
    improvements: List[CVImprovementItem] = Field(default_factory=list)
    missing_items: List[CVMissingItem] = Field(default_factory=list)
    alignment_score: Optional[int] = Field(None, ge=0, le=100, description="How well CV matches target program")


class CVFeedbackRequest(BaseModel):
    """Request for CV analysis."""
    cv_data: CVData
    user_questions: Optional[str] = None  # Specific questions user wants answered
    job_description: Optional[str] = None
    target_program: Optional[str] = None
    target_university: Optional[str] = None


class CVFeedbackResponse(BaseModel):
    """Response containing detailed CV feedback."""
    feedback: CVFeedback
    quick_tips: List[str] = Field(default_factory=list, description="3-5 actionable tips")


# =============================================================================
# AI PROMPTS
# =============================================================================

CV_SYSTEM_PROMPT = """You are an expert academic career advisor specializing in European university applications, particularly for German institutions.

Your role is to create professional, human-written academic CVs (Lebenslauf/Curriculum Vitae) that follow European academic conventions.

KEY PRINCIPLES FOR ACADEMIC CVs (Europe/Germany):

1. STRUCTURE (in order of importance for academics):
   - Personal Information (name, contact, nationality if relevant, Place of Birth for German CVs)
   - Profile/Objective (2-3 sentences, not generic)
   - Education (most recent first, include thesis titles)
   - Research Experience (if applicable)
   - Work Experience (relevant positions only)
   - Publications/Conferences (if any)
   - Skills (technical and soft skills)
   - Languages (with proficiency levels: Native, Fluent, Intermediate, Basic)
   - Awards/Scholarships (if any)
   - References (optional, "Available upon request" is acceptable)

2. WRITING STYLE - CRITICAL:
   - Write naturally, as a human would - avoid robotic or templated language
   - DO NOT use excessive numbers, percentages, or metrics
   - Focus on qualitative descriptions of responsibilities and achievements
   - Use active voice but avoid starting every bullet with action verbs
   - Vary sentence structure - mix short and longer descriptions
   - Be specific but not overly quantified
   - Sound professional but personable

3. FORMATTING RULES:
   - Keep to 1-2 pages maximum (unless extensive publication record)
   - Use consistent date format: "Month Year - Month Year" or "MM/YYYY - MM/YYYY"
   - Education section should include: degree, institution, location, dates, thesis/focus
   - For German applications, including nationality, date of birth, and place of birth is common

4. WHAT TO AVOID:
   - Generic buzzwords without substance
   - Excessive bullet points (use paragraphs where appropriate)
   - Inflated claims or exaggerations
   - Too many numbers and statistics
   - Repetitive sentence structures
   - Obviously AI-generated phrasing

5. TAILORING:
   - If a target program is mentioned, subtly align the profile summary
   - Emphasize relevant coursework and research for the target field
   - Keep it honest - don't fabricate or over-embellish"""


CV_GENERATION_PROMPT = """Based on the following information, create a professional academic CV suitable for European/German university applications.

USER'S INFORMATION:
{user_input}

{target_info}

INSTRUCTIONS:
1. Extract and organize all relevant information from the user's input
2. Fill in the structured CV format below.
3. Write descriptions that sound natural and human-written
4. DO NOT make up information that isn't provided or reasonably inferred
5. If dates are missing, use reasonable placeholders like "2020 - Present"
6. Focus on academic relevance for university applications
7. Keep descriptions concise but meaningful
8. Avoid excessive use of numbers and statistics
9. Include "place_of_birth" if inferred from context (e.g. "Born in Munich"), otherwise leave blank.
10. **STRICTLY FORBIDDEN**: Do NOT add any languages, skills, or personal details that are not explicitly mentioned in the input. If the user does not state they know a language (e.g., Urdu, German), DO NOT include it.
11. **STRICTLY FORBIDDEN**: Do NOT invent address, phone number, or specific dates if not provided. Use placeholders like "[City, Country]" only if absolutely necessary for formatting.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):

{{
    "personal_info": {{
        "full_name": "",
        "email": "",
        "phone": "",
        "address": "",
        "linkedin": "",
        "nationality": "",
        "date_of_birth": "",
        "place_of_birth": ""
    }},
    "profile_summary": "2-3 sentences describing academic interests and goals",
    "education": [
        {{
            "degree": "Degree Name",
            "institution": "University Name",
            "location": "City, Country",
            "start_date": "Month Year",
            "end_date": "Month Year or Present",
            "thesis_title": "If applicable",
            "grade": "If provided",
            "relevant_coursework": "Key courses relevant to target program"
        }}
    ],
    "research_experience": [
        {{
            "position": "Research Position",
            "organization": "Organization Name",
            "location": "City, Country",
            "start_date": "Month Year",
            "end_date": "Month Year",
            "description": "Natural description of responsibilities and contributions"
        }}
    ],
    "work_experience": [
        {{
            "position": "Position Title",
            "organization": "Company/Organization",
            "location": "City, Country",
            "start_date": "Month Year",
            "end_date": "Month Year",
            "description": "Brief, natural description without excessive metrics"
        }}
    ],
    "publications": [
        {{
            "title": "Publication Title",
            "authors": "Author names",
            "journal_conference": "Journal or Conference Name",
            "year": "Year",
            "doi": "DOI if available"
        }}
    ],
    "awards": [
        {{
            "title": "Award Name",
            "issuer": "Issuing Organization",
            "year": "Year",
            "description": "Brief description if needed"
        }}
    ],
    "skills": ["Skill 1", "Skill 2", "Skill 3"],
    "languages": [
        {{
            "language": "Language Name",
            "proficiency": "Native/Fluent/Intermediate/Basic"
        }}
    ],
    "certifications": ["Certification 1", "Certification 2"],
    "references": "Available upon request"
}}

Important: Return ONLY the JSON object, no additional text or markdown formatting."""


CV_REFINEMENT_PROMPT = """The user has made changes to their CV and provided feedback. Please review and improve the CV while maintaining consistency.

CURRENT CV DATA:
{cv_data}

SECTION THAT WAS CHANGED: {section_changed}

USER'S NOTES/FEEDBACK: {user_notes}

{target_info}

INSTRUCTIONS:
1. Update ONLY the fields that need changing based on the user's notes or the section specified.
2. Keep the rest of the CV consistent.
3. Improve phrasing to be more academic and professional.
4. **STRICTLY FORBIDDEN**: Do NOT add any languages, skills, or personal details that are not explicitly mentioned in the user notes or original CV data.
5. **STRICTLY FORBIDDEN**: Do NOT invent new experiences or qualifications.
6. Ensure the language sounds natural and human-written.
7. Check for consistency with other sections.
8. Maintain the European/German academic CV format.
9. If the user mentions Place of Birth, ensure it's added to personal_info.

Return the updated CV data as a valid JSON object with the same structure, plus a "suggestions" array with 2-3 improvement tips.

Return ONLY valid JSON, no markdown or additional text."""


CV_ANALYSIS_PROMPT = """Analyze the following academic CV and provide detailed, constructive feedback for European/German university applications.

CV DATA:
{cv_data}

{target_info}

{user_questions}

Provide a thorough analysis with:

1. STRENGTHS (3-5 items): What makes this CV effective
2. IMPROVEMENTS NEEDED (3-5 items): What needs work, with priority levels
3. MISSING ITEMS: What should be added for academic applications (e.g., Place of Birth, Photo if missing and relevant)
4. OVERALL SCORE (0-100): Based on academic CV standards
5. ALIGNMENT SCORE (0-100, if target program provided): How well it matches the target

Return ONLY a valid JSON object with this structure:
{{
    "overall_score": 75,
    "alignment_score": 80,
    "summary": "Brief 2-3 sentence overall assessment",
    "strengths": [
        {{
            "section": "Education",
            "point": "Strong academic progression",
            "explanation": "Clear path from Bachelor's to Master's with relevant focus"
        }}
    ],
    "improvements": [
        {{
            "section": "Profile Summary",
            "issue": "Too generic",
            "suggestion": "Add specific research interests and career goals",
            "priority": "high"
        }}
    ],
    "missing_items": [
        {{
            "item": "Place of Birth",
            "importance": "required",
            "reason": "Standard for German biographical data"
        }}
    ],
    "quick_tips": [
        "Add your GPA if it's above 3.0",
        "Include thesis title in education section"
    ]
}}

Important: Return ONLY the JSON object, no additional text or markdown formatting."""


# =============================================================================
# FILE PARSING UTILITIES
# =============================================================================

def parse_pdf_content(file_content: bytes) -> str:
    """Extract text content from a PDF file using pdfplumber (better quality)."""
    text_parts = []
    
    with io.BytesIO(file_content) as pdf_buffer:
        with pdfplumber.open(pdf_buffer) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
    
    return "\n\n".join(text_parts)


def parse_docx_content(file_content: bytes) -> str:
    """Extract text content from a DOCX file."""
    text_parts = []
    
    with io.BytesIO(file_content) as docx_buffer:
        doc = Document(docx_buffer)
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_parts.append(paragraph.text)
        
        # Also extract from tables
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_text:
                    text_parts.append(" | ".join(row_text))
    
    return "\n".join(text_parts)


# =============================================================================
# CV GENERATION SERVICE
# =============================================================================

def build_target_info(
    job_description: Optional[str] = None, 
    target_program: Optional[str] = None, 
    target_university: Optional[str] = None
) -> str:
    """Build the target information string for the prompt."""
    parts = []
    if target_program:
        parts.append(f"TARGET PROGRAM: {target_program}")
    if target_university:
        parts.append(f"TARGET UNIVERSITY: {target_university}")
    if job_description:
        parts.append(f"ADDITIONAL CONTEXT/JOB DESCRIPTION:\n{job_description}")
    return "\n".join(parts) if parts else "No specific target program provided."


def format_cv_text(cv_data: CVData) -> str:
    """Format CV data as plain text for preview."""
    lines = []
    pi = cv_data.personal_info
    
    if pi.full_name:
        lines.append(pi.full_name.upper())
        lines.append("")
    
    contact_parts = [p for p in [pi.email, pi.phone, pi.address] if p]
    if contact_parts:
        lines.append(" | ".join(contact_parts))
    if pi.linkedin:
        lines.append(pi.linkedin)
    
    extra_parts = []
    if pi.nationality:
        extra_parts.append(f"Nationality: {pi.nationality}")
    if pi.date_of_birth:
        extra_parts.append(f"Date of Birth: {pi.date_of_birth}")
    if pi.place_of_birth:
        extra_parts.append(f"Place of Birth: {pi.place_of_birth}")
    if extra_parts:
        lines.append(" | ".join(extra_parts))
    lines.append("")
    
    if cv_data.profile_summary:
        lines.extend(["PROFILE", "-" * 50, cv_data.profile_summary, ""])
    
    if cv_data.education:
        lines.extend(["EDUCATION", "-" * 50])
        for edu in cv_data.education:
            lines.append(f"{edu.degree}")
            lines.append(f"{edu.institution}, {edu.location}")
            lines.append(f"{edu.start_date} - {edu.end_date}")
            if edu.thesis_title:
                lines.append(f"Thesis: {edu.thesis_title}")
            if edu.grade:
                lines.append(f"Grade: {edu.grade}")
            if edu.description:
                lines.append(edu.description)
            lines.append("")
    
    if cv_data.research_experience:
        lines.extend(["RESEARCH EXPERIENCE", "-" * 50])
        for exp in cv_data.research_experience:
            lines.append(f"{exp.position}")
            lines.append(f"{exp.organization}, {exp.location}")
            lines.append(f"{exp.start_date} - {exp.end_date}")
            if exp.description:
                lines.append(exp.description)
            lines.append("")
    
    if cv_data.work_experience:
        lines.extend(["WORK EXPERIENCE", "-" * 50])
        for exp in cv_data.work_experience:
            lines.append(f"{exp.position}")
            lines.append(f"{exp.organization}, {exp.location}")
            lines.append(f"{exp.start_date} - {exp.end_date}")
            if exp.description:
                lines.append(exp.description)
            lines.append("")
    
    if cv_data.publications:
        lines.extend(["PUBLICATIONS", "-" * 50])
        for pub in cv_data.publications:
            pub_line = f"{pub.authors} ({pub.year}). {pub.title}. {pub.journal_conference}."
            if pub.doi:
                pub_line += f" DOI: {pub.doi}"
            lines.extend([pub_line, ""])
    
    if cv_data.awards:
        lines.extend(["AWARDS & SCHOLARSHIPS", "-" * 50])
        for award in cv_data.awards:
            lines.append(f"{award.title} - {award.issuer} ({award.year})")
            if award.description:
                lines.append(award.description)
            lines.append("")
    
    if cv_data.skills:
        lines.extend(["SKILLS", "-" * 50, ", ".join(cv_data.skills), ""])
    
    if cv_data.languages:
        lines.extend(["LANGUAGES", "-" * 50])
        lines.append(", ".join([f"{l.language} ({l.proficiency})" for l in cv_data.languages]))
        lines.append("")
    
    if cv_data.certifications:
        lines.extend(["CERTIFICATIONS", "-" * 50])
        lines.extend([f"• {cert}" for cert in cv_data.certifications])
        lines.append("")
    
    if cv_data.references:
        lines.extend(["REFERENCES", "-" * 50, cv_data.references])
    
    return "\n".join(lines)


def clean_json_response(response: str) -> str:
    """Clean AI response to extract JSON."""
    clean = response.strip()
    if clean.startswith("```"):
        clean = clean.split("```")[1]
        if clean.startswith("json"):
            clean = clean[4:]
    return clean.strip()


async def generate_cv_content(
    ai_service: AzureOpenAIService,
    user_input: str,
    job_description: Optional[str] = None,
    target_program: Optional[str] = None,
    target_university: Optional[str] = None,
    user_id: Optional[int] = None
) -> CVResponse:
    """Generate a structured academic CV from user input."""
    target_info = build_target_info(job_description, target_program, target_university)
    
    prompt = CV_GENERATION_PROMPT.format(user_input=user_input, target_info=target_info)
    messages = [
        {"role": "system", "content": CV_SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]
    
    response = await ai_service.generate_response_async(
        messages, max_tokens=3000, temperature=0.6,
        user_id=user_id, operation_type="generate_cv"
    )
    
    try:
        clean_response = clean_json_response(response)
        cv_data = CVData(**json.loads(clean_response))
    except (json.JSONDecodeError, Exception) as e:
        cv_data = CVData()
        cv_data.profile_summary = f"Error parsing CV data: {str(e)}"
    
    return CVResponse(cv_data=cv_data, formatted_cv=format_cv_text(cv_data), suggestions=None)


async def refine_cv_content(
    ai_service: AzureOpenAIService,
    cv_data: CVData,
    section_changed: Optional[str] = None,
    user_notes: Optional[str] = None,
    job_description: Optional[str] = None,
    target_program: Optional[str] = None,
    target_university: Optional[str] = None,
    user_id: Optional[int] = None
) -> CVResponse:
    """Refine an existing CV after user modifications, with optional user notes."""
    target_info = build_target_info(job_description, target_program, target_university)
    
    print(f"DEBUG: refine_cv_content called. Photo present in input: {bool(cv_data.personal_info.photo_base64)}")
    if cv_data.personal_info.photo_base64:
        print(f"DEBUG: Input photo length: {len(cv_data.personal_info.photo_base64)}")
        
    # Create a copy of CV data for the prompt to exclude the large base64 image
    cv_dict = cv_data.model_dump()
    if cv_dict.get("personal_info", {}).get("photo_base64"):
        cv_dict["personal_info"]["photo_base64"] = "[PHOTO_DATA_HIDDEN_FOR_OPTIMIZATION]"
    
    prompt = CV_REFINEMENT_PROMPT.format(
        cv_data=json.dumps(cv_dict, indent=2),
        section_changed=section_changed or "multiple sections",
        user_notes=user_notes or "No specific notes provided.",
        target_info=target_info
    )
    messages = [
        {"role": "system", "content": CV_SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]
    
    response = await ai_service.generate_response_async(
        messages, max_tokens=3000, temperature=0.5,
        user_id=user_id, operation_type="refine_cv"
    )
    
    try:
        clean_response = clean_json_response(response)
        result_dict = json.loads(clean_response)
        suggestions = result_dict.pop("suggestions", None)
        refined_cv_data = CVData(**result_dict)
        
        # Always restore the original photo if it existed, as AI doesn't process it
        # This handles cases where AI returns None, empty string, or the placeholder string
        if cv_data.personal_info.photo_base64:
            print("DEBUG: Restoring original photo to refined data")
            refined_cv_data.personal_info.photo_base64 = cv_data.personal_info.photo_base64
            
    except (json.JSONDecodeError, Exception) as e:
        print(f"DEBUG: Error in refinement parsing: {e}")
        refined_cv_data = cv_data
        suggestions = ["Could not process refinement. Please try again."]
    
    print(f"DEBUG: Returning from refine_cv_content. Photo present in output: {bool(refined_cv_data.personal_info.photo_base64)}")
    return CVResponse(cv_data=refined_cv_data, formatted_cv=format_cv_text(refined_cv_data), suggestions=suggestions)


async def analyze_cv_content(
    ai_service: AzureOpenAIService,
    cv_data: CVData,
    user_questions: Optional[str] = None,
    job_description: Optional[str] = None,
    target_program: Optional[str] = None,
    target_university: Optional[str] = None,
    user_id: Optional[int] = None
) -> CVFeedbackResponse:
    """Analyze a CV and provide detailed feedback."""
    target_info = build_target_info(job_description, target_program, target_university)
    
    user_questions_section = ""
    if user_questions:
        user_questions_section = f"USER'S SPECIFIC QUESTIONS:\n{user_questions}"
    
    # Create a copy of CV data for the prompt to exclude the large base64 image
    cv_dict = cv_data.model_dump()
    if cv_dict.get("personal_info", {}).get("photo_base64"):
        cv_dict["personal_info"]["photo_base64"] = "[PHOTO_DATA_HIDDEN_FOR_OPTIMIZATION]"

    prompt = CV_ANALYSIS_PROMPT.format(
        cv_data=json.dumps(cv_dict, indent=2),
        target_info=target_info,
        user_questions=user_questions_section
    )
    messages = [
        {"role": "system", "content": CV_SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]
    
    response = await ai_service.generate_response_async(
        messages, max_tokens=2000, temperature=0.5,
        user_id=user_id, operation_type="analyze_cv"
    )
    
    try:
        clean_response = clean_json_response(response)
        result_dict = json.loads(clean_response)
        
        # Extract quick_tips before creating feedback
        quick_tips = result_dict.pop("quick_tips", [])
        
        # Parse nested structures
        strengths = [CVStrengthItem(**s) for s in result_dict.get("strengths", [])]
        improvements = [CVImprovementItem(**i) for i in result_dict.get("improvements", [])]
        missing_items = [CVMissingItem(**m) for m in result_dict.get("missing_items", [])]
        
        feedback = CVFeedback(
            overall_score=result_dict.get("overall_score", 0),
            alignment_score=result_dict.get("alignment_score"),
            summary=result_dict.get("summary", ""),
            strengths=strengths,
            improvements=improvements,
            missing_items=missing_items
        )
    except (json.JSONDecodeError, Exception) as e:
        feedback = CVFeedback(
            overall_score=50,
            summary=f"Unable to analyze CV: {str(e)}",
            strengths=[],
            improvements=[],
            missing_items=[]
        )
        quick_tips = ["Please try again or ensure all CV sections are filled in."]
    
    return CVFeedbackResponse(feedback=feedback, quick_tips=quick_tips)


# =============================================================================
# DOCUMENT GENERATION (PDF) - MULTI-TEMPLATE SUPPORT
# =============================================================================

def process_base64_image(base64_string: str, circular: bool = True) -> Optional[io.BytesIO]:
    """Convert base64 string to a BytesIO object for ReportLab/Docx.
    Options:
        circular (bool): If True, crops the image to a circle with transparent background.
    """
    try:
        if not base64_string:
            return None
        
        # Strip header if present (e.g., "data:image/jpeg;base64,")
        if "base64," in base64_string:
            base64_string = base64_string.split("base64,")[1]
            
        image_data = base64.b64decode(base64_string)
        
        if not circular:
            return io.BytesIO(image_data)
        
        # Process image with PIL to make it circular
        with PILImage.open(io.BytesIO(image_data)) as img:
            # Convert to RGBA for transparency support
            img = img.convert("RGBA")
            
            # Create a circular mask
            size = (min(img.size), min(img.size))
            mask = PILImage.new('L', size, 0)
            draw = ImageDraw.Draw(mask)
            draw.ellipse((0, 0) + size, fill=255)
            
            # Crop image to square first (center crop)
            output = ImageOps.fit(img, size, centering=(0.5, 0.5))
            
            # Apply mask
            output.putalpha(mask)
            
            # Save to buffer
            output_buffer = io.BytesIO()
            output.save(output_buffer, format="PNG")
            output_buffer.seek(0)
            return output_buffer
            
    except Exception as e:
        print(f"Image processing error: {e}")
        return None

def get_contrast_color(hex_color: str) -> str:
    """Return dark (#1a1a1a) or light (#ffffff) text color depending on background brightness."""
    h = hex_color.lstrip('#')
    if len(h) != 6: return '#ffffff'
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    brightness = (r * 299 + g * 587 + b * 114) / 1000
    return '#1a1a1a' if brightness > 128 else '#ffffff'

def create_base_styles(format_settings: Optional[CVFormatSettings] = None) -> dict:
    """Create shared paragraph styles, dynamically adjusted by format_settings."""
    fs = format_settings or CVFormatSettings()

    # --- Font family mapping (ReportLab built-in fonts) ---
    font_map = {
        "serif":      {"regular": "Times-Roman", "bold": "Times-Bold", "italic": "Times-Italic"},
        "sans-serif": {"regular": "Helvetica",   "bold": "Helvetica-Bold", "italic": "Helvetica-Oblique"},
        "modern":     {"regular": "Helvetica",   "bold": "Helvetica-Bold", "italic": "Helvetica-Oblique"},
    }
    fm = font_map.get(fs.font_family, font_map["serif"])

    # --- Font size scale ---
    size_scale = {"small": 0.85, "medium": 1.0, "large": 1.15}
    sc = size_scale.get(fs.font_size, 1.0)

    # --- Spacing multiplier ---
    spacing_mult = {"compact": 0.75, "normal": 1.0, "relaxed": 1.35}
    sp = spacing_mult.get(fs.spacing, 1.0)

    # --- Accent color ---
    accent = HexColor(fs.accent_color) if fs.accent_color else HexColor('#1a1a1a')

    # Helper to round sizes
    def sz(base: float) -> float:
        return round(base * sc, 1)

    def lead(base: float) -> float:
        return round(base * sc * sp, 1)

    def space(base: float) -> float:
        return round(base * sp, 1)

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        'CVName', fontName=fm["bold"], fontSize=sz(18),
        alignment=TA_CENTER, spaceAfter=space(4), textColor=HexColor('#1a1a1a'), leading=lead(22)
    ))
    styles.add(ParagraphStyle(
        'CVContact', fontName=fm["regular"], fontSize=sz(10),
        alignment=TA_CENTER, spaceAfter=space(3), textColor=HexColor('#333333'), leading=lead(14)
    ))
    styles.add(ParagraphStyle(
        'CVSectionHeading', fontName=fm["bold"], fontSize=sz(11),
        spaceBefore=space(12), spaceAfter=space(6), textColor=accent, leading=lead(14),
        upperCase=True
    ))
    styles.add(ParagraphStyle(
        'CVEntryTitle', fontName=fm["bold"], fontSize=sz(10),
        spaceBefore=space(6), spaceAfter=space(1), textColor=HexColor('#1a1a1a'), leading=lead(13)
    ))
    styles.add(ParagraphStyle(
        'CVEntrySubtitle', fontName=fm["italic"], fontSize=sz(10),
        spaceAfter=space(2), textColor=HexColor('#444444'), leading=lead(13)
    ))
    styles.add(ParagraphStyle(
        'CVBody', fontName=fm["regular"], fontSize=sz(10),
        spaceAfter=space(4), alignment=TA_JUSTIFY, leading=lead(13), textColor=HexColor('#333333')
    ))
    # Modern specific styles (always Helvetica-family for visual consistency)
    modern_fm = font_map.get("sans-serif")
    styles.add(ParagraphStyle(
        'ModernName', fontName=modern_fm["bold"], fontSize=sz(22),
        alignment=TA_CENTER, spaceAfter=space(6), textColor=HexColor('#2c3e50'), leading=lead(26)
    ))
    styles.add(ParagraphStyle(
        'ModernSection', fontName=modern_fm["bold"], fontSize=sz(12),
        spaceBefore=space(14), spaceAfter=space(8), textColor=accent, leading=lead(15),
        upperCase=True
    ))
    styles.add(ParagraphStyle(
        'ModernBody', fontName=modern_fm["regular"], fontSize=sz(9),
        spaceAfter=space(4), alignment=TA_LEFT, leading=lead(12), textColor=HexColor('#34495e')
    ))
    # Calculate contrast color for sidebar
    sidebar_bg = fs.sidebar_color if hasattr(fs, 'sidebar_color') else '#2c3e50'
    sidebar_text = get_contrast_color(sidebar_bg)
    sidebar_sub_text = '#333333' if sidebar_text == '#1a1a1a' else '#ecf0f1'

    styles.add(ParagraphStyle(
        'SidebarHeader', fontName=modern_fm["bold"], fontSize=sz(10),
        spaceBefore=space(10), spaceAfter=space(4), textColor=HexColor(sidebar_text), leading=lead(12), wordWrap='CJK'
    ))
    styles.add(ParagraphStyle(
        'SidebarBody', fontName=modern_fm["regular"], fontSize=sz(9),
        leading=lead(13), textColor=HexColor(sidebar_sub_text), spaceAfter=space(6), wordWrap='CJK'
    ))
    
    return styles

def clean_for_pdf(text: str) -> str:
    """Sanitize text for ReportLab to avoid black squares/encoding issues."""
    if not text:
        return ""
    
    replacements = {
        # Dashes (Common sources of encoding errors)
        "\u2010": "-", "\u2011": "-", "\u2012": "-", "\u2013": "-", "\u2014": "-", 
        "\u2015": "-", "\u2212": "-", "\u00AD": "-", "\u002D": "-",
        
        # Quotes (Smart quotes to safe ASCII)
        "\u2018": "'", "\u2019": "'", "\u201A": "'", "\u201B": "'", "`": "'",
        "\u201C": '"', "\u201D": '"', "\u201E": '"', "\u201F": '"',
        
        # Bullets & Misc
        "\u2022": "-", "\u2023": "-", "\u2043": "-", "\u25E6": "-",
        "\u2026": "...", "\u00A0": " ", "\t": " "
    }
    
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
        
    # Final safety: encode to Latin-1 (which ReportLab supports), ignoring errors
    # This strips any remaining exotic characters that would cause black squares
    # valid German Umlauts (ä, ö, ü, ß) are preserved in Latin-1
    try:
        text.encode('latin-1')
    except UnicodeEncodeError:
        text = text.encode('latin-1', 'ignore').decode('latin-1')
        
    return text

def generate_pdf(cv_data: CVData) -> bytes:
    """Generate PDF based on selected template."""
    template_id = cv_data.template_id.lower() if cv_data.template_id else "academic"
    
    if template_id == "modern":
        return generate_modern_pdf(cv_data)
    else: 
        # Default to academic/classic
        return generate_academic_pdf(cv_data)


def _get_margin_cm(margins_setting: str) -> float:
    """Return page margin in cm based on setting name."""
    return {"narrow": 1.5, "normal": 2.0, "wide": 2.5}.get(margins_setting, 2.0)


def generate_academic_pdf(cv_data: CVData) -> bytes:
    """Standard Academic/Classic Layout (Single Column)."""
    buffer = io.BytesIO()
    fs = cv_data.format_settings or CVFormatSettings()
    margin_cm = _get_margin_cm(fs.margins)
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=margin_cm*cm, leftMargin=margin_cm*cm, topMargin=1.5*cm, bottomMargin=1.5*cm,
        title=f"CV - {cv_data.personal_info.full_name}" if cv_data.personal_info.full_name else "CV"
    )
    
    styles = create_base_styles(fs)
    story = []
    pi = cv_data.personal_info
    
    # Determine accent color for HR rule
    accent_hex = fs.accent_color if fs.accent_color else '#333333'
    
    # --- Header with optional Photo ---
    photo_stream = process_base64_image(pi.photo_base64, circular=True)
    
    name_para = Paragraph(pi.full_name.upper(), styles['CVName'])
    
    contact_parts = [p for p in [pi.email, pi.phone, pi.address] if p]
    contact_para = Paragraph(' | '.join(contact_parts), styles['CVContact'])
    
    links = []
    if pi.linkedin: links.append(f'<link href="{pi.linkedin}" color="blue">LinkedIn</link>')
    if pi.github: links.append(f'<link href="{pi.github}" color="blue">GitHub</link>')
    links_para = Paragraph(' | '.join(links), styles['CVContact']) if links else None
    
    extra_parts = []
    if pi.nationality: extra_parts.append(f"Nationality: {pi.nationality}")
    if pi.date_of_birth: extra_parts.append(f"Born: {pi.date_of_birth}")
    if pi.place_of_birth: extra_parts.append(f"in {pi.place_of_birth}")
    bio_para = Paragraph(' | '.join(extra_parts), styles['CVContact']) if extra_parts else None

    if photo_stream:
        img = Image(photo_stream)
        img.drawHeight = 3.5*cm
        img.drawWidth = 3.5*cm * (img.imageWidth / img.imageHeight) if img.imageHeight > 0 else 3.5*cm
        
        header_text = [name_para, contact_para]
        if links_para: header_text.append(links_para)
        if bio_para: header_text.append(bio_para)
        
        header_table = Table([[header_text, img]], colWidths=[12*cm, 4*cm])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(header_table)
    else:
        header_text = [name_para, contact_para]
        if links_para: header_text.append(links_para)
        if bio_para: header_text.append(bio_para)
        story.extend(header_text)
    
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=1, color=HexColor(accent_hex)))
    story.append(Spacer(1, 20))
    
    # --- Section rendering helpers ---
    def _render_profile():
        if cv_data.profile_summary:
            story.append(Paragraph("PROFILE", styles['CVSectionHeading']))
            story.append(Paragraph(clean_for_pdf(cv_data.profile_summary), styles['CVBody']))

    def _render_education():
        if cv_data.education:
            story.append(Paragraph("EDUCATION", styles['CVSectionHeading']))
            for edu in cv_data.education:
                story.append(Paragraph(clean_for_pdf(f"{edu.degree}"), styles['CVEntryTitle']))
                story.append(Paragraph(clean_for_pdf(f"{edu.institution}, {edu.location}"), styles['CVEntrySubtitle']))
                details = [clean_for_pdf(f"{edu.start_date} - {edu.end_date}")]
                if edu.thesis_title: details.append(clean_for_pdf(f"Thesis: {edu.thesis_title}"))
                if edu.grade: details.append(clean_for_pdf(f"Grade: {edu.grade}"))
                if edu.description: details.append(clean_for_pdf(edu.description))
                for detail in details:
                    story.append(Paragraph(detail, styles['CVBody']))
                story.append(Spacer(1, 8))

    def _render_research():
        if cv_data.research_experience:
            story.append(Paragraph("RESEARCH EXPERIENCE", styles['CVSectionHeading']))
            for exp in cv_data.research_experience:
                story.append(Paragraph(clean_for_pdf(f"{exp.position}"), styles['CVEntryTitle']))
                story.append(Paragraph(clean_for_pdf(f"{exp.organization}, {exp.location}"), styles['CVEntrySubtitle']))
                story.append(Paragraph(clean_for_pdf(f"{exp.start_date} - {exp.end_date}"), styles['CVBody']))
                if exp.description:
                    story.append(Paragraph(clean_for_pdf(exp.description), styles['CVBody']))
                story.append(Spacer(1, 8))
    
    def _render_work():
        if cv_data.work_experience:
            story.append(Paragraph("WORK EXPERIENCE", styles['CVSectionHeading']))
            for exp in cv_data.work_experience:
                story.append(Paragraph(clean_for_pdf(f"{exp.position}"), styles['CVEntryTitle']))
                story.append(Paragraph(clean_for_pdf(f"{exp.organization}, {exp.location}"), styles['CVEntrySubtitle']))
                story.append(Paragraph(clean_for_pdf(f"{exp.start_date} - {exp.end_date}"), styles['CVBody']))
                if exp.description:
                    story.append(Paragraph(clean_for_pdf(exp.description), styles['CVBody']))
                story.append(Spacer(1, 8))
            
    def _render_publications():
        if cv_data.publications:
            story.append(Paragraph("PUBLICATIONS", styles['CVSectionHeading']))
            for pub in cv_data.publications:
                text = f"{pub.authors} ({pub.year}). <i>{pub.title}</i>. {pub.journal_conference}."
                if pub.doi: text += f" DOI: {pub.doi}"
                story.append(Paragraph(clean_for_pdf(text), styles['CVBody']))
                story.append(Spacer(1, 4))

    def _render_skills():
        if cv_data.skills or cv_data.languages:
            story.append(Paragraph("SKILLS & LANGUAGES", styles['CVSectionHeading']))
            if cv_data.skills:
                 story.append(Paragraph(f"<b>Skills:</b> {', '.join(cv_data.skills)}", styles['CVBody']))
            if cv_data.languages:
                 langs = ", ".join([f"{l.language} ({l.proficiency})" for l in cv_data.languages])
                 story.append(Paragraph(f"<b>Languages:</b> {langs}", styles['CVBody']))

    def _render_awards():
        if cv_data.awards:
            story.append(Paragraph("AWARDS", styles['CVSectionHeading']))
            for award in cv_data.awards:
                story.append(Paragraph(clean_for_pdf(f"<b>{award.title}</b> – {award.issuer} ({award.year})"), styles['CVBody']))
                if award.description:
                    story.append(Paragraph(clean_for_pdf(award.description), styles['CVBody']))

    def _render_certifications():
        if cv_data.certifications:
            story.append(Paragraph("CERTIFICATIONS", styles['CVSectionHeading']))
            for cert in cv_data.certifications:
                story.append(Paragraph(clean_for_pdf(f"- {cert}"), styles['CVBody']))

    def _render_references():
        if cv_data.references:
            story.append(Paragraph("REFERENCES", styles['CVSectionHeading']))
            story.append(Paragraph(clean_for_pdf(cv_data.references), styles['CVBody']))

    def _render_custom_sections():
        for cs in cv_data.custom_sections:
            if cs.title and cs.content:
                story.append(Paragraph(clean_for_pdf(cs.title.upper()), styles['CVSectionHeading']))
                story.append(Paragraph(clean_for_pdf(cs.content), styles['CVBody']))

    # --- Render sections in order ---
    section_renderers = {
        'profile': _render_profile,
        'education': _render_education,
        'research': _render_research,
        'work': _render_work,
        'publications': _render_publications,
        'skills': _render_skills,
        'awards': _render_awards,
        'certifications': _render_certifications,
        'references': _render_references,
        'custom': _render_custom_sections,
    }

    default_order = ['profile', 'education', 'research', 'work', 'publications', 'skills', 'awards', 'certifications', 'references', 'custom']
    order = cv_data.section_order if cv_data.section_order else default_order

    for section_key in order:
        renderer = section_renderers.get(section_key)
        if renderer:
            renderer()
                
    doc.build(story)
    buffer.seek(0)
    return buffer.read()


def generate_modern_pdf(cv_data: CVData) -> bytes:
    """Modern Two-Column Layout (Sidebar + Main Content)."""
    buffer = io.BytesIO()
    fs = cv_data.format_settings or CVFormatSettings()
    doc = BaseDocTemplate(
        buffer, pagesize=A4,
        rightMargin=1*cm, leftMargin=1*cm, topMargin=1*cm, bottomMargin=1*cm
    )
    
    sidebar_color = fs.sidebar_color if hasattr(fs, 'sidebar_color') else '#2c3e50'
    sidebar_text = get_contrast_color(sidebar_color)
    
    def draw_sidebar_bg(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(HexColor(sidebar_color))
        canvas.rect(0, 0, 6.5*cm, 29.7*cm, fill=1, stroke=0)
        canvas.restoreState()

    frame_sidebar = Frame(
        doc.leftMargin, doc.bottomMargin, 
        width=5.0*cm, height=doc.height, 
        id='sidebar', showBoundary=0
    )
    frame_main = Frame(
        doc.leftMargin + 6*cm, doc.bottomMargin, 
        width=doc.width - 6*cm, height=doc.height, 
        id='main', showBoundary=0
    )
    frame_main_later = Frame(
        doc.leftMargin + 6*cm, doc.bottomMargin, 
        width=doc.width - 6*cm, height=doc.height, 
        id='main_later', showBoundary=0
    )
    
    doc.addPageTemplates([
        PageTemplate(id='FirstPage', frames=[frame_sidebar, frame_main], onPage=draw_sidebar_bg),
        PageTemplate(id='LaterPages', frames=[frame_main_later], onPage=draw_sidebar_bg)
    ])
    
    styles = create_base_styles(fs)
    story = []
    pi = cv_data.personal_info
    
    # Calculate dynamic font size for name to prevent word breaking
    name_style = ParagraphStyle(
        'DynamicModernName',
        parent=styles['ModernName'],
        textColor=HexColor(sidebar_text)
    )
    if pi.full_name:
        words = pi.full_name.split()
        max_word_len = max([len(w) for w in words]) if words else 0
        if max_word_len > 10 or len(pi.full_name) > 20:
            name_style.fontSize -= 12
            name_style.leading -= 12
        elif max_word_len > 6 or len(pi.full_name) > 14:
            name_style.fontSize -= 8
            name_style.leading -= 8

    sidebar_story = []

    # --- SIDEBAR CONTENT ---
    # Name & Summary
    if pi.full_name:
        sidebar_story.append(Paragraph(clean_for_pdf(pi.full_name.upper()), name_style))
        sidebar_story.append(Spacer(1, 15))

    if pi.photo_base64:
        # Use circular=True to get a round photo
        photo_stream = process_base64_image(pi.photo_base64, circular=True)
        if photo_stream:
            img = Image(photo_stream)
            # Constrain to width
            img.drawHeight = 3.5*cm * (img.imageHeight / img.imageWidth)
            img.drawWidth = 3.5*cm
            sidebar_story.append(img)
            sidebar_story.append(Spacer(1, 10))
    
    # Contact
    sidebar_story.append(Paragraph("CONTACT", styles['SidebarHeader']))
    if pi.email: sidebar_story.append(Paragraph(clean_for_pdf(pi.email), styles['SidebarBody']))
    if pi.phone: sidebar_story.append(Paragraph(clean_for_pdf(pi.phone), styles['SidebarBody']))
    if pi.address: sidebar_story.append(Paragraph(clean_for_pdf(pi.address), styles['SidebarBody']))
    if pi.linkedin: sidebar_story.append(Paragraph(f'<link href="{pi.linkedin}" color="{sidebar_text}">LinkedIn</link>', styles['SidebarBody']))
    
    sidebar_story.append(Spacer(1, 15))
    
    # Personal Details
    if pi.nationality or pi.date_of_birth or pi.place_of_birth:
        sidebar_story.append(Paragraph("PERSONAL", styles['SidebarHeader']))
        if pi.nationality: sidebar_story.append(Paragraph(clean_for_pdf(f"Nationality: {pi.nationality}"), styles['SidebarBody']))
        if pi.date_of_birth: sidebar_story.append(Paragraph(clean_for_pdf(f"Born: {pi.date_of_birth}"), styles['SidebarBody']))
        if pi.place_of_birth: sidebar_story.append(Paragraph(clean_for_pdf(f"Place: {pi.place_of_birth}"), styles['SidebarBody']))
        sidebar_story.append(Spacer(1, 15))

    default_order = ['profile', 'education', 'research', 'work', 'publications', 'skills', 'awards', 'certifications', 'references', 'custom']
    order = cv_data.section_order if cv_data.section_order else default_order
    
    SIDEBAR_SECTIONS = ['skills', 'languages', 'awards', 'references', 'certifications']
    sidebar_keys = [k for k in order if k in SIDEBAR_SECTIONS]
    main_keys = [k for k in order if k not in SIDEBAR_SECTIONS]

    for key in sidebar_keys:
        if key == 'skills' and cv_data.skills:
            sidebar_story.append(Paragraph("SKILLS", styles['SidebarHeader']))
            sidebar_story.append(Spacer(1, 2))
            sidebar_story.append(HRFlowable(width="100%", thickness=1, color=HexColor(sidebar_text), spaceBefore=0, spaceAfter=8))
            skills_str = " \u2022 ".join(cv_data.skills)
            sidebar_story.append(Paragraph(clean_for_pdf(skills_str), styles['SidebarBody']))
            sidebar_story.append(Spacer(1, 15))
        elif key == 'languages' and cv_data.languages:
            sidebar_story.append(Paragraph("LANGUAGES", styles['SidebarHeader']))
            sidebar_story.append(Spacer(1, 2))
            sidebar_story.append(HRFlowable(width="100%", thickness=1, color=HexColor(sidebar_text), spaceBefore=0, spaceAfter=8))
            langs_str = " \u2022 ".join([f"{l.language} ({l.proficiency})" for l in cv_data.languages])
            sidebar_story.append(Paragraph(clean_for_pdf(langs_str), styles['SidebarBody']))
            sidebar_story.append(Spacer(1, 15))
        elif key == 'awards' and cv_data.awards:
            sidebar_story.append(Paragraph("AWARDS", styles['SidebarHeader']))
            sidebar_story.append(Spacer(1, 2))
            sidebar_story.append(HRFlowable(width="100%", thickness=1, color=HexColor(sidebar_text), spaceBefore=0, spaceAfter=8))
            for award in cv_data.awards:
                sidebar_story.append(Paragraph(clean_for_pdf(f"<b>{award.title}</b> ({award.year})"), styles['SidebarBody']))
                sidebar_story.append(Paragraph(clean_for_pdf(award.issuer), styles['SidebarBody']))
                sidebar_story.append(Spacer(1, 4))
            sidebar_story.append(Spacer(1, 10))
        elif key == 'certifications' and cv_data.certifications:
            sidebar_story.append(Paragraph("CERTIFICATIONS", styles['SidebarHeader']))
            sidebar_story.append(Spacer(1, 2))
            sidebar_story.append(HRFlowable(width="100%", thickness=1, color=HexColor(sidebar_text), spaceBefore=0, spaceAfter=8))
            for cert in cv_data.certifications:
                sidebar_story.append(Paragraph(clean_for_pdf(f"- {cert}"), styles['SidebarBody']))
            sidebar_story.append(Spacer(1, 15))
        elif key == 'references' and cv_data.references:
            sidebar_story.append(Paragraph("REFERENCES", styles['SidebarHeader']))
            sidebar_story.append(Spacer(1, 2))
            sidebar_story.append(HRFlowable(width="100%", thickness=1, color=HexColor(sidebar_text), spaceBefore=0, spaceAfter=8))
            sidebar_story.append(Paragraph(clean_for_pdf(cv_data.references), styles['SidebarBody']))
            sidebar_story.append(Spacer(1, 15))

    # Construct the Sidebar with KeepInFrame to prevent overflowing to main column
    story.append(KeepInFrame(5.0*cm, doc.height, sidebar_story, mode='shrink', hAlign='LEFT', vAlign='TOP'))

    # Switch to Main Frame and set NextPageTemplate to LaterPages
    story.append(FrameBreak())
    story.append(NextPageTemplate('LaterPages'))

    # --- MAIN CONTENT ---
    accent_hex = fs.accent_color if (fs and fs.accent_color) else '#1a1a1a'
    
    for key in main_keys:
        if key == 'profile' and cv_data.profile_summary:
            story.append(Paragraph("PROFILE", styles['ModernSection']))
            story.append(Spacer(1, 2))
            story.append(HRFlowable(width="100%", thickness=1, color=HexColor(accent_hex), spaceBefore=0, spaceAfter=8))
            story.append(Paragraph(clean_for_pdf(cv_data.profile_summary), styles['ModernBody']))
            story.append(Spacer(1, 20))
            
        elif key == 'work' and cv_data.work_experience:
            story.append(Paragraph("WORK EXPERIENCE", styles['ModernSection']))
            story.append(Spacer(1, 2))
            story.append(HRFlowable(width="100%", thickness=1, color=HexColor(accent_hex), spaceBefore=0, spaceAfter=8))
            for exp in cv_data.work_experience:
                story.append(Paragraph(clean_for_pdf(f"<b>{exp.position}</b>"), styles['ModernBody']))
                story.append(Paragraph(clean_for_pdf(f"{exp.organization} | {exp.start_date} - {exp.end_date}"), styles['ModernBody']))
                if exp.description:
                    story.append(Paragraph(clean_for_pdf(exp.description), styles['ModernBody']))
                story.append(Spacer(1, 8))

        elif key == 'education' and cv_data.education:
            story.append(Paragraph("EDUCATION", styles['ModernSection']))
            story.append(Spacer(1, 2))
            story.append(HRFlowable(width="100%", thickness=1, color=HexColor(accent_hex), spaceBefore=0, spaceAfter=8))
            for edu in cv_data.education:
                story.append(Paragraph(clean_for_pdf(f"<b>{edu.degree}</b>"), styles['ModernBody']))
                story.append(Paragraph(clean_for_pdf(f"{edu.institution}, {edu.location}"), styles['ModernBody']))
                story.append(Paragraph(clean_for_pdf(f"{edu.start_date} \u2013 {edu.end_date}"), styles['ModernBody']))
                if edu.thesis_title: story.append(Paragraph(clean_for_pdf(f"Thesis: {edu.thesis_title}"), styles['ModernBody']))
                if edu.description: story.append(Paragraph(clean_for_pdf(edu.description), styles['ModernBody']))
                story.append(Spacer(1, 8))

        elif key == 'research' and cv_data.research_experience:
            story.append(Paragraph("RESEARCH EXPERIENCE", styles['ModernSection']))
            story.append(Spacer(1, 2))
            story.append(HRFlowable(width="100%", thickness=1, color=HexColor(accent_hex), spaceBefore=0, spaceAfter=8))
            for exp in cv_data.research_experience:
                story.append(Paragraph(clean_for_pdf(f"<b>{exp.position}</b>"), styles['ModernBody']))
                story.append(Paragraph(clean_for_pdf(f"{exp.organization}"), styles['ModernBody']))
                story.append(Paragraph(clean_for_pdf(exp.description), styles['ModernBody']))
                story.append(Spacer(1, 8))

        elif key == 'publications' and cv_data.publications:
            story.append(Paragraph("PUBLICATIONS", styles['ModernSection']))
            story.append(Spacer(1, 2))
            story.append(HRFlowable(width="100%", thickness=1, color=HexColor(accent_hex), spaceBefore=0, spaceAfter=8))
            for pub in cv_data.publications:
                text = f"{pub.authors} ({pub.year}). <i>{pub.title}</i>. {pub.journal_conference}."
                if pub.doi: text += f" DOI: {pub.doi}"
                story.append(Paragraph(clean_for_pdf(text), styles['ModernBody']))
                story.append(Spacer(1, 4))
                
        elif key == 'custom':
            for cs in cv_data.custom_sections:
                if cs.title and cs.content:
                    story.append(Paragraph(clean_for_pdf(cs.title.upper()), styles['ModernSection']))
                    story.append(Paragraph(clean_for_pdf(cs.content), styles['ModernBody']))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


def generate_docx(cv_data: CVData) -> bytes:
    """Generate Word document - dispatches to academic or modern layout."""
    template_id = cv_data.template_id.lower() if cv_data.template_id else "academic"
    if template_id == "modern":
        return generate_modern_docx(cv_data)
    return generate_academic_docx(cv_data)


def generate_academic_docx(cv_data: CVData) -> bytes:
    """Generate Word document - single-column academic format."""
    doc = Document()
    fs = cv_data.format_settings or CVFormatSettings()
    
    font_family_map = {"serif": "Times New Roman", "sans-serif": "Calibri", "modern": "Calibri"}
    font_name = font_family_map.get(fs.font_family, "Times New Roman")
    
    size_scale = {"small": 0.85, "medium": 1.0, "large": 1.15}
    sc = size_scale.get(fs.font_size, 1.0)
    
    spacing_mult = {"compact": 0.75, "normal": 1.0, "relaxed": 1.35}
    sp = spacing_mult.get(fs.spacing, 1.0)
    
    accent_hex = (fs.accent_color or "#000000").lstrip('#')
    try:
        accent_rgb = RGBColor(int(accent_hex[:2], 16), int(accent_hex[2:4], 16), int(accent_hex[4:6], 16))
    except Exception:
        accent_rgb = RGBColor(0, 0, 0)
    
    margin_map = {"narrow": Cm(1.5), "normal": Cm(2.54), "wide": Cm(3.0)}
    margin_val = margin_map.get(fs.margins, Cm(2.54))
    for section in doc.sections:
        section.left_margin = margin_val
        section.right_margin = margin_val
    
    pi = cv_data.personal_info
    photo_stream = process_base64_image(pi.photo_base64, circular=True)
    
    style_normal = doc.styles['Normal']
    style_normal.font.name = font_name
    style_normal.font.size = Pt(round(10 * sc))
    style_normal.paragraph_format.space_after = Pt(round(4 * sp))
    
    style_h1 = doc.styles['Heading 1']
    style_h1.font.name = font_name
    style_h1.font.size = Pt(round(11 * sc))
    style_h1.font.bold = True
    style_h1.font.color.rgb = None
    style_h1.font.color.theme_color = None
    style_h1.font.color.rgb = accent_rgb
    style_h1.element.rPr.rFonts.set(qn('w:eastAsia'), font_name)
    
    table = doc.add_table(rows=1, cols=2)
    table.autofit = False
    table.allow_autofit = False
    cell_text = table.cell(0, 0)
    cell_text.width = Cm(12)
    cell_photo = table.cell(0, 1)
    cell_photo.width = Cm(4)
    
    p_name = cell_text.paragraphs[0]
    p_name.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_name = p_name.add_run(pi.full_name.upper())
    run_name.bold = True
    run_name.font.size = Pt(round(18 * sc))
    run_name.font.name = font_name
    
    contact_parts = [p for p in [pi.email, pi.phone, pi.address] if p]
    if contact_parts:
        p_contact = cell_text.add_paragraph(" | ".join(contact_parts))
        p_contact.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_contact.style = doc.styles['Normal']
        
    links = []
    if pi.linkedin: links.append("LinkedIn")
    if pi.github: links.append("GitHub")
    if links:
        p_links = cell_text.add_paragraph(" | ".join(links))
        p_links.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
    extra_parts = []
    if pi.nationality: extra_parts.append(f"Nationality: {pi.nationality}")
    if pi.date_of_birth: extra_parts.append(f"Born: {pi.date_of_birth}")
    if pi.place_of_birth: extra_parts.append(f"in {pi.place_of_birth}")
    if extra_parts:
        p_bio = cell_text.add_paragraph(" | ".join(extra_parts))
        p_bio.alignment = WD_ALIGN_PARAGRAPH.CENTER

    if photo_stream:
        p_photo = cell_photo.paragraphs[0]
        p_photo.clear()
        p_photo.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r = p_photo.add_run()
        r.add_picture(photo_stream, width=Cm(3.5))

    doc.add_paragraph()
    
    def set_bottom_border(paragraph):
        p = paragraph._p
        pPr = p.get_or_add_pPr()
        pBdr = OxmlElement('w:pBdr')
        pPr.insert_element_before(pBdr, 'w:shd', 'w:tabs', 'w:suppressLineNumbers', 'w:ind', 'w:jc', 'w:textAlignment', 'w:rPr')
        bottom = OxmlElement('w:bottom')
        bottom.set(qn('w:val'), 'single')
        bottom.set(qn('w:sz'), '6')
        bottom.set(qn('w:space'), '1')
        bottom.set(qn('w:color'), accent_hex)
        pBdr.append(bottom)
        
    p_line = doc.add_paragraph()
    set_bottom_border(p_line)
    doc.add_paragraph()
    
    def add_section_heading(text):
        h = doc.add_heading(text.upper(), level=1)
        h.alignment = WD_ALIGN_PARAGRAPH.LEFT
        set_bottom_border(h)
        return h

    if cv_data.profile_summary:
        add_section_heading('PROFILE')
        doc.add_paragraph(cv_data.profile_summary)
        
    if cv_data.education:
        add_section_heading('EDUCATION')
        for edu in cv_data.education:
            p = doc.add_paragraph()
            p.add_run(f"{edu.degree}").bold = True
            p.add_run(f"\n{edu.institution}, {edu.location}")
            p.add_run(f"\n{edu.start_date} - {edu.end_date}")
            if edu.thesis_title:
                p.add_run(f"\nThesis: {edu.thesis_title}")
            if edu.grade:
                p.add_run(f"\nGrade: {edu.grade}")
            if edu.description:
                 p.add_run(f"\n{edu.description}")

    if cv_data.research_experience:
        add_section_heading('RESEARCH EXPERIENCE')
        for exp in cv_data.research_experience:
            p = doc.add_paragraph()
            p.add_run(f"{exp.position}").bold = True
            p.add_run(f"\n{exp.organization}, {exp.location}")
            p.add_run(f"\n{exp.start_date} - {exp.end_date}")
            if exp.description:
                doc.add_paragraph(exp.description)
                
    if cv_data.work_experience:
        add_section_heading('WORK EXPERIENCE')
        for exp in cv_data.work_experience:
            p = doc.add_paragraph()
            p.add_run(f"{exp.position}").bold = True
            p.add_run(f"\n{exp.organization}, {exp.location}")
            p.add_run(f"\n{exp.start_date} - {exp.end_date}")
            if exp.description:
                doc.add_paragraph(exp.description)

    if cv_data.publications:
        add_section_heading('PUBLICATIONS')
        for pub in cv_data.publications:
            p = doc.add_paragraph()
            p.add_run(f"{pub.authors} ({pub.year}). ")
            p.add_run(f"{pub.title}").italic = True
            p.add_run(f". {pub.journal_conference}.")
            if pub.doi:
                p.add_run(f" DOI: {pub.doi}")

    if cv_data.skills:
        add_section_heading('SKILLS')
        doc.add_paragraph(" \u2022 ".join(cv_data.skills))

    if cv_data.languages:
        add_section_heading('LANGUAGES')
        for l in cv_data.languages:
            doc.add_paragraph(f"{l.language} ({l.proficiency})")

    if cv_data.awards:
        add_section_heading('AWARDS')
        for award in cv_data.awards:
            p = doc.add_paragraph()
            p.add_run(f"{award.title}").bold = True
            p.add_run(f" ({award.year}) - {award.issuer}")
            if award.description:
                doc.add_paragraph(award.description)

    if cv_data.certifications:
        add_section_heading('CERTIFICATIONS')
        for cert in cv_data.certifications:
            doc.add_paragraph(f"- {cert}")

    for cs in cv_data.custom_sections:
        if cs.title and cs.content:
            add_section_heading(cs.title)
            doc.add_paragraph(cs.content)

    if cv_data.references:
        add_section_heading('REFERENCES')
        doc.add_paragraph(cv_data.references)
    
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.read()


def _set_cell_shading(cell, hex_color: str):
    """Apply background shading to a python-docx table cell."""
    hex_color = hex_color.lstrip('#')
    shading_elm = OxmlElement('w:shd')
    shading_elm.set(qn('w:val'), 'clear')
    shading_elm.set(qn('w:color'), 'auto')
    shading_elm.set(qn('w:fill'), hex_color)
    cell._tc.get_or_add_tcPr().append(shading_elm)


def _shade_paragraph(p, fill_hex: str):
    """Apply background shading to an individual paragraph so the color shows in Word."""
    fill_hex = fill_hex.lstrip('#')
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    pPr.append(shd)


def _add_sidebar_heading(cell, text: str, font_name: str, sc: float, text_color: RGBColor, bg_hex: str, border_hex: str = ''):
    """Add a bold heading inside a sidebar cell with proper shading."""
    p = cell.add_paragraph()
    _shade_paragraph(p, bg_hex)
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(text.upper())
    run.bold = True
    run.font.size = Pt(round(10 * sc))
    run.font.name = font_name
    run.font.color.rgb = text_color
    # Add a thin underline via bottom border
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    pPr.append(pBdr)
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '4')
    bottom.set(qn('w:space'), '1')
    b_hex = border_hex.lstrip('#') if border_hex else str(text_color).lstrip('#')
    bottom.set(qn('w:color'), b_hex)
    pBdr.append(bottom)
    return p


def _add_sidebar_text(cell, text: str, font_name: str, sc: float, text_color: RGBColor, bg_hex: str, bold=False):
    """Add a body text paragraph inside a sidebar cell with proper shading."""
    p = cell.add_paragraph()
    _shade_paragraph(p, bg_hex)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run(text)
    run.font.size = Pt(round(9 * sc))
    run.font.name = font_name
    run.font.color.rgb = text_color
    run.bold = bold
    return p


def generate_modern_docx(cv_data: CVData) -> bytes:
    """Generate Word document with a two-column modern layout (sidebar + main)."""
    doc = Document()
    fs = cv_data.format_settings or CVFormatSettings()
    
    font_name = "Calibri"
    size_scale = {"small": 0.85, "medium": 1.0, "large": 1.15}
    sc = size_scale.get(fs.font_size, 1.0)
    spacing_mult = {"compact": 0.75, "normal": 1.0, "relaxed": 1.35}
    sp = spacing_mult.get(fs.spacing, 1.0)
    
    accent_hex = (fs.accent_color or "#1a1a1a").lstrip('#')
    try:
        accent_rgb = RGBColor(int(accent_hex[:2], 16), int(accent_hex[2:4], 16), int(accent_hex[4:6], 16))
    except Exception:
        accent_rgb = RGBColor(26, 26, 26)
    
    sidebar_hex = (fs.sidebar_color if hasattr(fs, 'sidebar_color') and fs.sidebar_color else '#2c3e50').lstrip('#')
    sidebar_text_hex = get_contrast_color('#' + sidebar_hex)
    try:
        sidebar_text_rgb = RGBColor(int(sidebar_text_hex.lstrip('#')[:2], 16), int(sidebar_text_hex.lstrip('#')[2:4], 16), int(sidebar_text_hex.lstrip('#')[4:6], 16))
    except Exception:
        sidebar_text_rgb = RGBColor(255, 255, 255)
    # Compute a lighter border color for sidebar headings (like border-white/20 overlay)
    # Blend 20% white onto the sidebar color
    sb_r, sb_g, sb_b = int(sidebar_hex[:2], 16), int(sidebar_hex[2:4], 16), int(sidebar_hex[4:6], 16)
    border_r = min(255, sb_r + int((255 - sb_r) * 0.3))
    border_g = min(255, sb_g + int((255 - sb_g) * 0.3))
    border_b = min(255, sb_b + int((255 - sb_b) * 0.3))
    sidebar_border_hex = f'{border_r:02x}{border_g:02x}{border_b:02x}'
    
    # Minimal margins for modern layout
    for section in doc.sections:
        section.left_margin = Cm(0.5)
        section.right_margin = Cm(0.5)
        section.top_margin = Cm(0.5)
        section.bottom_margin = Cm(0.5)
    
    # Normal style
    style_normal = doc.styles['Normal']
    style_normal.font.name = font_name
    style_normal.font.size = Pt(round(10 * sc))
    style_normal.paragraph_format.space_after = Pt(round(4 * sp))
    
    pi = cv_data.personal_info
    photo_stream = process_base64_image(pi.photo_base64, circular=True)
    
    # Create main layout table: 1 row, 2 cols (sidebar | main)
    layout_table = doc.add_table(rows=1, cols=2)
    layout_table.autofit = False
    layout_table.allow_autofit = False
    
    # Remove table borders
    tbl = layout_table._tbl
    tblPr = tbl.tblPr if tbl.tblPr is not None else OxmlElement('w:tblPr')
    borders = OxmlElement('w:tblBorders')
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        element = OxmlElement(f'w:{edge}')
        element.set(qn('w:val'), 'none')
        element.set(qn('w:sz'), '0')
        element.set(qn('w:space'), '0')
        element.set(qn('w:color'), 'auto')
        borders.append(element)
    tblPr.append(borders)
    
    sidebar_cell = layout_table.cell(0, 0)
    main_cell = layout_table.cell(0, 1)
    
    # Set column widths
    sidebar_cell.width = Cm(6)
    main_cell.width = Cm(13.5)
    
    # Apply sidebar background color
    _set_cell_shading(sidebar_cell, sidebar_hex)
    
    # --- SIDEBAR CONTENT ---
    # Clear default paragraph and shade it
    sidebar_cell.paragraphs[0].clear()
    _shade_paragraph(sidebar_cell.paragraphs[0], sidebar_hex)
    
    # Photo
    if photo_stream:
        p_photo = sidebar_cell.paragraphs[0]
        p_photo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_photo.paragraph_format.space_after = Pt(8)
        r = p_photo.add_run()
        r.add_picture(photo_stream, width=Cm(3.5))
    
    # Name
    p_name = sidebar_cell.add_paragraph()
    _shade_paragraph(p_name, sidebar_hex)
    p_name.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_name.paragraph_format.space_after = Pt(12)
    run_name = p_name.add_run(pi.full_name.upper())
    run_name.bold = True
    run_name.font.size = Pt(round(14 * sc))
    run_name.font.name = font_name
    run_name.font.color.rgb = sidebar_text_rgb
    
    # Contact
    _add_sidebar_heading(sidebar_cell, "CONTACT", font_name, sc, sidebar_text_rgb, sidebar_hex, sidebar_border_hex)
    contact_items = [pi.email, pi.phone, pi.address]
    for item in contact_items:
        if item:
            _add_sidebar_text(sidebar_cell, item, font_name, sc, sidebar_text_rgb, sidebar_hex)
    
    if pi.linkedin:
        _add_sidebar_text(sidebar_cell, "LinkedIn", font_name, sc, sidebar_text_rgb, sidebar_hex)
    if pi.github:
        _add_sidebar_text(sidebar_cell, "GitHub", font_name, sc, sidebar_text_rgb, sidebar_hex)
    
    # Sidebar sections
    SIDEBAR_SECTIONS = ['skills', 'languages', 'awards', 'certifications', 'references']
    section_order = cv_data.section_order if cv_data.section_order else ['skills', 'languages', 'awards', 'certifications', 'references']
    sidebar_keys = [k for k in section_order if k in SIDEBAR_SECTIONS]
    
    for key in sidebar_keys:
        if key == 'skills' and cv_data.skills:
            _add_sidebar_heading(sidebar_cell, "SKILLS", font_name, sc, sidebar_text_rgb, sidebar_hex, sidebar_border_hex)
            skills_str = " \u2022 ".join(cv_data.skills)
            _add_sidebar_text(sidebar_cell, skills_str, font_name, sc, sidebar_text_rgb, sidebar_hex)
        
        elif key == 'languages' and cv_data.languages:
            _add_sidebar_heading(sidebar_cell, "LANGUAGES", font_name, sc, sidebar_text_rgb, sidebar_hex, sidebar_border_hex)
            langs = " \u2022 ".join([f"{l.language} ({l.proficiency})" for l in cv_data.languages])
            _add_sidebar_text(sidebar_cell, langs, font_name, sc, sidebar_text_rgb, sidebar_hex)
        
        elif key == 'awards' and cv_data.awards:
            _add_sidebar_heading(sidebar_cell, "AWARDS", font_name, sc, sidebar_text_rgb, sidebar_hex, sidebar_border_hex)
            for award in cv_data.awards:
                _add_sidebar_text(sidebar_cell, f"{award.title} ({award.year})", font_name, sc, sidebar_text_rgb, sidebar_hex, bold=True)
        
        elif key == 'certifications' and cv_data.certifications:
            _add_sidebar_heading(sidebar_cell, "CERTIFICATIONS", font_name, sc, sidebar_text_rgb, sidebar_hex, sidebar_border_hex)
            for cert in cv_data.certifications:
                _add_sidebar_text(sidebar_cell, f"- {cert}", font_name, sc, sidebar_text_rgb, sidebar_hex)
        
        elif key == 'references' and cv_data.references:
            _add_sidebar_heading(sidebar_cell, "REFERENCES", font_name, sc, sidebar_text_rgb, sidebar_hex, sidebar_border_hex)
            _add_sidebar_text(sidebar_cell, cv_data.references, font_name, sc, sidebar_text_rgb, sidebar_hex)
    
    # --- MAIN CONTENT ---
    main_cell.paragraphs[0].clear()
    
    def add_main_heading(text):
        p = main_cell.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text.upper())
        run.bold = True
        run.font.size = Pt(round(11 * sc))
        run.font.name = font_name
        run.font.color.rgb = accent_rgb
        # Bottom border
        pPr = p._p.get_or_add_pPr()
        pBdr = OxmlElement('w:pBdr')
        pPr.append(pBdr)
        bottom = OxmlElement('w:bottom')
        bottom.set(qn('w:val'), 'single')
        bottom.set(qn('w:sz'), '4')
        bottom.set(qn('w:space'), '1')
        bottom.set(qn('w:color'), accent_hex)
        pBdr.append(bottom)
        return p
    
    def add_main_text(text, bold=False, italic=False):
        p = main_cell.add_paragraph()
        p.paragraph_format.space_after = Pt(round(3 * sp))
        run = p.add_run(text)
        run.font.size = Pt(round(9 * sc))
        run.font.name = font_name
        run.font.color.rgb = RGBColor(51, 65, 85)  # text-slate-700 (#334155)
        run.bold = bold
        run.italic = italic
        return p
    
    MAIN_SECTIONS = ['profile', 'education', 'research', 'work', 'publications', 'custom']
    main_keys = [k for k in section_order if k in MAIN_SECTIONS]
    if not main_keys:
        main_keys = ['profile', 'education', 'research', 'work', 'publications', 'custom']
    
    for key in main_keys:
        if key == 'profile' and cv_data.profile_summary:
            add_main_heading("PROFILE")
            add_main_text(cv_data.profile_summary)
        
        elif key == 'education' and cv_data.education:
            add_main_heading("EDUCATION")
            for edu in cv_data.education:
                add_main_text(edu.degree, bold=True)
                add_main_text(f"{edu.institution}, {edu.location}")
                add_main_text(f"{edu.start_date} \u2013 {edu.end_date}")
                if edu.thesis_title:
                    add_main_text(f"Thesis: {edu.thesis_title}")
                if edu.description:
                    add_main_text(edu.description)
        
        elif key == 'research' and cv_data.research_experience:
            add_main_heading("RESEARCH EXPERIENCE")
            for exp in cv_data.research_experience:
                add_main_text(exp.position, bold=True)
                add_main_text(f"{exp.organization}")
                if exp.description:
                    add_main_text(exp.description)
        
        elif key == 'work' and cv_data.work_experience:
            add_main_heading("WORK EXPERIENCE")
            for exp in cv_data.work_experience:
                add_main_text(exp.position, bold=True)
                add_main_text(f"{exp.organization} | {exp.start_date} - {exp.end_date}")
                if exp.description:
                    add_main_text(exp.description)
        
        elif key == 'publications' and cv_data.publications:
            add_main_heading("PUBLICATIONS")
            for pub in cv_data.publications:
                text = f"{pub.authors} ({pub.year}). {pub.title}. {pub.journal_conference}."
                if pub.doi:
                    text += f" DOI: {pub.doi}"
                add_main_text(text)
        
        elif key == 'custom' and cv_data.custom_sections:
            for cs in cv_data.custom_sections:
                if cs.title and cs.content:
                    add_main_heading(cs.title)
                    add_main_text(cs.content)
    
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.read()


# =============================================================================
# FASTAPI ROUTER
# =============================================================================

router = APIRouter(
    prefix="/cv-generator",
    tags=["CV Generator"]
)


@router.post("/upload", response_model=FileUploadResponse)
async def upload_cv_file(file: UploadFile = File(...)):
    """
    Upload a CV file (PDF or DOCX) and extract text content.
    Returns the extracted text for user to review/edit before generating.
    """
    # Validate file type
    allowed_extensions = {".pdf", ".docx", ".txt"}
    filename = file.filename or "unknown"
    file_ext = filename.lower()[filename.rfind("."):] if "." in filename else ""
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Please upload a PDF, DOCX, or TXT file."
        )
    
    try:
        content = await file.read()
        
        # Validate file size (max 10MB)
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds 10MB limit."
            )
        
        # Parse based on file type
        if file_ext == ".pdf":
            extracted_text = parse_pdf_content(content)
        elif file_ext == ".docx":
            extracted_text = parse_docx_content(content)
        else:  # .txt
            extracted_text = content.decode('utf-8', errors='ignore')
        
        if not extracted_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract text from the file. The file may be empty or corrupted."
            )
        
        return FileUploadResponse(
            filename=filename,
            content=extracted_text,
            message="File parsed successfully. Review and edit the content if needed."
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse file: {str(e)}"
        )


@router.post("/generate", response_model=CVResponse)
async def generate_cv(
    request: CVRequest,
    ai_service: AzureOpenAIService = Depends(get_azure_openai_service),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Generate a structured academic CV from user input text."""
    try:
        response = await generate_cv_content(
            ai_service=ai_service,
            user_input=request.user_input,
            job_description=request.job_description,
            target_program=request.target_program,
            target_university=request.target_university,
            user_id=current_user.id if current_user else None
        )
        
        # Set initial template id if provided
        if request.template_type:
            response.cv_data.template_id = request.template_type
            
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate CV: {str(e)}"
        )


@router.post("/refine", response_model=CVResponse)
async def refine_cv(
    request: CVUpdateRequest,
    ai_service: AzureOpenAIService = Depends(get_azure_openai_service),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Refine an existing CV with optional user notes/feedback."""
    try:
        return await refine_cv_content(
            ai_service=ai_service,
            cv_data=request.cv_data,
            section_changed=request.section_changed,
            user_notes=request.user_notes,
            job_description=request.job_description,
            target_program=request.target_program,
            target_university=request.target_university,
            user_id=current_user.id if current_user else None
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refine CV: {str(e)}"
        )


@router.post("/analyze", response_model=CVFeedbackResponse)
async def analyze_cv(
    request: CVFeedbackRequest,
    ai_service: AzureOpenAIService = Depends(get_azure_openai_service),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Analyze a CV and provide detailed feedback on strengths, improvements, and missing items.
    Optionally include specific questions you want answered about your CV.
    """
    try:
        return await analyze_cv_content(
            ai_service=ai_service,
            cv_data=request.cv_data,
            user_questions=request.user_questions,
            job_description=request.job_description,
            target_program=request.target_program,
            target_university=request.target_university,
            user_id=current_user.id if current_user else None
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze CV: {str(e)}"
        )


@router.post("/export/pdf")
async def export_cv_pdf(cv_data: CVData):
    """Export CV data as a professionally formatted PDF file."""
    try:
        pdf_bytes = generate_pdf(cv_data)
        filename = "cv.pdf"
        if cv_data.personal_info.full_name:
            safe_name = cv_data.personal_info.full_name.replace(" ", "_").replace("/", "_")
            filename = f"CV_{safe_name}.pdf"
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}"
        )


@router.post("/export/docx")
async def export_cv_docx(cv_data: CVData):
    """Export CV data as a professionally formatted Word document."""
    try:
        docx_bytes = generate_docx(cv_data)
        filename = "cv.docx"
        if cv_data.personal_info.full_name:
            safe_name = cv_data.personal_info.full_name.replace(" ", "_").replace("/", "_")
            filename = f"CV_{safe_name}.docx"
        
        return StreamingResponse(
            io.BytesIO(docx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate DOCX: {str(e)}"
        )


@router.get("/template")
async def get_cv_template():
    """Get an empty CV template structure."""
    return CVData()


@router.get("/supported-formats")
async def get_supported_formats():
    """Get list of supported file formats for upload."""
    return {
        "supported_formats": [
            {"extension": ".pdf", "description": "PDF Document"},
            {"extension": ".docx", "description": "Microsoft Word Document"},
            {"extension": ".txt", "description": "Plain Text File"}
        ],
        "max_file_size_mb": 10
    }