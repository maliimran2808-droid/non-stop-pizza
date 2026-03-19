'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  FiHome,
  FiShoppingBag,
  FiPackage,
  FiGrid,
  FiMessageSquare,
  FiImage,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiBell,
  FiTag,
  FiShield,
  FiHelpCircle,
  FiSearch,
  FiMoon,
  FiSun,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useThemeStore } from '@/store/themeStore';

const sidebarLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: FiHome },
  { href: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
  { href: '/admin/products', label: 'Products', icon: FiPackage },
  { href: '/admin/categories', label: 'Categories', icon: FiGrid },
  { href: '/admin/vouchers', label: 'Vouchers', icon: FiTag },
  { href: '/admin/complaints', label: 'Complaints', icon: FiMessageSquare },
  { href: '/admin/banners', label: 'Banners', icon: FiImage },
  { href: '/admin/privacy-policy', label: 'Privacy Policy', icon: FiShield },
  { href: '/admin/faqs', label: 'FAQs', icon: FiHelpCircle },
  { href: '/admin/settings', label: 'Settings', icon: FiSettings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeStore();
  const [adminName, setAdminName] = useState('Admin');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/verify');
        const data = await res.json();

        if (!res.ok) {
          router.replace('/admin/login');
          return;
        }

        setAdminName(data.admin.name || 'Admin');
        setIsAuthenticated(true);
      } catch (err) {
        router.replace('/admin/login');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      toast.success('Logged out successfully');
      router.replace('/admin/login');
    } catch (err) {
      toast.error('Failed to logout');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#0A0A0A' }}>
        <div className="text-center">
          <div className="spinner mx-auto h-10 w-10 text-red-600" />
          <p className="mt-4 text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const currentPage = pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard';

  return (
       <div className="flex min-h-screen" style={{ backgroundColor: '#0A0A0A', fontFamily: 'var(--font-poppins)' }}>   {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: '#0A0A0A',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-1">
            <span
              className="text-xl font-bold tracking-tight text-white"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              NonStop
            </span>
            <span
              className="text-xl font-bold"
              style={{ color: '#E8002D', fontFamily: 'Georgia, serif' }}
            >
              .
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-500 lg:hidden"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="mt-4 flex-1 overflow-y-auto px-3">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
            Main Menu
          </p>
          <div className="space-y-0.5">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: 'rgba(232, 0, 45, 0.08)',
                        }
                      : {}
                  }
                >
                  {/* Active Left Border */}
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full"
                      style={{ backgroundColor: '#E8002D' }}
                    />
                  )}

                  {/* Active Glow */}
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-lg opacity-20 blur-xl"
                      style={{ backgroundColor: '#E8002D' }}
                    />
                  )}

                  <Icon
                    size={18}
                    className={`relative z-10 transition-colors ${
                      isActive ? 'text-red-500' : 'text-gray-600 group-hover:text-gray-400'
                    }`}
                  />
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile Card */}
        <div
          className="mx-3 mb-4 rounded-xl p-3"
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {adminName}
              </p>
              <p className="text-[10px] text-gray-500">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium text-red-400 transition-all hover:bg-red-600/10"
            style={{ border: '1px solid rgba(232, 0, 45, 0.2)' }}
          >
            <FiLogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header
          className="flex h-16 items-center justify-between px-4 sm:px-6"
          style={{
            backgroundColor: '#0A0A0A',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Left — Menu + Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-400 transition-colors hover:text-white lg:hidden"
            >
              <FiMenu size={20} />
            </button>
            <h2
              className="text-lg font-semibold capitalize text-white"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {currentPage}
            </h2>
          </div>

          {/* Right — Search + Icons */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div
              className="hidden items-center gap-2 rounded-lg px-3 py-2 sm:flex"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <FiSearch size={14} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-40 border-none bg-transparent text-xs text-white outline-none placeholder:text-gray-600"
              />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-white/5 hover:text-white"
            >
              {theme === 'light' ? <FiMoon size={16} /> : <FiSun size={16} />}
            </button>

            {/* Notifications */}
            <Link
              href="/admin/orders"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-white/5 hover:text-white"
            >
              <FiBell size={16} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </Link>

            {/* Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
              {adminName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6"
          style={{ backgroundColor: '#0A0A0A' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}