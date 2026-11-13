import React, { useState } from 'react';
import { Heart, MessageCircle, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Product, StoreSettings } from '../types.ts';
import { buildWhatsAppUrl, formatPKR } from '../utils/formatters.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface ProductDetailModalProps {
  product: Product | null;
  settings: StoreSettings;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
  onClose: () => void;
  onAddToCart: (product: Product, variantLabel: string, unitPrice: number, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  settings,
  isWishlisted,
  onToggleWishlist,
  onClose,
  onAddToCart,
}) => {
  const [variantIdx, setVariantIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const activeVariant = product.variants[variantIdx] ||
    product.variants[0] || { label: 'Standard', price: product.price };
  const isAvailable = product.available && product.stock > 0;

  const quickWhatsAppText = `Assalam-o-Alaikum ${settings.brandName}, I would like to order:\n• ${product.name} (${activeVariant.label}) x ${quantity} — ${formatPKR(
    activeVariant.price * quantity
  )}\nPlease confirm availability.`;
  const quickWhatsAppHref = buildWhatsAppUrl(settings.whatsappNumber, quickWhatsAppText);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C1A12]/45 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl rounded-2xl bg-[#FFFDF9] border border-[#2C1A12]/12 shadow-2xl overflow-hidden my-auto"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product details"
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/95 border border-[#2C1A12]/12 flex items-center justify-center text-[#2C1A12] hover:bg-[#FAF5EB] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 items-stretch">
            <div className="aspect-[4/3] md:aspect-auto md:min-h-[420px] bg-[#FAF5EB]">
              <ResilientImage
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#6B4E3D] uppercase tracking-wider mb-2">
                  <span>{product.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{isAvailable ? `${product.stock} Packs Available` : 'Out of Stock'}</span>
                </div>

                <h2
                  className="text-2xl sm:text-3xl font-bold text-[#2C1A12] leading-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {product.name}
                </h2>

                <p
                  className="mt-3 text-2xl font-semibold text-[#9A650B] tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {formatPKR(activeVariant.price * quantity)}
                  {quantity > 1 && (
                    <span className="ml-2 text-xs font-normal text-[#6B4E3D]">
                      ({formatPKR(activeVariant.price)} each)
                    </span>
                  )}
                </p>

                <p className="mt-4 text-sm text-[#5C4335] leading-relaxed">
                  {product.description}
                </p>

                <div className="mt-4 pt-4 border-t border-[#2C1A12]/10 text-xs text-[#6B4E3D] leading-relaxed">
                  <span className="font-semibold text-[#2C1A12]">Artisan Note: </span>
                  {product.craftNote}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2C1A12] uppercase tracking-wider mb-2">
                    Select Weight / Pack Size
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v, idx) => (
                      <button
                        key={v.label}
                        type="button"
                        onClick={() => setVariantIdx(idx)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                          idx === variantIdx
                            ? 'bg-[#2C1A12] text-[#FFFDF9] border-[#2C1A12]'
                            : 'bg-white text-[#2C1A12] border-[#2C1A12]/15 hover:border-[#D4941A]'
                        }`}
                      >
                        {v.label} — {formatPKR(v.price)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center rounded-xl border border-[#2C1A12]/15 bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                      className="w-10 h-11 flex items-center justify-center text-[#2C1A12] hover:bg-[#FAF5EB] rounded-l-xl"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span
                      className="w-10 text-center text-sm font-semibold tabular-nums"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(25, q + 1))}
                      aria-label="Increase quantity"
                      className="w-10 h-11 flex items-center justify-center text-[#2C1A12] hover:bg-[#FAF5EB] rounded-r-xl"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => {
                      onAddToCart(product, activeVariant.label, activeVariant.price, quantity);
                      onClose();
                    }}
                    className="flex-1 min-w-[170px] h-11 px-5 rounded-xl bg-[#2C1A12] text-[#FFFDF9] text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#44291D] disabled:opacity-45 transition-colors whitespace-nowrap"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#E5A93B]" />
                    <span>{isAvailable ? 'Add to Bag' : 'Currently Sold Out'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleWishlist(product.id)}
                    aria-label="Toggle wishlist"
                    className="w-11 h-11 rounded-xl border border-[#2C1A12]/15 flex items-center justify-center hover:bg-[#FAF5EB]"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isWishlisted ? 'fill-[#D96B27] text-[#D96B27]' : 'text-[#5C4335]'
                      }`}
                    />
                  </button>
                </div>

                <a
                  href={quickWhatsAppHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 rounded-xl border border-[#2C1A12]/15 bg-[#FAF5EB] hover:bg-[#F3E9D4] text-[#2C1A12] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#1E7E45]" />
                  <span>Direct Inquiry / Order This Item on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
