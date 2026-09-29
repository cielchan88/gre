import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { estimateEssay } from '../public/js/essay-score.js';
import { parseResult, validateInput } from '../lib/essay-ai.js';

const weak = 'I think technology is good. It is good because it helps. Technology is good for people. I like it a lot.';
const strong = `I largely agree that governments should moderate the pace of technological change, although the claim needs qualification.

First, institutions adapt more slowly than inventions. Consider the spread of industrial machinery in nineteenth-century Britain: displaced weavers had no retraining systems, and the resulting hardship was severe. Studies of that period show that gains arrived decades after the disruption. Therefore, a measured rollout can protect vulnerable workers.

However, restraint has costs. Medical advances such as vaccines saved millions precisely because they were deployed quickly; delaying them for adaptation would have been indefensible. Moreover, regulators often lack the expertise to judge which technologies are dangerous, so blanket limits risk suppressing beneficial innovation. Nevertheless, targeted oversight of high-risk applications remains prudent.

In conclusion, governments should not slow technology generally, but they should slow specific deployments where social institutions clearly cannot absorb the shock, while funding transition support. Ultimately, the wisest policy distinguishes between kinds of change rather than treating all innovation alike. ${'Furthermore, evidence from several countries supports this graduated approach, for instance in data privacy law. '.repeat(3)}`;

test('heuristic: empty/short essays score low, structured essay scores higher', () => {
  assert.equal(estimateEssay('').score, 0);
  const a = estimateEssay(weak), b = estimateEssay(strong);
  assert.ok(a.score <= 1.5, `weak ${a.score}`);
  assert.ok(b.score >= 4 && b.score <= 6, `strong ${b.score}`);
  assert.ok(b.score > a.score);
  assert.equal(b.score * 2 % 1, 0);
});

test('heuristic: word count caps the score', () => {
  const short = strong.split(/\s+/).slice(0, 90).join(' ');
  assert.ok(estimateEssay(short).score <= 2);
});

test('parseResult clamps and sanitizes model output', () => {
  const r = parseResult('Here you go:\n{"score": 9.3, "subscores": {"position": -2, "development": 4.2}, "summary": "ok", "strengths": ["a", 5], "improvements": [], "language_errors": [{"quote":"x","fix":"y"},{"bad":1}]}');
  assert.equal(r.score, 6);
  assert.equal(r.subscores.position, 0);
  assert.equal(r.subscores.development, 4);
  assert.deepEqual(r.strengths, ['a']);
  assert.equal(r.language_errors.length, 1);
  assert.throws(() => parseResult('no json here'));
});

test('validateInput rejects short/oversized/invalid bodies', () => {
  assert.ok(validateInput({ essay: 'too short', prompt: 'p' }));
  assert.ok(validateInput({ essay: 'word '.repeat(2500), prompt: 'p' }));
  assert.ok(validateInput(null));
  assert.equal(validateInput({ essay: 'word '.repeat(60), prompt: 'p' }), null);
});

test('server endpoint: 503 without key, proxies to (fake) Anthropic with key', async () => {
  let seen;
  const fake = http.createServer((req, res) => {
    let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => {
      seen = { headers: req.headers, body: JSON.parse(b) };
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ content: [{ type: 'text', text: '{"score":4.5,"subscores":{"position":4,"development":5,"organization":4,"language":5},"summary":"Bagus","strengths":["x"],"improvements":["y"],"language_errors":[]}' }] }));
    });
  });
  await new Promise((r) => fake.listen(0, r));
  const start = (port, env) => new Promise((resolve) => {
    const p = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(port), ...env }, stdio: 'pipe' });
    p.stdout.on('data', () => resolve(p));
  });
  const post = (port) => fetch(`http://127.0.0.1:${port}/api/score-essay`, { method: 'POST', body: JSON.stringify({ prompt: 'P', essay: 'word '.repeat(80) }) });
  const s1 = await start(18881, { ANTHROPIC_API_KEY: '' });
  assert.equal((await post(18881)).status, 503);
  assert.equal((await (await fetch('http://127.0.0.1:18881/api/config')).json()).ai, false);
  s1.kill();
  const s2 = await start(18882, { ANTHROPIC_API_KEY: 'test-key', ANTHROPIC_BASE_URL: `http://127.0.0.1:${fake.address().port}` });
  const res = await post(18882);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).score, 4.5);
  assert.equal(seen.headers['x-api-key'], 'test-key');
  assert.match(seen.body.messages[0].content, /<essay>/);
  s2.kill(); fake.close();
});
