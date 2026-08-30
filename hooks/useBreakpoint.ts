'use client';

import { useState, useEffect } from 'react';

export interface Breakpoints {
  isMobile: boolean;   // < 640px
  isTablet: boolean;   // 640px - 1023px
  isLaptop: boolean;   // 1024px - 1439px
  isDesktop: boolean;  // >= 1440px
  is4K: boolean;       // >= 2560px
  width: number;
  height: number;
  isTouch: boolean;
}

export function useBreakpoint(): Breakpoints {
  const [screenState, setScreenState] = useState<Breakpoints>({
    isMobile: false,
    isTablet: false,
    isLaptop: false,
    isDesktop: false,
    is4K: false,
    width: 0,
    height: 0,
    isTouch: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const queries = {
      mobile: window.matchMedia('(max-width: 639px)'),
      tablet: window.matchMedia('(min-width: 640px) and (max-width: 1023px)'),
      laptop: window.matchMedia('(min-width: 1024px) and (max-width: 1439px)'),
      desktop: window.matchMedia('(min-width: 1440px)'),
      fourK: window.matchMedia('(min-width: 2560px)'),
      touch: window.matchMedia('(hover: none) or (pointer: coarse)'),
    };

    const updateMatches = () => {
      setScreenState({
        isMobile: queries.mobile.matches,
        isTablet: queries.tablet.matches,
        isLaptop: queries.laptop.matches,
        isDesktop: queries.desktop.matches,
        is4K: queries.fourK.matches,
        width: window.innerWidth,
        height: window.innerHeight,
        isTouch: queries.touch.matches,
      });
    };

    updateMatches();

    window.addEventListener('resize', updateMatches, { passive: true });
    Object.values(queries).forEach((q) => q.addEventListener('change', updateMatches));

    return () => {
      window.removeEventListener('resize', updateMatches);
      Object.values(queries).forEach((q) => q.removeEventListener('change', updateMatches));
    };
  }, []);

  return screenState;
}
