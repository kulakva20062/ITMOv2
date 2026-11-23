import { useEffect, useRef, type CSSProperties } from 'react';

import { useReducedMotion } from '@/hooks/useReducedMotion';

// §3.2: смещение не больше 24px, только transform, off при reduce и уже 768px.
const MAX_SHIFT = 24;

function strokeStyle(index: number) {
  return { '--stroke-index': index } as CSSProperties;
}

export function HeroCarSvg() {
  const svgRef = useRef<SVGSVGElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || reducedMotion) {
      return;
    }

    const wide = window.matchMedia('(min-width: 768px)');
    let frame = 0;

    const apply = () => {
      frame = 0;
      const scene = svg.closest('section');
      if (!scene || !wide.matches) {
        svg.style.removeProperty('transform');
        return;
      }

      const progress = Math.min(Math.max(-scene.getBoundingClientRect().top / scene.offsetHeight, 0), 1);
      svg.style.transform = `translateY(${(progress * MAX_SHIFT).toFixed(2)}px)`;
    };

    const schedule = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(apply);
      }
    };

    apply();
    window.addEventListener('scroll', schedule, { passive: true });
    wide.addEventListener('change', schedule);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('scroll', schedule);
      wide.removeEventListener('change', schedule);
      svg.style.removeProperty('transform');
    };
  }, [reducedMotion]);

  return (
    <svg
      ref={svgRef}
      className="hero__drawing"
      viewBox="0 0 480 240"
      role="img"
      aria-label="Схема автомобиля в профиль"
      data-parallax
      style={{ '--stroke-count': 6 } as CSSProperties}
    >
      <g className="hero__lines" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          pathLength={1}
          style={strokeStyle(0)}
          d="M45 155 L70 115 L145 100 L205 48 L325 48 L385 105 L430 120 L445 155 Z"
        />
        <path pathLength={1} style={strokeStyle(1)} d="M155 100 L215 58 L265 58 L265 100" />
        <path pathLength={1} style={strokeStyle(2)} d="M275 58 L320 58 L365 100 L275 100" />
        <circle pathLength={1} style={strokeStyle(3)} cx="140" cy="160" r="35" />
        <circle pathLength={1} style={strokeStyle(4)} cx="365" cy="160" r="35" />
        <path pathLength={1} style={strokeStyle(5)} d="M20 205 H460" />
      </g>
      <path className="hero__panel" d="M275 108 H365 L385 150 H275 Z" />
    </svg>
  );
}
