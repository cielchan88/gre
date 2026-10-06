import * as store from './store.js';
import * as E from './engine.js';
import { renderQuestion, applyPick, esc, correctAnswerText, responseText, typeLabel, instructions } from './ui-question.js';
import { calc, press, calcHtml, display as calcDisplay } from './ui-calc.js';
import { estimateEssay } from './essay-score.js';
import * as SC from './scores.js';
import * as VOC from './vocab.js';
import { DIFF_LABEL, TOPIC_LABEL, TYPE_LABEL } from './consts.js';

let state = store.load();
const app = document.getElementById('app');
let tickId = null;
let toast = '';
let aiAvailable = false;
fetch('/api/config').then((r) => r.json()).then((c) => { aiAvailable = !!c.ai; }).catch(() => {});

const persist = () => store.save(state);
const $ = (sel) => document.querySelector(sel);
const secName = (s) => (s === 'V' ? 'Verbal Reasoning' : 'Quantitative Reasoning');
const pct = (x) => `${Math.round(x * 100)}%`;
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
const dateStr = (t) => new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const planItem = (key) => E.PLAN.find((p) => p.key === key);
const itemTitle = (p) => (p.kind === 'day' ? `Day ${p.day}` : `Mock Test ${p.mock}`);
const levelDots = (n) => '●'.repeat(n) + '○'.repeat(5 - n);

// ───────────────────────── Layout ─────────────────────────
function shell(inner, { plain = false } = {}) {
  const nav = `<header class="topbar"><a class="brand" href="#/">GRE<span>Practice Lab</span></a>
    <nav><a href="#/">Dashboard</a><a href="#/vocab">Kosakata</a><a href="#/essay">Esai</a><a href="#/mistakes">Kesalahan${Object.keys(state.missed).length ? ` <em>${Object.keys(state.missed).length}</em>` : ''}</a><a href="#/about">Panduan</a><a href="#/settings">Pengaturan</a></nav></header>`;
  return `${plain ? '' : nav}<main class="${plain ? 'test-main' : 'container'}">${inner}</main>${toast ? `<div class="toast">${esc(toast)}</div>` : ''}`;
}
function render(html, opts) {
  const y = window.scrollY;
  app.innerHTML = shell(html, opts);
  window.scrollTo(0, y);
}
function flash(msg) { toast = msg; setTimeout(() => { toast = ''; const t = $('.toast'); if (t) t.remove(); }, 2500); }

// ───────────────────────── Routing ─────────────────────────
function route() {
  clearInterval(tickId);
  const [, page, arg] = (location.hash || '#/').split('/');
  window.scrollTo(0, 0);
  if (page === 'start') return viewIntro(arg);
  if (page === 'session') return viewSession();
  if (page === 'result') return viewResult(arg);
  if (page === 'essay') return viewEssay();
  if (page === 'vocab') { if (arg !== 'review' && arg !== 'top52') vr = null; return viewVocab(arg); }
  if (page === 'mistakes') return viewMistakes();
  if (page === 'settings') return viewSettings();
  if (page === 'about') return viewAbout();
  return viewDashboard();
}
window.addEventListener('hashchange', route);

// ───────────────────────── Dashboard ─────────────────────────
const isDone = (key) => !!state.progress[key]?.done;
function isUnlocked(key) {
  if (!state.settings.sequential) return true;
  for (const p of E.PLAN) { if (p.key === key) return true; if (!isDone(p.key)) return false; }
  return false;
}
const nextKey = () => (E.PLAN.find((p) => !isDone(p.key)) || {}).key;

const currentDay = () => (E.PLAN.find((p) => p.kind === 'day' && !isDone(p.key)) || { day: 30 }).day;
const targetFor = (sec) => Number(state.target[sec]) || SC.FIELD_BY_ID[state.target.field]?.[sec] || null;
const pill = (st) => `<span class="pill ${st.tone}">${st.label}</span>`;

function abilityCard(sec) {
  const t = state.theta[sec], score = E.thetaToScore(t);
  const p = SC.percentile(sec, score);
  const last = state.results.find((r) => r.kind === 'mock' && r.scores?.[sec]);
  const tgt = targetFor(sec);
  return `<div class="card ability"><h3>${secName(sec)}</h3>
    <div class="score">${score}<small>estimasi${state.results.some((r) => r.kind !== 'review') ? ` &middot; persentil ${p}` : ''}</small></div>
    <div class="meter" title="Level ${t.toFixed(1)}/5"><i style="width:${((t - 1) / 4) * 100}%"></i>${tgt ? `<b class="tgt" style="left:${((tgt - 130) / 40) * 100}%" title="Target ${tgt}"></b>` : ''}</div>
    <p class="muted">${state.results.some((r) => r.kind !== 'review') ? pill(SC.standing(p)) : '<span class="pill ok">belum ada data</span>'} Level adaptif ${t.toFixed(1)} / 5${last ? ` &middot; mock terakhir: <b>${last.scores[sec].score}</b>` : ''}${tgt ? ` &middot; target <b>${tgt}</b>${score >= tgt ? ' \u2714' : ` (kurang ${tgt - score})`}` : ''}</p></div>`;
}

// ── Vocabulary helpers ──
const POS = { adj: 'adjective', noun: 'noun', verb: 'verb' };
function wordCard(w) {
  const syn = VOC.synonymsOf(w), ant = VOC.antonymsOf(w), v = state.vocab[w.word];
  return `<div class="word${w.top52 ? ' top52' : ''}" data-w="${w.word}"><div class="w-head"><b class="w">${w.word}</b><span class="pos">${POS[w.pos]}</span>${w.top52 ? '<span class="t52">Top 52</span>' : ''}<span class="tier" title="Tingkat kesulitan ${w.tier}/5">${'\u25CF'.repeat(w.tier)}${'\u25CB'.repeat(5 - w.tier)}</span>${v ? `<span class="box b${v.box}" title="Kotak Leitner">${v.box >= 4 ? 'dikuasai' : 'kotak ' + v.box}</span>` : ''}</div>
    <div class="w-def">${esc(w.def || w.meaning)} &middot; <i>${esc(w.idn)}</i></div>
    ${syn.length ? `<div class="w-rel">Sinonim: ${syn.join(', ')}</div>` : ''}${ant.length ? `<div class="w-rel">Antonim: ${ant.join(', ')}</div>` : ''}
    <div class="w-ex">${VOC.exampleFor(w)}</div>${w.note ? `<div class="w-note">${esc(w.note)}</div>` : ''}</div>`;
}
function vocabDeck(now = Date.now()) {
  const intro = new Set();
  for (let d = 1; d <= currentDay(); d++) VOC.wordsForDay(d).forEach((w) => intro.add(w.word));
  Object.keys(state.vocab).forEach((w) => intro.add(w));
  const due = [], fresh = [];
  for (const w of intro) { const v = state.vocab[w]; if (!v) fresh.push(w); else if (v.due <= now) due.push(w); }
  return { intro: intro.size, due, fresh, mastered: Object.values(state.vocab).filter((v) => v.box >= 4).length };
}
function vocabCard() {
  const d = vocabDeck(), todo = d.due.length + Math.min(10, d.fresh.length);
  return `<div class="card vocab-card"><div><h3>Kosakata GRE</h3><p class="muted">${d.mastered} dikuasai &middot; ${d.intro} sudah diperkenalkan &middot; ${VOC.WORDS.length} total</p>
    <div class="meter"><i style="width:${(d.mastered / VOC.WORDS.length) * 100}%"></i></div></div>
    <div class="actions">${todo ? `<a class="btn primary" href="#/vocab/review">Review ${todo} kata</a>` : '<span class="muted">Tidak ada kata jatuh tempo hari ini \u2714</span>'}<a class="btn" href="#/vocab">Kosakata hari ini</a></div></div>`;
}

function viewDashboard() {
  const nk = nextKey();
  const s = state.session;
  const done = E.PLAN.filter((p) => isDone(p.key)).length;
  const welcome = !state.settings.welcomed ? `<div class="card welcome"><h2>Selamat datang!</h2>
    <p>Latihan ini meniru format GRE General Test terbaru: <b>Verbal</b> &amp; <b>Quantitative</b> (skor 130&ndash;170) dengan soal yang menyesuaikan tingkat kesulitan berdasarkan jawabanmu. Selesaikan 5 modul harian untuk membuka 1 mock test penuh.</p>
    <form data-form="welcome" class="inline"><input name="name" placeholder="Nama panggilan (opsional)" maxlength="30"><button class="btn primary">Mulai</button></form></div>` : '';
  const resume = s ? `<div class="card resume"><div><b>Sesi berjalan:</b> ${s.kind === 'mock' ? `Mock Test ${s.mockNo}` : s.kind === 'review' ? 'Latihan ulang kesalahan' : `Day ${s.day}`}<br><span class="muted">Dimulai ${dateStr(s.startedAt)}</span></div>
    <div><a class="btn primary" href="#/session">Lanjutkan</a> <button class="btn ghost" data-act="abandon">Batalkan sesi</button></div></div>` : '';
  const next = nk && !s ? `<div class="card next"><div><span class="eyebrow">Berikutnya</span><h2>${itemTitle(planItem(nk))}${planItem(nk).kind === 'day' ? ` <small>&middot; fokus Quant: ${TOPIC_LABEL[planItem(nk).topic]}</small>` : ' <small>&middot; simulasi penuh ~2 jam</small>'}</h2></div><a class="btn primary big" href="#/start/${nk}">Mulai</a></div>` : '';
  const cycles = [];
  for (const p of E.PLAN) (cycles[p.cycle - 1] ||= []).push(p);
  const roadmap = cycles.map((items, ci) => `<div class="cycle"><h3>Siklus ${ci + 1}</h3><div class="chips">${items.map((p) => {
    const prog = state.progress[p.key], unlocked = isUnlocked(p.key);
    const label = itemTitle(p);
    const sub = prog?.done ? (p.kind === 'mock' && prog.score ? `${prog.score.V ?? '–'}/${prog.score.Q ?? '–'}` : pct(prog.pct)) : p.kind === 'mock' ? 'Full test' : TOPIC_LABEL[p.topic];
    const c = `chip ${p.kind}${prog?.done ? ' done' : ''}${p.key === nk ? ' up-next' : ''}${unlocked ? '' : ' locked'}`;
    return unlocked ? `<a class="${c}" href="#/start/${p.key}"><b>${label}</b><small>${sub}</small></a>` : `<span class="${c}"><b>${label}</b><small>🔒</small></span>`;
  }).join('')}</div></div>`).join('');
  const recent = state.results.filter((r) => r.kind !== 'review').slice(0, 5).map((r) => `<li><a href="#/result/${r.id}"><b>${r.kind === 'mock' ? `Mock Test ${r.mock}` : `Day ${r.day}`}</b> <span class="muted">${dateStr(r.date)}</span><span class="grow"></span>${r.kind === 'mock' ? `V ${r.scores.V?.score ?? '–'} &middot; Q ${r.scores.Q?.score ?? '–'}` : `${r.correct}/${r.total} benar`}</a></li>`).join('');
  render(`<h1 class="hello">${state.name ? `Halo, ${esc(state.name)}` : 'Halo'} \uD83D\uDC4B</h1>${welcome}${resume}${next}
    <div class="grid2">${abilityCard('V')}${abilityCard('Q')}</div>
    ${!state.target.field && !state.target.V ? '<p class="muted">Tip: atur <a href="#/settings">target skor / bidang studi</a> agar kemajuanmu dibandingkan dengan rata-rata pendaftar bidang tersebut (data ETS).</p>' : ''}
    ${vocabCard()}
    <section><div class="section-head"><h2>Jalur latihan</h2><span class="muted">${done} dari ${E.PLAN.length} selesai</span></div>${roadmap}</section>
    ${recent ? `<section><h2>Hasil terbaru</h2><ul class="list">${recent}</ul></section>` : ''}`);
}

// ───────────────────────── Intro ─────────────────────────
function viewIntro(key) {
  const p = planItem(key);
  if (!p || !isUnlocked(key)) { location.hash = '#/'; return; }
  const prog = state.progress[key];
  if (p.kind === 'day') {
    render(`<a class="back" href="#/">&larr; Dashboard</a><div class="card intro"><span class="eyebrow">Siklus ${p.cycle} &middot; Modul harian</span><h1>Day ${p.day}</h1>
      <ul class="facts"><li><b>20 soal</b>: 10 Verbal (Text Completion, Sentence Equivalence, Reading Comprehension) + 10 Quantitative (Quantitative Comparison, Multiple Choice, Numeric Entry).</li>
      <li><b>Fokus Quant hari ini:</b> ${TOPIC_LABEL[p.topic]}.</li>
      <li><b>Adaptif per soal:</b> jawaban benar &rarr; soal berikutnya lebih sulit; salah &rarr; lebih mudah. Level kamu terlihat di layar.</li>
      <li>Setelah tiap soal kamu langsung melihat benar/salah dan pembahasan. Kalkulator tersedia di bagian Quant.</li>
      <li>Soal yang pernah salah akan muncul kembali lebih cepat.</li>
      <li><b>Kosakata hari ini</b> (di bawah) dipakai dalam sebagian soal Verbal.</li></ul>
      ${prog?.done ? `<p class="muted">Sudah selesai (${pct(prog.pct)}). Mengulang akan memberi soal baru dan memperbarui skor terakhir.</p>` : ''}
      <button class="btn primary big" data-act="startday" data-key="${key}">${prog?.done ? 'Ulangi modul' : 'Mulai Day ' + p.day}</button></div>
      <div class="card"><h3>Kosakata hari ini</h3><p class="muted">Pelajari dulu ${VOC.WORDS_PER_DAY} kata ini: beberapa soal Text Completion &amp; Sentence Equivalence hari ini dibuat dari kata-kata tersebut. Kata yang salah otomatis masuk ke review kosakata.</p>
      <div class="words">${VOC.wordsForDay(p.day).map(wordCard).join('')}</div></div>`);
    return;
  }
  const rows = E.MOCK_SECTIONS.filter((s) => s.role === 'router').map((s) => `<tr><td>${secName(s.section)}</td><td>2 section: 12 + 15 soal</td><td>${s.minutes} + ${E.MOCK_SECTIONS.find((x) => x.from === s.key).minutes} menit</td></tr>`).join('');
  render(`<a class="back" href="#/">&larr; Dashboard</a><div class="card intro"><span class="eyebrow">Siklus ${p.cycle} &middot; Simulasi penuh</span><h1>Mock Test ${p.mock}</h1>
    <p>Alur dan tampilan dibuat semirip mungkin dengan GRE General Test versi ringkas (sejak September 2023).</p>
    <table class="data"><tr><th>Bagian</th><th>Isi</th><th>Waktu</th></tr><tr><td>Analytical Writing</td><td>1 esai (Analyze an Issue)</td><td>30 menit</td></tr>${rows}</table>
    <ul class="facts">
    <li><b>Urutan:</b> esai selalu pertama; setelah itu section Verbal dan Quant muncul dalam urutan acak (Verbal dulu atau Quant dulu). <b>Tidak ada jeda istirahat.</b></li>
    <li><b>Adaptif per section:</b> Section 1 tiap bagian bertingkat menengah; hasilnya menentukan Section 2 (mudah / menengah / sulit) dan batas atas skor 130&ndash;170.</li>
    <li><b>Tampilan tes:</b> layar petunjuk sebelum tiap section, tombol <b>Quit Test, Exit Section, Review, Mark, Help, Back, Next</b>, jam yang bisa disembunyikan, kalkulator (Quant) yang bisa digeser, editor esai dengan Cut / Paste / Undo / Redo tanpa spell-check.</li>
    <li><b>Susunan soal:</b> Text Completion di awal section Verbal; Quantitative Comparison di awal section Quant, dengan satu set <b>Data Interpretation</b> (tabel/grafik untuk 2&ndash;3 soal) di tengah.</li>
    <li>Kamu bisa kembali ke soal mana pun <b>dalam section yang sama</b>. Setelah keluar dari section atau waktu habis, tidak bisa kembali. Tidak ada pembahasan selama tes.</li>
    <li>Di akhir tes kamu memilih <b>Report Scores</b> atau <b>Cancel Scores</b>, seperti tes asli.</li></ul>
    <label class="check"><input type="checkbox" id="awa" checked> Sertakan Analytical Writing (30 menit)</label>
    <p class="muted">Total waktu: 1 jam 58 menit dengan esai, 1 jam 28 menit tanpa esai. Faktor waktu dapat diubah di Pengaturan${state.settings.timeScale !== 1 ? ` (sekarang: ${state.settings.timeScale === 0 ? 'tanpa batas waktu' : state.settings.timeScale + '×'})` : ''}.</p>
    <button class="btn primary big" data-act="startmock" data-key="${key}">${prog?.done ? 'Ulangi mock test' : 'Mulai mock test'}</button></div>`);
}

// ───────────────────────── Session runner ─────────────────────────
function viewSession() {
  const s = state.session;
  if (!s) { location.hash = '#/'; return; }
  if (s.kind === 'mock') return renderMock();
  return renderPractice();
}

// ── Practice ──
function currentPractice() {
  const s = state.session;
  let item = s.items[s.cursor];
  if (!item) { item = E.nextPracticeItem(s, state); persist(); }
  return item;
}
function renderPractice() {
  const s = state.session;
  const item = currentPractice();
  if (!item) return finishPractice();
  item.startedAt ||= Date.now();
  const q = item.q;
  const inSec = s.items.slice(0, s.cursor + 1).filter((it) => it.q.section === q.section).length;
  const secTotal = s.fixed ? s.items.length : E.PRACTICE_SIZE[q.section];
  const theta = s.theta[q.section];
  const title = s.kind === 'review' ? 'Latihan ulang' : `Day ${s.day}`;
  const level = state.settings.showLevel && !s.fixed ? `<div class="levelbar"><span>Level kamu (${q.section === 'V' ? 'Verbal' : 'Quant'}): <b class="dots">${levelDots(E.levelOf(theta))}</b> ${DIFF_LABEL[E.levelOf(theta)]} &middot; est. <b>${E.thetaToScore(theta)}</b></span><span>Soal ini: <b>${DIFF_LABEL[q.difficulty]}</b></span></div>` : '';
  let fb = '';
  if (item.checked) {
    const delta = item.thetaAfter != null ? item.thetaAfter - item.thetaBefore : 0;
    const lv = E.levelOf(item.thetaAfter ?? 0), lb = E.levelOf(item.thetaBefore);
    const move = s.fixed ? '' : lv > lb ? `<span class="up">▲ Naik ke level ${DIFF_LABEL[lv]} &mdash; soal berikutnya lebih sulit</span>` : lv < lb ? `<span class="down">▼ Turun ke level ${DIFF_LABEL[lv]} &mdash; soal berikutnya lebih mudah</span>` : `<span class="flat">Level ${delta >= 0 ? 'menguat' : 'melemah'} (${item.thetaAfter.toFixed(2)})</span>`;
    fb = `<div class="feedback ${item.correct ? 'ok' : 'bad'}"><h4>${item.correct ? '✔ Benar' : '✘ Kurang tepat'} ${move}</h4>
      ${item.correct ? '' : `<p><b>Jawabanmu:</b> ${responseText(q, item.resp)}<br><b>Jawaban benar:</b> ${correctAnswerText(q)}</p>`}<p class="expl">${q.explain || ''}</p></div>`;
  }
  const last = s.cursor + 1 >= (s.fixed ? s.items.length : E.PRACTICE_SIZE.V + E.PRACTICE_SIZE.Q);
  render(`<div class="testbar"><div><b>${title}</b> &middot; ${secName(q.section)}</div><div>Soal ${inSec} / ${secTotal}</div><div class="clock" id="clock">00:00</div></div>${level}
    <div class="stage" id="stage">${renderQuestion(q, item.resp, { locked: item.checked, show: item.checked })}</div>${fb}
    <div class="actionbar">${q.section === 'Q' ? '<button class="btn ghost" data-act="calcopen">Calculator</button>' : ''}<span class="grow"></span>
    <a class="btn ghost" href="#/">Keluar</a>
    ${item.checked ? `<button class="btn primary" data-act="pnext">${last ? 'Selesai' : 'Soal berikutnya →'}</button>` : `<button class="btn primary" data-act="pcheck" id="checkbtn" ${E.isAnswered(q, item.resp) ? '' : 'disabled'}>Check Answer</button>`}</div>${calc.open ? calcHtml() : ''}`, { plain: true });
  tickId = setInterval(() => { const c = $('#clock'); if (c) c.textContent = mmss(Date.now() - s.startedAt); }, 1000);
  const c = $('#clock'); if (c) c.textContent = mmss(Date.now() - s.startedAt);
}
function practiceCheck() {
  const s = state.session, item = s.items[s.cursor];
  if (item.checked || !E.isAnswered(item.q, item.resp)) return;
  E.checkAnswer(s, item, Date.now() - item.startedAt);
  store.recordSeen(state, item.q, item.correct);
  persist();
  renderPractice();
  window.scrollTo(0, document.body.scrollHeight);
}
function practiceNext() {
  const s = state.session;
  s.cursor++;
  persist();
  renderPractice();
  window.scrollTo(0, 0);
}
function finishPractice() {
  const s = state.session;
  const items = s.items;
  const by = { V: { c: 0, n: 0 }, Q: { c: 0, n: 0 } };
  for (const it of items) { by[it.q.section].n++; if (it.correct) by[it.q.section].c++; }
  const correct = by.V.c + by.Q.c;
  const result = {
    id: s.id, kind: s.kind === 'review' ? 'review' : 'day', key: s.key, day: s.day, date: Date.now(), total: items.length, correct, bySection: by,
    thetaStart: s.thetaStart, thetaEnd: s.fixed ? s.thetaStart : s.theta, curve: items.map((it) => ({ d: it.q.difficulty, ok: it.correct, s: it.q.section })),
    topics: E.topicBreakdown(items), items: items.map((it) => ({ q: it.q, resp: it.resp, correct: it.correct, ms: it.ms })),
  };
  if (!s.fixed) {
    state.theta = { ...s.theta };
    const prev = state.progress[s.key];
    state.progress[s.key] = { done: true, resultId: s.id, pct: correct / items.length, date: Date.now(), attempts: (prev?.attempts || 0) + 1 };
  }
  store.addResult(state, result);
  state.session = null;
  persist();
  location.hash = `#/result/${result.id}`;
}

// ── Mock ──
const M = () => state.session.mock;
const curSec = () => M().sections[M().idx];
const timeScale = () => state.settings.timeScale;
const TEST_TITLE = 'GRE-Style Practice Test';
const secTotal = () => M().sections.length + (M().includeAWA ? 1 : 0);
const secNo = (i) => i + 1 + (M().includeAWA ? 1 : 0);
const minutesText = (min) => (timeScale() ? `${Math.round(min * timeScale())} minutes` : 'untimed');

// Section directions (paraphrased in our own words; not ETS text).
const DIRECTIONS = {
  AWA: `<p>This section measures your ability to think critically and to express your ideas in writing. You will be given one <b>Issue</b> topic and 30 minutes to plan and compose a response presenting your perspective on it.</p>
    <p>Readers evaluate how well you respond to the specific instructions, consider the complexity of the issue, organize and develop your ideas, support your position with relevant reasons and examples, and control the elements of standard written English.</p>
    <p>Plan before you write and leave time to proofread. A response on any topic other than the one presented receives a score of zero. The editor provides Cut, Paste, Undo and Redo; there is no spell checker.</p>`,
  V: `<p>For each question, indicate the best answer using the directions given for that question type.</p>
    <p>Within this section you can move with <b>Back</b> and <b>Next</b>, <b>Mark</b> questions to revisit, and open <b>Review</b> to see the status of every question. Once time expires or you exit the section, you cannot return to it.</p>`,
  Q: `<p>For each question, indicate the best answer using the directions given for that question type. An on-screen calculator is available.</p>
    <ul><li>All numbers used are real numbers.</li>
    <li>Geometric figures are not necessarily drawn to scale. You may assume that lines shown as straight are straight, points on a line are in the order shown, and all figures lie in a plane unless stated otherwise.</li>
    <li>Coordinate systems, number lines, and graphs in data sets are drawn to scale.</li></ul>
    <p>Within this section you can use <b>Back</b>, <b>Next</b>, <b>Mark</b> and <b>Review</b>. Once time expires or you exit the section, you cannot return to it.</p>`,
};

const tbtn = (act, label, { disabled = false, active = false, primary = false } = {}) =>
  `<button class="ets-btn${active ? ' active' : ''}${primary ? ' primary' : ''}" data-act="${act}" ${disabled ? 'disabled' : ''}>${label}</button>`;
function testHeader(sub, buttons, clock = '') {
  return `<div class="ets-bar"><div class="ets-title">${TEST_TITLE}</div><div class="ets-btns">${buttons}</div></div>
    <div class="ets-sub"><span>${sub}</span><span class="grow"></span>${clock}</div>`;
}
function clockHtml(endsAt, startedAt) {
  const hidden = state.settings.hideClock;
  const txt = endsAt ? mmss(endsAt - Date.now()) : mmss(Date.now() - startedAt);
  return `<div class="tb-clock"><span class="clock" id="clock" ${hidden ? 'style="visibility:hidden"' : ''}>${txt}</span><button class="ets-mini" data-act="toggleclock">${hidden ? 'Show Time' : 'Hide Time'}</button></div>`;
}
function startTicker(endsAt, startedAt, onExpire) {
  const upd = () => {
    const c = $('#clock');
    if (!c) return;
    const left = endsAt ? endsAt - Date.now() : null;
    c.textContent = endsAt ? mmss(left) : mmss(Date.now() - startedAt);
    const warn = endsAt && left < 5 * 60000;
    c.classList.toggle('warn', warn);
    if (warn) c.style.visibility = 'visible'; // the clock reappears for the final five minutes
    if (endsAt && left <= 0) { clearInterval(tickId); onExpire(); }
  };
  clearInterval(tickId);
  tickId = setInterval(upd, 500);
  upd();
}

function startMock() {
  const m = M();
  m.next = 0;
  if (m.includeAWA) { m.awa.prompt = E.AWA_PROMPTS[Math.floor(Math.random() * E.AWA_PROMPTS.length)]; m.phase = 'awadir'; } else m.phase = 'dir';
  persist();
}
function startAWA() {
  const a = M().awa;
  a.startedAt = Date.now();
  a.endsAt = timeScale() ? a.startedAt + 30 * 60000 * timeScale() : null;
  M().phase = 'awa';
  persist();
}
function startSection(i) {
  const s = state.session, m = M(), sec = m.sections[i];
  if (sec.role === 'adaptive') sec.tier = E.routeTier(m.sections.find((x) => x.key === sec.from).p);
  sec.items = E.buildMockSection(sec, sec.tier, state, s, i * 101);
  sec.startedAt = Date.now();
  sec.endsAt = timeScale() ? sec.startedAt + sec.minutes * 60000 * timeScale() : null;
  Object.assign(m, { idx: i, qi: 0, review: false, endPrompt: false, revSel: 0, phase: 'active' });
  sec.items[0].visited = true;
  persist();
}
function renderMock() {
  const m = M();
  if (m.phase === 'intro') startMock();
  if (m.phase === 'between') { m.next = m.idx + 1; m.phase = m.next >= m.sections.length ? 'finish' : 'dir'; } // sessions saved by older versions
  if (m.phase === 'awadir') return renderDirections('AWA');
  if (m.phase === 'awa') return renderAWA();
  if (m.phase === 'dir') return renderDirections(m.next);
  if (m.phase === 'finish') return renderFinish();
  if (m.review) return renderMockReview();
  if (m.endPrompt) return renderEndPrompt();
  return renderMockQuestion();
}

function renderDirections(which) {
  const m = M(), isAWA = which === 'AWA', sec = isAWA ? null : m.sections[which];
  const n = isAWA ? 1 : secNo(which);
  const name = isAWA ? 'Analytical Writing' : secName(sec.section);
  const saved = (!isAWA && (which > 0 || m.awa.done)) ? '<p class="saved">Your responses to the previous section have been saved.</p>' : '';
  render(testHeader(`Section ${n} of ${secTotal()}`, tbtn('quit', 'Quit Test') + tbtn('dircont', 'Continue', { primary: true })) +
    `<div class="stage dir">${saved}<h1>Section ${n} of ${secTotal()}: ${name}</h1>
    <p class="meta">${isAWA ? `1 task (Analyze an Issue) &middot; ${minutesText(30)}` : `${sec.n} questions &middot; ${minutesText(sec.minutes)}`}</p>
    ${DIRECTIONS[isAWA ? 'AWA' : sec.section]}<p>Click <b>Continue</b> to begin. The section timer starts when the first ${isAWA ? 'screen' : 'question'} appears.</p></div>`, { plain: true });
}

// ── Essay editor (Cut / Paste / Undo / Redo with an internal clipboard, like the test software) ──
const ed = { undo: [], redo: [], prev: '', at: 0, buf: '' };
function renderAWA() {
  const m = M(), a = m.awa;
  Object.assign(ed, { undo: [], redo: [], prev: a.text, at: 0 });
  const words = (a.text.trim().match(/\S+/g) || []).length;
  const [issue, ...task] = a.prompt.split('\n\n');
  render(testHeader(`Section 1 of ${secTotal()} | Analytical Writing`, tbtn('quit', 'Quit Test') + tbtn('awaexit', 'Exit Section') + tbtn('help', 'Help'), clockHtml(a.endsAt, a.startedAt)) +
    `<div class="stage awa"><div class="prompt"><p class="issue">${esc(issue)}</p><p>${esc(task.join(' '))}</p></div>
    <div class="ed-tools"><button class="ets-mini" data-act="edcut">Cut</button><button class="ets-mini" data-act="edpaste">Paste</button><button class="ets-mini" data-act="edundo">Undo</button><button class="ets-mini" data-act="edredo">Redo</button><span class="grow"></span><span class="wc" id="wc">${words} words</span></div>
    <textarea id="essay" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off" aria-label="Response">${esc(a.text)}</textarea></div>`, { plain: true });
  startTicker(a.endsAt, a.startedAt, endAWA);
}
function setEssay(text, caret) {
  const ta = $('#essay');
  ta.value = text;
  ta.focus();
  ta.selectionStart = ta.selectionEnd = caret;
  essayChanged(text, true);
}
function essayChanged(text, snapshot) {
  if (snapshot || Date.now() - ed.at > 800 || /\s$/.test(text)) { if (ed.undo[ed.undo.length - 1] !== ed.prev) ed.undo.push(ed.prev); ed.at = Date.now(); if (ed.undo.length > 300) ed.undo.shift(); }
  if (!snapshot) ed.redo = [];
  ed.prev = text;
  M().awa.text = text;
  $('#wc').textContent = `${(text.trim().match(/\S+/g) || []).length} words`;
  clearTimeout(viewSession._t); viewSession._t = setTimeout(persist, 600);
}
function edCut() {
  const ta = $('#essay'), { selectionStart: a, selectionEnd: b, value: v } = ta;
  if (a === b) return;
  ed.buf = v.slice(a, b);
  ed.redo = [];
  setEssay(v.slice(0, a) + v.slice(b), a);
}
function edPaste() {
  const ta = $('#essay'), { selectionStart: a, selectionEnd: b, value: v } = ta;
  if (!ed.buf) return;
  ed.redo = [];
  setEssay(v.slice(0, a) + ed.buf + v.slice(b), a + ed.buf.length);
}
function edUndo() {
  if (!ed.undo.length) return;
  const ta = $('#essay');
  ed.redo.push(ta.value);
  const t = ed.undo.pop();
  ta.value = t; ed.prev = t; M().awa.text = t;
  $('#wc').textContent = `${(t.trim().match(/\S+/g) || []).length} words`;
  persist();
}
function edRedo() {
  if (!ed.redo.length) return;
  const ta = $('#essay');
  ed.undo.push(ta.value);
  const t = ed.redo.pop();
  ta.value = t; ed.prev = t; M().awa.text = t;
  $('#wc').textContent = `${(t.trim().match(/\S+/g) || []).length} words`;
  persist();
}
function endAWA() {
  const m = M();
  m.awa.done = true;
  m.awa.endedAt = Date.now();
  m.phase = 'dir'; m.next = 0;
  persist();
  route();
}

// ── Section screens ──
function statusOf(it) {
  if (E.isAnswered(it.q, it.resp)) return 'Answered';
  if (E.isPartial(it.q, it.resp)) return 'Incomplete';
  return it.visited ? 'Not Answered' : 'Not Seen';
}
const sectionSub = (extra = '') => `Section ${secNo(M().idx)} of ${secTotal()} | ${secName(curSec().section)}${extra}`;
function renderMockQuestion() {
  const m = M(), sec = curSec(), it = sec.items[m.qi], q = it.q;
  it.visited = true;
  const btns = tbtn('quit', 'Quit Test') + tbtn('exitsec', 'Exit Section') + tbtn('mreview', 'Review') + tbtn('mmark', it.marked ? 'Marked' : 'Mark', { active: it.marked }) + tbtn('help', 'Help') +
    (sec.section === 'Q' ? tbtn('calcopen', 'Calculator') : '') + tbtn('mback', 'Back', { disabled: m.qi === 0 }) + tbtn('mnext', 'Next', { primary: true });
  render(testHeader(`${sectionSub()} | Question ${m.qi + 1} of ${sec.items.length}`, btns, clockHtml(sec.endsAt, sec.startedAt)) +
    `<div class="stage" id="stage">${renderQuestion(q, it.resp, { group: it.group })}</div>${calc.open ? calcHtml() : ''}`, { plain: true });
  startTicker(sec.endsAt, sec.startedAt, endSection);
}
function renderEndPrompt() {
  const sec = curSec();
  const open = sec.items.filter((it) => statusOf(it) !== 'Answered').length;
  render(testHeader(sectionSub(), tbtn('quit', 'Quit Test') + tbtn('help', 'Help'), clockHtml(sec.endsAt, sec.startedAt)) +
    `<div class="stage dir"><h2>You have reached the end of this section.</h2>
    <p>You still have time remaining to review your answers${open ? `; <b>${open}</b> question${open > 1 ? 's are' : ' is'} not answered` : ''}.</p>
    <ul><li>Click <b>Return</b> to go back to the last question.</li><li>Click <b>Review Screen</b> to see the status of every question and go to any of them.</li><li>Click <b>Continue</b> to leave this section. You will not be able to return to it.</li></ul>
    <div class="actions">${tbtn('endreturn', 'Return')}${tbtn('mreview', 'Review Screen')}${tbtn('endcontinue', 'Continue', { primary: true })}</div></div>`, { plain: true });
  startTicker(sec.endsAt, sec.startedAt, endSection);
}
function renderMockReview() {
  const m = M(), sec = curSec();
  const sel = m.revSel ?? m.qi;
  render(testHeader(sectionSub(' | Review'), tbtn('quit', 'Quit Test') + tbtn('exitsec', 'Exit Section') + tbtn('help', 'Help') + tbtn('revgo', 'Go to Question') + tbtn('revreturn', 'Return', { primary: true }), clockHtml(sec.endsAt, sec.startedAt)) +
    `<div class="stage"><p class="inst">Below is a list of the questions in this section with their status. To go to a question, click its row and then click <b>Go to Question</b> (or double-click the row). Click <b>Return</b> to go back to the question you were on.</p>
    <table class="rv-table"><tr><th>Question Number</th><th>Status</th><th>Marked</th></tr>${sec.items.map((it, i) => { const st = statusOf(it); return `<tr data-act="revsel" data-i="${i}" class="${st.replace(' ', '-').toLowerCase()}${i === sel ? ' selected' : ''}"><td>${i + 1}</td><td>${st}</td><td>${it.marked ? '✓' : ''}</td></tr>`; }).join('')}</table></div>`, { plain: true });
  startTicker(sec.endsAt, sec.startedAt, endSection);
}
function showHelp() {
  const m = M();
  const q = m.phase === 'active' && !m.review && !m.endPrompt ? curSec().items[m.qi].q : null;
  const which = m.phase === 'awa' ? 'AWA' : curSec().section;
  $('.modal')?.remove();
  app.insertAdjacentHTML('beforeend', `<div class="modal" role="dialog" aria-label="Help"><div class="modal-box"><h2>Help</h2>
    <p class="muted">The clock keeps running while Help is open.</p>
    ${q ? `<h3>Question directions: ${typeLabel(q)}</h3><p>${instructions(q)}</p>` : ''}
    <h3>Section directions</h3>${DIRECTIONS[which]}
    <h3>Testing tools</h3><ul><li><b>Quit Test</b> ends the test without scores.</li><li><b>Exit Section</b> submits this section; you cannot return.</li>
    <li><b>Review</b> lists every question with its status (Answered, Not Answered, Incomplete, Not Seen) and whether it is marked.</li>
    <li><b>Mark</b> flags the current question so it stands out on the Review screen.</li><li><b>Back</b> / <b>Next</b> move between questions in this section.</li>
    ${which === 'Q' ? '<li><b>Calculator</b> opens a movable calculator that follows the order of operations; <b>Transfer Display</b> copies its value into a Numeric Entry box.</li>' : ''}
    <li><b>Hide Time</b> hides the clock; it reappears automatically for the last five minutes.</li></ul>
    <div class="actions">${tbtn('helpclose', 'Return', { primary: true })}</div></div></div>`);
}
function endSection() {
  const m = M(), sec = curSec();
  if (sec.done) return;
  sec.done = true;
  sec.p = E.weighted(sec.items);
  sec.endedAt = Date.now();
  for (const it of sec.items) { it.correct = E.grade(it.q, it.resp); store.recordSeen(state, it.q, it.correct); }
  m.next = m.idx + 1;
  m.phase = m.next >= m.sections.length ? 'finish' : 'dir';
  m.review = false; m.endPrompt = false;
  calc.open = false;
  persist();
  route();
}
function renderFinish() {
  render(testHeader('Test complete', tbtn('reportscores', 'Report Scores', { primary: true }) + tbtn('cancelscores', 'Cancel Scores')) +
    `<div class="stage dir"><h1>You have completed the test.</h1>
    <p>As on the real test, you now choose whether to <b>report</b> or <b>cancel</b> your scores before seeing them.</p>
    <ul><li><b>Report Scores</b>: your unofficial Verbal and Quantitative scores are shown and this mock test is recorded in your progress.</li>
    <li><b>Cancel Scores</b>: no scores are shown or recorded, and this mock test stays open to retake.</li></ul></div>`, { plain: true });
}
function finishMock() {
  const s = state.session, m = M();
  const scores = E.mockScores(s);
  const items = m.sections.flatMap((sec) => sec.items.map((it) => ({ q: it.q, resp: it.resp, correct: it.correct, marked: it.marked, sec: sec.key })));
  const secs = m.sections.map((sec) => ({ key: sec.key, section: sec.section, tier: sec.tier, ...E.sectionSummary(sec.items), p: sec.p, secs: Math.round(((sec.endedAt || 0) - sec.startedAt) / 1000) }));
  const correct = items.filter((i) => i.correct).length;
  const words = (m.awa.text.trim().match(/\S+/g) || []).length;
  const result = { id: s.id, kind: 'mock', key: s.key, mock: s.mockNo, date: Date.now(), total: items.length, correct, scores, sections: secs, awa: m.includeAWA ? { prompt: m.awa.prompt, text: m.awa.text, words } : null, topics: E.topicBreakdown(items), items };
  for (const sc of ['V', 'Q']) if (scores[sc]) state.theta[sc] = +(0.5 * state.theta[sc] + 0.5 * E.scoreToTheta(scores[sc].score)).toFixed(3);
  const prev = state.progress[s.key];
  state.progress[s.key] = { done: true, resultId: s.id, pct: correct / items.length, score: { V: scores.V?.score, Q: scores.Q?.score }, date: Date.now(), attempts: (prev?.attempts || 0) + 1 };
  store.addResult(state, result);
  state.session = null;
  persist();
  location.hash = `#/result/${result.id}`;
}

// ───────────────────────── Results ─────────────────────────
function reviewList(items) {
  if (!items) return '<p class="muted">Detail soal sudah dihapus untuk hasil lama (hanya 12 hasil terakhir disimpan lengkap).</p>';
  return `<div class="filter"><button class="btn small active" data-act="filter" data-f="all">Semua (${items.length})</button><button class="btn small" data-act="filter" data-f="bad">Salah (${items.filter((i) => !i.correct).length})</button></div>
  <div id="rvlist">${items.map((it, i) => `<details class="rv ${it.correct ? 'ok' : 'bad'}"><summary><span class="n">${i + 1}</span><span class="t">${typeLabel(it.q)}</span><span class="d">${DIFF_LABEL[it.q.difficulty]}</span><span class="r">${it.correct ? '✔' : it.resp == null ? '—' : '✘'}</span></summary>
    ${renderQuestion(it.q, it.resp, { locked: true, show: true })}<div class="expl"><p><b>Jawabanmu:</b> ${responseText(it.q, it.resp)}<br><b>Jawaban benar:</b> ${correctAnswerText(it.q)}</p><p>${it.q.explain || ''}</p></div></details>`).join('')}</div>`;
}
function topicBars(topics) {
  const rows = Object.entries(topics).sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n);
  return `<div class="bars">${rows.map(([k, v]) => `<div class="bar"><span class="lab">${TOPIC_LABEL[k] || k[0].toUpperCase() + k.slice(1)}</span><span class="track"><i class="${v.c / v.n < 0.5 ? 'low' : ''}" style="width:${(v.c / v.n) * 100}%"></i></span><span class="val">${v.c}/${v.n}</span></div>`).join('')}</div>`;
}
function curveSvg(curve) {
  const w = 22, W = curve.length * w + 20, H = 110;
  const pts = curve.map((c, i) => [10 + i * w + w / 2, H - 15 - (c.d - 1) * 20]);
  return `<svg class="curve" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Difficulty per question"><polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="2"/>
    ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="6" class="${curve[i].ok ? 'c-ok' : 'c-bad'}"><title>Q${i + 1}: ${DIFF_LABEL[curve[i].d]} — ${curve[i].ok ? 'benar' : 'salah'}</title></circle>`).join('')}
    <line x1="${10 + 10 * w}" y1="0" x2="${10 + 10 * w}" y2="${H}" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="3 3"/></svg>`;
}

function viewResult(id) {
  const r = state.results.find((x) => x.id === id);
  if (!r) { location.hash = '#/'; return; }
  const nk = nextKey();
  if (r.kind === 'mock') {
    const field = SC.FIELD_BY_ID[state.target.field];
    const card = (sec) => {
      const sc = r.scores[sec];
      if (!sc) return '';
      const p = SC.percentile(sec, sc.score), [lo, hi] = SC.scoreBand(sec, sc.score), tgt = targetFor(sec);
      return `<div class="card ability"><h3>${secName(sec)}</h3><div class="score big">${sc.score}<small>130\u2013170 &middot; perkiraan</small></div>
        <p>${pill(SC.standing(p))} Persentil <b>${p}</b> <span class="muted">(tabel resmi ETS)</span></p>
        <p class="muted">Rentang wajar \u00B1SEM: ${lo}\u2013${hi} &middot; Section 2: level <b>${sc.tier}</b>${field ? ` &middot; rata-rata pendaftar ${esc(field.name.split(' (')[0])}: <b>${field[sec]}</b>` : ''}${tgt ? ` &middot; target kamu <b>${tgt}</b>${sc.score >= tgt ? ' \u2714' : ` (kurang ${tgt - sc.score})`}` : ''}</p></div>`;
    };
    render(`<a class="back" href="#/">&larr; Dashboard</a><h1>Mock Test ${r.mock} &mdash; Hasil</h1>
      <div class="grid2">${card('V')}${card('Q')}</div>
      <div class="card"><h3>Ringkasan per section</h3><table class="data"><tr><th>Section</th><th>Benar</th><th>Skor terbobot</th><th>Tingkat</th><th>Waktu</th></tr>${r.sections.map((s) => `<tr><td>${secName(s.section)} ${s.key.slice(1)}</td><td>${s.c}/${s.n}</td><td>${pct(s.p)}</td><td>${s.tier === 'router' ? 'routing' : s.tier}</td><td>${mmss(s.secs * 1000)}</td></tr>`).join('')}</table>
      <p class="muted">Skor adalah <b>estimasi</b> berdasarkan bobot kesulitan soal dan tingkat Section 2. Bukan skor resmi ETS; bank soal ini orisinal dan lebih kecil dari GRE asli.</p></div>
      ${r.awa ? `<div class="card"><h3>Analytical Writing</h3><p>${r.awa.words} kata. Esai tidak dinilai otomatis. Periksa sendiri: posisi jelas? contoh konkret? mempertimbangkan sisi lain? struktur & tata bahasa?</p><details><summary>Lihat esai &amp; topik</summary><p class="pre">${esc(r.awa.prompt)}</p><hr><p class="pre">${esc(r.awa.text) || '<i>(kosong)</i>'}</p></details>${essayPanel(r.id, r.awa)}</div>` : ''}
      <div class="card"><h3>Akurasi per topik</h3>${topicBars(r.topics)}</div>
      <div class="actions">${nk ? `<a class="btn primary" href="#/start/${nk}">Lanjut: ${itemTitle(planItem(nk))}</a>` : ''}<a class="btn" href="#/mistakes">Latihan ulang kesalahan</a></div>
      <h2>Pembahasan</h2>${reviewList(r.items)}`);
    return;
  }
  render(`<a class="back" href="#/">&larr; Dashboard</a><h1>${r.kind === 'review' ? 'Latihan ulang kesalahan' : `Day ${r.day}`} &mdash; Hasil</h1>
    <div class="grid2"><div class="card"><div class="score big">${r.correct}<small>/ ${r.total} benar</small></div><p class="muted">Verbal ${r.bySection.V.c}/${r.bySection.V.n} &middot; Quant ${r.bySection.Q.c}/${r.bySection.Q.n}</p></div>
    ${r.kind === 'day' ? `<div class="card"><h3>Perubahan level</h3><p>Verbal: <b>${E.thetaToScore(r.thetaStart.V)} → ${E.thetaToScore(r.thetaEnd.V)}</b><br>Quant: <b>${E.thetaToScore(r.thetaStart.Q)} → ${E.thetaToScore(r.thetaEnd.Q)}</b></p><p class="muted">Estimasi skor adaptif (bukan skor resmi).</p></div>` : ''}</div>
    ${r.kind === 'day' ? `<div class="card"><h3>Kurva kesulitan</h3><p class="muted">Tiap titik = satu soal (tinggi = tingkat kesulitan). Hijau benar, merah salah. Garis putus-putus memisahkan Verbal dan Quant.</p><div class="scroll-x">${curveSvg(r.curve)}</div></div>` : ''}
    <div class="card"><h3>Akurasi per topik</h3>${topicBars(r.topics)}</div>
    ${r.kind === 'day' ? `<div class="card"><h3>Kosakata Day ${r.day}</h3><div class="words">${VOC.wordsForDay(r.day).map(wordCard).join('')}</div><div class="actions"><a class="btn" href="#/vocab/review">Review kosakata</a></div></div>` : ''}
    <div class="actions">${nk && r.kind === 'day' ? `<a class="btn primary" href="#/start/${nk}">Lanjut: ${itemTitle(planItem(nk))}</a>` : '<a class="btn primary" href="#/">Dashboard</a>'}</div>
    <h2>Pembahasan</h2>${reviewList(r.items)}`);
}

// ───────────────────────── Essay scoring ─────────────────────────
const listHtml = (a) => (a?.length ? `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
function heurHtml(h) {
  return `<div class="essay-fb"><div class="essay-score"><span>${h.score}</span><small>/ 6 &middot; estimasi otomatis (fitur permukaan saja)</small></div>
    <ul class="fb-list">${h.feedback.map((f) => `<li class="${f.type}">${esc(f.text)}</li>`).join('')}</ul>
    <p class="muted">${h.metrics.words} kata &middot; ${h.metrics.paragraphs} paragraf &middot; ${h.metrics.sentences} kalimat. Penilai otomatis ini tidak bisa menilai kebenaran logika argumen; untuk umpan balik isi, gunakan penilaian AI.</p></div>`;
}
function aiHtml(a) {
  const sc = a.subscores;
  return `<div class="essay-fb ai"><div class="essay-score"><span>${a.score}</span><small>/ 6 &middot; penilaian AI (rubrik GRE Issue task; bukan skor resmi ETS) &middot; setara persentil ${SC.percentile('AW', a.score)}</small></div>
    <p>${esc(a.summary)}</p>
    <div class="subs">${[['position', 'Posisi'], ['development', 'Pengembangan'], ['organization', 'Organisasi'], ['language', 'Bahasa']].map(([k, l]) => `<span>${l}<b>${sc[k]}</b></span>`).join('')}</div>
    ${a.strengths.length ? `<h4>Kekuatan</h4>${listHtml(a.strengths)}` : ''}${a.improvements.length ? `<h4>Yang perlu diperbaiki</h4>${listHtml(a.improvements)}` : ''}
    ${a.language_errors.length ? `<h4>Kesalahan bahasa</h4><ul>${a.language_errors.map((e) => `<li><s>${esc(e.quote)}</s> &rarr; <b>${esc(e.fix)}</b></li>`).join('')}</ul>` : ''}</div>`;
}
function essayPanel(rid, awa) {
  return `<div class="essay-panel" id="essay-panel" data-rid="${rid || ''}"><div class="actions"><button class="btn" data-act="essayheur">Nilai cepat (offline)</button>
    <button class="btn primary" data-act="essayai">Nilai dengan AI</button></div>
    <p class="muted">Penilaian AI mengirim teks esai ke server ini lalu ke Anthropic API; hanya berfungsi jika admin sudah mengatur <code>ANTHROPIC_API_KEY</code>.</p>
    <div id="essay-out">${awa?.heur ? heurHtml(awa.heur) : ''}${awa?.ai ? aiHtml(awa.ai) : ''}</div></div>`;
}
function essaySource() {
  const rid = $('#essay-panel').dataset.rid;
  if (rid) { const r = state.results.find((x) => x.id === rid); return { prompt: r.awa.prompt, text: r.awa.text, awa: r.awa }; }
  return { prompt: E.AWA_PROMPTS[Number($('#ep-sel').value)], text: $('#ep-text').value, awa: null };
}
async function scoreEssayAction(kind) {
  const src = essaySource(), out = $('#essay-out');
  if (kind === 'heur') {
    const h = estimateEssay(src.text);
    if (src.awa) { src.awa.heur = h; persist(); }
    out.innerHTML = heurHtml(h) + (src.awa?.ai ? aiHtml(src.awa.ai) : '');
    return;
  }
  out.innerHTML = '<p class="muted">Menilai dengan AI\u2026 (10\u201330 detik)</p>';
  try {
    const res = await fetch('/api/score-essay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: src.prompt, essay: src.text }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal');
    if (src.awa) { src.awa.ai = data; persist(); }
    out.innerHTML = aiHtml(data) + (src.awa?.heur ? heurHtml(src.awa.heur) : '');
  } catch (e) { out.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
}
function viewEssay() {
  const d = state.essayDraft || { idx: 0, text: '' };
  render(`<h1>Latihan esai (Analyze an Issue)</h1><div class="card awa"><label class="stack"><span><b>Pilih topik</b></span><select id="ep-sel">${E.AWA_PROMPTS.map((p, i) => `<option value="${i}" ${d.idx === i ? 'selected' : ''}>${i + 1}. ${esc(p.split('\n')[0].slice(0, 90))}\u2026</option>`).join('')}</select></label>
    <div class="prompt" id="ep-prompt">${esc(E.AWA_PROMPTS[d.idx])}</div>
    <textarea id="ep-text" placeholder="Type your response here (target: 350\u2013500 words)." spellcheck="false">${esc(d.text)}</textarea><div class="wc"><span id="ep-wc">${(d.text.trim().match(/\S+/g) || []).length} words</span></div>
    ${essayPanel('', null)}</div>`);
}

// ───────────────────────── Vocabulary trainer ─────────────────────────
let vr = null; // current flashcard run (not persisted; grades are)
const shuffled = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
function viewVocab(arg) {
  if (arg === 'review') return renderVocabReview('due');
  if (arg === 'top52') return renderVocabReview('top52');
  if (arg?.startsWith('list')) return renderVocabList(arg.includes('top52'));
  const day = currentDay(), d = vocabDeck(), todo = d.due.length + Math.min(10, d.fresh.length);
  render(`<h1>Kosakata GRE</h1>
    <div class="tiles"><div class="tile"><b>${d.mastered}</b><span>dikuasai</span></div><div class="tile"><b>${d.intro}</b><span>sudah diperkenalkan</span></div><div class="tile"><b>${d.due.length}</b><span>jatuh tempo</span></div><div class="tile"><b>${VOC.WORDS.length}</b><span>total kata</span></div></div>
    <div class="actions">${todo ? `<a class="btn primary" href="#/vocab/review">Mulai review (${todo} kartu)</a>` : '<span class="muted">Tidak ada kartu jatuh tempo. Lanjutkan modul harian untuk membuka kata baru.</span>'}<a class="btn" href="#/vocab/list">Daftar lengkap</a></div>
    ${top52Card()}
    <div class="card"><h3>Kosakata hari ini &mdash; Day ${day}</h3><div class="words">${VOC.wordsForDay(day).map(wordCard).join('')}</div></div>
    <div class="card prose"><h3>Cara belajar kosakata untuk GRE</h3><ul>
    <li><b>Belajar per kelompok sinonim.</b> Sentence Equivalence menuntut dua kata yang menghasilkan arti kalimat sama; kata di sini dikelompokkan seperti itu.</li>
    <li><b>Waspadai jebakan pasangan sinonim.</b> Pilihan SE sering berisi dua pasangan sinonim lain yang tidak cocok dengan konteks. Tentukan dulu arti yang dibutuhkan kalimat, baru cari katanya.</li>
    <li><b>Perhatikan konotasi.</b> <i>frugal</i> (hemat, positif) berbeda dengan <i>parsimonious</i> (kikir, negatif).</li>
    <li><b>Ulangi berkala.</b> Kartu yang kamu ingat muncul lagi setelah 1, 3, 7, 14, lalu 30 hari; yang lupa kembali ke awal. Kata dari soal yang salah otomatis masuk review.</li>
    <li><b>Baca teks bergaya akademik</b> (esai sains, sejarah, ekonomi). Bacaan GRE seimbang antara humaniora, ilmu sosial, dan ilmu alam.</li></ul></div>`);
}
function top52Card() {
  const now = Date.now(), ws = VOC.TOP52_WORDS;
  const mastered = ws.filter((w) => state.vocab[w.word]?.box >= 4).length, started = ws.filter((w) => state.vocab[w.word]).length;
  const due = ws.filter((w) => !state.vocab[w.word] || state.vocab[w.word].due <= now).length;
  return `<div class="card t52-card"><div><h3>Top 52 GRE Words</h3><p class="muted">${mastered} dikuasai &middot; ${started} sudah dipelajari &middot; ${due} siap direview. Kata-kata ini diperkenalkan pertama (Day 1&ndash;5) dan ditandai <span class="t52">Top 52</span>.</p>
    <div class="meter"><i style="width:${(mastered / ws.length) * 100}%"></i></div></div>
    <div class="actions">${due ? `<a class="btn primary" href="#/vocab/top52">Review Top 52 (${Math.min(20, due)} kartu)</a>` : ''}<a class="btn" href="#/vocab/list?top52">Lihat ke-52 kata</a></div></div>`;
}
function startVocabReview(mode) {
  const now = Date.now();
  if (mode === 'top52') {
    const ws = VOC.TOP52_WORDS.map((w) => w.word);
    const due = ws.filter((w) => state.vocab[w] && state.vocab[w].due <= now), fresh = ws.filter((w) => !state.vocab[w]);
    vr = { mode, queue: [...shuffled(due), ...fresh].slice(0, 20), i: 0, shown: false, ok: 0, again: new Set() };
    return;
  }
  const d = vocabDeck();
  vr = { mode, queue: [...shuffled(d.due), ...d.fresh.slice(0, 10)].slice(0, 20), i: 0, shown: false, ok: 0, again: new Set() };
}
function renderVocabReview(mode) {
  if (!vr || (mode && vr.mode !== mode)) startVocabReview(mode);
  if (vr.i >= vr.queue.length) {
    const n = vr.queue.length - vr.again.size, ok = vr.ok;
    vr = null;
    render(`<a class="back" href="#/vocab">&larr; Kosakata</a><div class="card flash"><h2>${n ? 'Review selesai' : 'Tidak ada kartu untuk direview'}</h2>${n ? `<p>${ok} jawaban &ldquo;ingat&rdquo;. Kartu berikutnya dijadwalkan otomatis.</p>` : '<p class="muted">Selesaikan modul harian untuk membuka kata baru, atau kembali besok.</p>'}<div class="actions center"><a class="btn primary" href="#/">Dashboard</a><a class="btn" href="#/vocab/list">Daftar kata</a></div></div>`);
    return;
  }
  const w = VOC.WORD_BY[vr.queue[vr.i]];
  render(`<a class="back" href="#/vocab">&larr; Kosakata</a><div class="card flash"><div class="muted">${vr.mode === 'top52' ? 'Top 52 &middot; ' : ''}Kartu ${vr.i + 1} / ${vr.queue.length}</div>
    <div class="fw">${w.word}</div><div class="pos">${POS[w.pos]}</div>
    ${vr.shown ? `${wordCard(w)}<div class="actions center"><button class="btn danger" data-act="vno">Belum ingat</button><button class="btn primary" data-act="vyes">Ingat</button></div>` : '<p class="muted">Coba ingat artinya dan satu sinonimnya, lalu buka kartunya.</p><button class="btn primary big" data-act="vshow">Tampilkan arti</button>'}</div>`);
}
function vocabGrade(ok) {
  const w = vr.queue[vr.i];
  store.srsGrade(state, w, ok);
  if (ok) vr.ok++; else if (!vr.again.has(w)) { vr.again.add(w); vr.queue.push(w); }
  vr.i++; vr.shown = false;
  persist();
  renderVocabReview(vr.mode);
}
function renderVocabList(onlyTop) {
  render(`<a class="back" href="#/vocab">&larr; Kosakata</a><h1>Daftar kosakata (${VOC.WORDS.length} kata)</h1>
    <div class="filters"><input id="vsearch" placeholder="Cari kata atau arti (Inggris / Indonesia)" autocomplete="off"><select id="vtier"><option value="">Semua tingkat</option>${[1, 2, 3, 4, 5].map((t) => `<option value="${t}">Tingkat ${t}</option>`).join('')}</select>
    <label class="check"><input type="checkbox" id="vtop" ${onlyTop ? 'checked' : ''}> Hanya Top 52</label></div>
    <div class="words" id="vlist">${[...VOC.WORDS].sort((a, b) => a.word.localeCompare(b.word)).map((w) => wordCard(w).replace(/^<div class="word([^"]*)"/, `<div class="word$1" data-tier="${w.tier}" data-q="${esc((w.word + ' ' + (w.def || '') + ' ' + w.meaning + ' ' + w.idn + ' ' + (w.note || '')).toLowerCase())}"`)).join('')}</div>
    <p class="muted">Pemilihan kata Top 52 mengikuti artikel Kaplan &ldquo;Top 52 GRE Vocabulary Words&rdquo;; definisi, contoh kalimat, dan catatan ditulis ulang dengan kata-kata sendiri.</p>`);
  filterVocab();
}
function filterVocab() {
  const q = ($('#vsearch')?.value || '').trim().toLowerCase(), t = $('#vtier')?.value || '', top = $('#vtop')?.checked;
  document.querySelectorAll('#vlist .word').forEach((el) => { el.hidden = (q && !el.dataset.q.includes(q)) || (t && el.dataset.tier !== t) || (top && !el.classList.contains('top52')); });
}

// ───────────────────────── Mistakes / Settings / About ─────────────────────────
function viewMistakes() {
  const list = Object.values(state.missed).sort((a, b) => b.ts - a.ts);
  render(`<h1>Soal yang pernah salah</h1>${list.length ? `<p>${list.length} soal. Jawab benar saat latihan ulang untuk mengeluarkannya dari daftar ini.</p>
    <div class="actions"><button class="btn primary" data-act="startreview">Latihan ulang (maks. 10 soal)</button></div>
    <div id="rvlist">${list.slice(0, 40).map((m, i) => `<details class="rv bad"><summary><span class="n">${i + 1}</span><span class="t">${typeLabel(m.q)}</span><span class="d">${DIFF_LABEL[m.q.difficulty]}</span><span class="r">${dateStr(m.ts)}</span></summary>${renderQuestion(m.q, null, { locked: true, show: true })}<div class="expl"><p><b>Jawaban benar:</b> ${correctAnswerText(m.q)}</p><p>${m.q.explain || ''}</p></div></details>`).join('')}</div>` : '<div class="card"><p>Belum ada soal yang salah. Selesaikan modul harian dulu.</p></div>'}`);
}
function viewSettings() {
  const st = state.settings;
  render(`<h1>Pengaturan</h1><div class="card"><form data-form="settings" class="stack">
    <label>Nama<input name="name" value="${esc(state.name)}" maxlength="30"></label>
    <label>Faktor waktu mock test<select name="timeScale">${[[1, '1× (waktu asli GRE)'], [1.5, '1.5× (tambahan 50%)'], [2, '2× (tambahan 100%)'], [0, 'Tanpa batas waktu']].map(([v, l]) => `<option value="${v}" ${st.timeScale === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="check"><input type="checkbox" name="sequential" ${st.sequential ? 'checked' : ''}> Kunci berurutan (modul berikutnya terbuka setelah yang sebelumnya selesai)</label>
    <label class="check"><input type="checkbox" name="showLevel" ${st.showLevel ? 'checked' : ''}> Tampilkan level adaptif saat latihan harian</label>
    <fieldset class="target"><legend>Target skor</legend>
    <label>Bidang studi tujuan<select name="field"><option value="">\u2014 pilih \u2014</option>${SC.FIELDS.map((f) => `<option value="${f.id}" ${state.target.field === f.id ? 'selected' : ''}>${esc(f.name)} \u2014 rata-rata V ${f.V} / Q ${f.Q}</option>`).join('')}</select></label>
    <div class="row2"><label>Target Verbal<input name="tV" type="number" min="130" max="170" placeholder="ikut rata-rata bidang" value="${state.target.V ?? ''}"></label><label>Target Quant<input name="tQ" type="number" min="130" max="170" placeholder="ikut rata-rata bidang" value="${state.target.Q ?? ''}"></label></div>
    <p class="muted">Rata-rata bidang berasal dari data resmi ETS (pendaftar 2022\u20132025). Program yang kompetitif biasanya menuntut lebih tinggi dari rata-rata; cek angka yang dipublikasikan program tujuanmu.</p></fieldset>
    <button class="btn primary">Simpan</button></form></div>
    <div class="card"><h3>Cadangan data</h3><p class="muted">Progres disimpan di browser ini (localStorage). Ekspor untuk memindahkan ke perangkat/browser lain.</p>
    <div class="actions"><button class="btn" data-act="export">Ekspor JSON</button><label class="btn">Impor JSON<input type="file" id="import" accept="application/json" hidden></label><button class="btn danger" data-act="resetall">Hapus semua data</button></div></div>`);
}
function viewAbout() {
  render(`<h1>Panduan &amp; kemiripan dengan GRE asli</h1>
  <div class="card prose"><h3>Format GRE General Test (versi ringkas sejak 2023)</h3>
  <table class="data"><tr><th>Bagian</th><th>Soal</th><th>Waktu</th></tr><tr><td>Analytical Writing (Analyze an Issue)</td><td>1 tugas</td><td>30 mnt</td></tr><tr><td>Verbal Reasoning</td><td>2 section: 12 + 15</td><td>18 + 23 mnt</td></tr><tr><td>Quantitative Reasoning</td><td>2 section: 12 + 15</td><td>21 + 26 mnt</td></tr></table>
  <p>Skor Verbal dan Quant: 130&ndash;170 (kenaikan 1 poin). Analytical Writing: 0&ndash;6.</p>
  <h3>Jenis soal yang ada</h3><ul><li><b>Verbal:</b> Text Completion (1&ndash;3 blank), Sentence Equivalence, Reading Comprehension (pilihan tunggal, &ldquo;pilih semua yang benar&rdquo;, dan Select-in-Passage).</li>
  <li><b>Quant:</b> Quantitative Comparison, Multiple Choice (satu jawaban), Multiple Choice (pilih semua), Numeric Entry (angka atau pecahan), dan set Data Interpretation (tabel, grafik batang, diagram lingkaran) yang dipakai untuk beberapa soal. Materi: aritmetika, aljabar, geometri, analisis data, soal cerita.</li></ul>
  <h3>Cara adaptif bekerja</h3><ul><li><b>Mock test (section-adaptive, seperti GRE asli):</b> Section 1 bertingkat menengah. Persentase poin terbobot (soal sulit bernilai lebih) menentukan Section 2: mudah, menengah, atau sulit. Batas atas skor bergantung pada tingkat Section 2.</li>
  <li><b>Modul harian (question-adaptive):</b> level kemampuanmu diperbarui setelah tiap soal dengan model Elo. Benar pada soal yang sulit menaikkan level lebih banyak; soal berikutnya dipilih dekat level itu.</li></ul>
  <h3>Batasan yang jujur</h3><ul><li>Soal-soal di sini <b>orisinal</b> (bukan soal ETS yang berhak cipta). Soal Quant dan set Data Interpretation dihasilkan secara parametrik. Verbal memadukan ~100 soal tulisan tangan dengan soal Text Completion &amp; Sentence Equivalence yang dibangkitkan dari bank kosakata (${VOC.GROUPS.length} kelompok sinonim, ${VOC.WORDS.length} kata, termasuk daftar Top 52), sehingga tidak cepat habis; passage Reading Comprehension masih terbatas (10 passage) dan akan berulang.</li>
  <li>Skor latihan adalah estimasi; kalibrasi kesulitan soal belum diuji pada peserta nyata. Persentil yang ditampilkan memakai tabel resmi ETS, tetapi hanya seakurat estimasi skornya. Gunakan untuk memantau tren, bukan sebagai prediksi skor resmi.</li>
  <li>Untuk simulasi resmi, lengkapi dengan <i>POWERPREP</i> dari ETS.</li></ul></div>
  <div class="card prose" id="skor"><h3>Skor GRE: apa yang dianggap bagus?</h3>
  <p>Yang menentukan &ldquo;bagus&rdquo; adalah <b>persentil</b> (persen peserta yang skornya di bawahmu) dan <b>standar program tujuan</b>, bukan angka mentahnya. Data di bawah adalah data resmi ETS.</p>
  <table class="data"><tr><th>Skor</th><th>Persentil Verbal</th><th>Persentil Quant</th></tr>${[170, 165, 160, 155, 150, 145, 140, 135].map((x) => `<tr><td>${x}</td><td>${SC.percentile('V', x)}</td><td>${SC.percentile('Q', x)}</td></tr>`).join('')}</table>
  <ul><li><b>Rata-rata semua peserta:</b> Verbal ${SC.STATS.V.mean.toFixed(1)} (SD ${SC.STATS.V.sd}), Quant ${SC.STATS.Q.mean.toFixed(1)} (SD ${SC.STATS.Q.sd}), Analytical Writing ${SC.STATS.AW.mean.toFixed(1)}.</li>
  <li><b>Quant jauh lebih kompetitif:</b> 160 di Quant hanya persentil ${SC.percentile('Q', 160)}, sedangkan 160 di Verbal sudah persentil ${SC.percentile('V', 160)}. Untuk masuk 25% teratas butuh sekitar Q ${SC.scoreForPercentile('Q', 75)} tetapi cukup V ${SC.scoreForPercentile('V', 75)}.</li>
  <li><b>Patokan kasar</b> (rumusan kami, bukan standar resmi): persentil &ge;90 sangat kompetitif, &ge;75 kompetitif, &ge;50 di atas rata-rata, di bawah 50 perlu ditingkatkan. Program top bidang STEM biasanya menekankan Quant; humaniora dan hukum menekankan Verbal dan Writing.</li>
  <li><b>Analytical Writing:</b> ${[6, 5, 4.5, 4, 3.5, 3].map((x) => `${x.toFixed(1)} &rarr; persentil ${SC.percentile('AW', x)}`).join(' &middot; ')}.</li>
  <li><b>Skor tidak persis:</b> galat baku pengukuran (SEM) sekitar \u00B1${SC.STATS.V.sem.toFixed(1)} poin Verbal, \u00B1${SC.STATS.Q.sem.toFixed(1)} Quant, \u00B1${SC.STATS.AW.sem} Writing. Selisih 1&ndash;3 poin antar peserta atau antar tes belum tentu berarti.</li></ul>
  <h4>Rata-rata menurut bidang studi tujuan</h4>
  <table class="data"><tr><th>Bidang</th><th>Verbal</th><th>Quant</th><th>Writing</th></tr>${SC.FIELDS.map((f) => `<tr><td>${esc(f.name)}</td><td>${f.V}</td><td>${f.Q}</td><td>${f.AW.toFixed(1)}</td></tr>`).join('')}</table>
  <p class="muted">Sumber: ${SC.SOURCE}. Rata-rata bidang berasal dari mahasiswa tingkat akhir/lulusan yang menyebut bidang tujuan tersebut. Atur target kamu di <a href="#/settings">Pengaturan</a>.</p></div>`);
}

// ───────────────────────── Events ─────────────────────────
function updateResp(fn) {
  const s = state.session;
  if (s.kind === 'mock') { const it = curSec().items[M().qi]; it.resp = fn(it); } else { const it = s.items[s.cursor]; if (it.checked) return; it.resp = fn(it); }
}
function afterInput(rerender = true) {
  persist();
  if (!rerender) return;
  const s = state.session;
  if (s.kind === 'mock') { renderMockQuestion(); } else renderPractice();
}
const currentQ = () => { const s = state.session; return s.kind === 'mock' ? curSec().items[M().qi].q : s.items[s.cursor].q; };

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'pick') {
    if (el.tagName === 'INPUT' || el.classList.contains('sent')) {
      const q = currentQ(), i = Number(el.dataset.i);
      updateResp((it) => applyPick(q, it.resp, i, el.dataset.b ?? ''));
      afterInput();
    }
    return;
  }
  const handlers = {
    startday: () => { const p = planItem(el.dataset.key); state.session = E.createPractice(state, p); persist(); location.hash = '#/session'; },
    startmock: () => { const p = planItem(el.dataset.key); state.session = E.createMock(state, p.mock, $('#awa').checked); persist(); location.hash = '#/session'; },
    startreview: () => {
      const items = Object.values(state.missed).sort((a, b) => a.ts - b.ts).slice(0, 10).map((m) => ({ q: m.q, resp: null, checked: false, correct: null, thetaBefore: 0, thetaAfter: null, ms: 0 }));
      state.session = { id: `s${Date.now()}`, kind: 'review', fixed: true, startedAt: Date.now(), items, cursor: 0, theta: { ...state.theta }, thetaStart: { ...state.theta }, seed: 1, slot: {}, queue: [], genUse: {} };
      persist(); location.hash = '#/session';
    },
    abandon: () => { if (confirm('Batalkan sesi yang sedang berjalan? Progres sesi ini akan hilang.')) { state.session = null; persist(); route(); } },
    pcheck: practiceCheck, pnext: practiceNext,
    mmark: () => { const it = curSec().items[M().qi]; it.marked = !it.marked; persist(); renderMockQuestion(); },
    mnext: () => { const m = M(), sec = curSec(); if (m.qi < sec.items.length - 1) m.qi++; else m.endPrompt = true; persist(); renderMock(); },
    mback: () => { const m = M(); if (m.qi > 0) { m.qi--; persist(); renderMockQuestion(); } },
    mreview: () => { const m = M(); m.review = true; m.endPrompt = false; m.revSel = m.qi; persist(); renderMockReview(); },
    revsel: () => { M().revSel = Number(el.dataset.i); document.querySelectorAll('.rv-table tr.selected').forEach((r) => r.classList.remove('selected')); el.classList.add('selected'); persist(); },
    revgo: () => { const m = M(); m.qi = m.revSel ?? m.qi; m.review = false; persist(); renderMockQuestion(); },
    revreturn: () => { M().review = false; persist(); renderMockQuestion(); },
    endreturn: () => { M().endPrompt = false; persist(); renderMockQuestion(); },
    endcontinue: () => { if (confirm('Leave this section? You will not be able to return to it.')) endSection(); },
    exitsec: () => { const open = curSec().items.filter((it) => statusOf(it) !== 'Answered').length; if (confirm(`Exit this section now?${open ? ` ${open} question(s) are not answered.` : ''} You will not be able to return to it.`)) endSection(); },
    dircont: () => { if (M().phase === 'awadir') startAWA(); else startSection(M().next); route(); },
    awaexit: () => { if (confirm('Exit the Analytical Writing section? You will not be able to return to your response.')) endAWA(); },
    edcut: edCut, edpaste: edPaste, edundo: edUndo, edredo: edRedo,
    help: showHelp,
    helpclose: () => $('.modal')?.remove(),
    quit: () => { if (confirm('Quit the test? Your responses will not be scored and this mock test will not be recorded.')) { state.session = null; calc.open = false; persist(); location.hash = '#/'; } },
    reportscores: finishMock,
    cancelscores: () => { if (confirm('Cancel your scores? Nothing from this attempt will be recorded.')) { state.session = null; persist(); flash('Skor dibatalkan. Mock test ini belum tercatat.'); location.hash = '#/'; } },
    toggleclock: () => { state.settings.hideClock = !state.settings.hideClock; persist(); const c = $('#clock'); if (c && !c.classList.contains('warn')) c.style.visibility = state.settings.hideClock ? 'hidden' : 'visible'; el.textContent = state.settings.hideClock ? 'Show Time' : 'Hide Time'; },
    calcopen: () => { calc.open = true; showCalc(); },
    calcclose: () => { calc.open = false; $('.calc')?.remove(); },
    calckey: () => { press(el.dataset.k); const d = $('#calc-disp'); if (d) d.textContent = calcDisplay(); const mm = $('#calc-mem'); if (mm) mm.textContent = calc.mem ? 'M' : ''; },
    calcxfer: () => { const box = document.querySelector('.ne-box'); if (box && !box.disabled && !calc.err) { box.value = calc.entry; box.dispatchEvent(new Event('input', { bubbles: true })); } },
    vshow: () => { vr.shown = true; renderVocabReview(vr.mode); },
    vyes: () => vocabGrade(true),
    vno: () => vocabGrade(false),
    essayheur: () => scoreEssayAction('heur'),
    essayai: () => scoreEssayAction('ai'),
    filter: () => { document.querySelectorAll('[data-act=filter]').forEach((b) => b.classList.toggle('active', b === el)); $('#rvlist').dataset.filter = el.dataset.f; },
    export: () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([store.exportJSON(state)], { type: 'application/json' })); a.download = `gre-practice-${new Date().toISOString().slice(0, 10)}.json`; a.click(); },
    resetall: () => { if (confirm('Hapus SEMUA progres dan riwayat? Tindakan ini tidak bisa dibatalkan.')) { state = store.reset(); location.hash = '#/'; route(); } },
  };
  if (handlers[act]) { e.preventDefault(); handlers[act](); }
});

document.addEventListener('dblclick', (e) => {
  const row = e.target.closest('tr[data-act=revsel]');
  if (row) { const m = M(); m.qi = Number(row.dataset.i); m.review = false; persist(); renderMockQuestion(); }
});

// Calculator window can be dragged by its title bar.
let drag = null;
document.addEventListener('pointerdown', (e) => {
  const h = e.target.closest('[data-drag=calc]');
  if (!h || e.target.closest('button')) return;
  const box = h.parentElement.getBoundingClientRect();
  drag = { dx: e.clientX - box.left, dy: e.clientY - box.top };
  h.setPointerCapture(e.pointerId);
});
document.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const el = $('.calc');
  calc.x = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, e.clientX - drag.dx));
  calc.y = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, e.clientY - drag.dy));
  Object.assign(el.style, { left: calc.x + 'px', top: calc.y + 'px', right: 'auto', bottom: 'auto' });
});
document.addEventListener('pointerup', () => { drag = null; });

// The essay editor uses its own clipboard: outside text cannot be pasted in, as on the test.
document.addEventListener('paste', (e) => { if (e.target.id === 'essay') { e.preventDefault(); edPaste(); } });
document.addEventListener('cut', (e) => { if (e.target.id === 'essay') { e.preventDefault(); edCut(); } });
document.addEventListener('copy', (e) => { if (e.target.id === 'essay') { const t = e.target; ed.buf = t.value.slice(t.selectionStart, t.selectionEnd); } });
document.addEventListener('drop', (e) => { if (e.target.id === 'essay') e.preventDefault(); });
document.addEventListener('keydown', (e) => {
  if (e.target.id !== 'essay' || !(e.ctrlKey || e.metaKey)) return;
  const k = e.key.toLowerCase();
  if (k === 'z' && !e.shiftKey) { e.preventDefault(); edUndo(); } else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); edRedo(); }
});

function showCalc() {
  $('.calc')?.remove();
  app.insertAdjacentHTML('beforeend', calcHtml());
}

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'vsearch') { filterVocab(); return; }
  if (t.matches('[data-act=ne]')) {
    const f = t.dataset.f;
    updateResp((it) => {
      const r = { ...(it.resp || {}) };
      if (f === 'text') { r.text = t.value; delete r.num; delete r.den; const o = document.querySelectorAll('.ne-frac input'); o.forEach((x) => { x.value = ''; }); } else { r[f] = t.value; delete r.text; const b = document.querySelector('.ne-box'); if (b) b.value = ''; }
      return r;
    });
    persist();
    const s = state.session;
    if (s.kind !== 'mock') { const it = s.items[s.cursor]; const b = $('#checkbtn'); if (b) b.disabled = !E.isAnswered(it.q, it.resp); }
  } else if (t.id === 'ep-text') {
    state.essayDraft = { ...(state.essayDraft || { idx: 0 }), text: t.value };
    $('#ep-wc').textContent = `${(t.value.trim().match(/\S+/g) || []).length} words`;
    clearTimeout(viewSession._t); viewSession._t = setTimeout(persist, 600);
  } else if (t.id === 'essay') {
    essayChanged(t.value, false);
  }
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'vtier' || e.target.id === 'vtop') filterVocab();
  if (e.target.id === 'ep-sel') { const i = Number(e.target.value); state.essayDraft = { ...(state.essayDraft || { text: '' }), idx: i }; persist(); $('#ep-prompt').textContent = E.AWA_PROMPTS[i]; }
  if (e.target.id === 'import') {
    const f = e.target.files[0];
    if (!f) return;
    f.text().then((txt) => { try { state = store.importJSON(txt); persist(); flash('Data berhasil diimpor'); location.hash = '#/'; route(); } catch (err) { alert('Impor gagal: ' + err.message); } });
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form]');
  if (!form) return;
  e.preventDefault();
  const fd = new FormData(form);
  if (form.dataset.form === 'welcome') { state.name = (fd.get('name') || '').trim(); state.settings.welcomed = true; }
  if (form.dataset.form === 'settings') {
    state.name = (fd.get('name') || '').trim();
    state.settings.timeScale = Number(fd.get('timeScale'));
    state.settings.sequential = fd.has('sequential');
    state.settings.showLevel = fd.has('showLevel');
    const tnum = (v) => { const n = Number(v); return v !== '' && n >= 130 && n <= 170 ? Math.round(n) : null; };
    state.target = { field: fd.get('field') || '', V: tnum(fd.get('tV')), Q: tnum(fd.get('tQ')) };
    state.settings.welcomed = true;
    flash('Pengaturan disimpan');
  }
  persist();
  route();
});

// Warn before closing mid-session, and keep sessions on the same tab consistent.
window.addEventListener('beforeunload', () => persist());
route();
