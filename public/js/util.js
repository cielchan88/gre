// Small shared helpers (pure, no DOM) so they can be unit-tested in Node.

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed) {
  const f = mulberry32(seed);
  return {
    f,
    int: (a, b) => a + Math.floor(f() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(f() * arr.length)],
    chance: (p) => f() < p,
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(f() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}

export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

export function fmt(n) {
  if (Number.isInteger(n)) return String(n).replace('-', '−');
  return String(+n.toFixed(4)).replace('-', '−');
}
export const money = (n) => '$' + (Number.isInteger(n) ? n.toLocaleString('en-US') : n.toFixed(2));
export const frac = (n, d) => `<span class="frac"><span>${n}</span><span>${d}</span></span>`;
export const sup = (b, e) => `${b}<sup>${e}</sup>`;
export const signed = (n) => (n < 0 ? ` − ${-n}` : ` + ${n}`);

/** Numeric multiple-choice: correct value + candidate distractors -> ascending options. */
export function numChoices(r, correct, cands, f = fmt, count = 5) {
  const seen = new Set([correct]);
  const pool = [];
  for (const c of cands) {
    if (Number.isFinite(c) && !seen.has(c)) { seen.add(c); pool.push(c); }
  }
  let picks = r.shuffle(pool).slice(0, count - 1);
  let k = 1;
  while (picks.length < count - 1) {
    for (const c of [correct + k, correct - k]) {
      if (picks.length < count - 1 && !seen.has(c)) { seen.add(c); picks.push(c); }
    }
    k++;
  }
  const all = [correct, ...picks].sort((a, b) => a - b);
  return { options: all.map(f), answer: all.indexOf(correct) };
}

/** Text multiple-choice: shuffled. */
export function textChoices(r, correct, distractors, count = 5) {
  const uniq = [...new Set(distractors)].filter((d) => d !== correct);
  const picks = r.shuffle(uniq).slice(0, count - 1);
  const all = r.shuffle([correct, ...picks]);
  return { options: all, answer: all.indexOf(correct) };
}

export function reduceFrac(n, d) {
  const g = gcd(n, d);
  return { num: n / g, den: d / g };
}
