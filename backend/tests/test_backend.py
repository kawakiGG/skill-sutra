import pytest
from fastapi.testclient import TestClient
from main import app
from scripts.compute_indices import classify_gap

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "ok"
    assert data["meta"]["is_synthetic"] is True

def test_classification_boundaries():
    # Critical Shortage >= +0.30
    cls, traj = classify_gap(0.35, 0.10)
    assert cls == "Critical Shortage"

    # Shortage +0.15 to +0.30
    cls, traj = classify_gap(0.20, 0.10)
    assert cls == "Shortage"

    # Balanced -0.15 to +0.15
    cls, traj = classify_gap(0.05, 0.05)
    assert cls == "Balanced"

    # Oversupply -0.30 to -0.15
    cls, traj = classify_gap(-0.20, 0.02)
    assert cls == "Oversupply"

    # Saturation Risk <= -0.30
    cls, traj = classify_gap(-0.35, 0.01)
    assert cls == "Saturation Risk"

    # Emerging flag when growth >= 0.25
    cls, traj = classify_gap(0.18, 0.30)
    assert traj == "Emerging"
    assert "Emerging" in cls

def test_dashboard_summary_api():
    res = client.get("/api/v1/dashboard/summary")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["total_states"] == 4
    assert body["data"]["total_districts"] >= 20

def test_gaps_api():
    res = client.get("/api/v1/gaps")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert len(body["data"]) > 0

def test_pune_cnc_alert_and_recommendation():
    # Get Pune district ID and CNC Operator ID
    geo_res = client.get("/api/v1/geo/districts")
    dists = geo_res.json()["data"]
    pune_id = next(d["id"] for d in dists if d["name"] == "Pune")

    occ_res = client.get("/api/v1/geo/occupations")
    occs = occ_res.json()["data"]
    cnc_id = next(o["id"] for o in occs if o["name"] == "CNC Operator")

    # Check alert
    alert_res = client.get(f"/api/v1/alerts?district_id={pune_id}")
    assert alert_res.status_code == 200
    alerts = alert_res.json()["data"]
    pune_alert = next((a for a in alerts if a["occupation_id"] == cnc_id), None)
    assert pune_alert is not None
    assert "Critical Shortage" in pune_alert["title"]

    # Check recommendation
    rec_res = client.get(f"/api/v1/recommendations?district_id={pune_id}")
    assert rec_res.status_code == 200
    recs = rec_res.json()["data"]
    pune_rec = next((r for r in recs if r["occupation_id"] == cnc_id), None)
    assert pune_rec is not None
    assert pune_rec["recommended_increase_pct_max"] > 0
    assert len(pune_rec["reasons"]) >= 3

def test_scenario_simulation():
    geo_res = client.get("/api/v1/geo/districts")
    dists = geo_res.json()["data"]
    pune_id = next(d["id"] for d in dists if d["name"] == "Pune")

    occ_res = client.get("/api/v1/geo/occupations")
    occs = occ_res.json()["data"]
    cnc_id = next(o["id"] for o in occs if o["name"] == "CNC Operator")

    payload = {
        "district_id": pune_id,
        "occupation_id": cnc_id,
        "seat_change_pct": 20.0,
        "added_centres": 1,
        "removed_centres": 0,
        "completion_rate_delta": 2.0
    }
    res = client.post("/api/v1/scenarios/simulate", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert data["new_seats"] > data["current_seats"]
    assert data["new_gap"] < data["original_gap"]
    assert "Training Course Lag Assumption" in data["lag_warning"]

def test_title_normalization():
    res = client.post("/api/v1/normalize/title", json={"title": "Urgent Requirement: Senior CNC Operator"})
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["nco_code"] == "7223.01"
    assert body["data"]["normalized_title"] == "CNC Operator"
