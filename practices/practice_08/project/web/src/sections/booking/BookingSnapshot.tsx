import type { RefObject } from 'react';

import { BOOKING_TEXT } from '@legacy/booking-text.js';
import type { snapshotView } from '@legacy/booking-form.js';

import { Receipt, snapshotReceiptRows } from '@/components/Receipt';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type BookingSnapshotProps = {
  snapshot: ReturnType<typeof snapshotView>;
  done: boolean;
  emptyLinkRef: RefObject<HTMLAnchorElement | null>;
};

// Снимок расчёта и заглушка «нет расчёта» (§5.5). Узлы постоянны, видимость переключается
// через hidden: снимок скрыт без расчёта и в success, заглушка — при живом снимке и в success.
export function BookingSnapshot({ snapshot, done, emptyLinkRef }: BookingSnapshotProps) {
  return (
    <>
      <div
        className="booking__snapshot mb-4 max-w-xl rounded-sm border border-border bg-card p-4"
        id="booking-snapshot"
        hidden={snapshot === null || done}
      >
        <h3 className="booking__head mb-2">{BOOKING_TEXT.snapshot.heading}</h3>
        <Receipt rows={snapshotReceiptRows(snapshot)} />
      </div>

      <p
        className="booking__empty mb-4 max-w-xl rounded-sm border border-dashed border-border p-4 text-muted-foreground"
        id="booking-empty"
        hidden={snapshot !== null || done}
      >
        <span className="block" id="booking-empty-text">
          {BOOKING_TEXT.noEstimate.text}
        </span>
        <a
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3')}
          href="#calculator"
          id="booking-empty-link"
          ref={emptyLinkRef}
        >
          {BOOKING_TEXT.noEstimate.link}
        </a>
      </p>
    </>
  );
}
