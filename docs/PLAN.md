# Skill Sutra: Refined SIH Build Plan (for Antigravity)

AI-enabled labour market intelligence and skill demand-supply forecasting.

This replaces the original 70-section spec as the **working plan**. The original stays as reference. This version cuts scope to what wins a hackathon demo, fixes technical problems in the original, and gives you prompts to paste into Antigravity in order.

---

## 0. Verdict on the original spec

It is a strong product vision, but built as written it will not finish. It describes roughly 6 months of work for a small team.

**What judges actually score:** a working end-to-end story, a credible forecast with honest validation, explainability, and a clear answer to "where does your data come from?" They do not score the number of endpoints.

**Strategy:** build one vertical slice that is deep and polished (the demo story), and make everything else either shallow-but-real or explicitly marked "roadmap".

---

## 1. Problems found in the original spec (fix these)

| # | Issue | Fix |
|---|-------|-----|
| 1 | **Gap thresholds are ambiguous** ("Demand > Supply by ≥30%": of what?) | Define `gap_pct = (Demand − Supply) / Demand`. Shortage if positive. See §5. |
| 2 | **Priority Score is a pure product** (Gap × Growth × Importance × Confidence). Any zero or negative term collapses the score, and oversupply gets a negative "priority". | Use a weighted sum of normalized 0–1 terms. Separate ranking for shortages and for saturation. |
| 3 | **Demand Index includes "Employer Hiring Score" and "Wage Signal"** with no data source in the MVP. | Keep 3 signals you can actually generate or ingest (volume, growth, skill frequency) plus wage as optional. Weights stay configurable. |
| 4 | **Spec says "100,000 job postings" as the data core.** Forecasting 30 occupations × 50 districts from raw postings is slow to build and unnecessary. | Generate postings for realism and the upload demo, but forecast on a **monthly aggregated panel** (district × occupation × month). |
| 5 | **Forecasting on synthetic data you generated yourself is circular.** If judges notice, accuracy numbers look fake. | Be upfront: synthetic data with injected trend, seasonality and noise. Show validation honestly (time-based holdout, naive baseline comparison). Include one **real** public dataset slice if you can (see §3). |
| 6 | **Real NCS / PLFS / e-Shram APIs** are not openly available for integration. | Say "adapter-ready" and show the generic CSV/XLSX/JSON ingestion mapped to those schemas. Never claim live integration. |
| 7 | **Redis, Celery, Alembic migrations, SSO, SAML, Mapbox, RAG chat** all in scope. | Cut. Precompute forecasts in a script. Use `create_all` (or one Alembic migration). Chat assistant is a stretch goal only. |
| 8 | **District-level choropleth needs district boundary GeoJSON** (heavy, often mismatched names). | Use **state choropleth + district circle markers** (lat/lng centroids you store in the seed). Same drill-down feel, much less risk. |
| 9 | **Three languages (EN/HI/MR)** across the whole UI. | Build i18n scaffolding (`next-intl` or simple JSON dictionaries), ship EN + Hindi for ~40 key strings, Marathi optional. |
| 10 | **Sentence-transformer occupation matching** can eat hours. | Ship a small, honest version: TF-IDF/fuzzy plus a keyword dictionary mapping titles to ~30 occupation codes, with a confidence score. Mention embeddings as the upgrade path, or add them if time remains. |
| 11 | **Postgres plus Docker** adds setup risk on a laptop at demo time. | Develop on SQLite via SQLAlchemy (Postgres-compatible). Offer docker-compose Postgres as an optional profile. A demo that boots in one command beats one that needs Docker healthy. |
| 12 | **"Never present synthetic data as real"** is correct, but the demo mode must still feel real. | Persistent "Demo / Synthetic dataset" badge in the header and on exports. This builds trust and is not a weakness. |

---

## 2. Scope: what gets built

### Tier A: Demo-critical (must be flawless)
1. Seeded data: 4 states, ~24 districts, 5 sectors, ~24 occupations, 36 months history
2. Demand Index, Supply Index, Gap and classification (5 classes)
3. Forecast (3/6/12 months) with confidence band, MAPE, model comparison
4. National dashboard: KPIs, trend, gap distribution, top shortages, top saturation, recent alerts
5. Map: state choropleth plus district markers, switchable metric
6. District page and Occupation detail page, with breadcrumb drill-down
7. Early warning alerts (shortage, saturation, emerging, regional imbalance)
8. Explainable recommendations with priority score
9. Scenario simulator with before/after charts

### Tier B: Real but shallow (build only after A works)
10. Dataset upload (CSV/XLSX) with column mapping, validation and a quality score
11. CSV and PDF export (Excel optional)
12. EN/Hindi toggle
13. Forecast methodology panel and key-driver breakdown
14. Role switch (national vs state planner)

### Tier C: Roadmap slide only (do not build)
SSO/SAML, real-time feeds, Celery/Redis, mobile app, RAG assistant, 24-month horizon, Marathi, advanced NLP.

---

## 3. Data strategy (decide this first)

**Honest framing for judges:**
> "Production data (NCS, PLFS, e-Shram, Skill India) requires government data-sharing agreements. We built a source-agnostic ingestion layer and validated the full pipeline on a calibrated synthetic dataset. Plug in real feeds and nothing downstream changes."

**Generate (seed script):**
- 4 states (Maharashtra, Karnataka, Gujarat, Telangana), 5-8 districts each
- 5 sectors, ~24 occupations (tagged with a strategic importance 0-1)
- Monthly panel Jan 2023 to Sep 2026 per district × occupation: `demand` (job postings, hiring), `seats`, `enrolled`, `certified`, `placed`
- Demand = trend + yearly seasonality + noise, with a growth profile per occupation
- Supply = capacity × completion × certification × placement-adjustment
- Optionally ~100k raw job-posting rows derived from the panel (used only for the upload demo and the title-normalization demo)

**Pin these four scenarios exactly (they are the demo):**

| Scenario | Location | Occupation | Demand growth | Supply | Expected status |
|---|---|---|---|---|---|
| Shortage | Pune | CNC Operator | +18% | covers ~72% | Critical Shortage |
| Saturation | Mumbai | Retail Sales Associate | +2% | +22% growth | Saturation Risk |
| Emerging | Gujarat (e.g. Ahmedabad, Surat, Vadodara) | Solar PV Technician | +41% | +12% growth | Emerging Shortage |
| Balanced | Bengaluru | Healthcare Assistant | +8% | +7% growth | Balanced |

Seed the rest with random-but-bounded profiles so the map has variety (about 15% shortages, 15% oversupply, the rest balanced).

**Optional authenticity boost (30 min, only if time):** pull one genuinely public dataset (for example a state-level PLFS or NSDC aggregate table, or a public Skill India training-partner list), load it through the upload flow, and show it in the data-quality screen. Label its source. One real dataset that visibly passes through the pipeline is worth more than ten claimed integrations.

---

## 4. Simplified architecture

```
Next.js (TS, Tailwind, shadcn/ui, Recharts, react-leaflet)
        |  REST /api/v1
FastAPI (modular monolith)
   routers/  services/  ml/  models/  schemas/
        |
SQLite (default) / Postgres (optional)
        |
scripts/  seed_demo_data.py  ->  compute_indices.py  ->  train_forecasts.py  ->  generate_alerts.py
```

Key decision: **everything heavy is precomputed by scripts and stored in tables.** The API only reads and does light math (and the scenario recalculation). That keeps every endpoint under 500 ms and removes background-job infrastructure.

```
skill-sutra/
  frontend/  (app/, components/, features/, lib/api.ts, lib/i18n/)
  backend/   (app/{api,core,models,schemas,services,ml}/, scripts/, tests/)
  data/sample/   (demo CSVs, an intentionally messy upload file)
  README.md  .env.example  docker-compose.yml (optional)
```

---

## 5. Core formulas (use these exactly; all configurable in `config.yaml`)

**Supply (per district × occupation × period)**
```
certified_supply = seats × completion_rate × certification_rate
effective_supply = certified_supply × placement_adjustment   # optional, default 1.0
```

**Demand Index (0-100)** using min-max normalization across the selected scope:
```
LDI = 100 × (0.40·volume_norm + 0.35·growth_norm + 0.25·skill_freq_norm)
```
Bands: 0-30 Low, 31-50 Moderate, 51-70 High, 71-100 Very High. (Wage signal is an optional fourth term; renormalize weights if it is enabled.)

**Supply Index (0-100):** normalized blend of capacity, certified output and completion rate, with the same band scheme.

**Gap (absolute and percent)**
```
gap     = forecast_demand − forecast_supply
gap_pct = gap / forecast_demand
```

**Classification (thresholds in config)**
```
gap_pct ≥ +0.30           Critical Shortage
+0.15 ≤ gap_pct < +0.30   Shortage
−0.15 < gap_pct < +0.15   Balanced
−0.30 < gap_pct ≤ −0.15   Oversupply
gap_pct ≤ −0.30           Saturation Risk
```
Add a **trajectory flag** "Emerging" when growth is high (≥ +25%) but the current gap is still small. This is what makes the Gujarat Solar scenario read as "Emerging Shortage".

**Priority Score (0-100), shortages**
```
priority = 100 × ( 0.40·gap_severity + 0.25·demand_growth_norm
                 + 0.20·strategic_importance + 0.15·forecast_confidence )
```
All terms are normalized to 0-1. Saturation items are ranked separately by `|gap_pct|` and a "capacity to reduce" figure.

**Recommended capacity change**
```
required_increase_pct = clamp( gap / current_effective_supply , 0 , 0.35 )
```
Show it as a range (for example "+15% to +20%": the lower bound uses the lower confidence bound, the upper uses the point forecast). Always show reasons next to it.

**Confidence label:** derived from validation MAPE plus data completeness:
- High: MAPE < 10% and completeness > 90%
- Medium: MAPE 10-20%
- Low: otherwise

**Scenario simulator (instant, no ML retrain)**
```
new_seats  = seats × (1 + pct) + added_centres × avg_centre_seats − removed_centres × avg_centre_seats
new_supply = new_seats × completion_rate' × certification_rate × placement_adj
new_gap    = forecast_demand − new_supply
```
Return before/after values, the new classification, and "months until gap closes" if applicable. State the lag assumption explicitly: new seats only produce certified output after the course duration. A simple 1-2 quarter delay is fine, and it reads as realistic to judges.

---

## 6. Forecasting plan (keep it simple and defensible)

Candidate models per series (district × occupation), run in a script:
1. **Seasonal naive** (baseline; everything must beat this)
2. **Holt-Winters / ETS** (`statsmodels`)
3. **XGBoost / LightGBM** with lag, rolling-mean and month features (trained globally across series, which is faster and more stable)

Process:
- Train on 2023-01 to 2026-03, validate on 2026-04 to 2026-06 (time-based, never shuffled), forecast 2026-10 onward.
- Pick the best model per sector (or per series if fast enough) by validation MAPE.
- Prediction intervals: ETS native intervals, or residual-based quantiles for XGBoost.
- Store in `forecasts`: series keys, horizon, `demand`, `supply`, `lower`, `upper`, `model_name`, `mape`, `confidence_label`, `trained_at`.
- Dashboard shows **overall forecast accuracy as the median MAPE** and a small table "model vs baseline" (this is the credibility slide).

Explainability (cheap but effective):
- Key drivers panel computed from period-over-period changes (postings growth, wage change, seats growth). It is plain arithmetic, so it is always consistent with the data.
- Optional: XGBoost feature importance (global).

---

## 7. Database (reduced to what the demo needs)

```
users(id, email, password_hash, role, state_id?)
states, districts(lat, lng), sectors, occupations(sector_id, nco_code, strategic_importance)
skills, occupation_skills
training_centres(district_id), training_capacity(centre_id, occupation_id, seats, period)
monthly_panel(district_id, occupation_id, month, demand, seats, enrolled, certified, placed, avg_salary)
job_postings(raw rows; optional)
demand_indices, supply_indices
forecasts, forecast_models
skill_gaps(forecast_id, gap, gap_pct, class, priority, ...)
alerts, recommendations(reasons JSON)
scenarios, scenario_results
datasets, data_quality_reports
audit_log
```

Add composite indexes on `(district_id, occupation_id, month)`. Every table row that is derived should carry `computed_at` and `dataset_version` so "every number has a source and timestamp" is literally true.

---

## 8. API (trimmed, same response envelope)

All responses: `{ success, data, meta: { updated_at, source, version, is_synthetic } }`.

```
POST /auth/login                GET /auth/me
GET  /dashboard/summary
GET  /geo/states                GET /geo/districts?state=
GET  /demand/trends             GET /demand/top
GET  /supply/capacity
GET  /gaps?state&district&sector&occupation&horizon
GET  /gaps/top-shortages        GET /gaps/top-saturation
GET  /forecast/{occupation_id}?district=&horizon=
GET  /map/metrics?level=state|district&metric=
GET  /alerts
GET  /recommendations
POST /scenarios/simulate
POST /datasets/upload           GET /datasets    GET /datasets/{id}/quality
POST /exports                   GET /exports/{id}
POST /normalize/title           # occupation normalization demo
```
Swagger docs come free from FastAPI.

---

## 9. Frontend pages (7 total)

1. **Dashboard**: global filter bar, KPI cards, demand-vs-supply trend, gap distribution donut, top shortages and saturation tables, recent alerts, "Demo / Synthetic" badge, data-freshness label
2. **Geography**: map with metric switcher, state click zooms to districts, side panel on district click
3. **District page**: LDI / SI / gap headline, top occupations, shortages, saturated trades, forecast chart, recommendations
4. **Occupation page** (the hero screen): current vs projected demand/supply, status badge, forecast with confidence band, key drivers, methodology panel, alert, recommendation
5. **Recommendations**: ranked table, sortable and filterable, with an expandable "why" row
6. **Scenario Simulator**: sliders (seat change %, centres, completion rate), before/after chart and metrics
7. **Data Management**: upload, column mapping, validation result, quality score

Breadcrumb component on every page: `India / Maharashtra / Pune / Manufacturing / CNC Operator`.

Rules: no hard-coded numbers in components, status badges always show text plus colour, every chart has a text summary for screen readers, no dead buttons (use a "Coming soon" tag if needed).

---

## 10. Build schedule

Time-box in blocks. If you are behind at a checkpoint, cut Tier B, never Tier A.

| Block | Goal | Checkpoint (must be true before moving on) |
|---|---|---|
| **0 · Setup (≈1 h)** | Repo, Next.js + FastAPI skeleton, DB models, `.env.example`, one-command run | Frontend calls `/health` on the backend |
| **1 · Data (≈2-3 h)** | Seed script, 4 pinned scenarios, indices, gaps | SQL shows the four scenarios with correct classes |
| **2 · Forecast (≈2-3 h)** | Three models, validation, stored forecasts | `forecasts` populated, median MAPE printed, beats baseline |
| **3 · Intelligence (≈1-2 h)** | Alerts, recommendations with reasons, priority score | Pune CNC shows Critical Shortage and +15-20% suggestion |
| **4 · Core UI (≈4-5 h)** | Dashboard, map, district, occupation pages | The 10-step demo story can be clicked through |
| **5 · Simulator (≈1-2 h)** | Endpoint plus UI | +20% seats visibly shrinks the gap |
| **6 · Tier B (≈2-3 h)** | Upload and quality score, CSV/PDF export, EN/HI | Upload a messy CSV and see a quality report |
| **7 · Polish (≈2 h)** | Responsive pass, a11y pass, demo mode, README, seed reset | Fresh clone → working app in under 5 minutes |
| **8 · Rehearsal (≈1 h)** | Demo script plus judge Q&A | Two full dry runs without touching the code |

Use Antigravity's agents in parallel only after Block 1: one on backend, one on frontend, against the agreed API contract in §8.

---

## 11. Antigravity prompts (paste in order)

**Prompt 0: project rules (set as persistent instructions or the first message)**
```
You are building Skill Sutra, an AI labour-market intelligence MVP for a hackathon demo.
Stack: Next.js + TypeScript + Tailwind + shadcn/ui + Recharts + react-leaflet; FastAPI + SQLAlchemy + SQLite (Postgres-compatible); pandas, statsmodels, xgboost.
Rules:
- Modular monolith. No microservices, no Redis/Celery.
- Heavy computation (indices, forecasts, alerts) runs in scripts under backend/scripts/ and is stored in DB tables. The API reads stored results.
- No hard-coded numbers in React components; every metric comes from the API.
- Every API response uses {success, data, meta:{updated_at, source, version, is_synthetic}}.
- All thresholds and weights live in backend/config.yaml.
- Every status shows text plus colour. Every chart has an accessible text summary.
- No dead buttons: build it or label it "Coming soon".
- UI must clearly show a "Demo / Synthetic data" badge.
- After each task, run the relevant tests/scripts and report what passed.
Follow the formulas in the plan file docs/PLAN.md exactly.
```

**Prompt 1: skeleton**
```
Create the monorepo (frontend/, backend/, data/sample/, docs/). Scaffold FastAPI with routers for health, auth (JWT, two seeded users: national_planner, state_planner for Maharashtra), geo, dashboard. Scaffold Next.js app with a sidebar layout (Dashboard, Geography, Recommendations, Simulator, Data), header with language toggle and a Demo badge, and a typed API client. Add .env.example, a README with run commands, and make `npm run dev` + `uvicorn` work together. Verify the frontend can call /health.
```

**Prompt 2: models and seed data**
```
Implement SQLAlchemy models per docs/PLAN.md section 7. Write backend/scripts/seed_demo_data.py generating: 4 states, ~24 districts with lat/lng, 5 sectors, ~24 occupations with strategic_importance, and a monthly panel Jan 2023 to Sep 2026 per district x occupation (demand, seats, enrolled, certified, placed, avg_salary) using trend + seasonality + noise. Pin these exact scenarios: Pune CNC Operator (+18% demand, supply covers ~72%, Critical Shortage); Mumbai Retail Sales Associate (+2% demand, +22% supply growth, Saturation Risk); Gujarat Solar PV Technician (+41% demand, +12% supply growth, Emerging Shortage); Bengaluru Healthcare Assistant (+8% / +7%, Balanced). Make the script deterministic (fixed seed) and idempotent. Print a verification table of the four scenarios at the end.
```

**Prompt 3: indices and gaps**
```
Implement scripts/compute_indices.py: Demand Index, Supply Index, gap, gap_pct, and 5-class classification plus the "Emerging" trajectory flag, exactly as in docs/PLAN.md section 5, with weights/thresholds read from config.yaml. Add unit tests for the classification boundaries and the supply formula. Expose GET /gaps, /gaps/top-shortages, /gaps/top-saturation with filters.
```

**Prompt 4: forecasting**
```
Implement scripts/train_forecasts.py: for each district x occupation series, fit seasonal-naive, Holt-Winters, and a global XGBoost model with lag/rolling/month features. Time-based split: train to 2026-03, validate 2026-04..06. Select the best model per sector by validation MAPE. Produce 3/6/12-month forecasts for demand and supply with lower/upper bounds. Store results plus model metadata (name, version, training period, MAE, RMSE, MAPE) and a confidence label. Print median MAPE and a model-vs-baseline table. Expose GET /forecast/{occupation_id}.
```

**Prompt 5: alerts and recommendations**
```
Implement scripts/generate_alerts.py and the recommendation service: alert types shortage, saturation, emerging, declining, regional imbalance. Recommendations must store a list of human-readable reasons (growth, supply coverage, placement rate, confidence) and a suggested capacity range using the formula in the plan. Compute priority score as the weighted sum in the plan. Expose GET /alerts and /recommendations with sorting/filtering. Add tests asserting Pune CNC gets a Critical Shortage alert and a +15-20% suggestion.
```

**Prompt 6: dashboard + map**
```
Build the Dashboard page and Geography page. Dashboard: global filter bar (state, district, sector, occupation, horizon), KPI cards, demand-vs-supply trend, gap-distribution donut, top shortages and saturation tables, recent alerts, data freshness and Demo badge. Geography: state-level choropleth (public India state GeoJSON committed to the repo) with district circle markers, a metric switcher (demand, supply, gap, growth, coverage, saturation), and a side panel on district click. Add a Breadcrumb component. All data from the API.
```

**Prompt 7: district + occupation pages**
```
Build the District page and the Occupation detail page (the hero screen). Occupation page shows: status badge (text + colour), current vs projected demand/supply, gap, forecast chart with confidence band, key-drivers panel (+/- contributions from period-over-period changes), forecast methodology panel (model, training period, horizon, MAPE, confidence), the alert, and the recommendation with reasons. Support drill-down from the map and tables via breadcrumbs.
```

**Prompt 8: simulator**
```
Implement POST /scenarios/simulate using the scenario formulas in the plan, including the 1-2 quarter training lag assumption (stated in the UI). Build the Simulator page: selectors for state/district/sector/occupation, controls for seat change %, add/remove centres, completion rate; show before/after metrics and a before/after chart, the new classification, and a plain-language summary. Calculation must return under 2 seconds. Add tests: +20% seats on Pune CNC reduces the gap.
```

**Prompt 9: data management, export, i18n**
```
Build dataset upload (CSV/XLSX): file-type validation, schema detection, column-mapping UI, cleaning and deduplication, title normalization (keyword dictionary + fuzzy match with confidence, storing raw_title, normalized_title, nco_code, confidence, method), geography validation, and a quality score (missing values, duplicates, invalid geography/occupation, date coverage). Include data/sample/messy_job_postings.csv for the demo. Then add CSV and PDF export of the current filtered view (including timestamp, model version, and a synthetic-data notice) and EN/Hindi i18n with translation keys (no hard-coded UI text).
```

**Prompt 10: polish**
```
Do a responsive pass (desktop-first, usable on tablet/mobile), keyboard navigation, focus states, contrast, aria-labels, text alternatives for charts. Add a one-command setup (make setup / scripts) that seeds, computes, trains and starts both servers. Add a Demo Mode button that resets to the deterministic seed and lands on the Pune CNC story. Write the README, then do a fresh-clone dry run and fix whatever breaks.
```

---

## 12. Demo script (about 5 minutes, memorise this)

1. **Problem (20 s):** "India trains millions of people but has no unified view of where jobs are emerging versus where training is oversupplied."
2. **Dashboard (30 s):** KPIs, critical shortages, saturation risks, the Demo/Synthetic badge ("we are transparent about data").
3. **Map (30 s):** Maharashtra → Pune.
4. **Drill-down (30 s):** Manufacturing → CNC Operator.
5. **Occupation page (60 s):** demand +18%, supply covers 72%, forecast band, key drivers, MAPE vs baseline.
6. **Alert and recommendation (30 s):** "Critical Shortage → increase capacity 15-20%, because…" (read the reasons).
7. **Simulator (60 s):** +20% seats → gap shrinks, status moves toward Balanced, and "impact appears after the training lag".
8. **Contrast (20 s):** show Mumbai Retail as Saturation (it recommends reducing capacity, not only increasing it).
9. **Close (20 s):** upload a messy CSV, show the quality score, then the roadmap (real NCS/PLFS adapters, SSO, more states).

**Fallbacks:** pre-recorded 2-minute screen capture, local-only build (no external API calls, map tiles cached or a plain GeoJSON with no tile layer), and a seeded reset button.

---

## 13. Likely judge questions (prepare answers)

- **"Is this real data?"** Synthetic and calibrated, clearly labelled. The pipeline is source-agnostic and was exercised on an uploaded dataset. Real feeds need data-sharing agreements, which are the first deployment milestone.
- **"How accurate is the forecast?"** Show the median MAPE on the time-based holdout and the improvement over the seasonal-naive baseline. Do not claim more than the validation supports.
- **"Why not just a dashboard?"** Forecasting, gap classification, explainable recommendations and the what-if simulator are the product. The dashboard is only the delivery.
- **"Will it replace planners?"** No. It is decision support, with every recommendation showing its reasoning and confidence.
- **"How does it scale?"** The schema and ingestion are geography/occupation-agnostic; scripts parallelize per series; heavy jobs move to a queue and Postgres when going beyond pilot states.
- **"How do you map messy job titles to NCO?"** Keyword dictionary plus fuzzy matching with a confidence score today, embedding-based matching as the next step, low-confidence items routed to human review.
- **"Equity and bias?"** Show regional coverage, flag districts with sparse data as Low confidence rather than hiding them.

---

## 14. Definition of done

- [ ] Fresh clone → seeded app running in under 5 minutes with one command
- [ ] The four pinned scenarios show the right class, numbers and alerts
- [ ] Forecasts exist for 3/6/12 months with bands, MAPE, and a baseline comparison
- [ ] The 10-step demo works with no manual data fiddling
- [ ] Every recommendation shows reasons and confidence
- [ ] Simulator updates in under 2 seconds with a before/after view
- [ ] Upload flow rejects bad files and shows a quality score
- [ ] CSV and PDF export work
- [ ] EN/Hindi toggle works on the main screens
- [ ] "Demo / Synthetic" labelling is visible everywhere it matters
- [ ] Zero dead buttons; zero hard-coded dashboard numbers
- [ ] Two clean rehearsals

## 15. Tonight: first 30 minutes

1. Create the repo and save this file as `docs/PLAN.md`.
2. Paste **Prompt 0**, then **Prompt 1**.
3. While it scaffolds, write the pinned scenario numbers into a small `scenarios.yaml` so seed and tests share one source of truth.
4. Do not start the UI until the Block 1 and 2 checkpoints pass, because the UI is easy once the numbers are right.