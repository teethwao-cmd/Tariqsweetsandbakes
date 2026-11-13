import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { submitOrder, validateCoupon } from '../services/api.ts';
import type {
  CartItem,
  Coupon,
  FulfillmentType,
  Order,
  StoreSettings,
} from '../types.ts';
import { formatPKR } from '../utils/formatters.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface CartCheckoutDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  settings: StoreSettings;
  onUpdateQty: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  onClearCart: () => void;
  onOrderCreated: (order: Order) => void;
}

export const CartCheckoutDrawer: React.FC<CartCheckoutDrawerProps> = ({
  open,
  onClose,
  items,
  settings,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderCreated,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'receipt'>('cart');
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('Delivery');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    coupon: Coupon;
    discountAmount: number;
  } | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<
    'Cash on Delivery' | 'WhatsApp Order (COD)' | 'Pay at Pickup'
  >('Cash on Delivery');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [receipt, setReceipt] = useState<{
    order: Order;
    whatsappMessage: string;
    whatsappUrl: string;
  } | null>(null);
  const [copiedMsg, setCopiedMsg] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const discountAmount = appliedCoupon
    ? appliedCoupon.coupon.discountType === 'percent'
      ? Math.round((subtotal * appliedCoupon.coupon.value) / 100)
      : Math.min(subtotal, appliedCoupon.coupon.value)
    : 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const deliveryFee =
    items.length === 0 ||
    fulfillmentType === 'Store Pickup' ||
    afterDiscount >= settings.freeDeliveryThreshold
      ? 0
      : settings.deliveryFee;
  const total = afterDiscount + deliveryFee;

  const handleApplyCoupon = async () => {
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return;
    setApplyingCoupon(true);
    setCouponFeedback(null);
    try {
      const res = await validateCoupon(clean, subtotal);
      if (res.coupon) {
        setAppliedCoupon({ coupon: res.coupon, discountAmount: res.discountAmount });
        setCouponFeedback({ type: 'ok', text: res.message });
      }
    } catch (err) {
      setAppliedCoupon(null);
      setCouponFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Invalid coupon code.',
      });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (customerName.trim().length < 2) {
      setFormError('Please enter your full name.');
      return;
    }
    const phoneDigits = phone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 10) {
      setFormError('Please enter a valid Pakistani mobile or phone number.');
      return;
    }
    if (fulfillmentType === 'Delivery' && address.trim().length < 8) {
      setFormError('Please enter a complete street / sector delivery address.');
      return;
    }

    setSubmitting(true);
    try {
      const finalPayment =
        fulfillmentType === 'Store Pickup' && paymentMethod === 'Cash on Delivery'
          ? 'Pay at Pickup'
          : paymentMethod;

      const res = await submitOrder({
        customerName: customerName.trim(),
        phone: phone.trim(),
        address:
          fulfillmentType === 'Store Pickup'
            ? settings.storeAddress
            : address.trim(),
        notes: notes.trim(),
        fulfillmentType,
        paymentMethod: finalPayment,
        discountCode: appliedCoupon?.coupon.code,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          variantLabel: i.variantLabel,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
        settings,
        subtotal,
        discountAmount,
        deliveryFee,
        total,
      });

      setReceipt(res);
      setStep('receipt');
      onOrderCreated(res.order);
      onClearCart();
      setAppliedCoupon(null);
      setCouponCode('');
      setCouponFeedback(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not complete your order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyMessage = async () => {
    if (!receipt) return;
    try {
      await navigator.clipboard.writeText(receipt.whatsappMessage);
      setCopiedMsg(true);
      window.setTimeout(() => setCopiedMsg(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  const resetAndClose = () => {
    if (step === 'receipt') {
      setStep('cart');
      setReceipt(null);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#2C1A12]/45 backdrop-blur-xs" onClick={resetAndClose}>
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#FFFDF9] h-full shadow-2xl border-l border-[#2C1A12]/10 flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#2C1A12]/10 flex items-center justify-between bg-white">
              <div>
                <h2
                  className="text-xl font-bold text-[#2C1A12]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {step === 'cart'
                    ? 'Your Order Bag'
                    : step === 'checkout'
                    ? 'Delivery & Payment'
                    : 'Order Receipt'}
                </h2>
                <p className="text-xs text-[#6B4E3D]">
                  {step === 'receipt'
                    ? 'Confirmed and ready for WhatsApp dispatch'
                    : `${items.reduce((s, i) => s + i.quantity, 0)} item(s) · Complimentary delivery over ${formatPKR(
                        settings.freeDeliveryThreshold
                      )}`}
                </p>
              </div>
              <button
                type="button"
                onClick={resetAndClose}
                aria-label="Close cart drawer"
                className="w-10 h-10 rounded-full hover:bg-[#FAF5EB] flex items-center justify-center text-[#2C1A12]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {step === 'receipt' && receipt ? (
                <div className="space-y-5">
                  <div className="rounded-2xl bg-[#FAF5EB] border border-[#D4941A]/40 p-5 space-y-2">
                    <div className="flex items-center gap-2 text-[#1E7E45] font-semibold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Order {receipt.order.orderNumber} Confirmed</span>
                    </div>
                    <p className="text-sm text-[#5C4335] leading-relaxed">
                      Thank you, <strong className="text-[#2C1A12]">{receipt.order.customerName}</strong>.
                      Your order has been logged for {receipt.order.fulfillmentType} ({receipt.order.paymentMethod}).
                      Click below to open WhatsApp with your complete pre-filled receipt.
                    </p>
                  </div>

                  <a
                    href={receipt.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-12 rounded-xl bg-[#1E7E45] hover:bg-[#176637] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Send Order Confirmation on WhatsApp</span>
                  </a>

                  <div className="rounded-xl bg-white border border-[#2C1A12]/12 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#6B4E3D]">
                        Prepared WhatsApp Receipt
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyMessage}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A650B] hover:text-[#2C1A12]"
                      >
                        {copiedMsg ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Text</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="text-xs text-[#2C1A12] whitespace-pre-wrap font-sans bg-[#FAF5EB] p-3.5 rounded-lg border border-[#2C1A12]/8 leading-relaxed">
                      {receipt.whatsappMessage}
                    </pre>
                  </div>

                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="w-full h-11 rounded-xl border border-[#2C1A12]/15 text-sm font-semibold text-[#2C1A12] hover:bg-[#FAF5EB]"
                  >
                    Continue Browsing
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FAF5EB] flex items-center justify-center text-[#B87D14]">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <p
                      className="text-lg font-semibold text-[#2C1A12]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Your order bag is empty
                    </p>
                    <p className="text-sm text-[#6B4E3D] mt-1">
                      Explore fresh mithai, celebration cakes, and artisan bakery treats.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl bg-[#2C1A12] text-[#FFFDF9] text-sm font-semibold hover:bg-[#44291D]"
                  >
                    Explore Menu
                  </button>
                </div>
              ) : step === 'cart' ? (
                <>
                  {/* Delivery or Pickup selector */}
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#FAF5EB] border border-[#2C1A12]/10">
                    <button
                      type="button"
                      onClick={() => setFulfillmentType('Delivery')}
                      className={`h-10 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all ${
                        fulfillmentType === 'Delivery'
                          ? 'bg-white text-[#2C1A12] shadow-xs'
                          : 'text-[#6B4E3D] hover:text-[#2C1A12]'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Home Delivery</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFulfillmentType('Store Pickup')}
                      className={`h-10 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all ${
                        fulfillmentType === 'Store Pickup'
                          ? 'bg-white text-[#2C1A12] shadow-xs'
                          : 'text-[#6B4E3D] hover:text-[#2C1A12]'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Store Pickup (Free)</span>
                    </button>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-[#2C1A12]/10">
                    {items.map((item) => (
                      <div key={item.key} className="py-4 flex gap-3.5 items-start">
                        <ResilientImage
                          src={item.image}
                          alt={item.name}
                          className="w-18 h-16 rounded-xl object-cover shrink-0 bg-[#FAF5EB]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-semibold text-[#2C1A12] truncate">
                                {item.name}
                              </h4>
                              <p className="text-xs text-[#6B4E3D]">
                                {item.variantLabel} · {formatPKR(item.unitPrice)} each
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.key)}
                              aria-label={`Remove ${item.name}`}
                              className="p-1.5 text-[#6B4E3D] hover:text-[#A63A2B] rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="inline-flex items-center rounded-lg border border-[#2C1A12]/15 bg-white">
                              <button
                                type="button"
                                onClick={() => onUpdateQty(item.key, -1)}
                                aria-label="Decrease quantity"
                                className="w-8 h-8 flex items-center justify-center hover:bg-[#FAF5EB]"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span
                                className="w-8 text-center text-xs font-semibold tabular-nums"
                                style={{ fontFamily: 'var(--font-mono)' }}
                              >
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQty(item.key, 1)}
                                aria-label="Increase quantity"
                                className="w-8 h-8 flex items-center justify-center hover:bg-[#FAF5EB]"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span
                              className="text-sm font-semibold text-[#2C1A12] tabular-nums"
                              style={{ fontFamily: 'var(--font-mono)' }}
                            >
                              {formatPKR(item.unitPrice * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coupon */}
                  <div className="pt-2 space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B4E3D]">
                      Discount Coupon
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Try SWEET10 or TARIQ15"
                        className="flex-1 h-10 px-3.5 rounded-xl bg-white border border-[#2C1A12]/15 text-sm text-[#2C1A12] placeholder:text-[#6B4E3D]/60 focus:outline-none focus:border-[#D4941A]"
                      />
                      {appliedCoupon ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCoupon(null);
                            setCouponCode('');
                            setCouponFeedback(null);
                          }}
                          className="px-4 h-10 rounded-xl border border-[#2C1A12]/15 text-xs font-semibold text-[#A63A2B] hover:bg-[#FAF5EB]"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={applyingCoupon || !couponCode.trim()}
                          onClick={handleApplyCoupon}
                          className="px-4 h-10 rounded-xl bg-[#FAF5EB] border border-[#2C1A12]/15 text-xs font-semibold text-[#2C1A12] hover:bg-[#F3E9D4] disabled:opacity-50"
                        >
                          {applyingCoupon ? 'Checking...' : 'Apply'}
                        </button>
                      )}
                    </div>
                    {couponFeedback && (
                      <p
                        className={`text-xs font-medium ${
                          couponFeedback.type === 'ok' ? 'text-[#1E7E45]' : 'text-[#A63A2B]'
                        }`}
                      >
                        {couponFeedback.text}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
                  {formError && (
                    <div className="p-3 rounded-xl bg-[#FDF2F0] border border-[#A63A2B]/25 text-xs font-medium text-[#A63A2B]">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Usman Ali Khan"
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#2C1A12]/15 text-sm focus:outline-none focus:border-[#D4941A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                      Mobile / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#2C1A12]/15 text-sm focus:outline-none focus:border-[#D4941A]"
                    />
                  </div>

                  {fulfillmentType === 'Delivery' ? (
                    <div>
                      <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                        Delivery Address *
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House / Flat No., Street, Sector / Town, City"
                        className="w-full p-3.5 rounded-xl bg-white border border-[#2C1A12]/15 text-sm focus:outline-none focus:border-[#D4941A]"
                      />
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-[#FAF5EB] border border-[#2C1A12]/10 text-xs text-[#5C4335]">
                      <strong className="text-[#2C1A12] block mb-0.5">Store Pickup Location</strong>
                      {settings.storeAddress} ({settings.openingHours})
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#2C1A12] mb-1.5">
                      Order Notes / Cake Inscription (Optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Pack mithai in separate boxes, or cake message"
                      className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#2C1A12]/15 text-sm focus:outline-none focus:border-[#D4941A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2C1A12] mb-2">
                      Payment Method
                    </label>
                    <div className="space-y-2">
                      {(
                        [
                          fulfillmentType === 'Store Pickup'
                            ? 'Pay at Pickup'
                            : 'Cash on Delivery',
                          'WhatsApp Order (COD)',
                        ] as const
                      ).map((method) => (
                        <label
                          key={method}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                            paymentMethod === method ||
                            (fulfillmentType === 'Store Pickup' &&
                              method === 'Pay at Pickup' &&
                              paymentMethod === 'Cash on Delivery')
                              ? 'bg-[#FAF5EB] border-[#D4941A]'
                              : 'bg-white border-[#2C1A12]/12'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={
                              paymentMethod === method ||
                              (fulfillmentType === 'Store Pickup' &&
                                method === 'Pay at Pickup' &&
                                paymentMethod === 'Cash on Delivery')
                            }
                            onChange={() => setPaymentMethod(method)}
                            className="accent-[#2C1A12]"
                          />
                          <div>
                            <p className="text-sm font-semibold text-[#2C1A12]">{method}</p>
                            <p className="text-xs text-[#6B4E3D]">
                              {method === 'WhatsApp Order (COD)'
                                ? 'Confirm order instantly with pre-filled WhatsApp message'
                                : 'Pay conveniently upon receiving your fresh order'}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Footer Totals & CTA */}
            {items.length > 0 && step !== 'receipt' && (
              <div className="p-6 border-t border-[#2C1A12]/10 bg-white space-y-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-[#5C4335]">
                    <span>Subtotal</span>
                    <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
                      {formatPKR(subtotal)}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#1E7E45] font-medium">
                      <span>Discount ({appliedCoupon?.coupon.code})</span>
                      <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
                        -{formatPKR(discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#5C4335]">
                    <span>
                      {fulfillmentType === 'Store Pickup' ? 'Store Pickup' : 'Delivery Charges'}
                    </span>
                    <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
                      {deliveryFee === 0 ? 'FREE' : formatPKR(deliveryFee)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#2C1A12]/10 flex justify-between text-base font-bold text-[#2C1A12]">
                    <span>Total Bill</span>
                    <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
                      {formatPKR(total)}
                    </span>
                  </div>
                </div>

                {step === 'cart' ? (
                  <button
                    type="button"
                    onClick={() => setStep('checkout')}
                    className="w-full h-12 rounded-xl bg-[#2C1A12] text-[#FFFDF9] font-semibold text-sm hover:bg-[#44291D] transition-colors"
                  >
                    Proceed to Checkout
                  </button>
                ) : (
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setStep('cart')}
                      className="px-4 h-12 rounded-xl border border-[#2C1A12]/15 text-sm font-semibold text-[#2C1A12] hover:bg-[#FAF5EB]"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      form="checkout-form"
                      disabled={submitting}
                      className="flex-1 h-12 rounded-xl bg-[#2C1A12] text-[#FFFDF9] font-semibold text-sm hover:bg-[#44291D] disabled:opacity-50 transition-colors"
                    >
                      {submitting ? 'Placing Order...' : `Confirm Order · ${formatPKR(total)}`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
