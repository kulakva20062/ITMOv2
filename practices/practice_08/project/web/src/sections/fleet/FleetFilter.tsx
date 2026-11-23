import { CAR_CLASSES, CLASS_LABELS, GEARBOXES, GEARBOX_LABELS } from '@legacy/cars.js';
import { FILTER_ANY, countLabel } from '@legacy/filter.js';

import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

const LABELS_BY_VALUE = { ...CLASS_LABELS, ...GEARBOX_LABELS } as Record<string, string>;

type FleetFilterProps = {
  carClass: string;
  gearbox: string;
  shown: number;
  total: number;
  onCarClassChange: (value: string) => void;
  onGearboxChange: (value: string) => void;
};

// Отбор — только select: input внутри #fleet ломает инвариант реестра (§5.3).
export function FleetFilter({
  carClass,
  gearbox,
  shown,
  total,
  onCarClassChange,
  onGearboxChange,
}: FleetFilterProps) {
  return (
    <div className="mb-2 grid items-end gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="fleet-filter-class">Класс</Label>
        <Select
          id="fleet-filter-class"
          name="car-class"
          value={carClass}
          onChange={(event) => onCarClassChange(event.target.value)}
        >
          <option value={FILTER_ANY}>Любой класс</option>
          {CAR_CLASSES.map((value) => (
            <option key={value} value={value}>
              {LABELS_BY_VALUE[value] ?? value}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="fleet-filter-gearbox">Коробка</Label>
        <Select
          id="fleet-filter-gearbox"
          name="gearbox"
          value={gearbox}
          onChange={(event) => onGearboxChange(event.target.value)}
        >
          <option value={FILTER_ANY}>Любая коробка</option>
          {GEARBOXES.map((value) => (
            <option key={value} value={value}>
              {LABELS_BY_VALUE[value] ?? value}
            </option>
          ))}
        </Select>
      </div>

      <p id="fleet-count" role="status" className="m-0 text-sm text-muted-foreground">
        {countLabel(shown, total)}
      </p>
    </div>
  );
}
