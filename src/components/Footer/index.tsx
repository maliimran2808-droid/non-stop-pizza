'use client';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiClock,
  FiArrowUp,
  FiInstagram,
  FiFacebook,
} from 'react-icons/fi';

const Footer = () => {
     const pathname = usePathname();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [settings, setSettings] = useState({
    restaurant_name: 'NonStop Pizza',
    restaurant_phone: '+92-XXX-XXXXXXX',
    restaurant_email: 'info@nonstoppizza.com',
    delivery_time: '30-45 mins',
  });

  // Fetch s  // Hide footer on admin pages

    useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('site_settings').select('*');
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((item) => {
            map[item.key] = item.value;
          });
          setSettings({
            restaurant_name: map.restaurant_name || 'NonStop Pizza',
            restaurant_phone: map.restaurant_phone || '+92-XXX-XXXXXXX',
            restaurant_email: map.restaurant_email || 'info@nonstoppizza.com',
            delivery_time: map.delivery_time || '30-45 mins',
          });
        }
      } catch (err) {
        console.log('Using default settings');
      }
    };

    fetchSettings();
  }, []);

  // Show/hide back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();
 if (pathname.startsWith('/admin')) return null;
  return (
    <>
      <footer
        style={{
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        {/* Main Footer */}
        <div className="container-custom py-10 sm:py-14">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Column 1 - Brand */}
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600">
                  <svg
                    viewBox="0 0 100 100"
                    className="h-6 w-6"
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
                <div>
                  <h3 className="text-lg font-extrabold text-primary-600">
                    NONSTOP
                  </h3>
                  <p
                    className="text-[10px] font-bold tracking-widest"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    PIZZA
                  </p>
                </div>
              </div>
              <p
                className="mt-3 text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Fresh & hot pizza delivered to your doorstep. We never stop
                making delicious food for you! 🍕
              </p>

              {/* Social Links */}
              <div className="mt-4 flex gap-3">
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-600 transition-all hover:bg-primary-600 hover:text-white"
                >
                  <FiFacebook size={16} />
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-600 transition-all hover:bg-primary-600 hover:text-white"
                >
                  <FiInstagram size={16} />
                </a>
              </div>
            </div>

            {/* Column 2 - Quick Links */}
            <div>
              <h4
                className="mb-4 text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                Quick Links
              </h4>
              <ul className="space-y-2.5">
                {[
                  { href: '/', label: 'Menu' },
                  { href: '/track-order', label: 'Track Order' },
                  { href: '/complaint', label: 'Submit Complaint' },
                  { href: '/checkout', label: 'Cart / Checkout' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-all hover:text-primary-600 hover:underline"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3 - Contact Info */}
            <div>
              <h4
                className="mb-4 text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                Contact Us
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <FiPhone
                    size={14}
                    className="mt-0.5 flex-shrink-0 text-primary-600"
                  />
                  <a
                    href={`tel:${settings.restaurant_phone}`}
                    className="text-sm transition-all hover:text-primary-600"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {settings.restaurant_phone}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <FiMail
                    size={14}
                    className="mt-0.5 flex-shrink-0 text-primary-600"
                  />
                  <a
                    href={`mailto:${settings.restaurant_email}`}
                    className="text-sm transition-all hover:text-primary-600"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {settings.restaurant_email}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <FiClock
                    size={14}
                    className="mt-0.5 flex-shrink-0 text-primary-600"
                  />
                  <span
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Delivery: {settings.delivery_time}
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 4 - Opening Hours */}
            <div>
              <h4
                className="mb-4 text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                Opening Hours
              </h4>
              <ul className="space-y-2">
                <li className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Monday - Friday
                  </span>
                  <span
                    className="font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    11:00 - 23:00
                  </span>
                </li>
                <li className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Saturday
                  </span>
                  <span
                    className="font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    11:00 - 00:00
                  </span>
                </li>
                <li className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Sunday
                  </span>
                  <span
                    className="font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    12:00 - 23:00
                  </span>
                </li>
              </ul>

              {/* Payment Methods */}
              <div className="mt-4">
                <p
                  className="mb-2 text-xs font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  We Accept
                </p>
                <div className="flex flex-wrap gap-2">
                  {['💵 COD', '💳 Visa', '💳 Master', '💳 UnionPay', '💳 PayPak'].map(
                    (method) => (
                      <span
                        key={method}
                        className="rounded-md px-2 py-1 text-[10px] font-medium"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {method}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div className="container-custom flex flex-col items-center justify-between gap-2 py-4 sm:flex-row">
            <p
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              © {currentYear} {settings.restaurant_name}. All rights reserved.
            </p>
            <p
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              Made with ❤️ & 🍕
            </p>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-all hover:bg-primary-700 hover:shadow-xl sm:bottom-28 sm:right-6"
          style={{
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <FiArrowUp size={20} />
        </button>
      )}
    </>
  );
};

export default Footer;