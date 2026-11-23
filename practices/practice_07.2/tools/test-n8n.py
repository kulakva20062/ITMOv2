import base64
import http.cookiejar
import json
import os
from pathlib import Path
import re
import secrets
import signal
import socket
import subprocess
import sys
import tempfile
import time
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlsplit
from urllib.request import HTTPCookieProcessor, ProxyHandler, Request, build_opener


class Fixtures(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def respond(self):
        url = urlsplit(self.path)
        path, query = url.path, parse_qs(url.query)
        body = json.loads(self.rfile.read(int(self.headers.get('Content-Length', '0'))) or b'{}')
        self.server.calls.append((self.command, path, body, query))
        status = 200
        content_type = 'application/json'
        if path == '/v1/chat/completions':
            value = self.model_response(body)
        elif path == '/search/issues':
            page = int(query.get('page', ['1'])[0])
            count = 101 if 'is:issue created:' in query['q'][0] else 0
            items = [{'labels': [{'name': 'bug'}], 'user': {'login': 'fixture-author'}}
                     for _ in range((page - 1) * 100, min(page * 100, count))]
            value = {'items': items, 'total_count': count, 'incomplete_results': False}
        elif path.endswith('/files'):
            value = [{'filename': 'pricing.py', 'patch': '@@ -1 +1 @@\n-old\n+new'}]
        elif path.endswith('/reviews'):
            value = {'id': len(self.server.calls), 'comments': body.get('comments', [])}
        elif path.endswith('/labels'):
            value = [{'name': label} for label in body['labels']]
        elif '/git/trees/' in path:
            value = {'tree': [{'path': 'pricing.py', 'type': 'blob', 'size': 40}]}
        elif '/contents/' in path:
            old = base64.b64encode(b'def double(n): return n + 2\n').decode()
            value = {'path': 'pricing.py', 'content': old, 'sha': 'b' * 40}
        elif '/git/ref' in path:
            value = {'object': {'sha': 'c' * 40}}
        elif path.endswith('/merge'):
            value = {'merged': self.server.merge_confirmed}
        elif '/pulls/' in path and self.headers.get('Accept') == 'application/vnd.github.diff':
            content_type = 'text/plain'
            value = ('diff --git a/pricing.py b/pricing.py\n--- a/pricing.py\n+++ b/pricing.py\n'
                     '@@ -1 +1 @@\n-def double(n): return n + 2\n+def double(n): return n * 2\n')
        elif path.endswith('/pulls') or '/pulls/' in path:
            value = {'number': 12, 'title': 'Fixture PR', 'head': {'sha': 'a' * 40}}
        elif path.endswith('/comments') or path == '/mail-preview':
            value = {'id': len(self.server.calls)}
        else:
            status, value = 404, {'message': 'Unexpected fixture request'}
        raw = (json.dumps(value) if content_type == 'application/json' else value).encode()
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    do_GET = do_POST = do_PUT = respond

    @staticmethod
    def model_response(body):
        prompt = json.dumps(body['messages'], ensure_ascii=False)
        if 'Классифицируй GitHub Issue' in prompt:
            kind = next((kind for kind in ('bug', 'task', 'feature') if f'Fixture {kind}' in prompt), 'bug')
            reply = {'output': {'type': kind, 'confidence': 0.79 if 'Fixture vague' in prompt else 0.8,
                                'reason': 'Fixture classification'}}
        elif 'исправляет баг по bug report' in prompt:
            reply = {'output': {'path': 'pricing.py', 'new_content': 'def double(n): return n * 2\n',
                                'commit_message': 'Fix doubling', 'explanation': 'Use multiplication'}}
        elif 'Проверь автоматическое исправление' in prompt:
            reply = {'output': {'verdict': 'approve', 'serious_issues': [], 'summary': 'Correct formula'}}
        elif 'Ниже diff' in prompt:
            hunks = re.findall(r'### (H\d+) —', prompt)
            reply = {'summary': 'Fixture review', 'comments': [
                {'hunk': hunk, 'severity': 'ok', 'comment': 'Reviewed'} for hunk in hunks]}
        else:
            reply = 'Fixture AI weekly comment.'
        content = reply if isinstance(reply, str) else json.dumps(reply)
        return {'id': 'fixture', 'object': 'chat.completion', 'created': 0, 'model': body['model'],
                'choices': [{'index': 0, 'finish_reason': 'stop',
                             'message': {'role': 'assistant', 'content': content}}]}


class N8n:
    def __init__(self, url):
        self.url = url
        self.client = build_opener(ProxyHandler({}), HTTPCookieProcessor(http.cookiejar.CookieJar()))

    def request(self, path, body=None, method=None):
        data = json.dumps(body).encode() if body is not None else None
        request = Request(f'{self.url}/rest{path}', data=data, method=method,
                          headers={'Content-Type': 'application/json', 'push-ref': 'practice-test'})
        try:
            with self.client.open(request, timeout=10) as response:
                return json.load(response)['data']
        except HTTPError as error:
            message = error.reason
            if 'application/json' in error.headers.get('Content-Type', ''):
                message = json.load(error).get('message', message)
            raise RuntimeError(f'{request.get_method()} {path}: {error.code} {message}') from error

    def run(self, id, trigger, event=None):
        if event is not None:
            self.request(f'/workflows/{id}', {'pinData': {trigger: [{'json': event}]}}, 'PATCH')
        result = self.request(f'/workflows/{id}/run', {'triggerToStartFrom': {'name': trigger}})
        execution = result['executionId']
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline:
            state = self.request(f'/executions/{execution}')['status']
            if state == 'success':
                return
            if state not in ('new', 'running'):
                raise RuntimeError(f'n8n execution {execution} in {id} ended with {state}')
            time.sleep(.2)
        raise RuntimeError(f'n8n execution {execution} in {id} timed out')


def adapt_workflow(workflow, fixture_url):
    for node in workflow['nodes']:
        parameters = node['parameters']
        if node['type'] == 'n8n-nodes-base.httpRequest':
            node.pop('credentials', None)
            parameters.pop('nodeCredentialType', None)
            parameters['authentication'] = 'none'
        if node['name'] == 'Config':
            fields = {item['name']: item for item in parameters['assignments']['assignments']}
            fields['api_base']['value'] = fixture_url
        if node['type'] == 'n8n-nodes-base.gmail':
            node.pop('credentials', None)
            node.update(type='n8n-nodes-base.httpRequest', typeVersion=4.2, parameters={
                'method': 'POST', 'url': f'{fixture_url}/mail-preview', 'sendBody': True,
                'specifyBody': 'json', 'jsonBody': '={{ JSON.stringify($json) }}', 'options': {},
            })
    workflow['active'] = False


def event(fixture_url, name, **body):
    repository = {'url': f'{fixture_url}/repos/test/practice', 'full_name': 'test/practice',
                  'default_branch': 'main'}
    return {'headers': {'x-github-event': name}, 'body': {'repository': repository, **body}}


def test_code_review(n8n, server, url):
    workflow = 'p7CodeReview0001'
    pr = {'number': 12, 'pull_request': {'url': f'{url}/pulls/12'}}
    n8n.run(workflow, 'GitHub Trigger', event(url, 'pull_request', action='opened', **pr))
    for command in ('/make_ai_review', '/make_other_ai_review'):
        n8n.run(workflow, 'GitHub Trigger', event(url, 'issue_comment', action='created',
                    issue=pr, comment={'body': command}))
    models = [body['model'] for _, path, body, _ in server.calls if path == '/v1/chat/completions']
    assert models == ['kimi-k2.6', 'kimi-k2.5'], models
    reviews = [body for _, path, body, _ in server.calls if path.endswith('/reviews')]
    assert len(reviews) == 2 and all(len(review['comments']) == 1 for review in reviews)
    skipped = [body for _, path, body, _ in server.calls if path.endswith('/comments')]
    assert len(skipped) == 1 and 'пропущен' in skipped[0]['body']
    print('n8n 7.1: оба inline-ревью и пропуск повтора подтверждены', flush=True)


def test_support(n8n, server, url):
    for number, kind in enumerate(('bug', 'task', 'feature', 'vague'), 1):
        before = len(server.calls)
        issue = {'number': number, 'title': f'Fixture {kind}', 'body': 'Details',
                 'html_url': f'{url}/issues/{number}', 'user': {'login': 'fixture-author'},
                 'author_association': 'NONE' if kind == 'vague' else 'OWNER'}
        n8n.run('p7IssueTriage001', 'GitHub Trigger', event(url, 'issues', action='opened', issue=issue))
        trace = server.calls[before:]
        labels = [body['labels'] for _, path, body, _ in trace if path.endswith('/labels')]
        assert labels == [['needs-triage' if kind == 'vague' else kind]], labels
        assert sum(path.endswith('/comments') for _, path, _, _ in trace) == int(kind != 'vague')
    print('n8n 7.2: четыре маршрута Issue и эскалация без комментария подтверждены', flush=True)

    n8n.run('p7WeeklyStats001', 'Manual run (test)')
    searches = [query for _, path, _, query in server.calls if path == '/search/issues']
    assert len(searches) == 5 and searches[1]['page'] == ['2']
    messages = [body for _, path, body, _ in server.calls if path == '/mail-preview']
    assert len(messages) == 1
    assert '+98</span>' in messages[0]['html'] and 'Fixture AI weekly comment.' in messages[0]['html']
    print('n8n 7.2: пагинация, Data Table, Δ и HTML письма подтверждены', flush=True)

    for number, confirmed in ((11, True), (12, False)):
        before = len(server.calls)
        server.merge_confirmed = confirmed
        issue = {'number': number, 'title': 'Wrong doubling', 'body': 'Expected double(5) = 10', 'state': 'open'}
        n8n.run('p7BugfixAuto001', 'GitHub Trigger', event(url, 'issues', action='labeled',
                    issue=issue, label={'name': 'bug'}))
        trace = server.calls[before:]
        assert [body['sha'] for _, path, body, _ in trace if path.endswith('/merge')] == ['a' * 40]
        assert any(path.endswith('/comments') for _, path, _, _ in trace) == confirmed
    print('n8n 7.2: запрос merge привязан к SHA, успех объявляется по ответу API', flush=True)


@contextmanager
def running_n8n(command, environment, log_path):
    with log_path.open('w') as log:
        process = subprocess.Popen([*command, 'start'], env=environment, stdout=log,
                                   stderr=subprocess.STDOUT, start_new_session=True)
        try:
            yield process
        finally:
            if process.poll() is None:
                os.killpg(process.pid, signal.SIGTERM)
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    os.killpg(process.pid, signal.SIGKILL)
                    process.wait()


def available_ports():
    with socket.socket() as editor, socket.socket() as broker:
        for listener in (editor, broker):
            listener.bind(('127.0.0.1', 0))
        return str(editor.getsockname()[1]), str(broker.getsockname()[1])


def main(part, source_paths, command):
    with tempfile.TemporaryDirectory(prefix='practice07-n8n-test-') as directory, \
            ThreadingHTTPServer(('127.0.0.1', 0), Fixtures) as fixture:
        fixture.calls = []
        fixture_url = f'http://127.0.0.1:{fixture.server_port}'
        thread = Thread(target=fixture.serve_forever, daemon=True)
        thread.start()
        root = Path(directory)
        imports = root / 'imports'
        imports.mkdir()
        workflows = []
        for path in map(Path, source_paths):
            workflow = json.loads(path.read_text(encoding='utf-8'))
            adapt_workflow(workflow, fixture_url)
            (imports / path.name).write_text(json.dumps(workflow), encoding='utf-8')
            workflows.append(workflow)
        environment = {name: value for name, value in os.environ.items()
                       if not name.startswith(('N8N_', 'DB_', 'EXECUTIONS_', 'QUEUE_BULL_')) and name != 'WEBHOOK_URL'}
        port, broker = available_ports()
        environment.update(N8N_USER_FOLDER=directory, N8N_PORT=port, N8N_RUNNERS_BROKER_PORT=broker,
                           N8N_LISTEN_ADDRESS='127.0.0.1', N8N_HOST='127.0.0.1', N8N_SECURE_COOKIE='false',
                           N8N_DIAGNOSTICS_ENABLED='false', N8N_VERSION_NOTIFICATIONS_ENABLED='false',
                           N8N_TEMPLATES_ENABLED='false', N8N_PERSONALIZATION_ENABLED='false')
        import_log = root / 'import.log'
        print(f'Импортирую {len(workflows)} workflow в тестовый n8n для практики {part}…', flush=True)
        with import_log.open('w') as log:
            result = subprocess.run([*command, 'import:workflow', '--separate', f'--input={imports}'],
                                    env=environment, stdout=log, stderr=subprocess.STDOUT)
        if result.returncode:
            raise RuntimeError('\n'.join(import_log.read_text().splitlines()[-20:]))
        n8n = N8n(f'http://127.0.0.1:{port}')
        runtime_log = root / 'runtime.log'
        try:
            with running_n8n(command, environment, runtime_log) as process:
                for _ in range(120):
                    try:
                        with n8n.client.open(f'{n8n.url}/healthz/readiness', timeout=1):
                            break
                    except (URLError, TimeoutError):
                        if process.poll() is not None:
                            raise RuntimeError('n8n exited before the editor started')
                        time.sleep(.25)
                else:
                    raise RuntimeError('n8n editor did not start')
                n8n.request('/owner/setup', {'email': 'practice-test@example.test', 'firstName': 'Practice',
                            'lastName': 'Test', 'password': 'Aa1-' + secrets.token_urlsafe(24)})
                credential = n8n.request('/credentials', {'name': 'Local model fixture', 'type': 'openAiApi',
                    'data': {'apiKey': 'fixture-key', 'url': f'{fixture_url}/v1'}}, 'POST')
                for workflow in workflows:
                    models = [node for node in workflow['nodes'] if node['type'].endswith('.lmChatOpenAi')]
                    if not models:
                        continue
                    for model in models:
                        model['credentials'] = {'openAiApi': {'id': credential['id'], 'name': credential['name']}}
                    n8n.request(f"/workflows/{workflow['id']}", {'nodes': workflow['nodes']}, 'PATCH')
                n8n.run('p7SetupTables001', 'Run once')
                if part == '7.1':
                    test_code_review(n8n, fixture, fixture_url)
                else:
                    test_support(n8n, fixture, fixture_url)
        except Exception:
            print('\n'.join(runtime_log.read_text().splitlines()[-16:]), file=sys.stderr)
            raise
        finally:
            fixture.shutdown()
            thread.join()


if __name__ == '__main__':
    separator = sys.argv.index('--')
    main(sys.argv[1], sys.argv[2:separator], sys.argv[separator + 1:])
