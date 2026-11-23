import { BOOKING_TEXT } from '@legacy/booking-text.js';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { BookingDraft, BookingFieldName } from './useBookingMachine';
import { BOOKING_FIELD_ORDER } from './useBookingMachine';

const FIELD_IDS: Record<BookingFieldName, string> = {
  name: 'booking-name',
  phone: 'booking-phone',
  startDate: 'booking-date',
};

const FIELD_PROPS: Record<
  BookingFieldName,
  { type: 'text' | 'tel' | 'date'; autoComplete?: string; maxLength?: number }
> = {
  name: { type: 'text', autoComplete: 'name', maxLength: 60 },
  phone: { type: 'tel', autoComplete: 'tel' },
  startDate: { type: 'date' },
};

export type BookingFieldsProps = {
  draft: BookingDraft;
  errors: Partial<Record<BookingFieldName, string>>;
  disabled: boolean;
  hidden: boolean;
  dateBounds: { min: string; max: string };
  onChange: (field: BookingFieldName, value: string) => void;
  registerField: (field: BookingFieldName) => (node: HTMLInputElement | null) => void;
};

// Три поля заявки в порядке DOM имя -> телефон -> дата (§5.5): он же визуальный порядок
// и порядок обхода клавиатурой. Подписи и подсказки — только BOOKING_TEXT, ошибки приходят
// из машины состояний, своих текстов здесь нет.
export function BookingFields({
  draft,
  errors,
  disabled,
  hidden,
  dateBounds,
  onChange,
  registerField,
}: BookingFieldsProps) {
  return (
    <div className="booking__fields grid gap-4 md:grid-cols-3" hidden={hidden}>
      {BOOKING_FIELD_ORDER.map((field) => {
        const id = FIELD_IDS[field];
        const props = FIELD_PROPS[field];
        const error = errors[field] ?? '';

        return (
          <div className="field" key={id}>
            <Label
              className="form-label mb-1 block text-muted-foreground"
              htmlFor={id}
              id={`${id}-label`}
            >
              {BOOKING_TEXT.labels[field]}
            </Label>
            <Input
              id={id}
              name={field}
              type={props.type}
              autoComplete={props.autoComplete}
              maxLength={props.maxLength}
              min={field === 'startDate' ? dateBounds.min : undefined}
              max={field === 'startDate' ? dateBounds.max : undefined}
              required
              aria-describedby={`${id}-hint ${id}-error`}
              aria-invalid={error ? true : undefined}
              disabled={disabled}
              value={draft[field]}
              onChange={(event) => onChange(field, event.target.value)}
              ref={registerField(field)}
            />
            <p className="form-text mt-1 text-sm text-muted-foreground" id={`${id}-hint`}>
              {BOOKING_TEXT.hints[field]}
            </p>
            <p
              className={cn('mt-1 text-sm text-destructive', !error && 'empty:hidden')}
              id={`${id}-error`}
              role="alert"
            >
              {error}
            </p>
          </div>
        );
      })}
    </div>
  );
}
