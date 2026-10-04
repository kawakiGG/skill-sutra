"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Language, translations } from "./i18n";

export type Role = "national_planner" | "state_planner";

interface GlobalFilters {
  stateId?: number;
  districtId?: number;
  sectorId?: number;
  occupationId?: number;
  horizon: number;
}

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  role: Role;
  setRole: (role: Role) => void;
  filters: GlobalFilters;
  setFilters: React.Dispatch<React.SetStateAction<GlobalFilters>>;
  resetFilters: () => void;
  jumpToScenario: (scenarioKey: "pune_cnc" | "mumbai_retail" | "gujarat_solar" | "bengaluru_health") => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("en");
  const [role, setRole] = useState<Role>("national_planner");
  const [filters, setFilters] = useState<GlobalFilters>({ horizon: 6 });

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations["en"]?.[key] || key;
  };

  const resetFilters = () => {
    setFilters({ horizon: 6 });
  };

  const jumpToScenario = (scenarioKey: string) => {
    if (scenarioKey === "pune_cnc") {
      setFilters({ stateId: 1, districtId: 1, sectorId: 1, occupationId: 1, horizon: 6 });
    } else if (scenarioKey === "mumbai_retail") {
      setFilters({ stateId: 1, districtId: 2, sectorId: 3, occupationId: 11, horizon: 6 });
    } else if (scenarioKey === "gujarat_solar") {
      setFilters({ stateId: 3, districtId: 13, sectorId: 2, occupationId: 6, horizon: 6 });
    } else if (scenarioKey === "bengaluru_health") {
      setFilters({ stateId: 2, districtId: 7, sectorId: 4, occupationId: 16, horizon: 6 });
    }
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        role,
        setRole,
        filters,
        setFilters,
        resetFilters,
        jumpToScenario,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
