# AutoDrive — прокат автомобилей

Актуальный интерфейс v2 живёт в `web/`: Vite, React, TypeScript, Tailwind CSS и shadcn/ui.
Компоненты shadcn/ui и их Radix-основы устанавливаются из npm вместе с остальными зависимостями.
Внешние CDN, сетевые шрифты и сетевые изображения запрещены; изображения — CSS или inline SVG.
Миграция завершена: и корень `/`, и `/ui` отдают собранное приложение `web/dist` (SPA-fallback);
legacy `index.html`/`styles.css`/`src/main.js`/`src/render.js` удалены, чистые модули `src/*.js`
сохранены и импортируются через alias `@legacy`.

## Перед работой прочитай
- Продуктовые требования: `docs/requirements.md`.
- Норму редизайна: `docs/design-contract.md` (токены §2, motion §3, карта `web/` §4).
- Визуальные правила: `docs/style-guide.md`.
- Имена полей, состояния и тексты заявки: `specs/contracts/booking-contract.md`.
- Пример node-теста: `tests/format.test.js`; клиентские тесты: `tests/e2e/`.

## Команды
- `npm run web:dev` — Vite dev-сервер; `/api` проксируется на `http://localhost:8000`.
- `npm run web:build` — проверка TypeScript и production-сборка в `web/dist`.
- `npm start` — сервер API и приложения: `/`, `/ui` и не-`/api` пути отдают `web/dist`
  (порт 8000 по умолчанию, `PORT=…` переопределяет).
- `sh scripts/check.sh` — обязательная проверка после каждой правки.
- `npm run test:ui` — клиентские Playwright-тесты перед сдачей (собирают `web/dist`,
  поднимают свой сервер на `PORT=8176`).
- `npm run screenshots` — собирает `web/dist` и переснимает `docs/screenshots/`.

## Правила v2
- Соблюдай `docs/design-contract.md`; изменение контракта — отдельный согласованный шаг.
- Цвета, типографика, отступы и радиусы — только из токенов §2. Контрасты WCAG AA не ослаблять.
- На светлом `paper` фокус двойной (`--ink` + кольцо `--signal`), на тёмном `night` — `--signal`.
- Анимации — только пять паттернов §3 и спиннер submitting. При `prefers-reduced-motion: reduce`
  все паттерны сразу находятся в детерминированном финальном кадре, JS-эффекты отключены.
- Общее состояние секций — только `AppProvider`/`useRental` из `web/src/state/rental.tsx`.
- Готовые примитивы — из `web/src/components/ui`; не создавай параллельный набор компонентов.
- Чистые модули корневого `src/` переиспользуются через alias `@legacy`, без копирования логики.
  Alias `@` указывает на `web/src`; у JS-импортов расширение `.js` обязательно.
- Все суммы форматируются через `formatPrice`, даты — через `formatDate`.
- Только вымышленные данные: `+7 000 000-00-00`, `hello@example.com`; никаких реальных контактов
  и брендов прокатов.
- Не меняй `docs/requirements.md`, `scripts/check.sh`, API и существующие тесты ради зелёного
  результата без отдельного поручения.
