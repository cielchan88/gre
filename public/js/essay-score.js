// Offline heuristic essay estimator (0-6, half points). Measures surface features only:
// it cannot judge whether an argument is actually sound. Use the AI grader for content feedback.
import { clamp } from './util.js';

const count = (text, list) => list.reduce((n, p) => n + (text.match(new RegExp(`\\b${p}\\b`, 'gi')) || []).length, 0);
const EXAMPLE = ['for example', 'for instance', 'such as', 'e\\.g\\.', 'consider', 'according to', 'research', 'studies', 'evidence', 'in \\d{4}', 'historically', 'case of'];
const NUANCE = ['however', 'although', 'though', 'on the other hand', 'nevertheless', 'nonetheless', 'admittedly', 'conversely', 'while', 'despite', 'in contrast', 'yet', 'even if', 'unless'];
const TRANSITION = ['moreover', 'furthermore', 'therefore', 'consequently', 'thus', 'in addition', 'first', 'second', 'third', 'finally', 'in conclusion', 'as a result', 'similarly', 'ultimately', 'additionally', 'hence'];
const POSITION = ['i agree', 'i disagree', 'i believe', 'in my view', 'in my opinion', 'i argue', 'this essay', 'i contend', 'i would argue', 'i maintain', 'partly agree', 'largely agree', 'largely disagree'];
const STOP = new Set('the a an and or but of to in on for with is are was were be been it this that as at by from not have has had which who their its they them we you he she i will would can could may might should do does did so if than then there these those such also more most very much any all some no'.split(' '));

export function estimateEssay(text) {
  const clean = (text || '').trim();
  const words = clean.match(/[A-Za-z][A-Za-z'’-]*/g) || [];
  const n = words.length;
  const paras = clean.split(/\n\s*\n|\n/).filter((p) => p.trim().split(/\s+/).length >= 8).length;
  const sentences = clean.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().split(/\s+/).length >= 3);
  const avgLen = sentences.length ? n / sentences.length : 0;
  const lower = clean.toLowerCase();
  const first = words.slice(0, 250).map((w) => w.toLowerCase());
  const ttr = first.length ? new Set(first).size / first.length : 0;
  const long = n ? words.filter((w) => w.length >= 7).length / n : 0;
  const freq = {};
  for (const w of words.map((w) => w.toLowerCase())) if (!STOP.has(w) && w.length > 3) freq[w] = (freq[w] || 0) + 1;
  const topRepeat = Math.max(0, ...Object.values(freq));
  const m = {
    words: n, paragraphs: paras, sentences: sentences.length, avgSentence: +avgLen.toFixed(1), ttr: +ttr.toFixed(2),
    examples: count(lower, EXAMPLE), nuance: count(lower, NUANCE), transitions: count(lower, TRANSITION), position: count(lower, POSITION),
  };
  if (n < 30) return { score: n === 0 ? 0 : 1, metrics: m, feedback: [{ type: 'tip', text: 'Esai terlalu pendek untuk dinilai. Targetkan 350–500 kata dalam 4–5 paragraf.' }], heuristic: true };

  const c = {
    length: clamp((n - 100) / 300, 0, 1),
    structure: paras >= 4 ? 1 : paras === 3 ? 0.8 : paras === 2 ? 0.4 : 0.1,
    development: clamp(m.examples / 3, 0, 1),
    nuance: clamp(m.nuance / 3, 0, 1),
    coherence: clamp(m.transitions / 4, 0, 1),
    language: clamp(0.4 * (1 - Math.abs(avgLen - 21) / 15) + 0.35 * clamp((ttr - 0.4) / 0.25, 0, 1) + 0.25 * clamp(long / 0.25, 0, 1), 0, 1),
    thesis: m.position ? 1 : 0.3,
  };
  let raw = 0.22 * c.length + 0.18 * c.development + 0.14 * c.structure + 0.14 * c.nuance + 0.1 * c.coherence + 0.12 * c.language + 0.1 * c.thesis;
  let score = 0.5 + 5 * raw;
  const cap = n < 100 ? 2 : n < 200 ? 3 : n < 300 ? 4 : 6; // very short essays cannot score high
  score = Math.min(score, cap);
  score = clamp(Math.round(score * 2) / 2, 0, 6);

  const fb = [];
  const add = (ok, good, tip) => fb.push(ok ? { type: 'good', text: good } : { type: 'tip', text: tip });
  add(n >= 350, `Panjang esai memadai (${n} kata).`, `Esai ${n} kata; untuk skor 4+ targetkan sekitar 350–500 kata.`);
  add(paras >= 4, `Struktur paragraf jelas (${paras} paragraf).`, `Hanya ${paras} paragraf. Pakai pola: pendahuluan + posisi, 2–3 paragraf argumen, penutup.`);
  add(m.position > 0, 'Ada pernyataan posisi yang eksplisit.', 'Nyatakan posisimu secara eksplisit di paragraf pertama (mis. “I largely agree that…”).');
  add(m.examples >= 2, `Terdapat ${m.examples} penanda contoh/bukti.`, 'Kembangkan argumen dengan contoh konkret (sejarah, sains, pengalaman) — GRE menilai kualitas pengembangan ide.');
  add(m.nuance >= 2, 'Ada pertimbangan sisi lain / nuansa.', 'Pertimbangkan kondisi di mana klaim bisa salah (“however…”, “unless…”). Prompt GRE memintanya.');
  add(m.transitions >= 3, 'Transisi antargagasan cukup.', 'Tambah kata transisi (therefore, moreover, in contrast) agar alur logika terlihat.');
  add(avgLen >= 12 && avgLen <= 30, `Panjang kalimat rata-rata wajar (${m.avgSentence} kata).`, avgLen < 12 ? 'Kalimat terlalu pendek/berulang; gabungkan gagasan dengan klausa subordinat.' : 'Kalimat terlalu panjang; pecah agar mudah diikuti.');
  add(ttr >= 0.55, 'Variasi kosakata baik.', 'Kosakata cenderung berulang; variasikan pilihan kata.');
  if (topRepeat >= 8) fb.push({ type: 'tip', text: `Satu kata dipakai ${topRepeat}×; cari sinonim atau restrukturisasi kalimat.` });
  return { score, metrics: m, feedback: fb, heuristic: true };
}
