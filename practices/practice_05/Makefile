.PHONY: test run specs

# Все тесты проекта: фичи A–C (лендинг, калькулятор, фильтр) и D (заявка: логика, API, UI)
test:
	@sh project/scripts/check.sh

# Лендинг и API заявок на http://localhost:8000/
run:
	@cd project && node server.js

# Состояние OpenSpec: main specs, архив и draft с правилом rules.design
specs:
	@cd project && openspec list --specs && openspec list && ls openspec/changes/archive
