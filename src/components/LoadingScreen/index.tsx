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
        <div className="flex h-auto w-32 items-center justify-center">
          <img src='/logo2.webp' />
        </div>
        hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii
        {/* Restaurant Name */}
        <div className="text-center" style={{ fontFamily: 'Poppins' }}>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary-500" style={{ animationDelay: '0ms' }} />
            <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary-500" style={{ animationDelay: '150ms' }} />
            <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary-500" style={{ animationDelay: '300ms' }} />
          </div>


        </div>

        {/* Loading Dots */}

      </div>
    </div>
  );
};

export default LoadingScreen;