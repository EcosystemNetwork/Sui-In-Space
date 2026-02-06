import { useRef, useEffect, useCallback } from 'react';
import { animate, stagger, set, type JSAnimation, type AnimationParams, type TargetsParam } from 'animejs';

/**
 * Custom hook for anime.js animations
 * Provides reusable animation utilities for the Sui-In-Space UI
 */

// Animation presets for common UI patterns
export const animationPresets = {
  // Fade in from below
  fadeInUp: {
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 600,
    ease: 'outCubic',
  },
  // Fade in from above
  fadeInDown: {
    opacity: [0, 1],
    translateY: [-20, 0],
    duration: 600,
    ease: 'outCubic',
  },
  // Scale up entrance
  scaleIn: {
    opacity: [0, 1],
    scale: [0.9, 1],
    duration: 500,
    ease: 'outBack',
  },
  // Pulse effect
  pulse: {
    scale: [1, 1.05, 1],
    duration: 800,
    ease: 'inOutSine',
  },
  // Glow effect (for holographic UI)
  glow: {
    boxShadow: [
      '0 0 0px rgba(34, 211, 238, 0)',
      '0 0 20px rgba(34, 211, 238, 0.5)',
      '0 0 0px rgba(34, 211, 238, 0)',
    ],
    duration: 2000,
    ease: 'inOutSine',
    loop: true,
  },
  // Slide in from left
  slideInLeft: {
    opacity: [0, 1],
    translateX: [-30, 0],
    duration: 500,
    ease: 'outCubic',
  },
  // Slide in from right
  slideInRight: {
    opacity: [0, 1],
    translateX: [30, 0],
    duration: 500,
    ease: 'outCubic',
  },
  // Float effect (for space elements)
  float: {
    translateY: [-5, 5],
    duration: 3000,
    ease: 'inOutSine',
    alternate: true,
    loop: true,
  },
  // Shimmer effect
  shimmer: {
    opacity: [0.5, 1, 0.5],
    duration: 2000,
    ease: 'inOutSine',
    loop: true,
  },
  // Star twinkle effect
  twinkle: {
    opacity: [0.2, 1, 0.2],
    scale: [0.8, 1.2, 0.8],
    duration: 2000,
    ease: 'inOutSine',
    loop: true,
  },
} as const satisfies Record<string, AnimationParams>;

/**
 * Hook for running anime.js animations with cleanup
 */
export function useAnime<T extends HTMLElement = HTMLElement>() {
  const elementRef = useRef<T>(null);
  const animationRef = useRef<JSAnimation | null>(null);

  const runAnimate = useCallback((config: AnimationParams) => {
    if (elementRef.current) {
      // Clean up previous animation
      if (animationRef.current) {
        animationRef.current.pause();
      }
      
      animationRef.current = animate(elementRef.current, config);
      
      return animationRef.current;
    }
    return null;
  }, []);

  const stop = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.pause();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.pause();
      }
    };
  }, []);

  return { elementRef, animate: runAnimate, stop };
}

/**
 * Hook for staggered list animations
 */
export function useStaggeredAnimation<T extends HTMLElement = HTMLElement>(
  config: AnimationParams = {},
  staggerDelay: number = 100
) {
  const containerRef = useRef<T>(null);
  const animationRef = useRef<JSAnimation | null>(null);

  const animateChildren = useCallback((selector: string = '> *') => {
    if (containerRef.current) {
      const children = containerRef.current.querySelectorAll(selector);
      if (children.length > 0) {
        animationRef.current = animate(children, {
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 600,
          ease: 'outCubic',
          delay: stagger(staggerDelay),
          ...config,
        });
      }
    }
  }, [config, staggerDelay]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.pause();
      }
    };
  }, []);

  return { containerRef, animateChildren };
}

/**
 * Hook for entrance animations that trigger once on mount
 */
export function useEntranceAnimation<T extends HTMLElement = HTMLElement>(
  preset: keyof typeof animationPresets | AnimationParams = 'fadeInUp',
  delay: number = 0
) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (elementRef.current) {
      const config = typeof preset === 'string' ? animationPresets[preset] : preset;
      
      // Set initial state
      set(elementRef.current, { opacity: 0 });
      
      const animation = animate(elementRef.current, {
        ...config,
        delay,
      });

      return () => {
        animation.pause();
      };
    }
  }, [preset, delay]);

  return elementRef;
}

/**
 * Hook for hover animations
 */
export function useHoverAnimation<T extends HTMLElement = HTMLElement>(
  enterConfig: AnimationParams = { scale: 1.05, duration: 300 },
  leaveConfig: AnimationParams = { scale: 1, duration: 300 }
) {
  const elementRef = useRef<T>(null);
  const animationRef = useRef<JSAnimation | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseEnter = () => {
      if (animationRef.current) animationRef.current.pause();
      animationRef.current = animate(element, {
        ...enterConfig,
        ease: 'outCubic',
      });
    };

    const handleMouseLeave = () => {
      if (animationRef.current) animationRef.current.pause();
      animationRef.current = animate(element, {
        ...leaveConfig,
        ease: 'outCubic',
      });
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) animationRef.current.pause();
    };
  }, [enterConfig, leaveConfig]);

  return elementRef;
}

/**
 * Hook for progress bar animations
 */
export function useProgressAnimation(
  value: number,
  duration: number = 1000
) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      animate(elementRef.current, {
        width: `${Math.min(100, Math.max(0, value))}%`,
        duration,
        ease: 'outCubic',
      });
    }
  }, [value, duration]);

  return elementRef;
}

/**
 * Hook for number counter animations
 */
export function useCounterAnimation(
  targetValue: number,
  duration: number = 1500,
  formatFn: (value: number) => string = (value) => Math.floor(value).toLocaleString()
) {
  const elementRef = useRef<HTMLElement>(null);
  const currentValue = useRef({ value: 0 });

  useEffect(() => {
    if (elementRef.current) {
      const element = elementRef.current;
      
      animate(currentValue.current, {
        value: targetValue,
        duration,
        ease: 'outCubic',
        round: 1,
        onRender: () => {
          element.textContent = formatFn(currentValue.current.value);
        },
      });
    }
  }, [targetValue, duration, formatFn]);

  return elementRef;
}

/**
 * Utility function for running one-off animations
 */
export function runAnimation(
  targets: TargetsParam,
  config: AnimationParams
): JSAnimation {
  return animate(targets, config);
}

/**
 * Create a staggered entrance animation for multiple elements
 */
export function staggerEntrance(
  targets: TargetsParam,
  staggerDelay: number = 100,
  config: Partial<AnimationParams> = {}
): JSAnimation {
  return animate(targets, {
    opacity: [0, 1],
    translateY: [30, 0],
    duration: 600,
    ease: 'outCubic',
    delay: stagger(staggerDelay),
    ...config,
  });
}

export { animate, stagger, set };
