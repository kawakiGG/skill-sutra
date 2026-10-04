from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Alert, Recommendation, District, State, Occupation, Sector
from app.schemas.schemas import APIResponse, AlertItem, RecommendationItem

router = APIRouter(prefix="", tags=["intelligence"])

@router.get("/alerts", response_model=APIResponse[List[AlertItem]])
def get_alerts(
    severity: Optional[str] = None,
    state_id: Optional[int] = None,
    district_id: Optional[int] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(Alert).filter(Alert.is_active == True)
    if severity:
        query = query.filter(Alert.severity == severity)
    if district_id:
        query = query.filter(Alert.district_id == district_id)
    elif state_id:
        d_ids = [d.id for d in db.query(District).filter(District.state_id == state_id).all()]
        query = query.filter(Alert.district_id.in_(d_ids))

    alerts = query.order_by(Alert.id.desc()).limit(limit).all()

    dists = {d.id: d for d in db.query(District).all()}
    states = {s.id: s.name for s in db.query(State).all()}
    occs = {o.id: o.name for o in db.query(Occupation).all()}

    res = []
    for a in alerts:
        d = dists.get(a.district_id)
        st_name = states.get(d.state_id, "") if d else ""
        o_name = occs.get(a.occupation_id, "")

        res.append(
            AlertItem(
                id=a.id,
                district_id=a.district_id,
                district_name=d.name if d else "",
                state_name=st_name,
                occupation_id=a.occupation_id,
                occupation_name=o_name,
                alert_type=a.alert_type,
                title=a.title,
                description=a.description,
                severity=a.severity,
                created_at=a.created_at.isoformat()
            )
        )
    return APIResponse(data=res)

@router.get("/recommendations", response_model=APIResponse[List[RecommendationItem]])
def get_recommendations(
    state_id: Optional[int] = None,
    district_id: Optional[int] = None,
    sector_id: Optional[int] = None,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(Recommendation)
    if district_id:
        query = query.filter(Recommendation.district_id == district_id)
    elif state_id:
        d_ids = [d.id for d in db.query(District).filter(District.state_id == state_id).all()]
        query = query.filter(Recommendation.district_id.in_(d_ids))

    if sector_id:
        o_ids = [o.id for o in db.query(Occupation).filter(Occupation.sector_id == sector_id).all()]
        query = query.filter(Recommendation.occupation_id.in_(o_ids))

    recs = query.order_by(Recommendation.priority_score.desc()).limit(limit).all()

    dists = {d.id: d for d in db.query(District).all()}
    states = {s.id: s.name for s in db.query(State).all()}
    occs = {o.id: o for o in db.query(Occupation).all()}

    res = []
    for r in recs:
        d = dists.get(r.district_id)
        st_name = states.get(d.state_id, "") if d else ""
        o = occs.get(r.occupation_id)

        res.append(
            RecommendationItem(
                id=r.id,
                district_id=r.district_id,
                district_name=d.name if d else "",
                state_name=st_name,
                occupation_id=r.occupation_id,
                occupation_name=o.name if o else "",
                nco_code=o.nco_code if o else "",
                priority_score=r.priority_score,
                recommended_increase_pct_min=r.recommended_increase_pct_min,
                recommended_increase_pct_max=r.recommended_increase_pct_max,
                reasons=r.reasons_json if isinstance(r.reasons_json, list) else [],
                confidence_label=r.confidence_label
            )
        )
    return APIResponse(data=res)
