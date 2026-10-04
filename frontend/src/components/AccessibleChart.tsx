import React from "react";

interface AccessibleChartProps {
  title: string;
  summary: string;
  children: React.ReactNode;
  height?: number | string;
}

export function AccessibleChart({ title, summary, children, height = 300 }: AccessibleChartProps) {
  return (
    <figure className="w-full relative" aria-label={title}>
      <figcaption className="sr-only">
        <p><strong>{title}:</strong> {summary}</p>
      </figcaption>
      <div style={{ height: typeof height === "number" ? `${height}px` : height, width: "100%" }}>
        {children}
      </div>
      <p className="mt-2 text-[11px] text-gray-400 font-mono tracking-tight" aria-hidden="true">
        ℹ️ {summary}
      </p>
    </figure>
  );
}
