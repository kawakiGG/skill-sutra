"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StatusBadge } from "@/components/StatusBadge";
import { AccessibleChart } from "@/components/AccessibleChart";
import { getOccupationForecast, getAlerts, getRecommendations, getDistricts, getGaps } from "@/lib/api";
import {
  Brain,
  Zap,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  BarChart3,
  Calendar,
  Layers
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

function OccupationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const occupationId = Number(params.id);
  const districtId = Number(searchParams.get("district_id")) || 1;
  const horizon = Number(searchParams.get("horizon")) || 6;

  const [fcData, setFcData] = useState<any>(null);
  const [alert, setAlert] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [district, setDistrict] = useState<any>(null);
  const [gapInfo, setGapInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getOccupationForecast(occupationId, districtId, horizon),
      getAlerts({ district_id: districtId }),
      getRecommendations({ district_id: districtId }),
      getDistricts(),
      getGaps({ district_id: districtId, occupation_id: occupationId })
    ])
      .then(([fcRes, alertRes, recRes, distRes, gapRes]) => {
        setFcData(fcRes.data);
        
        const foundAlert = (alertRes.data || []).find((a: any) => a.occupation_id === occupationId);
        setAlert(foundAlert || null);

        const foundRec = (recRes.data || []).find((r: any) => r.occupation_id === occupationId);
        setRecommendation(foundRec || null);

        const distObj = (distRes.data || []).find((d: any) => d.id === districtId);
        setDistrict(distObj || { name: "Pune", state_name: "Maharashtra" });

        const gapObj = (gapRes.data || [])[0];
        setGapInfo(gapObj || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [occupationId, districtId, horizon]);

  if (loading || !fcData) {
    return <div className="p-8 text-center text-gray-400 font-mono animate-pulse">Loading Hero Occupation Forecast Profile...</div>;
  }

  const { forecast, methodology, key_drivers } = fcData;

  // Chart data points
  const chartData = [
    { period: "Current (Sep 2026)", demand: forecast.current_demand, supply: forecast.current_supply, lower: forecast.current_demand * 0.95, upper: forecast.current_demand * 1.05 },
    { period: `Projected (${horizon}M)`, demand: forecast.demand_forecast, supply: forecast.supply_forecast, lower: forecast.lower_bound, upper: forecast.upper_bound }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: district?.state_name || "State", href: "/geography" },
          { label: `${district?.name || "District"} District`, href: `/district/${districtId}` },
          { label: methodology.sector_name || "Sector" },
          { label: forecast.occupation_name }
        ]}
      />

      {/* Hero Title & Status Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900 to-gray-950 border border-gray-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800">
                NCO-{gapInfo?.nco_code || "7223.01"}
              </span>
              <StatusBadge status={gapInfo?.classification || "Critical Shortage"} size="lg" />
            </div>

            <h1 className="text-3xl font-black text-white tracking-tight">
              {forecast.occupation_name}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Location: <strong className="text-gray-200">{district?.name}</strong>, {district?.state_name} • Sector: {methodology.sector_name}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href={`/simulator?district_id=${districtId}&occupation_id=${occupationId}`}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/25 transition-all"
            >
              <Sliders className="w-4 h-4" />
              <span>Simulate Capacity Policy</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Headline Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <span className="text-xs text-gray-400 font-semibold block">Current Monthly Demand</span>
          <span className="text-2xl font-black text-white mt-1 block">
            {forecast.current_demand.toLocaleString()} openings
          </span>
          <span className="text-[11px] text-cyan-400 font-medium">Active employer postings</span>
        </div>

        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <span className="text-xs text-gray-400 font-semibold block">Projected {horizon}M Demand</span>
          <span className="text-2xl font-black text-cyan-400 mt-1 block">
            {forecast.demand_forecast.toLocaleString()} openings
          </span>
          <span className="text-[11px] text-gray-400 font-medium">
            Bounds: [{forecast.lower_bound.toLocaleString()} - {forecast.upper_bound.toLocaleString()}]
          </span>
        </div>

        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <span className="text-xs text-gray-400 font-semibold block">Projected {horizon}M Supply</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">
            {forecast.supply_forecast.toLocaleString()} graduates
          </span>
          <span className="text-[11px] text-emerald-400/80 font-medium">Certified output</span>
        </div>

        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
          <span className="text-xs text-gray-400 font-semibold block">Priority Ranking Score</span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">
            {gapInfo?.priority_score || 78.7} / 100
          </span>
          <span className="text-[11px] text-amber-400/80 font-medium">High Intervention Priority</span>
        </div>

      </div>

      {/* Main Grid: Forecast Chart & Key Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Forecast Chart with Confidence Band */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-gray-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                {horizon}-Month Predictive Demand & Supply Forecast with Confidence Band
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Model: {forecast.model_name} • Validation MAPE: {forecast.mape}% ({forecast.confidence_label} Confidence)
              </p>
            </div>
          </div>

          <AccessibleChart
            title={`Forecast chart for ${forecast.occupation_name}`}
            summary={`Projected demand reaches ${forecast.demand_forecast} with confidence bounds between ${forecast.lower_bound} and ${forecast.upper_bound}, while certified supply reaches ${forecast.supply_forecast}.`}
            height={320}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="period" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Area type="monotone" dataKey="upper" name="Upper Confidence Bound" stroke="none" fill="#0284c7" fillOpacity={0.15} />
                <Area type="monotone" dataKey="lower" name="Lower Confidence Bound" stroke="none" fill="#0284c7" fillOpacity={0.15} />
                <Line type="monotone" dataKey="demand" name="Projected Employer Demand" stroke="#38bdf8" strokeWidth={3} dot={{ r: 5 }} />
                <Line type="monotone" dataKey="supply" name="Projected ITI Supply" stroke="#34d399" strokeWidth={3} dot={{ r: 5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </AccessibleChart>
        </div>

        {/* Key Drivers Breakdown Panel */}
        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-md space-y-4">
          <div className="flex items-center space-x-2 border-b border-gray-800 pb-3">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-extrabold text-gray-100">Key Drivers Breakdown</h3>
          </div>

          <div className="space-y-3">
            {key_drivers.map((kd: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-gray-950 border border-gray-800 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-200">{kd.factor}</span>
                  <span className={kd.impact_pct > 0 ? "text-cyan-400" : "text-amber-400"}>
                    {kd.impact_pct > 0 ? `+${kd.impact_pct}%` : `${kd.impact_pct}%`}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">{kd.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Grid: Alert Card & Recommendation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Intelligence Alert Card */}
        {alert && (
          <div className="p-5 rounded-2xl bg-red-950/30 border border-red-900/50 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-red-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-sm font-extrabold text-white">{alert.title}</h3>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                {alert.severity} SEVERITY
              </span>
            </div>
            <p className="text-xs text-red-200/90 leading-relaxed">{alert.description}</p>
          </div>
        )}

        {/* Actionable Recommendation Card */}
        {recommendation && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-gray-900 to-gray-950 border border-cyan-800/60 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Lightbulb className="w-5 h-5" />
                <h3 className="text-sm font-extrabold text-white">Actionable Policy Recommendation</h3>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
                Confidence: {recommendation.confidence_label}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-700/50">
              <span className="text-xs text-cyan-300 font-semibold block">Suggested Capacity Adjustment Range</span>
              <span className="text-xl font-black text-white mt-1 block">
                {recommendation.recommended_increase_pct_min > 0 ? "+" : ""}
                {recommendation.recommended_increase_pct_min}% to {recommendation.recommended_increase_pct_max > 0 ? "+" : ""}
                {recommendation.recommended_increase_pct_max}%
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-gray-300 block mb-2">Underlying Reasoning:</span>
              <ul className="space-y-2 text-xs text-gray-300">
                {recommendation.reasons.map((r: string, idx: number) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      </div>

      {/* Forecast Methodology Card */}
      <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-md">
        <div className="flex items-center space-x-2 border-b border-gray-800 pb-3 mb-4">
          <Brain className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-extrabold text-gray-100">Forecast Model Methodology & Validation Metrics</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs font-mono">
          <div>
            <span className="text-gray-500 block text-[10px]">SELECTED MODEL</span>
            <span className="text-gray-100 font-bold">{methodology.model_name}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">TRAINING WINDOW</span>
            <span className="text-gray-100 font-bold">{methodology.training_period}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">HOLDOUT MAPE</span>
            <span className="text-cyan-400 font-bold">{methodology.mape}%</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">BASELINE MAPE</span>
            <span className="text-gray-400 font-bold">{methodology.baseline_mape}%</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">BEATS BASELINE</span>
            <span className="text-emerald-400 font-bold">{methodology.beats_baseline ? "YES (PASSED)" : "NO"}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">CONFIDENCE</span>
            <span className="text-emerald-400 font-bold">{methodology.confidence_label}</span>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function OccupationDetailPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-gray-400 font-mono">Loading Occupation Details...</div>}>
      <OccupationContent />
    </React.Suspense>
  );
}
