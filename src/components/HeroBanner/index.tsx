'use client';

import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import gsap from 'gsap';

// Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

import { BannerSlide } from '@/types';
import { supabase } from '@/lib/supabase-client';

// Placeholder banners (used when no banners in database)
const placeholderBanners = [
  {
    id: '1',
    title: 'Welcome to NonStop Pizza',
    subtitle: 'Fresh & Hot Pizza Delivered to Your Doorstep 🍕',
    image_url: '',
    link_url: null,
    display_order: 1,
    is_active: true,
    created_at: '',
    gradient: 'from-red-800 via-red-600 to-orange-500',
  },
  {
    id: '2',
    title: 'Special Deals Today!',
    subtitle: 'Get 30% OFF on all Large Pizzas 🔥',
    image_url: '',
    link_url: null,
    display_order: 2,
    is_active: true,
    created_at: '',
    gradient: 'from-orange-700 via-red-600 to-red-800',
  },
  {
    id: '3',
    title: 'Try Our New Arrivals',
    subtitle: 'Explore our latest mouth-watering recipes 🍔',
    image_url: '',
    link_url: null,
    display_order: 3,
    is_active: true,
    created_at: '',
    gradient: 'from-red-900 via-red-700 to-yellow-600',
  },
];

const HeroBanner = () => {
  const [banners, setBanners] = useState<(BannerSlide & { gradient?: string })[]>(placeholderBanners);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch banners from database
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from('banner_slides')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
          setBanners(data);
        }
      } catch (err) {
        console.log('Using placeholder banners');
      }
      setIsLoaded(true);
    };

    fetchBanners();
  }, []);

  // Animate on load
  useEffect(() => {
    if (isLoaded) {
      gsap.fromTo(
        '.hero-banner',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 3.2 }
      );
    }
  }, [isLoaded]);

  return (
    <section className="hero-banner opacity-0">
     <div className="container-custom py-2 sm:py-4">
        <div className="overflow-hidden rounded-2xl shadow-xl">
          <Swiper
            modules={[Autoplay, Pagination, Navigation, EffectFade]}
            spaceBetween={0}
            slidesPerView={1}
            effect="fade"
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            navigation={true}
            loop={true}
            speed={800}
            className="hero-swiper"
          >
            {banners.map((banner, index) => (
              <SwiperSlide key={banner.id}>
                {/* If banner has image */}
                {banner.image_url ? (
                  <div className="relative h-[200px] w-full sm:h-[300px] md:h-[400px] lg:h-[500px]">
                    <img
                      src={banner.image_url}
                      alt={banner.title || 'Banner'}
                      className="h-full w-full object-cover"
                    />
                    {/* Overlay with text */}
                    {(banner.title || banner.subtitle) && (
                      <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/60 to-transparent">
                        <div className="px-8 sm:px-12 md:px-16">
                          {banner.title && (
                            <h2 className="text-2xl font-extrabold text-white sm:text-3xl md:text-4xl lg:text-5xl">
                              {banner.title}
                            </h2>
                          )}
                          {banner.subtitle && (
                            <p className="mt-2 text-sm text-gray-200 sm:mt-4 sm:text-lg md:text-xl">
                              {banner.subtitle}
                            </p>
                          )}
                          <button className="btn-primary mt-4 sm:mt-6">
                            Order Now
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Placeholder banner with gradient */
                  <div
                    className={`relative flex h-[200px] w-full items-center bg-gradient-to-r sm:h-[300px] md:h-[400px] lg:h-[500px] ${
                      banner.gradient || 'from-red-800 to-orange-500'
                    }`}
                  >
                    {/* Decorative Pizza Elements */}
                    <div className="absolute inset-0 overflow-hidden">
                      {/* Large Pizza Circle */}
                      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 sm:h-96 sm:w-96" />
                      <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/5 sm:h-72 sm:w-72" />
                      <div className="absolute right-1/4 top-1/4 h-20 w-20 rounded-full bg-white/5 sm:h-32 sm:w-32" />

                      {/* Floating Pizza Emojis */}
                      <div className="absolute right-[10%] top-[20%] text-4xl opacity-20 sm:text-6xl">
                        🍕
                      </div>
                      <div className="absolute bottom-[20%] right-[30%] text-3xl opacity-15 sm:text-5xl">
                        🍕
                      </div>
                      <div className="absolute bottom-[30%] right-[15%] text-2xl opacity-10 sm:text-4xl">
                        🧀
                      </div>
                    </div>

                    {/* Text Content */}
                    <div className="relative z-10 px-8 sm:px-12 md:px-16">
                      {banner.title && (
                        <h2 className="text-2xl font-extrabold text-white drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl">
                          {banner.title}
                        </h2>
                      )}
                      {banner.subtitle && (
                        <p className="mt-2 text-sm text-white/80 sm:mt-4 sm:text-lg md:text-xl">
                          {banner.subtitle}
                        </p>
                      )}
                      <button className="mt-4 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-red-600 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl sm:mt-6 sm:px-8 sm:py-3 sm:text-base">
                        Order Now 🍕
                      </button>
                    </div>
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Custom Swiper Styles */}
      <style jsx global>{`
        .hero-swiper .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background: white;
          opacity: 0.5;
          transition: all 0.3s ease;
        }

        .hero-swiper .swiper-pagination-bullet-active {
          opacity: 1;
          background: #dc2626;
          width: 28px;
          border-radius: 5px;
        }

        .hero-swiper .swiper-button-next,
        .hero-swiper .swiper-button-prev {
          color: white;
          background: rgba(0, 0, 0, 0.3);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .hero-swiper .swiper-button-next:hover,
        .hero-swiper .swiper-button-prev:hover {
          background: rgba(220, 38, 38, 0.8);
        }

        .hero-swiper .swiper-button-next::after,
        .hero-swiper .swiper-button-prev::after {
          font-size: 16px;
          font-weight: bold;
        }

        @media (max-width: 640px) {
          .hero-swiper .swiper-button-next,
          .hero-swiper .swiper-button-prev {
            width: 32px;
            height: 32px;
          }

          .hero-swiper .swiper-button-next::after,
          .hero-swiper .swiper-button-prev::after {
            font-size: 12px;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroBanner;