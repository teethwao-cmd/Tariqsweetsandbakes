export type ProductCategory =
  | 'Mithai'
  | 'Cakes'
  | 'Pastries'
  | 'Biscuits'
  | 'Cookies'
  | 'Donuts'
  | 'Cupcakes'
  | 'Chocolates'
  | 'Gift Boxes'
  | 'Special Orders';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Mithai',
  'Cakes',
  'Pastries',
  'Biscuits',
  'Cookies',
  'Donuts',
  'Cupcakes',
  'Chocolates',
  'Gift Boxes',
  'Special Orders',
];

export interface ProductVariant {
  label: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  description: string;
  craftNote: string;
  price: number;
  variants: ProductVariant[];
  image: string;
  available: boolean;
  stock: number;
  featured: boolean;
  bestSeller: boolean;
  unitHint: string;
}

export interface CartItem {
  key: string;
  productId: string;
  name: string;
  category: ProductCategory;
  image: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
}

export interface Coupon {
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  value: number;
  minOrder: number;
  active: boolean;
}

export type OrderStatus =
  | 'Pending'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type FulfillmentType = 'Delivery' | 'Store Pickup';

export interface OrderItem {
  productId: string;
  name: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  notes: string;
  fulfillmentType: FulfillmentType;
  paymentMethod: 'Cash on Delivery' | 'WhatsApp Order (COD)' | 'Pay at Pickup';
  items: OrderItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  name: string;
  location: string;
  occasion: string;
  rating: number;
  quote: string;
  createdAt: string;
}

export interface CustomOrderInquiry {
  id: string;
  customerName: string;
  phone: string;
  eventType: 'Birthday Cake' | 'Wedding Bhaji & Favors' | 'Corporate Gift Boxes' | 'Custom Celebration';
  eventDate: string;
  servingsOrBoxes: string;
  flavorOrSelection: string;
  details: string;
  createdAt: string;
}

export interface StoreSettings {
  brandName: string;
  whatsappNumber: string;
  storePhone: string;
  storeEmail: string;
  storeAddress: string;
  openingHours: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  promoBanner: string;
}

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

export interface StoreData {
  products: Product[];
  coupons: Coupon[];
  orders: Order[];
  reviews: Review[];
  customInquiries: CustomOrderInquiry[];
  settings: StoreSettings;
}
