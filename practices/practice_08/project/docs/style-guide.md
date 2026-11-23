# Style guide AutoDrive v2

Перед изменением вёрстки прочитай этот файл. Нормативные детали — в
`docs/design-contract.md` (токены, motion-язык, карта `web/`, инварианты миграции);
при расхождении действует контракт. Где живёт реализация правил (скелет — миссия M3):
`web/src/styles/tokens.css` и `web/src/styles/motion.css`, компоненты `web/src/components/ui/`,
секции `web/src/sections/`. До появления `web/` образец смысла — legacy `#fleet` в `index.html`.

## Визуальный язык

Две поверхности. Основной поток (автопарк, калькулятор, заявка, условия) — приёмо-сдаточный
лист осмотра на бумаге `--paper`: волосяные линии, подписи в левой рейке, острые углы полей.
Шапка и hero — одна тёмная blueprint-сцена `--night` (`.surface-night` на `SiteHeader` и
`HeroSection`, разрыв между ними запрещён), footer — тёмная полоса снизу: контур машины
линиями `--on-night-2`, заливка кузова `--signal`, декоративная сетка `--rule-night`. Характер
тот же — инженерный лист, а не «глиттер»: никаких новых цветов, теней и градиентов вне токенов.

С практики 8 (редизайн B) интерфейс строится на **React + Vite + TypeScript + Tailwind CSS +
shadcn/ui**. Готовые компоненты — `Button`, `Input`, `Select`, `Checkbox`, `Label`, `Card`,
`Badge`, `Separator`, `Spinner` из `web/src/components/ui/`; собственные примитивы не пишем,
пока не проверили библиотеку. Bootstrap и его классы (`btn`, `form-control`, `is-invalid`,
`spinner-border`) в приложении v2 не используются. Зависимости — только npm; внешние CDN,
сетевые шрифты и картинки запрещены, изображения — CSS или inline SVG. `AGENTS.md` пока
описывает стек v1: его переписывает миссия M3 вместе со скелетом, до того норма — контракт.
Общее из скелета M3 не переопределяется и не копируется в секциях: `components/ui/**`,
`components/Receipt.tsx` (чек расчёта, снимка и подтверждения) и `state/rental.tsx`
(`useRental` — единственный канал между секциями, контракт §4.5).

## Токены — только через переменные

Палитра закрыта: светлые `--paper #EDF0EE`, `--ink #1B2A3A`, `--ink-2 #5A6871`,
`--rule #C3CAC7`, `--signal #F0B323`, `--stamp #B4342A` и тёмные `--night #0F1722`,
`--night-2 #182534`, `--on-night #EDF0EE`, `--on-night-2 #A7B4BE`, `--rule-night #33424F`,
`--stamp-night #F0A295`. Значения, роли и полная таблица отображения на shadcn-переменные
(`--background`, `--foreground`, `--primary`, `--input`, `--ring`, `--destructive`…) —
в контракте §2. Тёмная тема включается классом `.surface-night` на контейнере hero/footer.

Новых цветов не добавляй; hex в JSX/классах (`text-[#…]`) запрещён — только имена токенов.
AA-пары текста (≥ 4.5:1, посчитано): `--ink` на `--paper` 12.72:1, `--ink-2` на `--paper`
5.01:1, `--stamp` на `--paper` 5.28:1, `--ink` на `--signal` 7.77:1, `--on-night` на
`--night` 15.69:1, `--on-night-2` на `--night` 8.50:1, `--stamp-night` на `--night` 8.84:1.
Запрещено: `--signal` текстом на `--paper` (1.64:1), `--ink` текстом на `--night` (1.23:1),
`--stamp` текстом на `--night` (2.97:1 — бери `--stamp-night`). `--rule`/`--rule-night` —
только декоративные линии; границы полей и secondary-кнопок — `--ink-2`/`--on-night-2`.

## Motion-бюджет (вместо «одной анимации» v1)

Ровно пять именованных паттернов из `motion.css` плюс служебный спиннер во время отправки.
Свои эффекты не изобретаем. Тайминги и кадры — контракт §3, краткая сводка:

| Паттерн | Где | Длительность / easing | Финальный кадр (он же — при reduced-motion) |
|---|---|---|---|
| `reveal` | секции и карточки при скролле, один раз | 480ms `ease-out`, stagger 60ms (≤ 6 ступеней) | `opacity: 1; transform: none` |
| `stroke-draw` | контур SVG-машины в hero, один раз | 1200ms `ease-in-out` на путь, stagger 90ms; заливка 400ms | `stroke-dashoffset: 0`, заливка `opacity: 1` |
| `stamp` | штамп «Заявка принята» в `#booking-result` | 360ms `ease-spring` | `opacity: 1; transform: rotate(-3deg) scale(1)` |
| `shake` | форма при отклонённом сабмите | 240ms `ease-in-out`, сдвиг ≤ 6px | `transform: none`; при reduce — только текст ошибки |
| `hover-glow` | `.car` и CTA, только `@media (hover: hover)` | 160ms `ease-out` | статичная рамка/тень `--glow-signal`, без transition |

Бюджет: анимируем только `transform`, `opacity`, `stroke-dashoffset`, `border-color`,
`box-shadow`; одновременно — одна секция; intro hero ≤ 2500ms; бесконечных циклов нет,
кроме спиннера `submitting`; параллакс только в hero (≤ 24px, off при reduce и < 768px).
`prefers-reduced-motion: reduce` — все паттерны сразу в финальном кадре: базовые стили уже
финальны, скрытое начало ставится только из JS и только при `no-preference`. Скриншотные
тесты (`reducedMotion: 'reduce'`) должны быть детерминированы.

## Правила

1. Без теней и градиентов, кроме `--glow-signal` в hover-glow и blueprint-сетки hero.
   `border-radius`: 0 у полей и строк, 2px (`--radius`) у кнопок, карточек и штампа.
2. Шрифты — только локальные стеки `--font-body`/`--font-mono`; цифры в ценах —
   `font-variant-numeric: tabular-nums`; отступы — `--space-1…4`, сетка по контракту §2.5.
3. Суммы выводятся только через `formatPrice`, даты — через `formatDate`
   (`@legacy/format.js`). Свои форматтеры не пишем.
4. Ошибка ввода — текст цветом `--stamp` (на тёмном `--stamp-night`) рядом с полем,
   `role="alert"`, `aria-invalid="true"` на поле и связь через `aria-describedby`;
   визуально — по селектору `[aria-invalid="true"]`, класс `is-invalid` не используется.
   Не извиняемся, говорим, что исправить. Все строки заявки — только из `booking-text.js`.
5. Движение — только по motion-бюджету выше; `prefers-reduced-motion` уважаем всегда,
   финальный кадр детерминирован и не зависит от JS.
6. Видимость фокуса обязательна и проходит собственное правило non-text contrast 3:1:
   на `--paper` индикатор **двойной** — `outline: 2px solid var(--ink)` плюс жёлтое кольцо
   `box-shadow: 0 0 0 3px var(--signal)`; на `--night` — одиночная обводка
   `3px solid var(--signal)` (9.59:1). Одиночной жёлтой обводки на светлом недостаточно (1.64:1).
   Весь сценарий проходится с клавиатуры (Tab/Enter/Space), на 360px и 1280px нет
   горизонтального скролла.
7. Чистые модули `src/*.js` и API `server.js` не меняем: расчёт — `calculateRental`, фильтр —
   `filterCars`/`countLabel`/`EMPTY_MESSAGE`, заявка — `validateBooking`/`checkDraft`/
   `responseView`/`bookingPayload`. Разметку строит JSX, а не HTML-генераторы v1.
8. Поведение проверяем через публичный интерфейс: инвариантные `id`/`data-*` из контракта §5,
   клиентские тесты `tests/e2e/`. Не ослабляй runner и тесты ради зелёного результата.
9. Один origin и в dev: `web/vite.config.ts` держит `server.proxy: { '/api' → http://localhost:8000 }`,
   все вызовы API — относительные. Сквозной сценарий проверяется и на `:5173` (через proxy),
   и на собранном `web/dist` (контракт §1).
