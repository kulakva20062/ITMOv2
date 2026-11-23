import { Card } from '@/components/ui/card';
import { useReveal } from '@/hooks/useReveal';

const STEPS: [string, string][] = [
  ['Выберите машину', 'Класс, коробка и число мест указаны в автопарке рядом с ценой за сутки.'],
  ['Назовите срок', 'От одних до тридцати суток. От семи суток цена за сутки снижается.'],
  ['Подпишите лист осмотра', 'Права, паспорт, залог — и ключи ваши. На оформление уходит четверть часа.'],
];

export function HowSection() {
  const ref = useReveal<HTMLElement>();

  return (
    <section className="section" id="how" data-reveal ref={ref}>
      <div className="container">
        <p className="rail">Порядок</p>
        <h2>Как арендовать</h2>
        <ol className="steps m-0 grid gap-2 p-0 sm:grid-cols-3">
          {STEPS.map(([title, text], index) => (
            <li key={title}>
              <Card className="h-full p-s2">
                <p className="m-0 font-mono text-sm text-muted-foreground">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-1 text-base">{title}</h3>
                <p className="m-0 text-sm">{text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
