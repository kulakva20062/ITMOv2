import { useReveal } from '@/hooks/useReveal';

const CONTACTS: [string, string, string][] = [
  ['Телефон', 'tel:+70000000000', '+7 000 000-00-00'],
  ['Почта', 'mailto:hello@example.com', 'hello@example.com'],
  ['Выдача машин', '', 'Ежедневно с 8:00 до 22:00, по предварительной записи'],
];

export function ContactsSection() {
  const ref = useReveal<HTMLElement>();

  return (
    <section className="section" id="contacts" data-reveal ref={ref}>
      <div className="container">
        <p className="rail">Контакты</p>
        <h2>Связаться с прокатом</h2>
        <dl className="contacts mt-2 grid gap-2 sm:grid-cols-3">
          {CONTACTS.map(([label, href, value]) => (
            <div key={label}>
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="m-0">
                {href ? (
                  <a className="underline" href={href}>
                    {value}
                  </a>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
