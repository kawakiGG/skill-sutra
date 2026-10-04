from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import SkillGap, District, State, Occupation, Sector, MonthlyPanel
from app.schemas.schemas import APIResponse, GapItem

router = APIRouter(prefix="/gaps", tags=["gaps"])

def build_gap_items(gaps: List[SkillGap], db: Session) -> List[GapItem]:
    dists = {d.id: d for d in db.query(District).all()}
    states = {s.id: s.name for s in db.query(State).all()}
    occs = {o.id: o for o in db.query(Occupation).all()}
    secs = {sec.id: sec.name for sec in db.query(Sector).all()}

    # Get latest panel data for monthly demand/supply numbers
    latest_panel = {}
    for p in db.query(MonthlyPanel).filter(MonthlyPanel.month == "2026-09").all():
        latest_panel[(p.district_id, p.occupation_id)] = p

    res = []
    for g in gaps:
        d = dists.get(g.district_id)
        o = occs.get(g.occupation_id)
        p = latest_panel.get((g.district_id, g.occupation_id))

        if not d or not o:
            continue

        st_name = states.get(d.state_id, "")
        sec_name = secs.get(o.sector_id, "")
        dem = p.demand if p else 500.0
        sup = p.certified if p else 350.0

        res.append(
            GapItem(
                district_id=g.district_id,
                district_name=d.name,
                state_name=st_name,
                occupation_id=g.occupation_id,
                occupation_name=o.name,
                sector_name=sec_name,
                nco_code=o.nco_code,
                month=g.month,
                demand=dem,
                supply=sup,
                gap=g.gap,
                gap_pct=g.gap_pct,
                classification=g.classification,
                trajectory_flag=g.trajectory_flag,
                priority_score=g.priority_score
            )
        )
    return res

def get_latest_month(db: Session) -> str:
    from sqlalchemy import func
    return db.query(func.max(SkillGap.month)).scalar() or "2026-09"

@router.get("", response_model=APIResponse[List[GapItem]])
def get_gaps(
    state_id: Optional[int] = None,
    district_id: Optional[int] = None,
    sector_id: Optional[int] = None,
    occupation_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    latest_month = get_latest_month(db)
    query = db.query(SkillGap).filter(SkillGap.month == latest_month)

    if district_id:
        query = query.filter(SkillGap.district_id == district_id)
    elif state_id:
        dist_ids = [d.id for d in db.query(District).filter(District.state_id == state_id).all()]
        query = query.filter(SkillGap.district_id.in_(dist_ids))

    if occupation_id:
        query = query.filter(SkillGap.occupation_id == occupation_id)
    elif sector_id:
        occ_ids = [o.id for o in db.query(Occupation).filter(Occupation.sector_id == sector_id).all()]
        query = query.filter(SkillGap.occupation_id.in_(occ_ids))

    gaps = query.order_by(SkillGap.priority_score.desc()).all()
    res = build_gap_items(gaps, db)
    return APIResponse(data=res)

@router.get("/top-shortages", response_model=APIResponse[List[GapItem]])
def get_top_shortages(limit: int = 10, db: Session = Depends(get_db)):
    latest_month = get_latest_month(db)
    query = db.query(SkillGap).filter(
        SkillGap.month == latest_month,
        SkillGap.gap_pct > 0.10
    ).order_by(SkillGap.priority_score.desc()).limit(limit)

    gaps = query.all()
    res = build_gap_items(gaps, db)
    return APIResponse(data=res)

@router.get("/top-saturation", response_model=APIResponse[List[GapItem]])
def get_top_saturation(limit: int = 10, db: Session = Depends(get_db)):
    latest_month = get_latest_month(db)
    query = db.query(SkillGap).filter(
        SkillGap.month == latest_month,
        SkillGap.gap_pct < -0.10
    ).order_by(SkillGap.gap_pct.asc()).limit(limit)

    gaps = query.all()
    res = build_gap_items(gaps, db)
    return APIResponse(data=res)
