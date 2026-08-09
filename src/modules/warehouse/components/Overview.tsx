"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeIndianRupee,
  Ban,
  Box,
  Check,
  CircleDollarSign,
  ClipboardCheck,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
  Trash2,
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
import { cardWhite } from "./theme";
import {
  StatCard,
  FilterPill,
  QuickStat,
  MiniStat,
  Snapshot,
  Cell,
  DashboardTable,
} from "./ui";
import { FulfillmentProgress } from "./FulfillmentProgress";
import { TasksChecklist } from "./TasksChecklist";

type FilterName =
  | "Pending Orders"
  | "Confirmed"
  | "Packed"
  | "Shipped Today"
  | "Today's Revenue"
  | "Orders This Week"
  | "Cancelled"
  | "Average Order Value";

export function Overview({
  orders,
  onRefresh,
  loading,
  onDeleteOldCarts,
  deleting,
}: {
  orders: WarehouseOrder[];
  onRefresh: () => void;
  loading: boolean;
  onDeleteOldCarts: () => void;
  deleting: boolean;
}) {
  const [activeFilter, setActiveFilter] = useState<FilterName | null>(null);

  const [tasks, setTasks] = useState([
    { id: 1, label: "Pack 18 orders", done: false },
    { id: 2, label: "Print 7 shipping labels", done: false },
    { id: 3, label: "Dispatch orders before 5 PM", done: false },
    { id: 4, label: "Confirm 3 COD orders", done: false },
  ]);

  const today = new Date().toDateString();
  const weekAgo = Date.now() - 7 * 86400000;
  const isToday = (date: string) => new Date(date).toDateString() === today;
  const isThisWeek = (date: string) => new Date(date).getTime() >= weekAgo;

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const packedOrders = orders.filter((o) => o.status === "packed");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");

  const activeOrders = orders.filter((o) => o.status !== "cancelled");

  const todayOrders = orders.filter((o) => isToday(o.createdAt));
  const shippedTodayOrders = todayOrders.filter((o) => o.status === "shipped");
  const weekOrders = orders.filter((o) => isThisWeek(o.createdAt));

  const couponOrders = orders.filter((o) => o.coupon);
  const latestCouponOrders = couponOrders.slice(0, 6);

  const todayRevenue = todayOrders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.total, 0);

  const averageOrderValue = activeOrders.length
    ? activeOrders.reduce((sum, o) => sum + o.total, 0) / activeOrders.length
    : 0;

  // Values behind the "Active filters" pill row (also drives the filter dropdown logic below)
  const metrics = [
    ["Pending Orders", pendingOrders.length, Box],
    ["Confirmed", confirmedOrders.length, ShoppingCart],
    ["Packed", packedOrders.length, PackageCheck],
    ["Shipped Today", shippedTodayOrders.length, Truck],
    ["Today's Revenue", money(todayRevenue), BadgeIndianRupee],
    ["Orders This Week", weekOrders.length, ClipboardCheck],
    ["Cancelled", cancelledOrders.length, Ban],
  ] as const;

  // Values behind the three dark hero cards at the top of the page
  const heroStats = [
    {
      label: "Pending Orders",
      value: pendingOrders.length,
      caption: "Awaiting processing",
    },
    {
      label: "Shipped Today",
      value: shippedTodayOrders.length,
      caption: "Orders dispatched today",
    },
    {
      label: "Cancelled",
      value: cancelledOrders.length,
      caption: "Cancelled orders",
    },
  ];

  // Values behind the "Operations snapshot" card
  const operationsSnapshot = [
    {
      label: "COD to confirm",
      value: orders.filter(
        (o) => o.paymentMethod === "cod" && o.status === "pending",
      ).length,
    },
    {
      label: "Urgent orders",
      value: orders.filter((o) => o.priority === "urgent").length,
    },
    {
      label: "Coupons used",
      value: orders.filter((o) => o.coupon).length,
    },
    {
      label: "Failed payments",
      value: orders.filter((o) => o.paymentStatus === "failed").length,
    },
  ];

  const topProducts = useMemo(() => {
    const totals = new Map<string, number>();
    orders
      .flatMap((o) => o.items)
      .forEach((item) =>
        totals.set(item.name, (totals.get(item.name) ?? 0) + item.quantity),
      );
    return [...totals].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders]);

 const fulfillmentCounts = FULFILLMENT_STATUSES.reduce(
  (counts, status) => {
    counts[status] = orders.filter((o) => o.status === status).length;
    return counts;
  },
  {} as Record<string, number>,
);

  const maxStatus = Math.max(
    1,
    ...FULFILLMENT_STATUSES.map((status) => fulfillmentCounts[status] ?? 0),
  );

  const filterPredicates: Record<FilterName, (o: WarehouseOrder) => boolean> = {
    "Pending Orders": (o) => o.status === "pending",
    Confirmed: (o) => o.status === "confirmed",
    Packed: (o) => o.status === "packed",
    "Shipped Today": (o) => o.status === "shipped" && isToday(o.createdAt),
    "Today's Revenue": (o) =>
      o.paymentStatus === "paid" && isToday(o.createdAt),
    "Orders This Week": (o) => isThisWeek(o.createdAt),
    Cancelled: (o) => o.status === "cancelled",
    "Average Order Value": (o) => o.status !== "cancelled",
  };

  const filteredOrders = activeFilter
    ? orders.filter(filterPredicates[activeFilter])
    : orders;

  const latestOrders = useMemo(
    () =>
      [...filteredOrders]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 6),
    [filteredOrders],
  );

  const toggleTask = (id: number) =>
    setTasks((all) =>
      all.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    );

  const toggleFilter = (label: FilterName) =>
    setActiveFilter((current) => (current === label ? null : label));

 return (
  <>
    {/* ---- Page title + primary actions ------------------------------ */}
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-3xl font-black uppercase tracking-tight text-white lg:text-4xl">
        Overview
      </h1>

      <div className="flex items-center gap-2">
        <button
          onClick={onDeleteOldCarts}
          disabled={deleting}
          className="hidden items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 disabled:opacity-50 sm:flex"
        >
          <Trash2 size={14} />
          {deleting ? "Deleting..." : "Delete carts >30 days"}
        </button>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/[0.08]"
        >
          <RefreshCw
            size={14}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>
    </div>

       
      

      {/* ---- Hero stat cards -------------------------------------------- */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {heroStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* ---- Hero: fulfillment + tasks ---------------------------------- */}
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <FulfillmentProgress
          statuses={FULFILLMENT_STATUSES}
          counts={fulfillmentCounts}
          max={maxStatus}
        />
        <TasksChecklist tasks={tasks} onToggle={toggleTask} />
      </div>

      {/* ---- Active filters (all headline metrics, as pills) ------------ */}
      <div className="mt-6 mb-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-white/40">
             Filters
          </p>
          {activeFilter && (
            <button
              onClick={() => setActiveFilter(null)}
              className="text-xs font-semibold text-[#C6FF3D] hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {metrics.map(([label, value, Icon]) => (
            <FilterPill
              key={label}
              label={label}
              value={value}
              Icon={Icon}
              isActive={activeFilter === label}
              onClick={() => toggleFilter(label)}
            />
          ))}
        </div>
      </div>

      {/* ---- Pending orders (white panel, ref image 1 style) ------------ */}
      <section className={`${cardWhite} mb-6 overflow-hidden`}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">
              {activeFilter ? `Orders — ${activeFilter}` : "Pending orders"}
            </h2>
            {activeFilter && (
              <button
                onClick={() => setActiveFilter(null)}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <p className="mb-5 text-xs text-slate-400">
            {activeFilter
              ? `Showing orders matching "${activeFilter}"`
              : "What's moving through the warehouse right now"}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <QuickStat
              label="Shipped today"
              value={shippedTodayOrders.length}
            />
            <QuickStat label="Packed" value={packedOrders.length} />
            <QuickStat
              label="Orders using coupons"
              value={couponOrders.length}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 rounded-2xl bg-slate-50 px-5 py-4">
            <MiniStat label="Today's revenue" value={money(todayRevenue)} />
            <MiniStat
              label="Average order value"
              value={money(averageOrderValue)}
            />
            <MiniStat label="Orders this week" value={weekOrders.length} />
          </div>
        </div>

        <div className="overflow-x-auto border-t border-slate-100">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Order",
                  "Customer",
                  "Product",
                  "Status",
                  "Payment",
                  "Date",
                  "Amount",
                ].map((column) => (
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
              {latestOrders.length ? (
                latestOrders.map((order) => (
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
                      {order.paymentMethod === "cod"
                        ? "COD"
                        : order.paymentStatus}
                    </Cell>
                    <Cell>{shortDate(order.createdAt)}</Cell>
                    <Cell strong>{money(order.total)}</Cell>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-sm text-slate-400"
                  >
                    {activeFilter
                      ? `No orders match "${activeFilter}".`
                      : "No orders yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- Orders using coupons + Operations snapshot ------------------ */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[2fr_1fr]">
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
          {latestCouponOrders.map((order) => (
            <tr
              key={order.id}
              className="border-t border-slate-100 hover:bg-slate-50/70"
            >
              <Cell mono>{order.orderId}</Cell>
              <Cell>
                <span className="rounded-lg bg-[#C6FF3D]/20 px-2 py-1 font-mono text-xs font-bold text-emerald-700">
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

        <section className={`${cardWhite} p-6`}>
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <AlertTriangle size={16} className="text-amber-500" />
            Operations snapshot
          </h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {operationsSnapshot.map((item) => (
              <Snapshot
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>
        </section>
      </div>

      {/* ---- Top selling products - full width --------------------------- */}
      <section className={`${cardWhite} mt-5 p-6`}>
        <h2 className="font-bold text-slate-900">Top selling products</h2>

        <div className="mt-4 overflow-x-auto">
          <div className="flex min-w-max gap-3 pb-2">
            {topProducts.map(([name, qty], index) => (
              <div
                key={name}
                className="flex w-[260px] shrink-0 items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
              >
                <span className="truncate text-sm font-semibold text-slate-700">
                  <b className="mr-3 text-slate-300">{index + 1}</b>
                  {name}
                </span>
                <span className="ml-3 shrink-0 rounded-full bg-[#C6FF3D]/20 px-2 py-1 text-xs font-bold text-emerald-700">
                  {qty} sold
                </span>
              </div>
            ))}

            {!topProducts.length && (
              <p className="text-sm text-slate-400">No product sales yet.</p>
            )}
          </div>
        </div>
      </section>
     </>
);
}
