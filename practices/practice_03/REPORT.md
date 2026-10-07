# Отчёт: локальные модели

Отчёт ведёт рабочий агент по фактическим результатам команд и сообщениям студента в чате. Основные прогоны (A/B, скорость) сделаны через Claude Code по решению студента (см. «Воспроизведение»); после установки OpenCode вопросы Q1–Q5 повторно прогнаны через `opencode run --agent local-guide` (см. «Прогон через OpenCode»). Сырые результаты — в [`lab/results/`](lab/results/). Факты, для которых вывод команды в репозитории не сохранён, помечены «(вывод не сохранён)».

## Окружение

ОС / CPU / GPU / RAM / VRAM / свободный диск: NixOS 26.05, Linux 6.18.52 / AMD Ryzen 5 5600 (6C/12T) / NVIDIA GeForce RTX 4060 Ti, driver 595.71.05 / 31 GiB (+34 GiB swap) / 8 GiB всего, 6.0 GiB свободно без модели (1.6 GiB занимает рабочий стол) / 388 GB — [`results/env.txt`](lab/results/env.txt)
Ollama или LM Studio / OpenCode / Python, версии:
- Ollama 0.34.2, системный сервис NixOS на `127.0.0.1:11434`;
- Claude Code 2.1.223 — основные прогоны; OpenCode 1.15.10 установлен позже, после A/B и замеров скорости, — повторный прогон Q1–Q5;
- Python 3.13.15, curl 8.21.0, git 2.54.0;
- make в системе нет, используется GNU Make 4.4.1 через `nix-shell -p gnumake`.

Модель, разработчик, семейство, тег и ID: Qwen3.8 27B (Alibaba Qwen), архитектура `qwen35`, тег `qwen3.8:27b`, ID `aaee06c39dcf` — [`results/model-info.txt`](lab/results/model-info.txt), [`results/tags.json`](lab/results/tags.json). Производные профили: `itmo-local` (`135e02412343`, есть в `tags.json`) и `itmo-agent` (`149e32a7e8f8`, ID из `ollama ps`).
Формат, квантизация, лицензия, источник: GGUF, Q4_K_M, 27.3B параметров (+ vision projector 0.46B), 17 GB; Apache 2.0; реестр Ollama (`ollama pull qwen3.8:27b`).
Фактический контекст, размещение CPU/GPU:
- `qwen3.8:27b` через API (`experiment.py` передаёт `num_ctx` 4096): 18 GB, 75%/25% CPU/GPU — [`results/speed/ollama-ps-api.txt`](lab/results/speed/ollama-ps-api.txt);
- `itmo-agent` (`num_ctx` 65536): 22 GB, 83–87% / 13–17% CPU/GPU — [`results/speed/ollama-ps-after-cold.txt`](lab/results/speed/ollama-ps-after-cold.txt) (84%/16%) и `ollama ps` при первом запуске агента (83%/17%); на GPU 8 из 66 слоёв — журнал Ollama при загрузке: `load_tensors: offloaded 8/66 layers to GPU` (output layer + 7 repeating layers).

Почему выбрана эта конфигурация: для агентного этапа нужна модель с tools. Из скачанных `gemma3:4b` tools не поддерживает, а `gemma4:31b` поддерживает, но на этом железе генерирует примерно вдвое медленнее `qwen3.8:27b` (см. «Сравнение семейств»). Веса `qwen3.8:27b` не помещаются в 8 GB VRAM, поэтому основная часть модели работает на CPU. Контекст 64k помещается в RAM, `num_ctx` не снижали.

## Сравнение семейств

| Разработчик / модель | Задача | Параметры / формат | Лицензия | Язык / tools | Источник |
|---|---|---|---|---|---|
| Alibaba Qwen / Qwen3.8 27B (`qwen3.8:27b`) | основная: API-эксперименты и A/B в агенте | 27.3B, GGUF Q4_K_M, 17 GB, контекст до 262144 | Apache 2.0 | русский: ответы корректны / tools, thinking, vision | `ollama show` ([`model-info.txt`](lab/results/model-info.txt)), скачана |
| Alibaba Qwen / Qwen3.5 (`qwen3.5:4b`, тег шаблона практики) | запасная, не понадобилась | 0.8B–122B; 4b — 3.4 GB; контекст 256K | на странице каталога не указана | русский: не подтверждено / tools, thinking, vision | [ollama.com/library/qwen3.5](https://ollama.com/library/qwen3.5); на момент экспериментов не скачивалась, `qwen3.5:4b` и `qwen3.5:9b` скачаны позже и в экспериментах не участвовали |
| Google / Gemma 3 4B (`gemma3:4b`, `a2af6cc3eb7f`) | чат, QA, суммаризация на одной GPU | 4.3B, GGUF Q4_K_M, 3.3 GB, контекст 131072 | Gemma Terms of Use | русский: ответ корректный / **tools нет**: запрос с инструментом → `does not support tools` | `ollama show`, скачана — [`results/model-cards.md`](lab/results/model-cards.md) |
| Google / Gemma 4 31B (`gemma4:31b`, `6316f0629137` на момент замеров; сейчас тег перекачан, ID `17ba34c06c80`) | универсальная, агентные сценарии | 31.3B, GGUF Q4_K_M, 19 GB, контекст 262144 | Apache 2.0 | русский: ответ корректный / tools (вернула вызов `read`), thinking, vision | `ollama show`, скачана — [`results/model-cards.md`](lab/results/model-cards.md) |

Подробности — [`results/model-cards.md`](lab/results/model-cards.md). На контрольном вопросе (`num_ctx` 4096) `gemma3:4b` — 82 tok/s целиком на GPU, `gemma4:31b` — 2.2 tok/s при 81% на CPU, `qwen3.8:27b` — около 5 tok/s; строки замеров — в конце `model-cards.md`.

## Воспроизведение

Команды и файлы конфигурации. Зависимости: Ollama, Claude Code CLI, OpenCode, Python 3.10+, `jq`, GNU coreutils (`realpath -m`), `ss` (iproute2). Команды выполняются из `practices/practice_03/lab/`:
```bash
nix-shell -p gnumake --run "make install && make test"   # make в системе нет
ollama pull qwen3.8:27b
ollama create itmo-local -f Modelfile         # FROM qwen3.8:27b, num_ctx 4096, SYSTEM
ollama create itmo-agent -f Modelfile.agent   # FROM qwen3.8:27b, num_ctx 65536, без SYSTEM

# первый запрос (PREPARATION) → results/first-run.txt
ollama run qwen3.8:27b --think=false --nowordwrap "Объясни разницу между моделью и сервером двумя предложениями"
ollama run itmo-local --think=false "Объясни разницу между моделью и сервером двумя предложениями"

# API-эксперименты (experiment.py)
python3 experiment.py --mode baseline --output results/baseline.json
python3 experiment.py --mode system   --output results/system.json
for s in 42 43 44; do python3 experiment.py --mode system --temperature 0.8 --seed $s --output results/hot$s.json; done
for s in 42 43 44; do python3 experiment.py --mode system --temperature 0.2 --seed $s --output results/low$s.json; done

# агент: проверка чтения, A/B, сеть
claude/run_local.sh demo/repo-system.txt "Прочитай README.md инструментом Read. Назови команду тестирования со ссылкой на файл" results/read-check.jsonl
claude/run_ab.sh                               # Q1–Q5 из QUESTIONS.md + доп. Q6, A и B → results/ab/
Q1="Как запустить тесты? Укажи файл-источник."
claude/net_check.sh demo/repo-system.txt "$Q1" /tmp/net.jsonl results/network-check.txt

# OpenCode: Q1–Q5, агент local-guide → results/opencode/
i=1; grep -E '^[1-5]\. ' QUESTIONS.md | while IFS= read -r q; do opencode/run_opencode.sh "$q" results/opencode/q$i.jsonl; i=$((i+1)); done

# скорость (в таком порядке и выполнялось: API — до A/B, агент — после)
ollama stop qwen3.8:27b; ollama stop itmo-agent   # перед холодным стартом `ollama ps` пуст
python3 experiment.py --mode system --output results/speed/api-cold.json
for i in 1 2 3; do python3 experiment.py --mode system --output results/speed/api-warm$i.json; done
ollama stop qwen3.8:27b; ollama stop itmo-agent
claude/run_local.sh demo/repo-system.txt "$Q1" results/speed/cold-A.jsonl
for i in 1 2 3; do claude/run_local.sh demo/repo-system.txt "$Q1" results/speed/A-warm$i.jsonl; done
for i in 1 2 3; do claude/run_local.sh claude/repo-system-b.txt "$Q1" results/speed/B-warm$i.jsonl; done
python3 claude/median.py results/speed          # медианы → results/speed/summary.json
```
Файлы:
- [`lab/Modelfile`](lab/Modelfile), [`lab/Modelfile.agent`](lab/Modelfile.agent): `FROM qwen3.5:4b` → `FROM qwen3.8:27b`.
- [`lab/experiment.py`](lab/experiment.py): модель по умолчанию `qwen3.8:27b`; `localhost` → `127.0.0.1` (инцидент 2).
- [`lab/demo/opencode.json`](lab/demo/opencode.json): `baseURL` `http://localhost:11434/v1` → `http://127.0.0.1:11434/v1` по той же причине (инцидент 2), иначе OpenCode на этой машине тоже ждал бы таймаута на `::1`. Правка сделана после прогонов Claude Code; в них файл только читался моделью как файл каталога (ограничение 1). Позже, для прогона через OpenCode, в провайдер `ollama` добавлены все три модели практики (`itmo-agent`, `itmo-local`, `qwen3.8:27b`) и `"enabled_providers": ["ollama"]`, чтобы OpenCode не показывал модели других провайдеров.
- [`lab/claude/run_local.sh`](lab/claude/run_local.sh) — замена `opencode run --agent local-guide`. Claude Code обращается к Anthropic-совместимому endpoint Ollama (`ANTHROPIC_BASE_URL=http://127.0.0.1:11434`, модель `itmo-agent`) и повторяет `local-guide` из [`demo/opencode.json`](lab/demo/opencode.json):
  - инструменты только `Read,Glob,Grep`, `--max-turns 8` вместо `steps: 8`;
  - встроенный system prompt Claude Code заменяется файлом промпта (`--system-prompt-file`). Вместе со встроенным промптом пропадает строка, в которой клиент сообщает модели рабочий каталог, поэтому одинаковая для A и B заметка о каталоге добавляется через `--append-system-prompt`;
  - каждый вопрос — новая сессия (`--no-session-persistence`);
  - без MCP, пользовательских и проектных настроек, CLAUDE.md и auto-memory, без облачной авторизации (API-ключ-заглушка);
  - из потока событий удаляются блоки рассуждений; остаются текст ответа, `tool_use`/`tool_result`, `init` и итог `result`.
- [`lab/claude/repo-system-b.txt`](lab/claude/repo-system-b.txt) — system prompt B; A — [`lab/demo/repo-system.txt`](lab/demo/repo-system.txt).
- [`lab/opencode/run_opencode.sh`](lab/opencode/run_opencode.sh) — `opencode run --agent local-guide -m ollama/itmo-agent --format json` из `lab/demo`, новая сессия на вопрос.
- [`lab/claude/run_ab.sh`](lab/claude/run_ab.sh) — A/B; [`lab/claude/net_check.sh`](lab/claude/net_check.sh) — запуск с записью TCP-сокетов процесса; [`lab/claude/median.py`](lab/claude/median.py) — медианы.

Подтверждение локального endpoint и скачанных весов:
- [`results/tags.json`](lab/results/tags.json) (`/api/tags`) содержит `qwen3.8:27b` и `itmo-local`; `itmo-agent` загружен локальным сервером — [`results/speed/ollama-ps-after-cold.txt`](lab/results/speed/ollama-ps-after-cold.txt). Веса хранятся в `/var/lib/ollama/models` ([`model-info.txt`](lab/results/model-info.txt)).
- Во всех 20 агентных прогонах (`results/ab/`, `results/speed/`, `read-check.jsonl`) событие `init` одинаково: `"model":"itmo-agent"`, `"tools":["Glob","Grep","Read"]`, `"mcp_servers":[]`. Вызывались только Read/Glob/Grep, ни одного `is_error`.
- Вызов чтения: [`results/read-check.jsonl`](lab/results/read-check.jsonl) — Read `…/lab/demo/README.md`, ответ «`make test` — README.md, строка 6» соответствует файлу; 2 хода, 49.8 с.
- Запрос Claude Code перехвачен локальным логирующим прокси (подключался через `OLLAMA_URL=http://127.0.0.1:<порт> claude/run_local.sh …`; скрипт прокси был временным и не сохранён): [`results/read-check-request.json`](lab/results/read-check-request.json). В запросе: system — служебная строка SDK, строка «You are Claude Code…», промпт A и заметка о каталоге; user — дата и вопрос; три инструмента (в файле сохранены только их имена); `max_tokens` 4096, `thinking` adaptive, `temperature` не передаётся (действует 0.2 из Modelfile). Auto-memory и CLAUDE.md в запросе нет.

Проверка без сети после подготовки: по решению студента сеть физически не отключалась. Вместо этого [`claude/net_check.sh`](lab/claude/net_check.sh) каждые 0.1 с снимал TCP-сокеты тестового процесса `.claude-wrapped` от старта до выхода: за 127 с записано 649 наблюдений открытых соединений, все только на `127.0.0.1:11434` — [`results/network-check.txt`](lab/results/network-check.txt). Ограничения: соединения короче 0.1 с могли не попасть в выборку, UDP и DNS-запросы не отслеживались.
`OLLAMA_NO_CLOUD=1` не задан: Ollama запущен системным сервисом NixOS, изменить его без sudo нельзя. Как включить: `services.ollama.environmentVariables.OLLAMA_NO_CLOUD = "1";` в `configuration.nix` и `sudo nixos-rebuild switch`. Облачных моделей в `/api/tags` нет.
Если работали в паре, чей компьютер и почему: не в паре, все этапы на одном компьютере.
PR со ссылками на материалы: создаёт студент, ссылка добавляется после создания.

Инциденты подготовки (файлы-доказательства инцидентов 2 и 3 были сохранены в коммите `2823457` в `lab/results/incident-ipv6/` и `incident-bare/` и удалены в `ff1ee7d` как не требуемые заданием; вывод инцидента 1 не сохранялся):
1. Первая загрузка (6.6 GB — по каталогу это размер `qwen3.5` / `qwen3.5:9b`) прервалась на 18% с `Error: unexpected EOF`; затем загружена `qwen3.8:27b` (17.7 GB, `tags.json`), `ollama pull` прошёл.
2. **IPv6 localhost.** `localhost` сначала резолвится в `::1`, а Ollama слушает только `127.0.0.1`, поэтому `wall_seconds` был намного больше `total_seconds` (183.7 с против 49.8 с для baseline, 150.3 с против 15.8 с для system). После замены на `127.0.0.1` `wall` ≈ `total`.
3. **Утечка контекста в Claude Code.** Прокси показал, что в обычном режиме Claude Code добавляет в запрос auto-memory пользователя. Режим `--bare` её убирает, но оставляет только `Read` (в `init` прогона с `--bare` — `"tools":["Read"]`). Итог: обычный режим + `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`, `CLAUDE_CODE_DISABLE_CLAUDE_MDS=1`, `--disable-slash-commands`; повторный перехват ([`read-check-request.json`](lab/results/read-check-request.json)) утечки не показал.

### Практика: API-эксперименты (`experiment.py`, `think=false`, `num_ctx` 4096, `num_predict` 512)

Первый запрос: `qwen3.8:27b` дал корректный ответ из двух предложений за 36.9 с (холодный старт); `itmo-local` на тот же вопрос ответил «В предоставленных материалах нет ответа.» за 21.6 с — SYSTEM из `Modelfile` запрещает отвечать без контекста, и модель отказалась даже на общий вопрос — [`results/first-run.txt`](lab/results/first-run.txt).

Модельные файлы:
- `FROM qwen3.8:27b` — базовые веса профиля, сами веса не копируются.
- `PARAMETER num_ctx 4096` / `65536` — окно контекста, от него зависит память под KV-cache. `PARAMETER temperature 0.2` — значение по умолчанию, если клиент не передал своё.
- `SYSTEM """…"""` — system-сообщение по умолчанию, подставляется, когда клиент не прислал своё. В `itmo-agent` SYSTEM нет: инструкции агенту передаёт клиент.

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
- Ни в одном из 8 ответов CI не выдуман. Baseline без system тоже признаёт отсутствие данных, но уходит в общие советы.
- С `system.txt` в 4 из 6 прогонов (seed 43/44 при обеих температурах) пропущено обязательное «основание».
- Результат зависит от seed сильнее, чем от temperature: при одинаковом seed структура ответов 0.2 и 0.8 совпадает. Текст `low42` дословно совпал с `system.json` (файлы различаются только таймингами), `hot42` отличается формулировкой основания (84 токена против 62).

## Эксперимент

Проект: [`lab/demo`](lab/demo/) (сервис подписок; код, тесты, README и промпт A не менялись относительно `main`, в `opencode.json` после прогонов Claude Code изменены `baseURL`, список моделей и `enabled_providers`). Домашняя работа в [`README.md`](README.md) — «локальный помощник по своему проекту», но в своём репозитории из практик 1–2 только markdown-артефакты без кода: вопросы «подтверди кодом» и file:line на нём не проверить, поэтому по решению студента взят общий `lab/demo` — тестовый сервис, который README.md даёт для проверки вопросов.

Фактор A/B: **system prompt.**
- A = [`lab/demo/repo-system.txt`](lab/demo/repo-system.txt) (промпт практики).
- B = [`lab/claude/repo-system-b.txt`](lab/claude/repo-system-b.txt): сначала искать и читать файлы, явно проверять предпосылку, формат «Ответ / Основание file:line / Чего нет в файлах».

Неизменные условия:
- модель `itmo-agent` (qwen3.8:27b Q4_K_M), `num_ctx` 65536, temperature 0.2 из Modelfile;
- `max_tokens` 4096, thinking adaptive (одинаковое значение Claude Code по умолчанию);
- инструменты Read/Glob/Grep, `--max-turns 8`, одинаковая заметка о рабочем каталоге;
- вопросы дословно из [`QUESTIONS.md`](lab/QUESTIONS.md) и Q6 из [`run_ab.sh`](lab/claude/run_ab.sh), входные файлы `lab/demo/` во время прогонов не менялись;
- новая сессия на каждый вопрос; в итоговой конфигурации каждый вопрос прогнан один раз, сначала все A, затем все B.

Эталоны: [`results/expected.md`](lab/results/expected.md), тестируемой модели не передавались: она запускается в `lab/demo/`, и по логам ни один вызов инструмента не вышел за этот каталог (жёсткого ограничения путей в конфигурации нет). Эталоны Q1–Q5 закоммичены в `2823457`, ответы A/B — позже, в `ff1ee7d`. Эталон Q6 закоммичен вместе с ответами, поэтому то, что он составлен до ответов, коммитом не подтверждается; его правильность подтверждена запуском кода (вывод в `expected.md`). `make test` — 3 теста OK.

| Вопрос | Эталон и file:line | Ответ A | Ответ B | Верно A/B | Наблюдение инструментов |
|---|---|---|---|---|---|
| 1. Как запустить тесты? | `make test` → `python3 -m unittest -v`; `demo/README.md:6`, `demo/Makefile:2-3` | `make test` — README.md:6, Makefile:2-3; альтернативы; «команды не запускал» — [A-q1](lab/results/ab/A-q1.jsonl) | `make test` — Makefile:2-3, README.md:6 — [B-q1](lab/results/ab/B-q1.jsonl) | ✅ / ✅ | A: Glob, Grep, Read×3 (6 ходов, 130 с); B: Glob, Grep, Read×3 (6, 127 с) |
| 2. Пустое имя? | `ValueError("empty name")`; `service.py:5-6`, `test_service.py:13-15` | верно, те же строки + README.md:3; отдельно отметил `None` → `AttributeError` — [A-q2](lab/results/ab/A-q2.jsonl) | верно, service.py:5-6, test_service.py:13-15 — [B-q2](lab/results/ab/B-q2.jsonl) | ✅ / ✅ | A: Glob, Read×3 (5, 173 с); B: Glob, Grep, Read×2 (5, 135 с) |
| 3. Где unsubscribe? (ложная предпосылка) | функции нет, только `subscribe` — `service.py:4` | «Предпосылка неверна», service.py:4-8 — [A-q3](lab/results/ab/A-q3.jsonl) | «предпосылка вопроса ложна», service.py:4-8, test_service.py:2 — [B-q3](lab/results/ab/B-q3.jsonl) | ✅ / ✅ | оба начали с `Grep -i unsubscribe` (0 совпадений). A: 6 ходов, 192 с; B: 5, 133 с |
| 4. Какая CI? (нет ответа) | сведений нет; `README.md:6` — только `make test` | «нет сведений о CI-системе», поиск по ключевым словам — [A-q4](lab/results/ab/A-q4.jsonl) | «нет CI-системы», перечислено, что проверено — [B-q4](lab/results/ab/B-q4.jsonl) | ✅ / ◐ частично | A: Glob, Grep, Read×4 (7, 182 с); B: Glob, Grep, Read×2 (5, 130 с) |
| 5. Сохраняются ли подписки? | нет, `set()` в памяти; `service.py:1`, `README.md:2` | нет — service.py:1, service.py:7, README.md:2 — [A-q5](lab/results/ab/A-q5.jsonl) | нет — service.py:1, service.py:7, README.md:2 — [B-q5](lab/results/ab/B-q5.jsonl) | ✅ / ✅ | A: Glob, Read×4 (6, 133 с); B: Glob, Grep, Read×3 (6, 139 с) |
| 6*. `subscribe(" Ann ")`, затем `subscribe("Ann")`, затем `subscribe(None)` | `"Ann"` без дубликата; `None` → `AttributeError` на `service.py:5`; тестов на это нет | всё верно, со ссылками на строки — [A-q6](lab/results/ab/A-q6.jsonl) | всё верно; «Чего нет в файлах: —», хотя тестов на `None` нет — [B-q6](lab/results/ab/B-q6.jsonl) | ✅ / ✅ | A: Grep, Glob, Read×2 (5, 253 с); B: Grep, Glob, Read×2 (5, 184 с) |

\* Q6 — дополнительный сложный вопрос сверх пяти, которые требует README.md, добавлен, потому что модель не ошиблась на пяти вопросах: на Q1–Q5 выводы обеих конфигураций верны, неверных фактов нет; B-q4 содержит одно непроверенное утверждение (◐).
◐ — частично верно по критерию `expected.md`: вывод правильный, но добавлено непроверенное утверждение. B-q4 утверждает «В репозитории нет CI-системы», хотя из файлов следует только, что сведений о CI нет (CI может быть настроена вне репозитория).
Итог: A — 6/6, B — 5/6 + 1 частично (B-q4). Все пути в вызовах инструментов внутри `lab/demo`, ошибок инструментов нет. Ссылки file:line в ответах опираются на вывод Read или Grep в той же сессии; единственное расширение — A-q3 указывает диапазон `test_service.py:9-20`, хотя Grep показал только часть этих строк (файл целиком не читался).
Медиана по 6 вопросам: A — 177.6 с и 738 выходных токенов, B — 134.2 с и 577 токенов. B короче, A даёт больше пояснений (`None` в Q2, «команды не запускал» в Q1, что есть вместо `unsubscribe` в Q3).

## Прогон через OpenCode

После A/B и замеров скорости установлен OpenCode 1.15.10, и Q1–Q5 из [`QUESTIONS.md`](lab/QUESTIONS.md) прогнаны через агента `local-guide` из [`demo/opencode.json`](lab/demo/opencode.json): модель `ollama/itmo-agent`, промпт A (`{file:./repo-system.txt}`), `steps: 8`, разрешены только `read`, `glob`, `grep`. Каждый вопрос — отдельный `opencode run` (новая сессия) из `lab/demo`, runner — [`lab/opencode/run_opencode.sh`](lab/opencode/run_opencode.sh), сырые события `--format json` — [`results/opencode/`](lab/results/opencode/).

Особенность машины: системный конфиг NixOS `/etc/opencode/opencode.json` задаёт свою модель по умолчанию (`llama-cpp/…`) и перекрывает `"model"` проектного конфига, поэтому модель передаётся флагом `-m ollama/itmo-agent`. Чтобы в OpenCode были видны только модели практики, в проектный конфиг добавлены `itmo-local`, `qwen3.8:27b` и `"enabled_providers": ["ollama"]`; `opencode models` из `lab/demo` выводит ровно `ollama/itmo-agent`, `ollama/itmo-local`, `ollama/qwen3.8:27b`.

| Вопрос | Ответ OpenCode (`local-guide`) | Верно | Инструменты, время сессии |
|---|---|---|---|
| 1. Как запустить тесты? | `make test` → `python3 -m unittest -v` — Makefile:1-3; альтернатива `python3 test_service.py` — test_service.py:23-24 — [q1](lab/results/opencode/q1.jsonl) | ✅ | read×3, glob×2; 113 с |
| 2. Пустое имя? | `ValueError("empty name")`, имя не добавляется — service.py:4-6, test_service.py:13-15, README.md:3 — [q2](lab/results/opencode/q2.jsonl) | ✅ | read×4, glob; 147 с |
| 3. Где unsubscribe? (ложная предпосылка) | «Предпосылка вопроса неверна», есть только `subscribe` — service.py:1, 4-8, test_service.py:2, README.md:3 — [q3](lab/results/opencode/q3.jsonl) | ✅ | начал с `grep unsubscribe` (0 совпадений), glob, read×3; 212 с |
| 4. Какая CI? (нет ответа) | «нет сведений о конкретной CI-системе»; конфигов CI не найдено; README.md:6 — только `make test` — [q4](lab/results/opencode/q4.jsonl) | ✅ | glob×9, grep, read×2; 184 с |
| 5. Сохраняются ли подписки? | нет — service.py:1, service.py:7, README.md:2 — [q5](lab/results/opencode/q5.jsonl) | ✅ | read×3, glob; 125 с |

Итог OpenCode: 5/5, медиана времени сессии 147 с (по меткам времени событий), 179–309 выходных токенов на ответ. Все вызовы инструментов завершились успешно, пути — внутри `lab/demo`, все сессии закончились ответом (`reason: stop`), лимит `steps` не достигнут. Ограничение 1 воспроизвелось: в Q4 модель прочитала промпт `repo-system.txt` как файл проекта. В Q3 в ответ попала промежуточная фраза «Прочитаю исходные файлы…» перед итоговым текстом — OpenCode выводит текст всех шагов.

## Скорость

Метод: для Claude Code — поля события `result`: `duration_ms` (от старта сессии до ответа, все ходы агента), `ttft_stream_ms` и `ttft_ms`. Точная семантика двух последних полей в Claude Code не документирована: по данным `ttft_stream_ms` — время до первого события потока от сервера (у прогретых прогонов около 0.9 с), `ttft_ms` — время до первого токена содержимого ответа, в которое, вероятно, входит рассуждение модели (у прогретых прогонов 22.7–28.3 с); для API — `wall_seconds`, `load_seconds`, `decode_tokens_per_second` из `experiment.py`. Вопрос для агента — Q1, для API — CI-вопрос с `system.txt` (t=0.2, seed 42). Замеры — [`results/speed/`](lab/results/speed/), медианы времени, `ttft_ms`, `ttft_stream_ms`, ходов и токенов — [`results/speed/summary.json`](lab/results/speed/summary.json). Медианы по 6 вопросам A/B посчитаны по полям `result` файлов `results/ab/`.

Холодный старт отдельно (модель выгружена `ollama stop`):
- Claude Code, A: 114.5 с, 4 хода, 380 выходных токенов. `ttft_stream_ms` 27.6 с против медианы 0.9 с у прогретых A, то есть загрузка профиля `itmo-agent` (22 GB, 64k) добавила около 27 с; `ttft_ms` 47.5 с против 25.0 с. Общее время меньше медианы прогретых (119.3 с), потому что ходов и токенов было меньше: время сессии определяется в основном генерацией.
- API (`qwen3.8:27b`, 4k): wall 21.3 с, из них загрузка 7.1 с, decode 5.11 tok/s.

Три прогретых повтора и медиана:

| Конфигурация | Повтор 1 | Повтор 2 | Повтор 3 | **Медиана** |
|---|---:|---:|---:|---:|
| Claude Code A, Q1, время сессии, с | 126.2 | 100.0 | 119.3 | **119.3 с** |
| Claude Code A, Q1, `ttft_stream_ms`, с | 0.90 | 0.91 | 0.88 | **0.90 с** |
| Claude Code A, Q1, `ttft_ms`, с | 25.0 | 25.1 | 23.2 | **25.0 с** |
| Claude Code A, ходы / выходные токены | 5 / 558 | 5 / 471 | 6 / 578 | 5 / 558 |
| Claude Code B, Q1, время сессии, с | 136.8 | 131.0 | 136.2 | **136.2 с** |
| Claude Code B, Q1, `ttft_stream_ms`, с | 4.98 | 0.97 | 0.89 | **0.97 с** |
| Claude Code B, Q1, `ttft_ms`, с | 28.3 | 26.4 | 22.7 | **26.4 с** |
| Claude Code B, ходы / выходные токены | 7 / 618 | 6 / 600 | 6 / 591 | 6 / 600 |
| API, wall, с | 12.8 | 12.9 | 12.7 | **12.8 с** (62 ток.) |
| API, decode, tok/s | 5.08 | 5.06 | 5.11 | **5.08 tok/s** |

Медиана берётся по каждой метрике отдельно.
Единицы и метод замера: секунды wall-clock и токены/с (`eval_count / eval_duration` из ответа Ollama).
TTFT измерен или не измерен: **для агента измерен** по полям Claude Code (см. таблицу): до первого события потока — 0.9–1.0 с, до первого токена содержимого — 25.0–26.4 с (медианы). Оговорка: семантика полей взята из данных, а не из документации. Для API TTFT не измерен — ответы не потоковые.

## Вывод

Ошибка или обнаруженное ограничение:
1. **Модель читает служебные файлы как файлы проекта.** В `lab/demo/` рядом с кодом лежат `opencode.json` и промпт A `repo-system.txt`. A-q4 прочитал оба, A-q5 — `repo-system.txt` ([A-q4](lab/results/ab/A-q4.jsonl), [A-q5](lab/results/ab/A-q5.jsonl)). На ответы это не повлияло, но это граница чистоты эксперимента: в режиме B модель тоже может прочитать промпт A. Промпты и конфиги стоит держать вне каталога, который читает тестируемая модель.
2. **Строгий формат B не гарантирует проверку.** Поле «Чего нет в файлах» должно показывать неподтверждённое, но в B-q6 модель поставила «—», хотя тестов на `None` и имя с пробелами нет ([B-q6](lab/results/ab/B-q6.jsonl)). В B-q4 «В репозитории нет CI-системы» сильнее того, что видно из файлов («сведений о CI нет») ([B-q4](lab/results/ab/B-q4.jsonl)). B-q4 поэтому засчитан как частично верный, B-q6 — как верный (вывод и ссылки правильные, но поле, ради которого введён формат, не сработало).
3. **Формат в API-эксперименте:** в 4 из 6 прогонов с `system.txt` пропущено обязательное «основание».
4. **Скорость:** через API около 5 tok/s при 75% модели на CPU. В агентном профиле на CPU 83–87% модели, одна сессия занимает около 2 минут, из них 21–37 с до первого токена содержимого (`ttft_ms`). Для интерактивной работы это медленно.

Как проверили:
- tool-события во всех 20 агентных прогонах: `is_error`, пути `input.file_path`, событие `init`;
- ссылки file:line в ответах сверены с выводом Read/Grep в той же сессии и с кодом `lab/demo`;
- эталоны сверены с кодом и `make test`, поведение Q6 — запуском кода;
- `summary.json` воспроизводится `median.py` из файлов `results/speed/`;
- сетевые соединения тестового процесса — [`results/network-check.txt`](lab/results/network-check.txt).

Чем инструкции агента отличаются от SYSTEM: `SYSTEM` в Modelfile — значение по умолчанию на уровне модели; оно действует, только если клиент не прислал своё system-сообщение, и ничего не знает об инструментах и каталоге (поэтому `itmo-local` отказал на общий вопрос). Инструкции агента (промпт A или B и заметка о каталоге) передаёт клиент в каждом запросе вместе с описаниями инструментов; рабочий каталог известен только клиенту.

Какой конфигурацией будете пользоваться: **`qwen3.8:27b` (`itmo-agent`, 64k) + system prompt A + заметка о рабочем каталоге.** По точности A — 6/6, B — 5/6 + 1 частично. A оставлен, потому что он не ошибся и его ответы содержат оговорки и нюансы, а строгий формат B дал два излишне уверенных утверждения (ограничение 2). B быстрее по медиане набора вопросов (134.2 против 177.6 с), но на повторах Q1 медленнее (136.2 против 119.3 с), так что устойчивого выигрыша в скорости нет.

Что осталось непроверенным:
- физическое отключение сети (заменено контролем TCP-сокетов процесса; UDP и DNS не отслеживались);
- `OLLAMA_NO_CLOUD=1` на сервере Ollama (нужен sudo);
- вариативность: в итоговой конфигурации каждый вопрос A/B прогнан один раз, A и B шли последовательно, поэтому разница во времени между ними шумная;
- режим `think=false` в агенте (использован adaptive по умолчанию);
- контекст больше 64k и проекты крупнее `lab/demo`;
- qwen3.5, другие квантизации и A/B по фактору «модель» (например, `gemma4:31b`);
- в OpenCode — только Q1–Q5 с промптом A, по одному прогону; A/B и замеры скорости через OpenCode не повторялись.
