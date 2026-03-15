'use client';

import { useEffect, useRef } from 'react';
import { Category } from '@/types';
import gsap from 'gsap';

interface CategorySwitcherProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryClick: (categoryId: string) => void;
}

const CategorySwitcher = ({
  categories,
  activeCategory,
  onCategoryClick,
}: CategorySwitcherProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  // Scroll active category chip into view
  useEffect(() => {
    if (!activeCategory || !scrollRef.current) return;

    const activeChip = scrollRef.current.querySelector(
      `[data-category-id="${activeCategory}"]`
    );

    if (activeChip) {
      activeChip.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeCategory]);

  // Animate on mount
  useEffect(() => {
    if (stickyRef.current) {
      gsap.fromTo(
        stickyRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', delay: 3.6 }
      );
    }
  }, []);

  if (categories.length === 0) return null;

  return (
    <div
      ref={stickyRef}
      className="sticky top-0 z-20 opacity-0"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        boxShadow: '0 2px 10px var(--shadow-color)',
        transition: 'background-color 0.3s ease',
      }}
    >
      <div className="container-custom">
        <div
          ref={scrollRef}
          className="no-scrollbar flex items-center gap-2 overflow-x-auto py-3 sm:gap-3 sm:py-4"
        >
          {categories.map((category) => {
            const isActive = activeCategory === category.id;

            return (
              <button
                key={category.id}
                data-category-id={category.id}
                onClick={() => onCategoryClick(category.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 sm:px-5 sm:py-2.5 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-md scale-105'
                    : ''
                }`}
                style={
                  !isActive
                    ? {
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                      }
                    : {}
                }
              >
                {/* Small category icon/image */}
                {category.image_url && (
                  <div className="h-5 w-5 flex-shrink-0 overflow-hidden rounded-full sm:h-6 sm:w-6">
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategorySwitcher;