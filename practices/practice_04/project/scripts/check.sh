#!/bin/sh
# Единственный runner проекта: тесты Node. Запускается из корня проекта.
cd "$(dirname "$0")/.." || exit 1
node --test "tests/**/*.test.js"
