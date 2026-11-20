import { useLayoutEffect, useRef } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';

export function useReveal<T extends HTMLElement>(index = 0) {
  const ref = useRef<T>(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const element = ref.current;
    if (reducedMotion || !element) {
      return;
    }

    const step = Math.min(Math.max(index, 0), 6);
    element.style.transitionDelay = `calc(${step} * var(--stagger-reveal))`;
    element.classList.add('is-pending');

    const reveal = () => {
      element.classList.remove('is-pending');
      element.classList.add('is-revealed');
    };

    if (typeof IntersectionObserver === 'undefined') {
      reveal();
      return () => {
        element.classList.remove('is-revealed');
        element.style.removeProperty('transition-delay');
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          reveal();
          observer.unobserve(element);
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      element.classList.remove('is-pending', 'is-revealed');
      element.style.removeProperty('transition-delay');
    };
  }, [index, reducedMotion]);

  return ref;
}
