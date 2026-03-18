'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useThemeStore } from '@/store/themeStore';
import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiArrowUp,
  FiChevronDown,
} from 'react-icons/fi';
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';

const Footer = () => {
  const pathname = usePathname();
  const { theme } = useThemeStore();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [settings, setSettings] = useState({
    restaurant_name: 'NonStop Pizza',
    restaurant_phone: '+92-XXX-XXXXXXX',
    restaurant_email: 'info@nonstoppizza.com',
    delivery_time: '30-45 mins',
  });

  // Fetch settings
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

  // Show/hide back to top
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      <footer
        style={{
          backgroundColor: 'var(--bg-primary)',
        
        }}
      >
        {/* Logo + About Section */}
        <div className="container-custom pt-10 sm:pt-14">
          {/* Centered Logo */}
          <div className="flex justify-center">
            <div className="flex h-auto logo-img2 w-auto items-center justify-center">
                  <img src={theme === 'dark' ? '/logo2.webp' : '/Logo.webp'}/>
                  
                </div>
          </div>

          {/* Restaurant Name */}
          <h3
            className="mt-4 w-[70%] mx-auto text-center lg:text-[1.7rem] sm:text-3xl"
            style={{ color: 'var(--text-primary)', fontFamily: 'Salmond'}}
          >
           Kababjees Fried Chicken – Redefining the fast-food experience with its exceptional fried chicken
          </h3>

          {/* About Paragraph */}
          <div className="mx-auto mt-2 max-w-2xl sm:max-w-[70%] text-center">
            <span
              className="text-[.9rem]"
              style={{ color: 'var(--text-primary)', fontFamily:'Poppins', fontWeight:'400' }}
            >
              Welcome to {settings.restaurant_name}! We are passionate about serving you the freshest, most delicious pizza and fast food in town. Our commitment is to deliver hot and tasty meals right to your doorstep, ensuring every bite is a memorable experience.
            </span>

            {/* Expandable Content */}
            <div
              className="overflow-hidden transition-all duration-500"
              style={{
                maxHeight: isExpanded ? '500px' : '0px',
                opacity: isExpanded ? 1 : 0,
              }}
            >
              <p
                className="mt-4 text-sm"
               style={{ color: 'var(--text-primary)', fontFamily: 'Poppins'}}
              >
                From our classic hand-tossed pizzas to our signature burgers, every item on our menu is crafted with the finest ingredients and prepared with love. We take pride in our fast delivery service, ensuring your food arrives fresh and hot.
              </p>
              <p
                className="mt-4 text-sm"
              style={{ color: 'var(--text-primary)', fontFamily: 'Poppins'}}
              >
                Whether you&apos;re having a family dinner, a party with friends, or simply craving a midnight snack — {settings.restaurant_name} is here for you. We never stop serving because your satisfaction is our top priority. Order now and taste the difference!
              </p>
            </div>

            {/* Read More / Read Less Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold cursor-pointer text-primary-600 transition-all"
            >
              <span>{isExpanded ? 'Read Less' : 'Read More'}</span>
              <FiChevronDown
                size={14}
                className={`transition-transform duration-300 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* Separator Line — 70% centered */}
          <div className="mt-8 flex justify-center">
            <div
              className="h-[2px] min-w-[50%]"
              style={{ backgroundColor: 'var(--product-description)', borderRadius:'10px' }}
            />
          </div>
        </div>

        {/* Three Boxes Section */}
        <div className="container-custom py-8 pb-2" style={{maxWidth:'70vw'}}>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {/* Box 1 — Contact */}
            <div className="text-center sm:text-left">
              <h4
                className="mb-4 lg:text-xl sm:text-sm"
                style={{ color: 'var(--text-primary)', fontFamily:'Raleway' }}
              >
                Contact Us
              </h4>
              <ul className="space-y-3" style={{fontFamily:'Raleway', fontWeight:'400'}}>
                <li className="flex items-start justify-center gap-2 sm:justify-start">
                  <FiPhone
                    size={14}
                    className="mt-0.5 flex-shrink-0 text-primary-600"
                  />
                  <a
                    href={`tel:${settings.restaurant_phone}`}
                    className="text-sm transition-all"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {settings.restaurant_phone}
                  </a>
                </li>
                <li className="flex items-start justify-center gap-2 sm:justify-start">
                  <FiMail
                    size={14}
                    className="mt-0.5 flex-shrink-0 text-primary-600"
                  />
                  <a
                    href={`mailto:${settings.restaurant_email}`}
                    className="text-sm transition-all"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {settings.restaurant_email}
                  </a>
                </li>
                <li className="flex items-start justify-center gap-2 sm:justify-start">
                  <FiMapPin
                    size={14}
                    className="mt-0.5 flex-shrink-0 text-primary-600"
                  />
                  <span
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    NonStop Pizza, Nonarian Chownk, Near Prima Medical Store, New Shalimar Road, Samnabad.
                  </span>
                </li>
              </ul>
            </div>

            {/* Box 2 — Quick Links */}
            <div className="text-center">
              <h4
                className="mb-4 lg:text-xl sm:text-sm"
                style={{ color: 'var(--text-primary)', fontFamily:'Raleway'}}
              >
                Quick Links
              </h4>
              <ul className="space-y-2.5" style={{fontFamily:'Raleway', fontWeight:'400'}}>
                {[
                  { href: '/', label: 'Menu' },
                  { href: '/track-order', label: 'Track Order' },
                  { href: '/complaint', label: 'Submit Complaint' },
                  { href: '/checkout', label: 'Cart / Checkout' },
                  { href: '/privacy-policy', label: 'Privacy Policy' },
                  { href: '/faqs', label: 'FAQs' },
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

            {/* Box 3 — Follow Us */}
            <div className="text-center sm:text-right">
              <h4
                className="mb-4 lg:text-xl sm:text-sm"
                style={{ color: 'var(--text-primary)', fontFamily:'Raleway' }}
              >
                Follow Us
              </h4>
              <div className="flex items-center justify-center gap-1 sm:justify-end" style={{fontFamily:'Raleway', fontWeight:'400'}}>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-9 items-center justify-center rounded-full text-primary transition-all"
                >
                  <FaFacebookF size={17} />
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full  text-primary transition-all"
                >
                  <FaInstagram size={17} />
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-primary transition-all"
                >
                  <FaWhatsapp size={19} />
                </a>
              </div>
              <p
                className="mt-4 text-xs"
                style={{ color: 'var(--text-secondary)', fontFamily:'Raleway' }}
              >
                Stay connected with us for the latest deals and offers!
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
        
        >
          <div className="container-custom flex flex-col items-center justify-center gap-3 py-4 lg:pb-[35px] sm:flex-row">
            {/* Powered By */}
            <p
              className="text-[.8rem]"
              style={{ color: 'var(--text-primary)', fontFamily:'Poppins' }}
            >
              © {currentYear} Powered by&nbsp;{' '}
              <span className="text-primary-600">
                {settings.restaurant_name}
              </span>
            </p>

            {/* Bottom Links */}
            <div className="flex items-center gap-2">
              <Link
                href="/privacy-policy"
                className="text-[.8rem] transition-all underline"
                style={{ color: 'var(--text-primary)' }}
              >
                Privacy Policy
              </Link>
              <div
                className="h-3 w-px"
                style={{ backgroundColor: 'var(--text-primary)' }}
              />
              <Link
                href="/faqs"
                className="text-[.8rem] transition-all underline"
                style={{ color: 'var(--text-primary)' }}
              >
                FAQs
              </Link>
            </div>
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