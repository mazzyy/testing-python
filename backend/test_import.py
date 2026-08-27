import json
import sys
import os
sys.path.append('/app')
from app.database import SessionLocal
from app.models.program import Program

USER_JSON = """[
  {
    "program_id": "10000",
    "url": "https://www2.daad.de/deutschland/studienangebote/international-programmes/en/detail/10000/",
    "program_name": "Health and Environmental Psychology",
    "university_name": "Technical University of Applied Sciences Würzburg-Schweinfurt (THWS)",
    "city": "Würzburg",
    "degree": "Bachelor of Science in Health and Environmental Psychology",
    "course_location": "Würzburg",
    "teaching_language": [
      "English"
    ],
    "languages": "All courses are fully taught in English.",
    "full_time_part_time": [
      "full-time"
    ],
    "mode_of_study": "Fully online",
    "programme_duration": "7 semesters",
    "beginning": "Winter semester",
    "additional_info_beginning_duration_mode": "",
    "application_deadline": "For pre-year application deadline: See online athttp://pre-year.thws.de.Application for online study programme at THWS: 1 May until 15 July",
    "tuition_fees_per_semester_eur": "Yes",
    "additional_info_tuition_fees": "Please seehttps://online.thws.de/for further information.",
    "combined_masters_phd": "",
    "joint_double_degree": "No",
    "description_content": "This programme covers the foundations of psychology while specialising in health and environmental psychology",
    "in_cooperation_with": "German Jordanian University, Jordan",
    "course_organisation": "The programme is structured into interconnected fields of study",
    "diploma_supplement_issued": "Yes",
    "international_elements": [
      "Language training provided",
      "Training in intercultural skills",
      "Specialist literature in other languages",
      "International comparisons and thematic reference to the international context",
      "Content-related regional focus"
    ],
    "description_other_international_elements": "",
    "integrated_study_abroad": "",
    "integrated_internships": "Mandatory internship in the fifth semester",
    "german_language_courses": "No",
    "english_language_courses": "No",
    "semester_contribution": "Please seehttps://online.thws.de/for further information.",
    "costs_of_living": "",
    "funding_opportunities": "No",
    "academic_admission_requirements": "Academic admission requirements for enrolment in the pre-year at GJU:Seehttp://pre-year.thws.deAcademic admission requirements",
    "language_requirements": "Language requirements for enrolment in the pre-year at GJU",
    "submit_application_to": "For the pre-year at GJU:http://pre-year.thws.deFor enrolment at THWS:https://campusportal.thws.de",
    "accommodation": "",
    "career_advisory_services": "The International Career Service at THWS offers events",
    "support_international_students": [
      "Tutors",
      "Accompanying programme",
      "Specialist counselling",
      "Cultural and linguistic preparation"
    ],
    "general_services_support": "The International Office at THWS offers a range of support options",
    "contact_phone": "+49 93135116500",
    "contact_email": "degreeseeker@thws.de",
    "contact_website": "https://online.thws.de/en/health-and-environmental-psychology/",
    "contact_address": "Münzstraße 1297070 Würzburg"
  }
]"""

db = SessionLocal()
programs_data = json.loads(USER_JSON)

for item in programs_data:
    try:
        program_degree_type = 'Bachelor'
        program = Program(
            program_id=str(item.get('program_id')),
            url=item.get('url'),
            program_name=item.get('program_name', 'Unknown Program'),
            university_name=item.get('university_name', 'Unknown University'),
            city=item.get('city'),
            degree=item.get('degree'),
            degree_type=program_degree_type,
            course_location=item.get('course_location'),
            teaching_language=item.get('teaching_language'),
            languages=item.get('languages'),
            full_time_part_time=item.get('full_time_part_time'),
            mode_of_study=item.get('mode_of_study'),
            programme_duration=item.get('programme_duration'),
            beginning=item.get('beginning'),
            application_deadline=item.get('application_deadline'),
            tuition_fees_per_semester_eur=item.get('tuition_fees_per_semester_eur'),
            additional_info_tuition_fees=item.get('additional_info_tuition_fees'),
            semester_contribution=item.get('semester_contribution'),
            description_content=item.get('description_content'),
            academic_admission_requirements=item.get('academic_admission_requirements'),
            language_requirements=item.get('language_requirements'),
            funding_opportunities=item.get('funding_opportunities'),
            contact_email=item.get('contact_email'),
            contact_website=item.get('contact_website'),
            contact_phone=item.get('contact_phone'),
            international_elements=item.get('international_elements'),
            support_international_students=item.get('support_international_students'),
            is_active=True
        )
        db.add(program)
    except Exception as e:
        print(f"Error making program {item.get('program_id')}: {str(e)}")

try:
    db.commit()
    print("Success")
except Exception as e:
    print("DB Commit Failed!")
    import traceback
    traceback.print_exc()
