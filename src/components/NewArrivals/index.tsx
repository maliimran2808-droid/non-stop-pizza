'use client';

import { useEffect, useRef } from 'react';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import gsap from 'gsap';

interface NewArrivalsProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

const NewArrivals = ({ products, onProductClick }: NewArrivalsProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    gsap.set(element, { opacity: 0, y: 30 });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(element, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
          });
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  if (products.length === 0) return null;

  return (
    <section ref={sectionRef} className="opacity-0">
      <div className="container-custom py-6 sm:py-8">
        {/* Section Title */}
        <div className="mb-4 flex items-center gap-3 sm:mb-6">
          <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-primary-500 to-yellow-500" />
          <h2
            className="text-xl font-bold sm:text-2xl"
            style={{ color: 'var(--text-primary)' }}
          >
            🔥 New Arrivals
          </h2>
          <div
            className="hidden h-px flex-1 sm:block"
            style={{ backgroundColor: 'var(--border-color)' }}
          />
        </div>

        {/* Products Grid */}
        <div className="product-grid">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              onProductClick={onProductClick}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;