'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useThemeStore } from '@/store/themeStore';
import gsap from 'gsap';
import {
  FiShoppingCart,
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiPhone,
  FiAlertCircle,
} from 'react-icons/fi';

const Header = () => {
    const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { getTotalItems } = useCartStore();
  const { theme, toggleTheme } = useThemeStore();
  const totalItems = getTotalItems();



// Hide header on admin pages
  // Animate header on mount
  useEffect(() => {
    gsap.fromTo(
      '.header-container',
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 3 }
    );
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toggle mobile menu with animation
  const toggleMobileMenu = () => {
    if (!isMobileMenuOpen) {
      setIsMobileMenuOpen(true);
      setTimeout(() => {
        gsap.fromTo(
          '.mobile-menu',
          { x: '100%', opacity: 0 },
          { x: '0%', opacity: 1, duration: 0.4, ease: 'power3.out' }
        );
        gsap.fromTo(
          '.mobile-menu-item',
          { x: 50, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.3,
            stagger: 0.08,
            ease: 'power2.out',
            delay: 0.2,
          }
        );
      }, 10);
    } else {
      gsap.to('.mobile-menu', {
        x: '100%',
        opacity: 0,
        duration: 0.3,
        ease: 'power3.in',
        onComplete: () => setIsMobileMenuOpen(false),
      });
    }
  };
if (pathname.startsWith('/admin')) return null;
  return (
    <>
  <header
  className="header-container relative top-0 left-0 right-0 z-50 shadow-sm"
  style={{
    backgroundColor: 'var(--bg-primary)',
    borderBottom: '1px solid var(--border-color)',
  }}
>
        <div className="container-custom">
          <div className="flex h-16 items-center justify-between sm:h-20">
            {/* LEFT SIDE - Logo + Contact */}
            <div className="flex items-center gap-4">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 shadow-md sm:h-12 sm:w-12">
                  <svg
                    viewBox="0 0 100 100"
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M50 10 L85 80 Q50 95 15 80 Z"
                      fill="#FACC15"
                      stroke="#EAB308"
                      strokeWidth="2"
                    />
                    <path
                      d="M15 80 Q50 95 85 80"
                      fill="#D97706"
                      stroke="#B45309"
                      strokeWidth="2"
                    />
                    <circle cx="45" cy="45" r="6" fill="#DC2626" />
                    <circle cx="60" cy="55" r="5" fill="#DC2626" />
                    <circle cx="38" cy="65" r="5.5" fill="#DC2626" />
                  </svg>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-lg font-extrabold tracking-wide text-primary-600 sm:text-xl">
                    NONSTOP
                  </span>
                  <span
                    className="text-[10px] font-bold tracking-[0.2em] sm:text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    PIZZA
                  </span>
                </div>
              </Link>

              {/* Contact Us - Desktop Only */}
              <Link
                href="tel:+920000000000"
                className="hidden items-center gap-2 rounded-full border border-primary-600 px-4 py-2 text-sm font-medium text-primary-600 transition-all duration-300 hover:bg-primary-600 hover:text-white md:flex"
              >
                <FiPhone size={14} />
                <span>Contact Us</span>
              </Link>
            </div>

            {/* RIGHT SIDE - Theme + Complaint + Cart + Hamburger */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:bg-primary-100 sm:h-10 sm:w-10"
                style={{ color: 'var(--text-primary)' }}
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? (
                  <FiMoon size={18} />
                ) : (
                  <FiSun size={18} className="text-yellow-400" />
                )}
              </button>

              {/* Submit Complaint - Desktop Only */}
              <Link
                href="/complaint"
                className="hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-primary-100 md:flex"
                style={{ color: 'var(--text-primary)' }}
              >
                <FiAlertCircle size={16} />
                <span>Complaint</span>
              </Link>

              {/* Cart Button */}
              <Link
                href="/checkout"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white transition-all duration-300 hover:bg-primary-700 hover:shadow-lg sm:h-10 sm:w-10"
                aria-label="Cart"
              >
                <FiShoppingCart size={18} />
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-black">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:bg-primary-100 md:hidden"
                style={{ color: 'var(--text-primary)' }}
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="overlay"
            onClick={toggleMobileMenu}
          />

          {/* Mobile Menu Panel */}
          <div
            className="mobile-menu fixed top-0 right-0 z-50 h-full w-72 shadow-2xl sm:w-80"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            {/* Close Button */}
            <div className="flex h-16 items-center justify-between px-6 sm:h-20">
              <span className="text-lg font-bold text-primary-600">Menu</span>
              <button
                onClick={toggleMobileMenu}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:bg-primary-100"
                style={{ color: 'var(--text-primary)' }}
              >
                <FiX size={22} />
              </button>
            </div>

            {/* Divider */}
            <div
              className="mx-6 h-px"
              style={{ backgroundColor: 'var(--border-color)' }}
            />

            {/* Menu Items */}
            <nav className="flex flex-col gap-1 p-4">
              <Link
                href="/"
                onClick={toggleMobileMenu}
                className="mobile-menu-item flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-primary-50"
                style={{ color: 'var(--text-primary)' }}
              >
                <span className="text-xl">🍕</span>
                <span>Home</span>
              </Link>

              <Link
                href="tel:+920000000000"
                onClick={toggleMobileMenu}
                className="mobile-menu-item flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-primary-50"
                style={{ color: 'var(--text-primary)' }}
              >
                <FiPhone size={18} className="text-primary-600" />
                <span>Contact Us</span>
              </Link>

              <Link
                href="/complaint"
                onClick={toggleMobileMenu}
                className="mobile-menu-item flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-primary-50"
                style={{ color: 'var(--text-primary)' }}
              >
                <FiAlertCircle size={18} className="text-primary-600" />
                <span>Submit Complaint</span>
              </Link>

              <Link
                href="/track-order"
                onClick={toggleMobileMenu}
                className="mobile-menu-item flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-primary-50"
                style={{ color: 'var(--text-primary)' }}
              >
                <span className="text-xl">📦</span>
                <span>Track Order</span>
              </Link>

              <Link
                href="/checkout"
                onClick={toggleMobileMenu}
                className="mobile-menu-item flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-primary-50"
                style={{ color: 'var(--text-primary)' }}
              >
                <FiShoppingCart size={18} className="text-primary-600" />
                <span>Cart ({totalItems})</span>
              </Link>

              {/* Divider */}
              <div
                className="my-2 h-px"
                style={{ backgroundColor: 'var(--border-color)' }}
              />

              {/* Theme Toggle in Mobile */}
              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="mobile-menu-item flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-primary-50"
                style={{ color: 'var(--text-primary)' }}
              >
                {theme === 'light' ? (
                  <>
                    <FiMoon size={18} className="text-primary-600" />
                    <span>Dark Mode</span>
                  </>
                ) : (
                  <>
                    <FiSun size={18} className="text-yellow-400" />
                    <span>Light Mode</span>
                  </>
                )}
              </button>
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default Header;