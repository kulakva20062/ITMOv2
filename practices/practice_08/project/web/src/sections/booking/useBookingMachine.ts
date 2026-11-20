// Машина состояний заявки (design-contract §6) поверх чистых функций @legacy/booking-form.js
// и estimate из useRental (§4.5). Своих правил валидации, кодов и текстов здесь нет:
// переходы и сообщения дают checkDraft/responseView/statePresentation/snapshotView.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { addDays, BOOKING_HORIZON_DAYS, todayUtc } from '@legacy/booking.js';
import { BOOKING_STATES, BOOKING_TEXT } from '@legacy/booking-text.js';
import {
  bookingPayload,
  checkDraft,
  responseView,
  snapshotView,
  statePresentation,
} from '@legacy/booking-form.js';

import { useRental } from '@/state/rental';
import { sendBooking } from './api';

export const BOOKING_FIELD_ORDER = ['name', 'phone', 'startDate'] as const;

export type BookingFieldName = (typeof BOOKING_FIELD_ORDER)[number];

export type BookingDraft = Record<BookingFieldName, string>;

export type BookingFieldError = { field: BookingFieldName; text: string };

export type BookingConfirmation = {
  id: string;
  carModel: string;
  startDateText: string;
  daysText: string;
  totalText: string;
  correction: string | null;
};

// Форма описания состояния — та же, что отдают чистые функции booking-form.js.
export type BookingView = {
  state: string;
  fieldErrors: BookingFieldError[];
  formMessage: string | null;
  statusMessage: string | null;
  confirmation: BookingConfirmation | null;
};

const EMPTY_DRAFT: BookingDraft = { name: '', phone: '', startDate: '' };

// Состояние — производное от наличия снимка (инвариант R-01): внешний пересчёт и сброс
// приходят сюда одним путём, с пустыми ошибками и сообщениями.
function freshView(hasEstimate: boolean): BookingView {
  return {
    state: hasEstimate ? BOOKING_STATES.EDITING : BOOKING_STATES.NO_ESTIMATE,
    fieldErrors: [],
    formMessage: null,
    statusMessage: null,
    confirmation: null,
  };
}

export function useBookingMachine() {
  const { estimate, resetEstimate } = useRental();

  const [view, setView] = useState<BookingView>(() => freshView(Boolean(estimate)));
  const [draft, setDraft] = useState<BookingDraft>(EMPTY_DRAFT);
  const [shaking, setShaking] = useState(false);

  // Синхронные рубежи §8: React-state обновляется асинхронно и не защищает от двух
  // submit подряд (клик + Enter + requestSubmit), поэтому решения принимают ref-ы.
  const inFlightRef = useRef(false);
  const stateRef = useRef(view.state);
  const estimateRef = useRef(estimate);
  const draftRef = useRef(draft);
  const prevEstimateRef = useRef(estimate);
  estimateRef.current = estimate;
  draftRef.current = draft;

  const fieldRefs = useRef<Record<BookingFieldName, HTMLInputElement | null>>({
    name: null,
    phone: null,
    startDate: null,
  });
  const emptyLinkRef = useRef<HTMLAnchorElement | null>(null);
  const focusTargetRef = useRef<BookingFieldName | 'empty-link' | null>(null);
  const shakeNonceRef = useRef(0);

  const updateView = useCallback((next: BookingView) => {
    stateRef.current = next.state;
    // Класс shake живёт только в пределах одного состояния (§3.4), поэтому сбрасываем его
    // синхронно со сменой состояния — все переходы идут через updateView. Passive-эффект
    // на [view.state] здесь нельзя: он соревнуется с возвратом класса на следующем кадре,
    // и часть отказов теряла движение. При prefers-reduced-motion animationend не наступает,
    // поэтому синхронный сброс — единственный надёжный способ не оставить класс на success.
    setShaking(false);
    setView(next);
  }, []);

  // Внешнее изменение снимка: успешный расчёт -> editing, resetEstimate/chooseCar ->
  // no-estimate с сохранёнными значениями полей (§6.2). Во время запроса состояние не
  // переключается: оно пересчитывается после применения исхода ответа.
  useEffect(() => {
    const previous = prevEstimateRef.current;
    prevEstimateRef.current = estimate;
    if (previous === estimate || inFlightRef.current) {
      return;
    }
    updateView(freshView(Boolean(estimate)));
  }, [estimate, updateView]);

  // Фокус — после коммита: в submitting поля disabled, и фокусировать их до применения
  // состояния editing бесполезно. Live-регионы фокус не перехватывают (§9).
  useEffect(() => {
    const target = focusTargetRef.current;
    if (!target) {
      return;
    }
    focusTargetRef.current = null;
    if (target === 'empty-link') {
      emptyLinkRef.current?.focus();
      return;
    }
    fieldRefs.current[target]?.focus();
  });

  const triggerShake = useCallback(() => {
    shakeNonceRef.current += 1;
    const nonce = shakeNonceRef.current;
    setShaking(false);
    // Повторная неудача должна дать новую анимацию: класс снимается и возвращается
    // на следующем кадре. При prefers-reduced-motion движения нет — решает CSS §3.4.
    requestAnimationFrame(() => {
      if (shakeNonceRef.current === nonce) {
        setShaking(true);
      }
    });
  }, []);

  const stopShake = useCallback(() => {
    shakeNonceRef.current += 1;
    setShaking(false);
  }, []);

  const applyOutcome = useCallback(
    (next: BookingView, { rejected = false } = {}) => {
      let result = next;

      if (statePresentation(next.state).dropsEstimate) {
        // Отказ по снимку (stale): основания заявки больше нет (FR-043). Сброс помечаем
        // как собственный, чтобы эффект выше не затёр сообщение #booking-message.
        prevEstimateRef.current = null;
        resetEstimate();
      } else if (next.state !== BOOKING_STATES.SUCCESS && estimateRef.current === null) {
        // Гонка «сбросили расчёт, пока запрос в полёте» (§6.2): editing/unavailable при
        // estimate === null дают no-estimate с сохранёнными значениями полей; success
        // остаётся success — подтверждение собрано из тела ответа, а не из снимка.
        result = { ...next, state: BOOKING_STATES.NO_ESTIMATE, fieldErrors: [], confirmation: null };
      }

      updateView(result);

      if (result.state !== BOOKING_STATES.NO_ESTIMATE) {
        const first = BOOKING_FIELD_ORDER.find((field) =>
          result.fieldErrors.some((item) => item.field === field),
        );
        if (first) {
          focusTargetRef.current = first;
        }
      }

      // Shake — только на неудачную попытку отправки (валидация до сети, 400, 409).
      // Транспортный unavailable классифицируется по исходному next.state: при внешнем
      // сбросе расчёта в полёте (§6.2) он перезаписывается в no-estimate, но трясти форму
      // от этого не перестаёт быть запрещённым (§3.4). Исключение success остаётся по
      // конечному состоянию: rejected-флаг приходит и для 201.
      const refused =
        rejected &&
        next.state !== BOOKING_STATES.UNAVAILABLE &&
        result.state !== BOOKING_STATES.SUCCESS;
      if (refused) {
        triggerShake();
      }
    },
    [resetEstimate, triggerShake, updateView],
  );

  // Единственный обработчик отправки (§8): клик по #booking-submit, Enter в любом поле
  // и программный form.requestSubmit() проходят через него. Отдельных onClick/onKeyDown нет.
  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const currentEstimate = estimateRef.current;
      if (
        !currentEstimate ||
        inFlightRef.current ||
        stateRef.current === BOOKING_STATES.SUBMITTING ||
        stateRef.current === BOOKING_STATES.SUCCESS
      ) {
        return;
      }

      const currentDraft = { ...draftRef.current };
      const payload = bookingPayload(currentEstimate, currentDraft);

      const checked = checkDraft(payload, todayUtc());
      if (!checked.ok) {
        applyOutcome(checked, { rejected: true });
        return;
      }

      const snapshotTotal = currentEstimate.result.total;
      // Длина имени в кодовых точках нужна errorView, чтобы выбрать ветку name_length (§7).
      const length = [...currentDraft.name.trim()].length;

      inFlightRef.current = true;
      updateView({
        state: BOOKING_STATES.SUBMITTING,
        fieldErrors: [],
        formMessage: null,
        statusMessage: BOOKING_TEXT.submitting,
        confirmation: null,
      });

      try {
        const outcome = await sendBooking(payload);
        // Серверный отказ (§3.4: 400, 409, rejected) трясёт форму так же, как отказ до сети;
        // existing-проверка в applyOutcome оставляет unavailable и success без движения.
        applyOutcome(responseView(outcome, { snapshotTotal, length }), { rejected: true });
      } finally {
        inFlightRef.current = false;
      }
    },
    [applyOutcome, updateView],
  );

  // Правка поля снимает ошибку только этого поля, не трогая остальные (§6.2).
  const onFieldChange = useCallback((field: BookingFieldName, value: string) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
    setView((previous) => ({
      ...previous,
      fieldErrors: previous.fieldErrors.filter((item) => item.field !== field),
    }));
  }, []);

  // «Оформить ещё одну заявку»: поля и ошибки очищены, снимок сброшен -> no-estimate (§6.2).
  const onAgain = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    prevEstimateRef.current = null;
    resetEstimate();
    updateView(freshView(false));
    focusTargetRef.current = 'empty-link';
  }, [resetEstimate, updateView]);

  const registerField = useCallback(
    (field: BookingFieldName) => (node: HTMLInputElement | null) => {
      fieldRefs.current[field] = node;
    },
    [],
  );

  // Границы даты ставит хук из todayUtc()/BOOKING_HORIZON_DAYS, а не статическая разметка (§5.5).
  const dateBounds = useMemo(() => {
    const min = todayUtc();
    return { min, max: addDays(min, BOOKING_HORIZON_DAYS) };
  }, []);

  const look = statePresentation(view.state) as {
    locked: boolean;
    done: boolean;
    buttonLabel: string;
  };
  const snapshot = snapshotView(estimate);

  return {
    view,
    look,
    draft,
    snapshot,
    dateBounds,
    shaking,
    stopShake,
    onSubmit,
    onFieldChange,
    onAgain,
    registerField,
    emptyLinkRef,
  };
}
