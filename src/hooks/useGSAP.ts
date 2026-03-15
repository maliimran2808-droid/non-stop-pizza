'use client';

import { useEffect, useRef, RefObject } from 'react';
import gsap from 'gsap';

// Fade in from bottom
export const useFadeInUp = (
  delay: number = 0
): RefObject<HTMLDivElement | null> => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    gsap.fromTo(
      element,
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay,
        ease: 'power3.out',
      }
    );
  }, [delay]);

  return ref;
};

// Fade in from left
export const useFadeInLeft = (
  delay: number = 0
): RefObject<HTMLDivElement | null> => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    gsap.fromTo(
      element,
      {
        opacity: 0,
        x: -50,
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        delay,
        ease: 'power3.out',
      }
    );
  }, [delay]);

  return ref;
};

// Fade in from right
export const useFadeInRight = (
  delay: number = 0
): RefObject<HTMLDivElement | null> => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    gsap.fromTo(
      element,
      {
        opacity: 0,
        x: 50,
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        delay,
        ease: 'power3.out',
      }
    );
  }, [delay]);

  return ref;
};

// Scale in (zoom effect)
export const useScaleIn = (
  delay: number = 0
): RefObject<HTMLDivElement | null> => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    gsap.fromTo(
      element,
      {
        opacity: 0,
        scale: 0.5,
      },
      {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        delay,
        ease: 'back.out(1.7)',
      }
    );
  }, [delay]);

  return ref;
};

// Scroll triggered animation
export const useScrollAnimation = (
  animation: 'fadeUp' | 'fadeLeft' | 'fadeRight' | 'scaleIn' = 'fadeUp'
): RefObject<HTMLDivElement | null> => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const animations = {
      fadeUp: { from: { opacity: 0, y: 60 }, to: { opacity: 1, y: 0 } },
      fadeLeft: { from: { opacity: 0, x: -60 }, to: { opacity: 1, x: 0 } },
      fadeRight: { from: { opacity: 0, x: 60 }, to: { opacity: 1, x: 0 } },
      scaleIn: { from: { opacity: 0, scale: 0.8 }, to: { opacity: 1, scale: 1 } },
    };

    const anim = animations[animation];

    gsap.set(element, anim.from);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(element, {
            ...anim.to,
            duration: 0.8,
            ease: 'power3.out',
          });
          observer.unobserve(element);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [animation]);

  return ref;
};

// Stagger children animation
export const useStaggerChildren = (
  stagger: number = 0.1
): RefObject<HTMLDivElement | null> => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const children = element.children;

    gsap.fromTo(
      children,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger,
        ease: 'power2.out',
      }
    );
  }, [stagger]);

  return ref;
};