'use client';

import { useEffect, useState, useRef, RefObject } from 'react';

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
}

export const useInView = (
  options: UseInViewOptions = {}
): [RefObject<HTMLDivElement | null>, boolean] => {
  const { threshold = 0.3, rootMargin = '0px' } = options;
  const ref = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin]);

  return [ref, isInView];
};

// Hook to track which category section is in view
export const useActiveCategoryOnScroll = (
  categoryIds: string[]
): string | null => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    if (categoryIds.length === 0) return;

    const observers: IntersectionObserver[] = [];

    categoryIds.forEach((id) => {
      const element = document.getElementById(`category-${id}`);
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveCategory(id);
          }
        },
        {
          threshold: 0.2,
          rootMargin: '-100px 0px -50% 0px',
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [categoryIds]);

  return activeCategory;
};