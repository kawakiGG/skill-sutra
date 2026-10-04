import os
import sys
import json
import datetime
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.models import (
    SkillGap, Forecast, Alert, Recommendation, District, Occupation, State, MonthlyPanel
)
from app.core.config import CONFIG

def generate():
    db = SessionLocal()
    print("Generating Intelligence Alerts and Actionable Recommendations...")

    # Clear existing alerts and recommendations
    db.query(Alert).delete()
    db.query(Recommendation).delete()
    db.commit()

    gaps = db.query(SkillGap).all()
    dists = {d.id: d for d in db.query(District).all()}
    states = {s.id: s for s in db.query(State).all()}
    occs = {o.id: o for o in db.query(Occupation).all()}

    # Fetch 6-month forecasts
    forecast_map = {}
    for f in db.query(Forecast).filter(Forecast.horizon_months == 6).all():
        forecast_map[(f.district_id, f.occupation_id)] = f

    # Fetch latest panel for placement & supply numbers
    latest_panel_map = {}
    for p in db.query(MonthlyPanel).filter(MonthlyPanel.month == "2026-09").all():
        latest_panel_map[(p.district_id, p.occupation_id)] = p

    alert_objs = []
    rec_objs = []

    for g in gaps:
        d_obj = dists.get(g.district_id)
        o_obj = occs.get(g.occupation_id)
        s_obj = states.get(d_obj.state_id) if d_obj else None
        f_obj = forecast_map.get((g.district_id, g.occupation_id))
        p_obj = latest_panel_map.get((g.district_id, g.occupation_id))

        d_name = d_obj.name if d_obj else "District"
        o_name = o_obj.name if o_obj else "Trade"
        s_name = s_obj.name if s_obj else "State"

        effective_supply = p_obj.certified if p_obj else 100.0
        placement_rate = (p_obj.placed / max(1.0, p_obj.certified)) * 100.0 if p_obj else 80.0
        coverage_pct = (p_obj.certified / max(1.0, p_obj.demand)) * 100.0 if p_obj else 75.0

        # Calculate capacity recommendation range
        raw_rec_pct = g.gap / max(1.0, effective_supply)
        max_rec_pct = CONFIG.get("thresholds", {}).get("max_capacity_recommendation_pct", 0.35)
        clamped_rec_pct = float(np.clip(raw_rec_pct, -0.35, max_rec_pct))

        # Show range (lower bound from lower forecast, upper bound from point forecast)
        if clamped_rec_pct > 0:
            rec_min = round(max(0.05, clamped_rec_pct * 0.75) * 100, 1)
            rec_max = round(clamped_rec_pct * 100, 1)
        else:
            rec_min = round(clamped_rec_pct * 100, 1)
            rec_max = round(min(-0.05, clamped_rec_pct * 0.75) * 100, 1)

        reasons = []
        conf_label = f_obj.confidence_label if f_obj else "High"

        # 1. Critical Shortage
        if g.classification == "Critical Shortage":
            al = Alert(
                district_id=g.district_id,
                occupation_id=g.occupation_id,
                alert_type="shortage",
                title=f"Critical Shortage Alert: {o_name} in {d_name}",
                description=f"Severe supply deficit detected. Local training capacity covers only {coverage_pct:.1f}% of projected demand.",
                severity="high"
            )
            alert_objs.append(al)

            reasons = [
                f"Projected 6-month demand growth is high with a deficit of {int(g.gap)} certified professionals.",
                f"Current local ITI capacity covers only {coverage_pct:.1f}% of total employer hiring demand.",
                f"Placement rate for graduates is strong at {placement_rate:.1f}%, indicating high employer absorption.",
                f"Forecast confidence is rated {conf_label} based on historical baseline evaluation."
            ]

        # 2. Emerging Shortage
        elif g.classification == "Emerging Shortage" or g.trajectory_flag == "Emerging":
            al = Alert(
                district_id=g.district_id,
                occupation_id=g.occupation_id,
                alert_type="emerging",
                title=f"Emerging Demand Alert: {o_name} in {d_name}",
                description=f"Rapid sector expansion (+40%+ YoY demand). Early capacity scaling recommended before shortage widens.",
                severity="medium"
            )
            alert_objs.append(al)

            reasons = [
                f"Accelerated sector investments are driving multi-quarter demand expansion.",
                f"Current supply training pipeline is lagging behind the projected trajectory.",
                f"High strategic sector priority requires proactive batch creation."
            ]

        # 3. Saturation Risk
        elif g.classification == "Saturation Risk":
            al = Alert(
                district_id=g.district_id,
                occupation_id=g.occupation_id,
                alert_type="saturation",
                title=f"Saturation Risk Alert: {o_name} in {d_name}",
                description=f"Training oversupply detected. Annual certified output exceeds market absorption capacity by {abs(g.gap_pct*100):.1f}%.",
                severity="medium"
            )
            alert_objs.append(al)

            reasons = [
                f"Certified annual output exceeds projected job openings by {abs(int(g.gap))} seats.",
                f"Placement efficiency is dropping due to market saturation.",
                f"Recommend redirecting {abs(clamped_rec_pct*100):.1f}% of training capacity to high-demand adjacent trades."
            ]

        if reasons:
            rec = Recommendation(
                district_id=g.district_id,
                occupation_id=g.occupation_id,
                priority_score=g.priority_score,
                recommended_increase_pct_min=rec_min,
                recommended_increase_pct_max=rec_max,
                reasons_json=reasons,
                confidence_label=conf_label
            )
            rec_objs.append(rec)

    db.bulk_save_objects(alert_objs)
    db.bulk_save_objects(rec_objs)
    db.commit()

    print(f"Generated {len(alert_objs)} Alerts and {len(rec_objs)} Recommendations.")

    # Verify Pune CNC Operator Alert & Recommendation
    pune_dist = db.query(District).filter(District.name == "Pune").first()
    cnc_occ = db.query(Occupation).filter(Occupation.name == "CNC Operator").first()

    if pune_dist and cnc_occ:
        pune_alert = db.query(Alert).filter(Alert.district_id == pune_dist.id, Alert.occupation_id == cnc_occ.id).first()
        pune_rec = db.query(Recommendation).filter(Recommendation.district_id == pune_dist.id, Recommendation.occupation_id == cnc_occ.id).first()

        print("\n--- PUNE CNC OPERATOR VERIFICATION ---")
        if pune_alert:
            print(f"Alert: {pune_alert.title} [{pune_alert.severity.upper()}]")
        if pune_rec:
            print(f"Recommendation: Increase Capacity by +{pune_rec.recommended_increase_pct_min}% to +{pune_rec.recommended_increase_pct_max}%")
            print("Reasons:")
            for r in pune_rec.reasons_json:
                print(f"  - {r}")

    db.close()
    print("Alerts & Recommendations Generation Completed Successfully!")

if __name__ == "__main__":
    generate()
