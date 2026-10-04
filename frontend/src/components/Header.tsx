"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { Globe, UserCheck, Sparkles, RefreshCw, Zap } from "lucide-react";

export function Header() {
  const { lang, setLang, t, role, setRole, jumpToScenario, resetFilters } = useApp();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-gray-950/90 backdrop-blur-md px-4 lg:px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & Demo Badge */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
              SS
            </div>
            <div>
              <span className="text-lg font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {t("app_title")}
              </span>
              <span className="hidden sm:inline-block text-[10px] text-gray-400 ml-2 font-mono border-l border-gray-800 pl-2">
                v1.0-MVP
              </span>
            </div>
          </Link>

          {/* Demo / Synthetic Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>{t("demo_badge")}</span>
          </div>
        </div>

        {/* Quick Scenario Preset Jumps */}
        <div className="hidden xl:flex items-center space-x-2 bg-gray-900/80 p-1 rounded-lg border border-gray-800 text-xs">
          <span className="text-gray-400 px-2 font-medium flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" /> Jumps:
          </span>
          <button
            onClick={() => jumpToScenario("pune_cnc")}
            className="px-2 py-1 rounded bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 transition-colors font-medium"
          >
            Pune CNC
          </button>
          <button
            onClick={() => jumpToScenario("mumbai_retail")}
            className="px-2 py-1 rounded bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/30 transition-colors font-medium"
          >
            Mumbai Retail
          </button>
          <button
            onClick={() => jumpToScenario("gujarat_solar")}
            className="px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/30 transition-colors font-medium"
          >
            Gujarat Solar
          </button>
          <button
            onClick={() => jumpToScenario("bengaluru_health")}
            className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 transition-colors font-medium"
          >
            Bengaluru Health
          </button>
        </div>

        {/* Controls: Role Selector, i18n, Reset */}
        <div className="flex items-center space-x-2">
          {/* Planner Role Switcher */}
          <div className="relative inline-flex items-center">
            <UserCheck className="w-3.5 h-3.5 text-gray-400 absolute left-2 pointer-events-none" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="bg-gray-900 text-gray-200 text-xs rounded-md border border-gray-750 pl-7 pr-3 py-1.5 focus:outline-none focus:border-cyan-500 font-medium"
              aria-label="Select Planner Role"
            >
              <option value="national_planner">{t("role_national")}</option>
              <option value="state_planner">{t("role_state")}</option>
            </select>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-900 hover:bg-gray-800 border border-gray-750 text-gray-200 text-xs font-semibold transition-colors"
            title="Toggle Language"
            aria-label="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{lang === "en" ? "EN" : "हिंदी"}</span>
          </button>

          {/* Reset button */}
          <button
            onClick={resetFilters}
            className="p-1.5 rounded-md bg-gray-900 hover:bg-gray-800 border border-gray-750 text-gray-400 hover:text-cyan-400 transition-colors"
            title="Reset Filters"
            aria-label="Reset Filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
}
