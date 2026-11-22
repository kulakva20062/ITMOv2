# AutoDrive — лендинг проката автомобилей (React v2)

Одностраничный сервис: выбор машины в автопарке, расчёт аренды со скидками и опциями,
заявка на бронирование через собственный API (`server.js`, хранилище в памяти процесса).
Данные вымышленные.

## Стек

**React 19 + Vite 7 + TypeScript + Tailwind CSS 3 + shadcn/ui** (Radix-основы ставятся из npm).
Готовые примитивы — `Button`, `Input`, `Select`, `Checkbox`, `Label`, `Card`, `Badge`,
`Separator`, `Spinner` в `web/src/components/ui/`; чек трёх видов — `Receipt.tsx`,
общее состояние секций — `useRental` из `web/src/state/rental.tsx`. Внешних CDN, сетевых
шрифтов и картинок нет: изображения — CSS и inline SVG. Токены и motion-паттерны —
`web/src/styles/tokens.css` и `motion.css`, норма — `docs/design-contract.md`.

Чистая логика остаётся в корневых `src/*.js` и импортируется приложением через alias
`@legacy` (`cars`, `calc`, `filter`, `format`, `booking`, `booking-form`, `booking-text`);
серверные данные — `src/booking-store.js`. Решения по состояниям заявки дают только
функции `booking-form.js`, видимые строки — `booking-text.js`.

## Команды

Требуется Node.js 24+.

```bash
npm ci                 # зависимости приложения, Vite/TypeScript и Playwright (по lockfile)
npm run web:build      # проверка TypeScript + production-сборка в web/dist
npm start              # node server.js: корень / и /ui отдают web/dist, /api/** — API
                       # (порт 8000 по умолчанию, можно переопределить PORT=…)
just start             # то же самое из practices/practice_08: justfile лежит там;
                       # если server.js уже слушает 8000 (свой или ручной), останавливает
                       # и поднимает заново; just stop / just status / just logs — там же
npm run web:dev        # Vite dev-сервер на :5173; /api проксируется на localhost:8000,
                       # поэтому нужен запущенный `npm start`
npm test               # sh scripts/check.sh: node --test по логике, API и статике
npm run test:ui        # Playwright: сначала собирает web/dist, поднимает свой сервер
                       # на PORT=8176 и гасит его после прогона
npm run test:ui:report # HTML-отчёт после прогона
npm run screenshots    # собирает web/dist и переснимает docs/screenshots/ для отчёта
```

Playwright использует системный Chromium (`chromium` в PATH); если его нет —
один раз `npx playwright install chromium`.

## Один origin

В prod `GET /`, `/ui` и любые не-`/api` пути отдают собранный `web/dist` (SPA-fallback для
клиентских маршрутов; отсутствующие assets — 404). В dev Vite держит `server.proxy` для
`/api`, так что заявка уходит на тот же backend без CORS. Playwright работает по той же
модели: `npm run web:build && node server.js` на `http://127.0.0.1:8176/`.

## Клиентские тесты и скриншоты

```bash
npx playwright test                                   # все тесты, включая визуальные
npx playwright test tests/e2e/visual.spec.mjs         # только скриншотные
npx playwright test tests/e2e/visual.spec.mjs --update-snapshots
                                                      # перезаписать эталоны после намеренной
                                                      # правки вёрстки
```

Скриншотные тесты `tests/e2e/visual.spec.mjs` снимают hero final, выбранную карточку в
hover-glow, чек, валидацию, submitting и success-штамп плюс полную страницу 360px.
Контекст открывается с `reducedMotion: 'reduce'`, `locale: 'ru-RU'`, UTC и светлой схемой.
На Linux нативное поле даты учитывает язык процесса Chromium. Тесты и скрипт съёмки
отчётных кадров задают браузеру `LANGUAGE=ru` в общем `scripts/chromium.mjs`, поэтому
`npm run test:ui` работает и с `LC_ALL=C.UTF-8` без настройки системной локали.
Эталоны лежат в `tests/e2e/visual.spec.mjs-snapshots/`. Сравнение использует прежние
пороги Playwright. После намеренной правки вёрстки проверьте визуальную разницу и
добавьте новые кадры в тот же коммит.

Покрытие e2e: каркас и доступность DOM, автопарк/фильтр/выбор, чек на трёх комбинациях
через `calculateRental`, валидация калькулятора и заявки, состояния заявки с моками в
форматах реального API (201, битое тело, 400 per-field, 409 conflict, 500, задержка),
строгий тест «повторная отправка во время ожидания не создаёт второй запрос», сквозной
сценарий на реальном API с `GET /api/bookings/{id}`, клавиатурный путь с вводом даты, focus-visible,
360px/1280px, отсутствие console-ошибок и запроса `/favicon.ico`.

## Основной пользовательский сценарий

Посетитель выбирает машину → считает аренду → заполняет заявку → получает номер `AD-…`,
который реально создался в API. Состояния интерфейса: нет расчёта (поля заблокированы),
заполнение, ошибки полей, отправка (спиннер, `aria-busy`), успех, «сервер недоступен»
с повтором, конфликт даты 409, пустой фильтр, узкий экран 360px. При выключенном
JavaScript виден статический fallback в `web/index.html`.

## Структура

```
web/                  приложение v2: Vite, React, Tailwind, shadcn/ui
  dist/               игнорируемая production-сборка
src/                  чистые модули логики и серверное хранилище
server.js             web/dist на / и /ui + /api/bookings (POST/GET)
tests/                node --test: логика, API, shell статика
tests/e2e/            Playwright: компоненты, состояния, сценарий, визуальные эталоны
scripts/              check.sh и вспомогательные сборки
docs/                 requirements, design-contract, style-guide, screenshots
specs/, openspec/     истории спецификаций учебной сборки
```

## Как запустить и проверить сценарий

1. `npm run web:build && npm start`, открыть `http://127.0.0.1:8000/`.
2. Нажать «Рассчитать» у машины, задать срок и опции, «Рассчитать стоимость».
3. Заполнить заявку и отправить; в подтверждении появится номер `AD-…`.
4. Пройти тот же путь с клавиатуры (Tab/Enter) — фокус виден на обеих поверхностях.
5. `npm test && npm run test:ui` — все проверки зелёные, включая скриншотные.
