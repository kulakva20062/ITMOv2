#!/usr/bin/env python3
"""MCP-сервер (stdio, без зависимостей) с одним tool: check_contrast.

Считает контраст WCAG 2.1 для пары цветов текст/фон. Цвет — hex (#RGB, #RRGGBB)
или токен из :root в styles.css проекта (например --ink-2), чтобы агент проверял
палитру style guide прямо по коду.
"""
import json
import os
import re
import sys
from pathlib import Path

PROTOCOL_VERSION = "2025-06-18"
PROJECT_DIR = Path(os.environ.get("CLAUDE_PROJECT_DIR") or Path(__file__).resolve().parents[2])
CSS_FILE = PROJECT_DIR / "styles.css"
HEX_RE = re.compile(r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
REQUIRED = {"normal": {"AA": 4.5, "AAA": 7.0}, "large": {"AA": 3.0, "AAA": 4.5}}

TOOL = {
    "name": "check_contrast",
    "description": (
        "Контраст WCAG 2.1 между цветом текста и фона. Цвета: hex (#RGB/#RRGGBB) "
        "или CSS-токен из :root в styles.css проекта (например --ink-2). "
        "Возвращает коэффициент и проходит ли пара AA/AAA для обычного или крупного текста."
    ),
    "inputSchema": {
        "type": "object",
        "properties": {
            "foreground": {"type": "string", "description": "Цвет текста: #1B2A3A или --ink"},
            "background": {"type": "string", "description": "Цвет фона: #EDF0EE или --paper"},
            "text_size": {
                "type": "string",
                "enum": ["normal", "large"],
                "description": "large — от 24px или от 18.66px жирным; по умолчанию normal",
            },
        },
        "required": ["foreground", "background"],
    },
}


class InputError(ValueError):
    pass


def css_tokens():
    if not CSS_FILE.exists():
        return {}
    root = re.search(r":root\s*\{([^}]*)\}", CSS_FILE.read_text(encoding="utf-8"))
    if not root:
        return {}
    return {name: value.strip() for name, value in re.findall(r"(--[\w-]+)\s*:\s*([^;]+);", root.group(1))}


def resolve(color):
    if not isinstance(color, str) or not color.strip():
        raise InputError("цвет должен быть непустой строкой: hex (#RRGGBB) или токен --name")
    color = color.strip()
    source = color
    if color.startswith("--"):
        tokens = css_tokens()
        if color not in tokens:
            known = ", ".join(sorted(tokens)) or "нет токенов"
            raise InputError(f"токен {color} не найден в :root файла {CSS_FILE.name}; доступны: {known}")
        color = tokens[color]
    if not HEX_RE.match(color):
        raise InputError(f"'{source}' → '{color}' не hex-цвет; ожидается #RGB или #RRGGBB")
    digits = color[1:]
    if len(digits) == 3:
        digits = "".join(ch * 2 for ch in digits)
    return "#" + digits.upper(), source


def luminance(hex_color):
    def channel(value):
        c = int(value, 16) / 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (channel(hex_color[i:i + 2]) for i in (1, 3, 5))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def check_contrast(args):
    size = args.get("text_size", "normal")
    if size not in REQUIRED:
        raise InputError("text_size должен быть 'normal' или 'large'")
    fg, fg_src = resolve(args.get("foreground"))
    bg, bg_src = resolve(args.get("background"))
    l1, l2 = sorted((luminance(fg), luminance(bg)), reverse=True)
    ratio = round((l1 + 0.05) / (l2 + 0.05), 2)
    need = REQUIRED[size]
    return {
        "foreground": {"input": fg_src, "hex": fg},
        "background": {"input": bg_src, "hex": bg},
        "text_size": size,
        "ratio": ratio,
        "AA": {"required": need["AA"], "pass": ratio >= need["AA"]},
        "AAA": {"required": need["AAA"], "pass": ratio >= need["AAA"]},
    }


def handle(msg):
    method, params = msg.get("method"), msg.get("params") or {}
    if method == "initialize":
        return {
            "protocolVersion": params.get("protocolVersion", PROTOCOL_VERSION),
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "contrast", "version": "1.0.0"},
        }
    if method == "ping":
        return {}
    if method == "tools/list":
        return {"tools": [TOOL]}
    if method == "tools/call":
        if params.get("name") != TOOL["name"]:
            raise LookupError(f"неизвестный tool: {params.get('name')}")
        try:
            result = check_contrast(params.get("arguments") or {})
        except InputError as err:
            return {"content": [{"type": "text", "text": f"Ошибка входа: {err}"}], "isError": True}
        return {"content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False, indent=2)}]}
    raise LookupError(f"метод не поддерживается: {method}")


def main():
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            reply = {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "parse error"}}
            print(json.dumps(reply), flush=True)
            continue
        if "id" not in msg:  # notification, например notifications/initialized
            continue
        try:
            reply = {"jsonrpc": "2.0", "id": msg["id"], "result": handle(msg)}
        except LookupError as err:
            reply = {"jsonrpc": "2.0", "id": msg["id"], "error": {"code": -32601, "message": str(err)}}
        print(json.dumps(reply, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
