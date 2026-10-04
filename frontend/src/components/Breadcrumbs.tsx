"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs text-gray-400 py-2">
      <Link href="/" className="inline-flex items-center hover:text-cyan-400 transition-colors">
        <Home className="w-3.5 h-3.5 mr-1" />
        <span>India</span>
      </Link>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
          {item.href ? (
            <Link href={item.href} className="hover:text-cyan-400 transition-colors font-medium">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-200 font-semibold truncate max-w-[200px]" aria-current="page">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
