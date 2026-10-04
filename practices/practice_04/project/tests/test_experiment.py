import contextlib
import io
import json
import os
import sys
import tempfile
import unittest
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


class InputValidationTest(ExperimentCase):
    def test_existing_output_rejected_before_request(self):
        Path(self.output).write_text("old", encoding="utf-8")
        code, _, err = self.run_main()
        self.assertRejected(code, err, "уже существует")
        self.assertEqual(Path(self.output).read_text(encoding="utf-8"), "old")

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


if __name__ == "__main__":
    unittest.main()
