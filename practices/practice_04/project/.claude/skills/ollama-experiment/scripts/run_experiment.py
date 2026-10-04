"""Проверить Ollama, запустить experiment.py и кратко свести результат. Только stdlib."""
import argparse
import json
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[4]
TAGS_URL = "http://127.0.0.1:11434/api/tags"


def check_ollama(model):
    """Строка статуса: доступна ли Ollama и скачана ли модель."""
    try:
        with urllib.request.urlopen(TAGS_URL, timeout=5) as response:
            names = {m.get("name") for m in json.load(response).get("models", [])}
    except (OSError, ValueError) as exc:
        return f"Ollama: недоступна ({exc})"
    if model in names or f"{model}:latest" in names:
        return f"Ollama: доступна, модель {model} скачана"
    return f"Ollama: доступна, но модели {model} нет — `ollama pull {model}`"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--mode", choices=["baseline", "system"], required=True)
    p.add_argument("--model", default="qwen3.8:27b")
    p.add_argument("--temperature", default="0.2")
    p.add_argument("--seed", default="42")
    p.add_argument("--timeout", default="300")
    p.add_argument("--output")
    args = p.parse_args()
    output = args.output or str(Path(tempfile.mkdtemp(prefix="ollama-exp-")) / "result.json")

    print(check_ollama(args.model))

    cmd = [sys.executable, str(PROJECT / "experiment.py"), "--mode", args.mode,
           "--model", args.model, "--temperature", args.temperature, "--seed", args.seed,
           "--timeout", args.timeout, "--output", output]
    run = subprocess.run(cmd, capture_output=True, text=True)
    if run.returncode != 0:
        print(f"experiment.py: код выхода {run.returncode}")
        print("stderr: " + run.stderr.strip())
        return run.returncode

    record = json.loads(Path(output).read_text(encoding="utf-8"))
    answer = record["response"].get("message", {}).get("content", "")
    speed = record["decode_tokens_per_second"]
    print(f"experiment.py: код выхода 0, запись: {output}")
    print(f"decode_tokens_per_second: {speed:.2f}" if speed else "decode_tokens_per_second: нет данных")
    print(f"load_seconds: {record['load_seconds']:.2f}")
    print(f"total_seconds: {record['total_seconds']:.2f}")
    print("ответ: " + answer.strip().replace("\n", " ")[:300])
    return 0


if __name__ == "__main__":
    sys.exit(main())
