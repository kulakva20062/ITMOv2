# Design contract v2 — AutoDrive на React (вариант B)

**Версия**: 2.1.0 (2026-11-20), миссия M1, ревизия 1 по замечаниям ревью
(`review-feat-design-contract-v2-react-reviewer-m1-r1`: P1-1, P1-2, P2-1…6).
**Статус**: норма для миссий M3–M8.

Это контракт редизайна «Vanilla JS + Bootstrap» → «React + Vite + TypeScript + Tailwind +
shadcn/ui» с «вау»-анимациями. Цель редизайна — новый визуал и движение **без потери баллов**:
рубрика `practices/practice_08/README.md` (12 баллов) должна оставаться выполненной целиком.

Документ фиксирует: токены двух поверхностей, motion-язык с детерминированными финальными
кадрами, карту `web/` с зафиксированными путями импортов и приложение инвариантов миграции
(§5–§9). По нему M3 (скелет), M4 (hero/fleet/calculator/info), M5 (заявка), M6 (переключение
и тесты), M7 (макет) и M8 (отчёт) работают без взаимных догадок.

## 0. Соотношение документов и неприкосновенное

| Документ | Роль при редизайне |
|---|---|
| `docs/requirements.md` | Продуктовые требования A–D. **Не меняется.** |
| `specs/contracts/booking-contract.md` | Единственный источник имён полей, кодов, состояний и текстов заявки. **Не меняется.** |
| `src/cars.js`, `src/calc.js`, `src/filter.js`, `src/format.js`, `src/booking.js`, `src/booking-text.js`, `src/booking-form.js`, `src/booking-store.js` | Чистые модули. **Не меняются и не дублируются** — React импортирует их как есть. Единственное аддитивное исключение — перенос `seatsLabel` в `src/cars.js` (M3, §4.4). |
| `server.js` (API) | Контракт API не меняется; M3 лишь добавляет раздачу `web/`. |
| `scripts/check.sh`, существующие тесты | Не ослабляются. Замена разметочных node-тестов — только в M6 с переносом смысла в e2e. |
| `AGENTS.md` | Пока описывает v1; его переписывает M3. Расхождение временное, норма — этот контракт. |
| `docs/style-guide.md` | Краткие рабочие правила v2, ссылается сюда. |
| `docs/design-contract.md` | Этот файл. Изменение — отдельный согласованный шаг до правки кода. |

Пояснение к формулировке «API §4»: в `docs/requirements.md` своей нумерации §4 нет. Имеется
в виду **§4 «Запрос» контракта `specs/contracts/booking-contract.md`**, на который ссылается
фича D требований. Сводка — в §7, источник истины — сам контракт.

Общие запреты (из `AGENTS.md`, действуют и в v2): никаких внешних CDN, сетевых шрифтов и
картинок; изображения — CSS или inline SVG; только вымышленные данные (`+7 000 000-00-00`,
`hello@example.com`); зависимости — только npm, локально.

## 1. Стек и границы миссий

- Приложение v2 живёт в `web/`: **Vite + React + TypeScript + Tailwind CSS + shadcn/ui**.
  Точные версии пакетов выбирает M3 по npm; CDN и скачивание ресурсов в рантайме запрещены.
- TypeScript проверяет только `web/src`: для `@legacy`-модулей включается `allowJs` без
  `checkJs` — править JS-файлы ради типов запрещено.
- Раздача: M3 добавляет `server.js` отдачу приложения на `/ui` (dev — Vite, prod — `web/dist`),
  legacy `/` продолжает работать. M6 переключает корень `/` на `web/dist` и удаляет legacy-фронт
  (`index.html`, `styles.css`, `src/main.js`, HTML-генераторы из `src/render.js`).
- **Один origin в dev тоже.** В `web/vite.config.ts` обязателен
  `server.proxy: { '/api': 'http://localhost:8000' }`: все вызовы API — относительные
  (`fetch('/api/bookings')`), поэтому на `http://localhost:5173` заявка идёт через proxy на
  `server.js`, CORS не появляется, а `just start` + `npm run web:dev` дают рабочий сценарий.
  Сквозной сценарий проверяется в обоих режимах: dev (:5173 через proxy) и prod (один origin,
  `/` или `/ui` со `web/dist`).
- `components/ui` предзаполняется скелетом M3 полностью (список в §4.3); M4/M5 его **не правят**.
  Недостающий примитив собирается локально в своей секции из уже существующих.
- Связывание секций — только через разделяемый store `@/state/rental` (§4.5): `App.tsx` (слоты
  + `AppProvider`) принадлежит M3 и после скелета не правится. Прямых DOM-обращений между
  секциями, window-событий и состояния на уровне модуля нет.
- Видимые строки заявки — только `BOOKING_TEXT`/`errorView`; решения по состояниям — только
  чистые функции `booking-form.js`. React-компоненты не содержат своих правил валидации,
  своих кодов ошибок и своих текстов ошибок.

## 2. Токены v2

Две поверхности: светлая `paper` (основной поток: fleet, calculator, booking, info) и новая
тёмная `night` (**шапка, hero и footer** — одна тёмная сцена сверху и тёмная полоса снизу).
Палитра закрыта: любой цвет в вёрстке — один из токенов ниже или производная токена с альфой
(только `--glow-signal`, §2.6). Новые цвета не вводятся.

### 2.1 Светлая поверхность — токены сохранены

| Токен | Значение | Роль |
|---|---|---|
| `--paper` | `#EDF0EE` | фон страницы, карточек, полей |
| `--ink` | `#1B2A3A` | основной текст, заголовки, текст на `--signal` |
| `--ink-2` | `#5A6871` | вторичный текст, подписи, границы интерактивных полей |
| `--rule` | `#C3CAC7` | только декоративные волосяные линии и разделители |
| `--signal` | `#F0B323` | фон CTA, выбранное состояние, фокус-обводка, glow |
| `--stamp` | `#B4342A` | ошибки ввода и штамп успеха **на светлом** |

### 2.2 Тёмная поверхность — новые токены

| Токен | Значение | Роль |
|---|---|---|
| `--night` | `#0F1722` | фон шапки, hero и footer |
| `--night-2` | `#182534` | панели и карточки внутри тёмной поверхности |
| `--on-night` | `#EDF0EE` | основной текст на тёмном (совпадает с `--paper`) |
| `--on-night-2` | `#A7B4BE` | вторичный текст на тёмном; границы интерактива на тёмном |
| `--rule-night` | `#33424F` | только декоративные линии blueprint-сцены |
| `--stamp-night` | `#F0A295` | ошибки и штамп **на тёмном** |

Тёмная поверхность включается классом `.surface-night` на контейнере — его получают `SiteHeader`,
`HeroSection` и `SiteFooter` (шапка и hero визуально единая сцена, разрыв запрещён). Внутри
`.surface-night` shadcn-переменные переопределены (§2.4), поэтому одни и те же компоненты
работают на обеих поверхностях без отдельных «тёмных» версий.

### 2.3 Контрасты (посчитано по WCAG, относительная яркость sRGB)

Обязательные AA-пары для текста (≥ 4.5:1):

| Пара текст/фон | Контраст |
|---|---|
| `--ink` на `--paper` | 12.72:1 |
| `--ink-2` на `--paper` | 5.01:1 |
| `--stamp` на `--paper` | 5.28:1 |
| `--ink` на `--signal` (текст CTA) | 7.77:1 |
| `--paper` на `--stamp` (текст на destructive-кнопке) | 5.28:1 |
| `--on-night` на `--night` | 15.69:1 |
| `--on-night-2` на `--night` | 8.50:1 |
| `--on-night` на `--night-2` | 13.52:1 |
| `--on-night-2` на `--night-2` | 7.33:1 |
| `--signal` на `--night` / `--night-2` (акценты, ссылки-CTA) | 9.59:1 / 8.26:1 |
| `--stamp-night` на `--night` / `--night-2` | 8.84:1 / 7.62:1 |
| `--night` на `--paper` (тёмный текст-плашка на светлом) | 15.69:1 |

Запрещённые сочетания (проверено числами, не вкусом):

- `--signal` как **текст** на `--paper` — 1.64:1. На светлом signal только фон/обводка/glow.
- `--ink` как текст на `--night` — 1.23:1. На тёмном текст — только `--on-night*`.
- `--stamp` как текст на `--night` — 2.97:1. На тёмном ошибки — только `--stamp-night`.
- `--rule` на `--paper` (1.45:1) и `--rule-night` на `--night` (1.74:1) — **не** границы
  интерактивных элементов и не текст: только декоративные линии. Границы input/select/checkbox
  и secondary-кнопок — `--ink-2` на светлом (5.01:1) и `--on-night-2` на тёмном (8.50:1),
  что закрывает и non-text contrast 3:1.
- Выбранная карточка `.car[data-chosen="true"]`: `border-color: var(--ink)` +
  `outline: 2px solid var(--signal)`. Одной жёлтой обводки (1.64:1) для индикации мало —
  добавляется тёмная граница, а выбор дублируется текстом в `#fleet-status`.
- **Исключение для фокуса на `--paper`** (норма §9): одиночный `outline` цветом `--signal`
  здесь недопустим — это то же сочетание 1.64:1. Индикатор двойной: `outline` `--ink` (12.72:1)
  плюс жёлтое кольцо `--signal` снаружи. На `--night` остаётся одиночный `--signal` (9.59:1).

### 2.4 Отображение на переменные shadcn/ui

`web/src/styles/tokens.css`: `:root` — светлая тема, `.surface-night` — переопределения.
В Tailwind-классах используются только эти имена (`bg-background`, `text-foreground`,
`border-input`, `bg-primary text-primary-foreground`, `text-destructive`, `ring-ring`…).
Прямые hex в разметке и arbitrary-значения цвета (`text-[#…]`, `bg-[#…]`) запрещены.

| shadcn-переменная | `:root` (светлая) | `.surface-night` (тёмная) |
|---|---|---|
| `--background` | `var(--paper)` | `var(--night)` |
| `--foreground` | `var(--ink)` | `var(--on-night)` |
| `--card` / `--card-foreground` | `var(--paper)` / `var(--ink)` | `var(--night-2)` / `var(--on-night)` |
| `--popover` / `--popover-foreground` | `var(--paper)` / `var(--ink)` | `var(--night-2)` / `var(--on-night)` |
| `--primary` / `--primary-foreground` | `var(--signal)` / `var(--ink)` | `var(--signal)` / `var(--ink)` |
| `--secondary` / `--secondary-foreground` | `var(--paper)` / `var(--ink)` | `var(--night-2)` / `var(--on-night)` |
| `--muted` / `--muted-foreground` | `var(--paper)` / `var(--ink-2)` | `var(--night)` / `var(--on-night-2)` |
| `--accent` / `--accent-foreground` | `var(--signal)` / `var(--ink)` | `var(--signal)` / `var(--ink)` |
| `--destructive` / `--destructive-foreground` | `var(--stamp)` / `var(--paper)` | `var(--stamp-night)` / `var(--night)` |
| `--border` (разделители) | `var(--rule)` | `var(--rule-night)` |
| `--input` (границы полей) | `var(--ink-2)` | `var(--on-night-2)` |
| `--ring` (фокус) | `var(--signal)` | `var(--signal)` |
| `--radius` | `2px` | `2px` |

Текст ошибок — `text-[color:var(--stamp)]` не нужен: используется `text-destructive`
(на светлом = `--stamp`, на тёмном = `--stamp-night`).

### 2.5 Типографика, отступы, радиусы, сетка

- Шрифты — только локальные стеки (без сетевых):
  `--font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
  `--font-mono: ui-monospace, "SF Mono", "Cascadia Mono", Consolas, monospace`.
- `body`: `line-height: 1.55`; заголовки `h1–h3`: `line-height: 1.2; font-weight: 650`.
  `h1`: `font-size: clamp(1.8rem, 4vw, 2.6rem)`, ровно один на странице. `h2`: `1.5rem`.
- Рейка `.rail` (подпись секции): `--font-mono`, `0.8rem`, uppercase, `letter-spacing: 0.08em`,
  цвет `--muted-foreground`.
- Все суммы — только `formatPrice` из `@legacy/format.js`, цифры в ценах и чеке —
  `font-variant-numeric: tabular-nums`. Даты для показа — только `formatDate`.
- Отступы: `--space-1: 0.5rem`, `--space-2: 1rem`, `--space-3: 1.5rem`, `--space-4: 2.5rem`.
  Секции: `padding: var(--space-4) 0`, при ширине ≤ 480px — `var(--space-3) 0`.
- Контейнер: `max-width: 1140px; margin-inline: auto; padding-inline: var(--space-2)`.
  На 360px контентная ширина 328px, горизонтальный скролл недопустим (проверка: 360 и 1280px).
- Радиусы: кнопки/карточки/штамп — `2px` (`--radius`), поля ввода и строки реестра — `0`.
  Других радиусов нет.
- Тени запрещены, кроме `--glow-signal` (§2.6) в hover-glow. Градиенты запрещены, кроме
  blueprint-сетки hero: `linear-gradient` с `var(--rule-night)` прозрачными стопами — это
  декоративная линейчатая подложка, а не цветовой градиент.

### 2.6 Motion-токены

| Токен | Значение | Где |
|---|---|---|
| `--dur-hover` | `160ms` | hover-glow |
| `--dur-shake` | `240ms` | shake |
| `--dur-stamp` | `360ms` | stamp |
| `--dur-fill` | `400ms` | заливка кузова hero |
| `--dur-reveal` | `480ms` | reveal |
| `--dur-stroke` | `1200ms` | stroke-draw одного пути |
| `--stagger-reveal` | `60ms` | задержка между элементами reveal |
| `--stagger-stroke` | `90ms` | задержка между путями stroke-draw |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | reveal, hover-glow, заливка |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | stroke-draw, shake |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | stamp |
| `--glow-signal` | `0 0 0 1px var(--signal), 0 12px 32px -16px rgb(240 179 35 / 0.45)` | hover-glow (это `--signal` с альфой, не новый цвет) |

Служебный спиннер отправки: поворот `700ms linear infinite`, только пока `submitting`.

## 3. Motion-язык

Пять именованных паттернов. Других анимаций на странице нет; «красивые» самодельные
эффекты вне этого списка запрещены. Все паттерны реализуются в `web/src/styles/motion.css`
и хуках `useReveal`/`useReducedMotion`; JS-библиотеки анимаций не нужны.

Жёсткие правила:

1. Анимируются только `transform`, `opacity`, `stroke-dashoffset`, `border-color`,
   `box-shadow`. Нельзя: `width/height/top/left/margin/padding`, scroll-jacking.
2. Каждый входной паттерн проигрывается **один раз** (reveal — один раз на элемент,
   stroke-draw — один раз на загрузку). Бесконечных циклов нет, кроме спиннера submitting.
3. Анимация никогда не блокирует сценарий: CTA hero кликабельна с первого кадра, поля и
   кнопки не ждут reveal, `pointer-events` не перекрывается.
4. **Финальный кадр детерминирован при `prefers-reduced-motion: reduce`** и совпадает с
   финальным кадром обычного проигрывания. Базовые стили (без JS и без медиазапроса) —
   уже финальный кадр: скрытое начальное состояние включается только из JS и только при
   `prefers-reduced-motion: no-preference`. Поэтому скриншотные тесты M6 с
   `reducedMotion: 'reduce'` получают один и тот же кадр независимо от таймингов.
5. Глобально: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after {
   animation: none !important; transition: none !important; } html { scroll-behavior: auto; } }`.
   JS-параллакс и reveal при reduce не инициализируются (`useReducedMotion`).
6. Плавный скролл к якорям — только `scroll-behavior: smooth` при no-preference; фокус при
   переходе к калькулятору сохраняется (см. §5.3).

### 3.1 `reveal` — появление секций и карточек при скролле

- Разметка: `[data-reveal]` на секции/карточке; хук `useReveal` (IntersectionObserver,
  `threshold: 0.2`, `unobserve` после срабатывания).
- Алгоритм: при no-preference хук в `useLayoutEffect` ставит `.is-pending` **до первой
  отрисовки**, при входе в вьюпорт заменяет на `.is-revealed`. При reduce классы не ставятся.
- Кадры: `.is-pending { opacity: 0; transform: translateY(16px); }` → финал
  `{ opacity: 1; transform: none; }`. Переход: `opacity` и `transform`,
  `var(--dur-reveal) var(--ease-out)`.
- Stagger по элементам одной секции: `transition-delay = index * var(--stagger-reveal)`,
  максимум 6 ступеней (7-й и далее — без дополнительной задержки), суммарно ≤ 300ms.
- Где: все секции ниже hero и карточки `.car`. Не применяется к элементам, меняющимся по
  данным: live-регионы, ошибки, спиннер, а также чек и подтверждение заявки — они появляются
  мгновенно, без reveal.
- **Финал (и reduce): `opacity: 1; transform: none`.**

### 3.2 `stroke-draw` — blueprint-развёртка машины в hero

- Разметка: inline SVG `.hero__drawing` (viewBox и геометрия наследуются из v1), группа
  `.hero__lines` (контур, стёкла, дверь, колёса, линия земли) и `.hero__panel` (заливка двери).
  SVG имеет `role="img"` и `aria-label` (или `aria-hidden="true"`, если рядом есть текстовый
  эквивалент) — инвариант доступности.
- Каждому `path`/`circle` задаётся атрибут `pathLength="1"` и стили
  `stroke-dasharray: 1; stroke-dashoffset: 1` **только при no-preference**; анимация
  `stroke-dashoffset: 1 → 0`, `var(--dur-stroke) var(--ease-in-out)`,
  задержка `index * var(--stagger-stroke)`. Замерять реальные длины путей не нужно.
- Заливка `.hero__panel`: `opacity: 0 → 1`, `var(--dur-fill) var(--ease-out)`, задержка =
  `(число путей − 1) * 90ms + 1200ms`. Цвет заливки — `--signal`, контур — `--on-night-2`.
- Общий intro hero ≤ 2500ms; заголовок, подзаголовок и CTA не анимируются вовсе, reveal в hero
  не используется.
- **Финал (и reduce): все пути `stroke-dashoffset: 0` (контур виден целиком),
  `.hero__panel { opacity: 1 }`.** Скриншот «hero final» M6 снимается именно в этом кадре.
- Дополнительно `hero-parallax`: `[data-parallax]` на `.hero__drawing`, смещение
  `translateY` в пределах **0…24px** по прогрессу прокрутки hero, только `transform`, через
  `requestAnimationFrame`. Отключается при reduce и при ширине < 768px. Финальный кадр при
  reduce — `transform: none`.

### 3.3 `stamp` — штамп принятой заявки

- Разметка: `.success-stamp` внутри `#booking-result`, оборачивает заголовок
  «Заявка принята» и номер `AD-…` (тексты — `BOOKING_TEXT.success`).
- Вид: рамка `2px solid var(--stamp)`, текст `--stamp`, `--font-mono`, uppercase,
  `padding: var(--space-1) var(--space-2)`, радиус `2px`, поворот в финале `-3deg`.
  В потоке документа, не перекрывает строки чека. Контраст текста 5.28:1 на `--paper`.
- Кадры: от `{ opacity: 0; transform: rotate(-8deg) scale(1.15); }` к финалу,
  `var(--dur-stamp) var(--ease-spring)`, один раз при переходе в `success`.
- **Финал (и reduce): `opacity: 1; transform: rotate(-3deg) scale(1);`.**
  Номер заявки читаем и в этом кадре — скриншот «success-штамп» M6 детерминирован.

### 3.4 `shake` — отклонённый сабмит

- Разметка: класс `.is-shaking` на `#booking-form` или `#calc-form`; ставится **только** на
  неудачную попытку отправки (ошибки валидации до сети, 400, 409) и снимается по
  `animationend`. Не ставится на ввод, на `unavailable`, на успех.
- Кадры: `translateX: 0 → -6px → 5px → -3px → 0`, `var(--dur-shake) var(--ease-in-out)`.
- Одновременно работает одна shake на странице; фокус при этом уже на первом ошибочном поле
  (§6), shake не мешает вводу.
- **Финал (и reduce): `transform: none`; при reduce ошибка показывается только текстом и
  `aria-invalid`, без движения.**

### 3.5 `hover-glow` — наведение на карточки и CTA

- Разметка: класс `.hover-glow` на `.car` и primary-кнопках. Только внутри
  `@media (hover: hover)` и только для не-disabled элементов.
- Эффект на `.car`: `transform: translateY(-2px)`, `border-color: var(--signal)`,
  `box-shadow: var(--glow-signal)`. На primary-кнопках: `box-shadow: var(--glow-signal)`
  без сдвига. Переход: `transform, border-color, box-shadow`,
  `var(--dur-hover) var(--ease-out)`.
- **Финал (и reduce): отсутствие transition; состояние наведения — статичная смена рамки/тени,
  без движения.** Скриншот «карточка hover» M6 делается с `reducedMotion: 'reduce'`.

### 3.6 Motion-бюджет (заменяет правило v1 «одна анимация на странице»)

| Ограничение | Значение |
|---|---|
| Именованных паттернов | ровно 5 + служебный спиннер submitting |
| Одновременно анимируемых групп | одна секция (reveal со stagger ≤ 300ms) либо hero-intro |
| Длительность одного паттерна | ≤ 1200ms; intro hero целиком ≤ 2500ms |
| Stagger | reveal 60ms (≤ 6 ступеней), stroke 90ms |
| Бесконечные анимации | только спиннер во время `submitting` |
| Анимируемые свойства | `transform`, `opacity`, `stroke-dashoffset`, `border-color`, `box-shadow` |
| Параллакс | только hero, ≤ 24px, только transform, off при reduce и < 768px |
| `prefers-reduced-motion` | все паттерны сразу в финальном кадре, JS-эффекты off |

## 4. Карта структуры `web/`

### 4.1 Дерево и владельцы

```
web/
  index.html                     # M3: lang="ru", <div id="root">, без внешних ресурсов
  vite.config.ts                 # M3: alias «@» → web/src, «@legacy» → ../src, server.proxy '/api' (§1)
  tsconfig.json                  # M3: allowJs для @legacy, strict для web/src
  src/
    main.tsx                     # M3: createRoot, import './styles/index.css'
    App.tsx                      # M3: AppProvider + слоты §4.2; после скелета M4/M5 его не правят
    styles/
      index.css                  # M3: tailwind + tokens.css + motion.css
      tokens.css                 # M3: §2 целиком
      motion.css                 # M3: §3 целиком (M4/M5 используют классы, не изобретают)
    state/
      rental.tsx                 # M3: AppProvider + useRental — единственный канал общего состояния (§4.5)
    lib/
      utils.ts                   # M3: cn() для shadcn
    hooks/
      useReducedMotion.ts        # M3
      useReveal.ts               # M3 (алгоритм §3.1)
    components/
      ui/                        # M3, полный набор §4.3; M4/M5 не редактируют
      Receipt.tsx                # M3: общий чек + мапперы строк трёх видов (§4.1.1)
      layout/
        SiteHeader.tsx           # M3: .surface-night, логотип + nav §5.1
        SiteFooter.tsx           # M3: .surface-night, монтирует ContactsSection + disclaimer
      sections/
        hero/HeroSection.tsx         # M4: #hero, .surface-night
        hero/HeroCarSvg.tsx          # M4: SVG-развёртка §3.2
        fleet/FleetSection.tsx       # M4: #fleet
        fleet/FleetFilter.tsx        # M4: фильтр + счётчик
        fleet/CarCard.tsx            # M4: карточка .car.card
        calculator/CalculatorSection.tsx  # M4: #calculator
        booking/BookingSection.tsx   # M5: #booking, #booking-form, машина состояний
        booking/BookingFields.tsx    # M5: три поля + подписи/подсказки/ошибки
        booking/BookingSnapshot.tsx  # M5: #booking-snapshot, #booking-empty
        booking/BookingResult.tsx    # M5: #booking-result + .success-stamp + #booking-again
        booking/useBookingMachine.ts # M5: переходы §6 поверх booking-form.js + useRental
        booking/api.ts               # M5: fetch POST /api/bookings, таймаут 10с → outcome (§7)
        info/BenefitsSection.tsx     # M4: #benefits
        info/HowSection.tsx          # M4: #how
        info/FaqSection.tsx          # M4: #faq (details/summary)
        info/ContactsSection.tsx     # M4: #contacts (монтируется в SiteFooter)
```

Каждый файл лежит в scope миссии-владельца: `sections/booking/**` (M5) включает `api.ts` и
`useBookingMachine.ts`; hero/fleet/calculator/info (M4) не содержат ни одного файла M5, и
наоборот. `state/rental.tsx`, `components/Receipt.tsx`, `components/ui/**` и `App.tsx` —
собственность M3, M4/M5 их только читают.

#### 4.1.1 Общий `Receipt` (владелец — M3)

`web/src/components/Receipt.tsx` — единственный компонент чека и единственное место, где
собираются его строки. Калькулятор (M4), снимок расчёта и подтверждение заявки (M5) — только
потребители; свою разметку `.receipt` секции не пишут и строки не дублируют.

```tsx
export type ReceiptTone = 'normal' | 'total' | 'deposit';
export type ReceiptRow = { label: string; value: string; tone?: ReceiptTone };
export type ReceiptProps = { rows: ReceiptRow[]; className?: string };

export function Receipt(props: ReceiptProps): JSX.Element;              // <dl class="receipt">
export function calcReceiptRows(result: RentalResult, car: Car, days: number): ReceiptRow[];
export function snapshotReceiptRows(view: ReturnType<typeof snapshotView>): ReceiptRow[];
export function confirmationReceiptRows(view: ReturnType<typeof confirmationView>): ReceiptRow[];
```

- Типы: `Car` — элемент массива `cars` (`{ id, model, class, gearbox, seats, pricePerDay }`),
  `RentalResult` — возврат `calculateRental` (`base`, `discount`, `extrasTotal`, `insurance`,
  `total`, `deposit`); оба выводятся из `@legacy`-модулей, своих полей не появляется.
- `Receipt` рендерит `<dl class="receipt">` со строками `.receipt__row`; `tone: 'total'` →
  класс `.receipt__row--total`, `'deposit'` → `.receipt__row--deposit`; `label` → `dt.receipt__label`,
  `value` → `dd.receipt__value`. Других классов у чека нет.
- `calcReceiptRows` реализует набор и порядок строк §5.4 (процент скидки — `discountRate`,
  суммы — `formatPrice`), `snapshotReceiptRows` — строки снимка §5.5, `confirmationReceiptRows`
  — строки подтверждения §5.5 (коррекция `FR-018` рисуется отдельным абзацем `.booking__correction`,
  не строкой чека).
- Видимость `#calc-result` / `#booking-snapshot` / `#booking-result` определяют секции;
  `Receipt` — чистый рендер строк, состояния не знает.

### 4.2 Слоты `App.tsx` (порядок — инвариант)

```tsx
<AppProvider>                    // M3: @/state/rental — единственный общий канал (§4.5)
  <div className="app">
    <SiteHeader />               // .surface-night, логотип + меню-якоря
    <main>
      <HeroSection />            // #hero        — .surface-night, тёмная blueprint-сцена
      <FleetSection />           // #fleet       — paper
      <CalculatorSection />      // #calculator  — paper
      <BookingSection />         // #booking     — paper
      <BenefitsSection />        // #benefits    — paper (слот info)
      <HowSection />             // #how         — paper (слот info)
      <FaqSection />             // #faq         — paper (слот info)
    </main>
    <SiteFooter />               // .surface-night; внутри <ContactsSection /> (#contacts)
  </div>
</AppProvider>
```

Порядок `id` в DOM: `hero → fleet → calculator → booking → benefits → how → faq → contacts`.
Слот **info** = четыре компонента `sections/info/`; `#contacts` находится внутри footer,
но остаётся последней секцией с якорем из меню.

### 4.3 `components/ui` — предзаполняется M3

`button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `select.tsx`, `checkbox.tsx`,
`badge.tsx`, `separator.tsx`, `spinner.tsx`. Это shadcn/ui-компоненты, тема — только через
переменные §2.4. Отображение v1 → v2:

| v1 (Bootstrap) | v2 (shadcn/ui + Tailwind) |
|---|---|
| `btn btn-primary` | `Button` (`bg-primary text-primary-foreground`, `hover-glow` для CTA) |
| `btn btn-outline-primary` | `Button variant="outline"` (граница `--input`, hover `--accent`) |
| `form-control`, `form-select` | `Input`, `Select` (нативный `<select>` внутри — инвариант клавиатурных тестов) |
| `form-label` | `Label` с `htmlFor` |
| `form-check-input` | `Checkbox` (нативный `<input type="checkbox">`, `name="extras"`) |
| `card` | `Card` (`bg-card`, граница `--border`, радиус 2px) |
| `list-group` | список на `Separator`/границах |
| `alert alert-secondary` | панель на `Card` с пунктирной границей `--border` |
| `spinner-border` | `Spinner` (`id="booking-spinner"`, `aria-hidden="true"`, 700ms) |
| `is-invalid` | **не используется**: стиль ошибки по селектору `[aria-invalid="true"]` (граница `--destructive`) |
| `invalid-feedback` | `<p role="alert">` с `text-destructive`; видимость по непустому тексту |

Диалогов и оверлеев в сценарии нет — Dialog/Accordion/Toast не добавляем. FAQ — нативные
`details/summary` (инвариант требований A), стилизованные под Card.

### 4.4 Зафиксированные пути импортов

Alias `@` = `web/src`, alias `@legacy` = корневой `src/` проекта. Расширения `.tsx` не пишутся;
у JS-модулей расширение `.js` обязательно (ES-модули Node используют те же файлы).

```ts
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Receipt, calcReceiptRows } from '@/components/Receipt';
import { useRental } from '@/state/rental';
import { HeroSection } from '@/sections/hero/HeroSection';
import { useReveal } from '@/hooks/useReveal';
import { useReducedMotion } from '@/hooks/useReducedMotion';

import { cars, CAR_CLASSES, GEARBOXES, CLASS_LABELS, GEARBOX_LABELS, seatsLabel } from '@legacy/cars.js';
import { calculateRental, discountRate, MIN_DAYS, MAX_DAYS, EXTRA_OPTIONS, EXTRA_LABELS, EXTRAS, FULL_INSURANCE } from '@legacy/calc.js';
import { filterCars, countLabel, EMPTY_MESSAGE, FILTER_ANY } from '@legacy/filter.js';
import { formatPrice, formatDate } from '@legacy/format.js';
import { validateBooking, todayUtc, addDays, BOOKING_HORIZON_DAYS } from '@legacy/booking.js';
import { BOOKING_TEXT, BOOKING_STATES, errorView } from '@legacy/booking-text.js';
import { bookingPayload, checkDraft, responseView, snapshotView, statePresentation, confirmationView, conflictText } from '@legacy/booking-form.js';
```

Не используются в React (HTML-генераторы v1): `fleetHtml`, `carRowHtml`, `carOptionsHtml`,
`extrasFieldsHtml`, `receiptHtml`, `extraHint` из `render.js` и `filterOptionsHtml` из
`filter.js`. Их видимые строки и правила перенесены в §5 как инварианты разметки; сами
функции не копируются в TS — разметку строит JSX. `booking-store.js` — только сервер,
веб-приложением не импортируется.

**Исключение — `seatsLabel`.** Это чистая функция строки (`1 место`, `4 места`, `5 мест`),
а не HTML-генератор, и дублировать её в TS нельзя (§0). Чтобы `render.js` можно было
удалить в M6 вместе со склонением, M3 переносит `seatsLabel` как есть в сохраняемый модуль
`src/cars.js`, а в `src/render.js` оставляет ре-экспорт
`export { seatsLabel } from './cars.js';` — тест `tests/render.test.js` продолжает импортировать
её из `render.js` и остаётся зелёным без правок. React импортирует функцию только из
`@legacy/cars.js`. Это единственные правки в `src/`, выходящие за scope своей миссии: M3
дописывает функцию в `src/cars.js` и строку ре-экспорта в `src/render.js`; остальное содержимое
обоих файлов не меняется.

### 4.5 Разделяемое состояние секций — `web/src/state/rental.tsx` (владелец M3)

Единственный канал связи между секциями. Реализация — React context
(`AppProvider` + `useRental`); вариант на `useSyncExternalStore` допустим, но интерфейс и
семантика ниже фиксированы. `App.tsx` монтирует провайдер (§4.2) и после M3 никем не правится,
поэтому всё межсекционное состояние живёт здесь.

```tsx
// web/src/state/rental.tsx
export type RentalEstimate = {          // снимок расчёта = единственное основание заявки (§6, R-01)
  carId: string;
  days: number;                         // целое, из калькулятора на момент расчёта
  extras: string[];                     // значения из EXTRA_OPTIONS
  result: ReturnType<typeof calculateRental>;
};

export type RentalStore = {
  estimate: RentalEstimate | null;      // null = «нет расчёта»
  setEstimate: (next: RentalEstimate | null) => void;
  chosenCarId: string | null;           // отметка в реестре; null до первого выбора
  chooseCar: (carId: string) => void;   // chosenCarId := carId И estimate := null
  resetEstimate: () => void;            // estimate := null, chosenCarId сохраняется
};

export function AppProvider(props: { children: ReactNode }): JSX.Element;
export function useRental(): RentalStore;
```

Семантика:

- `estimate === null` ⟺ у калькулятора нет итога и заявка в `no-estimate` (инвариант R-01):
  показ чека выводится из `estimate`, отдельного состояния «итог» нет.
- `chooseCar` всегда сбрасывает расчёт: смена машины — всегда новый расчёт.
- `resetEstimate` отметку о выборе не трогает: отфильтрованная выбранная машина теряет
  `data-chosen` (её строки нет), но `chosenCarId` сохраняется (§5.3).
- В store **нет** ничего про машину состояний заявки, ошибки полей, сеть и тексты.

Кто вызывает (иные каналы запрещены: прямые `document.getElementById` между секциями,
кастомные события на `window`, mutable-состояние на уровне модуля):

| Миссия | Пишет | Читает |
|---|---|---|
| M4 `fleet` | `chooseCar(carId)` — клик «Рассчитать» | `chosenCarId` (отметка `data-chosen`) |
| M4 `calculator` | `setEstimate(…)` — успешный расчёт; `resetEstimate()` — любой `input` в `#calc-form`; `chooseCar(id)` — `change` у `#calc-car` | `estimate` (показ чека) |
| M5 `booking` | `resetEstimate()` — «Оформить ещё одну заявку» | `estimate` — единственный источник снимка и перехода в `no-estimate` |

**Переходы машины заявки (§6) вызывает только секция booking** — через
`sections/booking/useBookingMachine.ts`, лежащий поверх `useRental`. Fleet и calculator лишь
пишут `estimate`/`chosenCarId` и никогда не переключают `editing`/`submitting`/`success`/
`unavailable` и не обращаются к DOM заявки. Хук машины детерминированно реагирует на внешний
сброс снимка: `estimate` стал `null` → переход в `no-estimate` со сохранением введённых
значений (из `editing`, `unavailable` и `success`); в `submitting` сброс состояние не меняет,
оно пересчитывается после применения исхода ответа (§6.2).

## 5. Инварианты DOM, селекторов и текстов

Обязательные `id`, `data-*`, роли и тексты. M4/M5 строят по ним разметку, M6 пишет против
них e2e, M7 повторяет их в макете. Осознанные отличия от v1 перечислены в §10 — всё,
чего там нет, менять нельзя.

### 5.1 Каркас

- `<html lang="ru">`, utf-8, viewport; ровно один `<h1>` (в hero).
- `SiteHeader`: логотип-ссылка `AutoDrive` → `#hero`; `<nav aria-label="Разделы страницы">`
  со ссылками в порядке: `Автопарк → #fleet`, `Расчёт → #calculator`, `Заявка → #booking`,
  `Условия → #benefits`, `Как арендовать → #how`, `Вопросы → #faq`, `Контакты → #contacts`.
- Каждый `href="#…"` ведёт на существующий `id`; внешних `http(s)` в `src`/`href` нет.
- Каждый значимый `svg`/`img` имеет `aria-label`/`alt` либо `aria-hidden="true"`.
- Заголовки секций: fleet «Восемь машин, цена за сутки», calculator «Сколько выйдет аренда»,
  booking — `BOOKING_TEXT.section.heading` в `#booking-heading`, benefits «Что входит в прокат»,
  how «Как арендовать», faq «Что спрашивают чаще всего», contacts «Связаться с прокатом».

### 5.2 Hero (`#hero`)

Тёмная сцена (`.surface-night`), единственный `h1` страницы. Тексты переносятся из v1
`index.html` дословно; анимации — только `stroke-draw`/параллакс SVG (§3.2), текст и CTA
неподвижны и кликабельны с первого кадра.

| Узел | Инвариант |
|---|---|
| `#hero` | `id="hero"`, класс `.surface-night`, contains `.rail` |
| Рейка `.rail` | «Лист осмотра № 04‑26» (дефис — U+2011, как в v1) |
| `h1` | «Берёте машину — цену видите сразу»; ровно один на странице (§5.1) |
| Подзаголовок | класс `.hero__lead`: «Восемь машин четырёх классов. Цена за сутки открыта в автопарке, залог возвращаем при сдаче машины. Ничего не надо уточнять по телефону.» |
| CTA | `<a href="#fleet">Выбрать автомобиль</a>` в видах primary-`Button` (фича A.2 requirements): якорь ведёт на существующий `#fleet`, hover-glow, `:focus-visible` по §9 |
| SVG | `.hero__drawing` (§3.2) с `role="img"` и `aria-label` про схему автомобиля в профиль; `data-parallax` на том же узле |
| Ширина | на 360px SVG масштабируется по контейнеру, горизонтального скролла нет, CTA — на всю ширину |

### 5.3 Автопарк (`#fleet`)

| Инвариант | Значение |
|---|---|
| `#fleet-filter-class`, `#fleet-filter-gearbox` | нативные `<select>` с `<label for>` («Класс», «Коробка»); значение «любой» = `FILTER_ANY` первым и по умолчанию («Любой класс», «Любая коробка»); отбор по `change`, без кнопки |
| Опции фильтра | строятся из `CAR_CLASSES`/`CLASS_LABELS` и `GEARBOXES`/`GEARBOX_LABELS` |
| `#fleet-count` | `role="status"`, текст строго `countLabel(shown, cars.length)` → «Показано N из M» |
| `#fleet-list` | контейнер карточек; при пустом результате содержит `<p class="fleet__empty">` с текстом `EMPTY_MESSAGE` дословно |
| `#fleet-status` | отдельный `role="status"` для выбранной машины: `Выбрана {model} — {formatPrice(pricePerDay)} за сутки.`; не меняется при фильтрации |
| Карточка | `<article class="car card" data-car-id="{id}">` + `hover-glow`; поля «Класс», «Коробка», «Салон», «Цена за сутки» = `formatPrice` + ` / сут`; кнопка `<button type="button" data-calc-for="{id}">Рассчитать</button>` |
| «Салон» | строка из `seatsLabel(car.seats)` (§4.4), а не из правила в JSX: для текущего автопарка это `4 места`, `5 мест`, `7 мест` |
| Выбранная | `data-chosen="true"` **не более чем на одной** карточке (до первого выбора — ни на одной); отфильтрованная карточка отметки не имеет, `chosenCarId` в store сохраняется |
| `.fleet__head` | **не рендерится** (карточная раскладка); требование «шапка скрыта при пустом результате» выполнено отсутствием шапки |
| Клик «Рассчитать» | `chooseCar(carId)` из `useRental()` (§4.5): машина выбирается в `#calc-car`, `estimate` сбрасывается (заявка → `no-estimate`); далее свои эффекты секции — `#fleet-status`, скролл к `#calculator`, фокус на `#calc-car` |
| Обратная синхронизация | `change` у `#calc-car` (M4, калькулятор) тоже вызывает `chooseCar(id)` — реестр мгновенно переставляет `data-chosen` без скролла; `#fleet-status` при этом **не** меняется (как в v1) |
| Запрет | внутри `#fleet` нет ни одного `<input>` (наследованный инвариант node-тестов); фильтр — отдельный блок перед реестром |

### 5.4 Калькулятор (`#calculator`)

- `#calc-form` с `novalidate`; submit-кнопка «Рассчитать стоимость».
- `#calc-car` — нативный `<select>` с `<label for>` «Автомобиль»; **всегда полный список**
  `cars` (фильтр автопарка его не касается); подпись опции `{model} — {formatPrice} / сут`.
- `#calc-days` — `<input type="number" min="1" max="30" step="1" inputmode="numeric"
  value="3">`, `<label for>` «Срок, суток», `aria-describedby="calc-error"`.
- `#calc-error` — `role="alert"`, всегда в DOM сразу после поля срока и до кнопки; при ошибке
  у `#calc-days` `aria-invalid="true"`, при исправлении атрибут снимается.
- Пустой срок: «Укажите срок аренды — целое число суток от 1 до 30.»; прочие ошибки —
  `error.message` из `RangeError` `calculateRental` (в т.ч. «…от 1 до 30…»). При ошибке итог
  не выводится.
- `#calc-extras` — `fieldset` с `legend` «Опции»; чекбоксы `name="extras"`,
  `value` ∈ `EXTRA_OPTIONS`; подписи `EXTRA_LABELS`; подсказки: для `child-seat`/`extra-driver`
  `{formatPrice(EXTRAS[option])} / сут`, для `full-insurance` «15 % от стоимости после скидки».
- `#calc-result` — пуст или содержит `<Receipt rows={calcReceiptRows(result, car, days)} />`
  (§4.1.1; рендер — `<dl class="receipt">`, строки `.receipt__row` с `.receipt__label` = `dt` и
  `.receipt__value` = `dd`):
  1. «Аренда {model}, {days} сут.» — `base`;
  2. «Скидка за срок, {Math.round(discountRate(days) * 100)} %» — «−» + `formatPrice(discount)`,
     только если `discount > 0`;
  3. «Опции, {days} сут.» — только если `extrasTotal > 0`;
  4. «Полная страховка» — только если `insurance > 0`;
  5. `.receipt__row--total` «Итого к оплате» — `total`;
  6. `.receipt__row--deposit` «Залог, вернём при сдаче» — `deposit`, всегда последней.
- **Инвариант R-01** (§4.5): снимок живёт только со свежим итогом. Любой `input` в `#calc-form`
  после расчёта вызывает `resetEstimate()` — чек исчезает, заявка переходит в `no-estimate`.
  `change` у `#calc-car` вызывает `chooseCar(id)` (§5.3).
- После успешного расчёта `#calc-car`/`#calc-days`/чекбоксы → `setEstimate({ carId, days,
  extras, result })`; заявка получает этот снимок и переходит в `editing`. `days` — число,
  `extras` — значения отмеченных чекбоксов.

### 5.5 Заявка (`#booking`)

Постоянные узлы (присутствуют всегда, live-области пустуют, когда сообщать нечего):

| Узел | Инвариант |
|---|---|
| `#booking-rail`, `#booking-heading`, `#booking-note` | тексты только из `BOOKING_TEXT.section` |
| `<noscript>` | сообщение о необходимости JavaScript (без него заявка не отправляется) |
| `#booking-form` | `novalidate`, `data-state` ∈ пяти состояний §6, начальное `no-estimate` |
| `#booking-snapshot` | снимок расчёта: заголовок «Из расчёта выше» + `<Receipt rows={snapshotReceiptRows(snapshotView(estimate))} />` (§4.1.1) — строки «Машина», «Срок», «Опции» («без опций»), «Итого» (`.receipt__row--total`) |
| `#booking-empty` | виден только при отсутствии снимка; `#booking-empty-text` = `BOOKING_TEXT.noEstimate.text`, `#booking-empty-link` = `href="#calculator"`, текст `noEstimate.link` |
| `.booking__fields` | обёртка трёх полей; скрыта только в `success` |
| Поля | `#booking-name` (`type="text"`, `autocomplete="name"`, `maxlength="60"`), `#booking-phone` (`type="tel"`, `autocomplete="tel"`), `#booking-date` (`type="date"`); все `required`, порядок в DOM: имя → телефон → дата |
| Подписи | `<label for="…" id="booking-name-label">` и т.д.; тексты `BOOKING_TEXT.labels` («Имя», «Телефон», «Дата начала аренды») |
| Подсказки | `#booking-name-hint`, `#booking-phone-hint`, `#booking-date-hint`; тексты `BOOKING_TEXT.hints` |
| Ошибки | `#booking-name-error`, `#booking-phone-error`, `#booking-date-error` — каждый `role="alert"`, стоит сразу после своего поля (между полем и его ошибкой нет других полей), цвет `--stamp` |
| `aria-describedby` | у каждого поля ровно два id: `"{id}-hint {id}-error"` |
| `#booking-date` min/max | **не прошиты в разметке**: ставятся из `todayUtc()` и `addDays(today, BOOKING_HORIZON_DAYS)`; число 365 в разметке не появляется |
| `#booking-required` | `BOOKING_TEXT.required` («* — обязательное поле») |
| `#booking-message` | общее сообщение над кнопкой (`stale`/`rejected`), цвет `--stamp`, без live-роли |
| `#booking-submit` | `<button type="submit" id="booking-submit">`; подписи `BOOKING_TEXT.buttons`; `aria-busy="true"` только в `submitting` |
| `#booking-spinner` | внутри `#booking-submit` только в `submitting`, `aria-hidden="true"` |
| `#booking-status` | `role="status"`, фокус не перехватывает |
| `#booking-result` | подтверждение: `.success-stamp` (§3.3) + `<Receipt rows={confirmationReceiptRows(confirmationView(body, snapshotTotal))} />` (§4.1.1) — «Номер заявки», «Машина», «Дата начала», «Срок», «Итого» + необязательный `.booking__correction` + `<button type="button" id="booking-again">Оформить ещё одну заявку</button>` |
| Телефон | в подтверждении **не показывается** |

### 5.6 Инфо-секции и footer

- `#benefits`: 4 пункта `<li>` (допустимо 3–4), тексты переносятся из v1 `index.html` дословно.
- `#how`: ровно 3 шага `<li>` с подзаголовками «Выберите машину», «Назовите срок»,
  «Подпишите лист осмотра».
- `#faq`: ровно 4 `<details>` с `<summary>`; первый ответ содержит «Два года и возраст от
  21 года». Нативные `details/summary`, раскрытие с клавиатуры (Enter/Space) — без JS.
- `#contacts` (внутри `SiteFooter`, тёмная поверхность): `<dl>` «Телефон»
  (`<a href="tel:+70000000000">+7 000 000-00-00</a>`), «Почта»
  (`<a href="mailto:hello@example.com">hello@example.com</a>`), «Выдача машин»; финальный
  `.disclaimer` «AutoDrive — учебный пример. Машины, цены и контакты вымышленные.»

## 6. Инвариант: state-machine заявки

Машиночитаемые состояния (`data-state`, `BOOKING_STATES`) — только пять, в порядке контракта:
`no-estimate`, `editing`, `submitting`, `success`, `unavailable`. Ошибки полей — признак
`editing`, а не отдельное состояние. Реализация — `web/src/sections/booking/useBookingMachine.ts`
(M5, внутри его scope) **поверх** `statePresentation`, `checkDraft`, `responseView`,
`snapshotView`, `confirmationView`, `conflictText` из `@legacy/booking-form.js` и `estimate`
из `useRental()` (§4.5): своя логика разбора ответов и своё состояние расчёта запрещены.

### 6.1 Отображение состояний

| `data-state` | Поля | `#booking-submit` | Снимок / empty / результат | Live-тексты |
|---|---|---|---|---|
| `no-estimate` | disabled (значения сохраняются) | disabled, подпись «Отправить заявку» | empty виден, снимок и результат пусты/скрыты | `#booking-message` = `stale`, если пришли из отказа по снимку |
| `editing` | enabled | enabled, «Отправить заявку», `aria-busy="false"` | снимок виден, empty скрыт, результат пуст | ошибки полей в `#…-error`; `rejected` в `#booking-message` |
| `submitting` | disabled | disabled + `aria-busy="true"` + `#booking-spinner`, «Отправляем заявку…» | снимок виден | `#booking-status` = «Отправляем заявку…» |
| `success` | `.booking__fields` и `#booking-required` скрыты | скрыт | снимок и empty скрыты, результат с `.success-stamp` виден | `#booking-status` = `Заявка № {id} принята.` |
| `unavailable` | enabled, черновик сохранён | enabled, «Отправить заявку» | снимок виден | `#booking-status` = `BOOKING_TEXT.unavailable` |

### 6.2 Переходы

| Событие | Из → В | Эффекты |
|---|---|---|
| монтирование | → `no-estimate` | снимка нет |
| успешный расчёт | `no-estimate` → `editing` | создан `estimate`; снимок через `snapshotView` |
| внешний сброс снимка: `resetEstimate()` из калькулятора (input) или флота (`chooseCar`), «Оформить ещё одну заявку» | `editing`/`unavailable`/`success` → `no-estimate` (из `submitting` — после применения исхода, см. ниже) | `estimate = null` в store (§4.5); итог калькулятора очищен; в `again` дополнительно очищены поля и ошибки (и тоже `resetEstimate()`); `success` при этом тоже гаснет — как в v1 |
| submit без `estimate` | без перехода | guard, сети нет |
| submit в `submitting` или `success` | без перехода | guard §8, второго запроса нет |
| submit в `editing`/`unavailable`, `checkDraft` с ошибками `name`/`phone`/`startDate` | → `editing` | ошибки у полей по каталогу §7 контракта, `aria-invalid`, фокус на **первое** ошибочное поле в порядке имя → телефон → дата, shake; **сети нет** |
| submit, ошибки по `carId`/`days`/`extras` | → `no-estimate` | `#booking-message` = `stale`, ссылка на калькулятор; значения полей сохранены; сети нет |
| submit, черновик валиден | → `submitting` | `bookingPayload(estimate, draft)`; `days` — число из снимка на момент нажатия |
| 201/200, тело читается `confirmationView` | → `success` | штамп §3.3, чек из тела; если `price.total` ≠ итогу снимка — строка коррекции `BOOKING_TEXT.success.correction(было, стало)` |
| 201/200, тело не читается | → `editing` | `#booking-message` = `rejected`; черновик сохранён, повтор разрешён |
| 400 `validation_failed` | → `editing` или `no-estimate` | разбор только через `responseView`: поля формы — ошибки у полей, поля снимка — `stale` + `no-estimate`; пустой/нераспознанный разбор — `rejected` |
| 409 `date_conflict` | → `editing` | ошибка у `#booking-date`: `conflictText(error.conflict)` = «Эта машина занята с {formatDate(startDate)} по {formatDate(addDays(endDate, -1))}. …»; непрочитанный `conflict` → `BOOKING_TEXT.conflictFallback`; фокус на дату |
| прочие 4xx, нераспознанный код/поле | → `editing` | `#booking-message` = `rejected` |
| 5xx, `internal_error`, таймаут 10с, разрыв сети, неразобранный ответ | → `unavailable` | `#booking-status` = `unavailable`-текст; черновик сохранён; следующий submit отправляет **новый** запрос |

Дополнительные правила: правка поля снимает ошибку **только этого поля** (текст и
`aria-invalid`), не трогая остальные; из ответа сервера UI берёт только `id`, `price.total`,
`carId`, `startDate`, `days` и границы `conflict` — серверные `message` никогда не показываются;
«сегодня» — только `todayUtc()` в обработчике submit, чистые функции к часам не обращаются.
Гонка «сбросили расчёт, пока запрос в полёте» (калькулятор во время `submitting` не
блокируется) разрешается так: внешний `resetEstimate()` **не** переключает состояние — заявка
доходит до ответа в `submitting`; после применения исхода состояние пересчитывается от
фактического `estimate`: `success` остаётся `success` (подтверждение собрано из тела ответа, а не
из снимка), а `editing`/`unavailable` при `estimate === null` дают `no-estimate` с сохранёнными
значениями полей. Сеть при этом уже состоялась — второго запроса нет (§8).

## 7. Инвариант: API (по §4–§10 booking-contract)

Ручки и коды не меняются: `POST /api/bookings` → `201 | 200 | 400 | 409 | 413 | 415 | 500`,
`GET /api/bookings/{id}` → `200 | 404`. UI и API на одном origin, CORS нет.

Тело запроса (ровно шесть полей, `Content-Type: application/json`):

| Поле | Источник в UI | Правило |
|---|---|---|
| `carId` | `estimate.carId` | id из `cars` |
| `days` | `estimate.days` | **целое число** 1–30, не строка |
| `extras` | `estimate.extras` | массив из `EXTRA_OPTIONS`, без повторов; по умолчанию `[]` |
| `name` | `#booking-name` | как введено (trim/проверка — общий `validateBooking`) |
| `phone` | `#booking-phone` | как введено, нормализация — сервер |
| `startDate` | `#booking-date` | `YYYY-MM-DD`, сегодня…+365 суток UTC |

Не отправляются: суммы, `endDate`, `id`, `status`, `createdAt`. Телефон в подтверждении не
показывается. Проверка полей до сети — тем же `validateBooking`, что на сервере
(через `checkDraft`), своих правил в UI нет.

Транспорт (`web/src/sections/booking/api.ts`, M5, внутри его scope): единственная точка `fetch`;
путь относительный (`/api/bookings`), поэтому в dev он идёт через `server.proxy` на `:8000`
(§1), а в prod — на тот же origin; `AbortController` с таймаутом **10 000ms**; результат
нормализуется в `{ kind: 'json', status, body }` либо `{ kind: 'timeout' | 'network' |
'unparsable' }` — вход `responseView`. Повтор после `unavailable` безопасен серверной
идемпотентностью §9 контракта (200 с существующей заявкой).

Обязательные опции разбора (`options` второго аргумента `responseView` — без них коррекция
`FR-018` молча исчезает, а любой `name_length` попадает в ветку «слишком короткое»):

```ts
const outcome = await sendBooking(payload);                 // api.ts
applyOutcome(
  responseView(outcome, {
    snapshotTotal: estimate.result.total,                   // итог снимка на момент отправки
    length: [...draft.name.trim()].length,                  // кодовые точки имени после trim
  }),
);
```

`length` считается именно так (`[...String(draft.name ?? '').trim()].length`): суррогатная
пара — один символ. Это тот же расчёт, что в v1 (`src/main.js`), и он нужен `errorView`, чтобы
выбрать «Имя слишком короткое…» (< 2) или «Имя слишком длинное…» (> 60) при одном серверном
коде `name_length`.

Коды ошибок → реакция UI (тексты не дублируются здесь: их отдаёт `errorView`/
`conflictText` из `@legacy`, каталог — §7 booking-contract):

| Коды | Поле | HTTP | Состояние и показ |
|---|---|---|---|
| `required`, `name_length`, `name_charset` | `name` | 400 | `editing`, ошибка у `#booking-name` (ветку `name_length` выбирает UI по длине своего значения) |
| `required`, `phone_charset`, `phone_invalid` | `phone` | 400 | `editing`, ошибка у `#booking-phone` |
| `required`, `date_format`, `date_invalid`, `date_past`, `date_too_far` | `startDate` | 400 | `editing`, ошибка у `#booking-date` (в `date_too_far` подставляется `BOOKING_HORIZON_DAYS`) |
| `date_conflict` | `startDate` | 409 | `editing`, `conflictText` с последним занятым днём `addDays(endDate, -1)` или `conflictFallback` |
| `required`, `car_unknown` | `carId` | 400 | `no-estimate` + `stale` в `#booking-message` |
| `required`, `days_not_integer`, `days_out_of_range` | `days` | 400 | `no-estimate` + `stale` |
| `extras_not_array`, `extra_unknown`, `extras_duplicate` | `extras` | 400 | `no-estimate` + `stale` |
| `invalid_json`, `unsupported_media_type`, `payload_too_large`, `method_not_allowed`, `not_found`, `booking_not_found`; любой нераспознанный код или поле | — | 400/413/415/404/405 | `editing` + `rejected` в `#booking-message` |
| `internal_error`, любой 5xx, таймаут, разрыв связи, неразобранный ответ | — | 5xx / нет ответа | `unavailable` + текст в `#booking-status`, повтор разрешён |

Все 16 кодов полей каталога достижимы и обрабатываются общим `validateBooking`; UI рендерит
по `code`, а не по `message`. Проверка собирает ошибки по всем полям за один проход в порядке
`carId`, `days`, `extras`, `name`, `phone`, `startDate`; если среди ошибок есть хоть одна по
снимку (`carId`/`days`/`extras`), форма целиком уходит в `no-estimate`.

## 8. Инвариант: защита от повторной отправки

Обязаны срабатывать **все** рубежи, а не только `disabled`:

1. Единственный обработчик — `onSubmit` формы. Клик по `#booking-submit` (type="submit"),
   Enter в любом поле (implicit submission) и программный `form.requestSubmit()` проходят
   через него. Отдельных `onKeyDown`/`onClick`, отправляющих форму, нет.
2. Синхронный guard `useRef`: флаг `inFlight` выставляется **до первого `await`** и снимается
   в `finally`. Проверка состояния — тоже через ref/актуальное значение машины, а не только
   через React-state (state обновляется асинхронно и не защищает от двух submit подряд).
3. Guard отклоняет submit при: отсутствии `estimate`, `inFlight === true` (submitting),
   состоянии `success`. В `success` повторный `requestSubmit()` не создаёт запрос.
4. Второй рубеж — `disabled` на полях и кнопке в `submitting` + `aria-busy="true"`.
   Disabled не считается достаточной защитой: `requestSubmit()` вызывает submit-событие
   и при заблокированной кнопке.
5. После `unavailable` и после ошибок валидации повторная отправка **разрешена** (один новый
   запрос). После `success` — только через `#booking-again` (type="button").

Тестовый инвариант (M6): при задержке ответа клик + Enter + `requestSubmit()` дают **ровно
один** сетевой запрос; в `success` `requestSubmit()` — ноль новых запросов.

## 9. Инвариант: доступность и узкий экран

| Требование | Норма v2 |
|---|---|
| Подписи | `<label for>` у всех полей и селектов (в т.ч. фильтров); `htmlFor` в shadcn `Label` |
| Ошибки | `role="alert"` у каждой области ошибки; `aria-invalid="true"` на поле при ошибке, атрибут снимается при исправлении; текст — что исправить, без извинений |
| Связь | `aria-describedby` = подсказка + ошибка у каждого поля заявки; `calc-error` у срока |
| Занятость | `aria-busy` на `#booking-submit`; спиннер `aria-hidden="true"` |
| Live-регионы | `#booking-status`, `#fleet-count`, `#fleet-status` — `role="status"`; узлы постоянны, фокус не перехватывают |
| Фокус | На `--paper` — **двойной** индикатор: `outline: 2px solid var(--ink)` (12.72:1) + `box-shadow: 0 0 0 3px var(--signal)` снаружи (жёлтое кольцо); одиночная жёлтая обводка на светлом запрещена (§2.3). На `--night` — `outline: 3px solid var(--signal); outline-offset: 2px` (9.59:1). `:focus-visible` стоит после правил hover-glow, так что фокусное кольцо не перебивается тенью наведения; outline никогда не обнуляется без замены |
| Фокус при ошибках | после отклонённого submit — на первом ошибочном поле в визуальном порядке |
| Клавиатура | весь сценарий без мыши: стрелки в нативных `<select>`, Tab по полям в порядке DOM, Enter — submit, Space/Enter — чекбоксы и `details/summary`; ловушек фокуса нет |
| Семантика | один `h1`; `lang="ru"`; подписанный/скрытый SVG; нативные кнопки, а не `div` с обработчиком |
| Ширина | 360px и 1280px без горизонтального скролла (допуск ≤ 1px); `#booking-submit` достижима и видна на 360px; карточки и поля в одну колонку |
| Reduced motion | §3: финальные кадры детерминированы, содержимое доступно без анимаций и без JS-инициализации reveal |

## 10. Что осознанно меняется (не является регрессом)

| Было (v1) | Стало (v2) |
|---|---|
| Bootstrap 5.3, классы `btn`, `form-control`, `card`, `is-invalid`, `invalid-feedback`, `spinner-border` | shadcn/ui + Tailwind; ошибка поля — по `[aria-invalid="true"]`; спиннер — `Spinner` с сохранённым `id="booking-spinner"` |
| «Одна анимация на странице» | Motion-бюджет §3.6: пять паттернов с именами, таймингами и финальными кадрами |
| Светлая тема на всей странице | Тёмные `.surface-night`: **шапка, hero и footer** (единая сцена сверху + полоса снизу); основной поток остаётся на `paper` |
| Одиночная жёлтая обводка фокуса на `paper` (1.64:1) | Двойной индикатор на светлом: `--ink` outline + жёлтое кольцо (§9); на `night` — прежний `--signal` |
| Границы полей `--rule` | Границы интерактива `--ink-2` / `--on-night-2` (усиление non-text contrast до ≥ 3:1) |
| `.fleet__head` (скрыт CSS) | Не рендерится вовсе |
| HTML-строки из `render.js`/`filterOptionsHtml` | JSX с теми же текстами и порядком (§5); генераторы HTML не переносятся, чистая `seatsLabel` сохраняется в `src/cars.js` (§4.4) |
| `index.html`, `styles.css`, `src/main.js`, `src/render.js`; node-тесты разметки | Удаляются в M6 (из `render.js` — все HTML-генераторы); разметочные проверки переносятся в e2e/компонентные тесты M6 без ослабления |

Всё остальное — `id`, `data-*`, состояния, тексты, API, чистая логика, заглушки контактов,
отсутствие внешних ресурсов — сохраняется.

## 11. Карта рубрики 12/12

| # | Баллы | Чем подтверждается в v2 | Миссия |
|---|---:|---|---|
| 1 Макет | 3 | `mockup/` v2: 9 экранов сценария + вкладка «Движение» (кадры §3), токены §2, сверка с интерфейсом | M7, M8 |
| 2 Библиотека | 0,5 | shadcn/ui-компоненты §4.3 переиспользуются во всех секциях; README называет библиотеку | M3–M5 |
| 3 Единые стили | 0,5 | `tokens.css` + Tailwind-тема: цвета, типографика, отступы только из §2 | M3 |
| 4 Полный сценарий | 1 | Выбор машины → расчёт → заявка → номер из реального `server.js`; `GET /api/bookings/{id}` | M5, M6 |
| 5 Соответствие макету | 1 | Скриншоты v2 против экранов макета, расхождения описаны | M7, M8 |
| 6 a11y | 1 | §9 + e2e: подписи, Tab/Enter, видимый фокус, 360px | M4–M6 |
| 7 Повторная отправка | 1 | §8 + строгий e2e «один запрос» при клике/Enter/`requestSubmit` | M5, M6 |
| 8 Тесты взаимодействий | 1 | e2e: фильтр, выбор карточки, расчёт, FAQ, повторная заявка | M6 |
| 9 Тесты валидации | 1 | e2e: обязательные поля, телефон, срок 0/31/пусто, 400, 409 | M6 |
| 10 Тесты состояний | 1 | e2e с моками в форматах реального API: задержка, пустой фильтр, успех, 500 | M6 |
| 11 Сквозной тест | 1 | `scenario.spec` на реальном API с GET-сверкой + скриншотные тесты reduced-motion | M6 |

Условие раздела тестирования: **все** клиентские тесты зелёные — `sh scripts/check.sh` и
`npx playwright test` (включая скриншотные с `reducedMotion: 'reduce'`).

## 12. Чек-лист приёмки миссий M3–M6

- `npm run web:build` собирается; `sh scripts/check.sh` зелёный; существующие проверки не
  ослаблены и не удалены вне мандата M6.
- Нет внешних ресурсов и новых цветов; контрасты §2.3 не деградировали; вымышленные данные.
- `src/*.js` (кроме удаляемых в M6 `main.js`/генераторов `render.js` и переноса `seatsLabel`
  из §4.4) и API `server.js` не изменены.
- Межсекционные связи идут только через `@/state/rental` (§4.5): ни одного
  `document.getElementById` между секциями, ни своего состояния расчёта в fleet/calculator.
- В dev (`:5173`) заявка уходит через `server.proxy '/api'` и работает сквозной сценарий;
  в prod — один origin (§1).
- Селекторы §5 присутствуют; состояния §6 воспроизводятся; §8 подтверждён логом сети.
- 360px/1280px без скролла; клавиатурный путь и фокус проверены вручную и тестами; на `paper`
  индикатор фокуса двойной (§9), на `night` — `--signal`.
- При `prefers-reduced-motion: reduce` hero, штамп и hover — детерминированные финальные
  кадры; скриншотные эталоны M6 стабильны между прогонами.
