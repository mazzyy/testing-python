from typing import Optional, Dict, Any

def get_min_passing_grade(scale: float, nationality: Optional[str] = None) -> float:
    """
    Determine the minimum passing grade based on scale and nationality heuristics.
    """
    # Nationality-based overrides (heuristics)
    if nationality:
        nat_lower = nationality.lower()
        if "india" in nat_lower:
            if scale == 10.0: return 4.0  # Common in Indian Universities (40%)
            if scale == 100: return 33.0 or 40.0 # Varies, but 40 is safer for German admission context
        elif "pakistan" in nat_lower:
             if scale == 4.0: return 2.0  # HEC standard
             if scale == 100: return 50.0
        elif "united kingdom" in nat_lower or "uk" in nat_lower or "british" in nat_lower:
            if scale == 70: return 40.0  # UK Honours: Nmax=70 (First), Nmin=40 (Third)
            if scale == 100: return 40.0  # UK percentage scale
        elif "germany" in nat_lower:
            return 4.0 # on 1-6 scale where 4 is pass? No, usually 1-5 where 4 is pass.
            # But usually input is foreign grade.
    
    # Scale-based fallbacks
    if scale == 4.0:
        return 2.0  # Standard US/GPA
    elif scale == 5.0:
        return 2.0  # Often 2.0 is pass on 5.0 scale
    elif scale == 10.0:
        return 5.0  # 50% generic fallback
    elif scale == 100:
        return 50.0 # 50% generic fallback
    elif scale == 20:
        return 10.0 # French/Tunisian system often 10/20
    elif scale == 70:
        return 40.0  # UK Honours percentage: Third Class = 40%

    # Default fallback: 40% of scale
    return scale * 0.4

def calculate_german_grade(gpa: float, scale: float, min_passing_grade: Optional[float] = None, nationality: Optional[str] = None) -> Dict[str, Any]:
    """
    Calculate German Grade using the Bavarian Formula.
    Formula: 1 + 3 * (N_max - N_d) / (N_max - N_min)
    
    Returns:
        Dict with keys: german_grade, classification, formula, original_gpa
    """
    if scale <= 0:
        return {"error": "Invalid scale"}
        
    # Determine min_passing_grade if not provided
    if min_passing_grade is None:
        min_passing_grade = get_min_passing_grade(scale, nationality)
    
    # Handle edge case where GPA is below passing (Fail)
    # We allow the formula to compute > 4.0, but cap strictly for classification
    
    # Bavarian Formula
    # N_d = gpa
    # N_max = scale
    # N_min = min_passing_grade
    
    # If GPA is less than passing, strict fail in German system (5.0)
    if gpa < min_passing_grade:
        return {
            "german_grade": 5.0,
            "classification": "Fail (Mangelhaft)",
            "german_grade_display": "5.0 (Fail)",
            "original_gpa": gpa, 
            "scale": scale,
            "min_passing": min_passing_grade
        }

    # Avoid division by zero
    if scale == min_passing_grade:
         return {
            "german_grade": 4.0, # fallback
            "classification": "Sufficient",
            "german_grade_display": "4.0",
             "original_gpa": gpa, 
            "scale": scale,
            "min_passing": min_passing_grade
        }

    german_grade = 1 + 3 * (scale - gpa) / (scale - min_passing_grade)
    
    # Round to 1 decimal place usually, but 2 is fine for precision
    german_grade = round(german_grade, 2)
    
    # Cap at 1.0 (Best) explicitly? Bavarian formula can go < 1 if GPA > Scale (bonus points)
    # But strictly 1.0 is best.
    if german_grade < 1.0:
        german_grade = 1.0
        
    # Classification
    if german_grade <= 1.5: classification = "Outstanding (Sehr Gut)"
    elif german_grade <= 2.5: classification = "Good (Gut)"
    elif german_grade <= 3.5: classification = "Satisfactory (Befriedigend)"
    elif german_grade <= 4.0: classification = "Sufficient (Ausreichend)"
    else: classification = "Fail (Mangelhaft)" # Should be caught by gpa < min_pass, but for safety
    
    return {
        "german_grade": german_grade,
        "classification": classification,
        "german_grade_display": f"{german_grade} ({classification.split('(')[0].strip()})",
        "original_gpa": gpa,
        "scale": scale,
        "min_passing": min_passing_grade
    }
