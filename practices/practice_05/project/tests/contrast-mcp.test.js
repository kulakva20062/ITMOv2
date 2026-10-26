import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// Прогоняет MCP-сервер .claude/mcp/contrast_server.py по stdio и возвращает ответы по id.
function callServer(messages) {
  const input = messages.map((m) => JSON.stringify({ jsonrpc: '2.0', ...m })).join('\n') + '\n';
  const run = spawnSync('python3', ['.claude/mcp/contrast_server.py'], { input, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  return Object.fromEntries(run.stdout.trim().split('\n').map((line) => {
    const reply = JSON.parse(line);
    return [reply.id, reply];
  }));
}

const call = (id, args) => ({ id, method: 'tools/call', params: { name: 'check_contrast', arguments: args } });

test('MCP: initialize и tools/list отдают check_contrast', () => {
  const replies = callServer([
    { id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } },
    { method: 'notifications/initialized' },
    { id: 2, method: 'tools/list' },
  ]);
  assert.equal(replies[1].result.serverInfo.name, 'contrast');
  assert.deepEqual(replies[2].result.tools.map((t) => t.name), ['check_contrast']);
});

test('MCP: эталон WCAG — чёрный на белом 21:1', () => {
  const { 1: reply } = callServer([call(1, { foreground: '#000', background: '#FFFFFF' })]);
  const result = JSON.parse(reply.result.content[0].text);
  assert.equal(result.ratio, 21);
  assert.equal(result.AAA.pass, true);
});

test('MCP: токены палитры из styles.css проходят AA', () => {
  const replies = callServer([
    call(1, { foreground: '--ink', background: '--paper' }),
    call(2, { foreground: '--ink-2', background: '--paper' }),
    call(3, { foreground: '--stamp', background: '--paper' }),
  ]);
  for (const id of [1, 2, 3]) {
    const result = JSON.parse(replies[id].result.content[0].text);
    assert.equal(result.AA.pass, true, `${result.foreground.input}: ${result.ratio}`);
  }
});

test('MCP: ошибочный вход возвращает isError с объяснением', () => {
  const replies = callServer([
    call(1, { foreground: '#12345', background: '#fff' }),
    call(2, { foreground: '--no-such-token', background: '#fff' }),
    call(3, { foreground: '#000', background: '#fff', text_size: 'huge' }),
    { id: 4, method: 'tools/call', params: { name: 'nope', arguments: {} } },
  ]);
  for (const id of [1, 2, 3]) {
    assert.equal(replies[id].result.isError, true);
    assert.match(replies[id].result.content[0].text, /^Ошибка входа: /);
  }
  assert.equal(replies[4].error.code, -32601);
});
