'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';
import gsap from 'gsap';
import {
  FiShoppingBag,
  FiPackage,
  FiDollarSign,
  FiMessageSquare,
  FiTrendingUp,
  FiClock,
  FiCalendar,
  FiChevronDown,
  FiEye,
} from 'react-icons/fi';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalComplaints: number;
  pendingComplaints: number;
  filteredOrders: number;
  filteredRevenue: number;
  deliveredOrders: number;
  cancelledOrders: number;
}

type FilterPeriod = 'today' | '3days' | '7days' | '15days' | '30days' | '3months' | '6months' | '1year' | 'all';

const filterOptions: { value: FilterPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '3days', label: 'Last 3 Days' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '15days', label: 'Last 15 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '3months', label: 'Last 3 Months' },
  { value: '6months', label: 'Last 6 Months' },
  { value: '1year', label: 'Last 1 Year' },
  { value: 'all', label: 'All Time' },
];

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalComplaints: 0,
    pendingComplaints: 0,
    filteredOrders: 0,
    filteredRevenue: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('today');

  useEffect(() => {
    fetchDashboardData();
  }, [filterPeriod]);

  // Get date from filter period
  const getFilterDate = (period: FilterPeriod): Date | null => {
    const now = new Date();

    switch (period) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      case '3days':
        return new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '15days':
        return new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '3months':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '6months':
        return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      case '1year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      case 'all':
        return null;
      default:
        return null;
    }
  };

  const fetchDashboardData = async () => {
    try {
      const filterDate = getFilterDate(filterPeriod);

      // Fetch all orders
      const { data: allOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Fetch complaints
      const { data: complaints } = await supabase
        .from('complaints')
        .select('*');

      if (allOrders) {
        // Filter orders by date
        const filteredOrdersList = filterDate
          ? allOrders.filter((o) => new Date(o.created_at) >= filterDate)
          : allOrders;

        // Calculate stats
        const filteredRevenue = filteredOrdersList
          .filter((o) => o.order_status !== 'cancelled')
          .reduce((sum, o) => sum + Number(o.total), 0);

        const deliveredOrders = filteredOrdersList.filter(
          (o) => o.order_status === 'delivered'
        ).length;

        const cancelledOrders = filteredOrdersList.filter(
          (o) => o.order_status === 'cancelled'
        ).length;

        const pendingOrders = allOrders.filter(
          (o) =>
            o.order_status === 'received' || o.order_status === 'confirmed'
        ).length;

        const totalRevenue = allOrders
          .filter((o) => o.order_status !== 'cancelled')
          .reduce((sum, o) => sum + Number(o.total), 0);

        setStats({
          totalOrders: allOrders.length,
          pendingOrders,
          totalRevenue,
          totalProducts: productsCount || 0,
          totalComplaints: complaints?.length || 0,
          pendingComplaints:
            complaints?.filter((c) => c.status === 'pending').length || 0,
          filteredOrders: filteredOrdersList.length,
          filteredRevenue,
          deliveredOrders,
          cancelledOrders,
        });

        setRecentOrders(allOrders.slice(0, 8));
      }
    } catch (err) {
      console.error('Dashboard error:', err);
    }
    setIsLoading(false);

    // Animate cards
    setTimeout(() => {
      gsap.fromTo(
        '.stat-card',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.08,
          ease: 'power3.out',
        }
      );
    }, 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      received: 'badge-yellow',
      confirmed: 'badge-blue',
      preparing: 'badge-blue',
      out_for_delivery: 'badge-yellow',
      delivered: 'badge-green',
      cancelled: 'badge-red',
    };
    return colors[status] || 'badge-yellow';
  };

  const getFilterLabel = () => {
    return filterOptions.find((f) => f.value === filterPeriod)?.label || 'Today';
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
      {/* Header with Filter */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Dashboard Overview 🍕
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Welcome back! Here&apos;s what&apos;s happening.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-3">
          <FiCalendar size={18} className="text-primary-600" />
          <div className="relative">
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as FilterPeriod)}
              className="input-field appearance-none pr-10 font-medium"
              style={{ minWidth: '180px' }}
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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

      {/* Filtered Period Stats */}
      <div
        className="mb-6 rounded-2xl p-4"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <FiCalendar size={16} className="text-primary-600" />
          <h2
            className="text-sm font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {getFilterLabel()} Summary
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Filtered Orders */}
          <div
            className="rounded-xl p-3"
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <p
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Orders
            </p>
            <p
              className="mt-1 text-2xl font-extrabold"
              style={{ color: 'var(--text-primary)' }}
            >
              {stats.filteredOrders}
            </p>
          </div>

          {/* Filtered Revenue */}
          <div
            className="rounded-xl p-3"
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <p
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Revenue
            </p>
            <p className="mt-1 text-2xl font-extrabold text-primary-600">
              Rs. {stats.filteredRevenue.toLocaleString()}
            </p>
          </div>

          {/* Delivered */}
          <div
            className="rounded-xl p-3"
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <p
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Delivered
            </p>
            <p className="mt-1 text-2xl font-extrabold text-green-600">
              {stats.deliveredOrders}
            </p>
          </div>

          {/* Cancelled */}
          <div
            className="rounded-xl p-3"
            style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <p
              className="text-[10px] font-medium uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancelled
            </p>
            <p className="mt-1 text-2xl font-extrabold text-red-500">
              {stats.cancelledOrders}
            </p>
          </div>
        </div>
      </div>

      {/* Overall Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pending Orders */}
        <div
          className="stat-card rounded-2xl p-5 opacity-0"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Pending Orders
              </p>
              <p className="mt-1 text-3xl font-extrabold text-primary-600">
                {stats.pendingOrders}
              </p>
              <p
                className="mt-1 text-[10px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Need attention
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <FiClock size={22} />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div
          className="stat-card rounded-2xl p-5 opacity-0"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Total Revenue
              </p>
              <p
                className="mt-1 text-3xl font-extrabold"
                style={{ color: 'var(--text-primary)' }}
              >
                Rs. {stats.totalRevenue.toLocaleString()}
              </p>
              <p
                className="mt-1 text-[10px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                All time earnings
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-600">
              <FiDollarSign size={22} />
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div
          className="stat-card rounded-2xl p-5 opacity-0"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Total Products
              </p>
              <p
                className="mt-1 text-3xl font-extrabold"
                style={{ color: 'var(--text-primary)' }}
              >
                {stats.totalProducts}
              </p>
              <p
                className="mt-1 text-[10px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                In menu
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <FiPackage size={22} />
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div
          className="stat-card rounded-2xl p-5 opacity-0"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Total Orders
              </p>
              <p
                className="mt-1 text-3xl font-extrabold"
                style={{ color: 'var(--text-primary)' }}
              >
                {stats.totalOrders}
              </p>
              <p
                className="mt-1 text-[10px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                All time
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              <FiShoppingBag size={22} />
            </div>
          </div>
        </div>

        {/* Pending Complaints */}
        <div
          className="stat-card rounded-2xl p-5 opacity-0"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Pending Complaints
              </p>
              <p className="mt-1 text-3xl font-extrabold text-red-500">
                {stats.pendingComplaints}
              </p>
              <p
                className="mt-1 text-[10px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Need response
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <FiMessageSquare size={22} />
            </div>
          </div>
        </div>

        {/* Total Complaints */}
        <div
          className="stat-card rounded-2xl p-5 opacity-0"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Total Complaints
              </p>
              <p
                className="mt-1 text-3xl font-extrabold"
                style={{ color: 'var(--text-primary)' }}
              >
                {stats.totalComplaints}
              </p>
              <p
                className="mt-1 text-[10px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                All time
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
              <FiMessageSquare size={22} />
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div
          className="stat-card rounded-2xl p-5 opacity-0 sm:col-span-2"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Average Order Value ({getFilterLabel()})
              </p>
              <p className="mt-1 text-3xl font-extrabold text-primary-600">
                Rs.{' '}
                {stats.filteredOrders > 0
                  ? Math.round(
                      stats.filteredRevenue / stats.filteredOrders
                    ).toLocaleString()
                  : '0'}
              </p>
              <p
                className="mt-1 text-[10px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Per order average for selected period
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-600">
              <FiTrendingUp size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div
        className="mt-6 rounded-2xl p-5"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-lg font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Recent Orders
          </h2>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-sm font-medium text-primary-600 transition-all hover:text-primary-700"
          >
            <span>View All</span>
            <FiEye size={14} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p
            className="py-8 text-center text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            No orders yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <th
                    className="pb-3 text-left font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Order #
                  </th>
                  <th
                    className="pb-3 text-left font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Customer
                  </th>
                  <th
                    className="pb-3 text-left font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Total
                  </th>
                  <th
                    className="pb-3 text-left font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Payment
                  </th>
                  <th
                    className="pb-3 text-left font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Status
                  </th>
                  <th
                    className="pb-3 text-left font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer transition-all hover:bg-primary-50"
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                    }}
                    onClick={() =>
                      (window.location.href = '/admin/orders')
                    }
                  >
                    <td className="py-3 font-semibold text-primary-600">
                      {!order.is_read && (
                        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500" />
                      )}
                      {order.order_number}
                    </td>
                    <td
                      className="py-3"
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
                      className="py-3 font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Rs. {Number(order.total).toLocaleString()}
                    </td>
                    <td className="py-3">
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
                    <td className="py-3">
                      <span
                        className={`badge ${getStatusColor(order.order_status)}`}
                      >
                        {order.order_status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td
                      className="py-3"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;