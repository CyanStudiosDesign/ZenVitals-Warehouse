"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Boxes,
  Command,
  LayoutDashboard,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { Analytics, Settings } from "./components/analytics-settings";
import { OrderDetails } from "./components/order-details";
import { FulfillmentKanban, OrdersWorkspace } from "./components/Orders";
import { Overview } from "./components/Overview";
import { updateOrderStatus, getAllOrders } from "./action";
import { mapOrder } from "./mapOrder";

import type { DashboardView, OrderStatus, WarehouseOrder } from "./types/order";

const navigation = [
  ["overview", "Overview", LayoutDashboard],
  ["orders", "Orders", ShoppingBag],
  ["kanban", "Fulfillment", Boxes],
  ["analytics", "Analytics", BarChart3],
  ["settings", "Settings", SettingsIcon],
] as const;

export default function WarehouseDashboard() {
  const [orders, setOrders] = useState<WarehouseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<DashboardView>("overview");
  const [selectedOrder, setSelectedOrder] = useState<WarehouseOrder | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
const [notificationsOpen, setNotificationsOpen] = useState(false);
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllOrders();
      if (!result.success) {
        console.error(result.error);
        setOrders([]);
        return;
      }
      const mapped: WarehouseOrder[] = (result.data || []).map(mapOrder);
      setOrders(mapped);
      setSelectedOrder((prev) => (prev ? mapped.find((o) => o.id === prev.id) ?? null : null));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onStatusChange = async (id: string, status: OrderStatus) => {
    try {
      const result = await updateOrderStatus(id, status);
      if (!result.success) {
        console.error(result.error);
        return;
      }
      await fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const onDeleteOldCarts = async (_days: number) => {
    return { deleted: 0 };
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const results = useMemo(
    () =>
      (orders ?? [])
        .filter((order) =>
          `${order.orderId} ${order.customer} ${order.phone ?? ""}`
            .toLowerCase()
            .includes(commandQuery.toLowerCase())
        )
        .slice(0, 6),
    [orders, commandQuery]
  );

  const notifications = useMemo(() => {
  const items: { id: string; title: string; description: string; order: WarehouseOrder }[] = [];

  orders
    .filter((o) => o.paymentMethod === "cod" && o.status === "pending")
    .forEach((o) =>
      items.push({
        id: `cod-${o.id}`,
        title: `${o.orderId} needs COD confirmation`,
        description: o.customer,
        order: o,
      })
    );

  orders
    .filter((o) => o.paymentStatus === "failed")
    .forEach((o) =>
      items.push({
        id: `failed-${o.id}`,
        title: `Payment failed on ${o.orderId}`,
        description: o.customer,
        order: o,
      })
    );

  orders
    .filter((o) => o.priority === "urgent" && o.status !== "delivered" && o.status !== "cancelled")
    .forEach((o) =>
      items.push({
        id: `urgent-${o.id}`,
        title: `${o.orderId} is marked urgent`,
        description: o.customer,
        order: o,
      })
    );

  return items;
}, [orders]);

  const openOrder = (order: WarehouseOrder) => {
    setSelectedOrder(order);
    setCommandOpen(false);
    setView("orders");
  };

  const goTo = (id: DashboardView) => {
    setView(id);
    setSelectedOrder(null);
  };

  const deleteOldCarts = async () => {
    if (!window.confirm("Delete all abandoned carts older than 30 days? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const result = await onDeleteOldCarts(30);
      setNotice(`${result.deleted} old cart${result.deleted === 1 ? "" : "s"} deleted.`);
    } catch {
      setNotice("Old carts could not be deleted. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1211] text-white">
     <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0E1211]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 lg:px-8">
          <div className="mr-2 flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0E1211] font-black text-[#C6FF3D]">Z</span>
            <div className="hidden sm:block">
              <p className="text-sm font-black leading-none">ZenVitals</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Warehouse</p>
            </div>
          </div>

          {/* Pill nav — replaces the old sidebar, drives the same `view` state */}
        <nav className="hidden shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] p-1 xl:flex">
            {navigation.map(([id, label]) => (
              <button
                key={id}
                onClick={() => goTo(id)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  view === id && !selectedOrder
                    ? "bg-[#C6FF3D] text-[#0E1211]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <button
            onClick={() => setCommandOpen(true)}
           className="flex w-full max-w-xl items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-xs text-white/40 hover:border-[#C6FF3D]/40"
          >
            <Search size={15} />
            <span className="flex-1">Search orders or run a command</span>
            <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50">⌘K</kbd>
          </button>
          <div className="relative shrink-0">
  <button
    title="Notifications"
    onClick={() => setNotificationsOpen((open) => !open)}
    className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:text-blue-600"
  >
    <Bell size={17} />
    {notifications.length > 0 && (
      <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
    )}
  </button>

  {notificationsOpen && (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
      <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-bold text-slate-900">Notifications</p>
          <span className="text-xs font-semibold text-slate-400">{notifications.length}</span>
        </div>
        <div className="max-h-80 overflow-auto">
          {notifications.length ? (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  openOrder(n.order);
                  setNotificationsOpen(false);
                }}
                className="flex w-full flex-col items-start gap-0.5 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50"
              >
                <span className="text-sm font-semibold text-slate-800">{n.title}</span>
                <span className="text-xs text-slate-400">{n.description}</span>
              </button>
            ))
          ) : (
            <p className="p-6 text-center text-sm text-slate-400">You're all caught up.</p>
          )}
        </div>
      </div>
    </>
  )}
</div>
        </div>

        {/* Pill nav for tablet widths, where the row above gets tight */}
        <div className="border-t border-slate-100 px-4 py-2 xl:hidden">
         <nav className="hidden shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] p-1 xl:flex">
            {navigation.map(([id, label]) => (
              <button
                key={id}
                onClick={() => goTo(id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  view === id && !selectedOrder
                    ? "bg-[#C6FF3D] text-[#0E1211]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        <main className="min-w-0 flex-1 p-4 lg:p-8">
         <div className="mb-6 flex items-center justify-end">
  <div className="flex items-center gap-2">
    
  </div>
</div>
          {notice && (
            <div className="mb-5 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
              <span>{notice}</span>
              <button onClick={() => setNotice(null)}>
                <X size={15} />
              </button>
            </div>
          )}
          {selectedOrder ? (
            <OrderDetails order={selectedOrder} onBack={() => setSelectedOrder(null)} onStatusChange={onStatusChange} />
          ) : view === "overview" ? (
  <Overview
    orders={orders}
    onRefresh={fetchOrders}
    loading={loading}
    onDeleteOldCarts={deleteOldCarts}
    deleting={deleting}
  />
) : view === "orders" ? (
            <OrdersWorkspace orders={orders} onOpen={openOrder} onStatusChange={onStatusChange} />
          ) : view === "kanban" ? (
            <FulfillmentKanban orders={orders} onOpen={openOrder} onStatusChange={onStatusChange} />
          ) : view === "analytics" ? (
            <Analytics orders={orders} />
          ) : (
            <Settings />
          )}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex justify-around border-t border-slate-200 bg-white p-2 lg:hidden">
        {navigation.slice(0, 4).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => goTo(id)}
            className={`flex flex-col items-center gap-1 rounded-lg px-4 py-1 text-[10px] font-bold ${view === id ? "text-blue-600" : "text-slate-400"}`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      {commandOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/30 p-4 backdrop-blur-sm" onMouseDown={() => setCommandOpen(false)}>
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="mx-auto mt-[10vh] max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b p-4">
              <Command size={18} className="text-blue-600" />
              <input
                autoFocus
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Search order ID, customer or phone..."
                className="flex-1 text-sm outline-none"
              />
              <button onClick={() => setCommandOpen(false)}>
                <X size={17} />
              </button>
            </div>
            <div className="max-h-80 overflow-auto p-2">
              {results.map((order) => (
                <button key={order.id} onClick={() => openOrder(order)} className="flex w-full items-center justify-between rounded-xl p-3 text-left hover:bg-slate-50">
                  <span>
                    <b className="block text-sm text-slate-800">{order.orderId}</b>
                    <small className="text-slate-500">{order.customer}</small>
                  </span>
                  <span className="text-xs font-semibold capitalize text-slate-400">{order.status}</span>
                </button>
              ))}
              {!results.length && <p className="p-6 text-center text-sm text-slate-400">No matching orders</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}