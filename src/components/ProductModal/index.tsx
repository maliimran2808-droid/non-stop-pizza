'use client';

import { useState, useEffect, useRef } from 'react';
import { Product, ProductVariant } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/lib/supabase-client';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import { FiX, FiMinus, FiPlus, FiShoppingCart } from 'react-icons/fi';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductModal = ({ product, isOpen, onClose }: ProductModalProps) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCartStore();

  // Set default variant when product changes
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const defaultVariant = product.variants.find((v) => v.is_default) || product.variants[0];
      setSelectedVariant(defaultVariant);
    } else if (product) {
      // Create a default variant from base price
      setSelectedVariant({
        id: 'default',
        product_id: product.id,
        name: 'Regular',
        price: product.base_price,
        is_default: true,
        created_at: '',
      });
    }
    setQuantity(1);
    setSpecialInstructions('');
  }, [product]);

  // Fetch suggestions
  useEffect(() => {
    if (!product) return;

    const fetchSuggestions = async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('*, variants:product_variants(*)')
          .eq('is_active', true)
          .neq('id', product.id)
          .eq('category_id', product.category_id)
          .limit(4);

        if (data && data.length > 0) {
          setSuggestions(data);
        } else {
          // If no same-category products, get random ones
          const { data: randomData } = await supabase
            .from('products')
            .select('*, variants:product_variants(*)')
            .eq('is_active', true)
            .neq('id', product.id)
            .limit(4);

          if (randomData) setSuggestions(randomData);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    };

    fetchSuggestions();
  }, [product]);

  // Animate open
  useEffect(() => {
    if (isOpen && modalRef.current && overlayRef.current) {
      document.body.style.overflow = 'hidden';

      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );

      gsap.fromTo(
        modalRef.current,
        { y: '100%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, [isOpen]);

  // Handle close with animation
  const handleClose = () => {
    if (modalRef.current && overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
      });

      gsap.to(modalRef.current, {
        y: '100%',
        opacity: 0,
        duration: 0.3,
        ease: 'power3.in',
        onComplete: () => {
          document.body.style.overflow = '';
          onClose();
        },
      });
    } else {
      document.body.style.overflow = '';
      onClose();
    }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    addToCart(product, selectedVariant, quantity, specialInstructions);
    toast.success(`${product.name} added to cart! 🍕`, {
      icon: '🛒',
    });
    handleClose();
  };

  // Handle suggestion click
  const handleSuggestionAdd = (sugProduct: Product) => {
    const defaultVariant =
      sugProduct.variants?.find((v) => v.is_default) ||
      sugProduct.variants?.[0] || {
        id: 'default',
        product_id: sugProduct.id,
        name: 'Regular',
        price: sugProduct.base_price,
        is_default: true,
        created_at: '',
      };

    addToCart(sugProduct, defaultVariant, 1, '');
    toast.success(`${sugProduct.name} added to cart!`, {
      icon: '✅',
    });
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-3xl shadow-2xl sm:max-w-lg sm:rounded-3xl"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition-all hover:bg-black/60"
        >
          <FiX size={18} />
        </button>

        {/* Product Image */}
        <div className="relative h-52 w-full overflow-hidden rounded-t-3xl sm:h-64 sm:rounded-t-3xl">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
              <span className="text-7xl">🍕</span>
            </div>
          )}

          {product.is_new_arrival && (
            <div className="absolute left-4 top-4 rounded-full bg-primary-600 px-3 py-1 text-xs font-bold uppercase text-white">
              New
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6">
          {/* Name & Description */}
          <h2
            className="text-xl font-bold sm:text-2xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {product.name}
          </h2>
          {product.description && (
            <p
              className="mt-1 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              {product.description}
            </p>
          )}

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mt-5">
              <h3
                className="mb-2 text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Choose Size
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                      selectedVariant?.id === variant.id
                        ? 'bg-primary-600 text-white shadow-md'
                        : ''
                    }`}
                    style={
                      selectedVariant?.id !== variant.id
                        ? {
                            backgroundColor: 'var(--input-bg)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                          }
                        : {}
                    }
                  >
                    <span>{variant.name}</span>
                    <span className="ml-2 font-bold">Rs. {variant.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="mt-5">
            <h3
              className="mb-2 text-sm font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Special Instructions (Optional)
            </h3>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="E.g., Extra cheese, no onions, less spicy..."
              rows={2}
              className="input-field resize-none"
            />
          </div>

          {/* Quantity */}
          <div className="mt-5 flex items-center justify-between">
            <h3
              className="text-sm font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Quantity
            </h3>
            <div
              className="flex items-center gap-3 rounded-full px-2 py-1"
              style={{
                backgroundColor: 'var(--input-bg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-primary-100"
                style={{ color: 'var(--text-primary)' }}
              >
                <FiMinus size={16} />
              </button>
              <span
                className="min-w-[24px] text-center text-base font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white transition-all hover:bg-primary-700"
              >
                <FiPlus size={16} />
              </button>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-6">
              <h3
                className="mb-3 text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                🍟 You might also like
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {suggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className="flex min-w-[140px] flex-shrink-0 flex-col overflow-hidden rounded-xl"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div className="relative h-20 w-full overflow-hidden">
                      {sug.image_url ? (
                        <img
                          src={sug.image_url}
                          alt={sug.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                          <span className="text-2xl">🍕</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p
                        className="truncate text-xs font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {sug.name}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs font-bold text-primary-600">
                          Rs. {sug.base_price}
                        </span>
                        <button
                          onClick={() => handleSuggestionAdd(sug)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white transition-all hover:bg-primary-700"
                        >
                          <FiPlus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base"
          >
            <FiShoppingCart size={18} />
            <span>
              Add to Cart — Rs.{' '}
              {selectedVariant
                ? (selectedVariant.price * quantity).toLocaleString()
                : (product.base_price * quantity).toLocaleString()}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;