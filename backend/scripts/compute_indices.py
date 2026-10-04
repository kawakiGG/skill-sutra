import os
import sys
import datetime
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.models import MonthlyPanel, DemandIndex, SupplyIndex, SkillGap, Occupation, District
from app.core.config import CONFIG

def get_band(score: float) -> str:
    if score <= 30.0:
        return "Low"
    elif score <= 50.0:
        return "Moderate"
    elif score <= 70.0:
        return "High"
    else:
        return "Very High"

def classify_gap(gap_pct: float, demand_growth: float) -> tuple[str, str]:
    # Thresholds from config or default PLAN.md specs
    crit_s = CONFIG.get("thresholds", {}).get("gap_classification", {}).get("critical_shortage", 0.30)
    shortage_thresh = CONFIG.get("thresholds", {}).get("gap_classification", {}).get("shortage", 0.15)
    bal_upper = CONFIG.get("thresholds", {}).get("gap_classification", {}).get("balanced_upper", 0.15)
    bal_lower = CONFIG.get("thresholds", {}).get("gap_classification", {}).get("balanced_lower", -0.15)
    oversupply_thresh = CONFIG.get("thresholds", {}).get("gap_classification", {}).get("oversupply", -0.30)

    emerging_growth = CONFIG.get("thresholds", {}).get("emerging_growth_pct", 0.25)

    if gap_pct >= crit_s:
        cls = "Critical Shortage"
    elif gap_pct >= shortage_thresh:
        cls = "Shortage"
    elif gap_pct > bal_lower:
        cls = "Balanced"
    elif gap_pct > oversupply_thresh:
        cls = "Oversupply"
    else:
        cls = "Saturation Risk"

    trajectory = "Stable"
    if demand_growth >= emerging_growth and (gap_pct >= bal_lower and gap_pct < crit_s):
        trajectory = "Emerging"
        if cls == "Shortage" or cls == "Balanced":
            cls = "Emerging Shortage"

    return cls, trajectory

def min_max_scale(series: pd.Series) -> pd.Series:
    min_val = series.min()
    max_val = series.max()
    if max_val == min_val:
        return pd.Series(0.5, index=series.index)
    return (series - min_val) / (max_val - min_val)

def compute():
    db = SessionLocal()
    print("Computing Demand Indices, Supply Indices, and Skill Gaps...")

    # Fetch panel data
    query = db.query(MonthlyPanel)
    df = pd.read_sql(query.statement, db.bind)

    if df.empty:
        print("Monthly panel is empty! Run seed_demo_data.py first.")
        db.close()
        return

    # Clear previous indices & gaps
    db.query(DemandIndex).delete()
    db.query(SupplyIndex).delete()
    db.query(SkillGap).delete()
    db.commit()

    # Get strategic importance mapping per occupation
    occs = db.query(Occupation).all()
    strat_imp_map = {o.id: o.strategic_importance for o in occs}

    # Latest month in dataset (e.g., 2026-09)
    latest_month = df["month"].max()

    # Calculate growth rate over 12 months for each series
    df = df.sort_values(["district_id", "occupation_id", "month"])
    df["demand_lag12"] = df.groupby(["district_id", "occupation_id"])["demand"].shift(12)
    df["demand_growth"] = (df["demand"] - df["demand_lag12"]) / df["demand_lag12"].replace(0, np.nan)
    df["demand_growth"] = df["demand_growth"].fillna(0.05)

    df["seats_lag12"] = df.groupby(["district_id", "occupation_id"])["seats"].shift(12)
    df["seats_growth"] = (df["seats"] - df["seats_lag12"]) / df["seats_lag12"].replace(0, np.nan)
    df["seats_growth"] = df["seats_growth"].fillna(0.03)

    # Effective supply = certified (or completion rate * seats)
    df["completion_rate"] = df["certified"] / df["seats"].replace(0, np.nan)
    df["completion_rate"] = df["completion_rate"].fillna(0.85)
    df["effective_supply"] = df["certified"]

    # Compute indices for latest month per series
    latest_df = df[df["month"] == latest_month].copy()

    # Min-max normalize terms for LDI
    latest_df["vol_norm"] = min_max_scale(latest_df["demand"])
    latest_df["growth_norm"] = min_max_scale(latest_df["demand_growth"])
    latest_df["skill_freq_norm"] = 0.75 # Default high skill frequency signal

    # Weights from config
    w_ldi = CONFIG.get("weights", {}).get("demand_index", {"volume": 0.40, "growth": 0.35, "skill_freq": 0.25})
    latest_df["ldi_score"] = 100.0 * (
        w_ldi["volume"] * latest_df["vol_norm"] +
        w_ldi["growth"] * latest_df["growth_norm"] +
        w_ldi["skill_freq"] * latest_df["skill_freq_norm"]
    )
    latest_df["ldi_band"] = latest_df["ldi_score"].apply(get_band)

    # Min-max normalize terms for LSI
    latest_df["cap_norm"] = min_max_scale(latest_df["seats"])
    latest_df["cert_norm"] = min_max_scale(latest_df["certified"])
    latest_df["comp_norm"] = min_max_scale(latest_df["completion_rate"])

    w_lsi = CONFIG.get("weights", {}).get("supply_index", {"capacity": 0.40, "certified": 0.35, "completion_rate": 0.25})
    latest_df["lsi_score"] = 100.0 * (
        w_lsi["capacity"] * latest_df["cap_norm"] +
        w_lsi["certified"] * latest_df["cert_norm"] +
        w_lsi["completion_rate"] * latest_df["comp_norm"]
    )
    latest_df["lsi_band"] = latest_df["lsi_score"].apply(get_band)

    # Gaps computation
    latest_df["gap"] = latest_df["demand"] - latest_df["effective_supply"]
    latest_df["gap_pct"] = latest_df["gap"] / latest_df["demand"].replace(0, 1.0)

    # Priority score for shortages
    latest_df["gap_severity_norm"] = min_max_scale(latest_df["gap_pct"].clip(lower=0))
    latest_df["strat_imp"] = latest_df["occupation_id"].map(strat_imp_map).fillna(0.5)

    w_prio = CONFIG.get("weights", {}).get("priority_score", {
        "gap_severity": 0.40, "demand_growth": 0.25, "strategic_importance": 0.20, "forecast_confidence": 0.15
    })

    # Default forecast confidence norm = 0.90 for High
    latest_df["priority_score"] = 100.0 * (
        w_prio["gap_severity"] * latest_df["gap_severity_norm"] +
        w_prio["demand_growth"] * latest_df["growth_norm"] +
        w_prio["strategic_importance"] * latest_df["strat_imp"] +
        w_prio["forecast_confidence"] * 0.90
    )

    demand_objs = []
    supply_objs = []
    gap_objs = []

    for idx, row in latest_df.iterrows():
        # Classification
        cls, traj = classify_gap(row["gap_pct"], row["demand_growth"])

        d_idx = DemandIndex(
            district_id=int(row["district_id"]),
            occupation_id=int(row["occupation_id"]),
            month=str(row["month"]),
            ldi_score=float(round(row["ldi_score"], 2)),
            band=str(row["ldi_band"]),
            volume_norm=float(round(row["vol_norm"], 4)),
            growth_norm=float(round(row["growth_norm"], 4)),
            skill_freq_norm=float(round(row["skill_freq_norm"], 4))
        )
        demand_objs.append(d_idx)

        s_idx = SupplyIndex(
            district_id=int(row["district_id"]),
            occupation_id=int(row["occupation_id"]),
            month=str(row["month"]),
            lsi_score=float(round(row["lsi_score"], 2)),
            band=str(row["lsi_band"]),
            capacity_norm=float(round(row["cap_norm"], 4)),
            certified_norm=float(round(row["cert_norm"], 4)),
            completion_rate_norm=float(round(row["comp_norm"], 4))
        )
        supply_objs.append(s_idx)

        sg = SkillGap(
            district_id=int(row["district_id"]),
            occupation_id=int(row["occupation_id"]),
            month=str(row["month"]),
            gap=float(round(row["gap"], 2)),
            gap_pct=float(round(row["gap_pct"], 4)),
            classification=cls,
            trajectory_flag=traj,
            priority_score=float(round(row["priority_score"], 2))
        )
        gap_objs.append(sg)

    db.bulk_save_objects(demand_objs)
    db.bulk_save_objects(supply_objs)
    db.bulk_save_objects(gap_objs)
    db.commit()

    # Print summary of the 4 pinned scenarios
    print("\n--- PINNED SCENARIOS SUMMARY ---")
    dist_map = {d.id: d.name for d in db.query(District).all()}
    occ_map = {o.id: o.name for o in db.query(Occupation).all()}

    pinned_names = ["Pune", "Mumbai", "Ahmedabad", "Bengaluru"]
    for g in db.query(SkillGap).all():
        dname = dist_map.get(g.district_id)
        oname = occ_map.get(g.occupation_id)
        if dname in pinned_names and oname in ["CNC Operator", "Retail Sales Associate", "Solar PV Technician", "Healthcare Assistant"]:
            print(f"[{dname} - {oname}] Gap %: {g.gap_pct*100:+.1f}% | Class: {g.classification} | Priority: {g.priority_score:.1f}")

    db.close()
    print("Indices & Gaps Computation Completed Successfully!")

if __name__ == "__main__":
    compute()
