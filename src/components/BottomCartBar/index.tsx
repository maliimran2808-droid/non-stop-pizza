'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { FiShoppingCart, FiChevronUp, FiChevronDown, FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';

const BottomCartBar = () => {
    const pathname = usePathname();
  const {
    items,
    getTotalItems,
    getSubtotal,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCartStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const totalItems = getTotalItems();
  const subtotal = getSubtotal();
  // Hide on admin and checkout pages
//   if (pathname.startsWith('/admin') || pathname === '/checkout') return null;
  // Animate bar in/out based on cart items
  useEffect(() => {
    if (!barRef.current) return;

    if (totalItems > 0) {
      gsap.fromTo(
        barRef.current,
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
      );
    } else {
      gsap.to(barRef.current, {
        y: 100,
        opacity: 0,
        duration: 0.3,
        ease: 'power3.in',
      });
      setIsExpanded(false);
    }
  }, [totalItems]);

  // Animate expanded view
  useEffect(() => {
    if (!expandedRef.current) return;

    if (isExpanded) {
      document.body.style.overflow = 'hidden';
      gsap.fromTo(
        expandedRef.current,
        { y: '100%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.4, ease: 'power3.out' }
      );
    } else {
      document.body.style.overflow = '';
      gsap.to(expandedRef.current, {
        y: '100%',
        opacity: 0,
        duration: 0.3,
        ease: 'power3.in',
      });
    }
  }, [isExpanded]);

  // Handle checkout
  const handleCheckout = () => {
    setIsExpanded(false);
    document.body.style.overflow = '';
    router.push('/checkout');
  };

  // Hide on admin and checkout pages, or when cart is empty
  if (pathname.startsWith('/admin') || pathname === '/checkout' || totalItems === 0) {
    return (
      <div
        ref={barRef}
        className="fixed bottom-0 left-0 right-0 z-30 translate-y-[100px] opacity-0"
      />
    );
  }

  return (
    <>
      {/* Expanded Cart View Overlay */}
      {isExpanded && (
       <div
  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
  onClick={() => {
    setIsExpanded(false);
    document.body.style.overflow = '';
  }}
/>
      )}

      {/* Expanded Cart Panel */}
      <div
        ref={expandedRef}
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] translate-y-full overflow-hidden rounded-t-3xl shadow-2xl"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2">
            <FiShoppingCart size={20} className="text-primary-600" />
            <h3
              className="text-lg font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              Your Cart
            </h3>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
              {totalItems}
            </span>
          </div>
          <div className="flex items-center gap-3">
        <button
  onClick={() => {
    clearCart();
    setIsExpanded(false);
    document.body.style.overflow = '';
  }}
  className="flex items-center gap-1 text-sm font-medium text-red-500 transition-all hover:text-red-700"
>
  <FiTrash2 size={14} />
  Clear
</button>
            <button
              onClick={() => setIsExpanded(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-gray-100"
              style={{ color: 'var(--text-primary)' }}
            >
              <FiChevronDown size={22} />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="max-h-[45vh] overflow-y-auto p-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="mb-3 flex items-center gap-3 rounded-xl p-3"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              {/* Image */}
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl">
                {item.product.image_url ? (
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary-100">
                    <span className="text-xl">🍕</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h4
                  className="truncate text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.product.name}
                </h4>
                <p className="text-xs text-primary-600 font-medium">
                  {item.variant.name} — Rs. {item.variant.price}
                </p>
                {item.special_instructions && (
                  <p
                    className="mt-0.5 truncate text-[10px] italic"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    &quot;{item.special_instructions}&quot;
                  </p>
                )}
              </div>

              {/* Quantity Controls */}
              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:bg-primary-100"
                  style={{
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <FiMinus size={12} />
                </button>
                <span
                  className="min-w-[20px] text-center text-sm font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-white transition-all hover:bg-primary-700"
                >
                  <FiPlus size={12} />
                </button>
              </div>

              {/* Item Total */}
              <div className="flex-shrink-0 text-right">
                <span
                  className="text-sm font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Rs. {(item.variant.price * item.quantity).toLocaleString()}
                </span>
              </div>

              {/* Remove */}
            <button
  onClick={() => {
    removeFromCart(item.id);
    if (items.length <= 1) {
      setIsExpanded(false);
      document.body.style.overflow = '';
    }
  }}
  className="flex-shrink-0 text-red-400 transition-all hover:text-red-600"
>
  <FiTrash2 size={14} />
</button>
            </div>
          ))}
        </div>

        {/* Footer - Subtotal + Checkout */}
        <div
          className="border-t p-4"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Subtotal
            </span>
            <span
              className="text-lg font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              Rs. {subtotal.toLocaleString()}
            </span>
          </div>
          <button
            onClick={handleCheckout}
            className="btn-primary w-full rounded-xl py-4 text-base font-bold"
          >
            Proceed to Checkout →
          </button>
        </div>
      </div>

      {/* Bottom Bar (Collapsed) */}
      {!isExpanded && (
        <div
          ref={barRef}
          className="fixed bottom-0 left-0 right-0 z-30 p-3 sm:p-4"
        >
          <div
            className="container-custom flex cursor-pointer items-center justify-between rounded-2xl px-4 py-3 shadow-2xl transition-all duration-300 hover:shadow-3xl sm:px-6 sm:py-4"
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '2px solid var(--border-color)',
            }}
            onClick={() => setIsExpanded(true)}
          >
            {/* Left - Items count */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white">
                  <FiShoppingCart size={18} />
                </div>
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-black">
                  {totalItems}
                </span>
              </div>
              <div>
                <p
                  className="text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </p>
                <p
                  className="text-base font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Rs. {subtotal.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Middle - View Cart */}
            <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
              <span className="text-xs font-medium">View Cart</span>
              <FiChevronUp size={16} />
            </div>

            {/* Right - Checkout Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCheckout();
              }}
              className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-700 hover:shadow-lg"
            >
              Checkout →
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomCartBar;