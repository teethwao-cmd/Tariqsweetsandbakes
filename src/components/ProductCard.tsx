import React, { useState } from 'react';
import { Heart, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import type { Product } from '../types.ts';
import { formatPKR } from '../utils/formatters.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product, variantLabel: string, unitPrice: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  onToggleWishlist,
  onSelectProduct,
  onQuickAdd,
}) => {
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const activeVariant = product.variants[selectedVariantIdx] || {
    label: 'Standard',
    price: product.price,
  };
  const isAvailable = product.available && product.stock > 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;
    onQuickAdd(product, activeVariant.label, activeVariant.price);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1100);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      onClick={() => onSelectProduct(product)}
      className="group cursor-pointer rounded-2xl bg-white border border-[#2C1A12]/10 overflow-hidden shadow-[0_4px_18px_rgba(44,26,18,0.04)] hover:shadow-[0_12px_30px_rgba(44,26,18,0.09)] transition-shadow duration-200 flex flex-col"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#FAF5EB]">
        <ResilientImage
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-[#FFFDF9]/90 backdrop-blur-sm border border-[#2C1A12]/10 flex items-center justify-center text-[#2C1A12] hover:bg-white transition-colors focus-visible:outline-2 focus-visible:outline-[#D4941A]"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'fill-[#D96B27] text-[#D96B27]' : 'text-[#5C4335]'
            }`}
          />
        </button>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-[#6B4E3D] mb-1.5">
            <span className="uppercase tracking-wider font-medium">{product.category}</span>
            <span aria-hidden="true">·</span>
            <span className={isAvailable ? 'text-[#5C4335]' : 'text-[#A63A2B] font-medium'}>
              {isAvailable ? (product.bestSeller ? 'Best Seller' : 'Fresh Today') : 'Sold Out'}
            </span>
          </div>

          <h3
            className="text-base font-semibold text-[#2C1A12] leading-snug group-hover:text-[#9A650B] transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {product.name}
          </h3>

          <p className="mt-1.5 text-sm text-[#5C4335] line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-3 border-t border-[#2C1A12]/8 space-y-3">
          {product.variants.length > 1 && (
            <div
              className="flex flex-wrap gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {product.variants.map((variant, idx) => (
                <button
                  key={variant.label}
                  type="button"
                  onClick={() => setSelectedVariantIdx(idx)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                    idx === selectedVariantIdx
                      ? 'bg-[#FAF5EB] border-[#D4941A] text-[#2C1A12] font-semibold'
                      : 'bg-transparent border-[#2C1A12]/12 text-[#5C4335] hover:border-[#2C1A12]/30'
                  }`}
                >
                  {variant.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div>
              <p
                className="text-base font-semibold text-[#2C1A12] tabular-nums"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {formatPKR(activeVariant.price)}
              </p>
              <p className="text-xs text-[#6B4E3D]">{activeVariant.label}</p>
            </div>

            <button
              type="button"
              disabled={!isAvailable}
              onClick={handleQuickAdd}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 min-h-[40px] ${
                !isAvailable
                  ? 'bg-[#2C1A12]/10 text-[#6B4E3D] cursor-not-allowed'
                  : justAdded
                  ? 'bg-[#D4941A] text-[#2C1A12]'
                  : 'bg-[#2C1A12] text-[#FFFDF9] hover:bg-[#44291D]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{!isAvailable ? 'Out of Stock' : justAdded ? 'Added' : 'Add to Cart'}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
};
