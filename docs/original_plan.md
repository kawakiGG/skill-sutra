Below is a **build-ready implementation specification** you can give directly to Antigravity. It is written as a product/engineering document rather than a presentation description, so it covers architecture, modules, database, APIs, ML, UI, implementation phases, demo data, and acceptance criteria.

# KaushalDrishti

## AI-Enabled Labour Market Intelligence and Skill Demand-Supply Forecasting Engine

### Version

MVP / SIH Prototype — v1.0

---

# 1. PRODUCT OVERVIEW

## 1.1 Product Name

**KaushalDrishti**

## 1.2 Tagline

**AI-powered labour market intelligence for demand-driven skilling.**

## 1.3 Purpose

KaushalDrishti is a Labour Market Intelligence System (LMIS) designed for MSDE, State Skill Development Missions, NCVET, Sector Skill Councils, and training planners.

The system combines labour-demand signals, training capacity, historical training outcomes, and geographic information to:

1. Understand current labour demand.
2. Estimate available skill supply.
3. Forecast future demand and supply.
4. Detect skill shortages and oversupply.
5. Identify emerging occupations.
6. Recommend training-capacity adjustments.
7. Allow planners to simulate "what-if" training scenarios.
8. Provide national → state → district → sector → trade drill-down.

---

# 2. CORE PRODUCT IDEA

The system should answer five questions:

### Q1. What skills are currently in demand?

Example:

> CNC Operators have high demand in Pune's manufacturing sector.

### Q2. Where is demand growing?

Example:

> Solar PV Technician demand is growing rapidly in Gujarat.

### Q3. Are enough trained candidates available?

Example:

> Current training capacity covers only 62% of projected demand.

### Q4. Where are we over-training?

Example:

> Retail Sales Associate training capacity exceeds projected demand by 31%.

### Q5. What should planners do?

Example:

> Increase CNC Operator training capacity by approximately 18% in selected districts.

The system is a **decision-support platform**, not an autonomous government decision-maker.

---

# 3. MVP SCOPE

Do not attempt to model all Indian occupations initially.

The MVP should support:

### Geography

* India
* 3–5 states
* 20–50 districts

Recommended pilot states:

* Maharashtra
* Karnataka
* Gujarat
* Telangana

### Sectors

Start with:

* Manufacturing
* IT / ITES
* Healthcare
* Construction
* Renewable Energy

### Example occupations

* CNC Operator
* Electrician
* Solar PV Technician
* Welder
* Fitter
* Machine Operator
* Data Analyst
* Software Developer
* Healthcare Assistant
* Construction Technician

The architecture must remain extensible so more sectors, states and occupations can be added without redesigning the system.

---

# 4. HIGH-LEVEL ARCHITECTURE

```text
                        DATA SOURCES
                             |
        +--------------------+--------------------+
        |                    |                    |
       NCS                 PLFS               e-Shram
        |                    |                    |
     Job Data          Labour Data         Workforce Data
        |                    |                    |
        +--------------------+--------------------+
                             |
                    DATA INGESTION LAYER
                             |
                    DATA CLEANING LAYER
                             |
                  NORMALIZATION ENGINE
                             |
        +--------------------+--------------------+
        |                    |                    |
   NCO Mapping         NSQF Mapping       Geo Mapping
        |                    |                    |
        +--------------------+--------------------+
                             |
                    UNIFIED DATA LAYER
                             |
        +--------------------+--------------------+
        |                    |                    |
 Demand Engine        Supply Engine        Trend Engine
        |                    |                    |
        +--------------------+--------------------+
                             |
                    FORECASTING ENGINE
                             |
                 DEMAND-SUPPLY GAP ENGINE
                             |
            +----------------+----------------+
            |                |                |
       Early Warning    Recommendations   Scenario Engine
            |                |                |
            +----------------+----------------+
                             |
                          REST API
                             |
                     NEXT.JS DASHBOARD
```

---

# 5. TECHNOLOGY STACK

## Frontend

Use:

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui
* Recharts
* Leaflet or Mapbox
* Lucide icons

Use responsive design.

The dashboard must work on:

* Desktop
* Tablet
* Mobile

Primary target is desktop because planners will mostly use large screens.

---

# 6. BACKEND

Use:

* Python
* FastAPI
* Pydantic
* SQLAlchemy
* PostgreSQL

Optional:

* Redis for caching
* Celery/RQ for background jobs

Do NOT over-engineer the MVP with microservices.

Use a modular monolith:

```text
FastAPI
├── auth
├── data
├── demand
├── supply
├── forecast
├── gaps
├── recommendations
├── scenarios
├── dashboard
└── exports
```

---

# 7. MACHINE LEARNING STACK

Use Python.

Libraries:

* pandas
* numpy
* scikit-learn
* statsmodels
* xgboost
* lightgbm
* sentence-transformers

Optional:

* Prophet
* PyTorch

Do not make deep learning mandatory.

For an MVP, use:

### Forecasting

1. Seasonal baseline
2. Exponential Smoothing / SARIMA
3. XGBoost regression

Compare models and select the best-performing model using historical validation.

---

# 8. DATA SOURCES

The architecture must support:

### Government sources

* NCS
* PLFS
* e-Shram
* Skill India / training datasets
* Training-centre data
* NSQF
* NCO

### Labour demand

* Job portals
* Public job-posting datasets
* Industry hiring datasets
* Employer surveys
* Aggregated hiring signals

Important:

The MVP must not depend on scraping websites that prohibit automated access.

Implement a generic ingestion layer capable of consuming:

* CSV
* Excel
* JSON
* REST APIs
* manually uploaded datasets

---

# 9. DATA INGESTION SYSTEM

Create an admin interface:

```text
Data Management
├── Upload Dataset
├── Dataset History
├── Validation Status
├── Processing Status
└── Data Quality
```

Supported upload formats:

* CSV
* XLSX
* JSON

Pipeline:

```text
Upload
  ↓
File Validation
  ↓
Schema Detection
  ↓
Column Mapping
  ↓
Cleaning
  ↓
Deduplication
  ↓
Occupation Mapping
  ↓
Geographic Mapping
  ↓
Quality Check
  ↓
Database
```

---

# 10. COMMON DATA MODEL

All incoming datasets must eventually map to a common internal schema.

Example job record:

```json
{
  "job_id": "JOB-10001",
  "title": "CNC Machine Operator",
  "sector": "Manufacturing",
  "occupation_code": "NCO-CNC-001",
  "district": "Pune",
  "state": "Maharashtra",
  "skills": [
    "CNC",
    "Machine Operation",
    "Technical Drawing"
  ],
  "salary_min": 18000,
  "salary_max": 32000,
  "posted_date": "2026-01-15",
  "source": "NCS"
}
```

---

# 11. OCCUPATION NORMALIZATION

Different sources may use different terminology.

Examples:

```text
Python Developer
Python Backend Developer
Django Developer
Backend Engineer - Python
```

should map into standardized occupation/skill categories.

Create:

```text
Occupation Normalization Engine
```

Pipeline:

```text
Raw Job Title
     ↓
Text Cleaning
     ↓
Skill Extraction
     ↓
Embedding Generation
     ↓
Similarity Search
     ↓
NCO Candidate Matching
     ↓
Confidence Score
     ↓
Final Occupation
```

Store:

```text
raw_title
normalized_title
nco_code
confidence
mapping_method
```

---

# 12. SKILL EXTRACTION

Extract skills from job descriptions.

Example:

```text
"Looking for a CNC operator with knowledge of
AutoCAD, CNC programming and technical drawings."
```

Output:

```json
{
  "skills": [
    "CNC Operation",
    "AutoCAD",
    "CNC Programming",
    "Technical Drawing"
  ]
}
```

Use sentence-transformer embeddings and a controlled skill dictionary.

Do not rely exclusively on an LLM.

---

# 13. DEMAND INDEX

Create a normalized Labour Demand Index (LDI).

Conceptually:

```text
LDI =
    Job Volume Score
  + Demand Growth Score
  + Employer Hiring Score
  + Skill Frequency Score
  + Wage Signal Score
```

Normalize to:

```text
0–100
```

Example:

```text
0–30    Low
31–50   Moderate
51–70   High
71–100  Very High
```

The weights must be configurable.

Default:

```text
Job Volume              30%
Demand Growth           25%
Skill Frequency         20%
Employer Hiring         15%
Wage Signal             10%
```

The weights should be stored in configuration rather than hard-coded.

---

# 14. SUPPLY INDEX

Supply should represent the availability of trained candidates.

Inputs:

* Number of training centres
* Available seats
* Enrolments
* Certifications
* Graduates
* Historical placement
* Existing workforce where available

Example:

```text
Supply Score =
    Training Capacity
  + Certification Volume
  + Completion Rate
  + Placement-adjusted Supply
```

Normalize to 0–100.

---

# 15. SUPPLY CALCULATION

Example:

```text
Annual Seats = 5,000
Completion Rate = 82%
Certification Rate = 90%

Expected Certified Supply
= 5,000 × 0.82 × 0.90
= 3,690
```

Apply historical placement/employment adjustment where data exists.

---

# 16. DEMAND-SUPPLY GAP

Core formula:

```text
Gap = Forecast Demand - Forecast Supply
```

Example:

```text
Forecast Demand = 9,500
Forecast Supply = 7,200

Gap = +2,300
```

Positive gap = shortage.

Negative gap = potential oversupply.

---

# 17. GAP CLASSIFICATION

Create five classifications:

### Critical Shortage

```text
Demand > Supply by >= 30%
```

### Shortage

```text
Demand > Supply by 15–29%
```

### Balanced

```text
Difference within ±15%
```

### Oversupply

```text
Supply > Demand by 15–29%
```

### Saturation Risk

```text
Supply > Demand by >= 30%
```

Make these thresholds configurable.

---

# 18. FORECASTING ENGINE

Forecast horizons:

* 3 months
* 6 months
* 12 months

Optional:

* 24 months

For each:

```text
State
District
Sector
Occupation
```

generate:

```json
{
  "forecast_period": "2027-Q1",
  "demand": 9500,
  "supply": 7200,
  "gap": 2300,
  "confidence_lower": 1900,
  "confidence_upper": 2800
}
```

---

# 19. MODEL TRAINING

Use time-based validation.

Never randomly shuffle time-series data.

Example:

```text
Training:
2023–2025

Validation:
2026 Q1–Q2

Forecast:
2026 Q3 onward
```

Metrics:

* MAE
* RMSE
* MAPE

Store model metadata:

```text
model_name
model_version
training_date
training_period
features
MAE
RMSE
MAPE
```

---

# 20. FORECAST CONFIDENCE

Every forecast should have a confidence indicator.

Example:

```text
Forecast:
9,500

Confidence:
82%

Range:
9,000 – 10,100
```

Do not present predictions as guaranteed outcomes.

Use:

* High confidence
* Medium confidence
* Low confidence

based on model performance and data quality.

---

# 21. EARLY WARNING ENGINE

The engine should detect:

### Skill Shortage

Rapidly increasing demand + insufficient supply.

### Saturation

Increasing supply + stagnant/declining demand.

### Emerging Skill

Low current demand but high growth rate.

### Declining Skill

Persistent decline in demand.

### Regional Imbalance

High demand nationally but inadequate supply in a specific district.

---

# 22. EARLY WARNING EXAMPLE

```text
ALERT

Solar PV Technician
District: Nagpur

Demand growth: +41%
Supply coverage: 58%
Projected 12-month gap: +1,850

Severity:
HIGH

Recommended action:
Consider increasing training capacity.
```

---

# 23. RECOMMENDATION ENGINE

Recommendations should be explainable.

Example:

```text
Recommendation:
Increase CNC Operator training capacity.

Reason:
1. Demand increased 18% YoY.
2. Current supply covers only 76% of projected demand.
3. Manufacturing hiring trend is positive.
4. Historical placement rate is 81%.

Suggested capacity adjustment:
+15% to +20%
```

Never generate a recommendation without showing its reasons.

---

# 24. SCENARIO SIMULATOR

This is a major feature.

Planner chooses:

```text
State: Maharashtra
District: Pune
Sector: Manufacturing
Occupation: CNC Operator

Current seats:
4,500

Scenario:
Increase seats by 20%
```

System recalculates:

```text
Current supply:
3,800

New projected supply:
4,560

Demand:
5,200

Current gap:
1,400

New gap:
640
```

Display before/after charts.

Allow:

* Increase capacity
* Decrease capacity
* Add training centres
* Remove training centres
* Change completion rate

---

# 25. DASHBOARD STRUCTURE

Main navigation:

```text
Dashboard
Labour Demand
Skill Gaps
Forecasts
Geographic Intelligence
Recommendations
Scenario Simulator
Data Management
Reports
Settings
```

---

# 26. MAIN DASHBOARD

Top KPI cards:

```text
Total Occupations Tracked
High-Demand Skills
Critical Shortages
Saturation Risks
Forecast Accuracy
States Covered
Districts Covered
```

Then:

### Demand Trend

Line chart.

### Skill Gap Distribution

Bar/donut chart.

### India/State Map

Heatmap.

### Top Shortage Occupations

Table.

### Top Saturation Risks

Table.

### Recent Alerts

Alert cards.

---

# 27. GEOGRAPHIC MAP

Use Leaflet or Mapbox.

Map hierarchy:

```text
India
 ↓
State
 ↓
District
```

Each region should be colour-coded according to selected metric.

Available metrics:

* Demand
* Supply
* Gap
* Demand growth
* Supply coverage
* Saturation risk

Clicking a district opens a side panel.

---

# 28. DISTRICT PAGE

Example:

```text
Pune, Maharashtra

Labour Demand Index       78
Supply Index              64
Overall Gap               +14
```

Sections:

* Top demanded occupations
* Skill shortages
* Saturated trades
* Demand trend
* Supply trend
* Forecast
* Training centres
* Recommendations

---

# 29. OCCUPATION DETAIL PAGE

Example:

```text
CNC Operator

Sector:
Manufacturing

Current Demand:
8,200

Current Supply:
6,100

Demand Growth:
+18%

Projected 12-month demand:
9,700

Projected supply:
7,200

Gap:
+2,500

Status:
CRITICAL SHORTAGE
```

Charts:

* Historical demand
* Historical supply
* Forecast
* Gap
* Salary trend
* Job-posting trend

---

# 30. NATIONAL → DISTRICT DRILL-DOWN

Every major visualization should support:

```text
India
→ Maharashtra
→ Pune
→ Manufacturing
→ CNC Operator
```

Breadcrumbs:

```text
India / Maharashtra / Pune / Manufacturing / CNC Operator
```

---

# 31. RECOMMENDATION PAGE

Display ranked recommendations.

Columns:

```text
Priority
State
District
Sector
Occupation
Gap
Demand Growth
Recommended Action
Confidence
```

Example:

```text
HIGH
Pune
Manufacturing
CNC Operator
+2,500
+18%
Increase capacity
82%
```

Allow sorting and filtering.

---

# 32. PRIORITY SCORE

Create:

```text
Priority Score =
Gap Severity
× Demand Growth
× Strategic Importance
× Confidence
```

Normalize to 0–100.

Use this to rank interventions.

---

# 33. REPORT GENERATION

Allow users to export:

* CSV
* Excel
* PDF

Reports should contain:

* Selected geography
* Selected sector
* Forecast
* Gap
* Recommendations
* Charts
* Data timestamp
* Model version

---

# 34. API

Use REST APIs.

Base:

```text
/api/v1
```

Endpoints:

### Dashboard

```http
GET /dashboard/summary
```

### Demand

```http
GET /demand
GET /demand/trends
GET /demand/top
```

### Supply

```http
GET /supply
GET /supply/capacity
```

### Forecast

```http
GET /forecast
GET /forecast/{occupation_id}
```

### Gaps

```http
GET /gaps
GET /gaps/top-shortages
GET /gaps/top-saturation
```

### Geography

```http
GET /states
GET /states/{id}
GET /districts
GET /districts/{id}
```

### Recommendations

```http
GET /recommendations
```

### Scenarios

```http
POST /scenarios/simulate
```

### Data

```http
POST /datasets/upload
GET /datasets
GET /datasets/{id}
```

### Export

```http
POST /exports
GET /exports/{id}
```

---

# 35. DATABASE DESIGN

Use PostgreSQL.

Core tables:

```text
users
roles

states
districts

sectors
occupations
skills

nco_occupations
nsqf_courses

training_centres
training_courses
training_capacity

enrolments
certifications
placements

job_postings
employer_signals

demand_indices
supply_indices

forecasts
forecast_models

skill_gaps
alerts
recommendations

scenarios
scenario_results

datasets
data_quality_reports
```

---

# 36. IMPORTANT DATABASE RELATIONSHIPS

```text
State
 └── District
      └── Training Centre
           └── Course
                └── Occupation

Sector
 └── Occupation
      └── Skill

Job Posting
 └── Occupation
 └── District
 └── Skills

Forecast
 └── State/District
 └── Sector
 └── Occupation

Skill Gap
 └── Forecast
 └── Supply
 └── Demand
```

---

# 37. DATA QUALITY SYSTEM

Every dataset must receive a quality score.

Metrics:

* Missing values
* Duplicate records
* Invalid geography
* Invalid occupation codes
* Date coverage
* Update frequency

Example:

```text
Dataset:
Job Postings

Quality Score:
87/100

Records:
245,000

Duplicates:
3.2%

Missing occupation:
4.8%

Date coverage:
2024–2026
```

---

# 38. DATA FRESHNESS

Show:

```text
Last updated:
04 Oct 2026

Next update:
11 Oct 2026
```

Different datasets can have different refresh schedules.

Never imply real-time data if the source is only updated monthly/quarterly.

---

# 39. MULTILINGUAL SUPPORT

Use an i18n framework.

Initially support:

* English
* Hindi
* Marathi

Architecture should allow additional languages.

Do not hard-code UI text.

Use translation keys:

```text
dashboard.title
dashboard.demand
dashboard.supply
dashboard.skill_gap
```

---

# 40. ACCESSIBILITY

Follow WCAG-oriented practices.

Requirements:

* Keyboard navigation
* Proper contrast
* Screen-reader labels
* Tooltips
* Text alternatives for charts
* Do not rely only on colour
* Responsive layouts
* Font scaling

Example:

Instead of only:

```text
🔴
```

show:

```text
Critical Shortage
```

---

# 41. USER ROLES

### Administrator

Can:

* Upload data
* Manage datasets
* Manage users
* Trigger model training

### National Planner

Can:

* View India
* View states
* View recommendations
* Run scenarios
* Export reports

### State Planner

Can:

* View assigned state
* View districts
* Analyze sectors
* Run scenarios
* Export reports

---

# 42. AUTHENTICATION

MVP:

* Email/password
* JWT

Optional future:

* Government SSO
* OAuth
* SAML

Do not implement complex government SSO in the SIH prototype unless credentials/integration are available.

---

# 43. SECURITY

Implement:

* JWT authentication
* Password hashing
* Role-based authorization
* Input validation
* File-type validation
* SQL injection protection
* API rate limiting
* Audit logging

Never expose:

* Raw credentials
* Database passwords
* API keys

Use environment variables.

---

# 44. PROJECT STRUCTURE

Recommended:

```text
kaushaldrishti/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   └── types/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── ml/
│   │   ├── pipelines/
│   │   └── utils/
│   └── tests/
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── sample/
│
├── ml/
│   ├── notebooks/
│   ├── training/
│   ├── models/
│   └── evaluation/
│
├── docs/
│
├── docker/
│
└── README.md
```

---

# 45. FRONTEND ARCHITECTURE

Use feature-based components.

```text
features/
├── dashboard/
├── demand/
├── supply/
├── forecasts/
├── gaps/
├── geography/
├── recommendations/
├── scenarios/
└── data-management/
```

Reusable components:

```text
KpiCard
TrendChart
ForecastChart
GapBadge
RiskBadge
IndiaMap
FilterBar
DataTable
AlertCard
RecommendationCard
ScenarioPanel
```

---

# 46. GLOBAL FILTER SYSTEM

Dashboard filters:

```text
State
District
Sector
Occupation
Time Period
Data Source
```

Filters should update all relevant charts.

Example:

```text
State = Maharashtra
District = Pune
Sector = Manufacturing
```

The dashboard should automatically refresh:

* Demand
* Supply
* Forecast
* Gap
* Recommendations

---

# 47. VISUAL DESIGN

The interface should look like a modern government analytics platform.

Design principles:

* Clean
* Professional
* Data-heavy
* Minimal decoration
* Strong typography
* Clear hierarchy

Avoid:

* Excessive gradients
* Huge decorative illustrations
* Gamification
* Fake 3D charts
* Excessive animations

Use cards, maps, charts, tables and status indicators.

---

# 48. DASHBOARD COLOR SEMANTICS

Use consistent semantic colours:

```text
Green = Balanced / Positive
Red = Shortage / Critical
Amber = Warning
Blue = Information
Gray = Neutral
```

Always accompany colour with text.

---

# 49. DEMO DATA

Because production datasets may not be available during development, create a synthetic but realistic dataset.

Generate:

```text
50 districts
5 states
5 sectors
30 occupations
100,000 job postings
50,000 training records
```

The synthetic data should contain realistic correlations.

Example:

```text
Solar PV demand
→ increases over time

Solar PV training capacity
→ remains relatively low

Therefore:
forecast gap increases
```

Similarly create oversupply examples.

Example:

```text
Generic Retail Sales
→ stagnant demand

Training seats
→ high

Therefore:
oversupply emerges
```

The dashboard must clearly label demo/synthetic data.

---

# 50. SEED DATA SCENARIOS

Create at least these scenarios.

### Scenario 1 — Shortage

```text
Pune
CNC Operator
Demand growth: +18%
Supply coverage: 72%
Status: Critical Shortage
```

### Scenario 2 — Saturation

```text
Mumbai
Generic Retail Sales Associate
Demand growth: +2%
Supply growth: +22%
Status: Saturation Risk
```

### Scenario 3 — Emerging Skill

```text
Gujarat
Solar PV Technician
Demand growth: +41%
Supply growth: +12%
Status: Emerging Shortage
```

### Scenario 4 — Balanced

```text
Bengaluru
Healthcare Assistant
Demand growth: +8%
Supply growth: +7%
Status: Balanced
```

---

# 51. DEMO FLOW

The final SIH demonstration should follow this exact story.

## Step 1

Open national dashboard.

Show:

```text
Total Demand
Training Supply
Critical Shortages
Saturation Risks
```

## Step 2

Open geographic map.

Select:

```text
Maharashtra
```

## Step 3

Select:

```text
Pune
```

## Step 4

Select:

```text
Manufacturing
```

## Step 5

Select:

```text
CNC Operator
```

## Step 6

Show:

```text
Current Demand
Current Supply
Demand Growth
Projected Demand
Projected Supply
Projected Gap
```

## Step 7

Open early warning.

Show:

```text
CRITICAL SHORTAGE
```

## Step 8

Open recommendation.

Show:

```text
Recommended capacity increase:
18%
```

## Step 9

Open scenario simulator.

Change:

```text
Training seats +20%
```

## Step 10

Show:

```text
Projected gap decreases
Placement potential improves
```

This tells a complete story:

```text
Data
→ Intelligence
→ Forecast
→ Problem
→ Recommendation
→ Action
→ Impact
```

---

# 52. EXPLAINABILITY

Every AI prediction must answer:

> "Why did the system predict this?"

For each forecast show:

```text
Key drivers:

+ Job postings increased 18%
+ Employer demand increased 12%
+ Wage signal increased 7%
- Training capacity increased only 4%
```

For recommendations:

```text
Why this recommendation?

1. High demand growth
2. Low supply coverage
3. Strong historical placement
4. High forecast confidence
```

---

# 53. AI CHAT ASSISTANT — OPTIONAL

Add only after core features work.

Example:

Planner asks:

> "Which manufacturing trades in Maharashtra are likely to face shortages next year?"

Assistant returns:

```text
Top predicted shortages:

1. CNC Operator — Pune
2. Welder — Nashik
3. Industrial Electrician — Aurangabad

Highest priority:
CNC Operator

Reason:
Projected supply covers only 74% of demand.
```

The assistant must query the platform's structured data rather than inventing facts.

Use RAG/tool calling if implemented.

---

# 54. MODEL EXPLANATION PANEL

Each forecast should have:

```text
Forecast methodology

Model:
XGBoost + Time Series Ensemble

Training period:
Jan 2023 – Jun 2026

Forecast horizon:
12 months

MAPE:
8.4%

Confidence:
High
```

This is important for government trust.

---

# 55. API RESPONSE STANDARD

All APIs should follow:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "updated_at": "2026-10-04T10:00:00Z",
    "source": "KaushalDrishti",
    "version": "1.0"
  }
}
```

Errors:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILTER",
    "message": "Invalid district identifier"
  }
}
```

---

# 56. LOGGING

Log:

* API errors
* Dataset ingestion
* Model training
* User actions
* Scenario runs
* Export operations

Do not log sensitive information.

---

# 57. TESTING

## Backend

Use pytest.

Test:

* API endpoints
* Forecast calculations
* Gap calculations
* Data validation
* Recommendation logic

## Frontend

Use:

* Playwright
* React Testing Library

Test:

* Dashboard loading
* Filters
* Drill-down
* Scenario simulator
* Export

---

# 58. ACCEPTANCE CRITERIA

The MVP is considered complete when:

### Data

* [ ] Multiple datasets can be uploaded.
* [ ] Data is validated.
* [ ] Occupations can be normalized.
* [ ] Districts can be normalized.

### Intelligence

* [ ] Demand Index is calculated.
* [ ] Supply Index is calculated.
* [ ] Demand-Supply Gap is calculated.
* [ ] Occupations are classified.

### Forecasting

* [ ] Forecasts are generated.
* [ ] Forecast accuracy is displayed.
* [ ] Confidence ranges are displayed.

### Alerts

* [ ] Shortages are detected.
* [ ] Saturation is detected.
* [ ] Emerging skills are detected.

### Dashboard

* [ ] India-level dashboard works.
* [ ] State drill-down works.
* [ ] District drill-down works.
* [ ] Sector filtering works.
* [ ] Occupation detail works.

### Recommendations

* [ ] Recommendations are generated.
* [ ] Recommendations explain their reasoning.

### Scenarios

* [ ] Training capacity can be changed.
* [ ] Forecast gap updates.
* [ ] Before/after comparison is shown.

### Export

* [ ] CSV export works.
* [ ] Excel export works.
* [ ] PDF report works.

### Accessibility

* [ ] Responsive UI.
* [ ] Keyboard navigation.
* [ ] Multilingual framework.

---

# 59. DEVELOPMENT ORDER

Do NOT build everything simultaneously.

Follow this sequence.

## Sprint 1 — Foundation

Build:

* Repository
* Next.js
* FastAPI
* PostgreSQL
* Docker
* Authentication
* Base UI
* Database models

---

## Sprint 2 — Data

Build:

* Dataset upload
* CSV/XLSX parsing
* Data validation
* State/district tables
* Occupation tables
* Training tables
* Job tables
* Seed data

---

## Sprint 3 — Analytics

Build:

* Demand Index
* Supply Index
* Gap calculation
* Ranking
* Filters

---

## Sprint 4 — Forecasting

Build:

* Historical aggregation
* Forecasting pipeline
* Model training
* Evaluation
* Forecast API
* Forecast charts

---

## Sprint 5 — Intelligence

Build:

* Early warning engine
* Recommendation engine
* Priority scoring
* Explainability

---

## Sprint 6 — Dashboard

Build:

* National dashboard
* State page
* District page
* Occupation page
* Map
* Alerts

---

## Sprint 7 — Scenario Engine

Build:

* Scenario UI
* Capacity adjustment
* Recalculation
* Before/after visualization

---

## Sprint 8 — Polish

Build:

* Reports
* CSV/Excel/PDF
* Multilingual support
* Accessibility
* Performance optimization
* Demo mode

---

# 60. DEMO MODE

Create a special:

```text
Demo Mode
```

button.

Demo mode should load a controlled dataset so the SIH presentation is deterministic.

Do not depend on external APIs during the live presentation.

Show:

```text
Data source:
Demo / Synthetic Dataset

Last simulated update:
04 Oct 2026
```

---

# 61. PERFORMANCE TARGETS

For MVP:

```text
Dashboard initial load:
< 3 seconds

API response:
< 500 ms for normal queries

Scenario calculation:
< 2 seconds

Map interaction:
smooth

Forecast generation:
background job
```

Large ML training jobs should not block the API.

---

# 62. FUTURE SCALABILITY

Architecture should eventually support:

* More states
* All districts
* More occupations
* More data sources
* Real-time feeds
* Industry APIs
* Government SSO
* Advanced ML
* LLM assistant
* Mobile application

But do not implement these prematurely.

---

# 63. IMPORTANT PRODUCT PRINCIPLES

### Principle 1

**Forecasting > Visualization**

This should not become just another dashboard.

### Principle 2

**Explain every AI output.**

### Principle 3

**Data quality must be visible.**

### Principle 4

**Never present synthetic/demo data as real government data.**

### Principle 5

**Recommendations are decision support, not automatic policy decisions.**

### Principle 6

**Keep all thresholds and model weights configurable.**

### Principle 7

**Every number should have a source and timestamp where possible.**

---

# 64. ANTIGRAVITY IMPLEMENTATION INSTRUCTIONS

Build the project incrementally.

Do not create placeholder buttons that do nothing.

Every visible feature should either:

1. Work against the backend, or
2. Clearly be marked as coming soon.

Do not hard-code dashboard numbers into React components.

All dashboard metrics must come from APIs.

Use seeded demo data so the application is functional immediately after setup.

Use TypeScript types generated/shared from the API schemas where practical.

Use environment variables for configuration.

Create database migrations.

Create seed scripts.

Create README documentation.

Create API documentation using FastAPI/OpenAPI.

---

# 65. REQUIRED ENVIRONMENT VARIABLES

Example:

```env
DATABASE_URL=
JWT_SECRET=
REDIS_URL=
MODEL_STORAGE_PATH=
NEXT_PUBLIC_API_URL=
MAPBOX_TOKEN=
```

Do not commit `.env`.

Provide:

```text
.env.example
```

---

# 66. REQUIRED COMMANDS

The README should provide:

```bash
# install frontend
npm install

# start frontend
npm run dev

# install backend
pip install -r requirements.txt

# start backend
uvicorn app.main:app --reload

# database
docker compose up -d postgres

# migrations
alembic upgrade head

# seed demo data
python scripts/seed_demo_data.py

# train models
python scripts/train_models.py

# run tests
pytest
```

Adjust commands according to the final project structure.

---

# 67. FINAL PRODUCT SCREEN STRUCTURE

The finished application should have:

```text
┌──────────────────────────────────────────────────────────┐
│ KAUSHALDRISHTI                         User / Language   │
├──────────────┬───────────────────────────────────────────┤
│              │                                           │
│ Dashboard    │              MAIN CONTENT                 │
│ Demand       │                                           │
│ Supply       │              KPI CARDS                    │
│ Forecasts    │                                           │
│ Skill Gaps   │              MAP / CHARTS                │
│ Geography    │                                           │
│ Alerts       │              TABLES                       │
│ Recommend.   │                                           │
│ Simulator    │                                           │
│ Reports      │                                           │
│ Data         │                                           │
│              │                                           │
└──────────────┴───────────────────────────────────────────┘
```

---

# 68. SUCCESS METRICS

The SIH prototype should demonstrate:

### Data Coverage

At least:

```text
5 states
20+ districts
5 sectors
20+ occupations
```

### Analytics

```text
Demand index
Supply index
Gap index
```

### Forecasting

Demonstrate measurable historical validation.

### Intelligence

Demonstrate:

```text
Shortage detection
Saturation detection
Emerging skill detection
```

### Decision Support

Demonstrate:

```text
Recommendation
Scenario simulation
Export
```

---

# 69. FINAL VALUE PROPOSITION

KaushalDrishti transforms fragmented labour-market data into actionable planning intelligence.

```text
Fragmented Data
       ↓
Unified Labour Intelligence
       ↓
Demand & Supply Measurement
       ↓
AI Forecasting
       ↓
Skill Gap Detection
       ↓
Early Warning
       ↓
Training Recommendations
       ↓
Scenario Simulation
       ↓
Better Skill Planning
```

The ultimate objective is:

**Train people for the jobs that are actually emerging, in the places where they are needed, while reducing training capacity in occupations approaching saturation.**

---

# 70. FINAL MVP PRIORITY

If development time becomes limited, implement these features first:

### P0 — MUST HAVE

1. Dashboard
2. Data ingestion
3. Demand Index
4. Supply Index
5. Demand-Supply Gap
6. Forecast
7. District map
8. Occupation detail
9. Early warnings
10. Recommendations

### P1 — HIGH VALUE

11. Scenario simulator
12. Export
13. Data quality
14. Multilingual UI
15. Forecast explainability

### P2 — OPTIONAL

16. AI chat assistant
17. Advanced NLP
18. Real-time integrations
19. Government SSO
20. Mobile application

The P0 features must be fully functional before implementing P2 features.
