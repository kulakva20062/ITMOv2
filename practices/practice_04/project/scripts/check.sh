#!/bin/sh
# Проверка проекта Практики 4. Запуск: sh scripts/check.sh из каталога project/.
set -eu
cd "$(dirname "$0")/.."
python3 -m py_compile experiment.py
python3 -m unittest discover -s tests -v
make -C demo test
