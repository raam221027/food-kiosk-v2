/**
 * Domain models for the admin area.
 *
 * These mirror the Laravel migrations in `backend/database/migrations` — field
 * names are the snake_case ones the API serialises, so a response can be
 * dropped straight into a view without a mapping layer.
 */

export type OrderType = 'dine-in' | 'take-out' | 'curbside' | 'delivery'
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
export type KitchenStatus = 'pending' | 'preparing' | 'ready' | 'completed'
export type Priority = 'low' | 'medium' | 'high'
export type PaymentStatus = 'pending' | 'completed' | 'failed'
export type PaymentMethodType = 'cash' | 'card' | 'mobile_payment' | 'other'
export type AmountType = 'percentage' | 'fixed_amount'
export type InventoryUnit = 'piece' | 'lbs' | 'liter' | 'box' | 'other'
export type DeviceType = 'kiosk' | 'tablet' | 'mobile' | 'other'

export interface Restaurant {
  id: number
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  phone_number: string
  email: string
  tax_id: string
  logo?: string | null
  website?: string | null
  timezone: string
  currency: string
  language: string
  status: boolean
}

export interface Category {
  id: number
  restaurant_id: number
  name: string
  image: string
  description?: string | null
  sort_order: number
  is_active: boolean
  /** Convenience counter the API may append; not a column. */
  products_count?: number
}

export interface Product {
  id: number
  category_id: number
  restaurant_id: number
  name: string
  description?: string | null
  image?: string | null
  price: number
  sku: string
  is_available: boolean
  category?: Pick<Category, 'id' | 'name'>
}

export interface ProductVariant {
  id: number
  product_id: number
  modifier_group_id?: number | null
  name: string
  price: number
  is_available: boolean
}

export interface ModifierGroup {
  id: number
  restaurant_id: number
  name: string
  min_selection: number
  max_selection: number
  is_required: boolean
  modifiers?: Modifier[]
}

export interface Modifier {
  id: number
  modifier_group_id: number
  name: string
  price: number
  is_available: boolean
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  variant_id?: number | null
  product_name: string
  quantity: number
  price: number
  total_price: number
}

export interface Order {
  id: number
  restaurant_id: number
  order_number: string
  order_type: OrderType
  order_status: OrderStatus
  subtotal: number
  tax: number
  tip?: number | null
  discount?: number | null
  total_amount: number
  customer_name: string
  notes?: string | null
  created_at: string
  items?: OrderItem[]
}

export interface KitchenOrder {
  id: number
  order_id: number
  status: KitchenStatus
  priority: Priority
  started_at?: string | null
  completed_at?: string | null
  created_at: string
  order?: Order
}

export interface PaymentMethod {
  id: number
  restaurant_id: number
  name: string
  type: PaymentMethodType
  is_active: boolean
}

export interface Payment {
  id: number
  order_id: number
  payment_method_id: number
  amount: number
  status: PaymentStatus
  transaction_id?: string | null
  paid_at?: string | null
  created_at: string
  order?: Pick<Order, 'id' | 'order_number' | 'customer_name'>
  payment_method?: Pick<PaymentMethod, 'id' | 'name' | 'type'>
}

export interface Tax {
  id: number
  restaurant_id: number
  name: string
  rate: number
  is_active: boolean
}

export interface Discount {
  id: number
  restaurant_id: number
  name: string
  discount_type: AmountType
  value: number
  is_active: boolean
}

export interface Coupon {
  id: number
  restaurant_id: number
  code: string
  coupon_type: AmountType
  discount_value: number
  valid_from: string
  valid_until: string
  usage_limit?: number | null
  used_count: number
}

export interface Employee {
  id: number
  restaurant_id: number
  user_id: number
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  is_active: boolean
  hired_at?: string | null
  /** Spatie role name, appended by the API from the linked user. */
  role?: string
}

export interface InventoryItem {
  id: number
  restaurant_id: number
  product_id: number
  variant_id?: number | null
  quantity: number
  unit: InventoryUnit
  cost_price: number
  minimum_stock: number
  product?: Pick<Product, 'id' | 'name' | 'sku'>
}

export interface Device {
  id: number
  restaurant_id: number
  name: string
  type: DeviceType
  device_code: string
  is_active: boolean
  last_seen_at?: string | null
}

export interface Receipt {
  id: number
  order_id: number
  receipt_number: string
  email_address?: string | null
  phone_number?: string | null
  email_sent: boolean
  text_sent: boolean
  printed_at?: string | null
  created_at: string
}

export interface Setting {
  id: number
  restaurant_id: number
  key: string
  value: string | null
}

export interface AuditLog {
  id: number
  user_id?: number | null
  action: string
  table_name: string
  record_id?: number | null
  old_values?: Record<string, unknown> | null
  new_values?: Record<string, unknown> | null
  ip_address?: string | null
  created_at: string
  user_name?: string
}
