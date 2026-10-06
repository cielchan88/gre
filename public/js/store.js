// Persistence (browser localStorage, with an in-memory fallback if storage is blocked).
const KEY = 'gre-practice-v1';
const MAX_DETAILED_RESULTS = 12;

export const defaultState = () => ({
  v: 1, name: '', createdAt: Date.now(),
  settings: { timeScale: 1, sequential: true, showLevel: true },
  theta: { V: 3, Q: 3 },
  progress: {}, results: [], seen: {}, missed: {}, session: null,
  vocab: {}, target: { field: '', V: null, Q: null },
});

let mem = null;
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch { /* storage unavailable */ }
  return mem ? migrate(JSON.parse(mem)) : defaultState();
}
export function migrate(s) {
  const d = defaultState();
  return { ...d, ...s, settings: { ...d.settings, ...(s.settings || {}) }, theta: { ...d.theta, ...(s.theta || {}) }, target: { ...d.target, ...(s.target || {}) }, vocab: s.vocab || {} };
}
export function save(state) {
  const raw = JSON.stringify(state);
  mem = raw;
  try { localStorage.setItem(KEY, raw); } catch { /* quota or blocked */ }
}
export function reset() {
  mem = null;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  return defaultState();
}

/** Save a finished result; keeps full question detail only for the most recent results. */
export function addResult(state, result) {
  state.results.unshift(result);
  state.results.forEach((r, i) => { if (i >= MAX_DETAILED_RESULTS && r.items) { delete r.items; r.pruned = true; } });
  if (state.results.length > 100) state.results.length = 100;
}

// Leitner spaced repetition for vocabulary: box 1..5, next review after SRS_DAYS[box] days.
export const SRS_DAYS = [0, 1, 3, 7, 14, 30];
export function srsGrade(state, word, ok, now = Date.now()) {
  const v = state.vocab[word] || { box: 0, n: 0 };
  const box = ok ? Math.min(5, v.box + 1) : 1;
  state.vocab[word] = { box, n: v.n + 1, ok, due: now + (ok ? SRS_DAYS[box] : 0) * 864e5 };
}

/** Update spaced-repetition memory and the missed-question list. */
export function recordSeen(state, q, correct, now = Date.now()) {
  const key = q.seenKey || q.id;
  const s = state.seen[key] || { n: 0 };
  state.seen[key] = { n: s.n + 1, ok: correct, ts: now };
  if (q.vocab) for (const w of q.vocab) {
    if (!correct) srsGrade(state, w, false, now);
    else if (!state.vocab[w]) state.vocab[w] = { box: 1, n: 1, ok: true, due: now + 864e5 };
  }
  if (correct) delete state.missed[q.id];
  else {
    state.missed[q.id] = { q, ts: now };
    const keys = Object.keys(state.missed);
    if (keys.length > 300) for (const k of keys.sort((a, b) => state.missed[a].ts - state.missed[b].ts).slice(0, keys.length - 300)) delete state.missed[k];
  }
}
export function exportJSON(state) { return JSON.stringify(state); }
export function importJSON(text) {
  const s = JSON.parse(text);
  if (!s || typeof s !== 'object' || s.v !== 1 || !s.theta) throw new Error('Format file tidak valid');
  return migrate(s);
}
