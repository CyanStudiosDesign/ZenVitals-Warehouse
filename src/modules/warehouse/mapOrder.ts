import type { OrderStatus, WarehouseOrder } from "./types/order";

function mapStatus(raw: string): OrderStatus {
  const s = (raw || "").toLowerCase();
  if (["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"].includes(s)) {
    return s as OrderStatus;
  }
  return "pending";
}

export function mapOrder(raw: any): WarehouseOrder {
  const isCod = (raw.paymentThrough || raw.paymentProvider || "").toLowerCase() === "cod";
  const subtotal =
    typeof raw.originalPrice === "number"
      ? raw.originalPrice
      : Math.max(
          0,
          (raw.totalPrice || 0) +
            (raw.discountAmount || 0) -
            (raw.shippingCost || 0) -
            (raw.codFee || 0) -
            (raw.gstFee || 0)
        );

  return {
    id: raw._id,
    orderId: raw.orderId || raw._id,
    customer: raw.customerName || "Valued Customer",
    phone: raw.customerPhone || "",
    status: mapStatus(raw.status),
    total: typeof raw.totalPrice === "number" ? raw.totalPrice : 0,
    subtotal,
    taxes: typeof raw.gstFee === "number" ? raw.gstFee : 0,
    shipping: typeof raw.shippingCost === "number" ? raw.shippingCost : 0,
    discount: typeof raw.discountAmount === "number" ? raw.discountAmount : 0,
    createdAt: raw.createdAt || raw._createdAt,
    paymentMethod: isCod ? "cod" : "online",
    paymentStatus: isCod ? "pending" : "paid",
    priority: raw.priority ?? "normal",
    shippingMethod: raw.shippingMethod ?? "Standard",
    courier: raw.courier,
    trackingNumber: raw.trackingNumber,
    shippingAddress:
      raw.shippingAddress ||
      [raw.streetAddress, raw.city, raw.state, raw.zipCode, raw.country]
        .filter(Boolean)
        .join(", ") ||
      "N/A",
    items: Array.isArray(raw.items)
      ? raw.items.map((item: any) => ({
          id: item._key || item._id || item.id || Math.random().toString(),
          name: item.productName || item.name || "Unnamed Product",
          price:
            typeof item.priceSnapshot === "number"
              ? item.priceSnapshot
              : typeof item.price === "number"
              ? item.price
              : 0,
          quantity:
            typeof item.quantity === "number"
              ? item.quantity
              : typeof item.qty === "number"
              ? item.qty
              : 1,
          image: item.productImage || item.image || "/placeholder-product.png",
        }))
      : [],
    coupon: raw.coupon
      ? { code: raw.coupon.code, discount: raw.coupon.discount }
      : undefined,
  };
}