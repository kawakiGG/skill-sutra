import os
import shutil
import pandas as pd
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Dataset, DataQualityReport, District, Occupation
from app.schemas.schemas import APIResponse, DataUploadResponse

router = APIRouter(prefix="/datasets", tags=["datasets"])

UPLOAD_DIR = "/tmp/skill_sutra_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=APIResponse[DataUploadResponse])
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not (file.filename.endswith(".csv") or file.filename.endswith(".xlsx")):
        raise HTTPException(status_code=400, detail="Invalid file format. Upload CSV or XLSX.")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    row_count = len(df)
    null_cells = df.isnull().sum().sum()
    total_cells = max(1, df.size)
    null_rate = float(round(null_cells / total_cells, 4))
    dup_rate = float(round(df.duplicated().sum() / max(1, row_count), 4))

    # Evaluate geography and NCO codes if present
    dists = {d.name.lower() for d in db.query(District).all()}
    occs = {o.nco_code for o in db.query(Occupation).all()}

    invalid_geo = 0
    invalid_nco = 0

    col_names = [c.lower() for c in df.columns]
    geo_col = next((c for c in df.columns if "district" in c.lower() or "city" in c.lower() or "location" in c.lower()), None)
    nco_col = next((c for c in df.columns if "nco" in c.lower() or "code" in c.lower()), None)

    if geo_col:
        invalid_geo = int(df[geo_col].apply(lambda x: 0 if str(x).lower() in dists else 1).sum())
    if nco_col:
        invalid_nco = int(df[nco_col].apply(lambda x: 0 if str(x) in occs else 1).sum())

    # Quality score formula (0-100)
    score = 100.0 - (null_rate * 30.0 + dup_rate * 30.0 + (invalid_geo / max(1, row_count)) * 20.0 + (invalid_nco / max(1, row_count)) * 20.0) * 100.0
    quality_score = float(round(max(0.0, min(100.0, score)), 1))

    ds = Dataset(
        name=file.filename,
        file_path=file_path,
        row_count=row_count,
        status="processed"
    )
    db.add(ds)
    db.flush()

    qr = DataQualityReport(
        dataset_id=ds.id,
        overall_score=quality_score,
        null_rate=null_rate,
        duplicate_rate=dup_rate,
        invalid_geo_count=invalid_geo,
        invalid_nco_count=invalid_nco,
        details_json={
            "columns": list(df.columns),
            "detected_geo_column": geo_col,
            "detected_nco_column": nco_col,
            "sample_rows": df.head(3).to_dict(orient="records")
        }
    )
    db.add(qr)
    db.commit()

    res = DataUploadResponse(
        dataset_id=ds.id,
        filename=file.filename,
        row_count=row_count,
        quality_score=quality_score,
        null_rate=null_rate,
        duplicate_rate=dup_rate,
        details=qr.details_json
    )
    return APIResponse(data=res)

@router.get("", response_model=APIResponse[List[dict]])
def get_datasets(db: Session = Depends(get_db)):
    datasets = db.query(Dataset).all()
    res = [
        {
            "id": d.id,
            "name": d.name,
            "row_count": d.row_count,
            "status": d.status,
            "uploaded_at": d.uploaded_at.isoformat()
        } for d in datasets
    ]
    return APIResponse(data=res)

@router.get("/{id}/quality", response_model=APIResponse[dict])
def get_dataset_quality(id: int, db: Session = Depends(get_db)):
    qr = db.query(DataQualityReport).filter(DataQualityReport.dataset_id == id).first()
    if not qr:
        raise HTTPException(status_code=404, detail="Quality report not found")
    return APIResponse(data={
        "id": qr.id,
        "dataset_id": qr.dataset_id,
        "overall_score": qr.overall_score,
        "null_rate": qr.null_rate,
        "duplicate_rate": qr.duplicate_rate,
        "invalid_geo_count": qr.invalid_geo_count,
        "invalid_nco_count": qr.invalid_nco_count,
        "details": qr.details_json
    })
