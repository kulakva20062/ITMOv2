const NAV_ITEMS = [
  ['Автопарк', '#fleet'],
  ['Расчёт', '#calculator'],
  ['Заявка', '#booking'],
  ['Условия', '#benefits'],
  ['Как арендовать', '#how'],
  ['Вопросы', '#faq'],
  ['Контакты', '#contacts'],
] as const;

export function SiteHeader() {
  return (
    <header className="surface-night">
      <div className="container site-header__inner">
        <a className="site-header__logo" href="#hero">
          AutoDrive
        </a>
        <nav className="site-header__nav" aria-label="Разделы страницы">
          {NAV_ITEMS.map(([label, href]) => (
            <a href={href} key={href}>
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
