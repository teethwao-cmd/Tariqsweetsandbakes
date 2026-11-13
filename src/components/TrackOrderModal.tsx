import React, { useState } from 'react';
import { CheckCircle2, Clock, Package, Search, Truck, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { trackOrderByNumber } from '../services/api.ts';
import type { Order, OrderStatus } from '../types.ts';
import { formatPKR } from '../utils/formatters.ts';

interface TrackOrderModalProps {
  open: boolean;
  onClose: () => void;
  recentOrderNumber?: string;
}

const STEPS: OrderStatus[] = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered'];

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  open,
  onClose,
  recentOrderNumber,
}) => {
  const [query, setQuery] = useState(recentOrderNumber || 'TSB-1042');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const found = await trackOrderByNumber(query);
      setOrder(found);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : 'Order not found.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const currentIdx = order ? STEPS.indexOf(order.status) : -1;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C1A12]/45 backdrop-blur-xs p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl rounded-2xl bg-[#FFFDF9] border border-[#2C1A12]/12 shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-[#2C1A12]/10 flex items-center justify-between bg-white">
            <div>
              <h2
                className="text-xl font-bold text-[#2C1A12]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Track Your Order
              </h2>
              <p className="text-xs text-[#6B4E3D]">
                Enter your reference number (try TSB-1041 or TSB-1042)
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-[#FAF5EB] flex items-center justify-center"
              aria-label="Close order tracker"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <form onSubmit={handleTrack} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#6B4E3D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value.toUpperCase())}
                  placeholder="e.g. TSB-1042"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-[#2C1A12]/15 text-sm font-medium focus:outline-none focus:border-[#D4941A]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 h-11 rounded-xl bg-[#2C1A12] text-[#FFFDF9] text-sm font-semibold hover:bg-[#44291D] disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? 'Searching...' : 'Track Order'}
              </button>
            </form>

            {error && (
              <div className="p-3.5 rounded-xl bg-[#FDF2F0] border border-[#A63A2B]/25 text-xs font-medium text-[#A63A2B]">
                {error}
              </div>
            )}

            {order && (
              <div className="rounded-2xl bg-white border border-[#2C1A12]/10 p-5 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#2C1A12]/10">
                  <div>
                    <p
                      className="text-base font-bold text-[#2C1A12]"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-[#6B4E3D]">
                      {order.customerName} · {order.fulfillmentType}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#9A650B] tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>
                      {formatPKR(order.total)}
                    </p>
                    <p className="text-xs text-[#6B4E3D]">{order.paymentMethod}</p>
                  </div>
                </div>

                {order.status === 'Cancelled' ? (
                  <p className="text-sm font-semibold text-[#A63A2B]">
                    Order Status: Cancelled
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {STEPS.map((st, idx) => {
                      const done = idx <= currentIdx;
                      const Icon =
                        idx === 0
                          ? Clock
                          : idx === 1
                          ? Package
                          : idx === 2
                          ? Truck
                          : CheckCircle2;
                      return (
                        <div key={st} className="text-center space-y-1.5">
                          <div
                            className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center border ${
                              done
                                ? 'bg-[#2C1A12] text-[#E5A93B] border-[#2C1A12]'
                                : 'bg-[#FAF5EB] text-[#6B4E3D]/50 border-[#2C1A12]/10'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <p
                            className={`text-[11px] leading-tight ${
                              done ? 'font-semibold text-[#2C1A12]' : 'text-[#6B4E3D]/70'
                            }`}
                          >
                            {st}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-3 border-t border-[#2C1A12]/10 space-y-1.5 text-xs text-[#5C4335]">
                  {order.items.map((i, idx) => (
                    <div key={`${i.productId}-${idx}`} className="flex justify-between">
                      <span>
                        {i.name} ({i.variantLabel}) × {i.quantity}
                      </span>
                      <span className="tabular-nums font-medium" style={{ fontFamily: 'var(--font-mono)' }}>
                        {formatPKR(i.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
