import { CLASS_LABELS, GEARBOX_LABELS, seatsLabel } from '@legacy/cars.js';
import { formatPrice } from '@legacy/format.js';

import type { Car } from '@/components/Receipt';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useReveal } from '@/hooks/useReveal';
import { cn } from '@/lib/utils';

const LABELS_BY_VALUE = { ...CLASS_LABELS, ...GEARBOX_LABELS } as Record<string, string>;

type CarCardProps = {
  car: Car;
  chosen: boolean;
  order: number;
  onCalc: (carId: string) => void;
};

export function CarCard({ car, chosen, order, onCalc }: CarCardProps) {
  const ref = useReveal<HTMLElement>(order);

  return (
    <article
      ref={ref}
      data-reveal
      data-car-id={car.id}
      data-chosen={chosen ? 'true' : undefined}
      className={cn(
        'car card hover-glow flex flex-col gap-1 rounded-sm border border-border bg-card p-s2 text-card-foreground',
        chosen && '!border-foreground outline outline-2 outline-primary',
      )}
    >
      <h3 className="car__model flex flex-wrap items-center gap-1 text-base">
        {car.model}
        {chosen ? <Badge className="px-1 py-0" variant="secondary">Выбрана</Badge> : null}
      </h3>

      <dl className="car__meta grid grid-cols-[auto_1fr] gap-x-2 gap-y-0 text-sm">
        <dt className="text-muted-foreground">Класс</dt>
        <dd className="m-0 text-right">{LABELS_BY_VALUE[car.class] ?? car.class}</dd>

        <dt className="text-muted-foreground">Коробка</dt>
        <dd className="m-0 text-right">{LABELS_BY_VALUE[car.gearbox] ?? car.gearbox}</dd>

        <dt className="text-muted-foreground">Салон</dt>
        <dd className="m-0 text-right">{seatsLabel(car.seats)}</dd>

        <dt className="text-muted-foreground">Цена за сутки</dt>
        <dd className="car__price m-0 text-right font-semibold tabular-nums">
          {formatPrice(car.pricePerDay)}
          <span className="car__per text-muted-foreground"> / сут</span>
        </dd>
      </dl>

      <Button className="mt-auto self-start" size="sm" type="button" data-calc-for={car.id} onClick={() => onCalc(car.id)}>
        Рассчитать
      </Button>
    </article>
  );
}
