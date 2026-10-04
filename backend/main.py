import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.config import CONFIG
from app.api import (
    auth, geo, dashboard, gaps, forecast, map as map_api,
    intelligence, scenarios, datasets, exports, normalize
)

app = FastAPI(
    title="Skill Sutra Intelligence API",
    version="1.0.0",
    description="AI Labour Market Intelligence & Skill Demand-Supply Forecasting Engine"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "success": True,
        "data": {
            "status": "ok",
            "service": "Skill Sutra Intelligence Engine",
            "version": "1.0.0",
            "is_synthetic": True
        },
        "meta": {
            "source": "Skill Sutra Health Monitoring",
            "version": "1.0.0",
            "is_synthetic": True
        }
    }

# Mount Routers under /api/v1
api_v1_prefix = "/api/v1"

app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(geo.router, prefix=api_v1_prefix)
app.include_router(dashboard.router, prefix=api_v1_prefix)
app.include_router(gaps.router, prefix=api_v1_prefix)
app.include_router(forecast.router, prefix=api_v1_prefix)
app.include_router(map_api.router, prefix=api_v1_prefix)
app.include_router(intelligence.router, prefix=api_v1_prefix)
app.include_router(scenarios.router, prefix=api_v1_prefix)
app.include_router(datasets.router, prefix=api_v1_prefix)
app.include_router(exports.router, prefix=api_v1_prefix)
app.include_router(normalize.router, prefix=api_v1_prefix)
