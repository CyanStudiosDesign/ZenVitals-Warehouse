"use client";

import { useMemo } from "react";
import { BarChart3, Building2, CreditCard, Mail, MessageSquare, ReceiptIndianRupee, Truck, Users } from "lucide-react";
import { money } from "../config";
import type { WarehouseOrder } from "../types/order";

export function Analytics({ orders }: { orders: WarehouseOrder[] }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - 6 + index); const list = orders.filter((o) => new Date(o.createdAt).toDateString() === date.toDateString()); return { label: date.toLocaleDateString("en-IN", { weekday: "short" }), orders: list.length, revenue: list.reduce((sum, o) => sum + o.total, 0), products: list.flatMap((o) => o.items).reduce((sum, i) => sum + i.quantity, 0) }; }), [orders]);
  const max = Math.max(1, ...days.map((d) => d.revenue)); const topCoupon = Object.entries(orders.reduce<Record<string, number>>((all, order) => order.coupon ? { ...all, [order.coupon.code]: (all[order.coupon.code] ?? 0) + 1 } : all, {})).sort((a, b) => b[1] - a[1])[0];
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><Metric label="Revenue" value={money(orders.reduce((s, o) => s + o.total, 0))} /><Metric label="Orders" value={String(orders.length)} /><Metric label="Products sold" value={String(orders.flatMap((o) => o.items).reduce((s, i) => s + i.quantity, 0))} /></div><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-8 flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Revenue & daily orders</h2><p className="text-xs text-slate-500">Last seven days</p></div><BarChart3 className="text-blue-600" /></div><div className="flex h-64 items-end gap-3">{days.map((day) => <div key={day.label} className="flex flex-1 flex-col items-center gap-2"><span className="text-[10px] font-bold text-slate-500">{day.orders} orders</span><div className="w-full rounded-t-lg bg-blue-600/90 transition-all hover:bg-blue-700" style={{ height: `${Math.max(6, day.revenue / max * 190)}px` }} title={money(day.revenue)} /><span className="text-xs font-semibold text-slate-500">{day.label}</span></div>)}</div></section><div className="grid gap-4 sm:grid-cols-2"><Metric label="Top coupon" value={topCoupon ? `${topCoupon[0]} · ${topCoupon[1]} uses` : "No coupon usage"} /><Metric label="Average order" value={money(orders.length ? orders.reduce((s, o) => s + o.total, 0) / orders.length : 0)} /></div></div>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></div>; }

export function Settings() {
  const items = [
    ["Business details", "Company identity and warehouse address", Building2],
    ["GST", "Tax registration and invoice rules", ReceiptIndianRupee],
    ["Shipping charges", "Zones, thresholds and rates", Truck],
    ["Courier", "Courier partners and service levels", Truck],
    ["Email templates", "Order and delivery emails", Mail],
    ["SMS", "Transactional messaging", MessageSquare],
    ["Payment gateway", "Online payment and COD settings", CreditCard],
    ["Users", "Roles and warehouse access", Users],
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map(([title, copy, Icon]) => (
        <button key={title} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon size={19} />
          </span>
          <span>
            <b className="block text-sm text-slate-900">{title}</b>
            <small className="text-xs text-slate-500">{copy}</small>
          </span>
        </button>
      ))}
    </div>
  );
}