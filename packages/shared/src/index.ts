// ─── ENUMS ───────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'worker';

export type ProductUnit = 'carton' | 'pack' | 'piece' | 'box' | 'bag' | 'crate';

export type OrderStatus = 'pending' | 'confirmed' | 'fulfilled' | 'cancelled';

export type RestockRequestStatus = 'pending' | 'acknowledged' | 'done';

// ─── DATABASE TYPES ───────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductType {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  contact?: string;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  type_id: string;
  manufacturer_id: string;
  quantity: number;
  unit: ProductUnit;
  buying_price: number;
  selling_price: number;
  expiry_date?: string;
  image_url?: string;
  is_featured: boolean;
  low_stock_threshold: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  product_types?: ProductType;
  manufacturers?: Manufacturer;
}

export interface Sale {
  id: string;
  product_id: string;
  worker_id: string;
  quantity_sold: number;
  unit_price: number;
  buying_price_snapshot: number;
  total_revenue: number;
  total_cost: number;
  profit: number;
  notes?: string;
  created_at: string;
  // Joined
  products?: Product;
  profiles?: Profile;
}

export interface CustomerToken {
  id: string;
  token: string;
  label: string;
  is_active: boolean;
  expires_at?: string;
  created_by: string;
  created_at: string;
}

export interface CustomerOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  status: OrderStatus;
  notes?: string;
  admin_notes?: string;
  token_id?: string;
  created_at: string;
  updated_at: string;
  // Joined
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  // Joined
  products?: Product;
}

export interface RestockHistory {
  id: string;
  product_id: string;
  admin_id: string;
  quantity_added: number;
  notes?: string;
  created_at: string;
}

export interface RestockRequest {
  id: string;
  product_id: string;
  worker_id: string;
  status: RestockRequestStatus;
  notes?: string;
  created_at: string;
  products?: Product;
  profiles?: Profile;
}

// ─── ANALYTICS TYPES ──────────────────────────────────────────────────────────

export interface DailySalesSummary {
  sale_date: string;
  total_transactions: number;
  total_units_sold: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
}

export interface ProductPerformance {
  id: string;
  name: string;
  sku: string;
  type_name: string;
  manufacturer_name: string;
  current_stock: number;
  selling_price: number;
  buying_price: number;
  total_sold: number;
  total_revenue: number;
  total_profit: number;
}

// ─── API REQUEST TYPES ────────────────────────────────────────────────────────

export interface CreateWorkerRequest {
  full_name: string;
  email: string;
  temporary_password: string;
}

export interface CreateProductRequest {
  name: string;
  type_id: string;
  manufacturer_id: string;
  quantity: number;
  unit: ProductUnit;
  buying_price: number;
  selling_price: number;
  expiry_date?: string;
  image_url?: string;
  is_featured?: boolean;
  low_stock_threshold?: number;
  description?: string;
}

export interface RecordSaleRequest {
  product_id: string;
  quantity_sold: number;
  notes?: string;
}

export interface PlaceOrderRequest {
  customer_name: string;
  customer_phone?: string;
  notes?: string;
  token: string;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
}

// ─── RESPONSE TYPES ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
