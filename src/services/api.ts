import { createSeedData } from '../data/seedCatalog.ts';
import { getSupabaseClient } from '../lib/supabaseClient.ts';
import type {
  Coupon,
  CustomOrderInquiry,
  FulfillmentType,
  Order,
  OrderStatus,
  Product,
  Review,
  StoreData,
  StoreSettings,
} from '../types.ts';
import { buildWhatsAppOrderMessage, buildWhatsAppUrl } from '../utils/formatters.ts';

const ADMIN_TOKEN_KEY = 'tariq_admin_token';

export function getAdminToken(): string | null {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string | null): void {
  if (token) {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

function mapSupabaseProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug || ''),
    category: row.category as Product['category'],
    description: String(row.description || ''),
    craftNote: String(row.craft_note || ''),
    price: Number(row.price || 0),
    variants: Array.isArray(row.variants) ? (row.variants as Product['variants']) : [],
    image: String(row.image || ''),
    available: Boolean(row.available),
    stock: Number(row.stock ?? 25),
    featured: Boolean(row.featured),
    bestSeller: Boolean(row.best_seller),
    unitHint: String(row.unit_hint || ''),
  };
}

function toSupabaseProductRow(p: Product) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    description: p.description,
    craft_note: p.craftNote,
    price: p.price,
    variants: p.variants,
    image: p.image,
    available: p.available,
    stock: p.stock,
    featured: p.featured,
    best_seller: p.bestSeller,
    unit_hint: p.unitHint,
  };
}

function mapSupabaseOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    orderNumber: String(row.order_number),
    customerName: String(row.customer_name),
    phone: String(row.phone),
    address: String(row.address),
    notes: String(row.notes || ''),
    fulfillmentType: (row.fulfillment_type as FulfillmentType) || 'Delivery',
    paymentMethod: (row.payment_method as Order['paymentMethod']) || 'Cash on Delivery',
    items: Array.isArray(row.items) ? (row.items as Order['items']) : [],
    subtotal: Number(row.subtotal || 0),
    discountCode: row.discount_code ? String(row.discount_code) : undefined,
    discountAmount: Number(row.discount_amount || 0),
    deliveryFee: Number(row.delivery_fee || 0),
    total: Number(row.total || 0),
    status: (row.status as OrderStatus) || 'Pending',
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Request failed');
  }
  return data as T;
}

export interface BootstrapPayload {
  products: Product[];
  settings: StoreSettings;
  activeCoupons: Coupon[];
  reviews: Review[];
  source: 'supabase' | 'demo';
}

export async function fetchBootstrap(): Promise<BootstrapPayload> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const [prodRes, setRes, coupRes, revRes] = await Promise.all([
        sb.from('products').select('*').order('created_at', { ascending: false }),
        sb.from('store_settings').select('*').eq('id', 1).maybeSingle(),
        sb.from('coupons').select('*').eq('active', true),
        sb.from('reviews').select('*').order('created_at', { ascending: false }),
      ]);

      if (!prodRes.error && prodRes.data && prodRes.data.length > 0) {
        const seed = createSeedData();
        const settings: StoreSettings = setRes.data
          ? {
              brandName: setRes.data.brand_name,
              whatsappNumber: setRes.data.whatsapp_number,
              storePhone: setRes.data.store_phone,
              storeEmail: setRes.data.store_email,
              storeAddress: setRes.data.store_address,
              openingHours: setRes.data.opening_hours,
              deliveryFee: setRes.data.delivery_fee,
              freeDeliveryThreshold: setRes.data.free_delivery_threshold,
              promoBanner: setRes.data.promo_banner,
            }
          : seed.settings;

        return {
          products: prodRes.data.map(mapSupabaseProduct),
          settings,
          activeCoupons:
            coupRes.data?.map((c) => ({
              code: c.code,
              description: c.description,
              discountType: c.discount_type,
              value: c.value,
              minOrder: c.min_order,
              active: c.active,
            })) || seed.coupons,
          reviews:
            revRes.data?.map((r) => ({
              id: r.id,
              name: r.name,
              location: r.location,
              occasion: r.occasion,
              rating: r.rating,
              quote: r.quote,
              createdAt: r.created_at,
            })) || seed.reviews,
          source: 'supabase',
        };
      }
    } catch {
      // Fall back to Demo backend gracefully
    }
  }

  const demo = await apiFetch<Omit<BootstrapPayload, 'source'>>('/api/bootstrap');
  return { ...demo, source: 'demo' };
}

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<{ valid: boolean; discountAmount: number; message: string; coupon?: Coupon }> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const clean = code.trim().toUpperCase();
      const { data, error } = await sb
        .from('coupons')
        .select('*')
        .eq('code', clean)
        .eq('active', true)
        .maybeSingle();
      if (!error && data) {
        if (subtotal < data.min_order) {
          throw new Error(
            `Minimum order of PKR ${Number(data.min_order).toLocaleString('en-PK')} required for ${data.code}.`
          );
        }
        const discountAmount =
          data.discount_type === 'percent'
            ? Math.round((subtotal * data.value) / 100)
            : Math.min(subtotal, data.value);
        return {
          valid: true,
          discountAmount,
          message: `${data.code} applied (-PKR ${discountAmount.toLocaleString('en-PK')})`,
          coupon: {
            code: data.code,
            description: data.description,
            discountType: data.discount_type,
            value: data.value,
            minOrder: data.min_order,
            active: data.active,
          },
        };
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Minimum order')) throw err;
    }
  }
  return apiFetch('/api/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal }),
  });
}

export async function submitOrder(payload: {
  customerName: string;
  phone: string;
  address: string;
  notes: string;
  fulfillmentType: FulfillmentType;
  paymentMethod: 'Cash on Delivery' | 'WhatsApp Order (COD)' | 'Pay at Pickup';
  discountCode?: string;
  items: Array<{
    productId: string;
    name: string;
    variantLabel: string;
    unitPrice: number;
    quantity: number;
  }>;
  settings: StoreSettings;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  total: number;
}): Promise<{ order: Order; whatsappMessage: string; whatsappUrl: string }> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const orderNumber = `TSB-${Math.floor(1050 + Math.random() * 8900)}`;
      const order: Order = {
        id: `ord-${Date.now()}`,
        orderNumber,
        customerName: payload.customerName,
        phone: payload.phone,
        address:
          payload.fulfillmentType === 'Store Pickup'
            ? payload.settings.storeAddress
            : payload.address,
        notes: payload.notes,
        fulfillmentType: payload.fulfillmentType,
        paymentMethod: payload.paymentMethod,
        items: payload.items.map((i) => ({
          ...i,
          lineTotal: i.unitPrice * i.quantity,
        })),
        subtotal: payload.subtotal,
        discountCode: payload.discountCode,
        discountAmount: payload.discountAmount,
        deliveryFee: payload.deliveryFee,
        total: payload.total,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };

      const { error } = await sb.from('orders').insert({
        id: order.id,
        order_number: order.orderNumber,
        customer_name: order.customerName,
        phone: order.phone,
        address: order.address,
        notes: order.notes,
        fulfillment_type: order.fulfillmentType,
        payment_method: order.paymentMethod,
        items: order.items,
        subtotal: order.subtotal,
        discount_code: order.discountCode || null,
        discount_amount: order.discountAmount,
        delivery_fee: order.deliveryFee,
        total: order.total,
        status: order.status,
      });

      if (!error) {
        const whatsappMessage = buildWhatsAppOrderMessage(order, payload.settings);
        const whatsappUrl = buildWhatsAppUrl(payload.settings.whatsappNumber, whatsappMessage);
        return { order, whatsappMessage, whatsappUrl };
      }
    } catch {
      // Fallback to Demo backend
    }
  }

  return apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function trackOrderByNumber(orderNumber: string): Promise<Order> {
  const clean = orderNumber.trim().toUpperCase();
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('orders')
        .select('*')
        .eq('order_number', clean)
        .maybeSingle();
      if (!error && data) {
        return mapSupabaseOrder(data);
      }
    } catch {
      // Fallback
    }
  }
  const res = await apiFetch<{ order: Order }>(`/api/orders/track/${encodeURIComponent(clean)}`);
  return res.order;
}

export async function submitReview(payload: {
  name: string;
  location: string;
  occasion: string;
  rating: number;
  quote: string;
}): Promise<Review> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const rev: Review = {
        id: `rev-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      const { error } = await sb.from('reviews').insert({
        id: rev.id,
        name: rev.name,
        location: rev.location,
        occasion: rev.occasion,
        rating: rev.rating,
        quote: rev.quote,
      });
      if (!error) return rev;
    } catch {
      // Fallback
    }
  }
  const res = await apiFetch<{ review: Review }>('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.review;
}

export async function submitCustomInquiry(
  payload: Omit<CustomOrderInquiry, 'id' | 'createdAt'>
): Promise<{ inquiry: CustomOrderInquiry; whatsappUrl: string }> {
  return apiFetch('/api/custom-orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function adminLogin(username: string, password: string): Promise<void> {
  const res = await apiFetch<{ token: string }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setAdminToken(res.token);
}

export async function fetchAdminDashboard(): Promise<StoreData> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const [prodRes, ordRes, coupRes, setRes, revRes] = await Promise.all([
        sb.from('products').select('*').order('created_at', { ascending: false }),
        sb.from('orders').select('*').order('created_at', { ascending: false }),
        sb.from('coupons').select('*'),
        sb.from('store_settings').select('*').eq('id', 1).maybeSingle(),
        sb.from('reviews').select('*').order('created_at', { ascending: false }),
      ]);
      if (!prodRes.error && prodRes.data && prodRes.data.length > 0) {
        const seed = createSeedData();
        return {
          products: prodRes.data.map(mapSupabaseProduct),
          orders: ordRes.data ? ordRes.data.map(mapSupabaseOrder) : seed.orders,
          coupons:
            coupRes.data?.map((c) => ({
              code: c.code,
              description: c.description,
              discountType: c.discount_type,
              value: c.value,
              minOrder: c.min_order,
              active: c.active,
            })) || seed.coupons,
          reviews:
            revRes.data?.map((r) => ({
              id: r.id,
              name: r.name,
              location: r.location,
              occasion: r.occasion,
              rating: r.rating,
              quote: r.quote,
              createdAt: r.created_at,
            })) || seed.reviews,
          customInquiries: [],
          settings: setRes.data
            ? {
                brandName: setRes.data.brand_name,
                whatsappNumber: setRes.data.whatsapp_number,
                storePhone: setRes.data.store_phone,
                storeEmail: setRes.data.store_email,
                storeAddress: setRes.data.store_address,
                openingHours: setRes.data.opening_hours,
                deliveryFee: setRes.data.delivery_fee,
                freeDeliveryThreshold: setRes.data.free_delivery_threshold,
                promoBanner: setRes.data.promo_banner,
              }
            : seed.settings,
        };
      }
    } catch {
      // Fall back to demo backend
    }
  }
  return apiFetch<StoreData>('/api/admin/dashboard');
}

export async function seedSupabaseWithSampleData(): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Supabase is not connected.');
  const seed = createSeedData();
  const { error: prodErr } = await sb
    .from('products')
    .upsert(seed.products.map(toSupabaseProductRow));
  if (prodErr) throw new Error(`Products seed failed: ${prodErr.message}`);

  await sb.from('coupons').upsert(
    seed.coupons.map((c) => ({
      code: c.code,
      description: c.description,
      discount_type: c.discountType,
      value: c.value,
      min_order: c.minOrder,
      active: c.active,
    }))
  );

  await sb.from('store_settings').upsert({
    id: 1,
    brand_name: seed.settings.brandName,
    whatsapp_number: seed.settings.whatsappNumber,
    store_phone: seed.settings.storePhone,
    store_email: seed.settings.storeEmail,
    store_address: seed.settings.storeAddress,
    opening_hours: seed.settings.openingHours,
    delivery_fee: seed.settings.deliveryFee,
    free_delivery_threshold: seed.settings.freeDeliveryThreshold,
    promo_banner: seed.settings.promoBanner,
  });

  await sb.from('reviews').upsert(
    seed.reviews.map((r) => ({
      id: r.id,
      name: r.name,
      location: r.location,
      occasion: r.occasion,
      rating: r.rating,
      quote: r.quote,
    }))
  );
}

export async function uploadProductImage(file: File): Promise<string> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await sb.storage.from('product-images').upload(path, file, {
        upsert: true,
      });
      if (!error) {
        const { data } = sb.storage.from('product-images').getPublicUrl(path);
        if (data?.publicUrl) return data.publicUrl;
      }
    } catch {
      // Fall back to demo upload
    }
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const res = await apiFetch<{ url: string }>('/api/admin/upload', {
    method: 'POST',
    body: JSON.stringify({ filename: file.name, dataUrl }),
  });
  return res.url;
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const res = await apiFetch<{ product: Product }>('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const sb = getSupabaseClient();
  if (sb) {
    try {
      await sb.from('products').upsert(toSupabaseProductRow(res.product));
    } catch {
      // Ignore secondary sync errors
    }
  }
  return res.product;
}

export async function updateProduct(id: string, payload: Partial<Product>): Promise<Product> {
  const res = await apiFetch<{ product: Product }>(`/api/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  const sb = getSupabaseClient();
  if (sb) {
    try {
      await sb.from('products').upsert(toSupabaseProductRow(res.product));
    } catch {
      // Ignore secondary sync errors
    }
  }
  return res.product;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
  const sb = getSupabaseClient();
  if (sb) {
    try {
      await sb.from('products').delete().eq('id', id);
    } catch {
      // Ignore secondary sync errors
    }
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const res = await apiFetch<{ order: Order }>(`/api/admin/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  const sb = getSupabaseClient();
  if (sb) {
    try {
      await sb.from('orders').update({ status }).eq('id', id);
    } catch {
      // Ignore secondary sync errors
    }
  }
  return res.order;
}

export async function updateStoreSettings(settings: StoreSettings): Promise<StoreSettings> {
  const res = await apiFetch<{ settings: StoreSettings }>('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
  const sb = getSupabaseClient();
  if (sb) {
    try {
      await sb.from('store_settings').upsert({
        id: 1,
        brand_name: res.settings.brandName,
        whatsapp_number: res.settings.whatsappNumber,
        store_phone: res.settings.storePhone,
        store_email: res.settings.storeEmail,
        store_address: res.settings.storeAddress,
        opening_hours: res.settings.openingHours,
        delivery_fee: res.settings.deliveryFee,
        free_delivery_threshold: res.settings.freeDeliveryThreshold,
        promo_banner: res.settings.promoBanner,
      });
    } catch {
      // Ignore secondary sync errors
    }
  }
  return res.settings;
}

export async function saveCoupon(coupon: Coupon): Promise<Coupon> {
  const res = await apiFetch<{ coupon: Coupon }>('/api/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(coupon),
  });
  const sb = getSupabaseClient();
  if (sb) {
    try {
      await sb.from('coupons').upsert({
        code: res.coupon.code,
        description: res.coupon.description,
        discount_type: res.coupon.discountType,
        value: res.coupon.value,
        min_order: res.coupon.minOrder,
        active: res.coupon.active,
      });
    } catch {
      // Ignore secondary sync errors
    }
  }
  return res.coupon;
}

export async function deleteCoupon(code: string): Promise<void> {
  await apiFetch(`/api/admin/coupons/${encodeURIComponent(code)}`, { method: 'DELETE' });
  const sb = getSupabaseClient();
  if (sb) {
    try {
      await sb.from('coupons').delete().eq('code', code);
    } catch {
      // Ignore secondary sync errors
    }
  }
}
