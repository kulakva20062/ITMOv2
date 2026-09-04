# Контекст AS IS и Context Pack

## Продукт и команда сейчас

| Вопрос | Ответ | Источник или допущение |
|---|---|---|
| Какой продукт или сервис рассматриваем? | REST API для автоматического ревью pull request по диффу с использованием LLM | Факт из diff: добавлен POST /api/reviews и класс ReviewService |
| Кто им пользуется? | Клиент, отправляющий дифф PR и получающий комментарий | Вывод из интерфейса API (вход — поле diff) |
| Как устроен текущий процесс? | Клиент делает POST /api/reviews с JSON {"diff": "..."}; API вызывает ReviewService.review, который формирует промпт и вызывает LLM.generate; ответ возвращается как {"comment": str} | Факты из app/api.py и app/review_service.py |
| Где возникает задержка или ошибка? | Нет валидации входа (KeyError при отсутствии diff), нет обработки ошибок/таймаутов LLM (риск 500), синхронный маршрут может блокироваться длительным вызовом LLM | Факты из diff; см. app/api.py +35–38; app/review_service.py +19–22 |
| Какие системы и команды участвуют? | FastAPI-приложение (app/api.py), сервис обзора (app/review_service.py), провайдер LLM (протокол LLM.generate) | Факт из diff |

## Context Pack для первого рабочего сценария

### Факты и правила

- Добавлен маршрут FastAPI: `@app.post("/api/reviews")` с обработчиком `create_review(payload: dict) -> dict[str, str]`, который возвращает `review_service.review(payload["diff"])`.
- В `ReviewService.review(diff: str)` формируется промпт: "Review this pull request and find problems:\n{diff}", вызывается `self.llm.generate(prompt)` и возвращается `{"comment": answer}`.
- Протокол `LLM` определяет метод `generate(self, prompt: str) -> str`.
- Нет явной валидации входного JSON, используется прямой доступ `payload["diff"]`.
- Нет обработки исключений и таймаутов при вызове LLM.
- Нет признаков аутентификации/авторизации на маршруте.

### Формат входа и результата

- Вход (HTTP): POST `/api/reviews` с телом JSON: `{ "diff": "<unified diff text>" }`.
- Результат: JSON `{ "comment": "<строка — ответ LLM>" }`.

### Ограничения и запрещённые действия

- Единственный источник фактов: `practices/practice_01/TRAINING_PR.diff`.
- Нельзя менять код в `app/` в рамках этой практики.
- Нельзя придумывать несуществующие правила/ID.
- Правим только `context.md`, `problem.md`, `prompts.md`.

### Хороший пример

Запрос:

```
POST /api/reviews
Content-Type: application/json

{
  "diff": "diff --git a/app/review_service.py b/app/review_service.py\n..."
}
```

Ожидаемый ответ (по текущей реализации):

```
{
  "comment": "<LLM output about the diff>"
}
```

### Плохой пример

Запрос без поля `diff`:

```
POST /api/reviews
Content-Type: application/json

{}
```

Поведение сейчас: KeyError при `payload["diff"]` и ответ 500 (нет валидации), что делает API нестабильным для клиента.

### Что пока неизвестно

- Нужны ли аутентификация/квоты/лимиты для `/api/reviews`.
- Максимальный допустимый размер `diff` и политика усечения.
- Требуемая структура ответа (достаточно ли одного поля `comment`).
- Политика таймаутов и ретраев при вызове LLM.
- Минимальная поддерживаемая версия Python.

## Как использовали AI

- Для чего: Выделить факты из диффа, собрать Context Pack, зафиксировать риски и сценарии использования.
- Тип промпта: сначала zero-shot (P1-01), затем master prompt (P1-02) по разделу «Master Prompt v1».
- Строка в [`prompts.md`](prompts.md): P1-01, P1-02.
- Что проверили и исправили сами: Сопоставление каждого утверждения со строками диффа (app/api.py +35–38; app/review_service.py +19–22), исключены неподтверждённые допущения.
