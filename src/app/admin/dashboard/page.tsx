'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';
import gsap from 'gsap';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FiArrowUpRight,
  FiArrowDownRight,
  FiClock,
  FiPackage,
  FiMapPin,
  FiPhone,
  FiMail,
  FiActivity,
  FiShoppingBag,
  FiDollarSign,
  FiTrendingUp,
  FiUsers,
  FiStar,
  FiEye,
  FiHeart,
  FiChevronRight,
} from 'react-icons/fi';

type FilterPeriod = 'today' | '7days' | '30days' | '3months' | 'all';
type GraphView = 'daily' | 'weekly' | 'monthly';

interface TopProduct {
  name: string;
  count: number;
  revenue: number;
  image_url: string | null;
  percentage: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const DONUT_COLORS = ['#E8002D', '#FF4D6A', '#FF8FA3', '#FFB3C1', '#FFDCE4', '#CC0028'];

const filterOptions: { value: FilterPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: '7 Days' },
  { value: '30days', label: '30 Days' },
  { value: '3months', label: '3 Months' },
  { value: 'all', label: 'All' },
];

// Animated number component
const AnimatedNumber = ({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const duration = 1500;
    const start = 0;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (value - start) * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [value]);

  return (
    <span ref={ref} style={{ fontFamily: 'var(--font-poppins)' }}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
};

// Glass card style
const glassStyle = {
  backgroundColor: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.07)',
};

const DashboardPage = () => {
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('30days');
  const [graphView, setGraphView] = useState<GraphView>('daily');
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const [stats, setStats] = useState({
    revenue: 0, orders: 0, customers: 0, products: 0,
    revenueGrowth: 0, ordersGrowth: 0,
    pending: 0, delivered: 0, cancelled: 0,
    paidOrders: 0, unpaidOrders: 0,
    dailyTarget: 0, dailyActual: 0,
  });

  const [graphData, setGraphData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [trendingItems, setTrendingItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  const getDateRange = useCallback((period: FilterPeriod) => {
    const now = new Date();
    const currentStart = new Date();
    const previousStart = new Date();
    switch (period) {
      case 'today': currentStart.setHours(0,0,0,0); previousStart.setDate(now.getDate()-1); previousStart.setHours(0,0,0,0); break;
      case '7days': currentStart.setDate(now.getDate()-7); previousStart.setDate(now.getDate()-14); break;
      case '30days': currentStart.setDate(now.getDate()-30); previousStart.setDate(now.getDate()-60); break;
      case '3months': currentStart.setDate(now.getDate()-90); previousStart.setDate(now.getDate()-180); break;
      case 'all': currentStart.setFullYear(2000); previousStart.setFullYear(1990); break;
    }
    return { currentStart, previousStart };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const { currentStart, previousStart } = getDateRange(filterPeriod);

      const { data: allOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { data: orderItems } = await supabase.from('order_items').select('product_id, quantity, total_price, order_id, product:products(name, image_url, category_id), category:products(category:categories(name))');
    

      if (!allOrders) return;

      const currentOrders = allOrders.filter(o => new Date(o.created_at) >= currentStart);
      const previousOrders = allOrders.filter(o => new Date(o.created_at) >= previousStart && new Date(o.created_at) < currentStart);

      const calcRev = (orders: any[]) => orders.filter(o => o.order_status !== 'cancelled').reduce((sum, o) => sum + Number(o.total), 0);
      const currRev = calcRev(currentOrders);
      const prevRev = calcRev(previousOrders);

      const uniqueCustomers = new Set(currentOrders.map(o => o.customer_phone)).size;

      // Today's revenue for daily target
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const todayOrders = allOrders.filter(o => new Date(o.created_at) >= todayStart && o.order_status !== 'cancelled');
      const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);

      setStats({
        revenue: currRev,
        orders: currentOrders.length,
        customers: uniqueCustomers,
        products: productsCount || 0,
        revenueGrowth: prevRev === 0 ? (currRev > 0 ? 100 : 0) : ((currRev - prevRev) / prevRev) * 100,
        ordersGrowth: previousOrders.length === 0 ? (currentOrders.length > 0 ? 100 : 0) : ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100,
        pending: allOrders.filter(o => ['received', 'confirmed', 'preparing'].includes(o.order_status)).length,
        delivered: currentOrders.filter(o => o.order_status === 'delivered').length,
        cancelled: currentOrders.filter(o => o.order_status === 'cancelled').length,
        paidOrders: currentOrders.filter(o => o.payment_status === 'paid').length,
        unpaidOrders: currentOrders.filter(o => o.payment_status === 'pending').length,
         dailyTarget: 10000,
        dailyActual: todayRevenue,
      });

      setRecentOrders(allOrders.slice(0, 5));

      // Graph data
      const gMap: Record<string, { revenue: number; orders: number }> = {};
      currentOrders.filter(o => o.order_status !== 'cancelled').forEach(o => {
        const d = new Date(o.created_at);
        let key = '';
        if (graphView === 'daily') key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        else if (graphView === 'weekly') { d.setDate(d.getDate() - d.getDay()); key = `W${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`; }
        else key = d.toLocaleDateString('en-US', { month: 'short' });
        if (!gMap[key]) gMap[key] = { revenue: 0, orders: 0 };
        gMap[key].revenue += Number(o.total);
        gMap[key].orders += 1;
      });
      setGraphData(Object.entries(gMap).map(([date, d]) => ({ date, revenue: Math.round(d.revenue), orders: d.orders })).reverse().slice(-12));

      // Top products + Category data + Trending
      if (orderItems) {
        const pMap: Record<string, any> = {};
        const catMap: Record<string, number> = {};
        let maxCount = 0;

        orderItems.forEach((item: any) => {
          const pName = item.product?.name || 'Unknown';
          const imgUrl = item.product?.image_url || null;
          const catName = (item.category as any)?.category?.name || 'Other';

          if (!pMap[pName]) pMap[pName] = { name: pName, count: 0, revenue: 0, image_url: imgUrl, percentage: 0 };
          pMap[pName].count += item.quantity;
          pMap[pName].revenue += Number(item.total_price);
          if (pMap[pName].count > maxCount) maxCount = pMap[pName].count;

          catMap[catName] = (catMap[catName] || 0) + item.quantity;
        });

        const sorted = Object.values(pMap).sort((a: any, b: any) => b.count - a.count);
        setTopProducts(sorted.slice(0, 3).map((p: any) => ({ ...p, percentage: maxCount > 0 ? Math.round((p.count / maxCount) * 100) : 0 })));
        setTrendingItems(sorted.slice(0, 5).map((p: any) => ({ ...p, percentage: maxCount > 0 ? Math.round((p.count / maxCount) * 100) : 0 })));

        const catArr = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value], i) => ({
          name, value, color: DONUT_COLORS[i % DONUT_COLORS.length],
        }));
        setCategoryData(catArr);
      }
    } catch (err) { console.error('Dashboard error:', err); }

    setIsLoading(false);
    setTimeout(() => {
      gsap.fromTo('.dash-el', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' });
    }, 100);
  }, [filterPeriod, graphView, getDateRange]);

    useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch settings only once
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase.from('site_settings').select('*');
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((item) => { map[item.key] = item.value; });
          setSettings(map);
        }
      } catch (err) {
        console.log('Settings error');
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const channel = supabase.channel('dash-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => { setIsLive(true); fetchData(); setTimeout(() => setIsLive(false), 2000); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => { fetchData(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const dailyProgress = stats.dailyTarget > 0 ? Math.min(Math.round((stats.dailyActual / stats.dailyTarget) * 100), 100) : 0;

  const getStatusStyle = (status: string) => {
    const m: Record<string, { bg: string; text: string }> = {
      received: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
      confirmed: { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6' },
      preparing: { bg: 'rgba(168,85,247,0.15)', text: '#A855F7' },
      out_for_delivery: { bg: 'rgba(249,115,22,0.15)', text: '#F97316' },
      delivered: { bg: 'rgba(34,197,94,0.15)', text: '#22C55E' },
      cancelled: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444' },
    };
    return m[status] || { bg: 'rgba(156,163,175,0.15)', text: '#9CA3AF' };
  };

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
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center dash-el">
        <div>
          <div className="flex items-center gap-3">
                       <h1 className="text-2xl font-semibold text-white sm:text-3xl" style={{ fontFamily: 'var(--font-poppins)', fontWeight: 600 }}>Overview</h1>
            {isLive && (
              <span className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" /> Live
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">Real-time restaurant analytics</p>
        </div>

        <div className="flex items-center gap-1 rounded-xl p-1" style={{ ...glassStyle }}>
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterPeriod(opt.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filterPeriod === opt.value ? 'text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
              }`}
              style={filterPeriod === opt.value ? { backgroundColor: '#E8002D' } : {}}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 dash-el">
        {[
          { label: 'Orders', value: stats.orders, icon: FiShoppingBag, growth: stats.ordersGrowth, color: '#E8002D' },
          { label: 'Customers', value: stats.customers, icon: FiUsers, growth: null, color: '#3B82F6' },
          { label: 'Menu Items', value: stats.products, icon: FiPackage, growth: null, color: '#F59E0B' },
          { label: 'Income', value: stats.revenue, icon: FiDollarSign, growth: stats.revenueGrowth, color: '#22C55E', prefix: 'Rs. ' },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-xl p-4 transition-all hover:shadow-lg" style={{ ...glassStyle }}>
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${stat.color}15` }}>
                <stat.icon size={16} style={{ color: stat.color }} />
              </div>
              {stat.growth !== null && (
                <span className={`flex items-center gap-0.5 text-[10px] font-bold ${stat.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.growth >= 0 ? <FiArrowUpRight size={10} /> : <FiArrowDownRight size={10} />}
                  {Math.abs(stat.growth).toFixed(0)}%
                </span>
              )}
            </div>
            <p className="mt-3 text-2xl font-bold text-white">
              <AnimatedNumber value={stat.value} prefix={stat.prefix || ''} />
            </p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-gray-500">{stat.label}</p>

            {/* Mini sparkline decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-8 opacity-20">
              <svg viewBox="0 0 100 20" className="h-full w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`spark-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stat.color} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={stat.color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,15 Q10,5 20,12 T40,8 T60,14 T80,6 T100,10 V20 H0 Z" fill={`url(#spark-${i})`} />
                <path d="M0,15 Q10,5 20,12 T40,8 T60,14 T80,6 T100,10" fill="none" stroke={stat.color} strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3 dash-el">
        {/* Sales Chart — 2 cols */}
        <div className="rounded-xl p-5 lg:col-span-2" style={{ ...glassStyle }}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Sales Figures</h3>
              <p className="mt-0.5 text-xl font-bold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>
                Rs. {stats.revenue.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {(['daily', 'weekly', 'monthly'] as GraphView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setGraphView(v)}
                  className={`rounded-md px-3 py-1 text-[10px] font-semibold capitalize transition-all ${graphView === v ? 'text-white' : 'text-gray-500'}`}
                  style={graphView === v ? { backgroundColor: '#E8002D' } : {}}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[300px] w-full">
            {graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E8002D" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#E8002D" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#FF4D6A" />
                      <stop offset="100%" stopColor="#E8002D" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#555' }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#555' }} tickFormatter={(v: any) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '12px', color: '#fff' }}
                    formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, 'Revenue']}
                    labelStyle={{ color: '#888' }}
                    cursor={{ fill: 'rgba(232,0,45,0.05)' }}
                  />
                  <Bar dataKey="revenue" fill="url(#barGrad)" radius={[4, 4, 0, 0]} animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-600">No data for this period</div>
            )}
          </div>
        </div>

        {/* Popular Food Donut — 1 col */}
        <div className="rounded-xl p-5" style={{ ...glassStyle }}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">Popular Categories</h3>

          <div className="flex items-center justify-center py-4">
            {categoryData.length > 0 ? (
              <div className="relative">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={1200}
                    >
                      {categoryData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>
                    {categoryData.reduce((sum, c) => sum + c.value, 0)}
                  </p>
                  <p className="text-[10px] text-gray-500">Items Sold</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No data</p>
            )}
          </div>

          {/* Legend */}
          <div className="mt-2 space-y-2">
            {categoryData.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs text-gray-400">{cat.name}</span>
                </div>
                <span className="text-xs font-semibold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 dash-el">
        {/* Most Favourite Items */}
        <div className="rounded-xl p-5" style={{ ...glassStyle }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Most Favourite</h3>
            <Link href="/admin/products" className="text-[10px] font-semibold uppercase tracking-wider text-red-500 hover:text-red-400">
              See All
            </Link>
          </div>

          <div className="space-y-3">
            {topProducts.map((product, idx) => (
              <div
                key={product.name}
                className="flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-white/[0.02]"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl">🍕</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.count} orders</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Rs. {product.revenue.toLocaleString()}
                  </p>
                  <FiHeart size={12} className="ml-auto mt-1 text-red-500" />
                </div>
              </div>
            ))}
            {topProducts.length === 0 && <p className="py-4 text-center text-sm text-gray-600">No data yet</p>}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="rounded-xl p-5" style={{ ...glassStyle }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Recent Orders</h3>
            <Link href="/admin/orders" className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-red-500 hover:text-red-400">
              View All <FiChevronRight size={10} />
            </Link>
          </div>

          <div className="space-y-2">
            {recentOrders.map((order) => {
              const s = getStatusStyle(order.order_status);
              return (
                <Link
                  key={order.id}
                  href="/admin/orders"
                  className="flex items-center justify-between rounded-xl p-3 transition-all hover:bg-red-500/[0.03]"
                  style={{ border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{order.customer_name}</p>
                    <p className="text-[10px] text-gray-500">
                      #{order.order_number} • {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>
                      Rs. {Number(order.total).toLocaleString()}
                    </p>
                    <span
                      className="mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                      style={{ backgroundColor: s.bg, color: s.text }}
                    >
                      {order.order_status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </Link>
              );
            })}
            {recentOrders.length === 0 && <p className="py-4 text-center text-sm text-gray-600">No orders yet</p>}
          </div>
        </div>

        {/* Daily Trending + Store Info */}
        <div className="flex flex-col gap-6">
          {/* Daily Target */}
          <div className="rounded-xl p-5" style={{ ...glassStyle }}>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Daily Target</h3>
            <div className="flex items-center justify-center">
              <div className="relative">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke="url(#targetGrad)" strokeWidth="8"
                    strokeDasharray={`${dailyProgress * 3.14} ${314 - dailyProgress * 3.14}`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                  <defs>
                    <linearGradient id="targetGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#E8002D" />
                      <stop offset="100%" stopColor="#FF4D6A" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>{dailyProgress}%</p>
                </div>
              </div>
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-400">
                <span className="font-bold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>Rs. {stats.dailyActual.toLocaleString()}</span>
                {' '}from Rs. {stats.dailyTarget.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Store Info */}
          <div className="rounded-xl p-5" style={{ ...glassStyle }}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Store Info</h3>
            <div className="space-y-3">
              {[
                { icon: FiMapPin, label: settings.restaurant_name || 'NonStop Pizza', sub: 'Restaurant' },
                { icon: FiPhone, label: settings.restaurant_phone || '+92-XXX', sub: 'Contact' },
                { icon: FiClock, label: settings.delivery_time || '30-45 min', sub: 'Delivery' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(232,0,45,0.1)' }}>
                    <item.icon size={14} style={{ color: '#E8002D' }} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-600">{item.sub}</p>
                    <p className="text-xs font-semibold text-white">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;