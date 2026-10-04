"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getMapMetrics } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { MapPin, ArrowUpRight, BarChart2, Layers, Filter } from "lucide-react";

export default function GeographyPage() {
  const [level, setLevel] = useState<"state" | "district">("district");
  const [metric, setMetric] = useState<string>("gap");
  const [metricsData, setMetricsData] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMapMetrics(level, metric)
      .then((res) => {
        setMetricsData(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedItem(res.data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [level, metric]);

  const metricsTabs = [
    { key: "gap", label: "Deficit / Gap" },
    { key: "demand", label: "Demand Volume" },
    { key: "supply", label: "Supply Volume" },
    { key: "growth", label: "Demand Growth %" },
    { key: "coverage", label: "Supply Coverage %" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-100 tracking-tight">
            Geographic Labour Market Intelligence Map
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Interactive state choropleth & district centroid markers with switchable intelligence metrics.
          </p>
        </div>

        {/* Level Switcher */}
        <div className="flex items-center space-x-2 bg-gray-900 p-1 rounded-lg border border-gray-800 text-xs">
          <button
            onClick={() => setLevel("state")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              level === "state" ? "bg-cyan-600 text-white shadow" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            State View (4 States)
          </button>
          <button
            onClick={() => setLevel("district")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              level === "district" ? "bg-cyan-600 text-white shadow" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            District Markers (24 Districts)
          </button>
        </div>
      </div>

      {/* Metric Tabs Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-gray-850">
        <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 pr-2">
          <Layers className="w-3.5 h-3.5 text-cyan-400" /> Metric:
        </span>
        {metricsTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMetric(tab.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
              metric === tab.key
                ? "bg-gray-800 border-cyan-500 text-cyan-400 shadow-sm"
                : "bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Map & Side Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map Visualization Box */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-md min-h-[480px] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              {level === "state" ? "State Aggregate Intensity Map" : "District Centroid Circle Markers"}
            </span>
            <div className="flex items-center space-x-2 text-[11px] text-gray-400 font-mono">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Critical Shortage
              <span className="h-2 w-2 rounded-full bg-emerald-500 ml-2" /> Balanced
              <span className="h-2 w-2 rounded-full bg-purple-500 ml-2" /> Saturation Risk
            </div>
          </div>

          {/* Interactive Geographic Grid Card Map */}
          <div className="my-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 z-10">
            {metricsData.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-gray-850 border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400"
                      : "bg-gray-950/80 border-gray-800 hover:border-gray-700 hover:bg-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-sm text-gray-100 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {item.name}
                    </span>
                    <StatusBadge status={item.classification} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-gray-500 block">Demand</span>
                      <span className="text-gray-200 font-bold">{item.demand.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Supply</span>
                      <span className="text-emerald-400 font-bold">{item.supply.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Net Gap</span>
                      <span className={item.gap > 0 ? "text-red-400 font-bold" : "text-purple-400 font-bold"}>
                        {item.gap > 0 ? `+${item.gap}` : item.gap} ({item.gap_pct}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block">Coverage</span>
                      <span className="text-gray-300">{item.coverage_pct}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-gray-500 font-mono flex items-center justify-between border-t border-gray-800 pt-3">
            <span>Showing {metricsData.length} locations with lat/lng centroid coordinates</span>
            <span>Click any location card to inspect detailed trade breakdown</span>
          </div>
        </div>

        {/* Selected Location Detail Side Panel */}
        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 shadow-md flex flex-col justify-between space-y-4">
          {selectedItem ? (
            <>
              <div>
                <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-cyan-400" />
                      {selectedItem.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Lat: {selectedItem.lat.toFixed(4)}, Lng: {selectedItem.lng.toFixed(4)}
                    </p>
                  </div>
                  <StatusBadge status={selectedItem.classification} size="md" />
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-gray-950 border border-gray-800">
                    <span className="text-xs text-gray-400 block font-medium">Monthly Employer Demand</span>
                    <span className="text-xl font-extrabold text-white mt-1 block">
                      {selectedItem.demand.toLocaleString()} openings
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-950 border border-gray-800">
                    <span className="text-xs text-gray-400 block font-medium">Certified Training Output</span>
                    <span className="text-xl font-extrabold text-emerald-400 mt-1 block">
                      {selectedItem.supply.toLocaleString()} graduates
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-950 border border-gray-800">
                    <span className="text-xs text-gray-400 block font-medium">Net Skill Deficit / Surplus</span>
                    <span className={`text-xl font-extrabold mt-1 block ${selectedItem.gap > 0 ? "text-red-400" : "text-purple-400"}`}>
                      {selectedItem.gap > 0 ? `+${selectedItem.gap.toLocaleString()}` : selectedItem.gap.toLocaleString()} ({selectedItem.gap_pct}%)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-950 border border-gray-800">
                    <span className="text-xs text-gray-400 block font-medium">Training Capacity Coverage</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex-1 bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${Math.min(100, selectedItem.coverage_pct)}%` }} />
                      </div>
                      <span className="text-xs font-bold text-gray-200">{selectedItem.coverage_pct}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {level === "district" ? (
                <Link
                  href={`/district/${selectedItem.id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs text-center flex items-center justify-center space-x-2 transition-all shadow-md shadow-cyan-600/20"
                >
                  <span>Drill-down to {selectedItem.name} District Detail Page</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  onClick={() => setLevel("district")}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs text-center flex items-center justify-center space-x-2 transition-all shadow-md shadow-cyan-600/20"
                >
                  <span>View Districts in {selectedItem.name}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500 text-xs">Select a location card on the left to view details</div>
          )}
        </div>

      </div>
    </div>
  );
}
