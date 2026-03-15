'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Order, OrderItem } from '@/types';
import { playNotificationSound, startAlarm, stopAlarm } from '@/lib/notification-sound';
import OrderReceipt from '@/components/OrderReceipt';
import { usePrint } from '@/hooks/usePrint';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import {
  FiEye,
  FiPrinter,
  FiCheck,
  FiX,
  FiClock,
  FiTruck,
  FiPackage,
  FiFilter,
  FiRefreshCw,
  FiChevronDown,
} from 'react-icons/fi';

type OrderStatus = 'received' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed';

const statusOptions: { value: OrderStatus; label: string; color: string; emoji: string }[] = [
  { value: 'received', label: 'Received', color: 'badge-yellow', emoji: '📦' },
  { value: 'confirmed', label: 'Confirmed', color: 'badge-blue', emoji: '✅' },
  { value: 'preparing', label: 'Preparing', color: 'badge-blue', emoji: '👨‍🍳' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'badge-yellow', emoji: '🚗' },
  { value: 'delivered', label: 'Delivered', color: 'badge-green', emoji: '🎉' },
  { value: 'cancelled', label: 'Cancelled', color: 'badge-red', emoji: '❌' },
];

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const { receiptRef, handlePrint } = usePrint();
  const detailRef = useRef<HTMLDivElement>(null);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data);
        const unread = data.filter((o) => !o.is_read);
        setUnreadCount(unread.length);

        // Start alarm if there are unread orders
        if (unread.length > 0) {
          startAlarm();
        } else {
          stopAlarm();
        }
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    }
    setIsLoading(false);
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders();

    return () => {
      stopAlarm();
    };
  }, []);

  // Filter orders
  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((o) => o.order_status === filterStatus));
    }
  }, [orders, filterStatus]);

  // Subscribe to real-time new orders
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newOrder = payload.new as Order;
          setOrders((prev) => [newOrder, ...prev]);
          setUnreadCount((prev) => prev + 1);
          playNotificationSound();
          startAlarm();
          toast.success(`🔔 New Order: ${newOrder.order_number}`, {
            duration: 10000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const updated = payload.new as Order;
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? updated : o))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Mark order as read
  const markAsRead = async (order: Order) => {
    if (!order.is_read) {
      await supabase
        .from('orders')
        .update({ is_read: true })
        .eq('id', order.id);

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, is_read: true } : o))
      );

      setUnreadCount((prev) => {
        const newCount = Math.max(0, prev - 1);
        if (newCount === 0) stopAlarm();
        return newCount;
      });
    }
  };

  // View order details
  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    markAsRead(order);

    // Fetch order items
    const { data } = await supabase
      .from('order_items')
      .select('*, product:products(name, image_url)')
      .eq('order_id', order.id);

    if (data) setOrderItems(data);
    setIsDetailOpen(true);

    setTimeout(() => {
      if (detailRef.current) {
        gsap.fromTo(
          detailRef.current,
          { x: '100%', opacity: 0 },
          { x: '0%', opacity: 1, duration: 0.4, ease: 'power3.out' }
        );
      }
    }, 10);
  };

  // Close detail panel
  const closeDetail = () => {
    if (detailRef.current) {
      gsap.to(detailRef.current, {
        x: '100%',
        opacity: 0,
        duration: 0.3,
        ease: 'power3.in',
        onComplete: () => {
          setIsDetailOpen(false);
          setSelectedOrder(null);
        },
      });
    }
  };

  // Update order status
 const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          order_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, order_status: newStatus } : o
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, order_status: newStatus } : null
        );
      }

      toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Update payment status
const updatePaymentStatus = async (orderId: string, status: PaymentStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, payment_status: status } : o
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, payment_status: status } : null
        );
      }

      toast.success(`Payment marked as ${status}`);
    } catch (err) {
      toast.error('Failed to update payment');
    }
  };
  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge class
  const getStatusBadge = (status: string) => {
    return statusOptions.find((s) => s.value === status)?.color || 'badge-yellow';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner h-10 w-10 text-primary-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Orders Management 📦
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {orders.length} total orders • {unreadCount} unread
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Unread Badge */}
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-600 animate-pulse">
              🔔 {unreadCount} New Orders!
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={fetchOrders}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-gray-100"
            style={{ color: 'var(--text-primary)' }}
          >
            <FiRefreshCw size={18} />
          </button>

          {/* Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field appearance-none pr-10"
              style={{ minWidth: '160px' }}
            >
              <option value="all">All Orders</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.emoji} {s.label}
                </option>
              ))}
            </select>
            <FiChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-secondary)' }}
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-5xl">📭</span>
            <p
              className="mt-4 text-lg font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              No orders found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Order #
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Customer
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Total
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Payment
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Status
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Date
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={`cursor-pointer transition-all ${
                      !order.is_read ? 'animate-blink font-semibold' : ''
                    }`}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                    }}
                    onClick={() => viewOrder(order)}
                  >
                    <td className="px-4 py-3 font-bold text-primary-600">
                      {!order.is_read && (
                        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" />
                      )}
                      {order.order_number}
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {order.customer_phone}
                        </p>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Rs. {Number(order.total).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          order.payment_status === 'paid'
                            ? 'badge-green'
                            : order.payment_status === 'failed'
                            ? 'badge-red'
                            : 'badge-yellow'
                        }`}
                      >
                        {order.payment_method === 'cod' ? '💵' : '💳'}{' '}
                        {order.payment_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${getStatusBadge(order.order_status)}`}>
                        {order.order_status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewOrder(order);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600 transition-all hover:bg-primary-200"
                      >
                        <FiEye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Side Panel */}
      {isDetailOpen && selectedOrder && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={closeDetail}
          />

          {/* Panel */}
          <div
            ref={detailRef}
            className="fixed right-0 top-0 z-50 h-full w-full overflow-y-auto shadow-2xl sm:w-[500px]"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            {/* Panel Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div>
                <h2
                  className="text-lg font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {selectedOrder.order_number}
                </h2>
                <p
                  className="text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {formatDate(selectedOrder.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-600 transition-all hover:bg-primary-200"
                >
                  <FiPrinter size={16} />
                </button>
                <button
                  onClick={closeDetail}
                  className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-gray-100"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Order Status Update */}
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <h3
                  className="mb-3 text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Update Order Status
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status.value}
                     onClick={() =>
  updateStatus(selectedOrder.id, status.value)
}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                        selectedOrder.order_status === status.value
                          ? 'bg-primary-600 text-white shadow-md'
                          : ''
                      }`}
                      style={
                        selectedOrder.order_status !== status.value
                          ? {
                              backgroundColor: 'var(--bg-primary)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-color)',
                            }
                          : {}
                      }
                    >
                      <span>{status.emoji}</span>
                      <span>{status.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Status */}
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <h3
                  className="mb-3 text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Payment Status
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Method: {selectedOrder.payment_method === 'cod' ? '💵 COD' : '💳 Card'}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() =>
                      updatePaymentStatus(selectedOrder.id, 'pending')
                    }
                    className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                      selectedOrder.payment_status === 'pending'
                        ? 'bg-yellow-500 text-white'
                        : ''
                    }`}
                    style={
                      selectedOrder.payment_status !== 'pending'
                        ? {
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                          }
                        : {}
                    }
                  >
                    ⏳ Pending
                  </button>
                  <button
                    onClick={() =>
                      updatePaymentStatus(selectedOrder.id, 'paid')
                    }
                    className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                      selectedOrder.payment_status === 'paid'
                        ? 'bg-green-500 text-white'
                        : ''
                    }`}
                    style={
                      selectedOrder.payment_status !== 'paid'
                        ? {
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                          }
                        : {}
                    }
                  >
                    ✅ Paid
                  </button>
                  <button
                    onClick={() =>
                      updatePaymentStatus(selectedOrder.id, 'failed')
                    }
                    className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                      selectedOrder.payment_status === 'failed'
                        ? 'bg-red-500 text-white'
                        : ''
                    }`}
                    style={
                      selectedOrder.payment_status !== 'failed'
                        ? {
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                          }
                        : {}
                    }
                  >
                    ❌ Failed
                  </button>
                </div>
              </div>

              {/* Customer Details */}
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <h3
                  className="mb-3 text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Customer Details
                </h3>
                <div className="space-y-2 text-sm">
                  <p style={{ color: 'var(--text-primary)' }}>
                    <strong>Name:</strong> {selectedOrder.customer_name}
                  </p>
                  <p style={{ color: 'var(--text-primary)' }}>
                    <strong>Phone:</strong>{' '}
                    <a
                      href={`tel:${selectedOrder.customer_phone}`}
                      className="text-primary-600 underline"
                    >
                      {selectedOrder.customer_phone}
                    </a>
                  </p>
                  {selectedOrder.customer_email && (
                    <p style={{ color: 'var(--text-primary)' }}>
                      <strong>Email:</strong> {selectedOrder.customer_email}
                    </p>
                  )}
                  <p style={{ color: 'var(--text-primary)' }}>
                    <strong>Address:</strong> {selectedOrder.address}
                  </p>
                  <p style={{ color: 'var(--text-primary)' }}>
                    <strong>Area:</strong> {selectedOrder.area}
                  </p>
                  {selectedOrder.landmark && (
                    <p style={{ color: 'var(--text-primary)' }}>
                      <strong>Landmark:</strong> {selectedOrder.landmark}
                    </p>
                  )}
                  {selectedOrder.delivery_instructions && (
                    <p style={{ color: 'var(--text-primary)' }}>
                      <strong>Instructions:</strong>{' '}
                      {selectedOrder.delivery_instructions}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <h3
                  className="mb-3 text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Order Items
                </h3>

                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="mb-2 flex items-center gap-3 rounded-lg p-2"
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg">
                      {item.product &&
                      (item.product as unknown as { image_url: string })
                        .image_url ? (
                        <img
                          src={
                            (item.product as unknown as { image_url: string })
                              .image_url
                          }
                          alt="product"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary-100">
                          <span>🍕</span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {item.product
                          ? (item.product as unknown as { name: string }).name
                          : 'Product'}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {item.variant_name} × {item.quantity}
                      </p>
                      {item.special_instructions && (
                        <p className="text-[10px] italic text-primary-500">
                          &quot;{item.special_instructions}&quot;
                        </p>
                      )}
                    </div>

                    <span
                      className="text-sm font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Rs. {Number(item.total_price).toLocaleString()}
                    </span>
                  </div>
                ))}

                {/* Totals */}
                <div
                  className="mt-3 space-y-1 border-t pt-3"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Subtotal
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      Rs. {Number(selectedOrder.subtotal).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Delivery Fee
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>
                      Rs. {Number(selectedOrder.delivery_fee).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold">
                    <span style={{ color: 'var(--text-primary)' }}>Total</span>
                    <span className="text-primary-600">
                      Rs. {Number(selectedOrder.total).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden Print Receipt */}
            <OrderReceipt
              ref={receiptRef}
              order={selectedOrder}
              orderItems={orderItems}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrdersPage;