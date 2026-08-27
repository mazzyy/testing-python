from app.routers.cv_generator import generate_modern_pdf, CVData, CVFormatSettings, PersonalInfo, Experience, Education

data = CVData(
    personal_info=PersonalInfo(full_name="John Doe", email="j@d.com", phone="123", nationality="US"),
    profile_summary="Senior developer.",
    work_experience=[Experience(position="Dev", organization="Tech", start_date="2020", end_date="2023", description="Coded things.")],
    education=[Education(degree="BSc CS", institution="MIT", location="MA", start_date="2016", end_date="2020")],
    skills=["Python", "React", "Go"],
    languages=[],
    awards=[],
    certifications=[],
    references="",
    custom_sections=[],
    section_order=['profile', 'education', 'work', 'skills'],
    format_settings=CVFormatSettings(font_size="medium", font_family="modern", accent_color="#e11d48", sidebar_color="#831843", margins="normal", spacing="normal")
)

try:
    pdf_bytes = generate_modern_pdf(data)
    with open("test_modern.pdf", "wb") as f:
        f.write(pdf_bytes)
    print("Success, generated test_modern.pdf")
except Exception as e:
    import traceback
    traceback.print_exc()

