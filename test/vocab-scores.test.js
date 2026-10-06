import test from 'node:test';
import assert from 'node:assert/strict';
import * as V from '../public/js/vocab.js';
import * as S from '../public/js/scores.js';
import * as store from '../public/js/store.js';
import { makeRng } from '../public/js/util.js';

test('vocabulary bank: unique words, valid groups, frames with one blank', () => {
  const words = V.WORDS.map((w) => w.word);
  assert.equal(new Set(words).size, words.length);
  assert.ok(words.length >= 200);
  for (const g of V.GROUPS) {
    assert.ok(g.words.length >= 2, g.id);
    assert.ok(g.words.every((w) => w.tier >= 1 && w.tier <= 5), g.id);
    for (const f of g.frames) { assert.equal(f.text.split('{1}').length, 2, g.id); assert.ok(['P', 'T'].includes(f.kind), g.id); }
    if (g.opp) { assert.ok(V.GROUP_BY_ID[g.opp], g.id); assert.equal(V.GROUP_BY_ID[g.opp].pos, g.pos, g.id); }
  }
});

test('generated Sentence Equivalence: one synonym pair from the right group, traps from other families', () => {
  const r = makeRng(3);
  for (let i = 0; i < 600; i++) {
    const q = V.generateVocabQuestion('se', r, { target: 1 + (i % 5) });
    assert.equal(q.options.length, 6);
    assert.equal(new Set(q.options).size, 6);
    assert.equal(q.answer.length, 2);
    const g = V.WORD_BY[q.options[q.answer[0]]].group;
    assert.equal(V.WORD_BY[q.options[q.answer[1]]].group, g);
    const fam = V.GROUP_BY_ID[g].fam, opp = V.GROUP_BY_ID[g].opp;
    q.options.forEach((o, k) => {
      if (q.answer.includes(k)) return;
      const og = V.GROUP_BY_ID[V.WORD_BY[o].group];
      assert.notEqual(og.id, g);
      assert.ok(og.id === opp || og.fam !== fam, `${q.stem} :: ${o}`);
    });
  }
});

test('generated Text Completion: exactly one word from the right group', () => {
  const r = makeRng(9);
  for (let i = 0; i < 600; i++) {
    const q = V.generateVocabQuestion('tc', r, { target: 1 + (i % 5) });
    const opts = q.blanks[0];
    assert.equal(opts.length, 5);
    assert.equal(new Set(opts).size, 5);
    const g = V.WORD_BY[opts[q.answer[0]]].group;
    assert.equal(opts.filter((o) => V.WORD_BY[o].group === g).length, 1, q.stem);
  }
});

test('words of the day: six per day, cycling through the whole list', () => {
  const seen = new Set();
  for (let d = 1; d <= 30; d++) { const ws = V.wordsForDay(d); assert.equal(ws.length, V.WORDS_PER_DAY); ws.forEach((w) => seen.add(w.word)); }
  assert.ok(seen.size >= Math.min(180, V.WORDS.length));
});

test('ETS percentiles: spot checks and monotonic', () => {
  assert.equal(S.percentile('V', 160), 82);
  assert.equal(S.percentile('Q', 160), 50);
  assert.equal(S.percentile('Q', 150), 23);
  assert.equal(S.percentile('V', 150), 39);
  assert.equal(S.percentile('AW', 4), 63);
  for (const sec of ['V', 'Q']) for (let x = 131; x <= 170; x++) assert.ok(S.percentile(sec, x) >= S.percentile(sec, x - 1));
  assert.equal(S.scoreForPercentile('Q', 50), 160);
});

test('spaced repetition: wrong vocab answers enter review, correct ones advance', () => {
  const st = store.defaultState();
  store.recordSeen(st, { id: 'x', seenKey: 'k', vocab: ['laconic'] }, false, 1000);
  assert.equal(st.vocab.laconic.box, 1);
  assert.equal(st.vocab.laconic.due, 1000);
  store.srsGrade(st, 'laconic', true, 1000);
  assert.equal(st.vocab.laconic.box, 2);
  assert.equal(st.vocab.laconic.due, 1000 + 3 * 864e5);
  store.srsGrade(st, 'laconic', false, 2000);
  assert.equal(st.vocab.laconic.box, 1);
  assert.ok(st.seen.k);
});
