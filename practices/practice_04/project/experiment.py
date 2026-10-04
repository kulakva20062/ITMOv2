"""Controlled local Ollama experiment; standard library only."""
import argparse
import json
import math
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

QUESTION = "\nКакая CI-система запускает тесты проекта?"
# num_ctx=4096 минус num_predict=512 ≈ 3500 токенов на вход, ~2 символа на токен.
# Обоснование: docs/requirements.md.
MAX_PROMPT_CHARS = 7000
OLLAMA_HOST = "127.0.0.1:11434"


def fail(message, code=2):
    print("ошибка: " + message, file=sys.stderr)
    raise SystemExit(code)


def dependency_failed(message):
    print(message, file=sys.stderr)
    raise SystemExit(3)


def build_messages(root, mode):
    messages = []
    if mode == "system":
        messages.append({"role": "system", "content": (root / "system.txt").read_text()})
    messages.append({"role": "user", "content": (root / "demo/README.md").read_text() + QUESTION})
    return messages


def validate_args(args, messages):
    if Path(args.output).exists():
        fail("файл результата уже существует: " + args.output)
    if not 0 <= args.temperature <= 2:
        fail(f"--temperature должна быть в диапазоне [0, 2], получено {args.temperature:g}")
    if not args.model.strip():
        fail("--model не может быть пустым")
    prompt_chars = sum(len(m["content"]) for m in messages)
    if prompt_chars > MAX_PROMPT_CHARS:
        fail(f"промпт {prompt_chars} символов, максимум {MAX_PROMPT_CHARS}")
    if not math.isfinite(args.timeout) or args.timeout <= 0:
        fail(f"--timeout должен быть больше 0, получено {args.timeout:g}")


def error_text(exc):
    """Текст из тела ошибки Ollama: {"error": "..."} (docs.ollama.com/api/errors)."""
    try:
        return json.loads(exc.read().decode("utf-8", "replace")).get("error", "")
    except (ValueError, AttributeError):
        return ""


def call_ollama(request, timeout, model):
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            try:
                return json.load(response)
            except ValueError:
                dependency_failed(
                    f"Ollama вернула невалидный JSON (HTTP {getattr(response, 'status', 200)})")
    except urllib.error.HTTPError as exc:
        text = error_text(exc)
        if exc.code == 404 or "not found" in text:
            dependency_failed(f"модель {model} не найдена — `ollama pull {model}`")
        dependency_failed(f"Ollama вернула HTTP {exc.code}" + (": " + text if text else ""))
    except urllib.error.URLError as exc:
        if isinstance(exc.reason, TimeoutError):
            dependency_failed(f"Ollama не ответила за {timeout:g} с")
        if isinstance(exc.reason, ConnectionRefusedError):
            dependency_failed(f"Ollama недоступна на {OLLAMA_HOST} — запустите `ollama serve`")
        dependency_failed(f"ошибка соединения с Ollama: {exc.reason}")
    except TimeoutError:
        dependency_failed(f"Ollama не ответила за {timeout:g} с")


def main(argv=None):
    p = argparse.ArgumentParser()
    p.add_argument("--mode", choices=["baseline", "system"], required=True)
    p.add_argument("--model", default="qwen3.8:27b")
    p.add_argument("--temperature", type=float, default=0.2)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--timeout", type=float, default=300)
    p.add_argument("--output", required=True)
    args = p.parse_args(argv)
    root = Path(__file__).resolve().parent
    messages = build_messages(root, args.mode)
    validate_args(args, messages)
    payload = {"model": args.model, "messages": messages, "stream": False, "think": False,
               "options": {"temperature": args.temperature, "seed": args.seed, "num_ctx": 4096, "num_predict": 512}}
    request = urllib.request.Request(f"http://{OLLAMA_HOST}/api/chat",
        data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
    started = time.perf_counter()
    answer = call_ollama(request, args.timeout, args.model)
    duration = answer.get("eval_duration", 0)
    record = {"request": payload, "response": answer, "wall_seconds": time.perf_counter() - started,
              "load_seconds": answer.get("load_duration", 0) / 1e9,
              "total_seconds": answer.get("total_duration", 0) / 1e9,
              "decode_tokens_per_second": answer.get("eval_count", 0) / (duration / 1e9) if duration else None}
    with Path(args.output).open("x", encoding="utf-8") as out:
        json.dump(record, out, ensure_ascii=False, indent=2)
    print(answer.get("message", {}).get("content", ""))
    print("Saved:", args.output)

if __name__ == "__main__":
    main()
