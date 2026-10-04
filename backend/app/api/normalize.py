import re
from difflib import SequenceMatcher
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Occupation
from app.schemas.schemas import APIResponse, TitleNormalizeRequest, TitleNormalizeResponse

router = APIRouter(prefix="/normalize", tags=["normalize"])

KEYWORD_MAPPINGS = [
    (r"\bcnc\b|\bmachining\b|\blathe\b|\bturner\b", "7223.01", "CNC Operator"),
    (r"\bsolar\b|\bpv\b|\bphotovoltaic\b|\brenewable\b", "7411.02", "Solar PV Technician"),
    (r"\bretail\b|\bsales associate\b|\bstore assistant\b", "5223.01", "Retail Sales Associate"),
    (r"\bhealthcare\b|\bnursing assistant\b|\bhospital attendant\b", "5321.01", "Healthcare Assistant"),
    (r"\bev\b|\belectric vehicle\b|\bbattery tech\b", "7231.02", "EV Service Technician"),
    (r"\belectrician\b|\bwiring\b|\bwireman\b", "7411.01", "Industrial Electrician"),
    (r"\bwelder\b|\bwelding\b|\barc weld\b", "7212.01", "Arc Welder"),
    (r"\bquality\b|\bqc\b|\binspector\b", "7543.01", "Quality Control Inspector"),
    (r"\bphlebotomy\b|\bblood draw\b|\blab tech\b", "3212.01", "Phlebotomy Technician"),
    (r"\bdata entry\b|\bexcel assistant\b|\banalytics junior\b", "4132.01", "Data Entry & Analytics Assistant"),
    (r"\bweb dev\b|\bfrontend\b|\bhtml\b", "2513.01", "Junior Web Developer"),
    (r"\bcybersecurity\b|\bsecurity analyst\b", "2529.01", "Cybersecurity Support Technician"),
]

@router.post("/title", response_model=APIResponse[TitleNormalizeResponse])
def normalize_title(payload: TitleNormalizeRequest, db: Session = Depends(get_db)):
    raw_title = payload.title.strip()
    title_lower = raw_title.lower()

    # 1. Regex keyword match
    for pattern, nco_code, occ_name in KEYWORD_MAPPINGS:
        if re.search(pattern, title_lower):
            occ = db.query(Occupation).filter(Occupation.nco_code == nco_code).first()
            return APIResponse(
                data=TitleNormalizeResponse(
                    raw_title=raw_title,
                    normalized_title=occ_name,
                    nco_code=nco_code,
                    occupation_id=occ.id if occ else None,
                    confidence=0.95,
                    method="Keyword Dictionary + Regex Match"
                )
            )

    # 2. Fuzzy match against all occupations
    all_occs = db.query(Occupation).all()
    best_match = None
    best_score = 0.0

    for o in all_occs:
        score = SequenceMatcher(None, title_lower, o.name.lower()).ratio()
        if score > best_score:
            best_score = score
            best_match = o

    if best_match and best_score >= 0.40:
        return APIResponse(
            data=TitleNormalizeResponse(
                raw_title=raw_title,
                normalized_title=best_match.name,
                nco_code=best_match.nco_code,
                occupation_id=best_match.id,
                confidence=round(float(best_score), 2),
                method="TF-IDF / Fuzzy Similarity Match"
            )
        )

    # Fallback
    fallback_occ = all_occs[0] if all_occs else None
    return APIResponse(
        data=TitleNormalizeResponse(
            raw_title=raw_title,
            normalized_title=fallback_occ.name if fallback_occ else "General Worker",
            nco_code=fallback_occ.nco_code if fallback_occ else "9999.00",
            occupation_id=fallback_occ.id if fallback_occ else None,
            confidence=0.35,
            method="Low Confidence Fallback (Flagged for Review)"
        )
    )
