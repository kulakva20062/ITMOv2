import { useEffect, useRef } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';

// Двухслойный cursor spotlight: ореол с инерцией + кольцо-курсор.
// Ореол на светлом фоне работает в multiply (виден на белом), на тёмном — в screen.
// Кольцо увеличивается на интерактивных элементах. При reduced-motion и на тач — выключено.
export function CursorGlow() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) {
      return undefined;
    }

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!fine.matches) {
      return undefined;
    }

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = 0;

    const tick = () => {
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;
      root.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      raf = 0;

      if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;

      if (root.dataset.active !== 'true') {
        currentX = targetX;
        currentY = targetY;
      }

      root.dataset.active = 'true';

      const element = event.target as Element | null;
      root.dataset.interactive = element?.closest(
        'a, button, input, select, summary, .car, [role="button"]',
      )
        ? 'true'
        : 'false';
      root.dataset.theme = element?.closest('.surface-night') ? 'night' : 'paper';

      if (!raf) {
        raf = requestAnimationFrame(tick);
      }
    };

    const onLeave = () => {
      root.dataset.active = 'false';
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        onLeave();
      }
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('pointercancel', onLeave);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('pointercancel', onLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (raf) {
        cancelAnimationFrame(raf);
      }
      delete root.dataset.active;
    };
  }, [reduced]);

  return (
    <div ref={rootRef} className="cursor-glow" aria-hidden="true">
      <div className="cursor-glow__halo" />
      <div className="cursor-glow__ring" />
    </div>
  );
}
