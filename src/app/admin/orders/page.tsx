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
  FiX,
  FiSearch,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiTrash2,
  FiCheck,
  FiClock,
  FiPackage,
  FiTruck,
  FiMapPin,
  FiPhone,
  FiUser,
  FiMail,
  FiShoppingBag,
  FiArrowUpRight,
  FiArrowDownRight,
  FiDownload,
  FiAlertCircle,
} from 'react-icons/fi';

type OrderStatus = 'received' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed';

const statusConfig: { value: OrderStatus; label: string; color: string; bg: string; emoji: string }[] = [
  { value: 'received', label: 'Received', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', emoji: '📦' },
  { value: 'confirmed', label: 'Confirmed', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', emoji: '✅' },
  { value: 'preparing', label: 'Preparing', color: '#A855F7', bg: 'rgba(168,85,247,0.12)', emoji: '👨‍🍳' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: '#F97316', bg: 'rgba(249,115,22,0.12)', emoji: '🚗' },
  { value: 'delivered', label: 'Delivered', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', emoji: '🎉' },
  { value: 'cancelled', label: 'Cancelled', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', emoji: '❌' },
];

const glassStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.07)',
};

const ITEMS_PER_PAGE = 10;

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, delivered: 0, cancelled: 0 });
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

        if (unread.length > 0) startAlarm();
        else stopAlarm();

        // Stats
        setStats({
          total: data.length,
          pending: data.filter((o) => ['received', 'confirmed', 'preparing'].includes(o.order_status)).length,
          delivered: data.filter((o) => o.order_status === 'delivered').length,
          cancelled: data.filter((o) => o.order_status === 'cancelled').length,
        });
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
    }
    setIsLoading(false);

    setTimeout(() => {
      gsap.fromTo('.ord-el', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power3.out' });
    }, 100);
  };

  useEffect(() => { fetchOrders(); return () => { stopAlarm(); }; }, []);

  // Filter orders
  useEffect(() => {
    let result = orders;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q)
      );
    }

    if (filterStatus !== 'all') {
      result = result.filter((o) => o.order_status === filterStatus);
    }

    if (filterPayment !== 'all') {
      result = result.filter((o) => o.payment_status === filterPayment);
    }

    setFilteredOrders(result);
    setCurrentPage(1);
  }, [orders, searchQuery, filterStatus, filterPayment]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new as Order;
        setOrders((prev) => [newOrder, ...prev]);
        setUnreadCount((prev) => prev + 1);
        playNotificationSound();
        startAlarm();
        toast.success(`🔔 New Order: ${newOrder.order_number}`, { duration: 10000 });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const updated = payload.new as Order;
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Mark as read
  const markAsRead = async (order: Order) => {
    if (!order.is_read) {
      await supabase.from('orders').update({ is_read: true }).eq('id', order.id);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, is_read: true } : o)));
      setUnreadCount((prev) => { const n = Math.max(0, prev - 1); if (n === 0) stopAlarm(); return n; });
    }
  };

  // View order detail
  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    markAsRead(order);

    const { data } = await supabase
      .from('order_items')
      .select('*, product:products(name, image_url)')
      .eq('order_id', order.id);

    if (data) setOrderItems(data);
    setIsDetailOpen(true);

    setTimeout(() => {
      if (detailRef.current) {
        gsap.fromTo(detailRef.current, { x: '100%' }, { x: '0%', duration: 0.4, ease: 'power3.out' });
      }
    }, 10);
  };

  // Close detail
  const closeDetail = () => {
    if (detailRef.current) {
      gsap.to(detailRef.current, { x: '100%', duration: 0.3, ease: 'power3.in', onComplete: () => { setIsDetailOpen(false); setSelectedOrder(null); } });
    }
  };

  // Update order status
  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await supabase.from('orders').update({ order_status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, order_status: newStatus } : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, order_status: newStatus } : null);
      toast.success(`Status → ${newStatus.replace(/_/g, ' ')}`);
    } catch { toast.error('Failed to update'); }
  };

  // Update payment status
  const updatePayment = async (orderId: string, status: PaymentStatus) => {
    try {
      await supabase.from('orders').update({ payment_status: status, updated_at: new Date().toISOString() }).eq('id', orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, payment_status: status } : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, payment_status: status } : null);
      toast.success(`Payment → ${status}`);
    } catch { toast.error('Failed to update'); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const getStatus = (s: string) => statusConfig.find((x) => x.value === s) || statusConfig[0];

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="spinner h-8 w-8" style={{ borderColor: '#E8002D', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
      <div style={{ fontFamily: 'var(--font-poppins)' }}>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 ord-el">
        <div>
                  <h1 className="text-2xl font-semibold text-white" style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}>Orders</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold animate-pulse" style={{ backgroundColor: 'rgba(232,0,45,0.15)', color: '#E8002D' }}>
              🔔 {unreadCount} New
            </div>
          )}
          <button onClick={fetchOrders} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-white/5 hover:text-white">
            <FiRefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 ord-el">
        {[
          { label: 'Total Orders', value: stats.total, color: '#E8002D' },
          { label: 'Pending', value: stats.pending, color: '#F59E0B' },
          { label: 'Delivered', value: stats.delivered, color: '#22C55E' },
          { label: 'Cancelled', value: stats.cancelled, color: '#EF4444' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-4" style={{ ...glassStyle }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${s.color}15` }}>
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            </div>
            <p className="mt-3 text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-jetbrains)' }}>{s.value.toLocaleString()}</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3 ord-el">
        <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5" style={{ ...glassStyle, minWidth: '200px' }}>
          <FiSearch size={14} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search orders, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
          />
        </div>

        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none rounded-xl px-4 py-2.5 pr-8 text-xs font-medium text-white outline-none"
            style={{ ...glassStyle }}
          >
            <option value="all" style={{ backgroundColor: '#111' }}>All Status</option>
            {statusConfig.map((s) => (
              <option key={s.value} value={s.value} style={{ backgroundColor: '#111' }}>{s.emoji} {s.label}</option>
            ))}
          </select>
          <FiChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>

        <div className="relative">
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="appearance-none rounded-xl px-4 py-2.5 pr-8 text-xs font-medium text-white outline-none"
            style={{ ...glassStyle }}
          >
            <option value="all" style={{ backgroundColor: '#111' }}>All Payments</option>
            <option value="paid" style={{ backgroundColor: '#111' }}>💚 Paid</option>
            <option value="pending" style={{ backgroundColor: '#111' }}>⏳ Pending</option>
            <option value="failed" style={{ backgroundColor: '#111' }}>❌ Failed</option>
          </select>
          <FiChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl overflow-hidden ord-el" style={{ ...glassStyle }}>
        {paginatedOrders.length === 0 ? (
          <div className="py-20 text-center">
            <FiAlertCircle size={40} className="mx-auto text-gray-700" />
            <p className="mt-4 text-lg font-semibold text-gray-400">No orders found</p>
            <p className="mt-1 text-sm text-gray-600">Try changing your filters</p>
            <button
              onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterPayment('all'); }}
              className="mt-4 rounded-lg px-4 py-2 text-xs font-semibold text-white"
              style={{ backgroundColor: '#E8002D' }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Order ID', 'Customer', 'Amount', 'Payment', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => {
                  const s = getStatus(order.order_status);
                  return (
                    <tr
                      key={order.id}
                      className={`cursor-pointer transition-all hover:bg-red-500/[0.03] ${!order.is_read ? 'animate-pulse' : ''}`}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onClick={() => viewOrder(order)}
                    >
                      {/* Order ID */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {!order.is_read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />}
                          <span className="font-semibold" style={{ color: '#E8002D', fontFamily: 'var(--font-jetbrains)', fontSize: '12px' }}>
                            #{order.order_number}
                          </span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: '#E8002D' }}>
                            {order.customer_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{order.customer_name}</p>
                            <p className="text-[10px] text-gray-500">{order.customer_phone}</p>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-white" style={{ fontFamily: 'var(--font-jetbrains)', fontSize: '13px' }}>
                          Rs. {Number(order.total).toLocaleString()}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3.5">
                        <span
                          className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
                          style={{
                            backgroundColor: order.payment_status === 'paid' ? 'rgba(34,197,94,0.12)' : order.payment_status === 'failed' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                            color: order.payment_status === 'paid' ? '#22C55E' : order.payment_status === 'failed' ? '#EF4444' : '#F59E0B',
                          }}
                        >
                          {order.payment_method === 'cod' ? '💵' : '💳'} {order.payment_status}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase"
                          style={{ backgroundColor: s.bg, color: s.color }}
                        >
                          {s.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-500">{formatDate(order.created_at)}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); viewOrder(order); }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-white/5"
                          style={{ color: '#E8002D' }}
                        >
                          <FiEye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredOrders.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs text-gray-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length} orders
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-white/5 hover:text-white disabled:opacity-30"
              >
                <FiChevronLeft size={14} />
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page = i + 1;
                if (totalPages > 5) {
                  if (currentPage <= 3) page = i + 1;
                  else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                  else page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                      currentPage === page ? 'text-white' : 'text-gray-500 hover:bg-white/5 hover:text-white'
                    }`}
                    style={currentPage === page ? { backgroundColor: '#E8002D' } : {}}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-white/5 hover:text-white disabled:opacity-30"
              >
                <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      {isDetailOpen && selectedOrder && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeDetail} />

          <div
            ref={detailRef}
            className="fixed right-0 top-0 z-50 h-full w-full overflow-y-auto shadow-2xl sm:w-[480px]"
            style={{ backgroundColor: '#0F0F0F', borderLeft: '1px solid rgba(255,255,255,0.07)', transform: 'translateX(100%)' }}
          >
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ backgroundColor: '#0F0F0F', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <h2 className="text-lg font-semibold text-white">Order Details</h2>
                <p className="text-xs font-semibold" style={{ color: '#E8002D', fontFamily: 'var(--font-jetbrains)' }}>#{selectedOrder.order_number}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-white/5" style={{ color: '#E8002D' }}>
                  <FiPrinter size={16} />
                </button>
                <button onClick={closeDetail} className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-white/5 hover:text-white">
                  <FiX size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5">
              {/* Status Update */}
              <div className="rounded-xl p-4" style={{ ...glassStyle }}>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Order Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {statusConfig.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => updateStatus(selectedOrder.id, s.value)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold transition-all ${
                        selectedOrder.order_status === s.value ? 'text-white shadow-lg' : 'text-gray-500'
                      }`}
                      style={
                        selectedOrder.order_status === s.value
                          ? { backgroundColor: '#E8002D' }
                          : { backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }
                      }
                    >
                      <span>{s.emoji}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Status */}
              <div className="rounded-xl p-4" style={{ ...glassStyle }}>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Payment</p>
                <p className="mb-2 text-xs text-gray-400">
                  Method: {selectedOrder.payment_method === 'cod' ? '💵 Cash on Delivery' : '💳 Card Payment'}
                </p>
                <div className="flex gap-2">
                  {(['pending', 'paid', 'failed'] as PaymentStatus[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => updatePayment(selectedOrder.id, p)}
                      className={`flex-1 rounded-lg py-2 text-[11px] font-semibold capitalize transition-all ${
                        selectedOrder.payment_status === p ? 'text-white' : 'text-gray-500'
                      }`}
                      style={
                        selectedOrder.payment_status === p
                          ? { backgroundColor: p === 'paid' ? '#22C55E' : p === 'failed' ? '#EF4444' : '#F59E0B' }
                          : { backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }
                      }
                    >
                      {p === 'pending' ? '⏳' : p === 'paid' ? '✅' : '❌'} {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer */}
              <div className="rounded-xl p-4" style={{ ...glassStyle }}>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Customer</p>
                <div className="space-y-2.5">
                  {[
                    { icon: FiUser, label: selectedOrder.customer_name },
                    { icon: FiPhone, label: selectedOrder.customer_phone, href: `tel:${selectedOrder.customer_phone}` },
                    selectedOrder.customer_email ? { icon: FiMail, label: selectedOrder.customer_email } : null,
                    { icon: FiMapPin, label: `${selectedOrder.address}, ${selectedOrder.area}` },
                    selectedOrder.landmark ? { icon: FiMapPin, label: `Near: ${selectedOrder.landmark}` } : null,
                    selectedOrder.delivery_instructions ? { icon: FiPackage, label: selectedOrder.delivery_instructions } : null,
                  ].filter(Boolean).map((item: any, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <item.icon size={13} className="mt-0.5 flex-shrink-0" style={{ color: '#E8002D' }} />
                      {item.href ? (
                        <a href={item.href} className="text-sm text-white underline">{item.label}</a>
                      ) : (
                        <p className="text-sm text-gray-300">{item.label}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Timeline */}
              <div className="rounded-xl p-4" style={{ ...glassStyle }}>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Timeline</p>
                <div className="space-y-0">
                  {statusConfig.filter(s => s.value !== 'cancelled').map((step, idx) => {
                    const currentIdx = statusConfig.findIndex(s => s.value === selectedOrder.order_status);
                    const stepIdx = statusConfig.findIndex(s => s.value === step.value);
                    const isCompleted = selectedOrder.order_status === 'delivered' || stepIdx < currentIdx;
                    const isActive = stepIdx === currentIdx;

                    return (
                      <div key={step.value} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-full text-[10px]"
                            style={{
                              backgroundColor: isCompleted ? '#22C55E' : isActive ? '#E8002D' : 'rgba(255,255,255,0.05)',
                              color: isCompleted || isActive ? '#fff' : '#555',
                              border: !isCompleted && !isActive ? '1px solid rgba(255,255,255,0.1)' : 'none',
                            }}
                          >
                            {isCompleted ? '✓' : step.emoji}
                          </div>
                          {idx < 4 && (
                            <div className="h-6 w-0.5" style={{ backgroundColor: isCompleted ? '#22C55E' : 'rgba(255,255,255,0.07)' }} />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className={`text-xs font-semibold ${isCompleted ? 'text-green-500' : isActive ? 'text-red-500' : 'text-gray-600'}`}>
                            {step.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items */}
              <div className="rounded-xl p-4" style={{ ...glassStyle }}>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Items</p>
                {orderItems.map((item) => (
                  <div key={item.id} className="mb-2 flex items-center gap-3 rounded-lg p-2" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      {item.product && (item.product as any).image_url ? (
                        <img src={(item.product as any).image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm">🍕</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{(item.product as any)?.name || 'Product'}</p>
                      <p className="text-[10px] text-gray-500">{item.variant_name} × {item.quantity}</p>
                      {item.special_instructions && <p className="text-[10px] italic text-red-400">&quot;{item.special_instructions}&quot;</p>}
                    </div>
                    <p className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-jetbrains)' }}>
                      Rs. {Number(item.total_price).toLocaleString()}
                    </p>
                  </div>
                ))}

                {/* Totals */}
                <div className="mt-3 space-y-1.5 border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Subtotal</span><span className="text-gray-300">Rs. {Number(selectedOrder.subtotal).toLocaleString()}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Delivery</span><span className="text-gray-300">Rs. {Number(selectedOrder.delivery_fee).toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm font-bold"><span className="text-white">Total</span><span style={{ color: '#E8002D', fontFamily: 'var(--font-jetbrains)' }}>Rs. {Number(selectedOrder.total).toLocaleString()}</span></div>
                </div>
              </div>
            </div>

            {/* Hidden Receipt */}
            <OrderReceipt ref={receiptRef} order={selectedOrder} orderItems={orderItems} />
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrdersPage;