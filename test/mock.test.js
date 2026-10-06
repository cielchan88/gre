import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../public/js/engine.js';
import { generateDISet } from '../public/js/gen-quant.js';
import { calc, press } from '../public/js/ui-calc.js';

test('data interpretation sets: 4 well-formed questions sharing one display, up to difficulty 5', () => {
  for (let s = 1; s <= 500; s++) {
    const qs = generateDISet(s);
    assert.equal(qs.length, 4);
    assert.equal(Math.max(...qs.map((q) => q.difficulty)), 5);
    assert.equal(new Set(qs.map((q) => q.data)).size, 1);
    for (const q of qs) {
      assert.equal(q.section, 'Q');
      if (q.type === 'ne') assert.ok(Number.isFinite(q.answer.value ?? q.answer.num / q.answer.den), q.id);
      else {
        assert.equal(new Set(q.options).size, q.options.length, q.id);
        [].concat(q.answer).forEach((a) => assert.ok(a >= 0 && a < q.options.length, q.id));
        if (q.type === 'mcn') assert.ok(q.answer.length >= 1, q.id);
      }
    }
  }
});

test('mock sections follow the real layout: TC first in Verbal, QC first + data set in Quant', () => {
  const st = { theta: { V: 3, Q: 3 }, seen: {} };
  for (let k = 0; k < 30; k++) {
    for (const def of E.MOCK_SECTIONS) {
      const items = E.buildMockSection(def, 'medium', st, { seed: 500 + k, used: [] });
      assert.equal(items.length, def.n);
      const types = items.map((i) => i.q.type);
      if (def.section === 'V') assert.ok(types.slice(0, def.mix.tc).every((t) => t === 'tc'), types.join());
      else {
        assert.ok(types.slice(0, def.mix.qc).every((t) => t === 'qc'), types.join());
        const di = items.filter((i) => i.q.data);
        assert.equal(di.length, def.mix.di);
        assert.ok(di.every((i) => i.group && i.group.to - i.group.from + 1 === def.mix.di));
      }
      for (const it of items) if (it.group) assert.equal(items[it.group.from - 1].group?.from, it.group.from);
    }
  }
});

test('mock order: essay first, Verbal/Quant sections alternate in either order', () => {
  const seen = new Set();
  for (let i = 0; i < 40; i++) {
    const m = E.createMock({ theta: { V: 3, Q: 3 } }, 1, true, i);
    const keys = m.mock.sections.map((s) => s.key).join(',');
    seen.add(keys);
    assert.ok(['V1,Q1,V2,Q2', 'Q1,V1,Q2,V2'].includes(keys));
  }
  assert.equal(seen.size, 2);
});

test('review status helpers: incomplete vs answered', () => {
  const se = { type: 'se', answer: [0, 1] }, tc = { type: 'tc', blanks: [[1], [1]], answer: [0, 0] }, ne = { type: 'ne', fraction: true, answer: { num: 1, den: 2 } };
  assert.ok(E.isPartial(se, [1]) && !E.isPartial(se, [1, 2]) && !E.isPartial(se, []));
  assert.ok(E.isPartial(tc, [0, null]) && !E.isPartial(tc, [null, null]));
  assert.ok(E.isPartial(ne, { num: '1', den: '' }) && !E.isPartial(ne, { num: '1', den: '2' }));
});

test('calculator follows order of operations, parentheses and memory', () => {
  const run = (seq) => { press('C'); seq.split(' ').forEach(press); return calc.entry; };
  assert.equal(run('2 + 3 * 4 ='), '14');
  assert.equal(run('( 2 + 3 ) * 4 ='), '20');
  assert.equal(run('2 * ( 3 + ( 4 - 1 ) ) ='), '12');
  assert.equal(run('1 0 / 4 ='), '2.5');
  assert.equal(run('9 S'), '3');
  assert.equal(run('1 / 0 ='), 'Error');
  assert.equal(run('5 N + 2 ='), '-3');
  calc.mem = 0; run('7 M+'); assert.equal(run('MR'), '7'); press('MC'); assert.equal(calc.mem, 0);
});
