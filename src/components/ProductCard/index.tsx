'use client';

import { useRef, useEffect } from 'react';
import { Product } from '@/types';
import gsap from 'gsap';
import { FiPlus } from 'react-icons/fi';

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
  index: number;
}

const ProductCard = ({ product, onProductClick, index }: ProductCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    gsap.set(element, { opacity: 0, y: 40 });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(element, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            delay: index * 0.05,
            ease: 'power3.out',
          });
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [index]);

  const isOutOfStock = !product.is_in_stock;

  return (
    <div
      ref={cardRef}
      className={`card cursor-pointer overflow-hidden opacity-0 ${
        isOutOfStock ? 'pointer-events-auto' : ''
      }`}
      onClick={() => !isOutOfStock && onProductClick(product)}
      style={isOutOfStock ? { opacity: 0.7 } : {}}
    >
      {/* Product Image */}
      <div className="relative h-40 w-full overflow-hidden sm:h-48">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className={`h-full w-full object-cover transition-transform duration-500 ${
              isOutOfStock ? 'grayscale' : 'hover:scale-110'
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
            <span className="text-5xl">🍕</span>
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white shadow-lg">
              Out of Stock
            </span>
          </div>
        )}

        {/* New Arrival Badge */}
        {product.is_new_arrival && !isOutOfStock && (
          <div className="absolute left-2 top-2 rounded-full bg-primary-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
            New
          </div>
        )}

        {/* Add Button - Only show if in stock */}
        {!isOutOfStock && (
          <button
            className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-primary-700 sm:h-10 sm:w-10"
            onClick={(e) => {
              e.stopPropagation();
              onProductClick(product);
            }}
          >
            <FiPlus size={20} />
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 sm:p-4">
        <h3
          className="truncate text-sm font-bold sm:text-base"
          style={{ color: 'var(--text-primary)' }}
        >
          {product.name}
        </h3>

        {product.description && (
          <p
            className="mt-1 line-clamp-2 text-xs sm:text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            {product.description}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between">
          <span
            className={`text-base font-extrabold sm:text-lg ${
              isOutOfStock ? 'line-through opacity-50' : 'text-primary-600'
            }`}
            style={isOutOfStock ? { color: 'var(--text-secondary)' } : {}}
          >
            Rs. {product.base_price}
          </span>

          {isOutOfStock ? (
            <span className="text-xs font-semibold text-red-500">
              Unavailable
            </span>
          ) : (
            product.variants &&
            product.variants.length > 1 && (
              <span
                className="text-[10px] font-medium sm:text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                {product.variants.length} sizes
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;