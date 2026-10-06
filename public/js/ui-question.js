// Renders a question (all GRE item formats) to an HTML string, and maps clicks to responses.
import { PASSAGES } from './bank-verbal.js';
import { QC_OPTIONS, TYPE_LABEL } from './consts.js';
import { grade } from './engine.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const BLANK = (n, filled) => `<span class="blank${filled ? ' filled' : ''}">${filled || '&nbsp;'.repeat(8)}</span>`;
const ROMAN = ['(i)', '(ii)', '(iii)'];

export function instructions(q) {
  switch (q.type) {
    case 'tc': return q.blanks.length === 1 ? 'For the blank, select <b>one</b> answer choice.' : 'For each blank, select <b>one</b> entry from the corresponding column of choices.';
    case 'se': return 'Select the <b>two</b> answer choices that, when used to complete the sentence, fit the meaning of the sentence as a whole and produce completed sentences that are alike in meaning.';
    case 'rc': return 'Select <b>one</b> answer choice.';
    case 'rcn': return 'Consider each of the choices separately and select <b>all</b> that apply.';
    case 'rcsel': return 'Click on the sentence in the passage that answers the question.';
    case 'qc': return 'Compare Quantity A and Quantity B, using additional information centered above the two quantities if such information is given. Select one answer choice.';
    case 'mc1': return 'Select <b>one</b> answer choice.';
    case 'mcn': return 'Select <b>all</b> that apply.';
    case 'ne': return q.fraction ? 'Enter your answer as an integer, a decimal, or a fraction in the answer box(es).' : 'Enter your answer as an integer or a decimal in the answer box.';
    default: return '';
  }
}

const cls = (state) => (state ? ` ${state}` : '');

function optionState(q, resp, i, show, blank) {
  if (!show) return '';
  if (q.type === 'tc') return q.answer[blank] === i ? 'is-correct' : resp?.[blank] === i ? 'is-wrong' : '';
  const ans = Array.isArray(q.answer) ? q.answer.includes(i) : q.answer === i;
  const picked = Array.isArray(resp) ? resp.includes(i) : resp === i;
  return ans ? 'is-correct' : picked ? 'is-wrong' : '';
}

function choice(kind, name, i, html, checked, disabled, extra = '', blank = '') {
  return `<label class="opt${cls(extra)}${checked ? ' sel' : ''}"><input type="${kind}" name="${name}" data-act="pick" data-i="${i}" data-b="${blank}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span class="mark"></span><span class="txt">${html}</span></label>`;
}

function passageHtml(q, resp, show, note) {
  const p = PASSAGES[q.passage];
  let idx = 0;
  const paras = p.paras.map((sents) => `<p>${sents.map((s) => {
    const i = idx++;
    if (q.type !== 'rcsel') return esc(s);
    const st = show ? (q.answer === i ? ' is-correct' : resp === i ? ' is-wrong' : '') : resp === i ? ' sel' : '';
    return `<span class="sent selectable${st}" data-act="${show ? '' : 'pick'}" data-i="${i}">${esc(s)}</span>`;
  }).join(' ')}</p>`).join('');
  return `<div class="passage">${note ? `<p class="group-note">${note}</p>` : `<h4>${esc(p.title)}</h4>`}${paras}</div>`;
}

export const typeLabel = (q) => (q.data ? 'Data Interpretation' : TYPE_LABEL[q.type]);

export function correctAnswerText(q) {
  switch (q.type) {
    case 'tc': return q.answer.map((a, b) => q.blanks[b][a]).join(' ; ');
    case 'se': return q.answer.map((a) => q.options[a]).join(' ; ');
    case 'rcn': case 'mcn': return q.answer.map((a) => q.options[a]).join(' ; ');
    case 'rcsel': return esc(PASSAGES[q.passage].paras.flat()[q.answer]);
    case 'qc': return QC_OPTIONS[q.answer];
    case 'ne': return q.answer.num !== undefined ? `${q.answer.num}/${q.answer.den}` : String(q.answer.value).replace('-', '−');
    default: return q.options[q.answer];
  }
}
export function responseText(q, resp) {
  if (resp == null) return '<i>No answer</i>';
  switch (q.type) {
    case 'tc': return resp.map((a, b) => (a == null ? '—' : q.blanks[b][a])).join(' ; ');
    case 'se': case 'rcn': case 'mcn': return resp.length ? resp.map((a) => q.options[a]).join(' ; ') : '<i>No answer</i>';
    case 'rcsel': return esc(PASSAGES[q.passage].paras.flat()[resp]);
    case 'qc': return QC_OPTIONS[resp];
    case 'ne': return esc(resp.den !== undefined && resp.den !== '' ? `${resp.num}/${resp.den}` : resp.text || '') || '<i>No answer</i>';
    default: return q.options[resp];
  }
}

/**
 * @param opts.locked  disable inputs
 * @param opts.show    reveal correct / wrong marks
 */
export function renderQuestion(q, resp, { locked = false, show = false, group = null } = {}) {
  const name = 'a' + Math.random().toString(36).slice(2, 7);
  const inst = `<p class="inst">${instructions(q)}</p>`;
  const media = (q.figure || '') + (q.table || '');
  const stemP = `<p class="stem">${q.stem || ''}</p>`;
  const opt = (kind, nm, i, t, checked, extra = '', blank = '') => choice(kind, nm, i, t, checked, locked, extra, blank);
  let inner;

  if (q.type === 'tc') {
    const stem = q.stem.replace(/\{(\d)\}/g, (_, n) => {
      const b = Number(n) - 1, sel = resp?.[b];
      return (q.blanks.length > 1 ? `<span class="bl-no">${ROMAN[b]}</span>` : '') + BLANK(b, sel != null ? q.blanks[b][sel] : '');
    });
    const choices = q.blanks.length === 1
      ? `<div class="opts">${q.blanks[0].map((t, i) => opt('radio', name, i, t, resp?.[0] === i, optionState(q, resp, i, show, 0), 0)).join('')}</div>`
      : `<div class="cols cols-${q.blanks.length}">${q.blanks.map((g, b) => `<fieldset class="col"><legend>Blank ${ROMAN[b]}</legend>${g.map((t, i) => opt('radio', name + b, i, t, resp?.[b] === i, optionState(q, resp, i, show, b), b)).join('')}</fieldset>`).join('')}</div>`;
    inner = `${inst}<p class="stem">${stem}</p>${choices}`;
  } else if (q.type === 'se') {
    const stem = q.stem.replace(/\{1\}/g, BLANK(0, ''));
    inner = `${inst}<p class="stem">${stem}</p><div class="opts se-grid">${q.options.map((t, i) => opt('checkbox', name, i, t, resp?.includes(i), optionState(q, resp, i, show))).join('')}</div>`;
  } else if (q.type === 'qc') {
    inner = `${inst}${q.info ? `<p class="qc-info">${q.info}</p>` : ''}
      <div class="qc"><div class="qbox"><h5>Quantity A</h5><div>${q.qa}</div></div><div class="qbox"><h5>Quantity B</h5><div>${q.qb}</div></div></div>
      <div class="opts">${QC_OPTIONS.map((t, i) => opt('radio', name, i, t, resp === i, optionState(q, resp, i, show))).join('')}</div>`;
  } else if (q.type === 'ne') {
    const dis = locked ? 'disabled' : '';
    const val = resp || {};
    const st = show ? (grade(q, resp) ? ' is-correct' : ' is-wrong') : '';
    const fracBox = q.fraction
      ? `<div class="ne-frac"><input inputmode="decimal" autocomplete="off" data-act="ne" data-f="num" value="${esc(val.num ?? '')}" ${dis} aria-label="numerator"><hr><input inputmode="decimal" autocomplete="off" data-act="ne" data-f="den" value="${esc(val.den ?? '')}" ${dis} aria-label="denominator"></div><span class="ne-or">or</span>`
      : '';
    inner = `${inst}${media}${stemP}<div class="ne${st}">${fracBox}<input class="ne-box" inputmode="decimal" autocomplete="off" data-act="ne" data-f="text" placeholder="${q.fraction ? 'decimal' : 'answer'}" value="${esc(val.text ?? '')}" ${dis} aria-label="answer"></div>`;
  } else if (q.type === 'rcsel') {
    inner = `${inst}${stemP}`;
  } else {
    const multi = q.type === 'mcn' || q.type === 'rcn';
    const list = q.options.map((t, i) => opt(multi ? 'checkbox' : 'radio', name, i, t, multi ? resp?.includes(i) : resp === i, optionState(q, resp, i, show))).join('');
    inner = `${inst}${media}${stemP}<div class="opts">${list}</div>`;
  }
  const note = group ? (group.from === group.to ? `Question ${group.from} is based on the following ${q.data ? 'data' : 'passage'}.` : `Questions ${group.from} to ${group.to} are based on the following ${q.data ? 'data' : 'passage'}.`) : '';
  if (q.passage) return `<div class="rc-layout">${passageHtml(q, resp, show, note)}<div class="qwrap">${note ? '' : `<p class="qtype">${TYPE_LABEL[q.type]}</p>`}${inner}</div></div>`;
  if (q.data) return `<div class="rc-layout di">${`<div class="passage data-pane">${note ? `<p class="group-note">${note}</p>` : '<h4>Data Interpretation</h4>'}${q.data}</div>`}<div class="qwrap">${inner}</div></div>`;
  return `<div class="qwrap">${inner}</div>`;
}

/** Apply a click on [data-act=pick] to the current response. */
export function applyPick(q, resp, i, b) {
  switch (q.type) {
    case 'tc': { const r = Array.isArray(resp) ? [...resp] : q.blanks.map(() => null); r[b === '' ? 0 : Number(b)] = i; return r; }
    case 'se': {
      const r = Array.isArray(resp) ? [...resp] : [];
      const at = r.indexOf(i);
      if (at >= 0) r.splice(at, 1); else if (r.length < 2) r.push(i); else { r.shift(); r.push(i); }
      return r.sort((x, y) => x - y);
    }
    case 'mcn': case 'rcn': {
      const r = Array.isArray(resp) ? [...resp] : [];
      const at = r.indexOf(i);
      if (at >= 0) r.splice(at, 1); else r.push(i);
      return r.sort((x, y) => x - y);
    }
    default: return i;
  }
}
