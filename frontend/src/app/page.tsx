"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { GlobalFilterBar } from "@/components/GlobalFilterBar";
import { StatusBadge } from "@/components/StatusBadge";
import { AccessibleChart } from "@/components/AccessibleChart";
import { getDashboardSummary, getDemandTrends, getTopShortages, getTopSaturation, getAlerts, getExportCSVUrl } from "@/lib/api";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Brain,
  Download,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  ChevronRight
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

export default function DashboardPage() {
  const { filters, t } = useApp();
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [shortages, setShortages] = useState<any[]>([]);
  const [saturations, setSaturations] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDashboardSummary({ state_id: filters.stateId, district_id: filters.districtId, sector_id: filters.sectorId }),
      getDemandTrends({ state_id: filters.stateId, district_id: filters.districtId, occupation_id: filters.occupationId }),
      getTopShortages(5),
      getTopSaturation(5),
      getAlerts({ state_id: filters.stateId, district_id: filters.districtId, limit: 4 })
    ])
      .then(([sumRes, trendRes, shortRes, satRes, alertRes]) => {
        setSummary(sumRes.data);
        setTrends(trendRes.data || []);
        setShortages(shortRes.data || []);
        setSaturations(satRes.data || []);
        setAlerts(alertRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters.stateId, filters.districtId, filters.sectorId, filters.occupationId]);

  return (
    <div className="space-y-6">
      {/* Header Headline */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-100 tracking-tight">
            National Labour Market Intelligence & Skill Forecasting
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time calibrated skill demand-supply analytics, predictive gap metrics & AI recommendations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={getExportCSVUrl(filters.stateId, filters.districtId)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
          >
            <Download className="w-4 h-4" />
            <span>{t("export_csv")}</span>
          </a>
        </div>
      </div>

      {/* Global Filter Bar */}
      <GlobalFilterBar />

      {/* KPI Cards Grid */}
      {loading || !summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 bg-gray-900 rounded-xl border border-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Monthly Demand */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
              <span>{t("kpi_monthly_demand")}</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {summary.total_monthly_demand.toLocaleString()}
            </div>
            <p className="mt-1 text-[11px] text-cyan-400 font-medium">
              Aggregated across {summary.total_districts} districts
            </p>
          </div>

          {/* Card 2: Monthly Supply */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 shadow-sm">
            <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
              <span>{t("kpi_monthly_supply")}</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {summary.total_monthly_supply.toLocaleString()}
            </div>
            <p className="mt-1 text-[11px] text-emerald-400 font-medium">
              Certified ITI & PMKK output
            </p>
          </div>

          {/* Card 3: Net Gap */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 shadow-sm">
            <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
              <span>{t("kpi_net_gap")}</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-red-400">
              {summary.overall_gap > 0 ? `+${summary.overall_gap.toLocaleString()}` : summary.overall_gap.toLocaleString()}
            </div>
            <p className="mt-1 text-[11px] text-red-400 font-medium">
              Deficit: {summary.overall_gap_pct}% of demand
            </p>
          </div>

          {/* Card 4: Critical Shortages Count */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-red-950/30 to-gray-950 border border-red-900/40 shadow-sm">
            <div className="flex items-center justify-between text-red-300 text-xs font-semibold">
              <span>{t("kpi_critical_shortages")}</span>
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            </div>
            <div className="mt-2 text-2xl font-black text-red-300">
              {summary.critical_shortages_count}
            </div>
            <p className="mt-1 text-[11px] text-red-400/80 font-medium">
              Trades with &ge;30% skill shortage
            </p>
          </div>

          {/* Card 5: Saturation Risks Count */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/30 to-gray-950 border border-purple-900/40 shadow-sm">
            <div className="flex items-center justify-between text-purple-300 text-xs font-semibold">
              <span>{t("kpi_saturation_risks")}</span>
              <span className="h-2 w-2 rounded-full bg-purple-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-purple-300">
              {summary.saturation_risks_count}
            </div>
            <p className="mt-1 text-[11px] text-purple-400/80 font-medium">
              Trades with &ge;30% oversupply
            </p>
          </div>

          {/* Card 6: Forecast MAPE */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 shadow-sm">
            <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
              <span>{t("kpi_forecast_mape")}</span>
              <Brain className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-cyan-400">
              {summary.median_forecast_mape}%
            </div>
            <p className="mt-1 text-[11px] text-cyan-400/80 font-medium">
              Holt-Winters / XGBoost Holdout MAPE
            </p>
          </div>

          {/* Card 7: Data Completeness */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 shadow-sm sm:col-span-2">
            <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
              <span>{t("kpi_data_completeness")}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline space-x-3">
              <span className="text-2xl font-black text-emerald-400">{summary.data_completeness_pct}%</span>
              <span className="text-xs text-gray-400">36-Month Calibrated Monthly Panel</span>
            </div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${summary.data_completeness_pct}%` }} />
            </div>
          </div>

        </div>
      )}

      {/* Main Chart: Demand vs Supply Historical & Trend */}
      <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-md backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-extrabold text-gray-100">
              Monthly Employer Demand vs Certified Training Supply Trend
            </h2>
            <p className="text-xs text-gray-400">
              Historical panel (2023 - 2026) aggregated across selected scope filters.
            </p>
          </div>
        </div>

        <AccessibleChart
          title="Demand vs Supply Trend Line Chart"
          summary={`Historical monthly demand peaked at over ${trends.length > 0 ? Math.max(...trends.map(t=>t.demand)).toLocaleString() : 0} while certified supply tracked below.`}
          height={320}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={11} tickLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "8px", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <Line type="monotone" dataKey="demand" name="Employer Hiring Demand" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="supply" name="Certified ITI Supply" stroke="#34d399" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </AccessibleChart>
      </div>

      {/* Top Shortages and Top Saturation Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Shortages */}
        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <h3 className="text-sm font-extrabold text-gray-100">Top Critical Skill Shortages</h3>
            </div>
            <Link href="/recommendations" className="text-xs text-cyan-400 hover:underline font-semibold flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-2">Location & Trade</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Deficit</th>
                  <th className="pb-2 text-right">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {shortages.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-850/40 transition-colors">
                    <td className="py-2.5 pr-2">
                      <Link href={`/occupation/${item.occupation_id}?district_id=${item.district_id}`} className="font-bold text-gray-200 hover:text-cyan-400">
                        {item.occupation_name}
                      </Link>
                      <div className="text-[11px] text-gray-400">{item.state_name} • {item.district_name}</div>
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={item.classification} size="sm" />
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-red-400">
                      +{item.gap.toLocaleString()} ({item.gap_pct * 100 > 0 ? `+${(item.gap_pct*100).toFixed(1)}%` : `${(item.gap_pct*100).toFixed(1)}%`})
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-cyan-400">
                      {item.priority_score.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Saturation */}
        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <h3 className="text-sm font-extrabold text-gray-100">Top Saturation & Oversupply Trades</h3>
            </div>
            <Link href="/recommendations" className="text-xs text-cyan-400 hover:underline font-semibold flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-2">Location & Trade</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Oversupply</th>
                  <th className="pb-2 text-right">Gap %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {saturations.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-850/40 transition-colors">
                    <td className="py-2.5 pr-2">
                      <Link href={`/occupation/${item.occupation_id}?district_id=${item.district_id}`} className="font-bold text-gray-200 hover:text-cyan-400">
                        {item.occupation_name}
                      </Link>
                      <div className="text-[11px] text-gray-400">{item.state_name} • {item.district_name}</div>
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={item.classification} size="sm" />
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-purple-400">
                      {item.gap.toLocaleString()} seats
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-purple-400">
                      {(item.gap_pct * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Recent Alerts Feed */}
      <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-extrabold text-gray-100">Live Intelligence Alerts Feed</h3>
          </div>
          <span className="text-[11px] text-gray-400 font-mono">Automated Threshold Monitoring</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts.map((al) => (
            <div key={al.id} className="p-3 rounded-xl bg-gray-950/80 border border-gray-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-200">{al.title}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  al.severity === "high" ? "bg-red-950 text-red-400 border border-red-800" : "bg-amber-950 text-amber-400 border border-amber-800"
                }`}>
                  {al.severity}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{al.description}</p>
              <div className="text-[10px] text-gray-500 font-mono pt-1">
                {al.state_name} • {al.district_name}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
