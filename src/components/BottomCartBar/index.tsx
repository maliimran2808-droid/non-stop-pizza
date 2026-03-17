'use client';

import { useEffect, useRef, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { Product } from '@/types';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import {
  FiShoppingCart,
  FiX,
  FiTrash2,
  FiMinus,
  FiPlus,
  FiArrowLeft,
  FiShoppingBag,
} from 'react-icons/fi';

const BottomCartBar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const {
    items,
    getTotalItems,
    getSubtotal,
    removeFromCart,
    updateQuantity,
    clearCart,
    addToCart,
  } = useCartStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(150);
  const barRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const totalItems = getTotalItems();
  const subtotal = getSubtotal();
  const total = subtotal + deliveryFee;

  // Fetch delivery fee
  useEffect(() => {
    const fetchFee = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'delivery_fee')
          .single();
        if (data) setDeliveryFee(Number(data.value));
      } catch (err) {
        console.log('Using default delivery fee');
      }
    };
    fetchFee();
  }, []);

  // Fetch suggestions based on cart items
  useEffect(() => {
    if (items.length === 0) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const cartProductIds = items.map((item) => item.product.id);
        const cartCategoryIds = [...new Set(items.map((item) => item.product.category_id))];

        const { data } = await supabase
          .from('products')
          .select('*, variants:product_variants(*)')
          .eq('is_active', true)
          .eq('is_in_stock', true)
          .in('category_id', cartCategoryIds)
          .not('id', 'in', `(${cartProductIds.join(',')})`)
          .limit(6);

        if (data && data.length > 0) {
          setSuggestions(data);
        } else {
          // Get random products if no same-category matches
          const { data: randomData } = await supabase
            .from('products')
            .select('*, variants:product_variants(*)')
            .eq('is_active', true)
            .eq('is_in_stock', true)
            .not('id', 'in', `(${cartProductIds.join(',')})`)
            .limit(6);

          if (randomData) setSuggestions(randomData);
        }
      } catch (err) {
        console.log('Suggestions error');
      }
    };

    fetchSuggestions();
  }, [items]);

  // Animate bar
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
      setIsSidebarOpen(false);
    }
  }, [totalItems]);

  // Open sidebar with animation
  const openSidebar = () => {
    setIsSidebarOpen(true);
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      if (sidebarRef.current) {
        gsap.fromTo(
          sidebarRef.current,
          { x: '100%' },
          { x: '0%', duration: 0.4, ease: 'power3.out' }
        );
      }
    }, 10);
  };

  // Close sidebar with animation
  const closeSidebar = () => {
    if (sidebarRef.current) {
      gsap.to(sidebarRef.current, {
        x: '100%',
        duration: 0.3,
        ease: 'power3.in',
        onComplete: () => {
          setIsSidebarOpen(false);
          document.body.style.overflow = '';
        },
      });
    } else {
      setIsSidebarOpen(false);
      document.body.style.overflow = '';
    }
  };

  // Handle add suggestion to cart
  const handleAddSuggestion = (product: Product) => {
    const defaultVariant =
      product.variants?.find((v) => v.is_default) ||
      product.variants?.[0] || {
        id: 'default',
        product_id: product.id,
        name: 'Regular',
        price: product.base_price,
        is_default: true,
        created_at: '',
      };

    addToCart(product, defaultVariant, 1, '');
    toast.success(`${product.name} added! 🍕`);
  };

  // Handle checkout
  const handleCheckout = () => {
    closeSidebar();
    setTimeout(() => {
      router.push('/checkout');
    }, 300);
  };

  // Handle add more items
  const handleAddMore = () => {
    closeSidebar();
    setTimeout(() => {
      router.push('/');
    }, 300);
  };

  // Hide on admin and checkout pages
  if (pathname.startsWith('/admin') || pathname === '/checkout' || pathname === '/payment-check') {
    return (
      <div
        ref={barRef}
        className="fixed bottom-0 left-0 right-0 z-30 translate-y-[100px] opacity-0"
      />
    );
  }

  if (totalItems === 0) {
    return (
      <div
        ref={barRef}
        className="fixed bottom-0 left-0 right-0 z-30 translate-y-[100px] opacity-0"
      />
    );
  }

  return (
    <>
      {/* Bottom Cart Bar */}
      <div
        ref={barRef}
        className="fixed w-auto w-[fit-content] mx-auto bottom-[-19] left-0 right-0 z-30 p-3 sm:p-4"
      >
        <div
          className="container-custom  cursor-pointer overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: '#dc2626',
            width:'fit-content',
            gap:'30px',
            borderTopLeftRadius:'10px',
            borderTopRightRadius:'10px',
          }}
          onClick={openSidebar}
        >
          <div className="flex items-center gap-[6rem] justify-between"
          style={{fontFamily:'Salmond', padding:'15px 5px'}}>
            {/* Left — Items Count */}
            <div className="flex relative rounded-full items-center gap-2"
            style={{fontSize:'1.1rem', border:'2px solid white', padding:'14px'}}
            >
             
              <span className="font-bold text-white p-0"
              style={{padding:'0px', position:'absolute', left:'50%', top:'58%', transform:'translate(-50%, -50%)'}}
              >
                {totalItems} 
              </span>
            </div>

            {/* Center — View Cart */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white/90" style={{fontSize:'1rem'}}>
                View Cart
              </span>
              
            </div>

            {/* Right — Total Amount */}
            <span className="text-base font-extrabold text-white sm:text-lg">
              Rs. {subtotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      {isSidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={closeSidebar}
          />

          {/* Sidebar Panel */}
          <div
            ref={sidebarRef}
            className="fixed right-0 top-0 z-50 flex h-full w-full flex-col shadow-2xl sm:w-[420px]"
            style={{ backgroundColor: 'var(--product-model)', transform: 'translateX(100%)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-3">
               
                <div>
                  <h2
                    className="text-lg font-bold"
                    style={{ color: 'var(--text-primary)', fontFamily:'Poppins' }}
                  >
                    Your Cart
                  </h2>
                 
                </div>
              </div>
<div className='flex items-center'>
              <button
                onClick={() => {
                  clearCart();
                  closeSidebar();
                }}
                className="flex items-center gap-1 cursor-pointer rounded-full px-3 py-2.5 text-xs font-medium text-red-500 transition-all hover:bg-primary-600 hover:text-white"
              >
                <FiTrash2 size={20} />

              </button>
               <button
                  onClick={closeSidebar}
                  className="flex h-9 w-9 items-center cursor-pointer justify-center rounded-full transition-all hover:bg-primary-600"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <FiX size={20} />
                </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Cart Items */}
              <div className="p-4">
                <h3
                  className="mb-3"
                  style={{ color: 'var(--text-secondary)', fontFamily:'Poppins' }}
                >
                  Your Order Items
                </h3>

                {items.map((item) => (
                  <div
                    key={item.id}
                    className="mb-3 p-3"
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div className="flex gap-3">
                      {/* Image */}
                      <div className="flex h-auto w-17 flex-shrink-0 items-center justify-center overflow-hidden">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary-100">
                            <span className="text-xl">🍕</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex items-start justify-center" style={{flexDirection:'column'}}>
                        <h4
                          className="truncate"
                          style={{ color: 'var(--text-primary)', fontFamily:'Poppins' }}
                        >
                          {item.product.name}
                        </h4>
                      
                        {item.special_instructions && (
                          <p
                            className="mt-0.5 truncate text-[10px]"
                            style={{ color: 'var(--text-secondary)', fontFamily:'Poppins' }}
                          >
                            &quot;{item.special_instructions}&quot;
                          </p>
                        )}
                      </div>

                      {/* Delete */}
                      <div className='flex justify-center items-center'>
                      <button
                        onClick={() => {
                          removeFromCart(item.id);
                          if (items.length <= 1) {
                            closeSidebar();
                          }
                        }}
                        className="flex-shrink-0 text-red-600 cursor-pointer transition-all hover:text-red-600"
                      >
                        <FiTrash2 size={19} />
                      </button></div>
                    </div>

                    {/* Quantity + Price Row */}
                    <div className="mt-2 flex items-center justify-between">
                      {/* Quantity */}
                      <div
                        className="flex items-center gap-2 px-1 py-0.5"
                        style={{
                          border: '1px solid #dc2626',
                          borderRadius:'20px',
                          fontFamily:'Poppins'
                        }}
                      >
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-all"
                          style={{ color: '#dc2626' }}
                        >
                          <FiMinus size={19} />
                        </button>
                        <span
                          className="min-w-[17px] text-[1.1rem] text-center font-bold"
                          style={{ color: '#dc2626' }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          style={{ color: '#dc2626' }}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center transition-all"
                        >
                          <FiPlus size={19} />
                        </button>
                      </div>

                      {/* Item Total */}
                      <span
                        className="font-bold"
                        style={{ color: 'var(--text-primary)', fontFamily:'Salmond', fontSize:'1rem' }}
                      >
                        Rs. {(item.variant.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Add More Items Button */}
                <button
                  onClick={handleAddMore}
                  className="mt-2 flex w-full text-[1rem] cursor-pointer items-center justify-center gap-2 py-3 text-sm font-medium transition-all"
                  style={{
                    color: 'var(--text-secondary)',
                    fontFamily:'Poppins',
                  
                  }}
                >
                  
                  Add More Items
                  <FiPlus size={16} />
                </button>
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div
                  className="p-4"
                  style={{ borderTop: '1px solid var(--border-color)' }}
                >
                  <h3
                    className="mb-3 text-sm font-semibold"
                   style={{ color: 'var(--text-secondary)', fontFamily:'Poppins' }}
                  >
                    🍟 PEOPLE ALSO ORDER
                  </h3>

                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {suggestions.map((sug) => (
                      <div
                        key={sug.id}
                        className="flex min-w-[130px] flex-shrink-0 flex-col overflow-hidden rounded-xl"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {/* Image */}
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

                        {/* Info */}
                        <div className="p-2">
                          <p
                            className="truncate text-xs font-semibold"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {sug.name}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-xs font-bold text-primary-600">
                              Rs. {sug.base_price}
                            </span>
                            <button
                              onClick={() => handleAddSuggestion(sug)}
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

              {/* Price Breakdown */}
              <div
                className="p-4"
                style={{ borderTop: '1px solid var(--border-color)' }}
              >
                <h3
                  className="mb-3"
           style={{ color: 'var(--text-secondary)', fontFamily:'Poppins' }}
                >
                  Price Details
                </h3>

                <div className="space-y-2" style={{fontFamily:'Poppins'}}>
                  <div className="flex items-center justify-between text-sm" >
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                    </span>
                    <span
                      className="font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Rs. {subtotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Delivery Fee
                    </span>
                    <span
                      className="font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Rs. {deliveryFee.toLocaleString()}
                    </span>
                  </div>

                  <div
                    className="my-2 h-px"
                    style={{ backgroundColor: 'var(--border-color)' }}
                  />

                  <div className="flex items-center justify-between">
                    <span
                      className="text-[1rem]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Grand Total
                    </span>
                    <span className="text-lg font-extrabold text-primary-600">
                      Rs. {total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Spacer for sticky checkout button */}
              <div className="h-24" />
            </div>

            {/* Sticky Checkout Button */}
            <div
              className="sticky bottom-0 left-0 right-0 p-4"
              style={{
                backgroundColor: 'var(--product-details)',
                borderTop: '1px solid var(--border-color)',
              
              }}
            >
              <button
                onClick={handleCheckout}
                
                className="flex w-full items-center justify-center gap-2 py-4 text-[1.13rem] font-bold text-white transition-all"
                  style={{backgroundColor:'#dc2626', fontFamily:'Poppins'}}            
                >
                <span>Checkout</span>
                <span>— Rs. {total.toLocaleString()}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default BottomCartBar;