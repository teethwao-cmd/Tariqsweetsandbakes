import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { createSeedData } from './src/data/seedCatalog.ts';
import { PRODUCT_CATEGORIES } from './src/types.ts';
import type {
  Coupon,
  CustomOrderInquiry,
  FulfillmentType,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  Review,
  StoreData,
  StoreSettings,
} from './src/types.ts';
import { buildWhatsAppOrderMessage, buildWhatsAppUrl } from './src/utils/formatters.ts';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), '.data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'tariq2026';
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update(`tariq-sweets-${ADMIN_PASSWORD}`).digest('hex');

const VALID_ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

function ensureStoreLoaded(): StoreData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const seed = createSeedData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    if (!Array.isArray(parsed.products) || !parsed.settings) {
      throw new Error('Invalid store format');
    }
    const seed = createSeedData();
    return {
      products: parsed.products,
      coupons: Array.isArray(parsed.coupons) ? parsed.coupons : seed.coupons,
      orders: Array.isArray(parsed.orders) ? parsed.orders : seed.orders,
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : seed.reviews,
      customInquiries: Array.isArray(parsed.customInquiries) ? parsed.customInquiries : [],
      settings: parsed.settings,
    };
  } catch {
    const seed = createSeedData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
}

function saveStore(data: StoreData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function signAdminToken(username: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: username,
      role: 'admin',
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string | undefined): { sub: string; role: string } | null {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub: string;
      role: string;
      exp: number;
    };
    if (decoded.exp < Date.now() || decoded.role !== 'admin') return null;
    return { sub: decoded.sub, role: decoded.role };
  } catch {
    return null;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
  const session = verifyAdminToken(token);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized. Please sign in as admin.' });
    return;
  }
  next();
}

function calculateCouponDiscount(
  coupon: Coupon | undefined,
  subtotal: number
): { valid: boolean; discountAmount: number; message: string } {
  if (!coupon || !coupon.active) {
    return { valid: false, discountAmount: 0, message: 'Coupon code is invalid or expired.' };
  }
  if (subtotal < coupon.minOrder) {
    return {
      valid: false,
      discountAmount: 0,
      message: `Minimum order of PKR ${coupon.minOrder.toLocaleString('en-PK')} required for ${coupon.code}.`,
    };
  }
  const discountAmount =
    coupon.discountType === 'percent'
      ? Math.round((subtotal * coupon.value) / 100)
      : Math.min(subtotal, coupon.value);
  return {
    valid: true,
    discountAmount,
    message: `${coupon.code} applied (-PKR ${discountAmount.toLocaleString('en-PK')})`,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '8mb' }));

  ensureStoreLoaded();

  // Serve generated images & uploaded admin images reliably in dev and prod
  app.use(
    '/src/assets/images',
    express.static(path.join(process.cwd(), 'src', 'assets', 'images'))
  );
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Public storefront bootstrap
  app.get('/api/bootstrap', (_req, res) => {
    const store = ensureStoreLoaded();
    res.json({
      products: store.products,
      settings: store.settings,
      activeCoupons: store.coupons.filter((c) => c.active),
      reviews: store.reviews,
    });
  });

  app.get('/api/products', (_req, res) => {
    const store = ensureStoreLoaded();
    res.json({ products: store.products });
  });

  // Order tracking by orderNumber (e.g. TSB-1042)
  app.get('/api/orders/track/:orderNumber', (req, res) => {
    const query = (req.params.orderNumber || '').trim().toUpperCase();
    const store = ensureStoreLoaded();
    const order = store.orders.find(
      (o) => o.orderNumber.toUpperCase() === query || o.id.toUpperCase() === query
    );
    if (!order) {
      res.status(404).json({ error: `No order found matching "${query}".` });
      return;
    }
    res.json({ order });
  });

  // Customer reviews
  app.post('/api/reviews', (req, res) => {
    const body = req.body as Partial<Review>;
    const name = (body.name || '').trim();
    const quote = (body.quote || '').trim();
    if (!name || !quote) {
      res.status(400).json({ error: 'Name and review text are required.' });
      return;
    }
    const store = ensureStoreLoaded();
    const review: Review = {
      id: `rev-${Date.now()}`,
      name,
      location: (body.location || 'Lahore').trim(),
      occasion: (body.occasion || 'Verified Customer').trim(),
      rating: Math.min(5, Math.max(1, Math.round(Number(body.rating) || 5))),
      quote,
      createdAt: new Date().toISOString(),
    };
    store.reviews.unshift(review);
    saveStore(store);
    res.status(201).json({ review });
  });

  // Custom cake / wedding / event inquiry
  app.post('/api/custom-orders', (req, res) => {
    const body = req.body as Partial<CustomOrderInquiry>;
    const customerName = (body.customerName || '').trim();
    const phone = (body.phone || '').trim();
    if (!customerName || !phone) {
      res.status(400).json({ error: 'Customer name and phone number are required.' });
      return;
    }
    const store = ensureStoreLoaded();
    const inquiry: CustomOrderInquiry = {
      id: `inq-${Date.now()}`,
      customerName,
      phone,
      eventType: body.eventType || 'Birthday Cake',
      eventDate: (body.eventDate || '').trim(),
      servingsOrBoxes: (body.servingsOrBoxes || '').trim(),
      flavorOrSelection: (body.flavorOrSelection || '').trim(),
      details: (body.details || '').trim(),
      createdAt: new Date().toISOString(),
    };
    store.customInquiries.unshift(inquiry);
    saveStore(store);

    const msg = [
      `*${store.settings.brandName.toUpperCase()} — CUSTOM EVENT INQUIRY*`,
      `Ref: ${inquiry.id.toUpperCase()}`,
      `Name: ${inquiry.customerName}`,
      `Phone: ${inquiry.phone}`,
      `Occasion: ${inquiry.eventType}`,
      inquiry.eventDate ? `Event Date: ${inquiry.eventDate}` : '',
      inquiry.servingsOrBoxes ? `Size / Quantity: ${inquiry.servingsOrBoxes}` : '',
      inquiry.flavorOrSelection ? `Flavor / Selection: ${inquiry.flavorOrSelection}` : '',
      inquiry.details ? `Details: ${inquiry.details}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    res.status(201).json({
      inquiry,
      whatsappUrl: buildWhatsAppUrl(store.settings.whatsappNumber, msg),
    });
  });

  app.post('/api/coupons/validate', (req, res) => {
    const { code, subtotal } = req.body as { code?: string; subtotal?: number };
    const cleanCode = (code || '').trim().toUpperCase();
    const numericSubtotal = Number(subtotal) || 0;
    const store = ensureStoreLoaded();
    const coupon = store.coupons.find((c) => c.code.toUpperCase() === cleanCode);
    const result = calculateCouponDiscount(coupon, numericSubtotal);
    if (!result.valid) {
      res.status(400).json(result);
      return;
    }
    res.json({ ...result, coupon });
  });

  app.post('/api/orders', (req, res) => {
    const body = req.body as {
      customerName?: string;
      phone?: string;
      address?: string;
      notes?: string;
      fulfillmentType?: FulfillmentType;
      paymentMethod?: 'Cash on Delivery' | 'WhatsApp Order (COD)' | 'Pay at Pickup';
      discountCode?: string;
      items?: Array<{
        productId: string;
        variantLabel: string;
        quantity: number;
      }>;
    };

    const customerName = (body.customerName || '').trim();
    const phone = (body.phone || '').trim();
    const fulfillmentType: FulfillmentType =
      body.fulfillmentType === 'Store Pickup' ? 'Store Pickup' : 'Delivery';
    const store = ensureStoreLoaded();
    const address =
      fulfillmentType === 'Store Pickup'
        ? store.settings.storeAddress
        : (body.address || '').trim();
    const notes = (body.notes || '').trim();
    const paymentMethod =
      body.paymentMethod === 'WhatsApp Order (COD)'
        ? 'WhatsApp Order (COD)'
        : fulfillmentType === 'Store Pickup' && body.paymentMethod === 'Pay at Pickup'
        ? 'Pay at Pickup'
        : 'Cash on Delivery';

    if (!customerName || !phone || (fulfillmentType === 'Delivery' && !address)) {
      res.status(400).json({
        error: 'Customer name, phone number, and delivery address are required.',
      });
      return;
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ error: 'Your cart is empty.' });
      return;
    }

    const resolvedItems = [];

    for (const reqItem of body.items) {
      const product = store.products.find((p) => p.id === reqItem.productId);
      if (!product || !product.available || product.stock <= 0) {
        res.status(400).json({
          error: `Product "${product?.name || reqItem.productId}" is currently unavailable.`,
        });
        return;
      }
      const variant =
        product.variants.find((v) => v.label === reqItem.variantLabel) ||
        product.variants[0];
      const quantity = Math.max(1, Math.min(99, Math.floor(Number(reqItem.quantity) || 1)));
      const unitPrice = variant ? variant.price : product.price;
      resolvedItems.push({
        productId: product.id,
        name: product.name,
        variantLabel: variant ? variant.label : 'Standard',
        unitPrice,
        quantity,
        lineTotal: unitPrice * quantity,
      });
    }

    const subtotal = resolvedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    let discountAmount = 0;
    let appliedCode: string | undefined;

    if (body.discountCode && body.discountCode.trim()) {
      const cleanCode = body.discountCode.trim().toUpperCase();
      const coupon = store.coupons.find((c) => c.code.toUpperCase() === cleanCode);
      const result = calculateCouponDiscount(coupon, subtotal);
      if (result.valid) {
        discountAmount = result.discountAmount;
        appliedCode = coupon?.code;
      }
    }

    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const deliveryFee =
      fulfillmentType === 'Store Pickup' || afterDiscount >= store.settings.freeDeliveryThreshold
        ? 0
        : store.settings.deliveryFee;
    const total = afterDiscount + deliveryFee;

    const nextSeq = 1043 + store.orders.length;
    const order: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `TSB-${nextSeq}`,
      customerName,
      phone,
      address,
      notes,
      fulfillmentType,
      paymentMethod,
      items: resolvedItems,
      subtotal,
      discountCode: appliedCode,
      discountAmount,
      deliveryFee,
      total,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    // Decrement stock in Demo Mode
    for (const item of resolvedItems) {
      const pIdx = store.products.findIndex((p) => p.id === item.productId);
      if (pIdx >= 0) {
        store.products[pIdx].stock = Math.max(0, store.products[pIdx].stock - item.quantity);
      }
    }

    store.orders.unshift(order);
    saveStore(store);

    const whatsappMessage = buildWhatsAppOrderMessage(order, store.settings);
    const whatsappUrl = buildWhatsAppUrl(store.settings.whatsappNumber, whatsappMessage);

    res.status(201).json({ order, whatsappMessage, whatsappUrl });
  });

  // Admin authentication
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string };
    if (
      (username || '').trim() === ADMIN_USERNAME &&
      (password || '') === ADMIN_PASSWORD
    ) {
      const token = signAdminToken(ADMIN_USERNAME);
      res.json({ token, admin: { username: ADMIN_USERNAME } });
      return;
    }
    res.status(401).json({ error: 'Invalid admin username or password.' });
  });

  app.get('/api/admin/me', requireAdmin, (_req, res) => {
    res.json({ admin: { username: ADMIN_USERNAME } });
  });

  // Admin dashboard data
  app.get('/api/admin/dashboard', requireAdmin, (_req, res) => {
    const store = ensureStoreLoaded();
    res.json(store);
  });

  // Admin image upload (base64 data URI -> local uploads file)
  app.post('/api/admin/upload', requireAdmin, (req, res) => {
    const { filename, dataUrl } = req.body as { filename?: string; dataUrl?: string };
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      res.status(400).json({ error: 'Valid image data URL is required.' });
      return;
    }
    const match = /^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/.exec(dataUrl);
    if (!match) {
      res.status(400).json({ error: 'Unsupported image encoding.' });
      return;
    }
    const ext = match[1].replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) || 'png';
    const baseName = slugify((filename || 'product').replace(/\.[^.]+$/, '')) || 'product';
    const outName = `${baseName}-${Date.now()}.${ext}`;
    const outPath = path.join(UPLOADS_DIR, outName);
    fs.writeFileSync(outPath, Buffer.from(match[2], 'base64'));
    res.status(201).json({ url: `/uploads/${outName}` });
  });

  // Admin product CRUD
  app.post('/api/admin/products', requireAdmin, (req, res) => {
    const body = req.body as Partial<Product>;
    const name = (body.name || '').trim();
    if (!name) {
      res.status(400).json({ error: 'Product name is required.' });
      return;
    }
    const category = PRODUCT_CATEGORIES.includes(body.category as ProductCategory)
      ? (body.category as ProductCategory)
      : 'Mithai';

    const variants =
      Array.isArray(body.variants) && body.variants.length > 0
        ? body.variants
            .filter((v) => v && v.label && Number(v.price) > 0)
            .map((v) => ({ label: String(v.label).trim(), price: Math.round(Number(v.price)) }))
        : [{ label: '500g', price: Math.max(100, Math.round(Number(body.price) || 800)) }];

    const basePrice = variants[0]?.price || Math.max(100, Math.round(Number(body.price) || 800));
    const store = ensureStoreLoaded();
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name,
      slug: slugify(name),
      category,
      description: (body.description || 'Freshly prepared daily with authentic ingredients.').trim(),
      craftNote: (
        body.craftNote || 'Prepared in small artisanal batches at Tariq Sweets & Bakes.'
      ).trim(),
      price: basePrice,
      variants,
      image:
        (body.image || '').trim() || '/src/assets/images/sweet_barfi_laddu_1794549426888.jpg',
      available: body.available !== false,
      stock: Math.max(0, Math.round(Number(body.stock ?? 25))),
      featured: Boolean(body.featured),
      bestSeller: Boolean(body.bestSeller),
      unitHint: (body.unitHint || `Starts at ${variants[0]?.label || 'Standard'}`).trim(),
    };

    store.products.unshift(newProduct);
    saveStore(store);
    res.status(201).json({ product: newProduct });
  });

  app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const body = req.body as Partial<Product>;
    const store = ensureStoreLoaded();
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    const current = store.products[idx];
    const variants =
      Array.isArray(body.variants) && body.variants.length > 0
        ? body.variants
            .filter((v) => v && v.label && Number(v.price) > 0)
            .map((v) => ({ label: String(v.label).trim(), price: Math.round(Number(v.price)) }))
        : current.variants;

    const updated: Product = {
      ...current,
      name: body.name !== undefined ? body.name.trim() || current.name : current.name,
      slug: body.name !== undefined ? slugify(body.name) || current.slug : current.slug,
      category:
        body.category && PRODUCT_CATEGORIES.includes(body.category)
          ? body.category
          : current.category,
      description:
        body.description !== undefined ? body.description.trim() : current.description,
      craftNote: body.craftNote !== undefined ? body.craftNote.trim() : current.craftNote,
      variants,
      price:
        variants[0]?.price ??
        (body.price !== undefined ? Math.round(Number(body.price)) : current.price),
      image: body.image !== undefined ? body.image.trim() || current.image : current.image,
      available: body.available !== undefined ? Boolean(body.available) : current.available,
      stock:
        body.stock !== undefined ? Math.max(0, Math.round(Number(body.stock))) : current.stock,
      featured: body.featured !== undefined ? Boolean(body.featured) : current.featured,
      bestSeller: body.bestSeller !== undefined ? Boolean(body.bestSeller) : current.bestSeller,
      unitHint: body.unitHint !== undefined ? body.unitHint.trim() : current.unitHint,
    };

    store.products[idx] = updated;
    saveStore(store);
    res.json({ product: updated });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const store = ensureStoreLoaded();
    const nextProducts = store.products.filter((p) => p.id !== id);
    if (nextProducts.length === store.products.length) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    store.products = nextProducts;
    saveStore(store);
    res.json({ ok: true });
  });

  // Admin order status updates
  app.patch('/api/admin/orders/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body as { status?: OrderStatus };
    if (!status || !VALID_ORDER_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Invalid order status.' });
      return;
    }
    const store = ensureStoreLoaded();
    const idx = store.orders.findIndex((o) => o.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    store.orders[idx] = { ...store.orders[idx], status };
    saveStore(store);
    res.json({ order: store.orders[idx] });
  });

  // Admin settings
  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    const body = req.body as Partial<StoreSettings>;
    const store = ensureStoreLoaded();
    const updated: StoreSettings = {
      ...store.settings,
      brandName: body.brandName?.trim() || store.settings.brandName,
      whatsappNumber: body.whatsappNumber?.trim() || store.settings.whatsappNumber,
      storePhone: body.storePhone?.trim() || store.settings.storePhone,
      storeEmail: body.storeEmail?.trim() || store.settings.storeEmail,
      storeAddress: body.storeAddress?.trim() || store.settings.storeAddress,
      openingHours: body.openingHours?.trim() || store.settings.openingHours,
      deliveryFee:
        body.deliveryFee !== undefined
          ? Math.max(0, Math.round(Number(body.deliveryFee)))
          : store.settings.deliveryFee,
      freeDeliveryThreshold:
        body.freeDeliveryThreshold !== undefined
          ? Math.max(0, Math.round(Number(body.freeDeliveryThreshold)))
          : store.settings.freeDeliveryThreshold,
      promoBanner:
        body.promoBanner !== undefined ? body.promoBanner.trim() : store.settings.promoBanner,
    };
    store.settings = updated;
    saveStore(store);
    res.json({ settings: updated });
  });

  // Admin coupons
  app.post('/api/admin/coupons', requireAdmin, (req, res) => {
    const body = req.body as Partial<Coupon>;
    const code = (body.code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!code) {
      res.status(400).json({ error: 'Valid coupon code is required.' });
      return;
    }
    const store = ensureStoreLoaded();
    const coupon: Coupon = {
      code,
      description: (body.description || 'Special discount coupon').trim(),
      discountType: body.discountType === 'fixed' ? 'fixed' : 'percent',
      value: Math.max(1, Math.round(Number(body.value) || 10)),
      minOrder: Math.max(0, Math.round(Number(body.minOrder) || 0)),
      active: body.active !== false,
    };
    const existingIdx = store.coupons.findIndex((c) => c.code === code);
    if (existingIdx >= 0) {
      store.coupons[existingIdx] = coupon;
    } else {
      store.coupons.unshift(coupon);
    }
    saveStore(store);
    res.status(201).json({ coupon });
  });

  app.delete('/api/admin/coupons/:code', requireAdmin, (req, res) => {
    const code = req.params.code.toUpperCase();
    const store = ensureStoreLoaded();
    store.coupons = store.coupons.filter((c) => c.code.toUpperCase() !== code);
    saveStore(store);
    res.json({ ok: true });
  });

  // Vite middleware in development, static dist in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tariq Sweets & Bakes server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
