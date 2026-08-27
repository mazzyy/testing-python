"""
Cost of Living model for location-based expense data
"""
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base


class CostOfLiving(Base):
    """Cost of Living model for storing comprehensive location expense data"""
    __tablename__ = "cost_of_living"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Location Information
    city = Column(String(200), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    country = Column(String(100), nullable=False, default="USA")
    region = Column(String(100), nullable=True)  # e.g., "West Coast", "Northeast"
    
    # Basic Info
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    population = Column(Integer, nullable=True)
    student_population = Column(Integer, nullable=True)
    
    # Accommodation (monthly costs in USD)
    on_campus_dorm_min = Column(Numeric(10, 2), nullable=True)
    on_campus_dorm_max = Column(Numeric(10, 2), nullable=True)
    shared_apartment = Column(Numeric(10, 2), nullable=True)
    studio_apartment = Column(Numeric(10, 2), nullable=True)
    one_bedroom_apartment = Column(Numeric(10, 2), nullable=True)
    
    # Food (monthly costs)
    groceries_monthly = Column(Numeric(10, 2), nullable=True)
    eating_out_monthly = Column(Numeric(10, 2), nullable=True)
    meal_plan_cost = Column(Numeric(10, 2), nullable=True)
    coffee_price = Column(Numeric(10, 2), nullable=True)  # Average coffee price
    
    # Transportation (monthly)
    public_transit_pass = Column(Numeric(10, 2), nullable=True)
    car_insurance = Column(Numeric(10, 2), nullable=True)
    gas_monthly = Column(Numeric(10, 2), nullable=True)
    bike_sharing = Column(Numeric(10, 2), nullable=True)
    uber_avg_ride = Column(Numeric(10, 2), nullable=True)
    
    # Utilities (monthly)
    electricity = Column(Numeric(10, 2), nullable=True)
    water = Column(Numeric(10, 2), nullable=True)
    internet = Column(Numeric(10, 2), nullable=True)
    phone = Column(Numeric(10, 2), nullable=True)
    
    # Healthcare
    health_insurance_monthly = Column(Numeric(10, 2), nullable=True)
    dental_insurance_monthly = Column(Numeric(10, 2), nullable=True)
    doctor_visit_avg = Column(Numeric(10, 2), nullable=True)
    
    # Other Expenses
    books_supplies_semester = Column(Numeric(10, 2), nullable=True)
    entertainment_monthly = Column(Numeric(10, 2), nullable=True)
    gym_membership = Column(Numeric(10, 2), nullable=True)
    laundry_monthly = Column(Numeric(10, 2), nullable=True)
    personal_care_monthly = Column(Numeric(10, 2), nullable=True)
    
    # Visa & Immigration (one-time costs)
    visa_application_fee = Column(Numeric(10, 2), nullable=True)
    sevis_fee = Column(Numeric(10, 2), nullable=True)
    
    # Part-time Work
    avg_hourly_wage = Column(Numeric(10, 2), nullable=True)
    min_wage = Column(Numeric(10, 2), nullable=True)
    max_work_hours_week = Column(Integer, default=20)  # F-1 visa limit
    
    # Taxes
    state_tax_rate = Column(Numeric(5, 2), nullable=True)
    sales_tax_rate = Column(Numeric(5, 2), nullable=True)
    
    # Quality of Life Metrics
    safety_index = Column(Numeric(5, 2), nullable=True)  # 1-10 scale
    cost_of_living_index = Column(Numeric(7, 2), nullable=True)  # Relative to national avg (100)
    quality_of_life_index = Column(Numeric(5, 2), nullable=True)  # 1-10 scale
    avg_temperature_winter = Column(Integer, nullable=True)  # Fahrenheit
    avg_temperature_summer = Column(Integer, nullable=True)  # Fahrenheit
    
    # Academic Info
    universities_count = Column(Integer, nullable=True)
    scholarship_availability = Column(String(50), nullable=True)  # "High", "Medium", "Low"
    
    # Additional Info
    public_transport_quality = Column(String(50), nullable=True)  # "Excellent", "Good", "Fair", "Poor"
    walkability_score = Column(Numeric(5, 2), nullable=True)  # 1-10 scale
    bike_friendly = Column(Boolean, default=False)
    
    # Cultural & Lifestyle
    international_student_friendly = Column(Boolean, default=True)
    cultural_diversity_index = Column(Numeric(5, 2), nullable=True)  # 1-10 scale
    nightlife_rating = Column(Numeric(5, 2), nullable=True)  # 1-10 scale
    
    # Notes & Resources
    tips_for_students = Column(Text, nullable=True)
    best_neighborhoods = Column(Text, nullable=True)
    job_market_info = Column(Text, nullable=True)
    
    # Meta
    currency = Column(String(10), default="USD")
    data_source = Column(String(200), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<CostOfLiving(id={self.id}, city={self.city}, state={self.state})>"
    
    def get_total_monthly_cost(self, lifestyle="moderate"):
        """
        Calculate total estimated monthly cost based on lifestyle
        lifestyle: "budget", "moderate", "comfortable"
        """
        # Base accommodation (shared apartment for budget, studio for moderate, 1BR for comfortable)
        if lifestyle == "budget":
            accommodation = self.shared_apartment or 0
            food = (self.groceries_monthly or 0) * 0.8 + (self.eating_out_monthly or 0) * 0.2
        elif lifestyle == "moderate":
            accommodation = self.studio_apartment or self.shared_apartment or 0
            food = (self.groceries_monthly or 0) * 0.6 + (self.eating_out_monthly or 0) * 0.4
        else:  # comfortable
            accommodation = self.one_bedroom_apartment or self.studio_apartment or 0
            food = (self.groceries_monthly or 0) * 0.4 + (self.eating_out_monthly or 0) * 0.6
        
        # Add other expenses
        transport = self.public_transit_pass or 0
        utilities = (self.electricity or 0) + (self.water or 0) + (self.internet or 0) + (self.phone or 0)
        healthcare = self.health_insurance_monthly or 0
        entertainment = (self.entertainment_monthly or 0) * (1.5 if lifestyle == "comfortable" else 1.0 if lifestyle == "moderate" else 0.5)
        other = (self.laundry_monthly or 0) + (self.personal_care_monthly or 0)
        
        total = accommodation + food + transport + utilities + healthcare + entertainment + other
        return round(float(total), 2)
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "city": self.city,
            "state": self.state,
            "country": self.country,
            "region": self.region,
            "description": self.description,
            "image_url": self.image_url,
            "population": self.population,
            "student_population": self.student_population,
            "accommodation": {
                "on_campus_dorm": {
                    "min": float(self.on_campus_dorm_min) if self.on_campus_dorm_min else None,
                    "max": float(self.on_campus_dorm_max) if self.on_campus_dorm_max else None
                },
                "shared_apartment": float(self.shared_apartment) if self.shared_apartment else None,
                "studio_apartment": float(self.studio_apartment) if self.studio_apartment else None,
                "one_bedroom_apartment": float(self.one_bedroom_apartment) if self.one_bedroom_apartment else None
            },
            "food": {
                "groceries_monthly": float(self.groceries_monthly) if self.groceries_monthly else None,
                "eating_out_monthly": float(self.eating_out_monthly) if self.eating_out_monthly else None,
                "meal_plan": float(self.meal_plan_cost) if self.meal_plan_cost else None,
                "coffee_price": float(self.coffee_price) if self.coffee_price else None
            },
            "transportation": {
                "public_transit_pass": float(self.public_transit_pass) if self.public_transit_pass else None,
                "car_insurance": float(self.car_insurance) if self.car_insurance else None,
                "gas_monthly": float(self.gas_monthly) if self.gas_monthly else None,
                "bike_sharing": float(self.bike_sharing) if self.bike_sharing else None,
                "uber_avg_ride": float(self.uber_avg_ride) if self.uber_avg_ride else None,
                "quality": self.public_transport_quality
            },
            "utilities": {
                "electricity": float(self.electricity) if self.electricity else None,
                "water": float(self.water) if self.water else None,
                "internet": float(self.internet) if self.internet else None,
                "phone": float(self.phone) if self.phone else None
            },
            "healthcare": {
                "insurance_monthly": float(self.health_insurance_monthly) if self.health_insurance_monthly else None,
                "dental_insurance": float(self.dental_insurance_monthly) if self.dental_insurance_monthly else None,
                "doctor_visit_avg": float(self.doctor_visit_avg) if self.doctor_visit_avg else None
            },
            "other_expenses": {
                "books_supplies_semester": float(self.books_supplies_semester) if self.books_supplies_semester else None,
                "entertainment_monthly": float(self.entertainment_monthly) if self.entertainment_monthly else None,
                "gym_membership": float(self.gym_membership) if self.gym_membership else None,
                "laundry_monthly": float(self.laundry_monthly) if self.laundry_monthly else None,
                "personal_care_monthly": float(self.personal_care_monthly) if self.personal_care_monthly else None
            },
            "visa_immigration": {
                "visa_fee": float(self.visa_application_fee) if self.visa_application_fee else None,
                "sevis_fee": float(self.sevis_fee) if self.sevis_fee else None
            },
            "part_time_work": {
                "avg_hourly_wage": float(self.avg_hourly_wage) if self.avg_hourly_wage else None,
                "min_wage": float(self.min_wage) if self.min_wage else None,
                "max_hours_week": self.max_work_hours_week
            },
            "taxes": {
                "state_tax_rate": float(self.state_tax_rate) if self.state_tax_rate else None,
                "sales_tax_rate": float(self.sales_tax_rate) if self.sales_tax_rate else None
            },
            "quality_of_life": {
                "safety_index": float(self.safety_index) if self.safety_index else None,
                "cost_of_living_index": float(self.cost_of_living_index) if self.cost_of_living_index else None,
                "quality_index": float(self.quality_of_life_index) if self.quality_of_life_index else None,
                "winter_temp": self.avg_temperature_winter,
                "summer_temp": self.avg_temperature_summer,
                "walkability_score": float(self.walkability_score) if self.walkability_score else None,
                "bike_friendly": self.bike_friendly,
                "cultural_diversity": float(self.cultural_diversity_index) if self.cultural_diversity_index else None,
                "nightlife_rating": float(self.nightlife_rating) if self.nightlife_rating else None
            },
            "academic": {
                "universities_count": self.universities_count,
                "scholarship_availability": self.scholarship_availability,
                "international_student_friendly": self.international_student_friendly
            },
            "additional_info": {
                "tips": self.tips_for_students,
                "best_neighborhoods": self.best_neighborhoods,
                "job_market": self.job_market_info
            },
            "estimated_costs": {
                "budget": self.get_total_monthly_cost("budget"),
                "moderate": self.get_total_monthly_cost("moderate"),
                "comfortable": self.get_total_monthly_cost("comfortable")
            },
            "currency": self.currency,
            "last_updated": self.updated_at.isoformat() if self.updated_at else None
        }
