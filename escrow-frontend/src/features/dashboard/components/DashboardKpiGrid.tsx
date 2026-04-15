"use client";

import { useState } from "react";

import { toneClasses } from "@/features/dashboard/data/dashboardData";
import type {
  KpiItem,
  KpiValueOption,
} from "@/features/dashboard/types/dashboard";

type DashboardKpiGridProps = Readonly<{
  items: KpiItem[];
}>;

const KPI_VALUE_OPTIONS: KpiValueOption[] = ["USDC", "ETH"];

export function DashboardKpiGrid({ items }: DashboardKpiGridProps) {
  const [selectedValueOption, setSelectedValueOption] =
    useState<KpiValueOption>("USDC");

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map(({ icon: Icon, label, tone, value, valueOptions }) => {
        const displayValue = valueOptions
          ? valueOptions[selectedValueOption]
          : value;

        return (
          <article
            key={label}
            className="rounded-[1.6rem] border border-white/10 bg-[#171717] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl border ${toneClasses[tone].soft} ${toneClasses[tone].border}`}
              >
                <Icon className={`h-4 w-4 ${toneClasses[tone].text}`} />
              </div>
              {valueOptions ? (
                <div className="inline-flex rounded-full border border-white/10 bg-black/25 p-1">
                  {KPI_VALUE_OPTIONS.map((option) => {
                    const isActive = selectedValueOption === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSelectedValueOption(option)}
                        className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${isActive
                            ? "bg-white text-black"
                            : "text-white/58 hover:text-white"
                          }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span
                  className={`text-[11px] font-semibold ${toneClasses[tone].text}`}
                >
                  Live view
                </span>
              )}
            </div>
            <p className="mt-6 text-[2rem] font-black tracking-tight text-white">
              {displayValue}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/58">
              {label}
            </p>
          </article>
        );
      })}
    </section>
  );
}
