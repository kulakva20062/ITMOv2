"""stdio MCP-сервер с одним tool ollama_model_info. Только stdlib.

Транспорт: JSON-RPC 2.0, одно сообщение на строку в stdin/stdout.
"""
import json
import sys
import urllib.error
import urllib.request

SHOW_URL = "http://127.0.0.1:11434/api/show"
PROTOCOL_VERSION = "2025-06-18"

TOOL = {
    "name": "ollama_model_info",
    "description": "Семейство, размер, квантизация и длина контекста локальной модели Ollama (из /api/show).",
    "inputSchema": {
        "type": "object",
        "properties": {"model": {"type": "string", "description": "Имя модели, например qwen3.8:27b"}},
        "required": ["model"],
    },
}


def tool_result(text, is_error=False):
    return {"content": [{"type": "text", "text": text}], "isError": is_error}


def model_info(model):
    if not isinstance(model, str) or not model.strip():
        return tool_result("ошибка: имя модели не может быть пустым", True)
    request = urllib.request.Request(SHOW_URL, data=json.dumps({"model": model}).encode(),
                                     headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            show = json.load(response)
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return tool_result(f"ошибка: модель {model} не найдена — `ollama pull {model}`", True)
        return tool_result(f"ошибка: Ollama вернула HTTP {exc.code}", True)
    except (urllib.error.URLError, TimeoutError) as exc:
        return tool_result(f"ошибка: Ollama недоступна на 127.0.0.1:11434 ({exc})", True)
    except ValueError:
        return tool_result("ошибка: Ollama вернула невалидный JSON", True)
    details = show.get("details", {})
    info = show.get("model_info", {})
    arch = info.get("general.architecture", "")
    summary = {
        "model": model,
        "family": details.get("family"),
        "parameter_size": details.get("parameter_size"),
        "quantization_level": details.get("quantization_level"),
        "context_length": info.get(f"{arch}.context_length"),
    }
    return tool_result(json.dumps(summary, ensure_ascii=False))


def handle(message):
    method = message.get("method")
    params = message.get("params") or {}
    if method == "initialize":
        return {"protocolVersion": params.get("protocolVersion", PROTOCOL_VERSION),
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "ollama-info", "version": "1.0.0"}}
    if method == "ping":
        return {}
    if method == "tools/list":
        return {"tools": [TOOL]}
    if method == "tools/call":
        if params.get("name") != TOOL["name"]:
            raise ValueError(f"unknown tool: {params.get('name')}")
        arguments = params.get("arguments") or {}
        if not isinstance(arguments, dict):
            return tool_result("ошибка: arguments должен быть объектом {\"model\": ...}", True)
        return model_info(arguments.get("model"))
    raise LookupError(f"method not found: {method}")


def respond(message):
    try:
        return {"jsonrpc": "2.0", "id": message["id"], "result": handle(message)}
    except LookupError as exc:
        error = {"code": -32601, "message": str(exc)}
    except ValueError as exc:
        error = {"code": -32602, "message": str(exc)}
    except Exception as exc:  # сервер не падает на неожиданном входе
        error = {"code": -32603, "message": f"internal error: {exc}"}
    return {"jsonrpc": "2.0", "id": message["id"], "error": error}


def main():
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            message = json.loads(line)
        except ValueError:
            reply = {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "parse error"}}
        else:
            if not isinstance(message, dict):
                reply = {"jsonrpc": "2.0", "id": None, "error": {"code": -32600, "message": "invalid request"}}
            elif "id" not in message:
                continue  # уведомление, например notifications/initialized
            else:
                reply = respond(message)
        sys.stdout.write(json.dumps(reply, ensure_ascii=False) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
