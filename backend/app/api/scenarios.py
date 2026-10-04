import math
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import District, Occupation, MonthlyPanel, Forecast, SkillGap
from app.schemas.schemas import APIResponse, ScenarioSimulateRequest, ScenarioSimulateResponse
from app.core.config import CONFIG

router = APIRouter(prefix="/scenarios", tags=["scenarios"])

@router.post("/simulate", response_model=APIResponse[ScenarioSimulateResponse])
def simulate_scenario(payload: ScenarioSimulateRequest, db: Session = Depends(get_db)):
    dist = db.query(District).filter(District.id == payload.district_id).first()
    occ = db.query(Occupation).filter(Occupation.id == payload.occupation_id).first()
    if not dist or not occ:
        raise HTTPException(status_code=404, detail="District or Occupation not found")

    p = db.query(MonthlyPanel).filter(
        MonthlyPanel.district_id == payload.district_id,
        MonthlyPanel.occupation_id == payload.occupation_id,
        MonthlyPanel.month == "2026-09"
    ).first()

    fc = db.query(Forecast).filter(
        Forecast.district_id == payload.district_id,
        Forecast.occupation_id == payload.occupation_id,
        Forecast.horizon_months == 6
    ).first()

    sg = db.query(SkillGap).filter(
        SkillGap.district_id == payload.district_id,
        SkillGap.occupation_id == payload.occupation_id,
        SkillGap.month == "2026-09"
    ).first()

    curr_seats = p.seats if p else 600.0
    curr_supply = p.certified if p else 450.0
    forecast_demand = fc.demand_forecast if fc else (p.demand * 1.15 if p else 800.0)

    avg_centre_seats = CONFIG.get("simulator", {}).get("avg_centre_seats", 120)

    # Calculate new seats
    seat_mult = (1.0 + payload.seat_change_pct / 100.0)
    net_centres_seats = (payload.added_centres - payload.removed_centres) * avg_centre_seats
    new_seats = max(10.0, curr_seats * seat_mult + net_centres_seats)

    # Base completion & certification rates
    base_comp = (p.enrolled / max(1.0, p.seats)) if p else 0.95
    base_cert = (p.certified / max(1.0, p.enrolled)) if p else 0.88
    completion_rate_prime = np_clip = max(0.50, min(1.0, base_comp + payload.completion_rate_delta / 100.0))

    new_supply = new_seats * completion_rate_prime * base_cert

    orig_gap = forecast_demand - curr_supply
    new_gap = forecast_demand - new_supply

    orig_gap_pct = orig_gap / max(1.0, forecast_demand)
    new_gap_pct = new_gap / max(1.0, forecast_demand)

    def classify(gp_pct):
        if gp_pct >= 0.30:
            return "Critical Shortage"
        elif gp_pct >= 0.15:
            return "Shortage"
        elif gp_pct > -0.15:
            return "Balanced"
        elif gp_pct > -0.30:
            return "Oversupply"
        else:
            return "Saturation Risk"

    orig_cls = sg.classification if sg else classify(orig_gap_pct)
    new_cls = classify(new_gap_pct)

    # Estimate months to close gap
    months_to_close = None
    if orig_gap > 0 and new_gap < orig_gap:
        gap_reduction_rate = (curr_supply - new_supply) / 6.0 # 6 month horizon
        if gap_reduction_rate != 0:
            months_to_close = max(3, min(24, int(abs(orig_gap / gap_reduction_rate))))
        else:
            months_to_close = 6

    lag_warning = (
        "Training Course Lag Assumption: Capacity changes require 2 quarters (6 months) "
        "to produce certified, job-ready graduates due to course duration."
    )

    direction_text = "reduces" if new_gap < orig_gap else "widens"
    summary_text = (
        f"Simulated policy intervention on {occ.name} in {dist.name}: "
        f"Increasing sanctioned capacity from {int(curr_seats)} to {int(new_seats)} seats "
        f"{direction_text} the projected 6-month skill deficit from {int(orig_gap)} to {int(new_gap)} professionals. "
        f"Status shifts from '{orig_cls}' to '{new_cls}'."
    )

    res = ScenarioSimulateResponse(
        district_name=dist.name,
        occupation_name=occ.name,
        current_seats=float(curr_seats),
        new_seats=float(new_seats),
        current_supply=float(curr_supply),
        new_supply=float(round(new_supply, 1)),
        forecast_demand=float(round(forecast_demand, 1)),
        original_gap=float(round(orig_gap, 1)),
        new_gap=float(round(new_gap, 1)),
        original_gap_pct=float(round(orig_gap_pct * 100, 1)),
        new_gap_pct=float(round(new_gap_pct * 100, 1)),
        original_class=orig_cls,
        new_class=new_cls,
        months_to_close=months_to_close,
        lag_warning=lag_warning,
        summary_text=summary_text
    )
    return APIResponse(data=res)
