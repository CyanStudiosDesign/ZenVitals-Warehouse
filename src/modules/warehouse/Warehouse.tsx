"use client";

import React, { useState, useEffect } from "react";
import {
  Clipboard,
  ArrowRight,
  Save,
  Search,
  Filter,
  CreditCard,
  Coins,
  Truck,
  Calendar,
  User,
  ShoppingBag,
  ArrowLeft,
  RefreshCw,
  LayoutGrid,
  Clock,
  Tag,
  ListOrdered,
  Gift,
  Timer,
  MoreHorizontal,
  SlidersHorizontal,
  Download,
  ChevronDown,
} from "lucide-react";
import { OrderData, OrderStatus } from "./types/order";
import { updateOrderStatus, getAllOrders } from "./action"; // Import secure server actions

/* ------------------------------------------------------------------ */
/*  TAB CONFIG                                                         */
/*  Reorder tabs by simply reordering this array — nothing else        */
/*  needs to change. Each tab just needs a stable `id`, a `label`,     */
/*  and an `icon`.                                                     */
/* ------------------------------------------------------------------ */
type TabId = "overview" | "pending" | "orders" | "coupons";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "pending", label: "Pending Orders", icon: Clock },
  { id: "orders", label: "All Orders", icon: ListOrdered },
  { id: "coupons", label: "Coupon Codes", icon: Tag },
];

export default function WarehouseDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Selected Order details
  const [selectedOrderRaw, setSelectedOrderRaw] = useState<any | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("confirmed");
  const [updating, setUpdating] = useState<boolean>(false);

  // Lock and session states
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [pinDigits, setPinDigits] = useState<string[]>(Array(6).fill(""));
  const [pinError, setPinError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600);

  // NEW: active tab state (defaults to Overview so it's the first thing seen)
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // NEW: Coupons & Sales — no backend action exists for these yet in this file,
  // so these start empty and the Overview cards show an honest "not connected" state.
  // Once you have real endpoints (e.g. getAllCoupons(), getAllSales()), fetch them
  // the same way loadAllOrders() works and setCoupons/setSales with the results —
  // everything below is already wired to read from these two arrays.
  // Expected coupon shape:  { code: string, active: boolean, createdAt: string }
  // Expected sale shape:    { name: string, endsAt: string }
  const [coupons] = useState<any[]>([]);
  const [sales] = useState<any[]>([]);

  useEffect(() => {
    loadAllOrders();
  }, []);

  // PIN lock inactivity timer and events
  useEffect(() => {
    if (isLocked) return;

    const resetTimer = () => {
      setSecondsRemaining(600);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsLocked(true);
          return 600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      clearInterval(interval);
    };
  }, [isLocked]);

  // Auto-verify when 6 digits are filled
  useEffect(() => {
    const enteredPin = pinDigits.join("");
    if (enteredPin.length === 6) {
      if (enteredPin === "231245") {
        setIsLocked(false);
        setPinError(null);
        setPinDigits(Array(6).fill(""));
        setSecondsRemaining(600);
      } else {
        setPinError("Incorrect PIN. Please try again.");
        setPinDigits(Array(6).fill(""));
        setTimeout(() => {
          document.getElementById("pin-0")?.focus();
        }, 10);
      }
    }
  }, [pinDigits]);

  const handlePinChange = (value: string, index: number) => {
    const newDigits = [...pinDigits];
    newDigits[index] = value.replace(/[^0-9]/g, "").slice(-1);
    setPinDigits(newDigits);
    setPinError(null);

    if (newDigits[index] && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handlePinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const loadAllOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllOrders();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch orders.");
      }
      const fetchedOrders = result.data || [];
      setOrders(fetchedOrders);
      // Removed auto-select code to make dashboard open blank on load
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  const selectOrder = (order: any) => {
    if (!order) return;
    setSelectedOrderRaw(order);

    const mappedItems = Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          id: item._key || item._id || item.id || Math.random().toString(),
          name: item.productName || item.name || "Unnamed Product",
          price: typeof item.priceSnapshot === "number" ? item.priceSnapshot : typeof item.price === "number" ? item.price : 0,
          qty: typeof item.quantity === "number" ? item.quantity : typeof item.qty === "number" ? item.qty : 1,
          image: item.productImage || item.image || "/placeholder-product.png",
          specs: item.specs || "",
        }))
      : [];

    let formattedPurchaseDate = "N/A";
    let formattedExpectedDate = "N/A";
    try {
      const purchaseDateRaw = order.createdAt || order.purchaseDate || order._createdAt;
      if (purchaseDateRaw) {
        const pDate = new Date(purchaseDateRaw);
        if (!isNaN(pDate.getTime())) {
          formattedPurchaseDate = pDate.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const expDateRaw = order.expectedDate;
          if (expDateRaw) {
            const eDate = new Date(expDateRaw);
            if (!isNaN(eDate.getTime())) {
              formattedExpectedDate = eDate.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
            }
          }

          if (formattedExpectedDate === "N/A") {
            const eDate = new Date(pDate.getTime() + 5 * 24 * 60 * 60 * 1000);
            formattedExpectedDate = eDate.toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          }
        }
      }
    } catch (e) {
      console.error("Error formatting order dates", e);
    }

    const shippingAddrObj = {
      name: order.customerName || "Valued Customer",
      phone: order.customerPhone || "N/A",
      address: order.shippingAddress || [order.streetAddress, order.city, order.state, order.zipCode, order.country].filter(Boolean).join(", ") || "N/A",
    };

    const billingAddrObj = order.billingAddress
      ? {
          name: order.billingAddress.name || order.customerName || "Valued Customer",
          phone: order.billingAddress.phone || order.customerPhone || "N/A",
          address: order.billingAddress.address || order.shippingAddress || "N/A",
        }
      : shippingAddrObj;

    let mappedStatus: OrderStatus = "confirmed";
    const rawStatus = (order.status || "").toLowerCase();
    if (["cancelled", "delivered", "shipped", "packed", "pending"].includes(rawStatus)) {
      mappedStatus = rawStatus as OrderStatus;
    }

    setSelectedStatus(mappedStatus); // Sync Dropdown state

    const totalVal = typeof order.totalPrice === "number" ? order.totalPrice : 0;
    const discountVal = typeof order.discountAmount === "number" ? order.discountAmount : 0;
    const shippingCostVal = typeof order.shippingCost === "number" ? order.shippingCost : 0;
    const codFeeVal = typeof order.codFee === "number" ? order.codFee : 0;
    const gstFeeVal = typeof order.gstFee === "number" ? order.gstFee : 0;

    const subtotalVal = typeof order.originalPrice === "number"
      ? order.originalPrice
      : Math.max(0, totalVal + discountVal - shippingCostVal - codFeeVal - gstFeeVal);

    setOrderData({
      orderNumber: order.orderId || order._id,
      purchaseDate: formattedPurchaseDate,
      expectedDate: formattedExpectedDate,
      paymentMethod: ["cod", "razorpay"].includes(order.paymentThrough || order.paymentProvider)
        ? order.paymentThrough === "cod" || order.paymentProvider === "cod" ? "Cash on Delivery (COD)" : "Online (UPI / Cards / Wallets)"
        : order.paymentMethod || "Prepaid Card / UPI",
      status: mappedStatus,
      items: mappedItems,
      shippingAddress: shippingAddrObj,
      billingAddress: billingAddrObj,
      summary: {
        subtotal: subtotalVal,
        delivery: shippingCostVal,
        codFee: codFeeVal,
        gstFee: gstFeeVal,
        coupon: order.appliedCoupon ? { code: order.appliedCoupon, discount: discountVal } : undefined,
        total: totalVal,
      },
    });
  };

  const handleSaveChanges = async () => {
    if (!selectedOrderRaw?._id || !orderData) return;
    setUpdating(true);

    const result = await updateOrderStatus(selectedOrderRaw._id, selectedStatus);

    if (result.success) {
      setOrderData({ ...orderData, status: selectedStatus });

      // Update in-memory orders list
      setOrders(prevOrders =>
        prevOrders.map(o => o._id === selectedOrderRaw._id ? { ...o, status: selectedStatus } : o)
      );

      alert(`🎉 Database successfully updated to: ${selectedStatus.toUpperCase()}`);
    } else {
      alert(`⚠️ Error saving changes: ${result.error}`);
    }
    setUpdating(false);
  };

  // NEW: change status directly from a table row (Overview / Pending / All Orders tables)
  // without opening the full detail panel. Reuses the same updateOrderStatus action as
  // the existing "Save Status" flow, so there's a single source of truth for persistence.
  const handleInlineStatusChange = async (order: any, newStatus: OrderStatus) => {
    const result = await updateOrderStatus(order._id, newStatus);
    if (result.success) {
      setOrders((prev) =>
        prev.map((o) => (o._id === order._id ? { ...o, status: newStatus } : o))
      );
      // Keep the detail panel in sync if this same order happens to be open
      if (selectedOrderRaw?._id === order._id) {
        setSelectedStatus(newStatus);
        setOrderData((prev) => (prev ? { ...prev, status: newStatus } : prev));
      }
    } else {
      alert(`⚠️ Error updating status: ${result.error}`);
    }
  };

  // Filter orders by search term and status
  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();
    const orderIdVal = (order.orderId || "").toLowerCase();
    const customerVal = (order.customerName || "").toLowerCase();
    const phoneVal = (order.customerPhone || "").toLowerCase();
    const matchesSearch = orderIdVal.includes(term) || customerVal.includes(term) || phoneVal.includes(term);

    const matchesStatus = statusFilter === "all" || (order.status || "").toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeStyles = (status: string) => {
    const cleanStatus = status?.toLowerCase() || "";
    switch (cleanStatus) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      case "confirmed":
        return "bg-blue-50 text-blue-700 border-blue-200/60";
      case "packed":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/60";
      case "shipped":
        return "bg-purple-50 text-purple-700 border-purple-200/60";
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200/60";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/60";
    }
  };

  const getStatusEmoji = (status: string) => {
    const cleanStatus = status?.toLowerCase() || "";
    switch (cleanStatus) {
      case "pending": return "⏳";
      case "confirmed": return "✅";
      case "packed": return "📦";
      case "shipped": return "🚚";
      case "delivered": return "🏠";
      case "cancelled": return "❌";
      default: return "📄";
    }
  };

  const getPaymentProviderBadge = (provider: string) => {
    const isCod = provider?.toLowerCase() === "cod";
    return isCod ? (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
        <Coins size={10} /> COD
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60">
        <CreditCard size={10} /> Online
      </span>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  NEW: derived data for the Overview tab.                            */
  /*  Purely computed from the existing `orders` state — no change to    */
  /*  how orders are fetched or mutated.                                 */
  /* ------------------------------------------------------------------ */
  const pendingOrders = orders.filter((o) => (o.status || "").toLowerCase() === "pending");
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  // Aggregate top products sold across all orders (from items already present on each order)
  const topProducts = (() => {
    const map: Record<string, { name: string; qty: number; image: string }> = {};
    orders.forEach((order) => {
      if (!Array.isArray(order.items)) return;
      order.items.forEach((item: any) => {
        const name = item.productName || item.name || "Unnamed Product";
        const qty = typeof item.quantity === "number" ? item.quantity : typeof item.qty === "number" ? item.qty : 1;
        const image = item.productImage || item.image || "/placeholder-product.png";
        if (!map[name]) map[name] = { name, qty: 0, image };
        map[name].qty += qty;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  })();

  // Orders that actually redeemed a coupon (derived straight from order.appliedCoupon)
  const ordersWithCoupon = orders.filter((o) => !!o.appliedCoupon);

  // Active coupon codes (from the `coupons` placeholder state — see note above)
  const activeCoupons = coupons.filter((c) => c.active !== false);

  // Soonest-ending active sale (from the `sales` placeholder state — see note above)
  const soonestEndingSale = [...sales]
    .filter((s) => s.endsAt && new Date(s.endsAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime())[0];

  const daysUntil = (dateStr: string) => {
    const diffMs = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  };

  // --- Helpers for the "Latest Orders" table styling only (purely presentational, no logic change) ---
  const formatOrderDateShort = (
  dateStr: string,
  showTime: boolean = true
) => {
  if (!dateStr) return "N/A";

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";

  const datePart = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (!showTime) return datePart;

  const timePart = d
    .toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();

  return `${datePart}, ${timePart}`;
};

  const getProductSummary = (order: any) => {
    if (!Array.isArray(order.items) || order.items.length === 0) return "—";
    const first = order.items[0];
    const firstName = first.productName || first.name || "Unnamed Product";
    return order.items.length > 1 ? `${firstName} +${order.items.length - 1} more` : firstName;
  };

  const getPaymentLabel = (provider: string) => {
    const isCod = provider?.toLowerCase() === "cod";
    return isCod ? "Cash on Delivery" : "Online Payment";
  };

  const getStatusTextColor = (status: string) => {
    const cleanStatus = status?.toLowerCase() || "";
    switch (cleanStatus) {
      case "pending": return "text-amber-600";
      case "confirmed": return "text-blue-600";
      case "packed": return "text-indigo-600";
      case "shipped": return "text-purple-600";
      case "delivered": return "text-emerald-600";
      case "cancelled": return "text-rose-600";
      default: return "text-slate-600";
    }
  };

  const getStatusDisplayLabel = (status: string) => {
    const cleanStatus = status?.toLowerCase() || "";
    switch (cleanStatus) {
      case "pending": return "Pending";
      case "confirmed": return "Processing";
      case "packed": return "Processing";
      case "shipped": return "Shipped";
      case "delivered": return "Completed";
      case "cancelled": return "Cancelled";
      default: return "Processing";
    }
  };

  const openOrderInAllOrdersTab = (order: any) => {
    selectOrder(order);
    setActiveTab("orders");
  };

  // --- Shared table renderer used by Overview, Pending Orders, and All Orders tabs ---
  // Keeping this in one place means all three tables always look and behave identically.
  const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Processing" },
    { value: "packed", label: "Packed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const renderOrdersTable = (list: any[], emptyMessage: string) => {
    if (loading) {
      return <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading orders...</div>;
    }
    if (list.length === 0) {
      return <div className="p-8 text-center text-slate-400 text-sm">{emptyMessage}</div>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-t border-b border-slate-100">
              <th className="px-6 py-3.5 text-[12px] font-medium text-slate-400">Order ID</th>
              <th className="px-6 py-3.5 text-[12px] font-medium text-slate-400">Product</th>
              <th className="px-6 py-3.5 text-[12px] font-medium text-slate-400">Order Date</th>
              <th className="px-6 py-3.5 text-[12px] font-medium text-slate-400">Price</th>
              <th className="px-6 py-3.5 text-[12px] font-medium text-slate-400">Payment</th>
              <th className="px-6 py-3.5 text-[12px] font-medium text-slate-400">Status</th>
              <th className="px-6 py-3.5 text-[12px] font-medium text-slate-400 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((order) => {
              const cleanStatus = (order.status || "").toLowerCase();
              const validStatus = STATUS_OPTIONS.some((s) => s.value === cleanStatus) ? cleanStatus : "confirmed";
              return (
                <tr
                  key={order._id}
                  onClick={() => openOrderInAllOrdersTab(order)}
                  className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/70 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 text-[13.5px] font-semibold text-slate-800 whitespace-nowrap">
                    #{order.orderId || order._id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-[13.5px] font-medium text-slate-700 whitespace-nowrap max-w-[180px] truncate">
                    {getProductSummary(order)}
                  </td>
                  <td className="px-6 py-4 text-[13.5px] font-medium text-slate-500 whitespace-nowrap">
                    {formatOrderDateShort(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-[13.5px] font-semibold text-slate-800 whitespace-nowrap">
                    ₹{typeof order.totalPrice === "number" ? order.totalPrice.toFixed(2) : "0.00"}
                  </td>
                  <td className="px-6 py-4 text-[13.5px] font-medium text-slate-500 whitespace-nowrap">
                    {getPaymentLabel(order.paymentThrough || order.paymentProvider)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block">
                      <select
                        value={validStatus}
                        onChange={(e) => handleInlineStatusChange(order, e.target.value as OrderStatus)}
                        className={`appearance-none bg-transparent pr-4 text-[13.5px] font-semibold border-none focus:outline-none focus:ring-0 cursor-pointer ${getStatusTextColor(validStatus)}`}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} className="text-slate-800">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openOrderInAllOrdersTab(order);
                      }}
                      className="text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Lock Overlay UI
  if (isLocked) {
    return (
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
        style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        `}</style>
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl max-w-sm w-full text-center">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Enter PIN</h2>

          <div className="flex gap-2 mb-4 justify-center">
            {pinDigits.map((digit, idx) => (
              <input
                key={idx}
                id={`pin-${idx}`}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(e.target.value, idx)}
                onKeyDown={(e) => handlePinKeyDown(e, idx)}
                autoFocus={idx === 0}
                className="w-10 h-12 border border-slate-300 rounded-lg text-center text-lg font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono"
              />
            ))}
          </div>

          {pinError && (
            <p className="text-xs text-rose-600 mb-4 font-semibold">
              {pinError}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen bg-slate-50 antialiased overflow-hidden w-full"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
    >
      {/* Self-contained font import — no tailwind.config or layout.tsx changes needed */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      `}</style>

      {/* Sidebar — desktop navigation. Reorder TABS array above to change order. */}
      <aside className="hidden md:flex w-60 bg-white border-r border-slate-200 flex-col shrink-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <img
            src="/LogoIcon.png"
            alt="Logo"
            className="h-9 w-9 object-contain rounded-lg"
          />
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 leading-tight truncate">Warehouse Fulfillment</h1>
            <p className="text-[11px] text-slate-400">Zenvitals</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const showBadge = tab.id === "pending" && pendingOrders.length > 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon size={16} />
                <span className="flex-1 text-left">{tab.label}</span>
                {showBadge && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-extrabold rounded-full bg-amber-500 text-white">
                    {pendingOrders.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Right column: header + active tab content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0 w-full">
          <div className="flex items-center gap-3 md:hidden">
            <img
              src="/LogoIcon.png"
              alt="Logo"
              className="h-9 w-9 object-contain rounded-lg"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              {TABS.find((t) => t.id === activeTab)?.label}
            </h2>
            <p className="text-xs text-slate-400">Manage orders, packaging & tracking dispatch</p>
          </div>
          <button
            onClick={loadAllOrders}
            disabled={loading}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Sync</span>
          </button>
        </header>

        {/* Mobile-only tab nav fallback (sidebar is desktop-only) */}
        <nav className="md:hidden flex items-center gap-1 px-4 bg-white border-b border-slate-200 shrink-0 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const showPendingBadge = tab.id === "pending" && pendingOrders.length > 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3.5 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {showPendingBadge && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold rounded-full bg-amber-500 text-white">
                    {pendingOrders.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

      {/* ---------------------------------------------------------------- */}
      {/*  TAB: OVERVIEW                                                    */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === "overview" && (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Pending Orders */}
              <button
                onClick={() => setActiveTab("pending")}
                className="text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Clock size={18} className="text-amber-600" />
                  </div>
                  {pendingOrders.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                      Needs action
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">Pending Orders</p>
                  <p className="text-xl font-black text-slate-900">{pendingOrders.length}</p>
                </div>
              </button>

              {/* 2. New Coupon Codes */}
              <button
                onClick={() => setActiveTab("coupons")}
                className="text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3 hover:border-blue-300 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Gift size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">New Coupon Codes</p>
                  <p className="text-xl font-black text-slate-900">{activeCoupons.length}</p>
                  {coupons.length === 0 && (
                    <p className="text-[10px] text-slate-400 mt-0.5">Not connected yet</p>
                  )}
                </div>
              </button>

              {/* 3. Orders that used a coupon */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Tag size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">Orders Using a Coupon</p>
                  <p className="text-xl font-black text-slate-900">{ordersWithCoupon.length}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    of {orders.length} total {orders.length === 1 ? "order" : "orders"}
                  </p>
                </div>
              </div>

              {/* 4. Sale ending soon */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                  <Timer size={18} className="text-rose-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">Sale Ending Soon</p>
                  {soonestEndingSale ? (
                    <>
                      <p className="text-xl font-black text-slate-900">{daysUntil(soonestEndingSale.endsAt)}d left</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{soonestEndingSale.name}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-black text-slate-900">—</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">No active sale</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Pending Orders — first thing under the stat cards, as requested */}
           <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[650px] flex flex-col">
           <div className="flex items-center justify-between px-6 py-5">
         <h3 className="text-[15px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
  <Clock size={14} className="text-amber-500" />
  Pending Orders
</h3>
                <button
                  onClick={() => setActiveTab("pending")}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View all <ArrowRight size={12} />
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading orders...</div>
              ) : pendingOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No pending orders 🎉</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingOrders.map((order) => (
                   <button
  key={order._id}
  onClick={() => openOrderInAllOrdersTab(order)}
  className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50/70 transition-colors text-left"
>
  <div className="flex items-center gap-3 min-w-0">
    <span className="w-[120px] text-[13.5px] font-semibold text-slate-800 truncate">
      {order.orderId || order._id.slice(0, 10) + "..."}
    </span>

    <span className="flex-1 text-[13.5px] font-medium text-slate-700 truncate">
      {order.customerName || "Valued Customer"}
    </span>
  </div>

  <div className="flex items-center">
    <span className="w-[90px] text-right text-[13.5px] font-medium text-slate-500">
     <span className="text-[13.5px] font-medium text-slate-500 whitespace-nowrap">
  {order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A"}
</span>
    </span>

    <span className="w-[110px] text-right text-[13.5px] font-semibold text-slate-800">
      ₹{typeof order.totalPrice === "number" ? order.totalPrice.toFixed(2) : "0.00"}
    </span>

    <span className={`w-[90px] text-right text-[13.5px] font-semibold ${getStatusTextColor(order.status)}`}>
      {getStatusDisplayLabel(order.status)}
    </span>
  </div>
</button>
                    
                  ))}
                </div>
              )}
            </div>

         

              
           
                 
            </div>
          </div>
        
      )}

      {/* ---------------------------------------------------------------- */}
      {/*  TAB: PENDING ORDERS                                              */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === "pending" && (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5">
                <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
                  Pending Orders ({pendingOrders.length})
                </h3>
                <div className="flex items-center gap-5">
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                    <SlidersHorizontal size={13} /> Customize
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                    <Filter size={13} /> Filter
                  </button>
                  <button
                    disabled
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 cursor-not-allowed"
                  >
                    <Download size={13} /> Export
                  </button>
                </div>
              </div>

              {renderOrdersTable(pendingOrders, "No pending orders 🎉")}
              
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/*  TAB: COUPON CODES (placeholder — to be built out next)          */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === "coupons" && (
        <div className="flex-1 flex items-center justify-center text-slate-400 p-8">
          <div className="text-center space-y-2">
            <Tag size={40} className="mx-auto text-slate-300 stroke-1" />
            <p className="text-sm font-semibold">Coupon Codes management is coming soon</p>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/*  TAB: ALL ORDERS — this is the original, fully unchanged          */}
      {/*  orders list + order detail experience from before.               */}
      {/* ---------------------------------------------------------------- */}
      {activeTab === "orders" && (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {!orderData ? (
            <div className="max-w-6xl mx-auto">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-b border-slate-100">
                  <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">
                    All Orders ({filteredOrders.length})
                  </h3>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search ID, customer, phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs font-medium"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">⏳ Pending</option>
                      <option value="confirmed">✅ Confirmed</option>
                      <option value="packed">📦 Packaged</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>
                  </div>
                </div>

                {renderOrdersTable(filteredOrders, "No orders found")}
              </div>
            </div>
          ) : (
              <div className="max-w-4xl w-full mx-auto space-y-6">
                {/* Back button */}
                <button
                  onClick={() => {
                    setOrderData(null);
                    setSelectedOrderRaw(null);
                  }}
                  className="md:hidden flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg bg-white shadow-sm cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to list
                </button>

                {/* Order Identity Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-900 font-mono">
                        Order: {orderData.orderNumber}
                      </span>
                      <button
                        className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                        onClick={() => {
                          navigator.clipboard.writeText(orderData.orderNumber);
                          alert("Copied Order ID to clipboard!");
                        }}
                        title="Copy Order ID"
                      >
                        <Clipboard size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {orderData.purchaseDate}</span>
                      <span className="flex items-center gap-1"><Truck size={12} /> Exp: {orderData.expectedDate}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-750 border border-slate-200 rounded-full flex items-center gap-1.5">
                      Mode of Payment: <strong className="text-slate-950 font-bold">{orderData.paymentMethod}</strong>
                    </span>
                  </div>
                </div>

                {/* Manage Fulfillment Dropdown */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Manage Order Fulfillment</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Current Status: <span className="font-bold uppercase text-slate-750">{orderData.status}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                      className="flex-1 sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="confirmed">✅ Confirmed</option>
                      <option value="packed">📦 Packaged</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>

                    <button
                      onClick={handleSaveChanges}
                      disabled={updating}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Save size={14} />
                      <span>{updating ? "Saving..." : "Save Status"}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Product Manifest Checklist */}
                  <div className="lg:col-span-2 flex flex-col space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-455 uppercase tracking-wider">
                      Manifest Items Checklist
                    </h3>
                    {orderData.items.map((item) => (
                      <div
                        key={item.id}
                        className="w-full justify-between flex items-center p-4 border border-slate-200 rounded-xl bg-white shadow-sm hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg border border-slate-100" />
                          <div>
                            <h4 className="font-semibold text-slate-900 text-sm">{item.name}</h4>
                            {item.specs && <p className="text-xs text-slate-400 mt-0.5">{item.specs}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                          <span className="text-xs text-slate-450">Qty: <strong className="text-slate-950 font-extrabold">{item.qty}</strong></span>
                          <span className="font-extrabold text-sm text-slate-900">₹{item.price.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping & Financial Overview */}
                  <div className="lg:col-span-1 flex flex-col space-y-6">
                    {/* Shipping Info */}
                    <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm">
                      <h4 className="text-xs font-extrabold text-slate-450 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
                        <User size={12} /> Shipping details
                      </h4>
                      <p className="text-sm font-bold text-slate-800">{orderData.shippingAddress.name}</p>
                      <p className="text-xs text-slate-500 my-1 font-semibold">{orderData.shippingAddress.phone}</p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{orderData.shippingAddress.address}</p>
                    </div>

                    {/* Pricing Overview */}
                    <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm">
                      <h4 className="text-xs font-extrabold text-slate-455 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                        Financial overview
                      </h4>
                      <div className="space-y-2 text-xs">
                        {/* Subtotal */}
                        <div className="flex justify-between text-slate-500">
                          <span>Subtotal</span>
                          <span className="font-semibold text-slate-900">₹{orderData.summary.subtotal.toFixed(2)}</span>
                        </div>

                        {/* GST */}
                        {orderData.summary.gstFee !== undefined && orderData.summary.gstFee > 0 && (
                          <div className="flex justify-between text-slate-500">
                            <span>GST</span>
                            <span className="font-semibold text-slate-900">₹{orderData.summary.gstFee.toFixed(2)}</span>
                          </div>
                        )}

                        {/* COD Handling Fee (when selected/selected payment method) */}
                        {orderData.summary.codFee !== undefined && orderData.summary.codFee > 0 && (
                          <div className="flex justify-between text-slate-500">
                            <span>COD Handling Fee</span>
                            <span className="font-semibold text-slate-900">₹{orderData.summary.codFee.toFixed(2)}</span>
                          </div>
                        )}

                        {/* Delivery/Shipping Cost */}
                        <div className="flex justify-between text-slate-500">
                          <span>Shipping Cost</span>
                          {orderData.summary.delivery === 0 ? (
                            <span className="font-bold text-green-600 uppercase text-[10px]">Free</span>
                          ) : (
                            <span className="font-semibold text-slate-900">₹{orderData.summary.delivery.toFixed(2)}</span>
                          )}
                        </div>

                        {/* Coupon / Discount */}
                        {orderData.summary.coupon && (
                          <div className="flex justify-between text-green-600 font-medium">
                            <span>Coupon ({orderData.summary.coupon.code})</span>
                            <span>- ₹{orderData.summary.coupon.discount.toFixed(2)}</span>
                          </div>
                        )}

                        {/* Total Bill */}
                        <div className="border-t border-dashed border-slate-200 pt-3 mt-2 flex justify-between items-baseline">
                          <span className="text-sm font-bold text-slate-950">Total Bill</span>
                          <span className="text-lg font-black text-slate-900">₹{orderData.summary.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        
      )}
      </div>
    </div>

  );
}
