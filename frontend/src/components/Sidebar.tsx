"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/context";
import {
  LayoutDashboard,
  MapPin,
  Lightbulb,
  Sliders,
  Database,
  BarChart3,
  Bot
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useApp();

  const navItems = [
    { href: "/", label: t("nav_dashboard"), icon: LayoutDashboard },
    { href: "/geography", label: t("nav_geography"), icon: MapPin },
    { href: "/recommendations", label: t("nav_recommendations"), icon: Lightbulb },
    { href: "/simulator", label: t("nav_simulator"), icon: Sliders },
    { href: "/data", label: t("nav_data"), icon: Database },
  ];

  return (
    <aside className="w-64 border-r border-gray-800 bg-gray-950/60 p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-57px)]">
      <div className="space-y-6">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3 px-3">
            Core Modules
          </h2>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-900/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-gray-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Demo Hero Shortcut */}
        <div className="p-3.5 rounded-xl bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 space-y-2">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold">
            <BarChart3 className="w-4 h-4" />
            <span>Pinned Demo Hero Story</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Jump to Pune CNC Operator (+18% demand, +26-35% capacity rec).
          </p>
          <Link
            href="/occupation/1?district_id=1"
            className="block text-center w-full py-1.5 px-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors shadow"
          >
            Inspect Hero Story →
          </Link>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-gray-850 text-[11px] text-gray-500 space-y-1">
        <p className="font-semibold text-gray-400">Skill Sutra LMI Monolith</p>
        <p>Precomputed ML Forecasts</p>
        <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          API Connected
        </div>
      </div>
    </aside>
  );
}
