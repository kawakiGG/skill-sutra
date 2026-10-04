"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StatusBadge } from "@/components/StatusBadge";
import { getDistricts, getGaps, getDashboardSummary } from "@/lib/api";
import { MapPin, TrendingUp, AlertTriangle, ArrowUpRight, ArrowLeft } from "lucide-react";

export default function DistrictDetailPage() {
  const params = useParams();
  const districtId = Number(params.id);

  const [district, setDistrict] = useState<any>(null);
  const [gaps, setGaps] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDistricts(),
      getGaps({ district_id: districtId }),
      getDashboardSummary({ district_id: districtId })
    ])
      .then(([distRes, gapRes, sumRes]) => {
        const found = (distRes.data || []).find((d: any) => d.id === districtId);
        setDistrict(found || { name: "District", state_name: "State" });
        setGaps(gapRes.data || []);
        setSummary(sumRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [districtId]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: district?.state_name || "State", href: "/geography" },
          { label: district?.name || "District" }
        ]}
      />

      {/* District Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900 to-gray-950 border border-gray-800 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold mb-1">
              <MapPin className="w-4 h-4" />
              <span>District Level Intelligence Profile</span>
            </div>
            <h1 className="text-3xl font-black text-white">{district?.name} District</h1>
            <p className="text-xs text-gray-400 mt-1">
              {district?.state_name} • Comprehensive trade-wise demand-supply gap assessment
            </p>
          </div>

          <Link
            href="/geography"
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-gray-800 hover:bg-gray-750 text-gray-300 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Map View</span>
          </Link>
        </div>
      </div>

      {/* Headline District Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
            <span className="text-xs text-gray-400 font-semibold block">Total Monthly Demand</span>
            <span className="text-2xl font-black text-white mt-1 block">
              {summary.total_monthly_demand.toLocaleString()} openings
            </span>
          </div>

          <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
            <span className="text-xs text-gray-400 font-semibold block">Certified Training Output</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">
              {summary.total_monthly_supply.toLocaleString()} graduates
            </span>
          </div>

          <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
            <span className="text-xs text-gray-400 font-semibold block">Net Skill Gap Deficit</span>
            <span className={`text-2xl font-black mt-1 block ${summary.overall_gap > 0 ? "text-red-400" : "text-purple-400"}`}>
              {summary.overall_gap > 0 ? `+${summary.overall_gap.toLocaleString()}` : summary.overall_gap.toLocaleString()} ({summary.overall_gap_pct}%)
            </span>
          </div>
        </div>
      )}

      {/* Trades Breakdown Table */}
      <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-md">
        <h2 className="text-base font-extrabold text-gray-100 mb-4">
          Trade & Occupation Skill Deficit Breakdown
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-2.5">Occupation & Sector</th>
                <th className="pb-2.5">NCO Code</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5 text-right">Demand</th>
                <th className="pb-2.5 text-right">Supply</th>
                <th className="pb-2.5 text-right">Gap (Deficit)</th>
                <th className="pb-2.5 text-right">Priority</th>
                <th className="pb-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {gaps.map((item) => (
                <tr key={item.occupation_id} className="hover:bg-gray-850/40 transition-colors">
                  <td className="py-3 pr-2">
                    <span className="font-bold text-gray-100 block text-sm">{item.occupation_name}</span>
                    <span className="text-[11px] text-gray-400">{item.sector_name}</span>
                  </td>
                  <td className="py-3 font-mono text-gray-400">{item.nco_code}</td>
                  <td className="py-3">
                    <StatusBadge status={item.classification} size="sm" />
                  </td>
                  <td className="py-3 text-right font-mono text-gray-200">{item.demand.toLocaleString()}</td>
                  <td className="py-3 text-right font-mono text-emerald-400">{item.supply.toLocaleString()}</td>
                  <td className={`py-3 text-right font-mono font-bold ${item.gap > 0 ? "text-red-400" : "text-purple-400"}`}>
                    {item.gap > 0 ? `+${item.gap.toLocaleString()}` : item.gap.toLocaleString()} ({(item.gap_pct*100).toFixed(1)}%)
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-cyan-400">{item.priority_score.toFixed(1)}</td>
                  <td className="py-3 text-center">
                    <Link
                      href={`/occupation/${item.occupation_id}?district_id=${districtId}`}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-800 text-xs font-semibold transition-colors"
                    >
                      <span>Hero Page</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
