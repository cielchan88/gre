// On-screen calculator modelled on the GRE's: order of operations, parentheses,
// memory (MR / MC / M+), CE / C, square root, ± and "Transfer Display".
export const calc = { tokens: [], entry: '0', active: true, fresh: true, mem: 0, err: false, open: false, x: null, y: null };

const PREC = { '+': 1, '-': 1, '*': 2, '/': 2 };
const clean = (n) => {
  if (!Number.isFinite(n)) return null;
  const s = String(parseFloat(n.toPrecision(12)));
  return s.length > 14 ? n.toExponential(6) : s;
};

/** Evaluate a flat list of numbers and + - * / with standard precedence. */
export function evalFlat(tokens) {
  const vals = [], ops = [];
  const apply = () => { const b = vals.pop(), a = vals.pop(), o = ops.pop(); vals.push(o === '+' ? a + b : o === '-' ? a - b : o === '*' ? a * b : b === 0 ? NaN : a / b); };
  for (const t of tokens) {
    if (typeof t === 'number') vals.push(t);
    else { while (ops.length && PREC[ops[ops.length - 1]] >= PREC[t]) apply(); ops.push(t); }
  }
  while (ops.length) apply();
  return vals.length ? vals[0] : 0;
}

const isOp = (t) => typeof t === 'string' && t in PREC;
const setEntry = (v) => {
  const c = clean(v);
  if (c === null) { calc.entry = 'Error'; calc.err = true; } else calc.entry = c;
  calc.active = true; calc.fresh = true;
};

/** Close the innermost open parenthesis, collapsing it to a number. Returns false if none open. */
function closeParen() {
  const at = calc.tokens.lastIndexOf('(');
  if (at < 0) return false;
  const inner = calc.tokens.slice(at + 1);
  if (calc.active) inner.push(Number(calc.entry));
  while (inner.length && isOp(inner[inner.length - 1])) inner.pop();
  calc.tokens = calc.tokens.slice(0, at);
  if (inner.length) setEntry(evalFlat(inner));
  return true;
}

export function press(k) {
  if (calc.err && k !== 'C' && k !== 'CE') return;
  if (/^[0-9]$/.test(k)) {
    calc.entry = calc.fresh || calc.entry === '0' ? k : calc.entry + k;
    calc.fresh = false; calc.active = true;
  } else if (k === '.') {
    if (calc.fresh) calc.entry = '0.'; else if (!calc.entry.includes('.')) calc.entry += '.';
    calc.fresh = false; calc.active = true;
  } else if (k in PREC) {
    if (calc.active) { calc.tokens.push(Number(calc.entry)); calc.active = false; calc.tokens.push(k); }
    else if (isOp(calc.tokens[calc.tokens.length - 1])) calc.tokens[calc.tokens.length - 1] = k;
    calc.fresh = true;
  } else if (k === '(') {
    const last = calc.tokens[calc.tokens.length - 1];
    if (calc.tokens.length === 0 || isOp(last) || last === '(') { calc.tokens.push('('); calc.active = false; calc.fresh = true; }
  } else if (k === ')') closeParen();
  else if (k === '=') {
    while (closeParen());
    const t = [...calc.tokens];
    if (calc.active) t.push(Number(calc.entry));
    while (t.length && isOp(t[t.length - 1])) t.pop();
    calc.tokens = [];
    setEntry(evalFlat(t));
  } else if (k === 'C') Object.assign(calc, { tokens: [], entry: '0', active: true, fresh: true, err: false });
  else if (k === 'CE') Object.assign(calc, { entry: '0', active: true, fresh: true, err: false });
  else if (k === 'N') { if (calc.entry !== '0') calc.entry = calc.entry.startsWith('-') ? calc.entry.slice(1) : '-' + calc.entry; calc.active = true; }
  else if (k === 'S') setEntry(Math.sqrt(Number(calc.entry)));
  else if (k === 'MR') setEntry(calc.mem);
  else if (k === 'MC') calc.mem = 0;
  else if (k === 'M+') { calc.mem += Number(calc.entry); calc.fresh = true; }
}

export const display = () => calc.entry.replace('-', '−');

const KEYS = [['MR'], ['MC'], ['M+'], ['S', '√'], ['('], [')'], ['C'], ['CE'], ['7'], ['8'], ['9'], ['/', '÷'], ['4'], ['5'], ['6'], ['*', '×'], ['1'], ['2'], ['3'], ['-', '−'], ['0'], ['.'], ['N', '±'], ['+'], ['=']];
export function calcHtml() {
  const pos = calc.x != null ? `style="left:${calc.x}px;top:${calc.y}px;right:auto;bottom:auto"` : '';
  return `<div class="calc" role="dialog" aria-label="Calculator" ${pos}><div class="calc-head" data-drag="calc"><b>Calculator</b><button class="x" data-act="calcclose" aria-label="Close">×</button></div>
    <div class="calc-disp"><span class="calc-mem" id="calc-mem">${calc.mem ? 'M' : ''}</span><span id="calc-disp">${display()}</span></div>
    <div class="calc-grid">${KEYS.map(([k, l]) => `<button data-act="calckey" data-k="${k}" class="${k in PREC || k === '=' ? 'op' : ''}${k === '=' ? ' eq' : ''}${['MR', 'MC', 'M+', 'C', 'CE'].includes(k) ? ' fn' : ''}">${l || k}</button>`).join('')}</div>
    <button class="calc-xfer" data-act="calcxfer">Transfer Display</button></div>`;
}
