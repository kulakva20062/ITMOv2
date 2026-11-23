import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const part = process.env.PRACTICE_PART;
assert.ok(['7.1', '7.2'].includes(part), 'PRACTICE_PART must be 7.1 or 7.2');
const directory = new URL(`../../practice_0${part}/workflows/`, import.meta.url);
const workflows = readdirSync(directory)
  .filter(name => name.endsWith('.workflow.json'))
  .map(name => JSON.parse(readFileSync(new URL(name, directory), 'utf8')));

function getNode(workflow, name) {
  const node = workflow.nodes.find(node => node.name === name);
  assert.ok(node, `${workflow.name} is missing ${name}`);
  return node;
}

function runCode(workflow, name, incoming, outputs = {}) {
  const node = getNode(workflow, name);
  const items = values => values.map(json => ({ json }));
  const lookup = name => ({
    first: () => ({ json: outputs[name][0] }),
    all: () => items(outputs[name]),
  });
  const execute = new Function('$', '$input', '$json', '$execution', node.parameters.jsCode);
  return execute(lookup, { all: () => items(incoming) }, incoming[0], { id: 'test' })
    .map(item => item.json);
}

for (const workflow of workflows) {
  test(`${workflow.name} has valid connections and Code nodes`, () => {
    const names = new Set(workflow.nodes.map(node => node.name));
    assert.equal(names.size, workflow.nodes.length);
    for (const [source, connections] of Object.entries(workflow.connections)) {
      assert.ok(names.has(source), `missing source ${source}`);
      for (const connection of Object.values(connections).flat(2).filter(Boolean)) {
        assert.ok(names.has(connection.node), `missing destination ${connection.node}`);
      }
    }
    for (const node of workflow.nodes.filter(node => node.type === 'n8n-nodes-base.code')) {
      assert.doesNotThrow(() => new Function(node.parameters.jsCode), node.name);
    }
  });
}

if (part === '7.1') {
  test('splits review requests and publishes one comment for each hunk', () => {
    const [review] = workflows;
    const sha = 'a'.repeat(40);
    const hunks = Array.from({ length: 12 }, (_, index) => {
      const line = index * 5 + 1;
      return `@@ -${line},1 +${line},1 @@\n-old\n+new`;
    }).join('\n');
    const batches = runCode(review, 'Split diff into hunks', [{ filename: 'demo.py', patch: hunks }], {
      Context: [{ pr_number: 1, model: 'test-model' }],
      'Get PR': [{ title: 'Demo', head: { sha } }],
    });
    assert.deepEqual(batches.map(batch => batch.hunks.length), [10, 2]);

    const replies = batches.map(batch => ({
      text: JSON.stringify({
        comments: batch.hunks.map(hunk => ({ hunk: hunk.id, severity: 'ok', comment: 'Reviewed' })),
      }),
    }));
    const outputs = { 'Split diff into hunks': batches };
    const [result] = runCode(review, 'Build inline review', replies, outputs);
    assert.equal(result.review.commit_id, sha);
    assert.equal(result.review.comments.length, 12);
    assert.equal(result.review.comments.at(-1).line, 56);
    assert.throws(() => runCode(review, 'Build inline review', replies.slice(0, 1), outputs), /H11, H12/);
  });
}

if (part === '7.2') {
  const byId = id => workflows.find(workflow => workflow.id === id);

  test('unknown issues take the comment-free branch and classifications use the sub-workflow', () => {
    const workflow = byId('p7IssueTriage001');
    const classify = getNode(workflow, 'Classify (Execute Sub-workflow)');
    const classifier = byId(classify.parameters.workflowId.value);
    assert.ok(classifier);
    const [unknown] = runCode(classifier, 'Normalize type & confidence', [{ output: { type: 'other', confidence: 0.79 } }]);
    assert.equal(unknown.type, 'unknown');
    assert.equal(workflow.connections['Already processed?'].main[1][0].node, classify.name);
    assert.equal(workflow.connections['Has comment? (needs-triage → no)'].main[1][0].node, 'Data Table: mark issue processed');
    assert.equal(workflow.connections['Post template comment'].main[0][0].node, 'First-time contributor?');
  });

  test('weekly digest aggregates all pages and rejects incomplete search results', () => {
    const weekly = byId('p7WeeklyStats001');
    const issues = Array.from({ length: 101 }, () => ({ labels: [{ name: 'bug' }], user: { login: 'demo' } }));
    const opened = 'GH: issues opened this week';
    const outputs = {
      Config: [{ owner: 'test', repo: 'demo', since: '2026-11-09', until: '2026-11-16' }],
      [opened]: [{ total_count: 101, items: issues.slice(0, 100) }, { total_count: 101, items: issues.slice(100) }],
      'GH: issues closed this week': [{ total_count: 0, items: [] }],
      'GH: PRs opened this week': [{ total_count: 0, items: [] }],
      'GH: PRs merged this week': [{ total_count: 0, items: [] }],
    };
    const [stats] = runCode(weekly, 'Group by type & author', [], outputs);
    assert.equal(stats.issues_opened, 101);
    assert.equal(stats.by_author[0].bug, 101);
    assert.equal(stats.repo, 'test/demo');
    const [digest] = runCode(weekly, 'Compute Δ vs previous week', [{ week_start: '2026-11-02', bug: 3 }], {
      'Group by type & author': [stats],
    });
    assert.equal(digest.delta.bug, 98);
    outputs[opened].pop();
    assert.throws(() => runCode(weekly, 'Group by type & author', [], outputs), /100 из 101/);
  });
}
