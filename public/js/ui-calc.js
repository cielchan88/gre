// On-screen basic calculator (mirrors the GRE's: + - × ÷ √ ± with "Transfer Display").
export const calc = { disp: '0', acc: null, op: null, fresh: true, open: false };

const clean = (n) => {
  if (!Number.isFinite(n)) return 'Error';
  const s = String(parseFloat(n.toPrecision(12)));
  return s.length > 14 ? n.toExponential(6) : s;
};
const compute = (a, op, b) => ({ '+': a + b, '-': a - b, '*': a * b, '/': b === 0 ? NaN : a / b }[op]);

export function press(k) {
  if (calc.disp === 'Error' && k !== 'C') return;
  if (/^[0-9]$/.test(k)) {
    calc.disp = calc.fresh || calc.disp === '0' ? k : calc.disp + k;
    calc.fresh = false;
  } else if (k === '.') {
    if (calc.fresh) { calc.disp = '0.'; calc.fresh = false; } else if (!calc.disp.includes('.')) calc.disp += '.';
  } else if (k === 'C') Object.assign(calc, { disp: '0', acc: null, op: null, fresh: true });
  else if (k === 'B') { calc.disp = calc.disp.length > 1 && !calc.fresh ? calc.disp.slice(0, -1) : '0'; if (calc.disp === '-') calc.disp = '0'; }
  else if (k === 'N') calc.disp = calc.disp === '0' ? '0' : calc.disp.startsWith('-') ? calc.disp.slice(1) : '-' + calc.disp;
  else if (k === 'S') { calc.disp = clean(Math.sqrt(parseFloat(calc.disp))); calc.fresh = true; }
  else if (k === '%') { calc.disp = clean(parseFloat(calc.disp) / 100); calc.fresh = true; }
  else if ('+-*/'.includes(k)) {
    const cur = parseFloat(calc.disp);
    if (calc.op && !calc.fresh) { calc.acc = compute(calc.acc, calc.op, cur); calc.disp = clean(calc.acc); } else calc.acc = cur;
    calc.op = k; calc.fresh = true;
  } else if (k === '=') {
    if (calc.op) { calc.disp = clean(compute(calc.acc, calc.op, parseFloat(calc.disp))); calc.acc = null; calc.op = null; calc.fresh = true; }
  }
}

const KEYS = [['C', 'C'], ['B', '⌫'], ['S', '√'], ['/', '÷'], ['7'], ['8'], ['9'], ['*', '×'], ['4'], ['5'], ['6'], ['-', '−'], ['1'], ['2'], ['3'], ['+'], ['N', '±'], ['0'], ['.'], ['=']];
export function calcHtml() {
  return `<div class="calc" role="dialog" aria-label="Calculator"><div class="calc-head"><b>Calculator</b><button class="x" data-act="calcclose" aria-label="Close">×</button></div>
    <div class="calc-disp" id="calc-disp">${calc.disp.replace('-', '−')}</div>
    <div class="calc-grid">${KEYS.map(([k, l]) => `<button data-act="calckey" data-k="${k}" class="${'+-*/='.includes(k) ? 'op' : ''}">${l || k}</button>`).join('')}</div>
    <button class="calc-xfer" data-act="calcxfer">Transfer Display</button></div>`;
}
