import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Edit3,
  Lock,
  LogOut,
  MessageCircle,
  Package,
  Plus,
  Search,
  Settings,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { IMAGE_LIBRARY_OPTIONS } from '../data/seedCatalog.ts';
import { getSavedSupabaseConfig } from '../lib/supabaseClient.ts';
import {
  adminLogin,
  createProduct,
  deleteCoupon,
  deleteProduct,
  fetchAdminDashboard,
  getAdminToken,
  saveCoupon,
  setAdminToken,
  updateOrderStatus,
  updateProduct,
  updateStoreSettings,
  uploadProductImage,
} from '../services/api.ts';
import {
  PRODUCT_CATEGORIES,
  type Coupon,
  type Order,
  type OrderStatus,
  type Product,
  type ProductCategory,
  type StoreData,
  type StoreSettings,
} from '../types.ts';
import { buildWhatsAppUrl, formatPKR } from '../utils/formatters.ts';
import { ResilientImage } from './ResilientImage.tsx';
import { SupabaseConnectModal } from './SupabaseConnectModal.tsx';

interface AdminDashboardProps {
  onExitAdmin: () => void;
  onStoreUpdated: () => void;
}

type AdminTab = 'overview' | 'orders' | 'products' | 'coupons' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onExitAdmin,
  onStoreUpdated,
}) => {
  const [authenticated, setAuthenticated] = useState(Boolean(getAdminToken()));
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [tab, setTab] = useState<AdminTab>('overview');
  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(Boolean(getSavedSupabaseConfig()));

  // Product search & editor modal
  const [productQuery, setProductQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [variantsText, setVariantsText] = useState('500g:800, 1 kg:1550');
  const [uploadingImg, setUploadingImg] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Coupon form
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percent' | 'fixed'>('percent');
  const [newCouponValue, setNewCouponValue] = useState(10);
  const [newCouponMin, setNewCouponMin] = useState(1500);

  // Settings form
  const [settingsForm, setSettingsForm] = useState<StoreSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminDashboard();
      setData(res);
      setSettingsForm(res.settings);
    } catch {
      setAdminToken(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      void loadDashboard();
    }
  }, [authenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      await adminLogin(username, password);
      setAuthenticated(true);
      setPassword('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setAdminToken(null);
    setAuthenticated(false);
    setData(null);
  };

  const openProductEditor = (product?: Product) => {
    if (product) {
      setEditingProduct({ ...product });
      setVariantsText(product.variants.map((v) => `${v.label}:${v.price}`).join(', '));
    } else {
      setEditingProduct({
        name: '',
        category: 'Mithai',
        description: '',
        craftNote: 'Prepared fresh daily at Tariq Sweets & Bakes.',
        image: IMAGE_LIBRARY_OPTIONS[0].url,
        available: true,
        stock: 30,
        featured: false,
        bestSeller: false,
      });
      setVariantsText('500g:850, 1 kg:1650');
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    setUploadingImg(true);
    try {
      const url = await uploadProductImage(file);
      setEditingProduct({ ...editingProduct, image: url });
      showToast('Product image uploaded.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name?.trim()) return;
    setSavingProduct(true);
    try {
      const parsedVariants = variantsText
        .split(',')
        .map((part) => {
          const [label, priceStr] = part.split(':').map((s) => s.trim());
          const price = Math.round(Number(priceStr));
          return label && price > 0 ? { label, price } : null;
        })
        .filter((v): v is { label: string; price: number } => v !== null);

      const payload: Partial<Product> = {
        ...editingProduct,
        variants: parsedVariants.length > 0 ? parsedVariants : [{ label: 'Standard', price: 850 }],
        price: parsedVariants[0]?.price || 850,
      };

      if (editingProduct.id) {
        await updateProduct(editingProduct.id, payload);
        showToast('Product updated successfully.');
      } else {
        await createProduct(payload);
        showToast('New product added to catalog.');
      }
      setEditingProduct(null);
      await loadDashboard();
      onStoreUpdated();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      await deleteProduct(product.id);
      showToast(`Deleted "${product.name}".`);
      await loadDashboard();
      onStoreUpdated();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const handleOrderStatusChange = async (order: Order, nextStatus: OrderStatus) => {
    try {
      await updateOrderStatus(order.id, nextStatus);
      showToast(`Order ${order.orderNumber} marked ${nextStatus}.`);
      await loadDashboard();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Status update failed.');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    try {
      const coupon: Coupon = {
        code: newCouponCode.trim().toUpperCase(),
        description: newCouponDesc.trim() || 'Promotional discount',
        discountType: newCouponType,
        value: Number(newCouponValue),
        minOrder: Number(newCouponMin),
        active: true,
      };
      await saveCoupon(coupon);
      setNewCouponCode('');
      setNewCouponDesc('');
      showToast(`Coupon ${coupon.code} saved.`);
      await loadDashboard();
      onStoreUpdated();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save coupon.');
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    try {
      await deleteCoupon(code);
      showToast(`Removed coupon ${code}.`);
      await loadDashboard();
      onStoreUpdated();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete coupon.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;
    setSavingSettings(true);
    try {
      await updateStoreSettings(settingsForm);
      showToast('Store & WhatsApp settings saved.');
      await loadDashboard();
      onStoreUpdated();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-[#FAF5EB]">
        <div className="w-full max-w-md rounded-2xl bg-white border border-[#2C1A12]/12 shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#2C1A12] text-[#E5A93B] flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h1
              className="text-2xl font-bold text-[#2C1A12]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Owner Admin Portal
            </h1>
            <p className="text-xs text-[#6B4E3D]">
              Sign in to manage products, inventory, orders, coupons, WhatsApp &amp; Supabase
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-[#FDF2F0] border border-[#A63A2B]/25 text-xs text-[#A63A2B]">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#FFFDF9] border border-[#2C1A12]/15 text-sm focus:outline-none focus:border-[#D4941A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full h-11 px-3.5 rounded-xl bg-[#FFFDF9] border border-[#2C1A12]/15 text-sm focus:outline-none focus:border-[#D4941A]"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full h-11 rounded-xl bg-[#2C1A12] text-[#FFFDF9] text-sm font-semibold hover:bg-[#44291D] disabled:opacity-50"
            >
              {loggingIn ? 'Verifying...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="pt-4 border-t border-[#2C1A12]/10 flex items-center justify-between text-xs text-[#6B4E3D]">
            <span>Demo credentials: admin / tariq2026</span>
            <button
              type="button"
              onClick={onExitAdmin}
              className="font-semibold text-[#2C1A12] hover:underline"
            >
              Back to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalRevenue =
    data?.orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0) || 0;
  const pendingOrders = data?.orders.filter((o) => o.status === 'Pending' || o.status === 'Preparing').length || 0;
  const completedOrders = data?.orders.filter((o) => o.status === 'Delivered').length || 0;

  const filteredProducts =
    data?.products.filter(
      (p) =>
        p.name.toLowerCase().includes(productQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(productQuery.toLowerCase())
    ) || [];

  return (
    <div className="min-h-screen bg-[#FAF5EB]">
      {/* Admin Sub-Header */}
      <div className="bg-white border-b border-[#2C1A12]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold text-[#2C1A12]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Tariq Sweets &amp; Bakes — Admin Console
            </h1>
            <p className="text-xs text-[#6B4E3D]">
              Mode: {supabaseConnected ? 'Supabase Cloud Connected' : 'Demo Mode (Persistent Local Store)'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSupabaseModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-[#FAF5EB] border border-[#D4941A]/45 text-xs font-semibold text-[#2C1A12] hover:bg-[#F3E9D4]"
            >
              <Database className="w-4 h-4 text-[#9A650B]" />
              <span>{supabaseConnected ? 'Supabase Connected' : 'Connect Supabase'}</span>
            </button>
            <button
              type="button"
              onClick={onExitAdmin}
              className="px-4 h-10 rounded-xl border border-[#2C1A12]/15 text-xs font-semibold text-[#2C1A12] hover:bg-[#FAF5EB]"
            >
              View Storefront
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 h-10 rounded-xl bg-[#2C1A12] text-[#FFFDF9] text-xs font-semibold hover:bg-[#44291D]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto pb-2">
          {(
            [
              { id: 'overview', label: 'Sales Overview' },
              { id: 'orders', label: `Orders (${data?.orders.length || 0})` },
              { id: 'products', label: `Products (${data?.products.length || 0})` },
              { id: 'coupons', label: 'Discounts & Offers' },
              { id: 'settings', label: 'Store & Supabase Settings' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                tab === t.id
                  ? 'bg-[#2C1A12] text-[#FFFDF9]'
                  : 'text-[#5C4335] hover:bg-[#FAF5EB] hover:text-[#2C1A12]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-3.5 rounded-xl bg-[#2C1A12] text-[#FFFDF9] text-xs font-medium flex items-center gap-2 shadow-md">
            <CheckCircle2 className="w-4 h-4 text-[#E5A93B]" />
            <span>{toast}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading || !data ? (
          <div className="py-20 text-center text-sm text-[#6B4E3D]">Loading admin data...</div>
        ) : (
          <>
            {tab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    {
                      label: 'Total Revenue',
                      value: formatPKR(totalRevenue),
                      sub: 'Active non-cancelled orders',
                    },
                    {
                      label: 'Total Orders',
                      value: String(data.orders.length),
                      sub: 'COD, Pickup & WhatsApp',
                    },
                    {
                      label: 'Pending / Preparing',
                      value: String(pendingOrders),
                      sub: 'Requires kitchen dispatch',
                    },
                    {
                      label: 'Completed Orders',
                      value: String(completedOrders),
                      sub: `${data.products.length} catalog items live`,
                    },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="rounded-2xl bg-white border border-[#2C1A12]/10 p-6 shadow-xs"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#6B4E3D]">
                        {kpi.label}
                      </p>
                      <p
                        className="mt-2 text-2xl font-bold text-[#2C1A12] tabular-nums"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {kpi.value}
                      </p>
                      <p className="mt-1 text-xs text-[#6B4E3D]">{kpi.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Recent Orders Preview */}
                <div className="rounded-2xl bg-white border border-[#2C1A12]/10 overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#2C1A12]/10 flex items-center justify-between">
                    <h2
                      className="text-lg font-bold text-[#2C1A12]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Recent Customer Orders
                    </h2>
                    <button
                      type="button"
                      onClick={() => setTab('orders')}
                      className="text-xs font-semibold text-[#9A650B] hover:underline"
                    >
                      Manage All Orders
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#FAF5EB] text-xs uppercase text-[#6B4E3D]">
                        <tr>
                          <th className="px-6 py-3">Order</th>
                          <th className="px-6 py-3">Customer</th>
                          <th className="px-6 py-3">Items</th>
                          <th className="px-6 py-3">Total</th>
                          <th className="px-6 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2C1A12]/8">
                        {data.orders.slice(0, 5).map((ord) => (
                          <tr key={ord.id}>
                            <td
                              className="px-6 py-3.5 font-semibold text-[#2C1A12] tabular-nums"
                              style={{ fontFamily: 'var(--font-mono)' }}
                            >
                              {ord.orderNumber}
                            </td>
                            <td className="px-6 py-3.5">
                              <p className="font-medium text-[#2C1A12]">{ord.customerName}</p>
                              <p className="text-xs text-[#6B4E3D]">{ord.phone}</p>
                            </td>
                            <td className="px-6 py-3.5 text-xs text-[#5C4335]">
                              {ord.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                            </td>
                            <td
                              className="px-6 py-3.5 font-semibold tabular-nums"
                              style={{ fontFamily: 'var(--font-mono)' }}
                            >
                              {formatPKR(ord.total)}
                            </td>
                            <td className="px-6 py-3.5 text-xs font-semibold text-[#2C1A12]">
                              {ord.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {tab === 'orders' && (
              <div className="rounded-2xl bg-white border border-[#2C1A12]/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-[#2C1A12]/10 flex items-center justify-between">
                  <h2
                    className="text-lg font-bold text-[#2C1A12]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Orders &amp; Customer Fulfillment
                  </h2>
                </div>
                <div className="divide-y divide-[#2C1A12]/10">
                  {data.orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B4E3D]">
                          <span
                            className="font-bold text-sm text-[#2C1A12] tabular-nums"
                            style={{ fontFamily: 'var(--font-mono)' }}
                          >
                            {ord.orderNumber}
                          </span>
                          <span>·</span>
                          <span>{ord.fulfillmentType}</span>
                          <span>·</span>
                          <span>{ord.paymentMethod}</span>
                          <span>·</span>
                          <span>{new Date(ord.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm font-semibold text-[#2C1A12]">
                          {ord.customerName} ({ord.phone})
                        </p>
                        <p className="text-xs text-[#5C4335]">{ord.address}</p>
                        {ord.notes && (
                          <p className="text-xs text-[#9A650B]">Note: {ord.notes}</p>
                        )}
                        <p className="text-xs text-[#5C4335] pt-1">
                          {ord.items
                            .map((i) => `${i.name} (${i.variantLabel}) × ${i.quantity}`)
                            .join(' · ')}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <span
                          className="text-base font-bold text-[#2C1A12] tabular-nums mr-2"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {formatPKR(ord.total)}
                        </span>
                        <select
                          value={ord.status}
                          onChange={(e) =>
                            void handleOrderStatusChange(ord, e.target.value as OrderStatus)
                          }
                          aria-label={`Order status for ${ord.orderNumber}`}
                          className="h-10 px-3 rounded-xl bg-[#FAF5EB] border border-[#2C1A12]/15 text-xs font-semibold text-[#2C1A12]"
                        >
                          {(
                            [
                              'Pending',
                              'Preparing',
                              'Out for Delivery',
                              'Delivered',
                              'Cancelled',
                            ] as const
                          ).map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                        <a
                          href={buildWhatsAppUrl(
                            ord.phone,
                            `Assalam-o-Alaikum ${ord.customerName}, update on your Tariq Sweets & Bakes order ${ord.orderNumber}: Status is now ${ord.status}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-[#2C1A12]/15 text-xs font-semibold text-[#1E7E45] hover:bg-[#FAF5EB]"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Message Customer</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'products' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[240px] max-w-md">
                    <Search className="w-4 h-4 text-[#6B4E3D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      placeholder="Search products or categories..."
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-[#2C1A12]/15 text-sm focus:outline-none focus:border-[#D4941A]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => openProductEditor()}
                    className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-[#2C1A12] text-[#FFFDF9] text-xs font-semibold hover:bg-[#44291D]"
                  >
                    <Plus className="w-4 h-4 text-[#E5A93B]" />
                    <span>Add New Product</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-2xl bg-white border border-[#2C1A12]/10 overflow-hidden flex flex-col"
                    >
                      <div className="aspect-[4/3] bg-[#FAF5EB] relative">
                        <ResilientImage
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-center justify-between text-xs text-[#6B4E3D] mb-1">
                            <span className="uppercase tracking-wider">{product.category}</span>
                            <span className="tabular-nums">Stock: {product.stock}</span>
                          </div>
                          <h3
                            className="text-base font-bold text-[#2C1A12]"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            {product.name}
                          </h3>
                          <p
                            className="mt-1 text-sm font-semibold text-[#9A650B] tabular-nums"
                            style={{ fontFamily: 'var(--font-mono)' }}
                          >
                            {formatPKR(product.price)}
                          </p>
                          <p className="mt-1 text-xs text-[#6B4E3D]">
                            {product.available ? 'Available on storefront' : 'Hidden / Sold out'}
                          </p>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-[#2C1A12]/8">
                          <button
                            type="button"
                            onClick={() => openProductEditor(product)}
                            className="flex-1 h-9 rounded-xl border border-[#2C1A12]/15 text-xs font-semibold text-[#2C1A12] hover:bg-[#FAF5EB] inline-flex items-center justify-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteProduct(product)}
                            className="px-3.5 h-9 rounded-xl border border-[#A63A2B]/25 text-xs font-semibold text-[#A63A2B] hover:bg-[#FDF2F0] inline-flex items-center justify-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'coupons' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form
                  onSubmit={handleCreateCoupon}
                  className="rounded-2xl bg-white border border-[#2C1A12]/10 p-6 space-y-4 h-fit"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#9A650B]" />
                    <h2
                      className="text-lg font-bold text-[#2C1A12]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Create Discount Offer
                    </h2>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2C1A12] mb-1">
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                      placeholder="EID20"
                      className="w-full h-10 px-3 rounded-xl border border-[#2C1A12]/15 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2C1A12] mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={newCouponDesc}
                      onChange={(e) => setNewCouponDesc(e.target.value)}
                      placeholder="20% off festive mithai boxes"
                      className="w-full h-10 px-3 rounded-xl border border-[#2C1A12]/15 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#2C1A12] mb-1">
                        Discount Type
                      </label>
                      <select
                        value={newCouponType}
                        onChange={(e) =>
                          setNewCouponType(e.target.value as 'percent' | 'fixed')
                        }
                        className="w-full h-10 px-3 rounded-xl border border-[#2C1A12]/15 text-sm"
                      >
                        <option value="percent">Percentage (%)</option>
                        <option value="fixed">Fixed (PKR)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#2C1A12] mb-1">
                        Value
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={newCouponValue}
                        onChange={(e) => setNewCouponValue(Number(e.target.value))}
                        className="w-full h-10 px-3 rounded-xl border border-[#2C1A12]/15 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2C1A12] mb-1">
                      Minimum Order (PKR)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newCouponMin}
                      onChange={(e) => setNewCouponMin(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl border border-[#2C1A12]/15 text-sm font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-[#2C1A12] text-[#FFFDF9] text-xs font-semibold hover:bg-[#44291D]"
                  >
                    Save Discount Coupon
                  </button>
                </form>

                <div className="lg:col-span-2 rounded-2xl bg-white border border-[#2C1A12]/10 overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#2C1A12]/10">
                    <h2
                      className="text-lg font-bold text-[#2C1A12]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Active Store Coupons
                    </h2>
                  </div>
                  <div className="divide-y divide-[#2C1A12]/10">
                    {data.coupons.map((c) => (
                      <div key={c.code} className="p-5 flex items-center justify-between gap-4">
                        <div>
                          <p
                            className="text-sm font-bold text-[#2C1A12]"
                            style={{ fontFamily: 'var(--font-mono)' }}
                          >
                            {c.code} ·{' '}
                            {c.discountType === 'percent'
                              ? `${c.value}% OFF`
                              : `${formatPKR(c.value)} OFF`}
                          </p>
                          <p className="text-xs text-[#6B4E3D] mt-0.5">
                            {c.description} · Min order {formatPKR(c.minOrder)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDeleteCoupon(c.code)}
                          className="px-3.5 h-9 rounded-xl border border-[#A63A2B]/25 text-xs font-semibold text-[#A63A2B] hover:bg-[#FDF2F0]"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'settings' && settingsForm && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form
                  onSubmit={handleSaveSettings}
                  className="lg:col-span-2 rounded-2xl bg-white border border-[#2C1A12]/10 p-6 space-y-5"
                >
                  <div className="flex items-center gap-2 pb-3 border-b border-[#2C1A12]/10">
                    <Settings className="w-4 h-4 text-[#9A650B]" />
                    <h2
                      className="text-lg font-bold text-[#2C1A12]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Storefront &amp; WhatsApp Ordering Settings
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                        WhatsApp Receiving Number (e.g. 923001234567)
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.whatsappNumber}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-[#2C1A12]/15 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                        Store Display Phone
                      </label>
                      <input
                        type="text"
                        value={settingsForm.storePhone}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, storePhone: e.target.value })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-[#2C1A12]/15 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                        Standard Delivery Fee (PKR)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={settingsForm.deliveryFee}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            deliveryFee: Number(e.target.value),
                          })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-[#2C1A12]/15 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                        Free Delivery Threshold (PKR)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={settingsForm.freeDeliveryThreshold}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            freeDeliveryThreshold: Number(e.target.value),
                          })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-[#2C1A12]/15 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                      Store Address
                    </label>
                    <input
                      type="text"
                      value={settingsForm.storeAddress}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, storeAddress: e.target.value })
                      }
                      className="w-full h-11 px-3.5 rounded-xl border border-[#2C1A12]/15 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                        Opening Hours
                      </label>
                      <input
                        type="text"
                        value={settingsForm.openingHours}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, openingHours: e.target.value })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-[#2C1A12]/15 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={settingsForm.storeEmail}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, storeEmail: e.target.value })
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-[#2C1A12]/15 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                      Top Promotional Announcement
                    </label>
                    <input
                      type="text"
                      value={settingsForm.promoBanner}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, promoBanner: e.target.value })
                      }
                      className="w-full h-11 px-3.5 rounded-xl border border-[#2C1A12]/15 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-6 h-11 rounded-xl bg-[#2C1A12] text-[#FFFDF9] text-sm font-semibold hover:bg-[#44291D] disabled:opacity-50"
                  >
                    {savingSettings ? 'Saving Settings...' : 'Save Store Settings'}
                  </button>
                </form>

                {/* Dedicated Connect Supabase Card */}
                <div className="rounded-2xl bg-white border border-[#2C1A12]/10 p-6 space-y-4 h-fit">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF5EB] flex items-center justify-center text-[#9A650B]">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3
                        className="text-base font-bold text-[#2C1A12]"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        Supabase Database
                      </h3>
                      <p className="text-xs text-[#6B4E3D]">
                        {supabaseConnected ? 'Connected' : 'Demo Mode Active'}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#5C4335] leading-relaxed">
                    Connect your Supabase project to persist products, inventory, customer orders,
                    authentication, and uploaded product photography with Row Level Security.
                  </p>

                  <button
                    type="button"
                    onClick={() => setSupabaseModalOpen(true)}
                    className="w-full h-11 rounded-xl bg-[#2C1A12] text-[#FFFDF9] text-xs font-semibold hover:bg-[#44291D] inline-flex items-center justify-center gap-2"
                  >
                    <Database className="w-4 h-4 text-[#E5A93B]" />
                    <span>Connect Supabase</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C1A12]/45 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setEditingProduct(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl bg-[#FFFDF9] border border-[#2C1A12]/12 shadow-2xl overflow-hidden my-auto"
          >
            <div className="px-6 py-4 border-b border-[#2C1A12]/10 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#9A650B]" />
                <h2
                  className="text-lg font-bold text-[#2C1A12]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {editingProduct.id ? 'Edit Product' : 'Add New Product'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="w-9 h-9 rounded-full hover:bg-[#FAF5EB] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveProduct}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2C1A12] mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-white border border-[#2C1A12]/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2C1A12] mb-1">
                    Category
                  </label>
                  <select
                    value={editingProduct.category || 'Mithai'}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value as ProductCategory,
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-white border border-[#2C1A12]/15 text-sm"
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2C1A12] mb-1">
                  Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full p-3 rounded-xl bg-white border border-[#2C1A12]/15 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2C1A12] mb-1">
                    Variants &amp; Prices (label:PKR, comma-separated)
                  </label>
                  <input
                    type="text"
                    value={variantsText}
                    onChange={(e) => setVariantsText(e.target.value)}
                    placeholder="500g:850, 1 kg:1650"
                    className="w-full h-10 px-3 rounded-xl bg-white border border-[#2C1A12]/15 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2C1A12] mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.stock ?? 25}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock: Number(e.target.value),
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-white border border-[#2C1A12]/15 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#2C1A12]">
                  Product Image (Choose Studio Preset, Upload File, or URL)
                </label>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={editingProduct.image || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, image: e.target.value })
                    }
                    className="flex-1 min-w-[200px] h-10 px-3 rounded-xl bg-white border border-[#2C1A12]/15 text-xs"
                  >
                    {IMAGE_LIBRARY_OPTIONS.map((opt) => (
                      <option key={opt.url} value={opt.url}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <label className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#FAF5EB] border border-[#2C1A12]/15 text-xs font-semibold text-[#2C1A12] cursor-pointer hover:bg-[#F3E9D4]">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImg ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={editingProduct.image || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, image: e.target.value })
                  }
                  placeholder="Or paste custom image URL"
                  className="w-full h-9 px-3 rounded-xl bg-white border border-[#2C1A12]/15 text-xs font-mono"
                />
              </div>

              <div className="flex flex-wrap gap-5 pt-1 text-xs font-medium text-[#2C1A12]">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.available !== false}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, available: e.target.checked })
                    }
                    className="accent-[#2C1A12]"
                  />
                  <span>Available for Sale</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.featured)}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, featured: e.target.checked })
                    }
                    className="accent-[#2C1A12]"
                  />
                  <span>Featured Product</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.bestSeller)}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, bestSeller: e.target.checked })
                    }
                    className="accent-[#2C1A12]"
                  />
                  <span>Best Seller</span>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2C1A12]/10">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 h-10 rounded-xl border border-[#2C1A12]/15 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-6 h-10 rounded-xl bg-[#2C1A12] text-[#FFFDF9] text-xs font-semibold hover:bg-[#44291D] disabled:opacity-50"
                >
                  {savingProduct ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SupabaseConnectModal
        open={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
        onConnectionChanged={() => {
          setSupabaseConnected(Boolean(getSavedSupabaseConfig()));
          void loadDashboard();
          onStoreUpdated();
        }}
      />
    </div>
  );
};
