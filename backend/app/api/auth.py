from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User
from app.schemas.schemas import APIResponse, UserLogin, UserResponse, MetaData

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=APIResponse[UserResponse])
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or user.password_hash != payload.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    resp_data = UserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        state_id=user.state_id
    )
    return APIResponse(data=resp_data)

@router.get("/me", response_model=APIResponse[UserResponse])
def me(email: str = "national.planner@skillsutra.gov.in", db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(id=1, email=email, role="national_planner")
    
    resp_data = UserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        state_id=user.state_id
    )
    return APIResponse(data=resp_data)
