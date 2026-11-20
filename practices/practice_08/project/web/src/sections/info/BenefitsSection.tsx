import { Card } from '@/components/ui/card';
import { useReveal } from '@/hooks/useReveal';

const BENEFITS: [string, string][] = [
  ['Залог возвращаем при сдаче.', 'Сумма зависит от класса машины и не входит в стоимость аренды.'],
  [
    'Осмотр по листу с подписью.',
    'Царапины фиксируем на схеме до выезда, спорить на сдаче не о чем.',
  ],
  ['Бак полный на выдаче.', 'Возвращаете так же — доплат за топливо нет.'],
  ['Отмена бесплатно за сутки.', 'Позже — удерживаем стоимость одних суток.'],
];

export function BenefitsSection() {
  const ref = useReveal<HTMLElement>();

  return (
    <section className="section" id="benefits" data-reveal ref={ref}>
      <div className="container">
        <p className="rail">Условия</p>
        <h2>Что входит в прокат</h2>
        <Card className="plain mt-2">
          <ul className="m-0 p-0">
            {BENEFITS.map(([title, text]) => (
              <li className="border-t border-border p-s2 first:border-t-0" key={title}>
                <strong>{title}</strong> {text}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}
