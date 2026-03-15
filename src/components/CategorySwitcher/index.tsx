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
        transition: 'background-color 0.3s ease',
      }}
    >
      <div className="container-custom">
        <div
          ref={scrollRef}
          className="no-scrollbar flex items-center gap-2 overflow-x-auto py-3 sm:gap-3 sm:py-4"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              data-category-id={category.id}
              onClick={() => onCategoryClick(category.id)}
              className={`category-chip ${
                activeCategory === category.id ? 'active' : ''
              }`}
            >
              {category.image_url && (
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="mr-1.5 inline-block h-5 w-5 rounded-full object-cover"
                />
              )}
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategorySwitcher;