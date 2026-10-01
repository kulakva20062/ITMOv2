"""Median speed metrics from results/speed; standard library only."""
import json
import statistics
import sys
from pathlib import Path


def claude_run(path):
    result = next(json.loads(l) for l in path.open(encoding="utf-8") if '"type":"result"' in l)
    usage = result.get("usage", {})
    return {"duration_seconds": result["duration_ms"] / 1000,
            "api_seconds": result.get("duration_api_ms", 0) / 1000,
            "ttft_seconds": result.get("ttft_ms", 0) / 1000,
            "ttft_stream_seconds": result.get("ttft_stream_ms", 0) / 1000,
            "num_turns": result["num_turns"],
            "output_tokens": usage.get("output_tokens")}


def api_run(path):
    r = json.loads(path.read_text(encoding="utf-8"))
    return {k: r[k] for k in ("wall_seconds", "load_seconds", "total_seconds", "decode_tokens_per_second")}


def main():
    speed = Path(sys.argv[1] if len(sys.argv) > 1 else "results/speed")
    groups = {"claude_A_warm": sorted(speed.glob("A-warm*.jsonl")),
              "claude_B_warm": sorted(speed.glob("B-warm*.jsonl")),
              "api_warm": sorted(speed.glob("api-warm*.json"))}            # temperature 0.2
    summary = {"units": {"*_seconds": "s", "decode_tokens_per_second": "tok/s", "output_tokens": "tokens"}}
    for name, files in groups.items():
        runs = [(api_run if name.startswith("api") else claude_run)(f) for f in files]
        keys = runs[0].keys() if runs else []
        summary[name] = {"files": [f.name for f in files], "runs": runs,
                         "median": {k: statistics.median(r[k] for r in runs if r[k] is not None) for k in keys}}
    for cold in ("cold-A.jsonl", "api-cold.json"):
        if (speed / cold).exists():
            summary[cold] = (claude_run if cold.endswith("jsonl") else api_run)(speed / cold)
    out = speed / "summary.json"
    out.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: v.get("median", v) for k, v in summary.items() if k != "units"}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
