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
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const sidebarLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: FiHome },
  { href: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
  { href: '/admin/products', label: 'Products', icon: FiPackage },
  { href: '/admin/categories', label: 'Categories', icon: FiGrid },
  { href: '/admin/complaints', label: 'Complaints', icon: FiMessageSquare },
  { href: '/admin/vouchers', label: 'Vouchers', icon: FiTag },
  { href: '/admin/banners', label: 'Banners', icon: FiImage },
  { href: '/admin/settings', label: 'Settings', icon: FiSettings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminName, setAdminName] = useState('Admin');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isLoginPage = pathname === '/admin/login';

  // Check authentication (skip for login page)
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

  // If login page, just render children without layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Handle logout
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto h-10 w-10 text-primary-600" />
          <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col shadow-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        {/* Sidebar Header */}
        <div
          className="flex h-16 items-center justify-between px-5"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
              <span className="text-lg">🍕</span>
            </div>
            <div>
              <p className="text-sm font-bold text-primary-600">NONSTOP</p>
              <p
                className="text-[10px] font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Admin Panel
              </p>
            </div>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden"
            style={{ color: 'var(--text-primary)' }}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md'
                      : ''
                  }`}
                  style={
                    !isActive
                      ? {
                          color: 'var(--text-secondary)',
                        }
                      : {}
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        'var(--bg-secondary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        'transparent';
                    }
                  }}
                >
                  <Icon size={18} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div
          className="p-3"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 transition-all hover:bg-red-50"
          >
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <header
          className="flex h-16 items-center justify-between px-4 shadow-sm sm:px-6"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {/* Left - Menu Button + Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-gray-100 lg:hidden"
              style={{ color: 'var(--text-primary)' }}
            >
              <FiMenu size={20} />
            </button>
            <h2
              className="text-lg font-bold capitalize"
              style={{ color: 'var(--text-primary)' }}
            >
              {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
            </h2>
          </div>

          {/* Right - Notifications + Admin Name */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-gray-100"
              style={{ color: 'var(--text-primary)' }}
            >
              <FiBell size={18} />
            </Link>

            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                {adminName.charAt(0).toUpperCase()}
              </div>
              <span
                className="hidden text-sm font-medium sm:block"
                style={{ color: 'var(--text-primary)' }}
              >
                {adminName}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}