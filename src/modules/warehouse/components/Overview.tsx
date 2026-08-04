"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BadgeIndianRupee,
  Ban,
  Box,
  Check,
  CircleDollarSign,
  ClipboardCheck,
  PackageCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import {
  FULFILLMENT_STATUSES,
  money,
  shortDate,
  STATUS_CLASS,
  STATUS_LABEL,
} from "../config";
import type { WarehouseOrder } from "../types/order";

const card = "rounded-2xl border border-slate-200 bg-white shadow-sm";

export function Overview({ orders }: { orders: WarehouseOrder[] }) {
  const [tasks, setTasks] = useState([
    { id: 1, label: "Pack 18 orders", done: false },
    { id: 2, label: "Print 7 shipping labels", done: false },
    { id: 3, label: "Dispatch orders before 5 PM", done: false },
    { id: 4, label: "Confirm 3 COD orders", done: false },
  ]);
  const today = new Date().toDateString();
  const weekAgo = Date.now() - 7 * 86400000;
  const active = orders.filter((order) => order.status !== "cancelled");
  const todayOrders = orders.filter(
    (order) => new Date(order.createdAt).toDateString() === today,
  );
  const metrics = [
    [
      "Pending Orders",
      orders.filter((o) => o.status === "pending").length,
      Box,
      "text-amber-600 bg-amber-50",
    ],
    [
      "Confirmed",
      orders.filter((o) => o.status === "confirmed").length,
      ShoppingCart,
      "text-blue-600 bg-blue-50",
    ],
    [
      "Packed",
      orders.filter((o) => o.status === "packed").length,
      PackageCheck,
      "text-violet-600 bg-violet-50",
    ],
    [
      "Shipped Today",
      todayOrders.filter((o) => o.status === "shipped").length,
      Truck,
      "text-orange-600 bg-orange-50",
    ],
    [
      "Today's Revenue",
      money(
        todayOrders
          .filter((o) => o.paymentStatus === "paid")
          .reduce((sum, o) => sum + o.total, 0),
      ),
      BadgeIndianRupee,
      "text-emerald-600 bg-emerald-50",
    ],
    [
      "Orders This Week",
      orders.filter((o) => new Date(o.createdAt).getTime() >= weekAgo).length,
      ClipboardCheck,
      "text-indigo-600 bg-indigo-50",
    ],
    [
      "Cancelled",
      orders.filter((o) => o.status === "cancelled").length,
      Ban,
      "text-red-600 bg-red-50",
    ],
    [
      "Average Order Value",
      money(
        active.length
          ? active.reduce((sum, o) => sum + o.total, 0) / active.length
          : 0,
      ),
      CircleDollarSign,
      "text-cyan-600 bg-cyan-50",
    ],
  ] as const;

  const topProducts = useMemo(() => {
    const totals = new Map<string, number>();
    orders
      .flatMap((o) => o.items)
      .forEach((item) =>
        totals.set(item.name, (totals.get(item.name) ?? 0) + item.quantity),
      );
    return [...totals].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders]);
  const maxStatus = Math.max(
    1,
    ...FULFILLMENT_STATUSES.map(
      (status) => orders.filter((o) => o.status === status).length,
    ),
  );
  const latestOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6);
  const couponOrders = orders.filter((order) => order.coupon).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map(([label, value, Icon, color]) => (
          <div key={label} className={`${card} p-4`}>
            <div
              className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
            >
              <Icon size={18} />
            </div>
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              {value}
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className={`${card} p-5`}>
          <h2 className="font-bold text-slate-900">Fulfillment progress</h2>
          <p className="mb-5 text-xs text-slate-500">
            Live distribution across the warehouse pipeline
          </p>
          <div className="space-y-4">
            {FULFILLMENT_STATUSES.map((status) => {
              const count = orders.filter((o) => o.status === status).length;
              return (
                <div
                  key={status}
                  className="grid grid-cols-[90px_1fr_36px] items-center gap-3"
                >
                  <span
                    className={`w-fit rounded-full border px-2 py-1 text-[10px] font-bold ${STATUS_CLASS[status]}`}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${(count / maxStatus) * 100}%` }}
                    />
                  </div>
                  <span className="text-right text-sm font-bold text-slate-700">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
        <section className={`${card} p-5`}>
          <h2 className="font-bold text-slate-900">Today&apos;s tasks</h2>
          <p className="mb-4 text-xs text-slate-500">
            A checklist shared across warehouse operations
          </p>
          <div className="space-y-2">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() =>
                  setTasks((all) =>
                    all.map((item) =>
                      item.id === task.id
                        ? { ...item, done: !item.done }
                        : item,
                    ),
                  )
                }
                className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50"
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md border ${task.done ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"}`}
                >
                  {task.done && <Check size={13} />}
                </span>
                <span
                  className={`text-sm font-medium ${task.done ? "text-slate-400 line-through" : "text-slate-700"}`}
                >
                  {task.label}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={`${card} p-5`}>
          <h2 className="font-bold text-slate-900">Top selling products</h2>
          <div className="mt-4 space-y-3">
            {topProducts.map(([name, qty], index) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-semibold text-slate-700">
                  <b className="mr-3 text-slate-400">{index + 1}</b>
                  {name}
                </span>
                <span className="text-xs font-bold text-blue-600">
                  {qty} sold
                </span>
              </div>
            ))}
            {!topProducts.length && (
              <p className="text-sm text-slate-400">No product sales yet.</p>
            )}
          </div>
        </section>
        <section className={`${card} p-5`}>
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <AlertTriangle size={16} className="text-amber-500" /> Operations
            snapshot
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Snapshot
              label="COD to confirm"
              value={
                orders.filter(
                  (o) => o.paymentMethod === "cod" && o.status === "pending",
                ).length
              }
            />
            <Snapshot
              label="Urgent orders"
              value={orders.filter((o) => o.priority === "urgent").length}
            />
            <Snapshot
              label="Coupons used"
              value={orders.filter((o) => o.coupon).length}
            />
            <Snapshot
              label="Failed payments"
              value={orders.filter((o) => o.paymentStatus === "failed").length}
            />
          </div>
        </section>
      </div>
      <DashboardTable
        title="Latest orders"
        columns={[
          "Order",
          "Customer",
          "Product",
          "Status",
          "Payment",
          "Date",
          "Amount",
        ]}
        empty="No orders yet."
      >
        {latestOrders.map((order) => (
          <tr
            key={order.id}
            className="border-t border-slate-100 hover:bg-slate-50/70"
          >
            <Cell mono>{order.orderId}</Cell>
            <Cell>{order.customer}</Cell>
            <Cell>{order.items[0]?.name ?? "—"}</Cell>
            <Cell>
              <span
                className={`rounded-full border px-2 py-1 text-[10px] font-bold ${STATUS_CLASS[order.status]}`}
              >
                {STATUS_LABEL[order.status]}
              </span>
            </Cell>
            <Cell>
              {order.paymentMethod === "cod" ? "COD" : order.paymentStatus}
            </Cell>
            <Cell>{shortDate(order.createdAt)}</Cell>
            <Cell strong>{money(order.total)}</Cell>
          </tr>
        ))}
      </DashboardTable>
      <DashboardTable
        title="Orders using coupons"
        columns={[
          "Order",
          "Coupon code",
          "Discount %",
          "Customer",
          "Amount saved",
          "Final amount",
          "Date",
        ]}
        empty="No coupon orders yet."
      >
        {couponOrders.map((order) => (
          <tr
            key={order.id}
            className="border-t border-slate-100 hover:bg-slate-50/70"
          >
            <Cell mono>{order.orderId}</Cell>
            <Cell>
              <span className="rounded-lg bg-emerald-50 px-2 py-1 font-mono text-xs font-bold text-emerald-700">
                {order.coupon?.code}
              </span>
            </Cell>
           <Cell>{order.coupon?.discount}</Cell>
            <Cell>{order.customer}</Cell>
            <Cell strong>{money(order.discount)}</Cell>
            <Cell strong>{money(order.total)}</Cell>
            <Cell>{shortDate(order.createdAt)}</Cell>
          </tr>
        ))}
      </DashboardTable>
    </div>
  );
}

function Snapshot({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}
function DashboardTable({
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
  const hasRows = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);
  return (
    <section className={`${card} overflow-hidden`}>
      <div className="px-5 py-4">
        <h2 className="font-bold text-slate-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500"
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
                <td
                  colSpan={columns.length}
                  className="p-8 text-center text-sm text-slate-400"
                >
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
function Cell({
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
      className={`max-w-56 truncate px-5 py-4 text-sm text-slate-600 ${mono ? "font-mono text-xs font-bold text-blue-600" : ""} ${strong ? "font-bold text-slate-900" : ""}`}
    >
      {children}
    </td>
  );
}
