"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { getStates, getDistricts, getSectors, getOccupations } from "@/lib/api";
import { Filter, Calendar } from "lucide-react";

export function GlobalFilterBar() {
  const { filters, setFilters, t } = useApp();

  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [occupations, setOccupations] = useState<any[]>([]);

  useEffect(() => {
    getStates().then((res) => setStates(res.data || [])).catch(console.error);
    getSectors().then((res) => setSectors(res.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    getDistricts(filters.stateId).then((res) => setDistricts(res.data || [])).catch(console.error);
  }, [filters.stateId]);

  useEffect(() => {
    getOccupations(filters.sectorId).then((res) => setOccupations(res.data || [])).catch(console.error);
  }, [filters.sectorId]);

  return (
    <div className="w-full bg-gray-900/80 border border-gray-800 rounded-xl p-3.5 mb-6 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-cyan-400 pr-2 border-r border-gray-800">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span>Scope Filters:</span>
        </div>

        {/* State Filter */}
        <select
          value={filters.stateId || ""}
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : undefined;
            setFilters((prev) => ({ ...prev, stateId: val, districtId: undefined }));
          }}
          className="bg-gray-950 border border-gray-750 text-gray-200 text-xs rounded-lg px-3 py-1.5 focus:border-cyan-500 focus:outline-none"
          aria-label={t("filter_state")}
        >
          <option value="">{t("all_states")}</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>

        {/* District Filter */}
        <select
          value={filters.districtId || ""}
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : undefined;
            setFilters((prev) => ({ ...prev, districtId: val }));
          }}
          className="bg-gray-950 border border-gray-750 text-gray-200 text-xs rounded-lg px-3 py-1.5 focus:border-cyan-500 focus:outline-none"
          aria-label={t("filter_district")}
        >
          <option value="">{t("all_districts")}</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        {/* Sector Filter */}
        <select
          value={filters.sectorId || ""}
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : undefined;
            setFilters((prev) => ({ ...prev, sectorId: val, occupationId: undefined }));
          }}
          className="bg-gray-950 border border-gray-750 text-gray-200 text-xs rounded-lg px-3 py-1.5 focus:border-cyan-500 focus:outline-none"
          aria-label={t("filter_sector")}
        >
          <option value="">{t("all_sectors")}</option>
          {sectors.map((sec) => (
            <option key={sec.id} value={sec.id}>
              {sec.name}
            </option>
          ))}
        </select>

        {/* Occupation Filter */}
        <select
          value={filters.occupationId || ""}
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : undefined;
            setFilters((prev) => ({ ...prev, occupationId: val }));
          }}
          className="bg-gray-950 border border-gray-750 text-gray-200 text-xs rounded-lg px-3 py-1.5 focus:border-cyan-500 focus:outline-none"
          aria-label={t("filter_occupation")}
        >
          <option value="">{t("all_occupations")}</option>
          {occupations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} ({o.nco_code})
            </option>
          ))}
        </select>

        {/* Forecast Horizon */}
        <div className="flex items-center space-x-1.5 ml-auto border-l border-gray-800 pl-3">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-400 font-medium">{t("filter_horizon")}:</span>
          {[3, 6, 12].map((h) => (
            <button
              key={h}
              onClick={() => setFilters((prev) => ({ ...prev, horizon: h }))}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
                filters.horizon === h
                  ? "bg-cyan-600 border-cyan-500 text-white shadow-sm"
                  : "bg-gray-950 border-gray-750 text-gray-400 hover:text-gray-200"
              }`}
            >
              {h}M
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
