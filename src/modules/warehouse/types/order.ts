export type OrderStatus = 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string | number;
  name: string;
  price: number;
  qty: number;
  image: string;
  specs?: string;
}

export interface Address {
  name: string;
  phone: string;
  tag?: string; // e.g., "Home", "Work"
  address: string;
}

export interface OrderSummary {
  subtotal: number;
  delivery: number;
  codFee?: number;
  gstFee?: number;
  coupon?: {
    code: string;
    discount: number;
  };
  total: number;
}

export interface OrderData {
  orderNumber: string;
  purchaseDate: string;
  expectedDate: string;
  paymentMethod: string;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  summary: OrderSummary;
}
export type DashboardView = "overview" | "orders" | "kanban" | "analytics" | "settings";

export interface WarehouseOrderItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface WarehouseOrder {
  id: string;
  orderId: string;
  customer: string;
  phone?: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  taxes: number;
  shipping: number;
  discount: number;
  createdAt: string;
  paymentMethod: "cod" | "online";
paymentStatus: "paid" | "pending" | "failed";
  priority?: string;
  shippingMethod?: string;
  courier?: string;
  trackingNumber?: string;
  shippingAddress: string;
  coupon?: { code: string; discount: number };   // ← add this line
  items: WarehouseOrderItem[];
 
}