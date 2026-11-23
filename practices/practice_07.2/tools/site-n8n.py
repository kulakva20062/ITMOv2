import json
import os
from pathlib import Path
import shutil
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


SITE = 'https://n8n-itmo.cyrweb.ru'
WORKFLOWS = {'7.1': '5TxcZj0jrj1W74VS', '7.2': '3Aqjwd2KWrz6aLzY'}


def open_editor(part):
    url = f'{SITE}/workflow/{WORKFLOWS[part]}'
    if shutil.which('firefox'):
        os.execvp('firefox', ['firefox', '--new-tab', url])
    if shutil.which('xdg-open'):
        os.execvp('xdg-open', ['xdg-open', url])
    raise SystemExit(f'Откройте редактор n8n по адресу {url}')


def run_check(part):
    config = Path(os.environ.get('XDG_CONFIG_HOME', Path.home() / '.config')) / 'itmo-practice07'
    token = os.environ.get('N8N_TEST_TOKEN')
    if not token:
        try:
            token = (config / 'test-token').read_text().strip()
        except FileNotFoundError:
            raise SystemExit('Сохраните токен проверок в N8N_TEST_TOKEN или ' + str(config / 'test-token')) from None

    request = Request(f'{SITE}/webhook/itmo-kulakva-practice-07-checks',
                      data=json.dumps({'practice': part}).encode(),
                      headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
    try:
        with urlopen(request, timeout=90) as response:
            result = json.load(response)
    except HTTPError as error:
        raise SystemExit(f'Проверка в учебном n8n завершилась ошибкой HTTP {error.code}') from None
    except (URLError, TimeoutError, ValueError) as error:
        raise SystemExit(f'Не удалось получить результат проверки от учебного n8n: {error}') from None

    if not isinstance(result, dict) or result.get('practice') != part or not result.get('executionId'):
        raise SystemExit('Учебный n8n вернул неожиданный результат проверки')
    for check in result['checks']:
        print(f'{"OK" if check["ok"] else "FAIL"} {check["name"]}')
    print(f'{SITE}/workflow/{result["workflowId"]}/executions/{result["executionId"]}')
    if result.get('ok') is not True:
        raise SystemExit(1)


if __name__ == '__main__':
    part, action = sys.argv[1:]
    {'start': open_editor, 'test': run_check}[action](part)
