import { BOOKING_TEXT } from '@legacy/booking-text.js';

import { Receipt, confirmationReceiptRows } from '@/components/Receipt';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BookingConfirmation } from './useBookingMachine';

export type BookingResultProps = {
  confirmation: BookingConfirmation | null;
  onAgain: () => void;
};

// Подтверждение заявки (§5.5): штамп §3.3 с заголовком и номером, чек из тела ответа,
// коррекция FR-018 отдельным абзацем и кнопка новой заявки. Телефон не показывается.
// Узел #booking-result постоянен и пустует вне success, как и остальные live-области.
export function BookingResult({ confirmation, onAgain }: BookingResultProps) {
  return (
    <div
      className={cn(
        'booking__result mt-4 max-w-xl',
        confirmation && 'rounded-sm border border-border bg-card p-4',
      )}
      id="booking-result"
    >
      {confirmation && (
        <>
          <div className="success-stamp mb-4 inline-flex flex-col gap-1" id="booking-confirmation-stamp">
            <span>{BOOKING_TEXT.success.heading}</span>
            <strong className="text-xl tracking-wider">{confirmation.id}</strong>
          </div>
          <Receipt rows={confirmationReceiptRows(confirmation)} />
          {confirmation.correction && (
            <p className="booking__correction mt-2 text-muted-foreground">
              {confirmation.correction}
            </p>
          )}
          <Button className="mt-4" id="booking-again" onClick={onAgain} type="button" variant="outline">
            {BOOKING_TEXT.buttons.again}
          </Button>
        </>
      )}
    </div>
  );
}
