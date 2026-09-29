// Adaptive engine: question selection, grading, difficulty tracking, mock-test routing and scoring.
// Pure logic (no DOM) so it can be unit-tested in Node.
import { VERBAL, PASSAGES } from './bank-verbal.js';
import { QUANT_STATIC } from './bank-quant.js';
import { GENERATORS, generate } from './gen-quant.js';
import { makeRng, clamp } from './util.js';
import { Q_TOPICS } from './consts.js';

export { PASSAGES };
export const STATIC_QUESTIONS = [...VERBAL, ...QUANT_STATIC];
export const STATIC_BY_ID = new Map(STATIC_QUESTIONS.map((q) => [q.id, q]));

// ───────────────────────── Study plan ─────────────────────────
export const DAYS_PER_MOCK = 5;
export function buildPlan(cycles = 6) {
  const plan = [];
  for (let c = 1; c <= cycles; c++) {
    for (let i = 1; i <= DAYS_PER_MOCK; i++) {
      const day = (c - 1) * DAYS_PER_MOCK + i;
      plan.push({ key: `d${day}`, kind: 'day', day, cycle: c, topic: Q_TOPICS[(i - 1) % Q_TOPICS.length] });
    }
    plan.push({ key: `m${c}`, kind: 'mock', mock: c, cycle: c });
  }
  return plan;
}
export const PLAN = buildPlan();

// ───────────────────────── Ability model ─────────────────────────
// theta lives on the same 1..5 scale as question difficulty. Elo-style update: beating a
// question harder than your level moves you up more than beating an easy one.
export const expectedP = (theta, d) => 1 / (1 + Math.exp(-(theta - d) * 1.1));
export const updateTheta = (theta, correct, d, K = 0.8) => clamp(theta + K * ((correct ? 1 : 0) - expectedP(theta, d)), 1, 5);
export const thetaToScore = (t) => Math.round(130 + ((clamp(t, 1, 5) - 1) / 4) * 40);
export const scoreToTheta = (s) => 1 + ((clamp(s, 130, 170) - 130) / 40) * 4;
export const levelOf = (theta) => clamp(Math.round(theta), 1, 5);

// ───────────────────────── Grading ─────────────────────────
export function parseNumeric(resp) {
  if (resp == null) return null;
  if (resp.den !== undefined && resp.den !== '' && resp.num !== undefined && resp.num !== '') {
    const n = Number(String(resp.num).replace(/[,\s]/g, '').replace('−', '-'));
    const d = Number(String(resp.den).replace(/[,\s]/g, '').replace('−', '-'));
    return Number.isFinite(n) && Number.isFinite(d) && d !== 0 ? n / d : null;
  }
  let t = String(resp.text ?? '').trim().replace(/[,\s]/g, '').replace('−', '-');
  if (!t) return null;
  const m = t.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (m) return Number(m[2]) === 0 ? null : Number(m[1]) / Number(m[2]);
  return /^-?(\d+\.?\d*|\.\d+)$/.test(t) ? Number(t) : null;
}

const sameSet = (a, b) => Array.isArray(a) && a.length === b.length && [...a].sort((x, y) => x - y).every((v, i) => v === [...b].sort((x, y) => x - y)[i]);

export function grade(q, resp) {
  if (resp == null) return false;
  switch (q.type) {
    case 'tc': return Array.isArray(resp) && resp.length === q.answer.length && q.answer.every((a, i) => resp[i] === a);
    case 'se': case 'rcn': case 'mcn': return sameSet(resp, q.answer);
    case 'ne': {
      const v = parseNumeric(resp);
      if (v === null) return false;
      const target = q.answer.num !== undefined ? q.answer.num / q.answer.den : q.answer.value;
      return Math.abs(v - target) <= (q.tol ?? 1e-6 * Math.max(1, Math.abs(target)));
    }
    default: return resp === q.answer;
  }
}

export function isAnswered(q, resp) {
  if (resp == null) return false;
  switch (q.type) {
    case 'tc': return Array.isArray(resp) && resp.length === q.blanks.length && resp.every((v) => v != null);
    case 'se': return Array.isArray(resp) && resp.length === 2;
    case 'rcn': case 'mcn': return Array.isArray(resp) && resp.length > 0;
    case 'ne': return parseNumeric(resp) !== null;
    default: return typeof resp === 'number';
  }
}

// ───────────────────────── Selection ─────────────────────────
const seenPenalty = (seen, id) => {
  const s = seen?.[id];
  if (!s) return 0;
  // Previously missed questions come back sooner than ones answered correctly.
  return 1.6 + 0.5 * (s.n - 1) - (s.ok === false ? 1.3 : 0);
};

function pickStatic(pool, target, ctx, bonus = 0) {
  let best = null;
  for (const q of pool) {
    if (ctx.used.has(q.id)) continue;
    const cost = Math.abs(q.difficulty - target) + seenPenalty(ctx.seen, q.id) + ctx.rng.f() * 0.5 + bonus - (ctx.topic && q.topic === ctx.topic ? 0.7 : 0);
    if (!best || cost < best.cost) best = { q, cost };
  }
  return best;
}

/** Choose one question of `type` near `target` difficulty. */
export function pickQuestion(section, type, target, ctx) {
  if (section === 'V') {
    const pool = VERBAL.filter((q) => q.type === type);
    let best = pickStatic(pool, target, ctx);
    if (!best) best = pickStatic(pool, target, { ...ctx, used: new Set() });
    return best.q;
  }
  const pool = QUANT_STATIC.filter((q) => q.type === type);
  const st = pickStatic(pool, target, ctx, -0.25);
  let gen = null;
  for (const g of GENERATORS.filter((g) => g.type === type)) {
    const d = clamp(Math.round(target + (ctx.rng.f() - 0.5) * 1.2), 1, 5);
    const cost = Math.abs(d - target) + ctx.rng.f() * 0.6 + (ctx.topic && g.topic === ctx.topic ? -0.7 : 0) + 0.45 * (ctx.genUse?.[g.id] || 0);
    if (!gen || cost < gen.cost) gen = { g, d, cost };
  }
  if (st && (!gen || st.cost <= gen.cost)) return st.q;
  const q = generate(gen.g, gen.d, ctx.rng.int(1, 2 ** 30));
  if (ctx.genUse) ctx.genUse[gen.g.id] = (ctx.genUse[gen.g.id] || 0) + 1;
  return q;
}

export const passageGroups = (() => {
  const m = {};
  for (const q of VERBAL) if (q.passage) (m[q.passage] ||= []).push(q);
  return m;
})();

/** Choose a reading passage (block of questions) near `target`. Returns up to `take` questions. */
export function pickPassage(target, take, ctx) {
  let best = null;
  for (const [pid, qs] of Object.entries(passageGroups)) {
    if (qs.every((q) => ctx.used.has(q.id))) continue;
    const mean = qs.reduce((s, q) => s + q.difficulty, 0) / qs.length;
    const pen = qs.reduce((s, q) => s + seenPenalty(ctx.seen, q.id), 0) / qs.length;
    const cost = Math.abs(mean - target) + pen + ctx.rng.f() * 0.5;
    if (!best || cost < best.cost) best = { pid, qs, cost };
  }
  if (!best) best = { qs: Object.values(passageGroups)[ctx.rng.int(0, Object.keys(passageGroups).length - 1)] };
  let qs = best.qs.filter((q) => !ctx.used.has(q.id));
  if (!qs.length) qs = best.qs;
  if (qs.length > take) {
    qs = [...qs].sort((a, b) => Math.abs(a.difficulty - target) - Math.abs(b.difficulty - target)).slice(0, take)
      .sort((a, b) => best.qs.indexOf(a) - best.qs.indexOf(b));
  }
  return qs;
}

// ───────────────────────── Daily practice module ─────────────────────────
export const PRACTICE_SIZE = { V: 10, Q: 10 };

export function createPractice(state, planItem, now = Date.now()) {
  const seed = Math.floor(Math.random() * 2 ** 30);
  const r = makeRng(seed);
  return {
    id: `s${now}`, kind: 'practice', key: planItem.key, day: planItem.day, topic: planItem.topic, seed, startedAt: now,
    plan: {
      V: r.shuffle(['tc', 'tc', 'tc', 'se', 'se', 'se', 'rc', 'rc']),
      Q: r.shuffle(['qc', 'qc', 'qc', 'mc1', 'mc1', 'mc1', 'mcn', 'ne', 'ne', 'ne']),
    },
    slot: { V: 0, Q: 0 }, queue: [], genUse: {},
    thetaStart: { ...state.theta }, theta: { ...state.theta },
    items: [], cursor: 0, finished: false,
  };
}

/** Selects the next question adaptively based on the running ability estimate. */
export function nextPracticeItem(session, state) {
  const count = (s) => session.items.filter((it) => it.q.section === s).length;
  if (session.fixed) return null;
  let q;
  if (session.queue.length) q = session.queue.shift();
  else {
    const section = count('V') < PRACTICE_SIZE.V ? 'V' : count('Q') < PRACTICE_SIZE.Q ? 'Q' : null;
    if (!section) return null;
    const rng = makeRng(session.seed + session.items.length * 7919);
    const used = new Set(session.items.map((it) => it.q.id));
    const ctx = { rng, seen: state.seen, used, topic: section === 'Q' ? session.topic : null, genUse: session.genUse };
    const target = clamp(session.theta[section] + 0.2, 1, 5);
    const slot = session.plan[section][session.slot[section]++] ?? (section === 'V' ? 'tc' : 'mc1'); // top-up if a passage yielded fewer questions
    if (slot === 'rc') {
      const remaining = PRACTICE_SIZE.V - count('V');
      const qs = pickPassage(target, Math.min(2, remaining), ctx);
      q = qs[0];
      session.queue.push(...qs.slice(1));
    } else q = pickQuestion(section, slot, target, ctx);
  }
  const item = { q, resp: null, checked: false, correct: null, thetaBefore: session.theta[q.section], thetaAfter: null, ms: 0 };
  session.items.push(item);
  return item;
}

/** Records the answer for an item and updates the running ability estimate. */
export function checkAnswer(session, item, ms = 0) {
  item.correct = grade(item.q, item.resp);
  item.checked = true;
  item.ms = ms;
  if (!session.fixed) {
    session.theta[item.q.section] = updateTheta(session.theta[item.q.section], item.correct, item.q.difficulty);
    item.thetaAfter = session.theta[item.q.section];
  }
  return item;
}

// ───────────────────────── Full-length mock test ─────────────────────────
export const MOCK_SECTIONS = [
  { key: 'V1', section: 'V', n: 12, minutes: 18, role: 'router', mix: { tc: 3, se: 3, rc: 6 } },
  { key: 'Q1', section: 'Q', n: 12, minutes: 21, role: 'router', mix: { qc: 4, mc1: 4, mcn: 1, ne: 3 } },
  { key: 'V2', section: 'V', n: 15, minutes: 23, role: 'adaptive', from: 'V1', mix: { tc: 4, se: 4, rc: 7 } },
  { key: 'Q2', section: 'Q', n: 15, minutes: 26, role: 'adaptive', from: 'Q1', mix: { qc: 5, mc1: 5, mcn: 2, ne: 3 } },
];
export const AWA = { key: 'AWA', minutes: 30 };

// Share of questions at each difficulty level, per routing tier.
export const TIER_DIST = {
  router: { 2: 0.25, 3: 0.5, 4: 0.25 },
  easy: { 1: 0.3, 2: 0.4, 3: 0.3 },
  medium: { 2: 0.2, 3: 0.5, 4: 0.3 },
  hard: { 3: 0.2, 4: 0.4, 5: 0.4 },
};
export const TIER_RANGE = { easy: [130, 154], medium: [142, 164], hard: [152, 170] };

export function tierTargets(tier, n, rng) {
  const dist = TIER_DIST[tier];
  const out = [];
  const levels = Object.keys(dist).map(Number);
  for (const l of levels) for (let i = 0; i < Math.round(dist[l] * n); i++) out.push(l);
  while (out.length < n) out.push(levels[Math.floor(levels.length / 2)]);
  return rng.shuffle(out.slice(0, n));
}

export function buildMockSection(def, tier, state, session, seedOffset = 0) {
  const seed = session.seed + seedOffset;
  const rng = makeRng(seed);
  const used = new Set(session.used);
  const ctx = { rng, seen: state.seen, used, topic: null, genUse: {} };
  const targets = tierTargets(tier, def.n, rng);
  // Build blocks: a non-RC block is one question; an RC block is one passage of up to 2-3 questions.
  const blocks = [];
  for (const [type, cnt] of Object.entries(def.mix)) {
    if (type === 'rc') {
      let left = cnt;
      while (left > 0) { const take = left >= 3 && rng.chance(0.3) ? 3 : Math.min(2, left); blocks.push({ type: 'rc', take }); left -= take; }
    } else for (let i = 0; i < cnt; i++) blocks.push({ type, take: 1 });
  }
  const order = rng.shuffle(blocks);
  const qs = [];
  let ti = 0;
  for (const b of order) {
    const target = targets[ti % targets.length];
    ti += b.take;
    let got;
    if (b.type === 'rc') got = pickPassage(target, b.take, ctx);
    else got = [pickQuestion(def.section, b.type, target, ctx)];
    for (const q of got) { ctx.used.add(q.id); qs.push(q); }
  }
  // Top up if a passage yielded fewer questions than requested.
  const fillTypes = Object.keys(def.mix).filter((t) => t !== 'rc');
  for (let i = 0; qs.length < def.n; i++) {
    const q = pickQuestion(def.section, fillTypes[i % fillTypes.length], 3, ctx);
    ctx.used.add(q.id); qs.push(q);
  }
  for (const q of qs.slice(0, def.n)) session.used.push(q.id);
  return qs.slice(0, def.n).map((q) => ({ q, resp: null, marked: false, visited: false, ms: 0 }));
}

export function createMock(state, mockNo, includeAWA = true, now = Date.now()) {
  const seed = Math.floor(Math.random() * 2 ** 30);
  return {
    id: `s${now}`, kind: 'mock', key: `m${mockNo}`, mockNo, seed, startedAt: now, used: [],
    thetaStart: { ...state.theta },
    mock: {
      includeAWA, phase: 'intro', idx: -1, qi: 0, review: false,
      sections: MOCK_SECTIONS.map((d) => ({ ...d, tier: d.role === 'router' ? 'router' : null, items: [], startedAt: null, endsAt: null, done: false, p: null })),
      awa: { prompt: null, text: '', startedAt: null, endsAt: null, done: false },
    },
  };
}

export const weighted = (items) => {
  let got = 0, tot = 0;
  for (const it of items) { tot += it.q.difficulty; if (grade(it.q, it.resp)) got += it.q.difficulty; }
  return tot ? got / tot : 0;
};
export const routeTier = (p1) => (p1 < 0.4 ? 'easy' : p1 >= 0.7 ? 'hard' : 'medium');

export function scaledScore(p1, p2, tier) {
  const [lo, hi] = TIER_RANGE[tier];
  return Math.round(lo + (hi - lo) * clamp(0.35 * p1 + 0.65 * p2, 0, 1));
}

// Rough, unofficial percentile anchors (interpolated) for orientation only.
const PCT = { V: [[130, 0], [135, 1], [140, 8], [145, 25], [150, 46], [155, 68], [160, 86], [165, 96], [170, 99]], Q: [[130, 0], [135, 2], [140, 9], [145, 21], [150, 38], [155, 56], [160, 73], [165, 87], [170, 97]] };
export function approxPercentile(section, score) {
  const t = PCT[section];
  for (let i = 1; i < t.length; i++) if (score <= t[i][0]) {
    const [a, pa] = t[i - 1], [b, pb] = t[i];
    return Math.round(pa + ((score - a) / (b - a)) * (pb - pa));
  }
  return 99;
}

/** Called when both sections of a subject have been completed. */
export function mockScores(session) {
  const out = {};
  for (const sec of ['V', 'Q']) {
    const [a, b] = session.mock.sections.filter((s) => s.section === sec);
    if (!a?.done || !b?.done) continue;
    out[sec] = { score: scaledScore(a.p, b.p, b.tier), tier: b.tier, p1: a.p, p2: b.p };
  }
  return out;
}

export function sectionSummary(items) {
  const n = items.length;
  const c = items.filter((it) => grade(it.q, it.resp)).length;
  const answered = items.filter((it) => isAnswered(it.q, it.resp)).length;
  return { n, c, answered, pct: n ? c / n : 0 };
}

export function topicBreakdown(items) {
  const m = {};
  for (const it of items) {
    const k = it.q.section === 'Q' ? it.q.topic : it.q.type === 'tc' ? 'text completion' : it.q.type === 'se' ? 'sentence equivalence' : 'reading comprehension';
    const e = (m[k] ||= { c: 0, n: 0, section: it.q.section });
    e.n++; if (it.correct ?? grade(it.q, it.resp)) e.c++;
  }
  return m;
}

export const AWA_PROMPTS = [
  'Governments should place limits on the speed at which technological change is introduced into society, so that people and institutions have time to adapt.\n\nWrite a response in which you discuss the extent to which you agree or disagree with the statement and explain your reasoning for the position you take. In developing and supporting your position, you should consider ways in which the statement might or might not hold true.',
  'The most valuable lessons in life are learned through failure rather than success.\n\nWrite a response in which you discuss the extent to which you agree or disagree with the claim. In developing and supporting your position, you should consider ways in which the claim might or might not hold true.',
  'Universities should require every student to study the same core curriculum rather than allowing students to choose their own courses from the start.\n\nWrite a response in which you discuss the extent to which you agree or disagree with the recommendation and explain your reasoning. In developing your position, consider the circumstances in which the recommendation might or might not be advantageous.',
  'Public funds for the arts are better spent on encouraging new, experimental work than on preserving traditional works and institutions.\n\nWrite a response in which you discuss the extent to which you agree or disagree with the statement and explain your reasoning. Consider ways in which the statement might or might not hold true.',
  'In a world with abundant information, the ability to ignore information is more important than the ability to acquire it.\n\nWrite a response in which you discuss the extent to which you agree or disagree with the claim. In developing your position, consider both the strengths and limitations of the claim.',
  'Leaders who consult widely before making decisions are generally less effective than leaders who rely on their own judgment.\n\nWrite a response in which you discuss the extent to which you agree or disagree with the statement and explain your reasoning, considering circumstances in which it might or might not hold.',
];
