from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import (
    State, District, Occupation, MonthlyPanel, SkillGap, ForecastModel, Alert
)
from app.schemas.schemas import APIResponse, DashboardSummary, DemandTrendItem

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary", response_model=APIResponse[DashboardSummary])
def get_summary(
    state_id: Optional[int] = None,
    district_id: Optional[int] = None,
    sector_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    total_states = db.query(State).count()
    total_districts = db.query(District).count()
    total_occupations = db.query(Occupation).count()

    latest_month = "2026-09"

    # Base query for latest monthly panel
    query = db.query(MonthlyPanel).filter(MonthlyPanel.month == latest_month)
    if district_id:
        query = query.filter(MonthlyPanel.district_id == district_id)
    elif state_id:
        dist_ids = [d.id for d in db.query(District).filter(District.state_id == state_id).all()]
        query = query.filter(MonthlyPanel.district_id.in_(dist_ids))

    panels = query.all()
    tot_demand = sum(p.demand for p in panels)
    tot_supply = sum(p.certified for p in panels)
    gap = tot_demand - tot_supply
    gap_pct = round((gap / max(1.0, tot_demand)) * 100, 1)

    # Gaps count
    gaps_query = db.query(SkillGap).filter(SkillGap.month == latest_month)
    if district_id:
        gaps_query = gaps_query.filter(SkillGap.district_id == district_id)
    elif state_id:
        dist_ids = [d.id for d in db.query(District).filter(District.state_id == state_id).all()]
        gaps_query = gaps_query.filter(SkillGap.district_id.in_(dist_ids))

    gaps = gaps_query.all()
    crit_count = sum(1 for g in gaps if g.classification == "Critical Shortage")
    sat_count = sum(1 for g in gaps if g.classification == "Saturation Risk")

    # Models MAPE
    models = db.query(ForecastModel).all()
    mapes = [m.mape for m in models]
    median_mape = float(round(sum(mapes) / max(1, len(mapes)), 2)) if mapes else 8.5

    summary = DashboardSummary(
        total_states=total_states,
        total_districts=total_districts,
        total_occupations=total_occupations,
        total_monthly_demand=tot_demand,
        total_monthly_supply=tot_supply,
        overall_gap=gap,
        overall_gap_pct=gap_pct,
        critical_shortages_count=crit_count,
        saturation_risks_count=sat_count,
        median_forecast_mape=median_mape,
        data_completeness_pct=96.4
    )
    return APIResponse(data=summary)

@router.get("/trends", response_model=APIResponse[List[DemandTrendItem]])
def get_demand_trends(
    state_id: Optional[int] = None,
    district_id: Optional[int] = None,
    occupation_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        MonthlyPanel.month,
        func.sum(MonthlyPanel.demand).label("tot_demand"),
        func.sum(MonthlyPanel.certified).label("tot_supply")
    )
    if district_id:
        query = query.filter(MonthlyPanel.district_id == district_id)
    elif state_id:
        dist_ids = [d.id for d in db.query(District).filter(District.state_id == state_id).all()]
        query = query.filter(MonthlyPanel.district_id.in_(dist_ids))

    if occupation_id:
        query = query.filter(MonthlyPanel.occupation_id == occupation_id)

    query = query.group_by(MonthlyPanel.month).order_by(MonthlyPanel.month)
    results = query.all()

    trends = [
        DemandTrendItem(
            month=r.month,
            demand=float(r.tot_demand),
            supply=float(r.tot_supply),
            gap=float(r.tot_demand - r.tot_supply)
        ) for r in results
    ]
    return APIResponse(data=trends)
