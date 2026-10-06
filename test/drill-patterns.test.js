import test from 'node:test';
import assert from 'node:assert/strict';
import { generate, generateDISet } from '../public/js/gen-quant.js';
import { strategyFor } from '../public/js/strategy.js';
import { VERBAL } from '../public/js/bank-verbal.js';

test('digit reversal: marked divisors divide every difference, unmarked ones fail for some number', () => {
  for (const d of [2, 4]) {
    const q = generate('digit_reverse', d, 1);
    const diffs = [];
    if (d >= 3) { for (let a = 1; a <= 9; a++) for (let b = 0; b <= 9; b++) for (let c = 1; c <= 9; c++) if (a !== c) diffs.push(Math.abs(99 * (a - c))); }
    else for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) if (a !== b) diffs.push(Math.abs(9 * (a - b)));
    q.options.forEach((o, i) => assert.equal(diffs.every((x) => x % Number(o) === 0), q.answer.includes(i), `divisor ${o}`));
  }
});

test('counting solutions matches brute force', () => {
  for (let s = 1; s <= 60; s++) for (const d of [2, 4, 5]) {
    const q = generate('stars_bars', d, s);
    const N = Number(q.stem.match(/= (\d+)\?/)[1]);
    let n = 0;
    if (q.stem.includes('pairs')) { for (let x = 1; x < N; x++) n++; }
    else { const lo = q.stem.includes('nonnegative') ? 0 : 1; for (let x = lo; x <= N; x++) for (let y = lo; y <= N; y++) { const z = N - x - y; if (z >= lo) n++; } }
    assert.equal(q.answer.value, n, q.stem);
  }
});

test('average-of-expressions comparison is correct for random values with the stated mean', () => {
  for (let s = 1; s <= 80; s++) {
    const q = generate('avg_expr', 1 + (s % 5), s);
    const m = Number(q.info.match(/is (\d+)/)[1]);
    const vals = { a: Math.random() * 20 - 5, b: Math.random() * 20 - 5, c: Math.random() * 20 - 5 };
    vals.d = 4 * m - vals.a - vals.b - vals.c;
    const exprs = q.qb.replace('The average of ', '').split(', ');
    const evalE = (e) => Function('a', 'b', 'c', 'd', `return ${e.replace(/−/g, '-').replace(/(\d)([a-d])/g, '$1*$2')};`)(vals.a, vals.b, vals.c, vals.d);
    const B = exprs.reduce((t, e) => t + evalE(e), 0) / 4, A = Number(q.qa.replace('−', '-'));
    const expected = Math.abs(A - B) < 1e-9 ? 2 : A > B ? 0 : 1;
    assert.equal(q.answer, expected, `${q.qa} vs ${q.qb}`);
  }
});

test('meeting distance and ratio minimum are consistent', () => {
  for (let s = 1; s <= 60; s++) {
    const q = generate('meet_before', 3, s);
    const [v1, v2] = [...q.stem.matchAll(/constant (\d+)/g)].map((m) => Number(m[1]));
    const t = Number(q.stem.match(/apart are they (\d+) minutes/)[1]);
    assert.equal(q.answer.value, ((v1 + v2) * t) / 60);
    const r = generate('ratio_min', 4, s);
    const parts = r.stem.match(/ratio (\d+) : (\d+) : (\d+)/).slice(1).map(Number), N = Number(r.stem.match(/at least (\d+)/)[1]);
    const sum = parts[0] + parts[1] + parts[2];
    let k = 1; while (k * sum < N) k++;
    assert.equal(r.answer.value, parts[2] * k);
  }
});

test('line-graph data sets: five questions, difficulty 1-5', () => {
  let found = 0;
  for (let s = 1; s <= 300 && found < 40; s++) {
    const qs = generateDISet(s);
    if (!qs[0].dataId.includes(':line:')) continue;
    found++;
    assert.deepEqual(qs.map((q) => q.difficulty), [1, 2, 3, 4, 5]);
  }
  assert.ok(found > 10);
});

test('every question gets a strategy tip', () => {
  for (const q of VERBAL) assert.ok(strategyFor(q)?.tip, q.id);
  for (const id of ['digit_reverse', 'qc_products', 'ratio_min', 'meet_before', 'avg_expr', 'linear_eq', 'table_mc']) assert.ok(strategyFor(generate(id, 3, 1)).tip, id);
  assert.equal(strategyFor(generate('qc_numeric', 5, 3)).name, 'Plugging In');
});
