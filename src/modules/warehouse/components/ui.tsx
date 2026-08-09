"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cardDark, cardWhite } from "./theme";

// ---- Hero stat card (dark) — used for Pending / Shipped Today / Cancelled -
export function StatCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string | number;
  caption: string;
}) {
  return (
    <div className={cardDark}>
      <p className="text-xs font-semibold text-white/40">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-white/30">{caption}</p>
    </div>
  );
}

// ---- Pill used in the "Active filters" row ---------------------------------
export function FilterPill({
  label,
  value,
  Icon,
  isActive,
  onClick,
}: {
  label: string;
  value: string | number;
  Icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 transition-colors ${
        isActive
          ? "border-[#C6FF3D] bg-[#C6FF3D]/15 text-white"
          : "border-white/10 bg-white/[0.04] text-white/80 hover:border-white/25"
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full ${
          isActive ? "bg-[#C6FF3D] text-[#0E1211]" : "bg-[#C6FF3D]/15 text-[#C6FF3D]"
        }`}
      >
        <Icon size={13} />
      </span>
      <span className="text-xs font-semibold">{label}</span>
      <span className="text-xs font-black text-white">{value}</span>
    </button>
  );
}

// ---- Small white-panel stat blocks -----------------------------------------
export function QuickStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
}

export function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="text-base font-black text-slate-900">{value}</p>
    </div>
  );
}

export function Snapshot({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

// ---- Table primitives -------------------------------------------------------
export function Cell({
  children,
  mono,
  strong,
}: {
  children: ReactNode;
  mono?: boolean;
  strong?: boolean;
}) {
  return (
    <td
      className={`max-w-56 truncate px-6 py-4 text-sm text-slate-600 ${
        mono ? "font-mono text-xs font-bold text-emerald-700" : ""
      } ${strong ? "font-bold text-slate-900" : ""}`}
    >
      {children}
    </td>
  );
}

export function DashboardTable({
  title,
  columns,
  empty,
  children,
}: {
  title: string;
  columns: string[];
  empty: string;
  children: ReactNode;
}) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className={`${cardWhite} overflow-hidden`}>
      <div className="px-6 py-5">
        <h2 className="font-bold text-slate-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-400"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hasRows ? (
              children
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-sm text-slate-400">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
