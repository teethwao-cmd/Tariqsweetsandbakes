/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Clock,
  Database,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { BrandLogo } from './components/BrandLogo.tsx';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer.tsx';
import { CustomOrderModal } from './components/CustomOrderModal.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { ResilientImage } from './components/ResilientImage.tsx';
import { SupabaseConnectModal } from './components/SupabaseConnectModal.tsx';
import { TrackOrderModal } from './components/TrackOrderModal.tsx';
import { createSeedData, IMAGE_ASSETS } from './data/seedCatalog.ts';
import { getSavedSupabaseConfig } from './lib/supabaseClient.ts';
import { fetchBootstrap, submitReview } from './services/api.ts';
import {
  PRODUCT_CATEGORIES,
  type CartItem,
  type Coupon,
  type Order,
  type Product,
  type ProductCategory,
  type Review,
  type StoreSettings,
} from './types.ts';
import { buildWhatsAppUrl, formatPKR } from './utils/formatters.ts';

const CART_STORAGE_KEY = 'tariq_sweets_cart';
const WISHLIST_STORAGE_KEY = 'tariq_sweets_wishlist';

type SpotlightFilter = 'all' | 'featured' | 'bestsellers' | 'wishlist';

export default function App() {
  const seed = useMemo(() => createSeedData(), []);
  const [products, setProducts] = useState<Product[]>(seed.products);
  const [settings, setSettings] = useState<StoreSettings>(seed.settings);
  const [activeCoupons, setActiveCoupons] = useState<Coupon[]>(seed.coupons);
  const [reviews, setReviews] = useState<Review[]>(seed.reviews);
  const [loadingStore, setLoadingStore] = useState(true);

  const [view, setView] = useState<'store' | 'admin'>('store');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPromoBanner, setShowPromoBanner] = useState(true);

  // Filters & search
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  const [spotlightFilter, setSpotlightFilter] = useState<SpotlightFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive modals & drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [customOrderOpen, setCustomOrderOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(Boolean(getSavedSupabaseConfig()));
  const [recentOrderNumber, setRecentOrderNumber] = useState<string | undefined>(undefined);
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Review submission state
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [revName, setRevName] = useState('');
  const [revLocation, setRevLocation] = useState('');
  const [revOccasion, setRevOccasion] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revQuote, setRevQuote] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Persistent Cart & Wishlist
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const refreshStore = async () => {
    try {
      const data = await fetchBootstrap();
      setProducts(data.products);
      setSettings(data.settings);
      setActiveCoupons(data.activeCoupons);
      if (data.reviews && data.reviews.length > 0) {
        setReviews(data.reviews);
      }
    } catch {
      // Retain seed data gracefully
    } finally {
      setLoadingStore(false);
    }
  };

  useEffect(() => {
    void refreshStore();
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleAddToCart = (
    product: Product,
    variantLabel: string,
    unitPrice: number,
    quantity = 1
  ) => {
    const key = `${product.id}::${variantLabel}`;
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.key === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          category: product.category,
          image: product.image,
          variantLabel,
          unitPrice,
          quantity,
        },
      ];
    });
  };

  const handleUpdateQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  };

  const handleOrderCreated = (order: Order) => {
    setRecentOrderNumber(order.orderNumber);
    void refreshStore();
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revName.trim() || !revQuote.trim()) return;
    setSubmittingReview(true);
    try {
      const created = await submitReview({
        name: revName.trim(),
        location: revLocation.trim() || 'Lahore',
        occasion: revOccasion.trim() || 'Celebration Order',
        rating: revRating,
        quote: revQuote.trim(),
      });
      setReviews((prev) => [created, ...prev]);
      setRevName('');
      setRevLocation('');
      setRevOccasion('');
      setRevQuote('');
      setReviewFormOpen(false);
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (spotlightFilter === 'featured' && !p.featured) return false;
      if (spotlightFilter === 'bestsellers' && !p.bestSeller) return false;
      if (spotlightFilter === 'wishlist' && !wishlist.includes(p.id)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [products, selectedCategory, spotlightFilter, wishlist, searchQuery]);

  const totalBagCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const scrollToSection = (id: string) => {
    setView('store');
    setMobileMenuOpen(false);
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 40);
  };

  const floatingWhatsAppHref = buildWhatsAppUrl(
    settings.whatsappNumber,
    `Assalam-o-Alaikum ${settings.brandName}, I would like to place an order or inquire about your menu.`
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF9] text-[#2C1A12]">
      {/* Slim Dismissible Promo Banner (<= 36px) */}
      {showPromoBanner && settings.promoBanner && view === 'store' && (
        <div className="bg-[#2C1A12] text-[#FAF5EB] px-4 h-9 flex items-center justify-center relative text-xs">
          <p className="truncate pr-8 text-center font-medium">{settings.promoBanner}</p>
          <button
            type="button"
            onClick={() => setShowPromoBanner(false)}
            aria-label="Dismiss announcement"
            className="absolute right-3 p-1 text-[#FAF5EB]/80 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Bar Contract: 3 Zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#2C1A12]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line brand wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('top');
            }}
            className="whitespace-nowrap shrink-0"
          >
            <BrandLogo />
          </a>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#5C4335]">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('top');
              }}
              className="hover:text-[#2C1A12] hover:underline underline-offset-8 decoration-[#D4941A] transition-colors whitespace-nowrap shrink-0"
            >
              Home
            </a>
            <a
              href="#menu"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('menu');
              }}
              className="hover:text-[#2C1A12] hover:underline underline-offset-8 decoration-[#D4941A] transition-colors whitespace-nowrap shrink-0"
            >
              Menu
            </a>
            <button
              type="button"
              onClick={() => setCustomOrderOpen(true)}
              className="hover:text-[#2C1A12] hover:underline underline-offset-8 decoration-[#D4941A] transition-colors whitespace-nowrap shrink-0"
            >
              Custom Orders
            </button>
            <button
              type="button"
              onClick={() => setTrackModalOpen(true)}
              className="hover:text-[#2C1A12] hover:underline underline-offset-8 decoration-[#D4941A] transition-colors whitespace-nowrap shrink-0"
            >
              Track Order
            </button>
            <button
              type="button"
              onClick={() => {
                setView('admin');
                setMobileMenuOpen(false);
              }}
              className={`hover:text-[#2C1A12] hover:underline underline-offset-8 decoration-[#D4941A] transition-colors whitespace-nowrap shrink-0 ${
                view === 'admin' ? 'text-[#2C1A12] font-semibold underline' : ''
              }`}
            >
              Admin
            </button>
          </nav>

          {/* Zone 3: 1 primary action (plus mobile menu toggle on small screens) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-[#2C1A12] text-[#FFFDF9] text-xs font-semibold hover:bg-[#44291D] transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4 text-[#E5A93B]" />
              <span>Bag</span>
              <span
                className="tabular-nums text-[#E5A93B]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                ({totalBagCount})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="Toggle navigation menu"
              className="lg:hidden w-10 h-10 rounded-xl border border-[#2C1A12]/15 flex items-center justify-center text-[#2C1A12]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#2C1A12]/10 bg-[#FFFDF9] px-4 py-3 space-y-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => scrollToSection('top')}
              className="block w-full text-left py-2.5 px-3 rounded-lg hover:bg-[#FAF5EB]"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('menu')}
              className="block w-full text-left py-2.5 px-3 rounded-lg hover:bg-[#FAF5EB]"
            >
              Explore Menu
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setCustomOrderOpen(true);
              }}
              className="block w-full text-left py-2.5 px-3 rounded-lg hover:bg-[#FAF5EB]"
            >
              Custom &amp; Wedding Orders
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setTrackModalOpen(true);
              }}
              className="block w-full text-left py-2.5 px-3 rounded-lg hover:bg-[#FAF5EB]"
            >
              Track Order
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setView('admin');
              }}
              className="block w-full text-left py-2.5 px-3 rounded-lg hover:bg-[#FAF5EB]"
            >
              Owner Admin Portal
            </button>
          </div>
        )}
      </header>

      {view === 'admin' ? (
        <AdminDashboard
          onExitAdmin={() => setView('store')}
          onStoreUpdated={() => void refreshStore()}
          onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
          supabaseConnected={supabaseConnected}
        />
      ) : (
        <main id="top" className="flex-1">
          {/* SECTION 1: HERO */}
          <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF5EB] to-[#FFFDF9] border-b border-[#2C1A12]/8">
            {/* Subtle floating golden decorative accents */}
            <motion.div
              aria-hidden="true"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="hidden lg:block absolute top-16 left-8 w-16 h-16 rounded-full border border-[#D4941A]/25 pointer-events-none"
            />
            <motion.div
              aria-hidden="true"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
              className="hidden lg:block absolute bottom-24 left-1/3 w-8 h-8 rotate-45 border border-[#D96B27]/20 pointer-events-none"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
                {/* Left Editorial Copy */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="lg:col-span-5 flex flex-col justify-center space-y-6"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9A650B]">
                    Artisanal Pakistani Mithai &amp; Patisserie · Est. Gulberg Lahore
                  </p>

                  <h1
                    className="font-bold text-[#2C1A12] leading-[1.08] tracking-tight"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(2.25rem, 4vw, 3.65rem)',
                      textWrap: 'balance',
                    }}
                  >
                    Bringing Sweetness to Every Celebration.
                  </h1>

                  <p className="text-base sm:text-lg text-[#5C4335] leading-relaxed max-w-xl">
                    Freshly Made Sweets, Delicious Cakes &amp; Bakery Specialties. Crafted every
                    dawn with pure desi ghee, Kashmiri saffron, and single-origin Belgian cocoa.
                  </p>

                  <div className="flex flex-wrap items-center gap-3.5 pt-1">
                    <button
                      type="button"
                      onClick={() => scrollToSection('menu')}
                      className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-[#2C1A12] text-[#FFFDF9] text-sm font-semibold hover:bg-[#44291D] transition-colors shadow-sm whitespace-nowrap"
                    >
                      <span>Shop Now</span>
                      <ArrowRight className="w-4 h-4 text-[#E5A93B]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('All');
                        setSpotlightFilter('all');
                        scrollToSection('menu');
                      }}
                      className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-white border border-[#2C1A12]/20 text-[#2C1A12] text-sm font-semibold hover:bg-[#FAF5EB] transition-colors whitespace-nowrap"
                    >
                      <span>Explore Menu</span>
                    </button>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B4E3D]">
                    <span>Cash on Delivery &amp; Store Pickup</span>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={() => setCustomOrderOpen(true)}
                      className="font-semibold text-[#9A650B] hover:underline"
                    >
                      Book Custom Wedding &amp; Birthday Cakes
                    </button>
                  </div>
                </motion.div>

                {/* Right Hero Photography */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="lg:col-span-7"
                >
                  <div className="relative h-full min-h-[300px] sm:min-h-[420px] rounded-2xl overflow-hidden border border-[#2C1A12]/10 shadow-[0_20px_50px_rgba(44,26,18,0.12)] bg-[#FAF5EB]">
                    <ResilientImage
                      src={IMAGE_ASSETS.heroSpread}
                      alt="Tariq Sweets & Bakes festive spread of gulab jamun, pistachio barfi, saffron ras malai, and dark chocolate truffle cake"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              </div>

              {/* 4-Column Promise Strip below hero split */}
              <div className="mt-10 pt-8 border-t border-[#2C1A12]/10 grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Pure Desi Ghee & Khoya',
                    detail: 'Slow-reduced buffalo milk mithai crafted fresh daily',
                  },
                  {
                    title: 'Artisan Bakery Ovens',
                    detail: 'Belgian chocolate cakes, biscuits, cookies & warm bread',
                  },
                  {
                    title: 'Same-Day Dispatch',
                    detail: `Complimentary delivery over ${formatPKR(settings.freeDeliveryThreshold)}`,
                  },
                  {
                    title: 'WhatsApp & COD Ready',
                    detail: 'Instant formatted WhatsApp confirmation on checkout',
                  },
                ].map((item) => (
                  <div key={item.title} className="space-y-1">
                    <p
                      className="text-sm font-bold text-[#2C1A12]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs text-[#6B4E3D] leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 2: MENU, FEATURED, BEST SELLERS & SPECIAL OFFERS */}
          <section id="menu" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A650B]">
                  Curated Daily Selection
                </p>
                <h2
                  className="mt-1 text-3xl sm:text-4xl font-bold text-[#2C1A12]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Our Sweets &amp; Bakery Menu
                </h2>
              </div>

              {/* Search & Spotlight Toggles */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 text-[#6B4E3D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search gulab jamun, cake..."
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-[#2C1A12]/15 text-sm placeholder:text-[#6B4E3D]/60 focus:outline-none focus:border-[#D4941A]"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FAF5EB] border border-[#2C1A12]/10 overflow-x-auto">
                  {(
                    [
                      { id: 'all', label: 'All Menu' },
                      { id: 'featured', label: 'Featured' },
                      { id: 'bestsellers', label: 'Best Sellers' },
                      { id: 'wishlist', label: `Saved (${wishlist.length})` },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSpotlightFilter(f.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                        spotlightFilter === f.id
                          ? 'bg-white text-[#2C1A12] shadow-xs'
                          : 'text-[#6B4E3D] hover:text-[#2C1A12]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Filter Bar (All 10 Categories) */}
            <div className="flex flex-wrap gap-2 pb-2 border-b border-[#2C1A12]/10">
              <button
                type="button"
                onClick={() => setSelectedCategory('All')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === 'All'
                    ? 'bg-[#2C1A12] text-[#FFFDF9]'
                    : 'bg-[#FAF5EB] text-[#5C4335] hover:bg-[#F3E9D4]'
                }`}
              >
                All Categories ({products.length})
              </button>
              {PRODUCT_CATEGORIES.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-[#2C1A12] text-[#FFFDF9]'
                        : 'bg-[#FAF5EB] text-[#5C4335] hover:bg-[#F3E9D4]'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* Product Grid */}
            {loadingStore ? (
              <div className="py-16 text-center text-sm text-[#6B4E3D]">
                Preparing fresh catalog...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-[#FAF5EB] border border-[#2C1A12]/10 space-y-3">
                <p
                  className="text-lg font-semibold text-[#2C1A12]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {spotlightFilter === 'wishlist'
                    ? 'No saved items in your wishlist yet'
                    : 'No items match your current filter'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSpotlightFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#2C1A12] text-[#FFFDF9] text-xs font-semibold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isWishlisted={wishlist.includes(product.id)}
                    onToggleWishlist={handleToggleWishlist}
                    onSelectProduct={(p) => setSelectedProduct(p)}
                    onQuickAdd={(p, label, price) => handleAddToCart(p, label, price, 1)}
                  />
                ))}
              </div>
            )}

            {/* Special Offers & Coupons Strip */}
            {activeCoupons.length > 0 && (
              <div className="mt-10 rounded-2xl bg-[#FAF5EB] border border-[#D4941A]/35 p-6 sm:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A650B]">
                      Celebration Savings
                    </p>
                    <h3
                      className="text-2xl font-bold text-[#2C1A12] mt-0.5"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Special Offers &amp; Gift Box Codes
                    </h3>
                  </div>
                  <p className="text-xs text-[#5C4335]">
                    Apply any code inside your Order Bag before checkout.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {activeCoupons.slice(0, 3).map((coupon) => (
                    <div
                      key={coupon.code}
                      className="rounded-xl bg-white border border-[#2C1A12]/10 p-4 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p
                          className="text-sm font-bold text-[#2C1A12]"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {coupon.code}
                        </p>
                        <p className="text-xs text-[#6B4E3D] mt-0.5">{coupon.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(coupon.code);
                            setCopiedCoupon(coupon.code);
                            window.setTimeout(() => setCopiedCoupon(null), 1600);
                          } catch {
                            // Ignore
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#FAF5EB] border border-[#2C1A12]/15 text-xs font-semibold text-[#2C1A12] hover:bg-[#F3E9D4] whitespace-nowrap shrink-0"
                      >
                        {copiedCoupon === coupon.code ? 'Copied' : 'Copy Code'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* SECTION 3: ABOUT, CUSTOM ORDERS & CUSTOMER REVIEWS */}
          <section
            id="about"
            className="bg-[#FAF5EB] border-y border-[#2C1A12]/10 py-14 sm:py-16"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
              {/* About Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                <div className="lg:col-span-6">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-[#2C1A12]/10 shadow-md bg-white">
                    <ResilientImage
                      src={IMAGE_ASSETS.aboutCraft}
                      alt="Master halwai garnishing saffron barfi with pistachios and rose petals at Tariq Sweets & Bakes"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A650B]">
                    Our Heritage &amp; Craft
                  </p>
                  <h2
                    className="text-3xl sm:text-4xl font-bold text-[#2C1A12] leading-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Where Traditional Halwai Soul Meets Modern Patisserie.
                  </h2>
                  <p className="text-sm sm:text-base text-[#5C4335] leading-relaxed">
                    At Tariq Sweets &amp; Bakes, every celebration begins at 5:00 AM as fresh
                    buffalo milk simmers into velvety khoya alongside stone-deck ovens baking
                    golden brioche, crisp cake rusk, and Belgian ganache cakes. Whether it is a
                    humble Sunday tea or a 200-box wedding bhaji order, our promise remains pure
                    ingredients and heartfelt hospitality.
                  </p>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setCustomOrderOpen(true)}
                      className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-[#2C1A12] text-[#FFFDF9] text-xs font-semibold hover:bg-[#44291D]"
                    >
                      <Sparkles className="w-4 h-4 text-[#E5A93B]" />
                      <span>Order Custom Cake or Wedding Boxes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrackModalOpen(true)}
                      className="px-5 h-11 rounded-xl bg-white border border-[#2C1A12]/15 text-xs font-semibold text-[#2C1A12] hover:bg-[#FFFDF9]"
                    >
                      Track Existing Order
                    </button>
                  </div>
                </div>
              </div>

              {/* Customer Reviews */}
              <div className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A650B]">
                      Trusted Across Celebrations
                    </p>
                    <h3
                      className="text-2xl sm:text-3xl font-bold text-[#2C1A12] mt-0.5"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Customer Reviews
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewFormOpen((o) => !o)}
                    className="px-4 h-10 rounded-xl bg-white border border-[#2C1A12]/15 text-xs font-semibold text-[#2C1A12] hover:bg-[#FFFDF9]"
                  >
                    {reviewFormOpen ? 'Close Review Form' : 'Write a Review'}
                  </button>
                </div>

                {reviewFormOpen && (
                  <form
                    onSubmit={handleReviewSubmit}
                    className="rounded-2xl bg-white border border-[#2C1A12]/10 p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    <input
                      type="text"
                      required
                      value={revName}
                      onChange={(e) => setRevName(e.target.value)}
                      placeholder="Your Name *"
                      className="h-10 px-3.5 rounded-xl border border-[#2C1A12]/15 text-sm"
                    />
                    <input
                      type="text"
                      value={revLocation}
                      onChange={(e) => setRevLocation(e.target.value)}
                      placeholder="City / Area (e.g. DHA Lahore)"
                      className="h-10 px-3.5 rounded-xl border border-[#2C1A12]/15 text-sm"
                    />
                    <input
                      type="text"
                      value={revOccasion}
                      onChange={(e) => setRevOccasion(e.target.value)}
                      placeholder="Occasion (e.g. Eid Gift Box)"
                      className="h-10 px-3.5 rounded-xl border border-[#2C1A12]/15 text-sm"
                    />
                    <select
                      value={revRating}
                      onChange={(e) => setRevRating(Number(e.target.value))}
                      className="h-10 px-3 rounded-xl border border-[#2C1A12]/15 text-sm"
                    >
                      <option value={5}>5 Stars — Exceptional</option>
                      <option value={4}>4 Stars — Very Good</option>
                      <option value={3}>3 Stars — Good</option>
                    </select>
                    <textarea
                      rows={2}
                      required
                      value={revQuote}
                      onChange={(e) => setRevQuote(e.target.value)}
                      placeholder="Share what you ordered and how it tasted... *"
                      className="sm:col-span-2 lg:col-span-3 p-3 rounded-xl border border-[#2C1A12]/15 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="h-11 self-end rounded-xl bg-[#2C1A12] text-[#FFFDF9] text-xs font-semibold hover:bg-[#44291D] disabled:opacity-50"
                    >
                      {submittingReview ? 'Posting...' : 'Post Review'}
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {reviews.slice(0, 6).map((rev) => (
                    <article
                      key={rev.id}
                      className="rounded-2xl bg-white border border-[#2C1A12]/10 p-6 flex flex-col justify-between gap-4 shadow-xs"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-1 text-[#D4941A]">
                          {Array.from({ length: rev.rating }).map((_, idx) => (
                            <Star key={idx} className="w-4 h-4 fill-[#D4941A]" />
                          ))}
                        </div>
                        <p className="text-sm text-[#5C4335] leading-relaxed">“{rev.quote}”</p>
                      </div>
                      <div className="pt-3 border-t border-[#2C1A12]/8 text-xs">
                        <p className="font-bold text-[#2C1A12]">{rev.name}</p>
                        <p className="text-[#6B4E3D]">
                          {rev.location} · {rev.occasion}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: CONTACT, OPENING HOURS & LOCATION */}
          <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl bg-white border border-[#2C1A12]/10 p-6 space-y-2.5">
                <MapPin className="w-5 h-5 text-[#9A650B]" />
                <h3
                  className="text-lg font-bold text-[#2C1A12]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Flagship Bakery &amp; Store
                </h3>
                <p className="text-sm text-[#5C4335] leading-relaxed">{settings.storeAddress}</p>
                <p className="text-xs text-[#6B4E3D]">Store pickup available with zero delivery fee</p>
              </div>

              <div className="rounded-2xl bg-white border border-[#2C1A12]/10 p-6 space-y-2.5">
                <Clock className="w-5 h-5 text-[#9A650B]" />
                <h3
                  className="text-lg font-bold text-[#2C1A12]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Opening Hours
                </h3>
                <p className="text-sm text-[#5C4335]">{settings.openingHours}</p>
                <p className="text-xs text-[#6B4E3D]">
                  Hot Jalebi &amp; Halwa batches every morning &amp; evening
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-[#2C1A12]/10 p-6 space-y-3">
                <Phone className="w-5 h-5 text-[#9A650B]" />
                <h3
                  className="text-lg font-bold text-[#2C1A12]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Direct Order Desk
                </h3>
                <p className="text-sm text-[#5C4335]">
                  {settings.storePhone} · {settings.storeEmail}
                </p>
                <a
                  href={floatingWhatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#1E7E45] hover:underline"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Message Us on WhatsApp</span>
                </a>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Clean Editorial Footer */}
      <footer className="bg-[#2C1A12] text-[#FAF5EB] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p
              className="text-lg font-bold text-[#FFFDF9]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {settings.brandName}
            </p>
            <p className="text-xs text-[#FAF5EB]/70 mt-1">
              Bringing Sweetness to Every Celebration · {settings.storeAddress}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs text-[#FAF5EB]/80">
            <button type="button" onClick={() => scrollToSection('menu')} className="hover:text-white">
              Menu
            </button>
            <button
              type="button"
              onClick={() => setCustomOrderOpen(true)}
              className="hover:text-white"
            >
              Wedding &amp; Custom Cakes
            </button>
            <button
              type="button"
              onClick={() => setTrackModalOpen(true)}
              className="hover:text-white"
            >
              Track Order
            </button>
            <button
              type="button"
              onClick={() => setView('admin')}
              className="hover:text-[#E5A93B]"
            >
              Admin Dashboard
            </button>
            <button
              type="button"
              onClick={() => setSupabaseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF5EB]/10 border border-[#E5A93B]/35 text-[#E5A93B] hover:bg-[#FAF5EB]/20 transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{supabaseConnected ? 'Supabase Connected' : 'Connect Supabase'}</span>
            </button>
            <span className="text-[#FAF5EB]/50">© {new Date().getFullYear()} {settings.brandName}</span>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button (Storefront only, compact <= 48px height) */}
      {view === 'store' && (
        <a
          href={floatingWhatsAppHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Order or chat on WhatsApp"
          className="fixed bottom-5 right-5 z-30 h-12 px-4 rounded-full bg-[#1E7E45] hover:bg-[#176637] text-white shadow-lg inline-flex items-center gap-2 text-xs font-semibold transition-transform hover:scale-[1.03]"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">WhatsApp Order</span>
        </a>
      )}

      {/* Modals & Slide-Over Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        settings={settings}
        isWishlisted={selectedProduct ? wishlist.includes(selectedProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartCheckoutDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        settings={settings}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCart([])}
        onOrderCreated={handleOrderCreated}
      />

      <TrackOrderModal
        open={trackModalOpen}
        onClose={() => setTrackModalOpen(false)}
        recentOrderNumber={recentOrderNumber}
      />

      <CustomOrderModal
        open={customOrderOpen}
        onClose={() => setCustomOrderOpen(false)}
      />

      <SupabaseConnectModal
        open={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
        onConnectionChanged={() => {
          setSupabaseConnected(Boolean(getSavedSupabaseConfig()));
          void refreshStore();
        }}
      />
    </div>
  );
}
