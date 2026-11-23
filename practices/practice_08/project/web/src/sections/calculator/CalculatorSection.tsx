import { useEffect, useRef, useState, type FormEvent } from 'react';

import {
  EXTRA_LABELS,
  EXTRA_OPTIONS,
  EXTRAS,
  MAX_DAYS,
  MIN_DAYS,
  calculateRental,
} from '@legacy/calc.js';
import { cars } from '@legacy/cars.js';
import { formatPrice } from '@legacy/format.js';

import { Receipt, calcReceiptRows, type RentalResult } from '@/components/Receipt';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useReveal } from '@/hooks/useReveal';
import { useRental } from '@/state/rental';

const PRICES_BY_OPTION = EXTRAS as Record<string, number>;
const LABELS_BY_OPTION = EXTRA_LABELS as Record<string, string>;

const EMPTY_DAYS_MESSAGE = 'Укажите срок аренды — целое число суток от 1 до 30.';

// JS-вывод сузил extras у calculateRental до never[], поэтому форму вызова описываем
// сами: правил расчёта здесь нет, только сигнатура.
const calculate = calculateRental as unknown as (input: {
  carId: string;
  days: number;
  extras: string[];
}) => RentalResult;

function extraHint(option: string) {
  if (option in PRICES_BY_OPTION) {
    return `${formatPrice(PRICES_BY_OPTION[option])} / сут`;
  }
  return '15 % от стоимости после скидки';
}

export function CalculatorSection() {
  const { estimate, setEstimate, resetEstimate, chooseCar, chosenCarId } = useRental();
  const [carId, setCarId] = useState(cars[0]?.id ?? '');
  const [days, setDays] = useState('3');
  const [error, setError] = useState('');
  const sectionRef = useReveal<HTMLElement>();
  const formRef = useRef<HTMLFormElement>(null);
  const daysRef = useRef<HTMLInputElement>(null);

  // Обратная синхронизация: выбор в реестре мгновенно меняет машину здесь (§5.3).
  useEffect(() => {
    if (chosenCarId) {
      setCarId(chosenCarId);
    }
  }, [chosenCarId]);

  const receiptCar = estimate ? cars.find((car) => car.id === estimate.carId) : undefined;

  function fail(message: string) {
    setError(message);
    daysRef.current?.focus();

    const form = formRef.current;
    if (form) {
      form.classList.remove('is-shaking');
      void form.offsetWidth;
      form.classList.add('is-shaking');
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Снимок живёт только со свежим итогом: старый чек снимается до расчёта (R-01).
    resetEstimate();

    const raw = days.trim();
    if (raw === '') {
      fail(EMPTY_DAYS_MESSAGE);
      return;
    }

    const extras = [...new FormData(event.currentTarget).getAll('extras')].map(String);
    const period = Number(raw);

    try {
      const result = calculate({ carId, days: period, extras });
      setError('');
      setEstimate({ carId, days: period, extras, result });
    } catch (cause) {
      if (cause instanceof RangeError) {
        // Ошибка всегда про срок: остальные входы калькулятор задаёт сам.
        fail(cause.message);
        return;
      }
      throw cause;
    }
  }

  return (
    <section className="section" id="calculator" data-reveal ref={sectionRef}>
      <div className="container">
        <p className="rail">Расчёт</p>
        <h2>Сколько выйдет аренда</h2>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Срок — от {MIN_DAYS} до {MAX_DAYS} суток. От 7 суток скидка 10 %, от 14 суток — 15 %. Залог
          считаем отдельно: он возвращается при сдаче и в итог не входит.
        </p>

        <form
          className="mt-2 flex w-full flex-col items-start gap-2"
          id="calc-form"
          noValidate
          ref={formRef}
          onAnimationEnd={() => formRef.current?.classList.remove('is-shaking')}
          onInput={() => {
            setError('');
            resetEstimate();
          }}
          onSubmit={handleSubmit}
        >
          <div className="grid w-full gap-2 sm:grid-cols-3">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <Label htmlFor="calc-car">Автомобиль</Label>
              <Select
                id="calc-car"
                name="car"
                value={carId}
                onChange={(event) => {
                  setCarId(event.target.value);
                  chooseCar(event.target.value);
                }}
              >
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.model} — {formatPrice(car.pricePerDay)} / сут
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="calc-days">Срок, суток</Label>
              <Input
                aria-describedby="calc-error"
                aria-invalid={error ? 'true' : undefined}
                className="tabular-nums"
                id="calc-days"
                inputMode="numeric"
                max={MAX_DAYS}
                min={MIN_DAYS}
                name="days"
                ref={daysRef}
                step="1"
                type="number"
                value={days}
                onChange={(event) => setDays(event.target.value)}
              />
            </div>

            <p className="m-0 min-h-6 text-sm text-destructive sm:col-span-3" id="calc-error" role="alert">
              {error}
            </p>
          </div>

          <fieldset className="m-0 min-w-0 border border-border p-s2" id="calc-extras">
            <legend className="px-1 text-sm font-medium">Опции</legend>
            <div className="flex flex-col gap-1">
              {EXTRA_OPTIONS.map((option) => (
                <div className="flex items-start gap-2" key={option}>
                  <Checkbox id={`calc-extra-${option}`} name="extras" value={option} />
                  <Label className="font-normal" htmlFor={`calc-extra-${option}`}>
                    {LABELS_BY_OPTION[option] ?? option}{' '}
                    <span className="text-sm text-muted-foreground">{extraHint(option)}</span>
                  </Label>
                </div>
              ))}
            </div>
          </fieldset>

          <Button type="submit">Рассчитать стоимость</Button>

          <div className="w-full" id="calc-result">
            {estimate && receiptCar ? (
              <Card className="max-w-lg p-s2">
                <Receipt rows={calcReceiptRows(estimate.result, receiptCar, estimate.days)} />
              </Card>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
