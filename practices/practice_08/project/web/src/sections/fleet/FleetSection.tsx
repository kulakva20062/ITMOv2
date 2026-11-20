import { useState } from 'react';

import { cars } from '@legacy/cars.js';
import { formatPrice } from '@legacy/format.js';
import { EMPTY_MESSAGE, FILTER_ANY, countLabel, filterCars } from '@legacy/filter.js';

import type { Car } from '@/components/Receipt';
import { CarCard } from '@/sections/fleet/CarCard';
import { FleetFilter } from '@/sections/fleet/FleetFilter';
import { useReveal } from '@/hooks/useReveal';
import { useRental } from '@/state/rental';

export function FleetSection() {
  const { chosenCarId, chooseCar } = useRental();
  const [carClass, setCarClass] = useState(FILTER_ANY);
  const [gearbox, setGearbox] = useState(FILTER_ANY);
  const [status, setStatus] = useState('');
  const sectionRef = useReveal<HTMLElement>();

  // filterCars из JS-модуля выводит список как any[] — тип карточек берём из Car (§4.1.1).
  const shown = filterCars(cars, { carClass, gearbox }) as Car[];

  function handleCalc(carId: string) {
    const car = cars.find((item) => item.id === carId);
    if (!car) {
      return;
    }

    chooseCar(car.id);
    setStatus(`Выбрана ${car.model} — ${formatPrice(car.pricePerDay)} за сутки.`);

    // §5.3: скролл и фокус — собственные эффекты перехода, состояние уходит только через store.
    document.getElementById('calculator')?.scrollIntoView({ block: 'start' });
    document.getElementById('calc-car')?.focus();
  }

  return (
    <section className="section" id="fleet" data-reveal ref={sectionRef}>
      <div className="container">
        <p className="rail">Автопарк</p>
        <h2>Восемь машин, цена за сутки</h2>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Нажмите «Рассчитать» у машины — отметим её как выбранную для расчёта срока.
        </p>

        <FleetFilter
          carClass={carClass}
          gearbox={gearbox}
          shown={shown.length}
          total={cars.length}
          onCarClassChange={setCarClass}
          onGearboxChange={setGearbox}
        />

        <div id="fleet-list" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {shown.length === 0 ? (
            <p className="fleet__empty m-0 border border-dashed border-border p-s2 text-muted-foreground sm:col-span-2 lg:col-span-3">
              {EMPTY_MESSAGE}
            </p>
          ) : (
            shown.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                chosen={car.id === chosenCarId}
                // §3.1: суммарный stagger ≤ 300ms → ступень не выше 5 (5 × 60ms).
                order={Math.min(cars.indexOf(car), 5)}
                onCalc={handleCalc}
              />
            ))
          )}
        </div>

        <p id="fleet-status" role="status" className="m-0 mt-2 text-sm text-muted-foreground">
          {status}
        </p>
      </div>
    </section>
  );
}
