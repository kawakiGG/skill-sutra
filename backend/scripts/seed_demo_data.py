import os
import sys
import math
import random
import datetime
import numpy as np

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import engine, SessionLocal, Base
from app.models.models import (
    User, State, District, Sector, Occupation, Skill, OccupationSkill,
    TrainingCentre, TrainingCapacity, MonthlyPanel, JobPosting, AuditLog
)
from app.core.config import CONFIG

def seed():
    print("Initializing Database Schemas...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    random.seed(42)
    np.random.seed(42)

    # 1. Seed States
    states_data = [
        {"name": "Maharashtra", "code": "MH", "lat": 19.7515, "lng": 75.7139},
        {"name": "Karnataka", "code": "KA", "lat": 15.3173, "lng": 75.7139},
        {"name": "Gujarat", "code": "GJ", "lat": 22.2587, "lng": 71.1924},
        {"name": "Telangana", "code": "TS", "lat": 18.1124, "lng": 79.0193},
    ]
    state_objs = {}
    for s in states_data:
        st = State(**s)
        db.add(st)
        db.flush()
        state_objs[s["name"]] = st

    # 2. Seed Users
    users_data = [
        {"email": "national.planner@skillsutra.gov.in", "password_hash": "admin123", "role": "national_planner", "state_id": None},
        {"email": "state.planner.mh@skillsutra.gov.in", "password_hash": "mh123", "role": "state_planner", "state_id": state_objs["Maharashtra"].id},
    ]
    for u in users_data:
        db.add(User(**u))

    # 3. Seed Districts (5-6 per state)
    districts_data = {
        "Maharashtra": [
            {"name": "Pune", "lat": 18.5204, "lng": 73.8567},
            {"name": "Mumbai", "lat": 19.0760, "lng": 72.8777},
            {"name": "Nagpur", "lat": 21.1458, "lng": 79.0882},
            {"name": "Nashik", "lat": 20.0059, "lng": 73.7898},
            {"name": "Aurangabad", "lat": 19.8762, "lng": 75.3433},
            {"name": "Thane", "lat": 19.2183, "lng": 72.9781},
        ],
        "Karnataka": [
            {"name": "Bengaluru", "lat": 12.9716, "lng": 77.5946},
            {"name": "Mysuru", "lat": 12.2958, "lng": 76.6394},
            {"name": "Hubballi-Dharwad", "lat": 15.3647, "lng": 75.1240},
            {"name": "Mangaluru", "lat": 12.9141, "lng": 74.8560},
            {"name": "Belagavi", "lat": 15.8497, "lng": 74.4977},
            {"name": "Kalaburagi", "lat": 17.3297, "lng": 76.8343},
        ],
        "Gujarat": [
            {"name": "Ahmedabad", "lat": 23.0225, "lng": 72.5714},
            {"name": "Surat", "lat": 21.1702, "lng": 72.8311},
            {"name": "Vadodara", "lat": 22.3072, "lng": 73.1812},
            {"name": "Rajkot", "lat": 22.3039, "lng": 70.8022},
            {"name": "Bhavnagar", "lat": 21.7645, "lng": 72.1519},
            {"name": "Jamnagar", "lat": 22.4707, "lng": 70.0577},
        ],
        "Telangana": [
            {"name": "Hyderabad", "lat": 17.3850, "lng": 78.4867},
            {"name": "Warangal", "lat": 17.9689, "lng": 79.5941},
            {"name": "Nizamabad", "lat": 18.6725, "lng": 78.0941},
            {"name": "Karimnagar", "lat": 18.4386, "lng": 79.1288},
            {"name": "Khammam", "lat": 17.2473, "lng": 80.1514},
            {"name": "Nalgonda", "lat": 17.0575, "lng": 79.2683},
        ]
    }

    district_objs = {}
    for st_name, dists in districts_data.items():
        st_obj = state_objs[st_name]
        for d in dists:
            dist = District(state_id=st_obj.id, name=d["name"], lat=d["lat"], lng=d["lng"])
            db.add(dist)
            db.flush()
            district_objs[d["name"]] = dist

    # 4. Seed Sectors
    sectors_data = [
        {"name": "Manufacturing & Engineering", "code": "MFG"},
        {"name": "Green Energy & Electronics", "code": "GRE"},
        {"name": "Services & Retail", "code": "SRV"},
        {"name": "Healthcare & Life Sciences", "code": "HLS"},
        {"name": "IT & Digital Services", "code": "ITD"},
    ]
    sector_objs = {}
    for sec in sectors_data:
        s_obj = Sector(**sec)
        db.add(s_obj)
        db.flush()
        sector_objs[sec["name"]] = s_obj

    # 5. Seed Occupations (24 total)
    occupations_raw = [
        # Manufacturing
        {"name": "CNC Operator", "nco_code": "7223.01", "sector": "Manufacturing & Engineering", "importance": 0.90},
        {"name": "Industrial Electrician", "nco_code": "7411.01", "sector": "Manufacturing & Engineering", "importance": 0.85},
        {"name": "Arc Welder", "nco_code": "7212.01", "sector": "Manufacturing & Engineering", "importance": 0.70},
        {"name": "Quality Control Inspector", "nco_code": "7543.01", "sector": "Manufacturing & Engineering", "importance": 0.75},
        {"name": "Tool & Die Maker", "nco_code": "7222.01", "sector": "Manufacturing & Engineering", "importance": 0.80},
        
        # Green Energy
        {"name": "Solar PV Technician", "nco_code": "7411.02", "sector": "Green Energy & Electronics", "importance": 0.95},
        {"name": "EV Service Technician", "nco_code": "7231.02", "sector": "Green Energy & Electronics", "importance": 0.92},
        {"name": "Wind Turbine Technician", "nco_code": "7411.03", "sector": "Green Energy & Electronics", "importance": 0.85},
        {"name": "Battery Assembly Operator", "nco_code": "8211.01", "sector": "Green Energy & Electronics", "importance": 0.80},
        {"name": "Energy Auditor Assistant", "nco_code": "2149.01", "sector": "Green Energy & Electronics", "importance": 0.78},

        # Services & Retail
        {"name": "Retail Sales Associate", "nco_code": "5223.01", "sector": "Services & Retail", "importance": 0.40},
        {"name": "Customer Care Executive", "nco_code": "4222.01", "sector": "Services & Retail", "importance": 0.50},
        {"name": "Warehouse Logistics Associate", "nco_code": "4321.01", "sector": "Services & Retail", "importance": 0.65},
        {"name": "Hospitality Steward", "nco_code": "5131.01", "sector": "Services & Retail", "importance": 0.45},
        {"name": "Delivery Operations Executive", "nco_code": "8322.01", "sector": "Services & Retail", "importance": 0.55},

        # Healthcare
        {"name": "Healthcare Assistant", "nco_code": "5321.01", "sector": "Healthcare & Life Sciences", "importance": 0.88},
        {"name": "Phlebotomy Technician", "nco_code": "3212.01", "sector": "Healthcare & Life Sciences", "importance": 0.82},
        {"name": "Medical Lab Assistant", "nco_code": "3212.02", "sector": "Healthcare & Life Sciences", "importance": 0.85},
        {"name": "Emergency Medical Technician", "nco_code": "3258.01", "sector": "Healthcare & Life Sciences", "importance": 0.90},
        {"name": "Pharmacy Sales Assistant", "nco_code": "5223.02", "sector": "Healthcare & Life Sciences", "importance": 0.60},

        # IT & Digital
        {"name": "Data Entry & Analytics Assistant", "nco_code": "4132.01", "sector": "IT & Digital Services", "importance": 0.70},
        {"name": "Junior Web Developer", "nco_code": "2513.01", "sector": "IT & Digital Services", "importance": 0.85},
        {"name": "Cybersecurity Support Technician", "nco_code": "2529.01", "sector": "IT & Digital Services", "importance": 0.91},
        {"name": "Cloud Operations Associate", "nco_code": "2522.01", "sector": "IT & Digital Services", "importance": 0.89},
    ]

    occupation_objs = {}
    for occ in occupations_raw:
        sec_obj = sector_objs[occ["sector"]]
        o_obj = Occupation(
            sector_id=sec_obj.id,
            name=occ["name"],
            nco_code=occ["nco_code"],
            strategic_importance=occ["importance"]
        )
        db.add(o_obj)
        db.flush()
        occupation_objs[occ["name"]] = o_obj

    # 6. Seed Skills
    skills_list = [
        "Precision Measurement", "CNC Programming", "Circuit Testing", "Safety Compliance",
        "Solar Panel Installation", "EV Diagnostics", "Customer Service", "Inventory Management",
        "Patient Care", "Phlebotomy", "Python/Data Entry", "Troubleshooting", "Quality Audit",
        "Hydraulics", "Welding Safety", "Battery Diagnostics", "Billing Systems", "First Aid"
    ]
    skill_objs = []
    for sk in skills_list:
        sk_o = Skill(name=sk, category="Technical")
        db.add(sk_o)
        db.flush()
        skill_objs.append(sk_o)

    # Link skills to occupations
    for occ in occupation_objs.values():
        sampled_skills = random.sample(skill_objs, k=3)
        for sk in sampled_skills:
            db.add(OccupationSkill(occupation_id=occ.id, skill_id=sk.id, frequency=round(random.uniform(0.6, 0.98), 2)))

    # 7. Seed Training Centres
    for d_name, d_obj in district_objs.items():
        for i in range(1, 4):
            tc = TrainingCentre(
                district_id=d_obj.id,
                name=f"Government ITI {d_name} #{i}",
                type="Government ITI" if i < 3 else "Pradhan Mantri Kaushal Kendra",
                capacity=random.choice([120, 180, 240, 300])
            )
            db.add(tc)

    db.flush()

    # 8. Generate 45-Month Panel (Jan 2023 to Sep 2026)
    months = []
    for m in range(45):
        # Calculate YYYY-MM
        year = 2023 + (m // 12)
        month = (m % 12) + 1
        months.append(f"{year:04d}-{month:02d}")

    print("Generating 45-Month Synthetic Panel for 24 Districts x 24 Occupations...")

    # Pinned scenario keys
    pune = district_objs["Pune"]
    mumbai = district_objs["Mumbai"]
    ahmedabad = district_objs["Ahmedabad"]
    bengaluru = district_objs["Bengaluru"]

    cnc_op = occupation_objs["CNC Operator"]
    retail_assoc = occupation_objs["Retail Sales Associate"]
    solar_tech = occupation_objs["Solar PV Technician"]
    health_asst = occupation_objs["Healthcare Assistant"]

    for d_name, d_obj in district_objs.items():
        for o_name, o_obj in occupation_objs.items():
            is_pune_cnc = (d_obj.id == pune.id and o_obj.id == cnc_op.id)
            is_mumbai_retail = (d_obj.id == mumbai.id and o_obj.id == retail_assoc.id)
            is_gujarat_solar = (d_obj.id == ahmedabad.id and o_obj.id == solar_tech.id)
            is_bengaluru_health = (d_obj.id == bengaluru.id and o_obj.id == health_asst.id)

            # Base parameters
            if is_pune_cnc:
                base_demand = 850
                annual_demand_growth = 0.18 # +18% growth
                base_seats = 620
                annual_seats_growth = 0.03
                completion_rate = 0.85
                certification_rate = 0.90
            elif is_mumbai_retail:
                base_demand = 1200
                annual_demand_growth = 0.02 # +2% growth
                base_seats = 1100
                annual_seats_growth = 0.22 # +22% supply growth -> Saturation
                completion_rate = 0.90
                certification_rate = 0.92
            elif is_gujarat_solar:
                base_demand = 400
                annual_demand_growth = 0.41 # +41% demand growth -> Emerging
                base_seats = 420
                annual_seats_growth = 0.12 # +12% supply growth
                completion_rate = 0.88
                certification_rate = 0.89
            elif is_bengaluru_health:
                base_demand = 600
                annual_demand_growth = 0.08 # +8% demand
                base_seats = 650
                annual_seats_growth = 0.07 # +7% supply -> Balanced
                completion_rate = 0.86
                certification_rate = 0.88
            else:
                # Random profile but realistic
                profile_type = random.choice(["shortage", "saturation", "balanced", "balanced"])
                if profile_type == "shortage":
                    base_demand = random.randint(400, 900)
                    annual_demand_growth = random.uniform(0.12, 0.28)
                    base_seats = int(base_demand * random.uniform(0.65, 0.80))
                    annual_seats_growth = random.uniform(0.02, 0.06)
                elif profile_type == "saturation":
                    base_demand = random.randint(500, 1000)
                    annual_demand_growth = random.uniform(0.0, 0.04)
                    base_seats = int(base_demand * random.uniform(1.0, 1.3))
                    annual_seats_growth = random.uniform(0.15, 0.25)
                else:
                    base_demand = random.randint(300, 800)
                    annual_demand_growth = random.uniform(0.04, 0.10)
                    base_seats = int(base_demand * random.uniform(0.95, 1.05))
                    annual_seats_growth = random.uniform(0.04, 0.09)
                completion_rate = random.uniform(0.80, 0.90)
                certification_rate = random.uniform(0.85, 0.92)

            for idx, m_str in enumerate(months):
                t = idx / 12.0 # years elapsed
                # Seasonality: higher hiring in Q3/Q4 (months 8-11)
                month_num = (idx % 12) + 1
                seasonality = 1.0 + 0.08 * math.sin(2 * math.pi * (month_num - 3) / 12)
                
                noise_demand = np.random.normal(1.0, 0.03)
                demand_val = max(10, int(base_demand * math.pow(1 + annual_demand_growth, t) * seasonality * noise_demand))
                
                noise_seats = np.random.normal(1.0, 0.02)
                seats_val = max(10, int(base_seats * math.pow(1 + annual_seats_growth, t) * noise_seats))

                enrolled_val = int(seats_val * random.uniform(0.92, 0.99))
                certified_val = int(enrolled_val * completion_rate * certification_rate)
                placed_val = int(certified_val * random.uniform(0.70, 0.92))
                avg_sal = round(20000 + (t * 1500) + random.randint(-500, 500), 2)

                panel_row = MonthlyPanel(
                    district_id=d_obj.id,
                    occupation_id=o_obj.id,
                    month=m_str,
                    demand=float(demand_val),
                    seats=float(seats_val),
                    enrolled=float(enrolled_val),
                    certified=float(certified_val),
                    placed=float(placed_val),
                    avg_salary=avg_sal,
                    dataset_version="v1.0-synthetic"
                )
                db.add(panel_row)

                # Generate sample Job Postings for latest month (2026-09)
                if m_str == "2026-09" and random.random() < 0.3:
                    jp = JobPosting(
                        district_id=d_obj.id,
                        occupation_id=o_obj.id,
                        title=f"{o_obj.name} - {d_obj.name}",
                        raw_title=f"Urgent Requirement: Sr. {o_obj.name} at {d_obj.name} Industrial Area",
                        company=random.choice(["Tata Motors", "Reliance Solar", "Apollo Hospitals", "Infosys BPM", "L&T Defense"]),
                        salary=avg_sal,
                        posted_date="2026-09-15"
                    )
                    db.add(jp)

    db.commit()
    db.close()
    print("Database Seed Completed Successfully!")

if __name__ == "__main__":
    seed()
