from typing import Generic, TypeVar, Optional, Any, List
from pydantic import BaseModel, Field
import datetime

T = TypeVar("T")

class MetaData(BaseModel):
    updated_at: str = Field(default_factory=lambda: datetime.datetime.utcnow().isoformat() + "Z")
    source: str = "Skill Sutra Calibrated Intelligence Engine"
    version: str = "1.0.0"
    is_synthetic: bool = True

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    meta: MetaData = Field(default_factory=MetaData)

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    state_id: Optional[int] = None

class StateSchema(BaseModel):
    id: int
    name: str
    code: str
    lat: float
    lng: float

class DistrictSchema(BaseModel):
    id: int
    state_id: int
    state_name: Optional[str] = None
    name: str
    lat: float
    lng: float

class SectorSchema(BaseModel):
    id: int
    name: str
    code: str

class OccupationSchema(BaseModel):
    id: int
    sector_id: int
    sector_name: Optional[str] = None
    name: str
    nco_code: str
    strategic_importance: float

class DashboardSummary(BaseModel):
    total_states: int
    total_districts: int
    total_occupations: int
    total_monthly_demand: float
    total_monthly_supply: float
    overall_gap: float
    overall_gap_pct: float
    critical_shortages_count: int
    saturation_risks_count: int
    median_forecast_mape: float
    data_completeness_pct: float

class DemandTrendItem(BaseModel):
    month: str
    demand: float
    supply: float
    gap: float

class GapItem(BaseModel):
    district_id: int
    district_name: str
    state_name: str
    occupation_id: int
    occupation_name: str
    sector_name: str
    nco_code: str
    month: str
    demand: float
    supply: float
    gap: float
    gap_pct: float
    classification: str
    trajectory_flag: str
    priority_score: float

class ForecastItem(BaseModel):
    occupation_id: int
    occupation_name: str
    district_id: int
    district_name: str
    horizon_months: int
    current_demand: float
    current_supply: float
    demand_forecast: float
    supply_forecast: float
    lower_bound: float
    upper_bound: float
    model_name: str
    mape: float
    rmse: float
    confidence_label: str
    trained_at: str

class KeyDriverItem(BaseModel):
    factor: str
    impact_pct: float
    direction: str # positive, negative
    description: str

class ForecastMethodology(BaseModel):
    model_name: str
    training_period: str
    sample_size: int
    sector_name: Optional[str] = None
    mae: float
    rmse: float
    mape: float
    baseline_mape: float
    beats_baseline: bool
    confidence_label: str

class AlertItem(BaseModel):
    id: int
    district_id: int
    district_name: str
    state_name: str
    occupation_id: int
    occupation_name: str
    alert_type: str
    title: str
    description: str
    severity: str
    created_at: str

class RecommendationItem(BaseModel):
    id: int
    district_id: int
    district_name: str
    state_name: str
    occupation_id: int
    occupation_name: str
    nco_code: str
    priority_score: float
    recommended_increase_pct_min: float
    recommended_increase_pct_max: float
    reasons: List[str]
    confidence_label: str

class ScenarioSimulateRequest(BaseModel):
    district_id: int
    occupation_id: int
    seat_change_pct: float = 0.0
    added_centres: int = 0
    removed_centres: int = 0
    completion_rate_delta: float = 0.0

class ScenarioSimulateResponse(BaseModel):
    district_name: str
    occupation_name: str
    current_seats: float
    new_seats: float
    current_supply: float
    new_supply: float
    forecast_demand: float
    original_gap: float
    new_gap: float
    original_gap_pct: float
    new_gap_pct: float
    original_class: str
    new_class: str
    months_to_close: Optional[int]
    lag_warning: str
    summary_text: str

class MapMetricItem(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    lat: float
    lng: float
    demand: float
    supply: float
    gap: float
    gap_pct: float
    growth_pct: float
    coverage_pct: float
    classification: str
    color: str

class DataUploadResponse(BaseModel):
    dataset_id: int
    filename: str
    row_count: int
    quality_score: float
    null_rate: float
    duplicate_rate: float
    details: dict

class TitleNormalizeRequest(BaseModel):
    title: str

class TitleNormalizeResponse(BaseModel):
    raw_title: str
    normalized_title: str
    nco_code: str
    occupation_id: Optional[int]
    confidence: float
    method: str
