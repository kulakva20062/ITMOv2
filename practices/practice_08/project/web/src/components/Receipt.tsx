import { discountRate } from '@legacy/calc.js';
import type { calculateRental } from '@legacy/calc.js';
import type { cars } from '@legacy/cars.js';
import { formatPrice } from '@legacy/format.js';
import type { confirmationView, snapshotView } from '@legacy/booking-form.js';

import { cn } from '@/lib/utils';

export type ReceiptTone = 'normal' | 'total' | 'deposit';
export type ReceiptRow = { label: string; value: string; tone?: ReceiptTone };
export type ReceiptProps = { rows: ReceiptRow[]; className?: string };
export type Car = (typeof cars)[number];
export type RentalResult = ReturnType<typeof calculateRental>;

export function Receipt({ rows, className }: ReceiptProps) {
  return (
    <dl className={cn('receipt', className)}>
      {rows.map((row, index) => (
        <div
          className={cn(
            'receipt__row',
            row.tone === 'total' && 'receipt__row--total',
            row.tone === 'deposit' && 'receipt__row--deposit',
          )}
          key={`${row.label}-${index}`}
        >
          <dt className="receipt__label">{row.label}</dt>
          <dd className="receipt__value">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function calcReceiptRows(result: RentalResult, car: Car, days: number): ReceiptRow[] {
  const rows: ReceiptRow[] = [
    { label: `Аренда ${car.model}, ${days} сут.`, value: formatPrice(result.base) },
  ];

  if (result.discount > 0) {
    rows.push({
      label: `Скидка за срок, ${Math.round(discountRate(days) * 100)} %`,
      value: `−${formatPrice(result.discount)}`,
    });
  }
  if (result.extrasTotal > 0) {
    rows.push({ label: `Опции, ${days} сут.`, value: formatPrice(result.extrasTotal) });
  }
  if (result.insurance > 0) {
    rows.push({ label: 'Полная страховка', value: formatPrice(result.insurance) });
  }

  rows.push({ label: 'Итого к оплате', value: formatPrice(result.total), tone: 'total' });
  rows.push({ label: 'Залог, вернём при сдаче', value: formatPrice(result.deposit), tone: 'deposit' });
  return rows;
}

export function snapshotReceiptRows(view: ReturnType<typeof snapshotView>): ReceiptRow[] {
  if (!view) {
    return [];
  }

  return [
    { label: 'Машина', value: view.carModel },
    { label: 'Срок', value: view.daysText },
    { label: 'Опции', value: view.extrasText },
    { label: 'Итого', value: view.totalText, tone: 'total' },
  ];
}

export function confirmationReceiptRows(view: ReturnType<typeof confirmationView>): ReceiptRow[] {
  if (!view) {
    return [];
  }

  return [
    { label: 'Номер заявки', value: view.id },
    { label: 'Машина', value: view.carModel },
    { label: 'Дата начала', value: view.startDateText },
    { label: 'Срок', value: view.daysText },
    { label: 'Итого', value: view.totalText, tone: 'total' },
  ];
}
