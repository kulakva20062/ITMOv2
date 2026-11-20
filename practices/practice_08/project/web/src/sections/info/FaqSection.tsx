import { useReveal } from '@/hooks/useReveal';

const QUESTIONS: [string, string][] = [
  [
    'Какой нужен стаж?',
    'Два года и возраст от 21 года. Для класса «бизнес» — три года и от 25 лет.',
  ],
  [
    'Когда вернётся залог?',
    'В день сдачи машины, после осмотра по листу. Если повреждений нет, удержаний тоже нет.',
  ],
  [
    'Можно выехать за город?',
    'Да, пробег не ограничен. За пределы области — предупредите при оформлении.',
  ],
  [
    'Кто платит за штрафы?',
    'Арендатор. Присылаем копию постановления и ссылку на оплату в день получения.',
  ],
];

// Раскрытие — нативными details/summary: работает с клавиатуры и без JS (§5.6).
export function FaqSection() {
  const ref = useReveal<HTMLElement>();

  return (
    <section className="section" id="faq" data-reveal ref={ref}>
      <div className="container">
        <p className="rail">Вопросы</p>
        <h2>Что спрашивают чаще всего</h2>
        <div className="faq mt-2 flex flex-col gap-1">
          {QUESTIONS.map(([question, answer]) => (
            <details className="rounded-sm border border-border bg-card" key={question}>
              <summary className="cursor-pointer px-s2 py-s1 font-semibold">{question}</summary>
              <p className="m-0 px-s2 pb-s1">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
