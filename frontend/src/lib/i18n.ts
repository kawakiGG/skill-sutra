export type Language = "en" | "hi";

export const translations: Record<Language, Record<string, string>> = {
  en: {
    app_title: "Skill Sutra",
    app_subtitle: "AI Labour Market Intelligence & Skill Forecasting",
    demo_badge: "Demo / Synthetic Dataset",
    role_national: "National Planner (India)",
    role_state: "State Planner (Maharashtra)",
    nav_dashboard: "Dashboard",
    nav_geography: "Geography & Map",
    nav_recommendations: "Recommendations",
    nav_simulator: "Scenario Simulator",
    nav_data: "Data Management",
    
    // KPI Cards
    kpi_monthly_demand: "Monthly Employer Demand",
    kpi_monthly_supply: "Monthly Certified Supply",
    kpi_net_gap: "Net Skill Deficit / Surplus",
    kpi_critical_shortages: "Critical Shortages",
    kpi_saturation_risks: "Saturation Risks",
    kpi_forecast_mape: "Model Forecast Accuracy (MAPE)",
    kpi_data_completeness: "Data Quality Completeness",

    // Status classes
    status_critical_shortage: "Critical Shortage",
    status_shortage: "Shortage",
    status_emerging_shortage: "Emerging Shortage",
    status_balanced: "Balanced",
    status_oversupply: "Oversupply",
    status_saturation_risk: "Saturation Risk",

    // Labels & Buttons
    filter_state: "Select State",
    filter_district: "Select District",
    filter_sector: "Select Sector",
    filter_occupation: "Select Occupation",
    filter_horizon: "Forecast Horizon",
    all_states: "All States (India)",
    all_districts: "All Districts",
    all_sectors: "All Sectors",
    all_occupations: "All Occupations",
    export_csv: "Export CSV Report",
    reset_demo: "Reset Seed Demo",
    run_simulation: "Simulate Policy Impact",
    upload_dataset: "Upload Dataset (CSV/XLSX)",
    normalize_title: "Test Job Title Normalizer",
    coming_soon: "Coming Soon",
  },
  hi: {
    app_title: "स्किल सूत्र",
    app_subtitle: "एआई श्रम बाजार बुद्धिमत्ता एवं कौशल मांग-आपूर्ति पूर्वानुमान",
    demo_badge: "डेमो / सिंथेटिक डेटासेट",
    role_national: "राष्ट्रीय योजनाकार (भारत)",
    role_state: "राज्य योजनाकार (महाराष्ट्र)",
    nav_dashboard: "डैशबोर्ड",
    nav_geography: "भूगोल और मानचित्र",
    nav_recommendations: "सिफारिशें",
    nav_simulator: "परिदृश्य सिम्युलेटर",
    nav_data: "डेटा प्रबंधन",

    // KPI Cards
    kpi_monthly_demand: "मासिक नियोक्ता मांग",
    kpi_monthly_supply: "मासिक प्रमाणित आपूर्ति",
    kpi_net_gap: "शुद्ध कौशल घाटा / अधिशेष",
    kpi_critical_shortages: "गंभीर कमी (शॉर्टेज)",
    kpi_saturation_risks: "संतृप्ति जोखिम (सैचुरेशन)",
    kpi_forecast_mape: "पूर्वानुमान सटीकता (MAPE)",
    kpi_data_completeness: "डेटा गुणवत्ता पूर्णता",

    // Status classes
    status_critical_shortage: "गंभीर कमी",
    status_shortage: "कमी",
    status_emerging_shortage: "उभरती कमी",
    status_balanced: "संतुलित",
    status_oversupply: "अधिशेष",
    status_saturation_risk: "संतृप्ति जोखिम",

    // Labels & Buttons
    filter_state: "राज्य चुनें",
    filter_district: "जिला चुनें",
    filter_sector: "क्षेत्र चुनें",
    filter_occupation: "व्यवसाय चुनें",
    filter_horizon: "पूर्वानुमान क्षितिज",
    all_states: "सभी राज्य (भारत)",
    all_districts: "सभी जिले",
    all_sectors: "सभी क्षेत्र",
    all_occupations: "सभी व्यवसाय",
    export_csv: "सीएसवी रिपोर्ट निर्यात करें",
    reset_demo: "डेमो रीसेट करें",
    run_simulation: "सिमुलेशन चलाएं",
    upload_dataset: "डेटासेट अपलोड करें",
    normalize_title: "पद नाम सामान्यीकरण जांचें",
    coming_soon: "शीघ्र आ रहा है",
  }
};
