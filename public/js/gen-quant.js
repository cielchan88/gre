// Parametric Quantitative Reasoning generators. Every answer is computed from the
// generated numbers (never typed by hand), and difficulty 1..5 scales the number of
// reasoning steps / traps. `generate(gen, d, seed)` is deterministic per seed.
import { makeRng, gcd, lcm, fmt, money, frac, sup, signed, numChoices, textChoices, reduceFrac, clamp } from './util.js';

const cmp = (a, b) => (a > b ? 0 : a < b ? 1 : 2);
const poly = (a, b, c) => {
  let s = a === 1 ? 'x<sup>2</sup>' : `${a}x<sup>2</sup>`;
  if (b) s += (b < 0 ? ' − ' : ' + ') + (Math.abs(b) === 1 ? '' : Math.abs(b)) + 'x';
  if (c) s += signed(c);
  return s;
};
const fig = (svg) => `<svg class="fig" viewBox="0 0 240 170" role="img">${svg}</svg><p class="fig-note">Note: Figure not drawn to scale.</p>`;
const sqrtStr = (k, r) => (k === 1 ? `√${r}` : `${k}√${r}`);

function rightTriFigure(v, h, hyp) {
  return fig(
    `<polygon points="40,140 200,140 40,30" fill="none" stroke="currentColor" stroke-width="2"/>` +
    `<path d="M40,124 h16 v16" fill="none" stroke="currentColor"/>` +
    `<text x="22" y="90" text-anchor="middle">${v}</text>` +
    `<text x="120" y="160" text-anchor="middle">${h}</text>` +
    `<text x="135" y="78" text-anchor="start">${hyp}</text>`);
}

const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];

export const GENERATORS = [
  // ───────────────────────── ARITHMETIC ─────────────────────────
  { id: 'pct_chain', topic: 'arithmetic', type: 'ne', make(r, d) {
    const up = r.pick([10, 20, 25, 30, 40, 50]), down = r.pick([10, 20, 25, 40, 50]);
    const P = r.pick([80, 100, 200, 400, 500]);
    if (d <= 1) {
      const ans = P * (100 - down) / 100;
      return { stem: `A jacket originally priced at ${money(P)} is on sale for ${down}% off. What is the sale price, in dollars?`, answer: { value: ans },
        explain: `Sale price = ${P} × (1 − ${down/100}) = ${fmt(ans)}.` };
    }
    if (d === 2) {
      const ans = P * (100 + up) / 100;
      return { stem: `The price of a ticket increased ${up}% from an original price of ${money(P)}. What is the new price, in dollars?`, answer: { value: ans },
        explain: `New price = ${P} × ${(100 + up) / 100} = ${fmt(ans)}.` };
    }
    if (d === 3 || d === 4) {
      const ans = (100 + up) * (100 - down) / 100;
      return { stem: `The price of an item is increased by ${up}% and the new price is then decreased by ${down}%. The final price is what percent of the original price? (Enter the percent as a number, e.g. 85 for 85%.)`, answer: { value: +ans.toFixed(6) },
        explain: `Multiply the multipliers: ${(100 + up) / 100} × ${(100 - down) / 100} = ${fmt(ans / 100)}, i.e. ${fmt(ans)}% of the original. Successive percent changes multiply; they do not add.` };
    }
    const F = P * (100 + up) * (100 - down) / 10000;
    return { stem: `After a ${up}% increase followed by a ${down}% decrease, the price of a camera is ${money(F)}. What was the original price, in dollars?`, answer: { value: P },
      explain: `Final = Original × ${(100 + up) / 100} × ${(100 - down) / 100}, so Original = ${fmt(F)} ÷ ${fmt((100 + up) * (100 - down) / 10000)} = ${P}.` };
  } },

  { id: 'ratio_share', topic: 'arithmetic', type: 'ne', make(r, d) {
    const parts = d >= 4 ? 3 : 2;
    let xs;
    do { xs = Array.from({ length: parts }, () => r.int(1, 9)); } while (parts === 3 ? new Set(xs).size < 3 : xs[0] === xs[1]);
    const k = r.int(2, 12) * (d >= 3 ? 3 : 1);
    const names = ['A', 'B', 'C'].slice(0, parts);
    const ratio = xs.join(' : ');
    const tgt = r.int(0, parts - 1);
    if (d <= 2) {
      const total = k * xs.reduce((s, v) => s + v, 0);
      return { stem: `The ratio of ${names.join(' to ')} is ${ratio}. If the total is ${total}, what is the value of ${names[tgt]}?`, answer: { value: k * xs[tgt] },
        explain: `The ratio has ${xs.reduce((s, v) => s + v, 0)} parts, so one part = ${total} ÷ ${xs.reduce((s, v) => s + v, 0)} = ${k}. ${names[tgt]} = ${xs[tgt]} × ${k} = ${k * xs[tgt]}.` };
    }
    const hi = xs.indexOf(Math.max(...xs)), lo = xs.indexOf(Math.min(...xs));
    const diff = k * (xs[hi] - xs[lo]);
    const total = k * xs.reduce((s, v) => s + v, 0);
    return { stem: `The amounts of money held by ${names.join(', ')} are in the ratio ${ratio}. ${names[hi]} has $${diff} more than ${names[lo]}. What is the total amount held by all of them, in dollars?`, answer: { value: total },
      explain: `${names[hi]} − ${names[lo]} = ${xs[hi] - xs[lo]} parts = $${diff}, so one part = $${k}. Total parts = ${xs.reduce((s, v) => s + v, 0)}, so total = $${total}.` };
  } },

  { id: 'remainder', topic: 'arithmetic', type: 'ne', make(r, d) {
    if (d <= 2) {
      const m = r.int(5, 9), n = r.int(120, 990);
      return { stem: `What is the remainder when ${n} is divided by ${m}?`, answer: { value: n % m },
        explain: `${n} = ${m} × ${Math.floor(n / m)} + ${n % m}.` };
    }
    if (d === 3) {
      const m = r.pick([5, 7, 9, 11]), a = r.int(1, m - 1), b = r.int(1, m - 1);
      return { stem: `When the positive integer n is divided by ${m}, the remainder is ${a}. When the positive integer k is divided by ${m}, the remainder is ${b}. What is the remainder when n + k is divided by ${m}? (If n + k is a multiple of ${m}, enter 0.)`, answer: { value: (a + b) % m },
        explain: `Remainders add: ${a} + ${b} = ${a + b}, and ${a + b} leaves remainder ${(a + b) % m} when divided by ${m}.` };
    }
    if (d === 4) {
      const m = r.pick([5, 7, 8, 9]), a = r.int(2, m - 1), b = r.int(2, m - 1);
      return { stem: `When n is divided by ${m}, the remainder is ${a}. When k is divided by ${m}, the remainder is ${b}. What is the remainder when nk is divided by ${m}?`, answer: { value: (a * b) % m },
        explain: `Remainders multiply: ${a} × ${b} = ${a * b}, which leaves remainder ${(a * b) % m} on division by ${m}.` };
    }
    const base = r.pick([2, 3, 4, 7, 8, 9]), e = r.int(21, 99);
    let x = 1; for (let i = 0; i < e; i++) x = (x * base) % 10;
    return { stem: `What is the units (ones) digit of ${sup(base, e)}?`, answer: { value: x },
      explain: `Units digits of powers of ${base} repeat in a cycle. Reducing the exponent ${e} modulo the cycle length gives a units digit of ${x}.` };
  } },

  { id: 'qc_numeric', topic: 'arithmetic', type: 'qc', make(r, d) {
    if (d <= 1) {
      const a = r.int(1, 8), b = r.int(a + 1, 9), c = r.int(1, 8), e = r.int(c + 1, 9);
      return { qa: frac(a, b), qb: frac(c, e), answer: cmp(a / b, c / e),
        explain: `Cross-multiply: ${a}×${e} = ${a * e} and ${c}×${b} = ${c * b}. ${a * e > c * b ? 'A is larger' : a * e < c * b ? 'B is larger' : 'They are equal'}.` };
    }
    if (d === 2) {
      const x = r.pick([12, 15, 16, 24, 30, 36, 45, 60]), y = r.pick([25, 40, 50, 80, 120, 150]);
      return { qa: `${x}% of ${y}`, qb: `${y}% of ${x}`, answer: 2,
        explain: `x% of y = xy/100 = y% of x. Both equal ${x * y / 100}.` };
    }
    if (d === 3) {
      const b1 = r.int(2, 5), p = r.int(4, 9), b2 = r.int(2, 5) + 5, q = r.int(2, 4);
      const A = BigInt(b1) ** BigInt(p), B = BigInt(b2) ** BigInt(q);
      return { qa: sup(b1, p), qb: sup(b2, q), answer: A > B ? 0 : A < B ? 1 : 2,
        explain: `${b1}^${p} = ${A} and ${b2}^${q} = ${B}.` };
    }
    if (d === 4) {
      const a = r.pick([4, 9, 16, 25]), b = r.pick([9, 16, 25, 36]);
      return { qa: `√${a} + √${b}`, qb: `√${a + b}`, answer: 0,
        explain: `√a + √b is generally NOT √(a+b). Here A = ${Math.sqrt(a) + Math.sqrt(b)} and B ≈ ${Math.sqrt(a + b).toFixed(2)}, so A is greater. (Squaring A gives a + b + 2√(ab) > a + b.)` };
    }
    const mode = r.pick(['pos', 'neg', 'unk']);
    const info = { pos: 'x and y are integers and xy > 0', neg: 'x and y are integers and xy < 0', unk: 'x and y are integers' }[mode];
    return { info, qa: '(x + y)<sup>2</sup>', qb: 'x<sup>2</sup> + y<sup>2</sup>', answer: mode === 'pos' ? 0 : mode === 'neg' ? 1 : 3,
      explain: `(x+y)² − (x²+y²) = 2xy. ${mode === 'pos' ? 'Since xy > 0, A is greater.' : mode === 'neg' ? 'Since xy < 0, the difference is negative, so B is greater.' : 'xy could be positive, negative, or zero, so the relationship cannot be determined.'}` };
  } },

  { id: 'gcd_lcm', topic: 'arithmetic', type: 'ne', make(r, d) {
    if (d <= 2) {
      const g = r.int(2, 9), a = r.int(2, 6), b = r.int(2, 6);
      const useGcd = r.chance(0.5);
      if (a === b) return this.make(r, d);
      return { stem: `What is the ${useGcd ? 'greatest common divisor' : 'least common multiple'} of ${g * a} and ${g * b}?`, answer: { value: useGcd ? gcd(g * a, g * b) : lcm(g * a, g * b) },
        explain: useGcd ? `Use prime factorizations; the GCD is ${gcd(g * a, g * b)}.` : `LCM = (${g * a} × ${g * b}) ÷ GCD = ${lcm(g * a, g * b)}.` };
    }
    const ns = r.shuffle([4, 6, 8, 9, 10, 12, 14, 15, 18, 20, 21, 24]).slice(0, 3);
    return { stem: `What is the smallest positive integer that is divisible by each of ${ns[0]}, ${ns[1]}, and ${ns[2]}?`, answer: { value: lcm(lcm(ns[0], ns[1]), ns[2]) },
      explain: `This is the least common multiple: LCM(${ns.join(', ')}) = ${lcm(lcm(ns[0], ns[1]), ns[2])}.` };
  } },

  { id: 'divisors', topic: 'arithmetic', type: 'ne', make(r, d) {
    const primes = [2, 3, 5, 7];
    const pick = r.shuffle(primes).slice(0, d >= 4 ? 3 : 2);
    const exps = pick.map(() => r.int(1, d >= 4 ? 3 : 4));
    const N = pick.reduce((p, q, i) => p * q ** exps[i], 1);
    const count = exps.reduce((p, e) => p * (e + 1), 1);
    const shown = d >= 4 ? String(N) : pick.map((q, i) => (exps[i] === 1 ? `${q}` : sup(q, exps[i]))).join(' × ');
    return { stem: `How many positive divisors does ${shown} have? (Include 1 and the number itself.)`, answer: { value: count },
      explain: `${N} = ${pick.map((q, i) => `${q}^${exps[i]}`).join(' × ')}. Number of divisors = ${exps.map((e) => `(${e}+1)`).join('')} = ${count}.` };
  } },

  { id: 'arith_seq', topic: 'arithmetic', type: 'ne', make(r, d) {
    const a = r.int(-5, 20), dd = r.int(2, 9), n = r.int(8, 40);
    if (d <= 3) return { stem: `In an arithmetic sequence the first term is ${fmt(a)} and the common difference is ${dd}. What is the ${n}th term?`, answer: { value: a + (n - 1) * dd },
      explain: `a<sub>n</sub> = a<sub>1</sub> + (n−1)d = ${fmt(a)} + ${n - 1}×${dd} = ${a + (n - 1) * dd}.` };
    return { stem: `What is the sum of the first ${n} terms of the arithmetic sequence whose first term is ${fmt(a)} and whose common difference is ${dd}?`, answer: { value: n * (2 * a + (n - 1) * dd) / 2 },
      explain: `S = n(2a + (n−1)d)/2 = ${n}(${2 * a} + ${(n - 1) * dd})/2 = ${n * (2 * a + (n - 1) * dd) / 2}.` };
  } },

  { id: 'consecutive', topic: 'arithmetic', type: 'ne', make(r, d) {
    const n = r.pick([3, 5, 7]);
    if (d <= 3) {
      const s = r.int(4, 40), S = n * s + n * (n - 1) / 2;
      return { stem: `The sum of ${n} consecutive integers is ${S}. What is the greatest of these integers?`, answer: { value: s + n - 1 },
        explain: `The middle integer is the mean, ${S}/${n} = ${S / n}. The greatest is ${S / n} + ${(n - 1) / 2} = ${s + n - 1}.` };
    }
    const s = 2 * r.int(3, 30), S = n * s + n * (n - 1);
    return { stem: `The sum of ${n} consecutive even integers is ${S}. What is the greatest of these integers?`, answer: { value: s + 2 * (n - 1) },
      explain: `The middle even integer is ${S}/${n} = ${S / n}; the greatest is ${S / n} + ${n - 1} = ${s + 2 * (n - 1)}.` };
  } },

  // ───────────────────────── ALGEBRA ─────────────────────────
  { id: 'linear_eq', topic: 'algebra', type: 'ne', make(r, d) {
    const x = r.int(-9, 12), a = r.int(2, 7), b = r.int(-9, 9), c = r.int(-9, 9);
    if (d <= 2) {
      const rhs = a * x + b;
      return { stem: `If ${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${fmt(rhs)}, what is the value of x?`, answer: { value: x }, explain: `${a}x = ${fmt(rhs - b)}, so x = ${x}.` };
    }
    if (d === 3) {
      const rhs = a * (x + b) + c;
      return { stem: `If ${a}(x ${b < 0 ? '−' : '+'} ${Math.abs(b)}) ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${fmt(rhs)}, what is the value of x?`, answer: { value: x },
        explain: `${a}(x ${signed(b).trim()}) = ${fmt(rhs - c)} → x ${signed(b).trim()} = ${fmt(x + b)} → x = ${x}.` };
    }
    const t = r.int(-6, 8), xx = b + a * t, rhs = t + c;
    const e = d === 4 ? `(x ${b < 0 ? '+' : '−'} ${Math.abs(b)}) / ${a} ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : `${frac(`x ${b < 0 ? '+' : '−'} ${Math.abs(b)}`, a)} ${c < 0 ? '−' : '+'} ${Math.abs(c)}`;
    return { stem: `If ${e} = ${fmt(rhs)}, what is the value of x?`, answer: { value: xx },
      explain: `Subtract ${c}: (x ${b < 0 ? '+' : '−'} ${Math.abs(b)})/${a} = ${t}. Multiply by ${a}: x ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${a * t}, so x = ${xx}.` };
  } },

  { id: 'system', topic: 'algebra', type: 'mc1', make(r, d) {
    const x = r.int(1, 12), y = r.int(1, 12);
    let p, q, u, v;
    do { p = r.int(1, 5); q = r.int(1, 5); u = r.int(1, 4); v = -r.int(1, 4); } while (p * v - q * u === 0);
    const s1 = p * x + q * y, s2 = u * x + v * y;
    const eq = (a, b, s) => `${a === 1 ? '' : a}x ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}y = ${fmt(s)}`;
    const askSum = d >= 3;
    const ans = askSum ? x + y : x;
    const { options, answer } = numChoices(r, ans, [x + y, x, y, x * y, ans + 2, ans - 2, s1 - s2, ans * 2]);
    return { stem: `If ${eq(p, q, s1)} and ${eq(u, v, s2)}, what is the value of ${askSum ? 'x + y' : 'x'}?`, options, answer,
      explain: `Solve the system (e.g. by elimination): x = ${x}, y = ${y}. So ${askSum ? 'x + y' : 'x'} = ${ans}.` };
  } },

  { id: 'quad_roots', topic: 'algebra', type: 'mcn', make(r, d) {
    let r1, r2;
    do { r1 = r.int(-7, 8); r2 = r.int(-7, 8); } while (r1 === r2 || r1 === 0 || r2 === 0);
    const a = d <= 2 ? 1 : r.pick([1, 2, 3]);
    const b = -a * (r1 + r2), c = a * r1 * r2;
    const cands = r.shuffle([-r1, -r2, r1 + r2, r1 * r2, r1 + 1, r2 - 1, r1 - r2].filter((v) => v !== r1 && v !== r2));
    const opts = r.shuffle([r1, r2, ...cands.slice(0, 4)].map((v) => v)).sort((m, n) => m - n);
    const uniq = [...new Set(opts)];
    return { stem: `If ${poly(a, b, c)} = 0, which of the following could be the value of x? Indicate <em>all</em> such values.`,
      options: uniq.map(fmt), answer: uniq.map((v, i) => (v === r1 || v === r2 ? i : -1)).filter((i) => i >= 0),
      explain: `${a === 1 ? '' : `Factor out ${a}: `}${a === 1 ? '' : `${a}`}(x ${r1 > 0 ? '−' : '+'} ${Math.abs(r1)})(x ${r2 > 0 ? '−' : '+'} ${Math.abs(r2)}) = 0, so x = ${r1} or x = ${r2}.`,
      meta: { a, b, c, roots: [r1, r2] } };
  } },

  { id: 'ineq_mcn', topic: 'algebra', type: 'mcn', make(r, d) {
    const c = r.int(-4, 6), k = r.int(2, 6);
    const kind = d <= 2 ? 'lt' : d === 3 ? 'ge' : 'lin';
    const A = r.int(2, 4);
    const pred = kind === 'lt' ? (x) => Math.abs(x - c) < k : kind === 'ge' ? (x) => Math.abs(x - c) >= k : (x) => Math.abs(A * x - c) <= k;
    const text = kind === 'lt' ? `|x ${c < 0 ? '+' : '−'} ${Math.abs(c)}| &lt; ${k}` : kind === 'ge' ? `|x ${c < 0 ? '+' : '−'} ${Math.abs(c)}| ≥ ${k}` : `|${A}x ${c < 0 ? '+' : '−'} ${Math.abs(c)}| ≤ ${k}`;
    let vals;
    for (let tries = 0; ; tries++) {
      const pool = [];
      for (let v = c - k - 5; v <= c + k + 5; v++) pool.push(v);
      vals = r.shuffle(pool).slice(0, 6).sort((m, n) => m - n);
      const t = vals.filter(pred).length;
      if ((t >= 1 && t <= 4) || tries > 200) break;
    }
    const ans = vals.map((v, i) => (pred(v) ? i : -1)).filter((i) => i >= 0);
    return { stem: `If ${text}, which of the following could be the value of x? Indicate <em>all</em> such values.`, options: vals.map(fmt), answer: ans,
      explain: `Test each value in ${text}. The values that satisfy it are ${ans.map((i) => vals[i]).join(', ') || 'none'}.` };
  } },

  { id: 'func_eval', topic: 'algebra', type: 'mc1', make(r, d) {
    if (d <= 3) {
      const a = r.int(1, 4), b = r.int(-6, 6), c = r.int(-9, 9), k = r.int(-3, 4);
      const ans = a * k * k + b * k + c;
      const { options, answer } = numChoices(r, ans, [a * k * k - b * k + c, a * k + b * k + c, (a * k) ** 2 + b * k + c, ans + a, ans - b, a * k * k + b + c]);
      return { stem: `If f(x) = ${poly(a, b, c)}, what is the value of f(${fmt(k)})?`, options, answer,
        explain: `Substitute x = ${fmt(k)}: ${a}(${fmt(k)})² ${signed(b * k)} ${signed(c)} = ${ans}.` };
    }
    const m = r.int(2, 5), n = r.int(-5, 5), p = r.int(-4, 4), k = r.int(1, 4);
    const g = k * k + p, ans = m * g + n;
    const { options, answer } = numChoices(r, ans, [m * k + n + p, (m * k + n) ** 2 + p, g * m, k * k + p + m + n, ans + m, ans - m]);
    return { stem: `If f(x) = ${m}x ${n < 0 ? '−' : '+'} ${Math.abs(n)} and g(x) = x<sup>2</sup> ${p < 0 ? '−' : '+'} ${Math.abs(p)}, what is the value of f(g(${k}))?`, options, answer,
      explain: `First g(${k}) = ${k}² ${signed(p)} = ${g}. Then f(${g}) = ${m}(${g}) ${signed(n)} = ${ans}.` };
  } },

  // ───────────────────────── GEOMETRY ─────────────────────────
  { id: 'rect', topic: 'geometry', type: 'ne', make(r, d) {
    const L = r.int(4, 20), W = r.int(2, L - 1);
    if (d <= 2) return { stem: `A rectangle has a length of ${L} and a perimeter of ${2 * (L + W)}. What is its area?`, answer: { value: L * W },
      explain: `2(L + W) = ${2 * (L + W)} → W = ${W}. Area = ${L} × ${W} = ${L * W}.` };
    if (d === 3) {
      const [a, b, c] = r.pick(TRIPLES), k = r.int(1, 3);
      return { stem: `A rectangle has a side of length ${a * k} and a diagonal of length ${c * k}. What is the area of the rectangle?`, answer: { value: a * k * b * k },
        explain: `The other side is √(${c * k}² − ${a * k}²) = ${b * k}. Area = ${a * k} × ${b * k} = ${a * b * k * k}.` };
    }
    const dg = r.int(3, 20);
    return { stem: `A square has a diagonal of length ${dg}. What is the area of the square?`, answer: { value: dg * dg / 2 },
      explain: `For a square, area = diagonal² / 2 = ${dg * dg}/2 = ${fmt(dg * dg / 2)}.` };
  } },

  { id: 'circle', topic: 'geometry', type: 'mc1', make(r, d) {
    const S = 'π';
    if (d <= 2) {
      const rad = r.int(2, 12), mode = r.pick(['r', 'd', 'c']);
      const given = mode === 'r' ? `radius ${rad}` : mode === 'd' ? `diameter ${2 * rad}` : `circumference ${2 * rad}${S}`;
      const good = `${rad * rad}${S}`;
      const c = textChoices(r, good, [`${2 * rad}${S}`, `${rad}${S}`, `${4 * rad * rad}${S}`, `${2 * rad * rad}${S}`, `${(rad + 1) * (rad + 1)}${S}`]);
      return { stem: `A circle has ${given}. What is its area?`, options: c.options, answer: c.answer, explain: `Radius = ${rad}, so area = πr² = ${good}.` };
    }
    const th = r.pick([45, 60, 90, 120, 180, 270]);
    const mult = { 45: 4, 60: 6, 90: 2, 120: 3, 180: 2, 270: 2 }[th];
    const rad = mult * r.int(1, 3);
    const area = (th / 360) * rad * rad;
    const c = textChoices(r, `${fmt(area)}${S}`, [`${fmt(rad * rad)}${S}`, `${fmt(2 * area)}${S}`, `${fmt(area / 2)}${S}`, `${fmt(th / 360 * 2 * rad)}${S}`, `${fmt(area + rad)}${S}`]);
    return { stem: `A sector of a circle of radius ${rad} has a central angle of ${th}°. What is the area of the sector?`, options: c.options, answer: c.answer,
      explain: `Sector area = (${th}/360) × π × ${rad}² = ${fmt(area)}π.` };
  } },

  { id: 'right_tri', topic: 'geometry', type: 'ne', make(r, d) {
    const [a, b, c] = r.pick(TRIPLES), k = r.int(1, d >= 3 ? 2 : 1);
    const A = a * k, B = b * k, C = c * k;
    if (d <= 1) return { stem: `In the triangle shown, what is the length of the hypotenuse?`, figure: rightTriFigure(A, B, 'x'), answer: { value: C },
      explain: `x = √(${A}² + ${B}²) = √${A * A + B * B} = ${C}.` };
    if (d === 2) return { stem: `In the triangle shown, what is the length of the unlabeled side <em>x</em>?`, figure: rightTriFigure('x', B, C), answer: { value: A },
      explain: `x = √(${C}² − ${B}²) = ${A}.` };
    if (d === 3) return { stem: `A right triangle has legs of length ${A} and ${B}. What is its perimeter?`, answer: { value: A + B + C },
      explain: `Hypotenuse = ${C}. Perimeter = ${A} + ${B} + ${C} = ${A + B + C}.` };
    return { stem: `A right triangle has a hypotenuse of length ${C} and one leg of length ${A}. What is the area of the triangle?`, answer: { value: A * B / 2 },
      explain: `Other leg = ${B}. Area = ½ × ${A} × ${B} = ${fmt(A * B / 2)}.` };
  } },

  { id: 'special_tri', topic: 'geometry', type: 'mc1', make(r, d) {
    const k = r.int(2, 9);
    const mode = r.pick(d >= 4 ? ['45b', '30'] : ['45a', '45b']);
    if (mode === '45a') {
      const good = sqrtStr(k, 2);
      const c = textChoices(r, good, [`${k}`, `${2 * k}`, sqrtStr(2 * k, 2), sqrtStr(k, 3), `${k * k}`]);
      return { stem: `An isosceles right triangle has legs of length ${k}. What is the length of its hypotenuse?`, options: c.options, answer: c.answer, explain: `Hypotenuse = leg × √2 = ${good}.` };
    }
    if (mode === '45b') {
      const good = `${k}`;
      const c = textChoices(r, good, [`${k}√2`, sqrtStr(2 * k, 2), `${2 * k}`, `${k + 1}`, `${k * 2 + 1}`]);
      return { stem: `The hypotenuse of an isosceles right triangle is ${sqrtStr(k, 2)}. What is the length of each leg?`, options: c.options, answer: c.answer, explain: `Leg = hypotenuse ÷ √2 = ${k}.` };
    }
    const good = sqrtStr(k, 3);
    const c = textChoices(r, good, [`${2 * k}`, sqrtStr(2 * k, 3), sqrtStr(k, 2), `${3 * k}`, `${k}`]);
    return { stem: `In a right triangle with angles of 30°, 60°, and 90°, the shortest side has length ${k}. What is the length of the other leg (the side opposite the 60° angle)?`, options: c.options, answer: c.answer,
      explain: `Sides of a 30–60–90 triangle are in the ratio 1 : √3 : 2, so the leg opposite 60° is ${k}√3.` };
  } },

  { id: 'angles', topic: 'geometry', type: 'ne', make(r, d) {
    if (d <= 2) {
      const [x, y, z] = r.pick([[1, 2, 3], [2, 3, 4], [3, 4, 5], [1, 4, 5], [2, 3, 5]]);
      const unit = 180 / (x + y + z), big = r.chance(0.5);
      return { stem: `The measures of the angles of a triangle are in the ratio ${x} : ${y} : ${z}. What is the measure, in degrees, of the ${big ? 'largest' : 'smallest'} angle?`, answer: { value: unit * (big ? z : x) },
        explain: `Angles sum to 180°, so one part = 180/${x + y + z} = ${unit}°. The ${big ? 'largest' : 'smallest'} angle = ${unit * (big ? z : x)}°.` };
    }
    const n = r.pick([5, 6, 8, 9, 10, 12, 15, 18, 20]);
    if (d === 3) return { stem: `What is the sum, in degrees, of the interior angles of a convex polygon with ${n} sides?`, answer: { value: 180 * (n - 2) },
      explain: `Sum = 180(n − 2) = 180 × ${n - 2} = ${180 * (n - 2)}.` };
    return { stem: `Each interior angle of a regular polygon measures ${180 * (n - 2) / n}°. How many sides does the polygon have?`, answer: { value: n },
      explain: `Each exterior angle = 180 − ${180 * (n - 2) / n} = ${360 / n}°, and exterior angles sum to 360°, so n = 360/${360 / n} = ${n}.` };
  } },

  { id: 'coord', topic: 'geometry', type: 'ne', make(r, d) {
    const x1 = r.int(-6, 6), y1 = r.int(-6, 6);
    if (d <= 2) {
      const [a, b, c] = r.pick(TRIPLES.slice(0, 2)), sx = r.chance(0.5) ? 1 : -1, sy = r.chance(0.5) ? 1 : -1;
      return { stem: `In the xy-plane, what is the distance between the points (${fmt(x1)}, ${fmt(y1)}) and (${fmt(x1 + sx * a)}, ${fmt(y1 + sy * b)})?`, answer: { value: c },
        explain: `Distance = √(${a}² + ${b}²) = ${c}.` };
    }
    if (d === 3) {
      const dx = r.int(1, 6), dy = r.int(1, 9);
      return { stem: `In the xy-plane, what is the slope of the line that passes through the points (${fmt(x1)}, ${fmt(y1)}) and (${fmt(x1 + dx)}, ${fmt(y1 + dy)})? (You may enter a fraction.)`, answer: { value: dy / dx },
        explain: `Slope = rise/run = ${dy}/${dx} = ${fmt(dy / dx)}.`, fraction: true };
    }
    const mx = r.int(-5, 8), my = r.int(-5, 8);
    return { stem: `In the xy-plane, the midpoint of segment AB is (${mx}, ${my}). If A = (${fmt(x1)}, ${fmt(y1)}), what is the sum of the coordinates of B?`, answer: { value: (2 * mx - x1) + (2 * my - y1) },
      explain: `B = (2·${mx} − ${fmt(x1)}, 2·${my} − ${fmt(y1)}) = (${2 * mx - x1}, ${2 * my - y1}). The sum is ${2 * mx - x1 + 2 * my - y1}.` };
  } },

  { id: 'box', topic: 'geometry', type: 'ne', make(r, d) {
    const a = r.int(2, 9), b = r.int(2, 9), c = r.int(2, 9);
    if (d <= 3) return { stem: `A rectangular box measures ${a} by ${b} by ${c}. What is its total surface area?`, answer: { value: 2 * (a * b + b * c + a * c) },
      explain: `SA = 2(ab + bc + ac) = 2(${a * b} + ${b * c} + ${a * c}) = ${2 * (a * b + b * c + a * c)}.` };
    return { stem: `The three different faces of a rectangular box have areas ${a * b}, ${b * c}, and ${a * c}. What is the volume of the box?`, answer: { value: a * b * c },
      explain: `(ab)(bc)(ac) = (abc)² = ${(a * b * c) ** 2}, so the volume abc = ${a * b * c}.` };
  } },

  { id: 'qc_geo', topic: 'geometry', type: 'qc', make(r, d) {
    const rad = r.int(2, 9), s = r.int(2 * rad - 1, 2 * rad + 2);
    const A = Math.PI * rad * rad, B = s * s;
    if (Math.abs(A - B) < 1) return this.make(r, d);
    return { qa: `The area of a circle with radius ${rad}`, qb: `The area of a square with side length ${s}`, answer: cmp(A, B),
      explain: `Circle: π × ${rad}² ≈ ${A.toFixed(1)}. Square: ${s}² = ${B}. ${A > B ? 'A' : 'B'} is greater.` };
  } },

  // ───────────────────────── DATA ANALYSIS ─────────────────────────
  { id: 'stats_qc', topic: 'data', type: 'qc', make(r, d) {
    const n = r.pick([5, 7]);
    const base = r.int(2, 20);
    const list = Array.from({ length: n }, () => base + r.int(0, 3 + d * 3)).sort((a, b) => a - b);
    if (d >= 3) list[n - 1] += r.int(10, 40);
    const mean = list.reduce((s, v) => s + v, 0) / n, median = list[(n - 1) / 2];
    return { info: `A set of numbers: ${r.shuffle(list).join(', ')}`, qa: 'The mean of the set', qb: 'The median of the set', answer: cmp(mean, median),
      explain: `Mean = ${list.reduce((s, v) => s + v, 0)}/${n} = ${fmt(+mean.toFixed(3))}; median = ${median}. ${mean > median ? 'A' : mean < median ? 'B' : 'They are equal'}${mean === median ? '' : ' is greater'}.` };
  } },

  { id: 'mean_ne', topic: 'data', type: 'ne', make(r, d) {
    if (d <= 2) {
      const n = r.int(4, 6), avg = r.int(10, 40), xs = Array.from({ length: n - 1 }, () => avg + r.int(-8, 8));
      const missing = avg * n - xs.reduce((s, v) => s + v, 0);
      return { stem: `The average (arithmetic mean) of ${n} numbers is ${avg}. ${n - 1} of the numbers are ${xs.join(', ')}. What is the remaining number?`, answer: { value: missing },
        explain: `Total = ${n} × ${avg} = ${avg * n}. Missing = ${avg * n} − ${xs.reduce((s, v) => s + v, 0)} = ${missing}.` };
    }
    const [n1, n2] = r.pick([[4, 6], [3, 7], [2, 8], [5, 15], [8, 12], [5, 20], [10, 15]]);
    const m1 = r.int(50, 90), m2 = r.int(50, 90);
    const ans = (n1 * m1 + n2 * m2) / (n1 + n2);
    return { stem: `Class A has ${n1} students with an average score of ${m1}. Class B has ${n2} students with an average score of ${m2}. What is the average score of all ${n1 + n2} students combined? (Enter a decimal if necessary.)`, answer: { value: ans },
      explain: `Total points = ${n1}×${m1} + ${n2}×${m2} = ${n1 * m1 + n2 * m2}. Divide by ${n1 + n2}: ${fmt(ans)}.` };
  } },

  { id: 'prob', topic: 'data', type: 'ne', make(r, d) {
    let num, den, stem, explain;
    if (d <= 2 && r.chance(0.5)) {
      const s = r.int(4, 9);
      const ways = { 4: 3, 5: 4, 6: 5, 7: 6, 8: 5, 9: 4 }[s];
      ({ num, den } = reduceFrac(ways, 36));
      stem = `Two fair six-sided dice are rolled. What is the probability that the sum of the numbers is ${s}?`;
      explain = `${ways} of the 36 equally likely outcomes give a sum of ${s}, so P = ${ways}/36 = ${num}/${den}.`;
    } else {
      const red = r.int(2, 8), blue = r.int(2, 8), green = d >= 3 ? r.int(1, 5) : 0, tot = red + blue + green;
      const bag = `${red} red${green ? ',' : ' and'} ${blue} blue${green ? `, and ${green} green` : ''} marbles`;
      if (d <= 2) {
        ({ num, den } = reduceFrac(red, tot));
        stem = `A bag contains ${bag}. If one marble is chosen at random, what is the probability that it is red?`;
        explain = `P = ${red}/${tot} = ${num}/${den}.`;
      } else if (d === 3) {
        ({ num, den } = reduceFrac(red * (red - 1), tot * (tot - 1)));
        stem = `A bag contains ${bag}. Two marbles are drawn at random without replacement. What is the probability that both are red?`;
        explain = `P = (${red}/${tot}) × (${red - 1}/${tot - 1}) = ${num}/${den}.`;
      } else {
        const same = (red * (red - 1) + blue * (blue - 1) + green * (green - 1));
        ({ num, den } = reduceFrac(tot * (tot - 1) - same, tot * (tot - 1)));
        stem = `A bag contains ${bag}. Two marbles are drawn at random without replacement. What is the probability that they are different colors?`;
        explain = `P(different) = 1 − P(same). P(same) = (${red}·${red - 1} + ${blue}·${blue - 1}${green ? ` + ${green}·${green - 1}` : ''})/(${tot}·${tot - 1}). So P(different) = ${num}/${den}.`;
      }
    }
    return { stem: stem + ' (Enter your answer as a fraction.)', answer: { num, den, value: num / den }, fraction: true, explain };
  } },

  { id: 'counting', topic: 'data', type: 'ne', make(r, d) {
    const C = (n, k) => { let x = 1; for (let i = 1; i <= k; i++) x = x * (n - k + i) / i; return Math.round(x); };
    const F = (n) => (n <= 1 ? 1 : n * F(n - 1));
    if (d <= 2) {
      const n = r.int(6, 10), k = r.int(2, 3);
      return { stem: `A committee of ${k} people is to be chosen from a group of ${n} people. How many different committees are possible?`, answer: { value: C(n, k) },
        explain: `Order does not matter: C(${n},${k}) = ${C(n, k)}.` };
    }
    if (d === 3) {
      const n = r.int(4, 6);
      return { stem: `${n} people are to be seated in a row of ${n} chairs. If two particular people must sit next to each other, how many seating arrangements are possible?`, answer: { value: 2 * F(n - 1) },
        explain: `Treat the pair as one unit: (${n} − 1)! = ${F(n - 1)} arrangements, times 2 orders within the pair = ${2 * F(n - 1)}.` };
    }
    const w = r.pick(['LETTER', 'BANANA', 'TOOTH', 'BALLOON', 'PEPPER', 'COFFEE', 'MISSISSIPPI', 'STATISTICS']);
    const cnt = {}; for (const ch of w) cnt[ch] = (cnt[ch] || 0) + 1;
    const ans = Object.values(cnt).reduce((p, c) => p / F(c), F(w.length));
    return { stem: `How many distinct arrangements of the letters in the word ${w} are there?`, answer: { value: Math.round(ans) },
      explain: `${w.length}! divided by the factorial of each repeated letter's count: ${w.length}!/(${Object.values(cnt).filter((c) => c > 1).map((c) => c + '!').join(' × ') || '1'}) = ${Math.round(ans)}.` };
  } },

  { id: 'table_mc', topic: 'data', type: 'mc1', make(r, d) {
    const years = [2019, 2020, 2021, 2022];
    const cats = r.pick([['Product X', 'Product Y'], ['Store North', 'Store South'], ['Region East', 'Region West']]);
    const unit = r.pick(['units sold (in thousands)', 'sales (in thousands of dollars)']);
    const mk = () => { const b = r.pick([20, 40, 60, 80, 100, 120]); return years.map((_, i) => (i === 0 ? b : Math.round(b * r.pick([0.75, 0.8, 1, 1.1, 1.25, 1.5]) / 5) * 5 || b)); };
    const X = mk(), Y = mk();
    const table = `<table class="data"><caption>Annual ${unit}</caption><tr><th></th>${years.map((y) => `<th>${y}</th>`).join('')}</tr><tr><th>${cats[0]}</th>${X.map((v) => `<td>${v}</td>`).join('')}</tr><tr><th>${cats[1]}</th>${Y.map((v) => `<td>${v}</td>`).join('')}</tr></table>`;
    if (d <= 2) {
      const i = r.int(0, 2);
      const ans = X[i + 1] - X[i];
      const { options, answer } = numChoices(r, ans, [Y[i + 1] - Y[i], X[i + 1] + X[i], X[i], X[i + 1], Math.abs(ans) + 5, -ans]);
      return { stem: `By how many thousand did the ${unit.split(' ')[0]} of ${cats[0]} change from ${years[i]} to ${years[i + 1]}? (A negative number indicates a decrease.)`, table, options, answer,
        explain: `${X[i + 1]} − ${X[i]} = ${ans}.` };
    }
    if (d === 3) {
      const totals = years.map((_, i) => X[i] + Y[i]);
      const best = totals.indexOf(Math.max(...totals));
      if (totals.filter((t) => t === totals[best]).length > 1) return this.make(r, d);
      return { stem: `In which year was the combined total for the two rows greatest?`, table, options: years.map(String), answer: best,
        explain: `Totals by year: ${years.map((y, i) => `${y}: ${totals[i]}`).join('; ')}. The greatest is ${years[best]}.` };
    }
    const i = r.int(0, 1), j = i + 2;
    const pct = (X[j] - X[i]) / X[i] * 100;
    const { options, answer } = numChoices(r, pct, [pct + 10, pct - 10, (X[j] - X[i]), X[j] / X[i] * 100, -pct, pct * 2], (v) => fmt(+v.toFixed(2)) + '%');
    return { stem: `What was the percent change in ${cats[0]}'s figure from ${years[i]} to ${years[j]}? (A negative sign indicates a decrease.)`, table, options, answer,
      explain: `Percent change = (${X[j]} − ${X[i]}) / ${X[i]} × 100 = ${fmt(+pct.toFixed(2))}%.` };
  } },

  { id: 'venn', topic: 'data', type: 'ne', make(r, d) {
    const both = r.int(3, 15), oa = r.int(5, 25), ob = r.int(5, 25), none = r.int(2, 12);
    const T = both + oa + ob + none, A = both + oa, B = both + ob;
    if (d <= 3) return { stem: `Of ${T} students, ${A} take French, ${B} take Spanish, and ${none} take neither language. How many students take both French and Spanish?`, answer: { value: both },
      explain: `Students taking at least one = ${T} − ${none} = ${T - none}. Both = ${A} + ${B} − ${T - none} = ${both}.` };
    return { stem: `Of ${T} students, ${A} take French, ${B} take Spanish, and ${none} take neither. How many students take exactly one of the two languages?`, answer: { value: oa + ob },
      explain: `Both = ${A} + ${B} − ${T - none} = ${both}. Exactly one = (${A} − ${both}) + (${B} − ${both}) = ${oa + ob}.` };
  } },

  // ───────────────────────── WORD PROBLEMS ─────────────────────────
  { id: 'rate_dist', topic: 'word', type: 'ne', make(r, d) {
    if (d <= 1) {
      const s = r.int(40, 70), t = r.int(2, 6);
      return { stem: `A car travels at a constant speed of ${s} miles per hour. How many miles does it travel in ${t} hours?`, answer: { value: s * t }, explain: `Distance = rate × time = ${s} × ${t} = ${s * t}.` };
    }
    if (d === 2) {
      const sa = r.int(30, 60), sb = r.int(30, 60), t = r.int(2, 5);
      return { stem: `Two trains start ${(sa + sb) * t} miles apart and travel toward each other at constant speeds of ${sa} and ${sb} miles per hour. How many hours until they meet?`, answer: { value: t },
        explain: `They close the gap at ${sa} + ${sb} = ${sa + sb} mph, so time = ${(sa + sb) * t}/${sa + sb} = ${t} hours.` };
    }
    if (d === 3) {
      const [a, b] = r.pick([[40, 60], [30, 60], [20, 30], [60, 90], [12, 24], [50, 75]]);
      const avg = 2 * a * b / (a + b);
      return { stem: `A driver travels from town P to town Q at ${a} miles per hour and returns along the same route at ${b} miles per hour. What is the average speed, in miles per hour, for the entire round trip?`, answer: { value: avg },
        explain: `Average speed = total distance / total time = 2ab/(a+b) = 2·${a}·${b}/${a + b} = ${fmt(avg)}. It is NOT the simple average ${(a + b) / 2}.` };
    }
    const delta = r.pick([10, 15, 20]), m = r.int(2, 4), sa = delta * m, h = r.int(1, 3);
    return { stem: `Cyclist A leaves a station traveling at ${sa} miles per hour. ${h === 1 ? 'One hour' : h + ' hours'} later, cyclist B leaves the same station on the same route traveling at ${sa + delta} miles per hour. How many hours after B departs does B catch up with A?`, answer: { value: h * m },
      explain: `When B starts, A leads by ${sa * h} miles. B gains ${delta} mph, so B needs ${sa * h}/${delta} = ${h * m} hours.` };
  } },

  { id: 'work', topic: 'word', type: 'ne', make(r, d) {
    if (d <= 3) {
      const [a, b] = r.pick([[6, 3], [12, 6], [10, 15], [12, 4], [20, 30], [15, 10], [30, 20], [8, 8], [9, 18]]);
      const t = a * b / (a + b);
      return { stem: `Machine A can complete a job in ${a} hours and machine B can complete the same job in ${b} hours. Working together at their constant rates, how many hours will it take them to complete the job?`, answer: { value: t },
        explain: `Combined rate = 1/${a} + 1/${b} = ${a + b}/${a * b} of the job per hour, so time = ${a * b}/${a + b} = ${fmt(t)} hours.` };
    }
    const [a, b, c] = r.pick([[12, 6, 4], [10, 15, 30], [6, 3, 2], [20, 30, 60], [15, 10, 6]]);
    const t = 1 / (1 / a + 1 / b + 1 / c);
    return { stem: `Three pumps can empty a tank in ${a}, ${b}, and ${c} hours, respectively, when working alone. How many hours will it take to empty the tank if all three work together at their constant rates?`, answer: { value: +t.toFixed(6) },
      explain: `Combined rate = 1/${a} + 1/${b} + 1/${c} = ${fmt(+(1 / t).toFixed(6))} tank per hour, so time = ${fmt(+t.toFixed(6))} hours.` };
  } },

  { id: 'interest', topic: 'word', type: 'ne', make(r, d) {
    const P = r.pick([400, 800, 1200, 2000, 4000]), rate = r.pick([5, 10, 20]);
    if (d <= 2) {
      const t = r.int(2, 5);
      return { stem: `How much simple interest, in dollars, is earned on ${money(P)} invested at ${rate}% per year for ${t} years?`, answer: { value: P * rate * t / 100 },
        explain: `I = Prt = ${P} × ${rate / 100} × ${t} = ${P * rate * t / 100}.` };
    }
    const bal = P * (100 + rate) * (100 + rate) / 10000;
    if (d === 3) return { stem: `An investment of ${money(P)} earns ${rate}% interest per year, compounded annually. What is the value of the investment, in dollars, after 2 years?`, answer: { value: bal },
      explain: `${P} × ${(100 + rate) / 100}² = ${fmt(bal)}.` };
    return { stem: `An investment of ${money(P)} earns ${rate}% interest per year, compounded annually. How much more interest, in dollars, is earned in 2 years than would be earned with simple interest at the same rate?`, answer: { value: bal - P - P * rate * 2 / 100 },
      explain: `Compound interest = ${fmt(bal)} − ${P} = ${fmt(bal - P)}. Simple interest = ${P * rate * 2 / 100}. Difference = ${fmt(bal - P - P * rate * 2 / 100)}.` };
  } },

  { id: 'mixture', topic: 'word', type: 'ne', make(r, d) {
    if (d <= 3) {
      const [x, y] = r.pick([[4, 6], [2, 8], [5, 5], [10, 10], [5, 20], [10, 15], [20, 20], [30, 20]]);
      const a = r.pick([10, 20, 30]), b = r.pick([40, 50, 60, 80]);
      const ans = (x * a + y * b) / (x + y);
      return { stem: `${x} liters of a ${a}% salt solution are mixed with ${y} liters of a ${b}% salt solution. What is the percent concentration of salt in the resulting mixture?`, answer: { value: ans },
        explain: `Salt = ${x}×${a / 100} + ${y}×${b / 100} = ${fmt((x * a + y * b) / 100)} liters in ${x + y} liters: ${fmt(ans)}%.` };
    }
    const [a, c] = r.pick([[30, 20], [40, 25], [60, 40], [50, 20], [20, 10], [45, 30]]), x = r.pick([20, 40, 60, 80, 100]);
    const water = x * (a - c) / c;
    return { stem: `How many liters of pure water must be added to ${x} liters of a ${a}% acid solution to produce a ${c}% acid solution?`, answer: { value: water },
      explain: `Acid stays constant: ${x}×${a / 100} = ${fmt(x * a / 100)} L. New total volume = ${fmt(x * a / 100)}/${c / 100} = ${fmt(x * a / c)} L, so water added = ${fmt(x * a / c)} − ${x} = ${fmt(water)}.` };
  } },

  { id: 'markup', topic: 'word', type: 'ne', make(r, d) {
    const C = r.pick([40, 50, 80, 100, 200]), m = r.pick([20, 25, 40, 50, 60]), off = r.pick([10, 20, 25]);
    if (d <= 3) {
      const sp = C * (100 + m) / 100;
      return { stem: `A store buys a lamp for ${money(C)} and marks it up by ${m}% to set the selling price. What is the selling price, in dollars?`, answer: { value: sp }, explain: `${C} × ${(100 + m) / 100} = ${fmt(sp)}.` };
    }
    const fin = C * (100 + m) * (100 - off) / 10000;
    return { stem: `A retailer marks up the cost of a chair by ${m}% and then offers a ${off}% discount off the marked price. If the final selling price is ${money(fin)}, what was the retailer's cost, in dollars?`, answer: { value: C },
      explain: `Final = Cost × ${(100 + m) / 100} × ${(100 - off) / 100} = Cost × ${fmt((100 + m) * (100 - off) / 10000)}. Cost = ${fmt(fin)}/${fmt((100 + m) * (100 - off) / 10000)} = ${C}.` };
  } },

  { id: 'machines', topic: 'word', type: 'ne', make(r, d) {
    const m1 = r.int(2, 6), h1 = r.int(2, 6), k = r.int(3, 12), w = k * m1 * h1;
    let m2 = r.int(2, 9), h2 = r.int(2, 9);
    if (d <= 3) return { stem: `${m1} identical machines, working at the same constant rate, produce ${w} widgets in ${h1} hours. At this rate, how many widgets would ${m2} of these machines produce in ${h2} hours?`, answer: { value: k * m2 * h2 },
      explain: `Each machine makes ${w}/(${m1}×${h1}) = ${k} widgets per hour. ${m2} machines × ${h2} hours × ${k} = ${k * m2 * h2}.` };
    m2 = m1 * r.int(2, 3);
    const target = k * m2 * r.int(2, 5);
    return { stem: `${m1} identical machines, working at the same constant rate, produce ${w} widgets in ${h1} hours. How many hours would it take ${m2} of these machines to produce ${target} widgets?`, answer: { value: target / (k * m2) },
      explain: `Each machine makes ${k} widgets/hour, so ${m2} machines make ${k * m2}/hour. Time = ${target}/${k * m2} = ${target / (k * m2)} hours.` };
  } },

  // ───────── Classic drill patterns (original items; ideas common to GRE prep books) ─────────
  { id: 'digit_reverse', topic: 'arithmetic', type: 'mcn', strategy: 'plug', make(r, d) {
    const three = d >= 3;
    const opts = three ? [3, 4, 6, 9, 11, 18] : [2, 3, 5, 9, 11, 18];
    const base = three ? 99 : 9;
    const answer = opts.map((v, i) => (base % v === 0 ? i : -1)).filter((i) => i >= 0);
    let n, m;
    if (three) { const a = r.int(2, 9), b = r.int(0, 9), c = r.int(1, a - 1); n = 100 * a + 10 * b + c; m = 100 * c + 10 * b + a; }
    else { const a = r.int(2, 9), b = r.int(1, a - 1); n = 10 * a + b; m = 10 * b + a; }
    return { stem: three
      ? 'A three-digit integer has different hundreds and units digits, and neither is zero. A new integer is formed by swapping its hundreds and units digits. The positive difference between the two integers must be divisible by which of the following? Indicate <em>all</em> such numbers.'
      : 'A two-digit integer has two different nonzero digits. A new integer is formed by reversing its digits. The positive difference between the two integers must be divisible by which of the following? Indicate <em>all</em> such numbers.',
      options: opts.map(String), answer,
      explain: three
        ? `Write the integer as 100a + 10b + c; the swap is 100c + 10b + a. Their difference is 99(a − c), always a multiple of 99 = 9 × 11, hence also of 3. Whether it is divisible by 4, 6 or 18 depends on a − c. Plug in to check: ${n} − ${m} = ${n - m}.`
        : `Write the integer as 10a + b; the reversal is 10b + a. Their difference is 9(a − b), always a multiple of 9 and of 3. Since a − b is between 1 and 8, it is never a multiple of 11. Plug in to check: ${n} − ${m} = ${n - m}.` };
  } },

  { id: 'qc_products', topic: 'arithmetic', type: 'qc', strategy: 'compare', make(r, d) {
    const K = 1000;
    let a, c, b, e;
    do { a = r.int(12, 49); c = r.int(12, 49); b = r.int(11, 99); e = r.int(101, 999); } while (a === c);
    const A = BigInt(a * K + b) * BigInt(c * K + e), B = BigInt(a * K + e) * BigInt(c * K + b);
    const f = (x) => x.toLocaleString('en-US');
    return { qa: `${f(a * K + b)} × ${f(c * K + e)}`, qb: `${f(a * K + e)} × ${f(c * K + b)}`, answer: A > B ? 0 : A < B ? 1 : 2,
      explain: `Don’t multiply. With K = 1,000: A = (${a}K + ${b})(${c}K + ${e}) and B = (${a}K + ${e})(${c}K + ${b}). Both products share ${a}·${c}K² and ${b}·${e}, so only the cross terms differ: A − B = K(${a} − ${c})(${e} − ${b}), which is ${A > B ? 'positive' : 'negative'}. ${A > B ? 'A' : 'B'} is greater.` };
  } },

  { id: 'stars_bars', topic: 'data', type: 'ne', make(r, d) {
    const C = (n, k) => { let x = 1; for (let i = 1; i <= k; i++) x = (x * (n - k + i)) / i; return Math.round(x); };
    const N = r.int(7, 15);
    if (d <= 3) return { stem: `How many ordered pairs (x, y) of positive integers satisfy x + y = ${N}?`, answer: { value: N - 1 },
      explain: `x can be any integer from 1 to ${N - 1}, and then y is determined: ${N - 1} pairs.` };
    const pos = d === 4 || r.chance(0.5);
    const ans = pos ? C(N - 1, 2) : C(N + 2, 2);
    return { stem: `How many ordered triples (x, y, z) of ${pos ? 'positive' : 'nonnegative'} integers satisfy x + y + z = ${N}?`, answer: { value: ans },
      explain: pos
        ? `Picture ${N} identical units in a row; placing 2 dividers in the ${N - 1} gaps splits them into three positive parts. That gives C(${N - 1}, 2) = ${ans}.`
        : `Arrange ${N} units and 2 dividers in a row (parts may be empty): choose positions for the 2 dividers among ${N + 2} spots, C(${N + 2}, 2) = ${ans}.` };
  } },

  { id: 'exp_tower', topic: 'algebra', type: 'mc1', make(r, d) {
    const [b, k] = d >= 5 ? r.pick([[2, 3], [3, 2]]) : d >= 3 ? r.pick([[2, 2], [3, 2]]) : r.pick([[2, 1], [3, 1]]);
    const x = b ** k, good = k * x;
    const c = numChoices(r, good, [x, k + x, 2 * x, x * x, good + k, good - k], (n) => sup(b, n));
    return { stem: `If x = ${k === 1 ? b : sup(b, k)}, what is the value of x<sup>x</sup>?`, options: c.options, answer: c.answer,
      explain: `x = ${x}, so x<sup>x</sup> = (${b}<sup>${k}</sup>)<sup>${x}</sup> = ${b}<sup>${k}·${x}</sup> = ${sup(b, good)}. When a power is raised to a power, multiply the exponents.` };
  } },

  { id: 'ratio_min', topic: 'arithmetic', type: 'ne', strategy: 'pita', make(r, d) {
    let p;
    do { p = [r.int(2, 9), r.int(2, 9), r.int(2, 9)]; } while (new Set(p).size < 3);
    const s = p[0] + p[1] + p[2];
    let N;
    do { N = r.int(s + 1, s * 6); } while (d >= 3 && N % s === 0);
    const k = Math.ceil(N / s);
    return { stem: `A choir has sopranos, altos, and tenors in the ratio ${p.join(' : ')}. If the choir must have at least ${N} members and the ratio must be kept exactly, what is the least possible number of tenors?`, answer: { value: p[2] * k },
      explain: `Members come in complete blocks of ${p.join(' + ')} = ${s}. The smallest multiple of ${s} that is at least ${N} is ${s * k} (${k} blocks), so there are ${p[2]} × ${k} = ${p[2] * k} tenors. A common trap is to stop at ${N} instead of rounding up to a whole block.` };
  } },

  { id: 'meet_before', topic: 'word', type: 'ne', strategy: 'trap', make(r, d) {
    let v1, v2, t;
    do { v1 = 10 * r.int(3, 8); v2 = 10 * r.int(3, 8); t = r.pick([12, 15, 18, 20, 30, 36, 45]); } while (((v1 + v2) * t) % 60 !== 0);
    const D = (v1 + v2) * r.int(2, 4) + 10 * r.int(1, 5);
    const ans = ((v1 + v2) * t) / 60;
    return { stem: `Two cars that are ${D} miles apart drive straight toward each other, one at a constant ${v1} miles per hour and the other at a constant ${v2} miles per hour. How many miles apart are they ${t} minutes before they meet?`, answer: { value: ans },
      explain: `Run the clock backward from the moment they meet: together they close the gap at ${v1} + ${v2} = ${v1 + v2} mph, so ${t} minutes before meeting they are ${v1 + v2} × ${t}/60 = ${ans} miles apart. The starting distance of ${D} miles is a distractor.` };
  } },

  { id: 'prime_pair', topic: 'data', type: 'ne', make(r, d) {
    const L = d <= 3 ? 10 : r.pick([12, 14, 20]);
    const P = [2, 3, 5, 7, 11, 13, 17, 19].filter((p) => p < L);
    const isPrime = (n) => n > 1 && [...Array(Math.floor(Math.sqrt(n))).keys()].every((i) => i < 1 || n % (i + 1) !== 0);
    const ev = r.pick(d <= 3 ? ['notprime', 'even'] : ['notprime', 'even', 'odd']);
    const pairs = [];
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) pairs.push([P[i], P[j]]);
    const test = { notprime: ([a, b]) => !isPrime(a + b), even: ([a, b]) => (a + b) % 2 === 0, odd: ([a, b]) => (a * b) % 2 === 1 }[ev];
    const hits = pairs.filter(test).length;
    const { num, den } = reduceFrac(hits, pairs.length);
    const what = { notprime: 'their sum is NOT a prime number', even: 'their sum is even', odd: 'their product is odd' }[ev];
    return { stem: `Two different numbers are chosen at random from the prime numbers less than ${L}. What is the probability that ${what}? (Enter your answer as a fraction.)`, answer: { num, den, value: num / den }, fraction: true,
      explain: `The primes are ${P.join(', ')}, giving ${pairs.length} equally likely pairs. ${ev === 'notprime' ? 'Sums: ' + pairs.map(([a, b]) => `${a + b}`).join(', ') + '. ' : ''}${hits} of them qualify, so P = ${hits}/${pairs.length} = ${num}/${den}.${ev !== 'notprime' ? ' Key idea: 2 is the only even prime, so the outcome depends on whether 2 is chosen.' : ''}` };
  } },

  { id: 'avg_expr', topic: 'algebra', type: 'qc', strategy: 'compare', make(r, d) {
    const vars = ['a', 'b', 'c', 'd'], m = r.int(3, 12), lam = r.int(1, 3);
    const coef = vars.map(() => { const col = [r.int(-3, 5), r.int(-3, 5), r.int(-3, 5)]; col.push(lam - col.reduce((x, y) => x + y, 0)); return col; });
    const consts = [r.int(-30, 30), r.int(-30, 30), r.int(-30, 30), r.int(-30, 30)];
    const kappa = consts.reduce((x, y) => x + y, 0);
    const exprs = [0, 1, 2, 3].map((e) => {
      let s = '';
      vars.forEach((v, j) => { const c = coef[j][e]; if (!c) return; s += (s ? (c < 0 ? ' − ' : ' + ') : c < 0 ? '−' : '') + (Math.abs(c) === 1 ? '' : Math.abs(c)) + v; });
      const k = consts[e];
      if (k) s += s ? signed(k) : fmt(k);
      return s || '0';
    });
    const B = (lam * 4 * m + kappa) / 4;
    const A = d >= 5 && r.chance(0.5) ? B : B + r.pick([-1, 1]) * r.pick([0.25, 0.5, 1, 2]);
    return { info: `The average (arithmetic mean) of a, b, c, and d is ${m}.`, qa: fmt(A), qb: `The average of ${exprs.join(', ')}`, answer: A > B ? 0 : A < B ? 1 : 2,
      explain: `You can’t find a, b, c, d individually, so work with the sum: a + b + c + d = ${4 * m}. Adding the four expressions, each variable’s coefficients total ${lam}, so the sum is ${lam}(a + b + c + d) ${signed(kappa).trim()} = ${lam * 4 * m + kappa}, and the average is ${fmt(B)}. Compared with ${fmt(A)}, ${A > B ? 'A is greater' : A < B ? 'B is greater' : 'they are equal'}.` };
  } },
];

const BY_ID = Object.fromEntries(GENERATORS.map((g) => [g.id, g]));

export function generate(gen, d, seed) {
  d = clamp(Math.round(d), 1, 5);
  const g = typeof gen === 'string' ? BY_ID[gen] : gen;
  const r = makeRng(seed);
  const out = g.make(r, d);
  return { id: `g:${g.id}:${d}:${seed}`, section: 'Q', type: g.type, topic: g.topic, difficulty: d, gen: g.id, seed, ...out };
}

// ───────────────────────── DATA INTERPRETATION SETS ─────────────────────────
// A set is one table/graph shared by three questions (as on the real test). Each question
// carries the set's display HTML in `data` so it can be rendered and reviewed on its own.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const PIE_COLORS = ['#3b6fd8', '#e0913a', '#3aa676', '#c4534b', '#8a63c9'];
const nearHalf = (v) => Math.abs((v % 1) - 0.5) < 0.06;

function barChart(title, a, b, la, lb) {
  const W = 360, H = 220, x0 = 40, y0 = 190, top = 20, max = 140, sc = (y0 - top) / max, gw = (W - x0 - 10) / MONTHS.length;
  let g = '';
  for (let v = 0; v <= max; v += 10) {
    const y = y0 - v * sc;
    g += `<line x1="${x0}" x2="${W - 10}" y1="${y}" y2="${y}" class="grid${v % 20 ? ' minor' : ''}"/>`;
    if (v % 20 === 0) g += `<text x="${x0 - 6}" y="${y + 4}" text-anchor="end">${v}</text>`;
  }
  MONTHS.forEach((m, i) => {
    const gx = x0 + i * gw + gw * 0.15, bw = gw * 0.33;
    g += `<rect x="${gx}" y="${y0 - a[i] * sc}" width="${bw}" height="${a[i] * sc}" class="bar-a"/><rect x="${gx + bw}" y="${y0 - b[i] * sc}" width="${bw}" height="${b[i] * sc}" class="bar-b"/>`;
    g += `<text x="${gx + bw}" y="${y0 + 16}" text-anchor="middle">${m}</text>`;
  });
  return `<figure class="chart"><figcaption>${title}</figcaption><svg viewBox="0 0 ${W} ${H + 10}" role="img">${g}</svg>
    <div class="legend"><span><i class="bar-a"></i>${la}</span><span><i class="bar-b"></i>${lb}</span></div></figure>`;
}

function pieChart(title, cats, pcts) {
  let a0 = -Math.PI / 2, g = '';
  const cx = 90, cy = 90, R = 80;
  pcts.forEach((p, i) => {
    const a1 = a0 + (p / 100) * 2 * Math.PI;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    g += `<path d="M${cx},${cy} L${(cx + R * Math.cos(a0)).toFixed(2)},${(cy + R * Math.sin(a0)).toFixed(2)} A${R},${R} 0 ${large} 1 ${(cx + R * Math.cos(a1)).toFixed(2)},${(cy + R * Math.sin(a1)).toFixed(2)} Z" fill="${PIE_COLORS[i]}" stroke="#fff" stroke-width="1.5"/>`;
    a0 = a1;
  });
  return `<figure class="chart pie"><figcaption>${title}</figcaption><svg viewBox="0 0 180 180" role="img">${g}</svg>
    <div class="legend col">${cats.map((c, i) => `<span><i style="background:${PIE_COLORS[i]}"></i>${c}: ${pcts[i]}%</span>`).join('')}</div></figure>`;
}


function lineChart(title, years, vals, unit) {
  const W = 380, H = 220, x0 = 46, y0 = 190, top = 16, max = 30, sc = (y0 - top) / max, step = (W - x0 - 16) / (years.length - 1);
  let g = '';
  for (let v = 0; v <= max; v += 5) {
    const y = y0 - v * sc;
    g += `<line x1="${x0}" x2="${W - 10}" y1="${y}" y2="${y}" class="grid${v % 10 ? ' minor' : ''}"/>`;
    if (v % 10 === 0) g += `<text x="${x0 - 6}" y="${y + 4}" text-anchor="end">${v}</text>`;
  }
  const pts = vals.map((v, i) => [x0 + i * step, y0 - v * sc]);
  g += `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#3b6fd8" stroke-width="2.5"/>`;
  g += pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#3b6fd8"/>`).join('');
  g += years.map((yr, i) => `<text x="${x0 + i * step}" y="${y0 + 16}" text-anchor="middle">${String(yr).slice(2)}</text>`).join('');
  return `<figure class="chart"><figcaption>${title}</figcaption><svg viewBox="0 0 ${W} ${H + 10}" role="img">${g}</svg><p class="fig-note">${unit}. Years shown as ’15–’23. Graph drawn to scale.</p></figure>`;
}

const DI_KINDS = {
  line(r) {
    const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
    let v, inc;
    do {
      v = [r.int(4, 14)];
      for (let i = 1; i < 9; i++) v.push(Math.max(2, Math.min(29, v[i - 1] + r.int(-4, 5))));
      inc = v.map((x, i) => (i ? x - v[i - 1] : -99));
    } while (v.filter((x) => x === Math.max(...v)).length > 1 || inc.filter((x) => x === Math.max(...inc)).length > 1 || v[0] === v[8]);
    const what = r.pick(['Membership of a hiking club', 'Number of registered volunteers', 'Enrollment in an evening language school']);
    const html = lineChart(`${what}, 2015–2023`, years, v, 'Vertical axis: hundreds of people');
    const qs = [];
    const top = v.indexOf(Math.max(...v));
    const yo = r.shuffle(years.filter((_, i) => i !== top)).slice(0, 4).concat(years[top]).sort((a, b) => a - b);
    qs.push({ type: 'mc1', difficulty: 1, stem: 'In which year was the figure highest?', options: yo.map(String), answer: yo.indexOf(years[top]), explain: `The highest point is ${years[top]} (${v[top] * 100}).` });
    const j = inc.indexOf(Math.max(...inc));
    const yj = r.shuffle(years.slice(1).filter((y) => y !== years[j])).slice(0, 4).concat(years[j]).sort((a, b) => a - b);
    qs.push({ type: 'mc1', difficulty: 2, stem: 'In which year was the increase over the previous year the greatest?', options: yj.map(String), answer: yj.indexOf(years[j]),
      explain: `Year-over-year changes: ${years.slice(1).map((y, i) => `${y}: ${inc[i + 1] >= 0 ? '+' : ''}${inc[i + 1] * 100}`).join(', ')}. The largest increase is in ${years[j]}. Look for the steepest upward segment.` });
    const a = r.int(0, 4), b = a + 4;
    const mean = (v.slice(a, b + 1).reduce((x, y) => x + y, 0) / 5) * 100;
    const m = Math.round(mean / 50) * 50;
    const c = numChoices(r, m, [m - 400, m - 200, m + 200, m + 400, m + 600]);
    qs.push({ type: 'mc1', difficulty: 3, stem: `Approximately what was the average (arithmetic mean) figure for the years ${years[a]} through ${years[b]}, inclusive?`, options: c.options, answer: c.answer,
      explain: `Read the five values (${v.slice(a, b + 1).map((x) => x * 100).join(', ')}), add them and divide by 5: about ${Math.round(mean)}. Ballpark: the answer must lie between the lowest and highest of the five points.` });
    const above = v.filter((x) => x > v.reduce((p, q) => p + q, 0) / 9).length;
    const avg9 = (v.reduce((p, q) => p + q, 0) / 9) * 100;
    const tie = v.some((x) => x * 100 === avg9);
    qs.push({ type: 'ne', difficulty: 4, stem: `In how many of the nine years was the figure ${tie ? 'greater than or equal to' : 'greater than'} the average figure for all nine years?`, answer: { value: tie ? v.filter((x) => x * 100 >= avg9).length : above },
      explain: `The nine values sum to ${v.reduce((p, q) => p + q, 0) * 100}, so the average is about ${avg9.toFixed(1)}. Count the points above that level: ${tie ? v.filter((x) => x * 100 >= avg9).length : above}.` });
    const pc = ((v[8] - v[0]) / v[0]) * 100;
    qs.push({ type: 'ne', difficulty: 5, stem: `By what percent did the figure ${pc > 0 ? 'increase' : 'decrease'} from 2015 to 2023? Give your answer to the nearest whole percent.`, answer: { value: Math.round(Math.abs(pc)) }, tol: nearHalf(Math.abs(pc)) ? 0.6 : undefined,
      explain: `|${v[8] * 100} − ${v[0] * 100}| ÷ ${v[0] * 100} × 100 ≈ ${Math.abs(pc).toFixed(2)}%, which rounds to ${Math.round(Math.abs(pc))}%. Percent change is always measured from the starting value.` });
    return { title: 'Graph', html, qs };
  },
  table(r) {
    const [unit, names] = r.pick([
      ['Enrollment (number of students)', ['Biology', 'Chemistry', 'Economics', 'History', 'Physics']],
      ['Revenue (in thousands of dollars)', ['North', 'South', 'East', 'West', 'Central']],
      ['Visitors (in hundreds)', ['Museum A', 'Museum B', 'Museum C', 'Museum D', 'Museum E']],
    ]);
    const y1 = r.pick([2018, 2019, 2020]), y2 = y1 + 3;
    const mult = r.shuffle([0.8, 0.9, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.4, 1.5]).slice(0, 5);
    const v1 = names.map(() => 20 * r.int(6, 20)), v2 = v1.map((v, i) => Math.round(v * mult[i]));
    const html = `<table class="data"><caption>${unit}, ${y1} and ${y2}</caption><tr><th></th><th>${y1}</th><th>${y2}</th></tr>${names.map((n, i) => `<tr><th>${n}</th><td>${v1[i]}</td><td>${v2[i]}</td></tr>`).join('')}<tr><th>Total</th><td>${v1.reduce((a, b) => a + b)}</td><td>${v2.reduce((a, b) => a + b)}</td></tr></table>`;
    const qs = [];
    const k0 = r.int(0, 4);
    const c0 = numChoices(r, v1[k0], [...v1, ...v2, v1[k0] + 20, v1[k0] - 20]);
    qs.push({ type: 'mc1', difficulty: 1, stem: `What was the figure for ${names[k0]} in ${y1}?`, options: c0.options, answer: c0.answer,
      explain: `Read the ${names[k0]} row in the ${y1} column: ${v1[k0]}. Check the row and the column before answering \u2014 most data-reading errors come from the wrong year.` });
    const best = mult.indexOf(Math.max(...mult));
    qs.push({ type: 'mc1', difficulty: 3, stem: `Which of the five had the greatest percent increase from ${y1} to ${y2}?`, options: names, answer: best,
      explain: `Percent change = (${y2} − ${y1}) / ${y1}. ${names.map((n, i) => `${n}: ${fmt(+((mult[i] - 1) * 100).toFixed(1))}%`).join('; ')}. The greatest is ${names[best]}. A larger absolute increase is not necessarily a larger percent increase.` });
    const total2 = v2.reduce((a, b) => a + b);
    let k = r.int(0, 4);
    for (let t = 0; t < 5 && nearHalf((100 * v2[k]) / total2); t++) k = (k + 1) % 5;
    const share = Math.round((100 * v2[k]) / total2);
    qs.push({ type: 'ne', difficulty: 3, stem: `In ${y2}, ${names[k]} accounted for approximately what percent of the total? Give your answer to the nearest whole percent.`, answer: { value: share },
      explain: `${v2[k]} ÷ ${total2} ≈ ${((100 * v2[k]) / total2).toFixed(2)}%, which rounds to ${share}%.` });
    const th = [10, 15, 20, 25, 30, 35, 40, 5].find((t) => { const c = mult.filter((m) => (m - 1) * 100 > t).length; return c >= 1 && c <= 4 && !mult.some((m) => Math.abs((m - 1) * 100 - t) < 1e-9); }) ?? 10;
    qs.push({ type: 'mcn', difficulty: 4, stem: `For which of the following did the figure increase by more than ${th} percent from ${y1} to ${y2}? Indicate <em>all</em> such answers.`, options: names,
      answer: mult.map((m, i) => ((m - 1) * 100 > th ? i : -1)).filter((i) => i >= 0),
      explain: `Compute each percent change: ${names.map((n, i) => `${n} ${fmt(+((mult[i] - 1) * 100).toFixed(1))}%`).join(', ')}. Those above ${th}% are correct.` });
    const total3 = v2.reduce((sum, v, i) => sum + v * mult[i], 0);
    qs.push({ type: 'ne', difficulty: 5, stem: `Suppose that from ${y2} to ${y2 + 3} each of the five figures changes by the same percent as it did from ${y1} to ${y2}. What would the total for all five be in ${y2 + 3}? Give your answer to the nearest whole number.`,
      answer: { value: Math.round(total3) }, tol: nearHalf(total3) ? 0.6 : undefined,
      explain: `Apply each row's own growth factor to its ${y2} value: ${names.map((n, i) => `${v2[i]}\u00D7${mult[i]}`).join(' + ')} = ${fmt(+total3.toFixed(2))} \u2248 ${Math.round(total3)}. Applying the overall growth rate to the total would give a different (wrong) answer.` });
    return { title: 'Data table', html, qs };
  },
  bar(r) {
    const [la, lb, what] = r.pick([['Store A', 'Store B', 'Monthly sales (in thousands of dollars)'], ['Plant X', 'Plant Y', 'Monthly output (in hundreds of units)']]);
    let a, b, diffs;
    do {
      a = MONTHS.map(() => 10 * r.int(2, 13)); b = MONTHS.map(() => 10 * r.int(2, 13));
      diffs = a.map((v, i) => Math.abs(v - b[i]));
    } while (diffs.filter((d) => d === Math.max(...diffs)).length > 1 || a[0] === a[5] || a.filter((v) => v === Math.max(...a)).length > 1);
    const html = barChart(what, a, b, la, lb);
    const qs = [];
    const top = a.indexOf(Math.max(...a));
    const m0 = r.shuffle(MONTHS.filter((_, i) => i !== top)).slice(0, 4).concat(MONTHS[top]).sort((x, y) => MONTHS.indexOf(x) - MONTHS.indexOf(y));
    qs.push({ type: 'mc1', difficulty: 1, stem: `In which month was ${la}'s figure the highest?`, options: m0, answer: m0.indexOf(MONTHS[top]),
      explain: `${la}'s tallest bar is in ${MONTHS[top]} (${a[top]}).` });
    const best = diffs.indexOf(Math.max(...diffs));
    const months = r.shuffle(MONTHS.filter((_, i) => i !== best)).slice(0, 4).concat(MONTHS[best]).sort((x, y) => MONTHS.indexOf(x) - MONTHS.indexOf(y));
    qs.push({ type: 'mc1', difficulty: 2, stem: `In which month was the difference between ${la} and ${lb} the greatest?`, options: months, answer: months.indexOf(MONTHS[best]),
      explain: `Differences by month: ${MONTHS.map((m, i) => `${m} ${diffs[i]}`).join(', ')}. The greatest is ${MONTHS[best]}.` });
    const mean = b.reduce((x, y) => x + y) / 6, m = Math.round(mean);
    const c = numChoices(r, m, [m - 30, m - 15, m + 15, m + 30, m + 45]);
    qs.push({ type: 'mc1', difficulty: 3, stem: `Approximately what was the average (arithmetic mean) monthly figure for ${lb} over the six months shown?`, options: c.options, answer: c.answer,
      explain: `Sum = ${b.join(' + ')} = ${b.reduce((x, y) => x + y)}; divided by 6 ≈ ${fmt(+mean.toFixed(2))}, closest to ${m}.` });
    const pc = ((a[5] - a[0]) / a[0]) * 100;
    const word = pc > 0 ? 'greater' : 'less';
    const ans = Math.round(Math.abs(pc));
    qs.push({ type: 'ne', difficulty: 4, stem: `${la}'s figure for June was what percent ${word} than its figure for January? Give your answer to the nearest whole percent.`, answer: { value: ans }, tol: nearHalf(Math.abs(pc)) ? 0.6 : undefined,
      explain: `|${a[5]} − ${a[0]}| / ${a[0]} × 100 ≈ ${Math.abs(pc).toFixed(2)}%, which rounds to ${ans}%.` });
    const tie = a.some((v) => v === mean);
    const cnt = a.filter((v) => (tie ? v >= mean : v > mean)).length;
    qs.push({ type: 'ne', difficulty: 5, stem: `For how many of the six months was ${la}'s figure ${tie ? 'greater than or equal to' : 'greater than'} the average (arithmetic mean) monthly figure for ${lb}?`, answer: { value: cnt },
      explain: `${lb}'s mean is ${fmt(+mean.toFixed(2))}. ${la}'s values are ${a.join(', ')}; ${cnt} of them are ${tie ? 'at least' : 'above'} that mean.` });
    return { title: 'Graph', html, qs };
  },
  pie(r) {
    const cats = r.shuffle(['Salaries', 'Research', 'Marketing', 'Facilities', 'Equipment']);
    let pcts;
    do { const cuts = r.shuffle([...Array(19).keys()].map((i) => (i + 1) * 5)).slice(0, 4).sort((x, y) => x - y); pcts = [cuts[0], cuts[1] - cuts[0], cuts[2] - cuts[1], cuts[3] - cuts[2], 100 - cuts[3]]; }
    while (pcts.some((p) => p < 5) || new Set(pcts).size < 4 || pcts.filter((p) => p === Math.max(...pcts)).length > 1);
    pcts.sort((x, y) => y - x);
    const T = r.pick([40, 60, 80, 120, 200]);
    const html = pieChart(`Distribution of a company's annual budget of $${T} million`, cats, pcts);
    const qs = [];
    const alpha = [...cats].sort();
    qs.push({ type: 'mc1', difficulty: 1, stem: 'Which category received the largest share of the budget?', options: alpha, answer: alpha.indexOf(cats[0]),
      explain: `${cats[0]} has the largest slice (${pcts[0]}%).` });
    const i = r.int(0, 4), amt = (T * pcts[i]) / 100;
    const c = numChoices(r, amt, [pcts[i], (T * pcts[i]) / 10, (T * (pcts[i] + 5)) / 100, (T * (pcts[i] - 5)) / 100, T - amt]);
    qs.push({ type: 'mc1', difficulty: 2, stem: `How much of the budget, in millions of dollars, was allocated to ${cats[i]}?`, options: c.options, answer: c.answer,
      explain: `${pcts[i]}% of $${T} million = ${fmt(amt)} million.` });
    let j = r.int(0, 4), k = r.int(0, 4);
    while (pcts[j] === pcts[k]) k = (k + 1) % 5;
    const { num, den } = reduceFrac(pcts[j], pcts[k]);
    qs.push({ type: 'ne', difficulty: 3, fraction: true, stem: `The amount allocated to ${cats[j]} was what fraction of the amount allocated to ${cats[k]}? (Enter your answer as a fraction.)`, answer: { num, den, value: num / den },
      explain: `Both are percents of the same total, so the fraction is ${pcts[j]}/${pcts[k]} = ${num}/${den}.` });
    const inc = r.pick([10, 20, 25, 50]), T2 = (T * (100 + inc)) / 100;
    const amts = pcts.map((p) => (T2 * p) / 100);
    const sorted = [...new Set(amts)].sort((x, y) => x - y);
    const X = sorted.length > 2 ? (sorted[1] + sorted[2]) / 2 : sorted[0] / 2;
    const Xr = Math.round(X * 2) / 2;
    const cut = amts.some((v) => v === Xr) ? X : Xr;
    qs.push({ type: 'mcn', difficulty: 4, stem: `Next year the total budget will increase by ${inc} percent, and each category will keep the same percent of the total. Which categories will then receive more than $${fmt(+cut.toFixed(2))} million? Indicate <em>all</em> such categories.`, options: cats,
      answer: amts.map((v, n) => (v > cut ? n : -1)).filter((n) => n >= 0),
      explain: `New total = $${fmt(T2)} million. Amounts: ${cats.map((ct, n) => `${ct} ${fmt(+amts[n].toFixed(2))}`).join(', ')}.` });
    const c5 = r.int(1, 4);
    let Z = 2, share = 0;
    for (const z of r.shuffle([2, 4, 5, 6, 10])) { Z = z; share = (((T * pcts[c5]) / 100 + z) / (T + z)) * 100; if (!nearHalf(share)) break; }
    qs.push({ type: 'ne', difficulty: 5, stem: `If an additional $${Z} million were added to the budget and all of it went to ${cats[c5]}, what percent of the new total budget would ${cats[c5]} receive? Give your answer to the nearest whole percent.`,
      answer: { value: Math.round(share) }, tol: nearHalf(share) ? 0.6 : undefined,
      explain: `${cats[c5]} would get ${fmt((T * pcts[c5]) / 100)} + ${Z} = ${fmt((T * pcts[c5]) / 100 + Z)} million out of ${T + Z} million: ${share.toFixed(2)}% \u2248 ${Math.round(share)}%.` });
    return { title: 'Graph', html, qs };
  },
};

/** Generate a Data Interpretation set: 5 questions (difficulty 1-5) sharing one table/graph; a test uses the 2-3 nearest the student's level. */
export function generateDISet(seed) {
  const r = makeRng(seed);
  const kind = r.pick(Object.keys(DI_KINDS));
  const set = DI_KINDS[kind](r);
  const dataId = `di:${kind}:${seed}`;
  return set.qs.map((q, n) => ({ id: `${dataId}:${n}`, section: 'Q', topic: 'data', di: true, dataId, data: set.html, ...q }));
}
