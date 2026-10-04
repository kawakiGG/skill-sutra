"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { AccessibleChart } from "@/components/AccessibleChart";
import { getDistricts, getOccupations, simulateScenario } from "@/lib/api";
import { Sliders, Zap, Play, RotateCcw, AlertTriangle, ArrowRight } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

function SimulatorContent() {
  const searchParams = useSearchParams();

  const [districts, setDistricts] = useState<any[]>([]);
  const [occupations, setOccupations] = useState<any[]>([]);

  const [districtId, setDistrictId] = useState<number>(Number(searchParams.get("district_id")) || 1);
  const [occupationId, setOccupationId] = useState<number>(Number(searchParams.get("occupation_id")) || 1);

  // Sliders
  const [seatChangePct, setSeatChangePct] = useState<number>(20);
  const [addedCentres, setAddedCentres] = useState<number>(1);
  const [removedCentres, setRemovedCentres] = useState<number>(0);
  const [completionDelta, setCompletionDelta] = useState<number>(0);

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDistricts().then((r) => setDistricts(r.data || [])).catch(console.error);
    getOccupations().then((r) => setOccupations(r.data || [])).catch(console.error);
  }, []);

  const runSimulation = () => {
    setLoading(true);
    simulateScenario({
      district_id: districtId,
      occupation_id: occupationId,
      seat_change_pct: seatChangePct,
      added_centres: addedCentres,
      removed_centres: removedCentres,
      completion_rate_delta: completionDelta
    })
      .then((res) => setResult(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (districtId && occupationId) {
      runSimulation();
    }
  }, [districtId, occupationId]);

  const chartData = result ? [
    { metric: "Sanctioned Seats", Before: result.current_seats, After: result.new_seats },
    { metric: "Certified Supply", Before: result.current_supply, After: result.new_supply },
    { metric: "Projected Deficit (Gap)", Before: result.original_gap, After: result.new_gap },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-100 tracking-tight">
          What-If Capacity & Policy Intervention Simulator
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Simulate real-time policy changes to training capacity, centre expansion, and course completion rates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sliders & Controls Column */}
        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-md space-y-5">
          <div className="flex items-center space-x-2 border-b border-gray-800 pb-3">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-extrabold text-white">Policy Parameter Sliders</h2>
          </div>

          {/* Selectors */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block font-semibold mb-1">Target District</label>
              <select
                value={districtId}
                onChange={(e) => setDistrictId(Number(e.target.value))}
                className="w-full bg-gray-950 border border-gray-750 text-gray-200 text-xs rounded-lg p-2 focus:border-cyan-500 focus:outline-none"
              >
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.state_name})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block font-semibold mb-1">Target Occupation Trade</label>
              <select
                value={occupationId}
                onChange={(e) => setOccupationId(Number(e.target.value))}
                className="w-full bg-gray-950 border border-gray-750 text-gray-200 text-xs rounded-lg p-2 focus:border-cyan-500 focus:outline-none"
              >
                {occupations.map((o) => (
                  <option key={o.id} value={o.id}>{o.name} (NCO-{o.nco_code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Slider 1: Seat Change % */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-300">Sanctioned Seat Capacity</span>
              <span className="text-cyan-400 font-mono">{seatChangePct > 0 ? `+${seatChangePct}%` : `${seatChangePct}%`}</span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              step={5}
              value={seatChangePct}
              onChange={(e) => setSeatChangePct(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-2 bg-gray-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>-50%</span>
              <span>0%</span>
              <span>+50%</span>
            </div>
          </div>

          {/* Slider 2: Added Centres */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-300">Add New ITI / PMKK Centres</span>
              <span className="text-cyan-400 font-mono">+{addedCentres} Centres</span>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={addedCentres}
              onChange={(e) => setAddedCentres(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-2 bg-gray-800 rounded-lg"
            />
            <div className="text-[10px] text-gray-500 font-mono text-right">+120 seats per centre</div>
          </div>

          {/* Slider 3: Completion Rate Delta */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-300">Course Completion Rate Delta</span>
              <span className="text-cyan-400 font-mono">{completionDelta > 0 ? `+${completionDelta}%` : `${completionDelta}%`}</span>
            </div>
            <input
              type="range"
              min={-15}
              max={15}
              step={1}
              value={completionDelta}
              onChange={(e) => setCompletionDelta(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-2 bg-gray-800 rounded-lg"
            />
          </div>

          {/* Run Button */}
          <button
            onClick={runSimulation}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-cyan-600/20"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{loading ? "Calculating Simulation..." : "Re-Calculate Policy Impact"}</span>
          </button>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Training Lag Warning Banner */}
          {result && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-amber-300 mb-0.5">Policy Implementation Delay:</span>
                <span className="leading-relaxed">{result.lag_warning}</span>
              </div>
            </div>
          )}

          {/* Before vs After Metric Cards */}
          {result && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
                <span className="text-xs text-gray-400 block font-semibold">Sanctioned Seats</span>
                <div className="mt-1 flex items-baseline space-x-2">
                  <span className="text-sm line-through text-gray-500">{result.current_seats}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xl font-black text-cyan-400">{result.new_seats}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
                <span className="text-xs text-gray-400 block font-semibold">Certified Supply Output</span>
                <div className="mt-1 flex items-baseline space-x-2">
                  <span className="text-sm line-through text-gray-500">{result.current_supply}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xl font-black text-emerald-400">{result.new_supply}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800">
                <span className="text-xs text-gray-400 block font-semibold">Classification Shift</span>
                <div className="mt-2 flex items-center space-x-2">
                  <StatusBadge status={result.original_class} size="sm" />
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  <StatusBadge status={result.new_class} size="sm" />
                </div>
              </div>

            </div>
          )}

          {/* Comparison Bar Chart */}
          {result && (
            <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-md">
              <h3 className="text-sm font-extrabold text-white mb-3">
                Before vs After Policy Intervention Comparison
              </h3>

              <AccessibleChart
                title="Policy Before vs After Bar Chart"
                summary={`Simulating intervention on ${result.occupation_name} changes sanctioned seats from ${result.current_seats} to ${result.new_seats} and reduces gap from ${result.original_gap} to ${result.new_gap}.`}
                height={280}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="metric" stroke="#6b7280" fontSize={11} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "8px", fontSize: "12px" }} />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Bar dataKey="Before" fill="#6b7280" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="After" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </AccessibleChart>
            </div>
          )}

          {/* Summary Text Box */}
          {result && (
            <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 text-xs text-gray-300 leading-relaxed font-mono">
              <span className="text-cyan-400 font-bold block mb-1">AI Executive Policy Impact Summary:</span>
              {result.summary_text}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default function SimulatorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400 font-mono">Loading Simulator...</div>}>
      <SimulatorContent />
    </Suspense>
  );
}
