import { BOOKING_STATES, BOOKING_TEXT } from '@legacy/booking-text.js';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { BookingFields } from './BookingFields';
import { BookingResult } from './BookingResult';
import { BookingSnapshot } from './BookingSnapshot';
import { useBookingMachine } from './useBookingMachine';
import type { BookingFieldName } from './useBookingMachine';

// Секция заявки (#booking): единственный обработчик onSubmit у формы, состояние —
// data-state из машины §6. Кнопка, подсказки и сообщения применяют готовое описание
// состояния, своих решений и видимых строк вне BOOKING_TEXT здесь нет.
export function BookingSection() {
  const machine = useBookingMachine();
  const { view, look } = machine;
  const submitting = view.state === BOOKING_STATES.SUBMITTING;

  const errors: Partial<Record<BookingFieldName, string>> = {};
  for (const item of view.fieldErrors) {
    errors[item.field] = item.text;
  }

  return (
    <section className="section" id="booking" data-reveal>
      <div className="container">
        <p className="rail" id="booking-rail">
          {BOOKING_TEXT.section.rail}
        </p>
        <h2 id="booking-heading">{BOOKING_TEXT.section.heading}</h2>
        <p id="booking-note">{BOOKING_TEXT.section.note}</p>

        {/* §5.5: узел #booking noscript с сообщением про JavaScript. React 19 не выкладывает
            element-детей внутрь noscript при клиентском рендере (узел приходит пустым), поэтому
            содержимое — строкой. Строка дословно из v1 index.html, своей правки в ней нет. */}
        <noscript
          dangerouslySetInnerHTML={{
            __html:
              '<p class="text-destructive" role="alert">Для отправки заявки нужен включённый ' +
              'JavaScript. Цены в автопарке и контакты ниже доступны без него.</p>',
          }}
        />

        <form
          className={cn('booking mt-4', machine.shaking && 'is-shaking')}
          data-state={view.state}
          id="booking-form"
          noValidate
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) {
              machine.stopShake();
            }
          }}
          onSubmit={machine.onSubmit}
        >
          <BookingSnapshot
            done={look.done}
            emptyLinkRef={machine.emptyLinkRef}
            snapshot={machine.snapshot}
          />

          <BookingFields
            dateBounds={machine.dateBounds}
            disabled={look.locked || look.done}
            draft={machine.draft}
            errors={errors}
            hidden={look.done}
            onChange={machine.onFieldChange}
            registerField={machine.registerField}
          />

          <p className="form-text mt-2 text-sm text-muted-foreground" hidden={look.done} id="booking-required">
            {BOOKING_TEXT.required}
          </p>

          <p className="mt-2 text-destructive empty:hidden" id="booking-message">
            {view.formMessage ?? ''}
          </p>

          <Button
            aria-busy={submitting}
            className="mt-3"
            disabled={look.locked}
            hidden={look.done}
            id="booking-submit"
            type="submit"
          >
            {submitting && <Spinner id="booking-spinner" />}
            {look.buttonLabel}
          </Button>

          <p className="mt-2 min-h-6 text-muted-foreground" id="booking-status" role="status">
            {view.statusMessage ?? ''}
          </p>

          <BookingResult confirmation={view.confirmation} onAgain={machine.onAgain} />
        </form>
      </div>
    </section>
  );
}
