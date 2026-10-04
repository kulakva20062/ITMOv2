import contextlib
import io
import json
import os
import socket
import sys
import tempfile
import unittest
import urllib.error
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import experiment  # noqa: E402

OLLAMA_ANSWER = {
    "model": "qwen3.8:27b",
    "message": {"role": "assistant", "content": "В предоставленных материалах нет ответа"},
    "done": True,
    "total_duration": 3_000_000_000,
    "load_duration": 1_000_000_000,
    "eval_count": 20,
    "eval_duration": 2_000_000_000,
}


def fake_response(body):
    return io.BytesIO(json.dumps(body).encode())


def http_error(code, body):
    data = body if isinstance(body, bytes) else json.dumps(body).encode()
    return urllib.error.HTTPError("http://127.0.0.1:11434/api/chat", code, "error", {},
                                  io.BytesIO(data))


class ExperimentCase(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.output = os.path.join(self.tmp.name, "out.json")
        patcher = mock.patch("urllib.request.urlopen")
        self.urlopen = patcher.start()
        self.addCleanup(patcher.stop)
        self.urlopen.side_effect = lambda *args, **kwargs: fake_response(OLLAMA_ANSWER)

    def run_main(self, *extra, output=None):
        argv = ["--mode", "system", "--output", output or self.output, *extra]
        out, err = io.StringIO(), io.StringIO()
        code = 0
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            try:
                experiment.main(argv)
            except SystemExit as exc:
                code = exc.code
        return code, out.getvalue(), err.getvalue()

    def assertRejected(self, code, err, fragment):
        self.assertEqual(code, 2)
        lines = err.strip().splitlines()
        self.assertEqual(len(lines), 1, err)
        self.assertIn(fragment, lines[0])
        self.assertNotIn("Traceback", err)
        self.urlopen.assert_not_called()

    def assertDependencyError(self, code, err, expected):
        self.assertEqual(code, 3)
        lines = err.strip().splitlines()
        self.assertEqual(len(lines), 1, err)
        self.assertEqual(lines[0], expected)
        self.assertNotIn("Traceback", err)
        self.assertFalse(Path(self.output).exists())


class SuccessTest(ExperimentCase):
    def test_success_writes_record_and_prints_answer(self):
        code, out, err = self.run_main()
        self.assertEqual(code, 0, err)
        self.urlopen.assert_called_once()
        record = json.loads(Path(self.output).read_text(encoding="utf-8"))
        self.assertEqual(set(record), {"request", "response", "wall_seconds", "load_seconds",
                                       "total_seconds", "decode_tokens_per_second"})
        self.assertEqual(record["load_seconds"], 1.0)
        self.assertEqual(record["total_seconds"], 3.0)
        self.assertEqual(record["decode_tokens_per_second"], 10.0)
        self.assertEqual(record["request"]["options"]["num_ctx"], 4096)
        self.assertIn("В предоставленных материалах нет ответа", out)
        self.assertIn("Saved: " + self.output, out)

    def test_success_requests_ollama_chat_endpoint(self):
        code, _, err = self.run_main()
        self.assertEqual(code, 0, err)
        request = self.urlopen.call_args.args[0]
        self.assertEqual(request.full_url, "http://127.0.0.1:11434/api/chat")


class InputValidationTest(ExperimentCase):
    def test_existing_output_rejected_before_request(self):
        Path(self.output).write_text("old", encoding="utf-8")
        code, _, err = self.run_main()
        self.assertRejected(code, err, "уже существует")
        self.assertEqual(Path(self.output).read_text(encoding="utf-8"), "old")

    def test_missing_output_directory_rejected_before_request(self):
        output = os.path.join(self.tmp.name, "nodir", "out.json")
        code, _, err = self.run_main(output=output)
        self.assertRejected(code, err, "каталог для файла результата не существует")
        self.assertFalse(Path(output).exists())

    def test_unwritable_output_directory_rejected_before_request(self):
        readonly = os.path.join(self.tmp.name, "ro")
        os.mkdir(readonly, 0o500)
        self.addCleanup(os.chmod, readonly, 0o700)
        output = os.path.join(readonly, "out.json")
        code, _, err = self.run_main(output=output)
        self.assertRejected(code, err, "нет права записи в каталог")
        self.assertFalse(Path(output).exists())

    def test_temperature_above_range_rejected(self):
        code, _, err = self.run_main("--temperature", "2.5")
        self.assertRejected(code, err, "--temperature")
        self.assertFalse(Path(self.output).exists())

    def test_temperature_below_range_rejected(self):
        code, _, err = self.run_main("--temperature", "-0.1")
        self.assertRejected(code, err, "--temperature")
        self.assertFalse(Path(self.output).exists())

    def test_temperature_bounds_accepted(self):
        for value in ("0", "2"):
            with self.subTest(value=value):
                output = os.path.join(self.tmp.name, f"t{value}.json")
                code, _, err = self.run_main("--temperature", value, output=output)
                self.assertEqual(code, 0, err)

    def test_empty_model_rejected(self):
        for value in ("", "   "):
            with self.subTest(value=value):
                code, _, err = self.run_main("--model", value)
                self.assertRejected(code, err, "--model")
                self.assertFalse(Path(self.output).exists())

    def test_too_long_prompt_rejected(self):
        # Текущий промпт режима system — 554 символа; лимит 500 его не пропускает.
        with mock.patch.object(experiment, "MAX_PROMPT_CHARS", 500):
            code, _, err = self.run_main()
        self.assertRejected(code, err, "максимум 500")
        self.assertFalse(Path(self.output).exists())

    def test_default_limit_matches_contract(self):
        self.assertEqual(experiment.MAX_PROMPT_CHARS, 7000)


class TimeoutArgumentTest(ExperimentCase):
    def test_default_timeout_matches_contract(self):
        code, _, err = self.run_main()
        self.assertEqual(code, 0, err)
        self.assertEqual(self.urlopen.call_args.kwargs["timeout"], 300)

    def test_timeout_value_is_passed_to_urlopen(self):
        code, _, err = self.run_main("--timeout", "12.5")
        self.assertEqual(code, 0, err)
        self.assertEqual(self.urlopen.call_args.kwargs["timeout"], 12.5)

    def test_non_positive_timeout_rejected_before_request(self):
        for value in ("0", "-5"):
            with self.subTest(value=value):
                code, _, err = self.run_main("--timeout", value)
                self.assertRejected(code, err, "--timeout должен быть конечным числом больше 0, получено " + value)
                self.assertFalse(Path(self.output).exists())

    def test_nan_timeout_rejected_before_request(self):
        for value in ("nan", "NaN"):
            with self.subTest(value=value):
                output = os.path.join(self.tmp.name, f"nan-{value}.json")
                code, _, err = self.run_main("--timeout", value, output=output)
                self.assertRejected(code, err, "--timeout должен быть конечным числом больше 0, получено nan")
                self.assertFalse(Path(output).exists())

    def test_infinite_timeout_rejected_before_request(self):
        for value in ("inf", "Infinity"):
            with self.subTest(value=value):
                output = os.path.join(self.tmp.name, f"inf-{value}.json")
                code, _, err = self.run_main("--timeout", value, output=output)
                self.assertRejected(code, err, "--timeout должен быть конечным числом больше 0, получено inf")
                self.assertFalse(Path(output).exists())

    def test_existing_output_rejected_even_with_bad_timeout(self):
        # Сценарии A сохраняются: вход проверяется до запроса целиком.
        Path(self.output).write_text("old", encoding="utf-8")
        code, _, err = self.run_main("--timeout", "0")
        self.assertRejected(code, err, "уже существует")


class OllamaFailureTest(ExperimentCase):
    def test_connection_refused(self):
        self.urlopen.side_effect = urllib.error.URLError(
            ConnectionRefusedError(111, "Connection refused"))
        code, _, err = self.run_main()
        self.assertDependencyError(
            code, err, "Ollama недоступна на 127.0.0.1:11434 — запустите `ollama serve`")

    def test_timeout_error(self):
        self.urlopen.side_effect = TimeoutError("timed out")
        code, _, err = self.run_main("--timeout", "5")
        self.assertDependencyError(code, err, "Ollama не ответила за 5 с")

    def test_timeout_error_wrapped_in_urlerror(self):
        self.urlopen.side_effect = urllib.error.URLError(socket.timeout("timed out"))
        code, _, err = self.run_main("--timeout", "7.5")
        self.assertDependencyError(code, err, "Ollama не ответила за 7.5 с")

    def test_http_404_reports_missing_model(self):
        self.urlopen.side_effect = http_error(404, {"error": "model 'nosuch' not found"})
        code, _, err = self.run_main("--model", "nosuch")
        self.assertDependencyError(code, err, "модель nosuch не найдена — `ollama pull nosuch`")

    def test_model_not_found_body_with_other_status(self):
        self.urlopen.side_effect = http_error(400, {"error": "model 'nosuch' not found"})
        code, _, err = self.run_main("--model", "nosuch")
        self.assertDependencyError(code, err, "модель nosuch не найдена — `ollama pull nosuch`")

    def test_other_http_error_reports_code_and_body(self):
        self.urlopen.side_effect = http_error(500, {"error": "server overloaded"})
        code, _, err = self.run_main()
        self.assertDependencyError(code, err, "Ollama вернула HTTP 500: server overloaded")

    def test_other_http_error_without_error_body(self):
        self.urlopen.side_effect = http_error(503, b"<html>")
        code, _, err = self.run_main()
        self.assertDependencyError(code, err, "Ollama вернула HTTP 503")

    def test_invalid_json_response(self):
        self.urlopen.side_effect = lambda *a, **kw: io.BytesIO(b"not json")
        code, _, err = self.run_main()
        self.assertDependencyError(code, err, "Ollama вернула невалидный JSON (HTTP 200)")

    def test_other_network_error(self):
        self.urlopen.side_effect = urllib.error.URLError("dns is down")
        code, _, err = self.run_main()
        self.assertDependencyError(code, err, "ошибка соединения с Ollama: dns is down")

    def test_stdout_is_empty_on_failure(self):
        self.urlopen.side_effect = urllib.error.URLError(
            ConnectionRefusedError(111, "Connection refused"))
        code, out, _ = self.run_main()
        self.assertEqual(code, 3)
        self.assertEqual(out, "")


if __name__ == "__main__":
    unittest.main()
