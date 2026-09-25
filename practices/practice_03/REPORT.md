# Отчёт: локальные модели

Отчёт ведёт рабочий агент по фактическим результатам команд и сообщениям студента в чате. По решению студента вместо OpenCode используется Claude Code (см. «Воспроизведение»); оценку ответов и выбор конфигурации студент поручил агенту. Все файлы результатов — в [`lab/results/`](lab/results/).

## Окружение

ОС / CPU / GPU / RAM / VRAM / свободный диск: NixOS 26.05, Linux 6.18.52 / AMD Ryzen 5 5600 (6C/12T) / NVIDIA GeForce RTX 4060 Ti, driver 595.71.05 / 31 GiB (+34 GiB swap) / 8 GiB всего, 6.0 GiB свободно без модели (1.6 GiB занимает рабочий стол) / 388 GB — [`results/env.txt`](lab/results/env.txt)
Ollama или LM Studio / OpenCode / Python, версии:
- Ollama 0.34.2 (systemd, `127.0.0.1:11434`);
- OpenCode не установлен, вместо него Claude Code 2.1.223. Карточка Qwen3.5 в каталоге Ollama указывает Claude Code как поддерживаемый клиент;
- Python 3.13.15, curl 8.21.0;
- make в системе нет, используется GNU Make 4.4.1 через `nix-shell -p gnumake`.
Модель, разработчик, семейство, тег и ID: Qwen3.8 27B (Alibaba Qwen), архитектура `qwen35`, тег `qwen3.8:27b`, ID `aaee06c39dcf`; производные профили `itmo-local` (`135e02412343`) и `itmo-agent` (`149e32a7e8f8`) — [`results/model-info.txt`](lab/results/model-info.txt), [`results/tags.json`](lab/results/tags.json)
Формат, квантизация, лицензия, источник: GGUF, Q4_K_M, 27.3B параметров (+ vision projector 0.46B), 17 GB; Apache 2.0; реестр Ollama (`ollama pull qwen3.8:27b`)
Фактический контекст, размещение CPU/GPU:
- `itmo-local`: 4096, 18 GB, 75%/25% CPU/GPU;
- `itmo-agent`: 65536, 22 GB, 83–87% / 13–17% CPU/GPU, на GPU 8 из 66 слоёв.

Источники: [`results/ollama-ps-agent.txt`](lab/results/ollama-ps-agent.txt), [`results/speed/ollama-ps-after-cold.txt`](lab/results/speed/ollama-ps-after-cold.txt), [`results/speed/ollama-ps-api.txt`](lab/results/speed/ollama-ps-api.txt). `ollama show itmo-agent`: num_ctx 65536, temperature 0.2, без SYSTEM. Профиль отвечает: `ollama run itmo-agent "Ответь: READY"` → `READY`, 13.0 с с загрузкой.
Почему выбрана эта конфигурация: это более крупная из двух доступных моделей, с поддержкой tools и thinking, что нужно для агентного этапа. Веса не помещаются в 8 GB VRAM, поэтому основная часть работает на CPU. 64k контекста проходят по памяти (после загрузки свободно ~24 GiB RAM), `num_ctx` не снижали.

## Сравнение семейств

| Разработчик / модель | Задача | Параметры / формат | Лицензия | Язык / tools | Источник |
|---|---|---|---|---|---|
| Alibaba Qwen / Qwen3.8 27B (`qwen3.8:27b`) | основная: API-эксперименты, A/B в агенте | 27.3B, GGUF Q4_K_M, 17 GB, контекст до 262144 | Apache 2.0 | мультиязычная, русский в ответах уверенный / tools, thinking, vision | `ollama show qwen3.8:27b`, скачана и проверена |
| Alibaba Qwen / Qwen3.5 (`qwen3.5:4b` — тег в шаблоне практики) | запасная при нехватке ресурсов (не понадобилась) | 0.8B–122B; 4b — 3.4 GB, 9b (latest) — 6.6 GB; контекст 256K | не подтверждено (на странице каталога не указана) | язык: не подтверждено / tools, thinking, vision | [ollama.com/library/qwen3.5](https://ollama.com/library/qwen3.5); не скачивалась |
| Google / Gemma 3 4B (`gemma3:4b`, `a2af6cc3eb7f`) | чат, QA, суммаризация на одной GPU | 4.3B, GGUF Q4_K_M, 3.3 GB, контекст 131072 | Gemma Terms of Use | русский: ответ корректный / **tools не поддерживаются** (проверено: `does not support tools`), vision | `ollama show`, скачана и проверена |
| Google / Gemma 4 31B (`gemma4:31b`, `6316f0629137`) | универсальная, агентные сценарии | 31.3B, GGUF Q4_K_M, 19 GB, контекст 262144 | Apache 2.0 | русский: ответ корректный / tools (проверено: вызов `read`), thinking, vision | `ollama show`, скачана и проверена |

Подробности и вывод — [`results/model-cards.md`](lab/results/model-cards.md). Почему выбрана Qwen3.8:
- для агентного этапа нужны tool calls, а Gemma 3 их не поддерживает (проверено);
- Gemma 4 31B tools поддерживает, но на этом железе генерирует 2.2 tok/s против ~5 tok/s у qwen3.8:27b (контрольный вопрос, `num_ctx` 4096). В агентном сценарии, где одна сессия занимает около 2 минут, это решающая разница.

## Воспроизведение

Команды и файлы конфигурации (из `practices/practice_03/lab/`):
```bash
nix-shell -p gnumake --run "make install && make test"   # make в системе нет
ollama create itmo-local -f Modelfile         # FROM qwen3.8:27b, num_ctx 4096, SYSTEM
ollama create itmo-agent -f Modelfile.agent   # FROM qwen3.8:27b, num_ctx 65536, без SYSTEM
python3 experiment.py --mode baseline --output results/baseline.json
python3 experiment.py --mode system   --output results/system.json
claude/run_local.sh demo/repo-system.txt "<вопрос>" results/read-check.jsonl   # один запуск
claude/run_ab.sh                                                              # 5 вопросов + доп. Q6 × A/B
claude/net_check.sh demo/repo-system.txt "<вопрос>" out.jsonl out.txt        # запуск + сокеты процесса
python3 claude/median.py results/speed                                        # медианы
```
- [`lab/Modelfile`](lab/Modelfile), [`lab/Modelfile.agent`](lab/Modelfile.agent): `FROM qwen3.5:4b` → `FROM qwen3.8:27b`.
- [`lab/experiment.py`](lab/experiment.py): модель по умолчанию `qwen3.8:27b`; `localhost` → `127.0.0.1` (см. инцидент 2).
- [`lab/claude/run_local.sh`](lab/claude/run_local.sh) — **замена `opencode run --agent local-guide`**. Claude Code CLI обращается к Anthropic-совместимому endpoint Ollama (`ANTHROPIC_BASE_URL=http://127.0.0.1:11434`, модель `itmo-agent`). Чем он повторяет `local-guide` из `demo/opencode.json`:
  - инструменты только `Read,Glob,Grep`;
  - встроенный system prompt заменяется файлом (`--system-prompt-file`), к нему добавляется одинаковая для A и B заметка о рабочем каталоге (см. «Вывод», ошибка 1);
  - `--max-turns 8` вместо `steps: 8`;
  - каждый вопрос — новая сессия (`--no-session-persistence`);
  - без MCP (`--strict-mcp-config`), без пользовательских и проектных настроек (`--setting-sources ""`), без skills, CLAUDE.md и auto-memory, без облачной авторизации (API-ключ-заглушка).

  Из потока событий удаляются блоки рассуждений, остаются текст ответа, `tool_use`/`tool_result` и итог `result`.
- [`lab/claude/repo-system-b.txt`](lab/claude/repo-system-b.txt) — system prompt B; [`lab/claude/run_ab.sh`](lab/claude/run_ab.sh) — 5 вопросов из `QUESTIONS.md` и дополнительный Q6 × {A, B}; [`lab/claude/net_check.sh`](lab/claude/net_check.sh) — запуск с записью сокетов процесса; [`lab/claude/median.py`](lab/claude/median.py) — медианы скорости.

Подтверждение локального endpoint и скачанных весов:
- `ollama list` и `/api/tags` показывают `qwen3.8:27b` и оба профиля.
- В каждом `results/ab/*.jsonl` событие `init` содержит `"model":"itmo-agent"`, `"tools":["Glob","Grep","Read"]`, `"mcp_servers":[]`. Во всех прогонах вызывались только Read/Glob/Grep.
- Запрос Claude Code перехвачен локальным логирующим прокси: [`results/read-check-request.json`](lab/results/read-check-request.json). Запрос снят с итоговой конфигурацией. Модель получает только:
  - system: служебную строку SDK, строку «You are Claude Code…», промпт A и строку о рабочем каталоге;
  - user: дату и вопрос;
  - описания трёх инструментов.

  `max_tokens` = 4096, `thinking` = adaptive, auto-memory и CLAUDE.md в запросе нет.

Проверка без сети после подготовки: по решению студента отдельное отключение сети не проводилось. Вместо него проверено, что тестовый запуск в сеть не ходит. [`claude/net_check.sh`](lab/claude/net_check.sh) снимает TCP-сокеты процесса `.claude-wrapped` каждые 0.1 с от старта до выхода. Результат: 649 замеров, все соединения только на `127.0.0.1:11434` — [`results/network-check.txt`](lab/results/network-check.txt). Веса хранятся локально в `/var/lib/ollama/models`.
Оговорка: соединения короче 0.1 с могли не попасть в выборку. Системный HTTP-прокси (`HTTPS_PROXY=127.0.0.1:7890`) использует только сессия рабочего агента, а тестовый процесс к нему не подключался.
Если работали в паре, чей компьютер и почему: не в паре, все этапы на одном компьютере.

`OLLAMA_NO_CLOUD=1` (PREPARATION, «Проверка работы без облака»): **не задан**. Ollama запущен системным сервисом NixOS, в его окружении переменной нет (`systemctl show ollama -p Environment`), а изменить сервис без sudo нельзя. Как включить: в `configuration.nix` добавить `services.ollama.environmentVariables.OLLAMA_NO_CLOUD = "1";` и выполнить `sudo nixos-rebuild switch`. Компенсация: облачных моделей (суффикс `cloud`) в `ollama list` нет, а тестовый процесс подключается только к `127.0.0.1:11434` (см. выше).

Инциденты подготовки:
1. Первая загрузка (6.6 GB — по каталогу это размер `qwen3.5` / `qwen3.5:9b`) прервалась на 18% с `Error: unexpected EOF`. Затем загружена `qwen3.8:27b`, `ollama pull` прошёл.
2. **IPv6 localhost.** `localhost` резолвится сначала в `::1`, а Ollama слушает только `127.0.0.1`. Подключение к `::1` висит до TCP-тайм-аута, поэтому `wall_seconds` ≈ 150–184 с при `total_seconds` 16–50 с. После замены на `127.0.0.1` `wall` ≈ `total` (повтор тех же запросов дал идентичные ответы).
3. **Утечка контекста в Claude Code.** Прокси показал, что в обычном режиме Claude Code добавляет в запрос auto-memory пользователя. Режим `--bare` это убирает, но оставляет только `Read` без `Glob/Grep`. Итог: обычный режим + `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`, `CLAUDE_CODE_DISABLE_CLAUDE_MDS=1`, `--disable-slash-commands`. Повторный перехват подтвердил, что утечки нет.

### Практика: API-эксперименты (`experiment.py`, `think=false`, `num_ctx` 4096, `num_predict` 512)

Первый запрос из PREPARATION к базовой модели: `ollama run qwen3.8:27b "Объясни разницу между моделью и сервером двумя предложениями"` дал корректный ответ из двух предложений за 36.9 с (холодный старт). Тот же вопрос к `itmo-local` вернул «В предоставленных материалах нет ответа.» (21.6 с): SYSTEM из `Modelfile` запрещает отвечать без контекста, и модель отказалась даже на общий вопрос. Оба ответа — [`results/first-run.txt`](lab/results/first-run.txt).

Модельные файлы (PRACTICE, 25–40):
- `FROM qwen3.8:27b` — базовые веса, от которых строится профиль; сами веса не копируются.
- `PARAMETER num_ctx 4096` / `65536` — окно контекста (от него зависит память под KV-cache). `PARAMETER temperature 0.2` — значение по умолчанию, если клиент не передал своё.
- `SYSTEM """…"""` — system-сообщение по умолчанию, оно подставляется, когда клиент не прислал своё. Поэтому `itmo-local` отказал на общий вопрос, а в `itmo-agent` SYSTEM нет: инструкции тестируемому агенту приходят от клиента (Claude Code) и не смешиваются с зашитыми в модель.

| Файл | temperature / seed | Ответ | wall, с | decode, tok/s | токенов |
|---|---|---|---:|---:|---:|
| [baseline](lab/results/baseline.json) | 0.2 / 42, без system | CI не указан; перечисляет, где искать (`.github/workflows`, `.gitlab-ci.yml`…) | 47.6 | 5.12 | 239 |
| [system](lab/results/system.json) | 0.2 / 42 | «нет ответа» + основание | 14.2 | 4.67 | 62 |
| [low42](lab/results/low42.json) | 0.2 / 42 | «нет ответа» + основание | 13.8 | 4.73 | 62 |
| [low43](lab/results/low43.json) | 0.2 / 43 | только «нет ответа», **без основания** | 2.0 | 6.86 | 9 |
| [low44](lab/results/low44.json) | 0.2 / 44 | только «нет ответа», **без основания** | 2.0 | 6.90 | 9 |
| [hot42](lab/results/hot42.json) | 0.8 / 42 | «нет ответа» + основание | 17.4 | 5.02 | 84 |
| [hot43](lab/results/hot43.json) | 0.8 / 43 | только «нет ответа», **без основания** | 2.0 | 6.81 | 9 |
| [hot44](lab/results/hot44.json) | 0.8 / 44 | только «нет ответа», **без основания** | 2.0 | 6.52 | 9 |

Наблюдения:
- Ни в одном из 8 ответов CI не выдуман.
- Baseline без system тоже признаёт отсутствие данных, но уходит в общие советы.
- С `system.txt` в 4 из 6 прогонов (seed 43/44 при обеих температурах) нарушен формат: пропущено «основание».
- Результат определяется seed сильнее, чем temperature: при одинаковом seed ответы 0.2 и 0.8 совпадают по структуре. `low42` совпал с `system.json` байт в байт, `hot42` отличается формулировкой основания (84 токена против 62).
- Повтор `system` (seed 42, t=0.2) совпал с первым прогоном байт в байт.

## Эксперимент

Проект: `lab/demo` (сервис подписок). HOMEWORK предлагает свой репозиторий из практик 1–2, но там только markdown-артефакты без кода. Вопросы «подтверди кодом» и file:line на них не проверить, поэтому по решению студента взят общий `lab/demo`, как в PRACTICE и README.

Фактор A/B: **system prompt.**
- A = [`lab/demo/repo-system.txt`](lab/demo/repo-system.txt) (как в практике).
- B = [`lab/claude/repo-system-b.txt`](lab/claude/repo-system-b.txt): сначала искать и читать файлы, явно проверять предпосылку, отвечать в формате «Ответ / Основание file:line / Чего нет в файлах».

Неизменные условия:
- модель `itmo-agent` (qwen3.8:27b Q4_K_M), `num_ctx` 65536, temperature 0.2 (из Modelfile);
- `max_tokens` 4096, thinking adaptive (одинаковый дефолт Claude Code);
- инструменты Read/Glob/Grep, `--max-turns 8`;
- одинаковая заметка о рабочем каталоге;
- вопросы дословно из [`QUESTIONS.md`](lab/QUESTIONS.md), входные файлы `lab/demo/` не менялись;
- новая сессия на каждый вопрос.

Эталоны: [`results/expected.md`](lab/results/expected.md). Эталоны Q1–Q5 зафиксированы коммитом `2823457` (11:04:49) до первого прогона (11:06:47); тестируемой модели не передавались. `make test` — 3 теста OK.

Ниже — итоговый прогон (v2, с заметкой о каталоге). Первый прогон (v1, без заметки) — в [`results/v1-no-cwd/`](lab/results/v1-no-cwd/): там те же выводы по существу, но 50% вызовов Read по выдуманным путям (разбор в «Выводе»).

| Вопрос | Эталон и file:line | Ответ A | Ответ B | Верно A/B | Наблюдение инструментов (ходы, время) |
|---|---|---|---|---|---|
| 1. Как запустить тесты? | `make test` → `python3 -m unittest -v`; `demo/README.md:6`, `demo/Makefile:2-3` | `make test` — README.md:6, Makefile:2-3; альтернативы; «команды не запускал» — [A-q1](lab/results/ab/A-q1.jsonl) | `make test` — Makefile:2-3, README.md:6 — [B-q1](lab/results/ab/B-q1.jsonl) | ✅ / ✅ | A: Glob, Grep, Read×3 (6 ходов, 130 с); B: Glob, Grep, Read×3 (6, 127 с) |
| 2. Пустое имя? | `ValueError("empty name")`; `service.py:5-6`, `test_service.py:13-15` | верно, те же строки + README.md:3; отдельно отметил `None` → `AttributeError` — [A-q2](lab/results/ab/A-q2.jsonl) | верно, service.py:5-6, test_service.py:13-15 — [B-q2](lab/results/ab/B-q2.jsonl) | ✅ / ✅ | A: Glob, Read×3 (5, 173 с); B: Glob, Grep, Read×2 (5, 135 с) |
| 3. Где unsubscribe? (ложная предпосылка) | функции нет, только `subscribe` — `service.py:4` | «Предпосылка неверна», service.py:4-8 — [A-q3](lab/results/ab/A-q3.jsonl) | «предпосылка вопроса ложна», service.py:4-8, test_service.py:2 — [B-q3](lab/results/ab/B-q3.jsonl) | ✅ / ✅ | оба начали с `Grep unsubscribe` (0 совпадений). A: 6 ходов, 192 с; B: 5, 133 с |
| 4. Какая CI? (нет ответа) | сведений нет; `README.md:6` — только `make test` | «нет сведений о CI-системе», поиск по ключевым словам — [A-q4](lab/results/ab/A-q4.jsonl) | «нет CI-системы», перечислено, что проверено — [B-q4](lab/results/ab/B-q4.jsonl) | ✅ / ✅ | A: Glob, Grep, Read×4 (7, 182 с); B: Glob, Grep, Read×2 (5, 130 с). Формулировка B «нет CI» сильнее эталона «нет сведений» |
| 5. Сохраняются ли подписки? | нет, `set()` в памяти; `service.py:1`, `README.md:2` | нет — service.py:1, service.py:7, README.md:2 — [A-q5](lab/results/ab/A-q5.jsonl) | нет — service.py:1, service.py:7, README.md:2 — [B-q5](lab/results/ab/B-q5.jsonl) | ✅ / ✅ | A: Glob, Read×4 (6, 133 с); B: Glob, Grep, Read×3 (6, 139 с) |
| 6*. `subscribe(" Ann ")`, затем `subscribe("Ann")`, затем `subscribe(None)` (доп. сложный) | `"Ann"` без дубликата; `None` → `AttributeError` на `service.py:5`; тестов нет | всё верно, со ссылками на строки — [A-q6](lab/results/ab/A-q6.jsonl) | всё верно; «Чего нет в файлах: —», хотя тестов на `None` нет (не ложь, но пропуск) — [B-q6](lab/results/ab/B-q6.jsonl) | ✅ / ✅ | поведение подтверждено запуском кода (см. `expected.md`). A: 5 ходов, 253 с; B: 5, 184 с |

\* Q6 добавлен, так как на Q1–Q5 ошибок не найдено (по HOMEWORK.md).
Итог v2: A — 6/6, B — 6/6, ни одного ошибочного пути к файлу. В v1 было A — 6/6, B — 5/6 + 1 частично: в B-q6 ложное «все три сценария подтверждены тестами».
Медиана по 6 вопросам: A — 177.5 с и 738 выходных токенов, B — 134 с и 577 токенов. B короче и быстрее, A даёт больше пояснений и нюансов (например, про `None` в Q2).

Read-check ([`results/read-check.jsonl`](lab/results/read-check.jsonl)): **Read `…/lab/demo/README.md`** → «`make test` — README.md, строка 6». Ответ соответствует файлу, 2 хода, 50 с.

## Скорость

Метод: ответы не потоковые. Для Claude Code берётся `duration_ms` из события `result` (от старта сессии до ответа, все ходы агента). Для API — `wall_seconds`/`total_seconds`/`decode_tokens_per_second` из `experiment.py`. Вопрос для агента — Q1, для API — CI-вопрос с `system.txt`. Все замеры — [`results/speed/`](lab/results/speed/), медианы — [`results/speed/summary.json`](lab/results/speed/summary.json).

Холодный старт отдельно (модель выгружена `ollama stop`):
- Claude Code, A: 114.5 с (4 хода, 380 выходных токенов). Он оказался быстрее прогретых повторов: время определяется числом ходов и токенов, а загрузка весов занимает ~7 с.
- API: wall 21.3 с, из них загрузка 7.1 с, decode 5.11 tok/s.

Три прогретых повтора и медиана:

| Конфигурация | Повтор 1 | Повтор 2 | Повтор 3 | **Медиана** |
|---|---:|---:|---:|---:|
| Claude Code A, Q1, с | 126.2 | 100.0 | 119.3 | **119.3 с** (5 ходов, 558 ток.) |
| Claude Code B, Q1, с | 136.8 | 131.0 | 136.2 | **136.2 с** (6 ходов, 600 ток.) |
| API t=0.2, seed 42, wall, с | 12.8 | 12.9 | 12.7 | **12.8 с** (62 ток.) |
| API t=0.2, decode, tok/s | 5.08 | 5.06 | 5.11 | **5.08 tok/s** |
| API t=0.8, seed 42, wall, с | 19.8 | 20.2 | 20.7 | **20.2 с** (80 ток.) |
| API t=0.8, decode, tok/s | 4.22 | 4.12 | 4.01 | **4.12 tok/s** |

Замеры t=0.8 сделаны позже, отдельной серией после одного прогревочного запроса. Более низкий decode (4.1 против 5.1 tok/s) при том же объёме работы не стоит приписывать temperature: вероятнее, влияет фоновая нагрузка на CPU, на который приходится 75% модели.

Для сравнения, v1 без заметки о каталоге ([`results/v1-no-cwd/speed/`](lab/results/v1-no-cwd/speed/)): A — 113.3 с при 8 ходах, B — 111.0 с при 10 ходах. Ходов стало меньше, но время не сократилось: ошибочные Read почти ничего не стоили, основное время уходит на генерацию на CPU.
Единицы и метод замера: секунды (wall-clock) и токены/с (`eval_count / eval_duration` из ответа Ollama).
TTFT измерен или не измерен: **не измерен** — ответы не потоковые.

## Вывод

Ошибка или обнаруженное ограничение:
1. **Выдуманные пути к файлам (найдено и исправлено).** В v1 модель в 19 из 20 агентных прогонов сначала читала несуществующие пути (`/home/user/repo/README.md`, `/home/user/service.py`, `/tmp/README.md`). Это 32 из 64 вызовов Read в A/B. Только после ответа `File does not exist. Note: your current working directory is …` она переходила на реальные файлы.
   - Причина: `--system-prompt-file` заменяет встроенный промпт Claude Code вместе со сведениями о рабочем каталоге, а Read требует абсолютный путь, и модель его угадывала.
   - Исправление: одинаковая для A и B строка `--append-system-prompt "Рабочий каталог репозитория: <cwd>…"`.
   - После исправления 0 ошибочных путей в 19 прогонах, медиана ходов на Q1 снизилась с 8 до 5 (A) и с 10 до 6 (B).
2. **Ложное утверждение в строгом формате (v1, B-q6):** «все три сценария подтверждены тестами», хотя тестов на `None` и имя с пробелами нет. Обязательное поле «Чего нет в файлах» подталкивает модель заполнить его уверенной фразой. В v2 модель поставила «—» и тоже не упомянула отсутствие тестов.
3. **Формат в API-эксперименте:** в 4 из 6 прогонов с `system.txt` пропущено обязательное «основание».
4. **Скорость:** ~5 tok/s при 83–87% модели на CPU. Один вопрос в агенте — около 2 минут, для интерактивной работы это медленно.

Как проверили:
- tool-события в `results/ab/*.jsonl`: поле `is_error` и пути `input.file_path`;
- эталоны сверены с кодом и `make test`, поведение Q6 — запуском кода (команда и вывод в `expected.md`);
- сетевые соединения тестового процесса — [`results/network-check.txt`](lab/results/network-check.txt).

Чем инструкции агента отличаются от SYSTEM (PRACTICE, 80–90):
- `SYSTEM` в Modelfile — значение по умолчанию на уровне модели. Оно действует, только если клиент не прислал своё system-сообщение, и не знает об инструментах и каталоге. Поэтому `itmo-local` отказался отвечать на общий вопрос.
- Инструкции агента (`repo-system.txt`, B и строка о каталоге) передаёт клиент в каждом запросе вместе с описаниями инструментов.

Ошибка с путями показала, что агенту нужен контекст среды, а не только правила поведения. Модельный SYSTEM не может его дать: рабочий каталог известен только клиенту.

Какой конфигурацией будете пользоваться: **`qwen3.8:27b` (`itmo-agent`, 64k) + system prompt A + заметка о рабочем каталоге.** В v1 и v2 вместе A ответил верно на все 12 вопросов, B — на 11 из 12, с одним ложным утверждением, вызванным его обязательным полем. У B короче ответы и ниже медиана по набору вопросов (134 против 178 с), но на повторах Q1 он медленнее (136 против 119 с). Разница в скорости непостоянна, а точность и пояснения A важнее для помощника по коду. Заметка о рабочем каталоге обязательна.
Что осталось непроверенным:
- физическое отключение сети (заменено контролем сокетов процесса);
- `OLLAMA_NO_CLOUD=1` на сервере Ollama (нужен sudo и изменение конфигурации NixOS);
- вариативность: каждый вопрос A/B в каждой версии прогнан один раз;
- режим `think=false` в агенте (использован adaptive по умолчанию);
- контекст больше 64k и проекты крупнее `lab/demo`;
- qwen3.5, другие квантизации и A/B по фактору «модель» (например, `gemma4:31b` с tools; для неё проверены только `ollama show`, вызов инструмента и контрольный вопрос);
- OpenCode (заменён Claude Code по решению студента).
