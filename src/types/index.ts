// ============================================
// NONSTOP PIZZA - All TypeScript Types
// ============================================

// CATEGORY
export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// PRODUCT
export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  is_new_arrival: boolean;
  is_active: boolean;
    is_in_stock: boolean;
    product_type: 'variant' | 'deal';
  display_order: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  variants?: ProductVariant[];
  deal_options?: DealOption[];
  suggestions?: Product[];
}

// PRODUCT VARIANT
export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  is_default: boolean;
  created_at: string;
}

// CART ITEM
export interface CartItem {
  id: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  special_instructions: string;
}

// ORDER
export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address: string;
  area: string;
  landmark: string | null;
  delivery_instructions: string | null;
  payment_method: 'cod' | 'card';
  payment_status: 'pending' | 'paid' | 'failed';
  payment_reference: string | null;
  order_status: 'received' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  subtotal: number;
  delivery_fee: number;
  total: number;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

// ORDER ITEM
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions: string | null;
  created_at: string;
  product?: Product;
}

// COMPLAINT
export interface Complaint {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  subject: string;
  message: string;
  status: 'pending' | 'reviewed' | 'resolved';
  admin_response: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

// BANNER SLIDE
export interface BannerSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// ADMIN
export interface Admin {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

// SITE SETTINGS
export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

// CHECKOUT FORM
export interface CheckoutForm {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address: string;
  area: string;
  landmark: string;
  delivery_instructions: string;
  payment_method: 'cod' | 'card';
}

// CARD DETAILS
export interface CardDetails {
  card_number: string;
  card_holder: string;
  expiry_date: string;
  cvv: string;
  card_type: 'visa' | 'master' | 'unionpay' | 'paypak';
}
// VOUCHER
export interface Voucher {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}
// DEAL OPTION GROUP
export interface DealOption {
  id: string;
  product_id: string;
  group_name: string;
  display_order: number;
  is_required: boolean;
  created_at: string;
  items?: DealOptionItem[];
}

// DEAL OPTION ITEM (choices)
export interface DealOptionItem {
  id: string;
  deal_option_id: string;
  name: string;
  price_adjustment: number;
  is_default: boolean;
  created_at: string;
}