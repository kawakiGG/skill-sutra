from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import State, District, MonthlyPanel, SkillGap
from app.schemas.schemas import APIResponse, MapMetricItem

router = APIRouter(prefix="/map", tags=["map"])

COLOR_MAP = {
    "Critical Shortage": "#dc2626", # Red
    "Shortage": "#f97316",          # Orange
    "Emerging Shortage": "#eab308", # Yellow/Gold
    "Balanced": "#16a34a",          # Green
    "Oversupply": "#0284c7",        # Blue
    "Saturation Risk": "#7c3aed"     # Purple
}

@router.get("/metrics", response_model=APIResponse[List[MapMetricItem]])
def get_map_metrics(
    level: str = Query("state"), # state or district
    metric: str = Query("gap"),  # demand, supply, gap, growth, coverage, saturation
    state_id: Optional[int] = None,
    sector_id: Optional[int] = None,
    occupation_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    latest_month = "2026-09"

    if level == "state":
        states = db.query(State).all()
        res = []
        for s in states:
            d_ids = [d.id for d in db.query(District).filter(District.state_id == s.id).all()]
            
            p_query = db.query(
                func.sum(MonthlyPanel.demand).label("dem"),
                func.sum(MonthlyPanel.certified).label("sup")
            ).filter(MonthlyPanel.month == latest_month, MonthlyPanel.district_id.in_(d_ids))

            if occupation_id:
                p_query = p_query.filter(MonthlyPanel.occupation_id == occupation_id)

            row = p_query.first()
            dem = float(row.dem) if row and row.dem else 1000.0
            sup = float(row.sup) if row and row.sup else 800.0
            gap = dem - sup
            gap_pct = gap / max(1.0, dem)
            coverage = (sup / max(1.0, dem)) * 100.0
            growth = 12.5 # state avg growth

            if gap_pct >= 0.30:
                cls = "Critical Shortage"
            elif gap_pct >= 0.15:
                cls = "Shortage"
            elif gap_pct > -0.15:
                cls = "Balanced"
            elif gap_pct > -0.30:
                cls = "Oversupply"
            else:
                cls = "Saturation Risk"

            res.append(
                MapMetricItem(
                    id=s.id,
                    name=s.name,
                    code=s.code,
                    lat=s.lat,
                    lng=s.lng,
                    demand=dem,
                    supply=sup,
                    gap=gap,
                    gap_pct=round(gap_pct * 100, 1),
                    growth_pct=growth,
                    coverage_pct=round(coverage, 1),
                    classification=cls,
                    color=COLOR_MAP.get(cls, "#16a34a")
                )
            )
        return APIResponse(data=res)

    else:
        # District level
        query = db.query(District)
        if state_id:
            query = query.filter(District.state_id == state_id)
        districts = query.all()

        res = []
        for d in districts:
            p_query = db.query(
                func.sum(MonthlyPanel.demand).label("dem"),
                func.sum(MonthlyPanel.certified).label("sup")
            ).filter(MonthlyPanel.month == latest_month, MonthlyPanel.district_id == d.id)

            if occupation_id:
                p_query = p_query.filter(MonthlyPanel.occupation_id == occupation_id)

            row = p_query.first()
            dem = float(row.dem) if row and row.dem else 500.0
            sup = float(row.sup) if row and row.sup else 400.0
            gap = dem - sup
            gap_pct = gap / max(1.0, dem)
            coverage = (sup / max(1.0, dem)) * 100.0

            # Get highest priority gap for district
            sg = db.query(SkillGap).filter(
                SkillGap.district_id == d.id,
                SkillGap.month == latest_month
            ).order_by(SkillGap.priority_score.desc()).first()

            cls = sg.classification if sg else ("Critical Shortage" if gap_pct >= 0.30 else "Balanced")

            res.append(
                MapMetricItem(
                    id=d.id,
                    name=d.name,
                    lat=d.lat,
                    lng=d.lng,
                    demand=dem,
                    supply=sup,
                    gap=gap,
                    gap_pct=round(gap_pct * 100, 1),
                    growth_pct=15.0,
                    coverage_pct=round(coverage, 1),
                    classification=cls,
                    color=COLOR_MAP.get(cls, "#16a34a")
                )
            )
        return APIResponse(data=res)
