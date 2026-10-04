import React from "react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export function getStatusStyle(status: string) {
  const s = status.toLowerCase();
  if (s.includes("critical shortage")) {
    return {
      bg: "bg-red-950/80 border-red-500/50 text-red-300",
      dot: "bg-red-500",
      colorHex: "#dc2626",
      label: "Critical Shortage"
    };
  } else if (s.includes("emerging shortage") || s.includes("emerging")) {
    return {
      bg: "bg-amber-950/80 border-amber-500/50 text-amber-300",
      dot: "bg-amber-400 animate-pulse",
      colorHex: "#eab308",
      label: "Emerging Shortage"
    };
  } else if (s.includes("shortage")) {
    return {
      bg: "bg-orange-950/80 border-orange-500/50 text-orange-300",
      dot: "bg-orange-400",
      colorHex: "#f97316",
      label: "Shortage"
    };
  } else if (s.includes("balanced")) {
    return {
      bg: "bg-emerald-950/80 border-emerald-500/50 text-emerald-300",
      dot: "bg-emerald-400",
      colorHex: "#16a34a",
      label: "Balanced"
    };
  } else if (s.includes("oversupply")) {
    return {
      bg: "bg-sky-950/80 border-sky-500/50 text-sky-300",
      dot: "bg-sky-400",
      colorHex: "#0284c7",
      label: "Oversupply"
    };
  } else if (s.includes("saturation")) {
    return {
      bg: "bg-purple-950/80 border-purple-500/50 text-purple-300",
      dot: "bg-purple-400",
      colorHex: "#7c3aed",
      label: "Saturation Risk"
    };
  }
  return {
    bg: "bg-gray-800 border-gray-600 text-gray-300",
    dot: "bg-gray-400",
    colorHex: "#6b7280",
    label: status
  };
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const style = getStatusStyle(status);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-medium gap-1.5",
    md: "px-2.5 py-1 text-xs font-semibold gap-2",
    lg: "px-3.5 py-1.5 text-sm font-bold gap-2.5"
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm ${sizeClasses[size]} ${style.bg}`}
      role="status"
      aria-label={`Status: ${style.label}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true" />
      <span>{style.label}</span>
    </span>
  );
}
