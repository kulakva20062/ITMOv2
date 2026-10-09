# Карточки моделей (сравнение разработчиков)

Сняты 2026-09-25 со страниц каталога Ollama и из `ollama show`. «Не подтверждено» — карточка этого не обещает. Ключевые строки проверочных запросов для Gemma — в конце файла.

## Qwen3.8 27B — Alibaba Qwen (используется)
- Источник: `ollama show qwen3.8:27b` ([model-info.txt](model-info.txt)), веса скачаны.
- Задача: универсальная chat/reasoning-модель, агентные сценарии.
- Параметры / формат: 27.3B (+ vision projector 0.46B), архитектура `qwen35`, GGUF Q4_K_M, 17 GB.
- Контекст: до 262144.
- Возможности (Capabilities в `ollama show`): completion, vision, tools, thinking.
- Лицензия: Apache 2.0 (блок License в `ollama show`).
- Русский язык: в карточке отдельно не указан — не подтверждено карточкой; проверено на практике (ответы на русском корректны).

## Qwen3.5 — Alibaba Qwen (запасная, не скачивалась)
- Источник: https://ollama.com/library/qwen3.5
- Задача: семейство мультимодальных моделей (текст, изображение), агенты, код.
- Размеры: 0.8b 1.0 GB, 2b 2.7 GB, 4b 3.4 GB, 9b (= latest) 6.6 GB, 27b 17 GB, 35b 24 GB, 122b 81 GB; контекст 256K.
- Метки в каталоге: vision, tools, thinking. В разделе Applications указаны Claude Code (`ollama launch claude --model qwen3.5`) и OpenCode.
- Лицензия: на странице каталога не указана — не подтверждено (для производной qwen3.8 `ollama show` указывает Apache 2.0).
- Русский язык: не подтверждено карточкой.

## Gemma 3 4B — Google (скачана, проверена)
- Источники: https://ollama.com/library/gemma3, `ollama show gemma3:4b`, проверочные запросы к `/api/chat` (think=false, num_ctx 4096, t=0.2, seed 42).
- Задача: «most capable model that runs on a single GPU» — QA, суммаризация, рассуждения; мультимодальная с 4B.
- Параметры / формат: 4.3B, `gemma3`, GGUF Q4_K_M, 3.3 GB, ID `a2af6cc3eb7f`; контекст 131072. Семейство: 270m / 1b (32K), 4b / 12b / 27b (128K), есть QAT.
- Capabilities: completion, vision. **Tools нет** — подтверждено: запрос с инструментом → `does not support tools`.
- Лицензия: **Gemma Terms of Use** (`ollama show`), не Apache.
- Русский: ответ на контрольный вопрос корректный (карточка заявляет 140+ языков).
- Ресурсы: 2.9 GB, 100% GPU, 82 tok/s — на 8 GB VRAM работает целиком на видеокарте.

## Gemma 4 31B — Google (скачана, проверена)
- Источник: `ollama show gemma4:31b`, те же проверочные запросы.
- Параметры / формат: 31.3B, `gemma4`, GGUF Q4_K_M, 19 GB, ID `6316f0629137`; контекст 262144; требует Ollama 0.20+.
- Capabilities: completion, vision, tools, thinking. Tool calling подтверждён: вернул `read(file_path="README.md")`.
- Лицензия: **Apache 2.0** (`ollama show`).
- Русский: ответ на контрольный вопрос корректный.
- Ресурсы: 21 GB, 81%/19% CPU/GPU, 2.2 tok/s — вдвое медленнее qwen3.8:27b (~5 tok/s) на этом железе.

## Вывод для выбора
- Для агентного этапа нужны tool calls. Gemma 3 их не поддерживает (проверено), поэтому годится только для чата без инструментов. Зато 4B быстрая: 82 tok/s целиком на GPU.
- Gemma 4 31B поддерживает tools и распространяется под Apache 2.0, но на этом железе в 2.3 раза медленнее qwen3.8:27b (2.2 против ~5 tok/s): у неё больше параметров, и 81% модели работает на CPU.
- Итог: qwen3.8:27b — лучший компромисс для агентного этапа. Gemma 4 31B — кандидат для A/B по фактору «модель», если скорость не важна (не проверялось).

## Замеры Gemma (2026-09-25)
`/api/chat`, think=false, num_ctx 4096, t=0.2, seed 42.

Tool calling, запрос с инструментом `read` («Прочитай README.md»):
```
gemma3:4b  -> {"error":"registry.ollama.ai/library/gemma3:4b does not support tools","tool_calls":null,"content":""}
gemma4:31b -> {"error":null,"tool_calls":[{"id":"call_bw5rnlfc","function":{"index":0,"name":"read","arguments":{"file_path":"README.md"}}}],"content":""}
```

Контрольный вопрос «Объясни разницу между моделью и сервером двумя предложениями» и `ollama ps` после ответа:
```
== gemma3:4b: total 11.1 s, load 10.3 s, 63 tok, 82.43 tok/s
gemma3:4b    a2af6cc3eb7f    2.9 GB    100% GPU     4096       4 minutes from now
== gemma4:31b: total 46 s, load 14.3 s, 62 tok, 2.21 tok/s
gemma4:31b    6316f0629137    21 GB    81%/19% CPU/GPU    4096       4 minutes from now
```
