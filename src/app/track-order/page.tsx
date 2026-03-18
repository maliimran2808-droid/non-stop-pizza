'use client';
import OrderReceipt from '@/components/OrderReceipt';
import { usePrint } from '@/hooks/usePrint';
import { FiPrinter } from 'react-icons/fi';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { Order, OrderItem } from '@/types';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiArrowLeft,
  FiPackage,
  FiCheck,
  FiClock,
  FiTruck,
  FiMapPin,
  FiPhone,
  FiUser,
} from 'react-icons/fi';

const statusSteps = [
  { key: 'received', label: 'Order Received', icon: FiPackage, emoji: '📦' },
  { key: 'confirmed', label: 'Confirmed', icon: FiCheck, emoji: '✅' },
  { key: 'preparing', label: 'Preparing', icon: FiClock, emoji: '👨‍🍳' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: FiTruck, emoji: '🚗' },
  { key: 'delivered', label: 'Delivered', icon: FiMapPin, emoji: '🎉' },
];

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const { receiptRef, handlePrint } = usePrint();

  // Check URL for order number
  useEffect(() => {
    const urlOrder = searchParams.get('order');
    if (urlOrder) {
      setOrderNumber(urlOrder);
      searchOrder(urlOrder);
    }
  }, [searchParams]);

  // Animate on mount
  useEffect(() => {
    gsap.fromTo(
      '.track-section',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
    );
  }, []);

  // Search order
  const searchOrder = async (number?: string) => {
    const searchNum = number || orderNumber;
    if (!searchNum.trim()) {
      toast.error('Please enter an order number');
      return;
    }

    setIsSearching(true);
    setSearched(true);

    try {
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', searchNum.trim().toUpperCase())
        .single();

      if (orderError || !orderData) {
        setOrder(null);
        setOrderItems([]);
        setIsSearching(false);
        return;
      }

      setOrder(orderData);

      // Fetch order items with product details
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*, product:products(name, image_url)')
        .eq('order_id', orderData.id);

      if (itemsData) setOrderItems(itemsData);

      // Animate results
      setTimeout(() => {
        gsap.fromTo(
          '.order-result',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
        );
      }, 100);
    } catch (err) {
      console.error('Track error:', err);
      toast.error('Something went wrong');
    }

    setIsSearching(false);
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!order) return;

    const channel = supabase
      .channel(`order-${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          setOrder(payload.new as Order);
          toast.success('Order status updated! 🔄');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order]);

  // Get current status index
  const getCurrentStatusIndex = () => {
    if (!order) return -1;
    if (order.order_status === 'cancelled') return -1;
    return statusSteps.findIndex((s) => s.key === order.order_status);
  };

  const currentIndex = getCurrentStatusIndex();

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen pb-10">
      {/* Header */}
      <div
        className="track-section py-4"
       
      >
        <div className="container-custom flex justify-center text-center items-center gap-4">
      
          <div>
             <h1
              className="lg:text-[3rem] sm:text-2xl"
              style={{ color: 'var(--text-primary)' , fontFamily:'Poppins'}}
            >
              Track Your Order
            </h1>
           <p
              className="text-xs sm:text-sm"
              style={{ color: 'var(--text-secondary)' , fontFamily:'Poppins'}}
            >
              Enter your order number to track status
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom mt-6">
        {/* Search Box */}
        <div
          className="track-section mx-auto max-w-xl rounded-2xl p-2"
     
        >
          <div className="flex gap-3" style={{fontFamily:'Poppins'}}>
            <input
              type="text"
              className="input-field flex-1 uppercase"
              placeholder="Enter Order Number (e.g., 3ADXXXX)"
          style={{backgroundColor:'var(--input-checkout)', borderColor:'var(--input-checkcolor)'}}
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && searchOrder()}
            />
            <button
              onClick={() => searchOrder()}
              disabled={isSearching}
              className="btn-primary flex items-center gap-2 rounded-xl px-6"
            >
              {isSearching ? (
                <div className="spinner h-5 w-5" />
              ) : (
                <>
                  <FiSearch size={16} />
                  <span className="hidden sm:inline">Track</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Order Not Found */}
        {searched && !order && !isSearching && (
          <div className="mt-10 text-center" style={{fontFamily:'Poppins'}}>
            <span className="text-5xl">🔍</span>
            <h3
              className="mt-4 text-xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              Order Not Found
            </h3>
            <p
              className="mt-2 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Please check your order number and try again
            </p>
          </div>
        )}

        {/* Order Found */}
        {order && (
          <div className="order-result mt-6">
            <div className="flex flex-col items-center justify-center gap-6">
              {/* LEFT - Status Timeline */}
              <div className="lg:col-span-2 w-full">
                {/* Order Info Bar */}
          {/* Order Info Bar */}
<div
  className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
  style={{
    backgroundColor: 'var(--checkout-page)',
    border: '1px solid var(--border-color)',
    fontFamily:'Poppins',
  }}
>
  <div>
    <p
      className="text-xs"
      style={{ color: 'var(--text-secondary)' }}
    >
      Order Number
    </p>
    <p className="text-lg font-bold text-primary-600">
      {order.order_number}
    </p>
  </div>
  <div>
    <p
      className="text-xs"
      style={{ color: 'var(--text-secondary)' }}
    >
      Placed On
    </p>
    <p
      className="text-sm font-medium"
      style={{ color: 'var(--text-primary)' }}
    >
      {formatDate(order.created_at)}
    </p>
  </div>
  <div>
    <p
      className="text-xs"
      style={{ color: 'var(--text-secondary)' }}
    >
      Payment
    </p>
    <span
      className={`badge ${
        order.payment_status === 'paid'
          ? 'badge-green'
          : order.payment_status === 'failed'
          ? 'badge-red'
          : 'badge-yellow'
      }`}
    >
      {order.payment_status.toUpperCase()}
    </span>
  </div>
  <div>
    <p
      className="text-xs"
      style={{ color: 'var(--text-secondary)' }}
    >
      Total
    </p>
    <p className="text-lg font-bold text-primary-600">
      Rs. {order.total.toLocaleString()}
    </p>
  </div>
  {/* Print Button */}
  <button
    onClick={handlePrint}
    className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-700 hover:shadow-lg"
  >
    <FiPrinter size={16} />
    <span>Print</span>
  </button>
</div>
                                 </div>

                {/* Cancelled Order */}
                {order.order_status === 'cancelled' && (
                  <div className="mt-4 rounded-2xl border-2 border-red-300 bg-red-50 p-6 text-center">
                    <span className="text-4xl">❌</span>
                    <h3 className="mt-2 text-lg font-bold text-red-600">
                      Order Cancelled
                    </h3>
                    <p className="mt-1 text-sm text-red-500">
                      This order has been cancelled. Please contact us for more details.
                    </p>
                  </div>
                )}

                {/* Status Timeline */}
                {order.order_status !== 'cancelled' && (
                  <div
                    className="mt-4 w-full rounded-2xl p-6"
                    style={{
                      backgroundColor: 'var(--checkout-page)',
                      fontFamily:'Poppins',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <h3
                      className="mb-6 text-lg font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Order Status
                    </h3>

                    <div className="space-y-0 flex justify-between tracking-situation lg:flex-row sm:flex-col">
                      {statusSteps.map((step, index) => {
                        const isCompleted = index < currentIndex;
                        const isActive = index === currentIndex;
                        const isPending = index > currentIndex;

                        return (
                          <div key={step.key} className="flex gap-4">
                            {/* Timeline Line + Dot */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all ${
                                  isCompleted
                                    ? 'bg-green-500 text-white'
                                    : isActive
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                                    : ''
                                }`}
                                style={
                                  isPending
                                    ? {
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '2px solid var(--border-color)',
                                      }
                                    : {}
                                }
                              >
                                {isCompleted ? (
                                  <FiCheck size={20} />
                                ) : (
                                  <span className="text-base">{step.emoji}</span>
                                )}
                              </div>

                              {/* Line */}
                        
                            </div>

                            {/* Content */}
                            <div className="pb-8">
                              <p
                                className={`text-sm font-semibold ${
                                  isCompleted
                                    ? 'text-green-600'
                                    : isActive
                                    ? 'text-primary-600'
                                    : ''
                                }`}
                                style={
                                  isPending
                                    ? { color: 'var(--text-secondary)' }
                                    : {}
                                }
                              >
                                {step.label}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                {isCompleted
                                  ? '✓ Completed'
                                  : isActive
                                  ? 'Your order has been delivered ✅...'
                                  : 'Pending'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              
              </div>
  {/* Order Items */}
                <div
                  className="mt-4 mb-4 rounded-2xl p-5"
                  style={{
                    backgroundColor: 'var(--checkout-page)',
                    border: '1px solid var(--border-color)',
                    fontFamily:'Poppins',
                  }}
                >
                  <h3
                    className="mb-4 text-lg font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Order Items
                  </h3>

                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="mb-3 flex items-center gap-3 rounded-xl p-3"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg">
                        {item.product && (item.product as unknown as { image_url: string }).image_url ? (
                          <img
                            src={(item.product as unknown as { image_url: string }).image_url}
                            alt={(item.product as unknown as { name: string }).name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary-100">
                            <span className="text-lg">🍕</span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4
                          className="truncate text-sm font-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {item.product
                            ? (item.product as unknown as { name: string }).name
                            : 'Product'}
                        </h4>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {item.variant_name} × {item.quantity}
                        </p>
                      </div>

                      <span
                        className="text-sm font-bold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Rs. {item.total_price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              {/* RIGHT - Delivery Details */}
              <div className="lg:col-span-1">
                <div
                  className="rounded-2xl p-5"
                  style={{
                    backgroundColor: 'var(--checkout-page)',
                    border: '1px solid var(--border-color)',
                    fontFamily:'Poppins',
                  }}
                >
                  <h3
                    className="mb-4 text-lg font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Delivery Details
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <FiUser size={16} className="mt-0.5 text-primary-600" />
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          Name
                        </p>
                        <p
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {order.customer_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FiPhone size={16} className="mt-0.5 text-primary-600" />
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          Phone
                        </p>
                        <p
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {order.customer_phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FiMapPin size={16} className="mt-0.5 text-primary-600" />
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          Address
                        </p>
                        <p
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {order.address}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {order.area}
                          {order.landmark && ` • Near ${order.landmark}`}
                        </p>
                      </div>
                    </div>

                    {order.delivery_instructions && (
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-sm">📝</span>
                        <div>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Instructions
                          </p>
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {order.delivery_instructions}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Summary */}
                  <div
                    className="mt-5 h-px"
                    style={{ backgroundColor: 'var(--border-color)' }}
                  />

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Subtotal
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        Rs. {order.subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Delivery Fee
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        Rs. {order.delivery_fee.toLocaleString()}
                      </span>
                    </div>
                    <div
                      className="h-px"
                      style={{ backgroundColor: 'var(--border-color)' }}
                    />
                    <div className="flex justify-between">
                      <span
                        className="font-bold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Total
                      </span>
                      <span className="text-lg font-extrabold text-primary-600">
                        Rs. {order.total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary-600 p-3">
                    <span className="text-lg text-white">
                      {order.payment_method === 'cod' ? '💵' : '💳'}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {order.payment_method === 'cod'
                        ? 'Cash on Delivery'
                        : 'Card Payment'}
                    </span>
                  </div>
                </div>
              </div>
                     <OrderReceipt
              ref={receiptRef}
              order={order}
              orderItems={orderItems}
            />
            </div>
      
        )}
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="spinner h-10 w-10 text-primary-600" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}