"""Controlled local Ollama experiment; standard library only."""
import argparse
import json
import sys
import time
import urllib.request
from pathlib import Path

QUESTION = "\nКакая CI-система запускает тесты проекта?"
# num_ctx=4096 минус num_predict=512 ≈ 3500 токенов на вход, ~2 символа на токен.
# Обоснование: docs/requirements.md.
MAX_PROMPT_CHARS = 7000


def fail(message, code=2):
    print("ошибка: " + message, file=sys.stderr)
    raise SystemExit(code)


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


def main(argv=None):
    p = argparse.ArgumentParser()
    p.add_argument("--mode", choices=["baseline", "system"], required=True)
    p.add_argument("--model", default="qwen3.8:27b")
    p.add_argument("--temperature", type=float, default=0.2)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--output", required=True)
    args = p.parse_args(argv)
    root = Path(__file__).resolve().parent
    messages = build_messages(root, args.mode)
    validate_args(args, messages)
    payload = {"model": args.model, "messages": messages, "stream": False, "think": False,
               "options": {"temperature": args.temperature, "seed": args.seed, "num_ctx": 4096, "num_predict": 512}}
    request = urllib.request.Request("http://127.0.0.1:11434/api/chat",
        data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=300) as response:
            answer = json.load(response)
    except Exception as exc:
        raise SystemExit("Local Ollama request failed: " + str(exc))
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
