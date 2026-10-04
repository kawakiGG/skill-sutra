import io
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import SkillGap, District, State, Occupation, Sector
from app.schemas.schemas import APIResponse

router = APIRouter(prefix="/exports", tags=["exports"])

@router.get("/csv")
def export_csv(
    state_id: Optional[int] = None,
    district_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(SkillGap).filter(SkillGap.month == "2026-09")
    if district_id:
        query = query.filter(SkillGap.district_id == district_id)
    elif state_id:
        d_ids = [d.id for d in db.query(District).filter(District.state_id == state_id).all()]
        query = query.filter(SkillGap.district_id.in_(d_ids))

    gaps = query.order_by(SkillGap.priority_score.desc()).all()

    dists = {d.id: d for d in db.query(District).all()}
    states = {s.id: s.name for s in db.query(State).all()}
    occs = {o.id: o for o in db.query(Occupation).all()}
    secs = {sec.id: sec.name for sec in db.query(Sector).all()}

    lines = [
        "# SKILL SUTRA INTELLIGENCE REPORT (DEMO / SYNTHETIC DATASET)",
        f"# Export Timestamp: {datetime.datetime.utcnow().isoformat()}Z",
        "# Model Version: v1.0-synthetic | Source: Skill Sutra Intelligence Engine",
        "State,District,Sector,Occupation,NCO Code,Gap (Absolute),Gap %,Classification,Trajectory,Priority Score"
    ]

    for g in gaps:
        d = dists.get(g.district_id)
        o = occs.get(g.occupation_id)
        if d and o:
            st = states.get(d.state_id, "")
            sec = secs.get(o.sector_id, "")
            lines.append(f'"{st}","{d.name}","{sec}","{o.name}","{o.nco_code}",{g.gap},{g.gap_pct*100:.1f}%,"{g.classification}","{g.trajectory_flag}",{g.priority_score}')

    content = "\n".join(lines)
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=skill_sutra_report.csv"}
    )
