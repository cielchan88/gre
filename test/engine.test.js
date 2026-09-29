import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../public/js/engine.js';
import { GENERATORS, generate } from '../public/js/gen-quant.js';
import { VERBAL, PASSAGES } from '../public/js/bank-verbal.js';
import { QUANT_STATIC } from '../public/js/bank-quant.js';

const validate = (q) => {
  assert.ok(q.stem !== undefined || q.type === 'qc', q.id);
  assert.ok(q.difficulty >= 1 && q.difficulty <= 5, q.id);
  const inRange = (i, n) => Number.isInteger(i) && i >= 0 && i < n;
  switch (q.type) {
    case 'tc': q.blanks.forEach((b, i) => assert.ok(inRange(q.answer[i], b.length), q.id)); assert.equal(q.answer.length, q.blanks.length); break;
    case 'se': assert.equal(q.options.length, 6); assert.equal(q.answer.length, 2); q.answer.forEach((a) => assert.ok(inRange(a, 6))); break;
    case 'rc': assert.ok(PASSAGES[q.passage], q.id); assert.ok(inRange(q.answer, q.options.length), q.id); break;
    case 'rcn': case 'mcn': q.answer.forEach((a) => assert.ok(inRange(a, q.options.length), q.id)); assert.ok(q.answer.length >= 1); break;
    case 'rcsel': assert.ok(inRange(q.answer, PASSAGES[q.passage].paras.flat().length)); break;
    case 'qc': assert.ok(inRange(q.answer, 4), q.id); assert.ok(q.qa && q.qb); break;
    case 'mc1': assert.ok(inRange(q.answer, q.options.length), q.id); break;
    case 'ne': assert.ok(q.answer.value !== undefined || q.answer.num !== undefined, q.id); break;
    default: assert.fail('unknown type ' + q.type);
  }
  if (q.options) assert.equal(new Set(q.options).size, q.options.length, `duplicate options in ${q.id}: ${q.options}`);
  assert.ok(q.explain, q.id);
};

test('handwritten banks are well-formed with unique ids', () => {
  const all = [...VERBAL, ...QUANT_STATIC];
  assert.equal(new Set(all.map((q) => q.id)).size, all.length);
  all.forEach(validate);
});

test('generators produce valid questions at every level', () => {
  for (const g of GENERATORS) for (let d = 1; d <= 5; d++) for (let s = 1; s <= 150; s++) {
    const q = generate(g, d, s);
    validate(q);
    assert.ok(Number.isFinite(q.answer?.value ?? 0), `${q.id} non-finite`);
  }
});

test('generator math spot checks', () => {
  for (let s = 1; s <= 200; s++) {
    const q = generate('quad_roots', 3, s);
    const { a, b, c, roots } = q.meta;
    roots.forEach((r) => assert.equal(a * r * r + b * r + c, 0));
    q.answer.forEach((i) => assert.ok(roots.includes(Number(q.options[i].replace('−', '-')))));
    assert.equal(q.answer.length, 2);
  }
});

test('grading: numeric entry accepts fractions/decimals, rejects garbage', () => {
  const q = { type: 'ne', answer: { num: 1, den: 4 } };
  assert.ok(E.grade(q, { text: '0.25' }));
  assert.ok(E.grade(q, { text: '1/4' }));
  assert.ok(E.grade(q, { num: '2', den: '8' }));
  assert.ok(!E.grade(q, { text: '0.3' }));
  assert.ok(!E.grade(q, { text: 'abc' }));
  assert.ok(E.grade({ type: 'ne', answer: { value: -3 } }, { text: '−3' }));
  assert.ok(E.grade({ type: 'se', answer: [1, 4] }, [4, 1]));
  assert.ok(!E.grade({ type: 'se', answer: [1, 4] }, [1]));
});

function simulate(correctFn) {
  const st = { theta: { V: 3, Q: 3 }, seen: {} };
  const s = E.createPractice(st, E.PLAN[0]);
  let it;
  while ((it = E.nextPracticeItem(s, st))) { it.resp = correctFn(it.q); E.checkAnswer(s, it); }
  return s;
}
const solve = (q) => (q.type === 'ne' ? (q.answer.num !== undefined ? { num: q.answer.num, den: q.answer.den } : { text: String(q.answer.value) }) : q.answer);

test('practice module: 20 questions, 10 verbal + 10 quant', () => {
  const s = simulate(solve);
  assert.equal(s.items.length, 20);
  assert.equal(s.items.filter((i) => i.q.section === 'V').length, 10);
  assert.equal(new Set(s.items.map((i) => i.q.id)).size, 20);
});

test('adaptive: correct answers raise difficulty, wrong answers lower it', () => {
  const up = simulate(solve), down = simulate(() => null);
  const avg = (s, from, to) => s.items.slice(from, to).reduce((a, i) => a + i.q.difficulty, 0) / (to - from);
  assert.ok(up.theta.V > 4 && up.theta.Q > 4);
  assert.ok(avg(up, 14, 20) > avg(up, 0, 6));
  assert.ok(down.theta.V < 2 && down.theta.Q < 2);
  assert.ok(avg(down, 14, 20) < avg(down, 0, 6));
});

test('mock: section sizes and tier-dependent difficulty', () => {
  const st = { theta: { V: 3, Q: 3 }, seen: {} };
  for (const def of E.MOCK_SECTIONS) {
    const mean = {};
    for (const tier of ['easy', 'medium', 'hard']) {
      let tot = 0, cnt = 0;
      for (let k = 0; k < 20; k++) {
        const sess = { seed: 1000 + k, used: [] };
        const items = E.buildMockSection(def, tier, st, sess);
        assert.equal(items.length, def.n);
        for (const it of items) { tot += it.q.difficulty; cnt++; }
      }
      mean[tier] = tot / cnt;
    }
    assert.ok(mean.easy < mean.medium && mean.medium < mean.hard, `${def.key} ${JSON.stringify(mean)}`);
  }
});

test('mock routing and scoring are monotonic and within 130-170', () => {
  assert.equal(E.routeTier(0.2), 'easy');
  assert.equal(E.routeTier(0.55), 'medium');
  assert.equal(E.routeTier(0.9), 'hard');
  assert.equal(E.scaledScore(0, 0, 'easy'), 130);
  assert.equal(E.scaledScore(1, 1, 'hard'), 170);
  assert.ok(E.scaledScore(0.8, 0.8, 'hard') > E.scaledScore(0.8, 0.8, 'medium'));
  assert.ok(E.scaledScore(0.8, 0.8, 'easy') < E.scaledScore(0.5, 0.5, 'hard'));
});

test('plan: 5 daily modules then a mock', () => {
  assert.equal(E.PLAN.length, 36);
  E.PLAN.forEach((p, i) => assert.equal(p.kind === 'mock', i % 6 === 5));
});
