'use client';

import { useEffect, useState } from 'react';
import gsap from 'gsap';

const LoadingScreen = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Animate the logo
    gsap.fromTo(
      '.loading-logo',
      { scale: 0.5, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.8,
        ease: 'back.out(1.7)',
        onComplete: () => {
          // Zoom in-out loop
          gsap.to('.loading-logo', {
            scale: 1.1,
            duration: 0.6,
            yoyo: true,
            repeat: 2,
            ease: 'power1.inOut',
            onComplete: () => {
              // Fade out the loading screen
              gsap.to('.loading-screen', {
                opacity: 0,
                duration: 0.5,
                ease: 'power2.inOut',
                onComplete: () => {
                  setIsLoading(false);
                },
              });
            },
          });
        },
      }
    );
  }, []);

  if (!isLoading) return null;

  return (
    <div className="loading-screen fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Blurred Background */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Logo Container */}
      <div className="loading-logo relative z-10 flex flex-col items-center gap-4">
        {/* Pizza Logo SVG */}
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary-600 shadow-2xl sm:h-40 sm:w-40">
          <svg
            viewBox="0 0 100 100"
            className="h-20 w-20 sm:h-24 sm:w-24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Pizza Slice Shape */}
            <path
              d="M50 10 L85 80 Q50 95 15 80 Z"
              fill="#FACC15"
              stroke="#EAB308"
              strokeWidth="2"
            />
            {/* Crust */}
            <path
              d="M15 80 Q50 95 85 80"
              fill="#D97706"
              stroke="#B45309"
              strokeWidth="2"
            />
            {/* Pepperoni */}
            <circle cx="45" cy="45" r="6" fill="#DC2626" />
            <circle cx="60" cy="55" r="5" fill="#DC2626" />
            <circle cx="38" cy="65" r="5.5" fill="#DC2626" />
            <circle cx="55" cy="72" r="4.5" fill="#DC2626" />
            {/* Cheese dots */}
            <circle cx="50" cy="58" r="2" fill="#FDE68A" />
            <circle cx="42" cy="52" r="1.5" fill="#FDE68A" />
            <circle cx="62" cy="68" r="1.5" fill="#FDE68A" />
          </svg>
        </div>

        {/* Restaurant Name */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-wider text-white sm:text-4xl">
            NONSTOP
          </h1>
          <h2 className="text-xl font-bold tracking-widest text-primary-400 sm:text-2xl">
            PIZZA
          </h2>
        </div>

        {/* Loading Dots */}
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary-500" style={{ animationDelay: '0ms' }} />
          <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary-500" style={{ animationDelay: '150ms' }} />
          <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary-500" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;