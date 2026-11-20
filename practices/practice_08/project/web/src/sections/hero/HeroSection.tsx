import type { CSSProperties } from 'react';

import { Button } from '@/components/ui/button';
import { HeroCarSvg } from '@/sections/hero/HeroCarSvg';

// Единственный разрешённый градиент — декоративная blueprint-сетка (§2.5),
// линии только из --rule-night.
const blueprint: CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, var(--rule-night) 1px, transparent 1px), linear-gradient(to bottom, var(--rule-night) 1px, transparent 1px)',
  backgroundSize: '40px 40px',
  opacity: 0.35,
};

export function HeroSection() {
  return (
    <section className="surface-night relative overflow-hidden" id="hero">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={blueprint} />
      <div className="container hero relative">
        <div>
          <p className="rail">Лист осмотра №&nbsp;04&#8209;26</p>
          <h1>Берёте машину — цену видите сразу</h1>
          <p className="hero__lead">
            Восемь машин четырёх классов. Цена за сутки открыта в автопарке, залог возвращаем при
            сдаче машины. Ничего не надо уточнять по телефону.
          </p>
          <Button asChild className="max-sm:w-full">
            <a href="#fleet">Выбрать автомобиль</a>
          </Button>
        </div>
        <HeroCarSvg />
      </div>
    </section>
  );
}
