from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import State, District, Sector, Occupation
from app.schemas.schemas import APIResponse, StateSchema, DistrictSchema, SectorSchema, OccupationSchema

router = APIRouter(prefix="/geo", tags=["geography"])

@router.get("/states", response_model=APIResponse[List[StateSchema]])
def get_states(db: Session = Depends(get_db)):
    states = db.query(State).all()
    res = [StateSchema(id=s.id, name=s.name, code=s.code, lat=s.lat, lng=s.lng) for s in states]
    return APIResponse(data=res)

@router.get("/districts", response_model=APIResponse[List[DistrictSchema]])
def get_districts(state_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(District)
    if state_id:
        query = query.filter(District.state_id == state_id)
    districts = query.all()
    
    st_map = {s.id: s.name for s in db.query(State).all()}
    res = [
        DistrictSchema(
            id=d.id,
            state_id=d.state_id,
            state_name=st_map.get(d.state_id, ""),
            name=d.name,
            lat=d.lat,
            lng=d.lng
        ) for d in districts
    ]
    return APIResponse(data=res)

@router.get("/sectors", response_model=APIResponse[List[SectorSchema]])
def get_sectors(db: Session = Depends(get_db)):
    sectors = db.query(Sector).all()
    res = [SectorSchema(id=s.id, name=s.name, code=s.code) for s in sectors]
    return APIResponse(data=res)

@router.get("/occupations", response_model=APIResponse[List[OccupationSchema]])
def get_occupations(sector_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Occupation)
    if sector_id:
        query = query.filter(Occupation.sector_id == sector_id)
    occs = query.all()
    
    sec_map = {s.id: s.name for s in db.query(Sector).all()}
    res = [
        OccupationSchema(
            id=o.id,
            sector_id=o.sector_id,
            sector_name=sec_map.get(o.sector_id, ""),
            name=o.name,
            nco_code=o.nco_code,
            strategic_importance=o.strategic_importance
        ) for o in occs
    ]
    return APIResponse(data=res)
