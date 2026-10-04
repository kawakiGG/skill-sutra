import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, JSON, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="national_planner") # national_planner or state_planner
    state_id = Column(Integer, ForeignKey("states.id"), nullable=True)

    state = relationship("State", back_populates="users")

class State(Base):
    __tablename__ = "states"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    code = Column(String, unique=True, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    districts = relationship("District", back_populates="state")
    users = relationship("User", back_populates="state")

class District(Base):
    __tablename__ = "districts"
    id = Column(Integer, primary_key=True, index=True)
    state_id = Column(Integer, ForeignKey("states.id"), nullable=False)
    name = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    state = relationship("State", back_populates="districts")
    training_centres = relationship("TrainingCentre", back_populates="district")

class Sector(Base):
    __tablename__ = "sectors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    code = Column(String, unique=True, nullable=False)

    occupations = relationship("Occupation", back_populates="sector")

class Occupation(Base):
    __tablename__ = "occupations"
    id = Column(Integer, primary_key=True, index=True)
    sector_id = Column(Integer, ForeignKey("sectors.id"), nullable=False)
    name = Column(String, nullable=False)
    nco_code = Column(String, nullable=False)
    strategic_importance = Column(Float, default=0.5)

    sector = relationship("Sector", back_populates="occupations")

class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category = Column(String, default="Technical")

class OccupationSkill(Base):
    __tablename__ = "occupation_skills"
    id = Column(Integer, primary_key=True, index=True)
    occupation_id = Column(Integer, ForeignKey("occupations.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    frequency = Column(Float, default=1.0)

class TrainingCentre(Base):
    __tablename__ = "training_centres"
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, default="Government ITI")
    capacity = Column(Integer, default=120)

    district = relationship("District", back_populates="training_centres")

class TrainingCapacity(Base):
    __tablename__ = "training_capacity"
    id = Column(Integer, primary_key=True, index=True)
    centre_id = Column(Integer, ForeignKey("training_centres.id"), nullable=False)
    occupation_id = Column(Integer, ForeignKey("occupations.id"), nullable=False)
    seats = Column(Integer, nullable=False)
    period = Column(String, nullable=False) # e.g. 2026-Q1

class MonthlyPanel(Base):
    __tablename__ = "monthly_panel"
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    occupation_id = Column(Integer, ForeignKey("occupations.id"), nullable=False)
    month = Column(String, nullable=False) # YYYY-MM
    demand = Column(Float, nullable=False)
    seats = Column(Float, nullable=False)
    enrolled = Column(Float, nullable=False)
    certified = Column(Float, nullable=False)
    placed = Column(Float, nullable=False)
    avg_salary = Column(Float, default=25000.0)
    computed_at = Column(DateTime, default=datetime.datetime.utcnow)
    dataset_version = Column(String, default="v1.0-synthetic")

    __table_args__ = (
        Index("idx_panel_district_occ_month", "district_id", "occupation_id", "month"),
    )

class JobPosting(Base):
    __tablename__ = "job_postings"
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    occupation_id = Column(Integer, ForeignKey("occupations.id"), nullable=True)
    title = Column(String, nullable=False)
    raw_title = Column(String, nullable=False)
    company = Column(String, default="Unknown Corp")
    salary = Column(Float, nullable=True)
    posted_date = Column(String, nullable=False)

class DemandIndex(Base):
    __tablename__ = "demand_indices"
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    occupation_id = Column(Integer, ForeignKey("occupations.id"), nullable=False)
    month = Column(String, nullable=False)
    ldi_score = Column(Float, nullable=False)
    band = Column(String, nullable=False)
    volume_norm = Column(Float, nullable=False)
    growth_norm = Column(Float, nullable=False)
    skill_freq_norm = Column(Float, nullable=False)
    computed_at = Column(DateTime, default=datetime.datetime.utcnow)

class SupplyIndex(Base):
    __tablename__ = "supply_indices"
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    occupation_id = Column(Integer, ForeignKey("occupations.id"), nullable=False)
    month = Column(String, nullable=False)
    lsi_score = Column(Float, nullable=False)
    band = Column(String, nullable=False)
    capacity_norm = Column(Float, nullable=False)
    certified_norm = Column(Float, nullable=False)
    completion_rate_norm = Column(Float, nullable=False)
    computed_at = Column(DateTime, default=datetime.datetime.utcnow)

class Forecast(Base):
    __tablename__ = "forecasts"
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    occupation_id = Column(Integer, ForeignKey("occupations.id"), nullable=False)
    horizon_months = Column(Integer, nullable=False) # 3, 6, 12
    demand_forecast = Column(Float, nullable=False)
    supply_forecast = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=False)
    upper_bound = Column(Float, nullable=False)
    model_name = Column(String, nullable=False)
    mape = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    confidence_label = Column(String, nullable=False) # High, Medium, Low
    trained_at = Column(DateTime, default=datetime.datetime.utcnow)
    dataset_version = Column(String, default="v1.0-synthetic")

    __table_args__ = (
        Index("idx_forecast_dist_occ_horiz", "district_id", "occupation_id", "horizon_months"),
    )

class ForecastModel(Base):
    __tablename__ = "forecast_models"
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, nullable=False)
    sector_id = Column(Integer, ForeignKey("sectors.id"), nullable=True)
    training_period = Column(String, nullable=False)
    sample_size = Column(Integer, nullable=False)
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    mape = Column(Float, nullable=False)
    baseline_mape = Column(Float, nullable=False)
    beats_baseline = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class SkillGap(Base):
    __tablename__ = "skill_gaps"
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    occupation_id = Column(Integer, ForeignKey("occupations.id"), nullable=False)
    month = Column(String, nullable=False)
    gap = Column(Float, nullable=False)
    gap_pct = Column(Float, nullable=False)
    classification = Column(String, nullable=False)
    trajectory_flag = Column(String, default="Stable")
    priority_score = Column(Float, nullable=False)
    computed_at = Column(DateTime, default=datetime.datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    occupation_id = Column(Integer, ForeignKey("occupations.id"), nullable=False)
    alert_type = Column(String, nullable=False) # shortage, saturation, emerging, regional_imbalance
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String, default="high") # high, medium, low
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    occupation_id = Column(Integer, ForeignKey("occupations.id"), nullable=False)
    priority_score = Column(Float, nullable=False)
    recommended_increase_pct_min = Column(Float, nullable=False)
    recommended_increase_pct_max = Column(Float, nullable=False)
    reasons_json = Column(JSON, nullable=False)
    confidence_label = Column(String, default="High")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Scenario(Base):
    __tablename__ = "scenarios"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    parameters_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ScenarioResult(Base):
    __tablename__ = "scenario_results"
    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(Integer, ForeignKey("scenarios.id"), nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    occupation_id = Column(Integer, ForeignKey("occupations.id"), nullable=False)
    original_gap = Column(Float, nullable=False)
    new_gap = Column(Float, nullable=False)
    original_class = Column(String, nullable=False)
    new_class = Column(String, nullable=False)
    months_to_close = Column(Integer, nullable=True)
    computed_at = Column(DateTime, default=datetime.datetime.utcnow)

class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    row_count = Column(Integer, default=0)
    status = Column(String, default="processed")
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

class DataQualityReport(Base):
    __tablename__ = "data_quality_reports"
    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    overall_score = Column(Float, nullable=False)
    null_rate = Column(Float, nullable=False)
    duplicate_rate = Column(Float, nullable=False)
    invalid_geo_count = Column(Integer, default=0)
    invalid_nco_count = Column(Integer, default=0)
    details_json = Column(JSON, nullable=False)
    evaluated_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    target = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
