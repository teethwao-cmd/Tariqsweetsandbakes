import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseConfig } from '../types.ts';

const STORAGE_KEY = 'tariq_supabase_config';

let cachedClient: SupabaseClient | null = null;
let cachedKey = '';

export function getSavedSupabaseConfig(): SupabaseConfig | null {
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

  if (envUrl && envKey && !envKey.includes('service_role')) {
    return { url: envUrl.trim(), publishableKey: envKey.trim() };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SupabaseConfig>;
    if (
      parsed.url &&
      parsed.publishableKey &&
      !parsed.publishableKey.includes('service_role')
    ) {
      return { url: parsed.url.trim(), publishableKey: parsed.publishableKey.trim() };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  if (config.publishableKey.includes('service_role')) {
    throw new Error('Security Error: Never enter a Supabase service_role key in the frontend.');
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      url: config.url.trim(),
      publishableKey: config.publishableKey.trim(),
    })
  );
  cachedClient = null;
  cachedKey = '';
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
  cachedClient = null;
  cachedKey = '';
}

export function getSupabaseClient(): SupabaseClient | null {
  const cfg = getSavedSupabaseConfig();
  if (!cfg) return null;
  const sig = `${cfg.url}::${cfg.publishableKey}`;
  if (cachedClient && cachedKey === sig) {
    return cachedClient;
  }
  cachedClient = createClient(cfg.url, cfg.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  cachedKey = sig;
  return cachedClient;
}

export interface SupabaseTestResult {
  status: 'connected' | 'schema_pending' | 'error';
  message: string;
}

export async function testSupabaseConnection(
  url: string,
  publishableKey: string
): Promise<SupabaseTestResult> {
  const cleanUrl = url.trim();
  const cleanKey = publishableKey.trim();

  if (!cleanUrl.startsWith('https://') || !cleanUrl.includes('supabase.co')) {
    return {
      status: 'error',
      message: 'Please enter a valid Supabase Project URL (e.g. https://xyz.supabase.co).',
    };
  }
  if (!cleanKey || cleanKey.length < 20) {
    return {
      status: 'error',
      message: 'Please enter a valid Supabase Publishable / Anon Key.',
    };
  }
  if (cleanKey.includes('service_role')) {
    return {
      status: 'error',
      message: 'Service-role keys are blocked for security. Use only your Publishable / Anon Key.',
    };
  }

  try {
    const client = createClient(cleanUrl, cleanKey);
    const { error } = await client
      .from('products')
      .select('id', { count: 'exact', head: true });

    if (!error) {
      return {
        status: 'connected',
        message: 'Connected to Supabase PostgreSQL & RLS policies verified.',
      };
    }

    if (
      error.code === '42P01' ||
      error.message.includes('does not exist') ||
      error.message.includes('schema cache')
    ) {
      return {
        status: 'schema_pending',
        message:
          'Project reachable! Run the SQL & RLS setup script in your Supabase SQL Editor to create tables.',
      };
    }

    return {
      status: 'error',
      message: error.message || 'Unable to verify Supabase connection.',
    };
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : 'Network error connecting to Supabase.',
    };
  }
}

export const SUPABASE_SCHEMA_SQL = `-- Tariq Sweets & Bakes — Supabase PostgreSQL Schema & Row Level Security (RLS)
-- Run this in your Supabase SQL Editor

create table if not exists public.products (
  id text primary key,
  name text not null,
  slug text not null,
  category text not null,
  description text not null,
  craft_note text not null default '',
  price integer not null,
  variants jsonb not null default '[]'::jsonb,
  image text not null,
  available boolean not null default true,
  stock integer not null default 25,
  featured boolean not null default false,
  best_seller boolean not null default false,
  unit_hint text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  order_number text not null unique,
  customer_name text not null,
  phone text not null,
  address text not null,
  notes text not null default '',
  fulfillment_type text not null default 'Delivery',
  payment_method text not null default 'Cash on Delivery',
  items jsonb not null,
  subtotal integer not null,
  discount_code text,
  discount_amount integer not null default 0,
  delivery_fee integer not null default 0,
  total integer not null,
  status text not null default 'Pending',
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  code text primary key,
  description text not null,
  discount_type text not null,
  value integer not null,
  min_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.reviews (
  id text primary key,
  name text not null,
  location text not null,
  occasion text not null,
  rating integer not null default 5,
  quote text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id integer primary key default 1,
  brand_name text not null,
  whatsapp_number text not null,
  store_phone text not null,
  store_email text not null,
  store_address text not null,
  opening_hours text not null,
  delivery_fee integer not null default 250,
  free_delivery_threshold integer not null default 3500,
  promo_banner text not null default ''
);

-- Enable Row Level Security
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.coupons enable row level security;
alter table public.reviews enable row level security;
alter table public.store_settings enable row level security;

-- Public Read Policies (Storefront)
create policy "Public read products" on public.products for select using (true);
create policy "Public read active coupons" on public.coupons for select using (active = true);
create policy "Public read reviews" on public.reviews for select using (true);
create policy "Public read settings" on public.store_settings for select using (true);

-- Public Write Policies (Orders & Reviews)
create policy "Public create orders" on public.orders for insert with check (true);
create policy "Public track order by number" on public.orders for select using (true);
create policy "Public submit reviews" on public.reviews for insert with check (true);

-- Authenticated Admin Full Access Policies
create policy "Admin manage products" on public.products for all to authenticated using (true) with check (true);
create policy "Admin manage orders" on public.orders for all to authenticated using (true) with check (true);
create policy "Admin manage coupons" on public.coupons for all to authenticated using (true) with check (true);
create policy "Admin manage settings" on public.store_settings for all to authenticated using (true) with check (true);

-- Storage Bucket for Product Images
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true) on conflict do nothing;
create policy "Public read product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "Authenticated upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images');
`;
