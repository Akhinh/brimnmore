export type UserRole = 'admin' | 'worker';
export type OrderStatus = 'pending' | 'confirmed' | 'fulfilled' | 'cancelled';

export interface Profile {
  id: string; user_id: string; full_name: string; email: string;
  role: UserRole; is_active: boolean; avatar_url?: string;
  created_at: string; updated_at: string;
}
export interface ProductType {
  id: string; name: string; description?: string; color: string; created_at: string;
}
export interface Manufacturer {
  id: string; name: string; contact?: string; email?: string; address?: string; created_at: string;
}
export interface Product {
  id: string; sku: string; name: string; product_type_id?: string; manufacturer_id?: string;
  description?: string; quantity: number; unit: string; buying_price: number; selling_price: number;
  image_url?: string; expiry_date?: string; low_stock_threshold: number; is_featured: boolean;
  is_active: boolean; created_at: string; updated_at: string;
  product_types?: ProductType; manufacturers?: Manufacturer; total_stocked: number;
}
export interface Sale {
  id: string; worker_id: string; total_amount: number; note?: string; created_at: string;
  profiles?: Profile;
}
export interface SaleItem {
  id: string; sale_id: string; product_id: string; quantity_sold: number;
  unit_price: number; subtotal: number; created_at: string; products?: Product;
}
export interface RestockHistory {
  id: string; product_id: string; quantity_added: number; note?: string;
  restocked_by?: string; created_at: string; products?: Product;
}
export interface OrderLink {
  id: string; token: string; label: string; is_active: boolean;
  expires_at?: string; created_by?: string; created_at: string;
}
export interface CustomerOrder {
  id: string; order_link_id?: string; customer_name: string; customer_phone?: string;
  customer_note?: string; status: OrderStatus; total_amount: number; admin_note?: string;
  created_at: string; updated_at: string; customer_order_items?: CustomerOrderItem[];
}
export interface CustomerOrderItem {
  id: string; order_id: string; product_id: string; quantity: number;
  unit_price: number; subtotal: number; products?: Product;
}
export interface WorkerInvitation {
  id: string; email: string; token: string; role: UserRole; is_used: boolean;
  expires_at: string; created_by?: string; created_at: string;
}
export interface Notification {
  id: string; type: 'low_stock' | 'new_order' | 'restock_request';
  title: string; message?: string; is_read: boolean; data?: Record<string, unknown>; created_at: string;
}
export interface DailyRevenue {
  date: string; revenue: number; cost: number; profit: number; total_sales: number;
}
export interface ProductPerformance {
  id: string; name: string; sku: string; product_type: string; manufacturer: string;
  total_sold: number; total_revenue: number; remaining: number; selling_price: number; buying_price: number;
}
export interface CartItem { product: Product; quantity: number; }
export interface DashboardStats {
  totalRevenue: number; totalProfit: number; totalProducts: number;
  lowStockCount: number; pendingOrders: number; todaySales: number;
}
