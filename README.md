# Skill Sutra (कौशल सूत्र)
> **AI-Enabled Labour Market Intelligence & Skill Demand-Supply Forecasting Monolith**

Skill Sutra is a hackathon-ready, production-grade MVP providing district and trade-level labour market intelligence across India. It ingests employer demand signals, ITI/PMKK training capacity, models multi-quarter predictive forecasts, flags skill shortages or saturation risks, and enables interactive policy simulation.

---

## 🌟 Key Features & Highlights

1. **Modular Monolith Architecture**: Built as a clean, fast FastAPI + SQLite monolith with precomputed ML index tables and zero external message queue overhead (no Redis/Celery required).
2. **Pinned Hackathon Demo Stories**:
   - 🔴 **Pune - CNC Operator**: Demand growth +18%, supply covers 34.2% -> **Critical Shortage Alert** (Rec: +26.2% to +35.0% capacity).
   - 🟣 **Mumbai - Retail Sales Associate**: Saturation risk (oversupply by -38.1%).
   - 🟡 **Gujarat - Solar PV Technician**: Emerging shortage (rapid +41% demand expansion).
   - 🟢 **Bengaluru - Healthcare Assistant**: Balanced trade growth.
3. **Forecasting Engine**: Time-based holdout evaluation comparing **Seasonal Naive Baseline**, **Holt-Winters ETS**, and **XGBoost Regressor** with 3/6/12 month predictive horizons and confidence bands.
4. **Hero Occupation Detail Screen**: Deep-dive analytics featuring forecast curves, confidence bounds, key drivers (+/- % contributions), model methodology panel, alerts, and actionable recommendations with human-readable rationale.
5. **Interactive What-If Policy Simulator**: Real-time simulation of sanctioned seat changes (-50% to +50%), centre additions/closures, and course completion deltas with built-in **2-quarter training lag notice**.
6. **Dataset Quality Auditor & Job Title Normalizer**: Drag-and-drop CSV/XLSX file ingestion with automated quality scoring (null rate, duplicates, geo/NCO validation) and keyword + fuzzy job title NCO taxonomy matching.
7. **Accessibility & i18n**: Accessible text summaries for all Recharts visuals, text + color status badges, transparent "Demo / Synthetic Data" header badge, and English / Hindi language toggle.

---

## 🚀 Quick Start (One Command Setup)

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Install & Setup Database & ML Precomputations
```bash
# Run deterministic seed, compute LDI/LSI indices, train ML forecasts, and generate intelligence alerts
npm run setup
```

### 2. Run Backend & Frontend Concurrently
```bash
npm run dev
```
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### 3. Run Pytest Suite
```bash
npm run test:backend
```

---

## 📂 Project Structure

```
skill-sutra/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI REST routers (auth, geo, dashboard, gaps, forecast, map, etc.)
│   │   ├── core/         # Config, Database engine, and settings
│   │   ├── models/       # SQLAlchemy ORM models
│   │   └── schemas/      # Pydantic schemas with {success, data, meta} envelope
│   ├── scripts/          # Offline ML precomputation scripts
│   │   ├── seed_demo_data.py
│   │   ├── compute_indices.py
│   │   ├── train_forecasts.py
│   │   └── generate_alerts.py
│   ├── tests/            # Pytest test suite
│   ├── config.yaml       # Centralized thresholds, weights, and scenario pins
│   └── main.py           # FastAPI application entry point
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js App Router pages (Dashboard, Geography, District, Occupation, etc.)
│   │   ├── components/   # Header, Sidebar, StatusBadge, AccessibleChart, GlobalFilterBar
│   │   └── lib/          # API client, i18n dictionary, global AppContext
├── data/sample/          # Sample CSV files for data upload testing
├── docs/                 # PLAN.md and product specification
└── package.json          # Root monorepo scripts
```

---

## 📋 API Response Standard
Every API response strictly follows the standard envelope format:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "updated_at": "2026-10-05T00:00:00Z",
    "source": "Skill Sutra Calibrated Intelligence Engine",
    "version": "1.0.0",
    "is_synthetic": true
  }
}
```

---

## 📜 License
Built for hackathon demonstration. MIT License.