// Official GRE score interpretation data.
// Source: ETS, "GRE Guide to the Use of Scores" (Tables 1A–1C, 3A, 4A), based on all test takers
// between July 1, 2022 and June 30, 2025. Percentile = percent of test takers scoring LOWER.
export const SOURCE = 'ETS, GRE Guide to the Use of Scores — data from test takers between 1 July 2022 and 30 June 2025';

// Scaled score 170 → 130 (index 0 = 170).
const V_PCT = [99, 99, 98, 97, 96, 95, 93, 90, 88, 85, 82, 79, 76, 72, 68, 64, 59, 54, 48, 43, 39, 34, 30, 27, 24, 21, 18, 16, 14, 11, 10, 8, 6, 5, 4, 3, 2, 2, 1, 1, 0];
const Q_PCT = [89, 85, 80, 75, 72, 67, 63, 60, 57, 53, 50, 47, 45, 42, 39, 37, 34, 31, 29, 26, 23, 21, 19, 16, 14, 12, 10, 9, 7, 6, 5, 4, 3, 2, 2, 1, 1, 1, 0, 0, 0];
export const AW_PCT = { 6: 99, 5.5: 98, 5: 93, 4.5: 85, 4: 63, 3.5: 40, 3: 16, 2.5: 7, 2: 3, 1.5: 1, 1: 1, 0.5: 0, 0: 0 };

export const STATS = {
  V: { mean: 151.39, sd: 8.43, n: 788021, sem: 3.17 },
  Q: { mean: 157.62, sd: 9.9, n: 790864, sem: 2.56 },
  AW: { mean: 3.46, sd: 0.85, n: 785720, sem: 0.4 },
};

/** Official percentile rank for a scaled Verbal/Quant score (130–170) or an AW score (0–6). */
export function percentile(section, score) {
  if (section === 'AW') return AW_PCT[Math.round(score * 2) / 2] ?? null;
  const s = Math.max(130, Math.min(170, Math.round(score)));
  return (section === 'V' ? V_PCT : Q_PCT)[170 - s];
}

/** Lowest scaled score that reaches a given percentile (e.g. what does the 75th percentile need?). */
export function scoreForPercentile(section, p) {
  const t = section === 'V' ? V_PCT : Q_PCT;
  for (let s = 130; s <= 170; s++) if (t[170 - s] >= p) return s;
  return 170;
}

/** ~68% confidence band for a reported score, from the standard error of measurement. */
export function scoreBand(section, score) {
  const sem = STATS[section].sem;
  const lo = Math.max(section === 'AW' ? 0 : 130, Math.round(score - sem));
  const hi = Math.min(section === 'AW' ? 6 : 170, Math.round(score + sem));
  return [lo, hi];
}

/** Rule-of-thumb label based on percentile (our framing; programs set their own expectations). */
export function standing(p) {
  if (p >= 90) return { label: 'Sangat kompetitif', tone: 'top' };
  if (p >= 75) return { label: 'Kompetitif', tone: 'good' };
  if (p >= 50) return { label: 'Di atas rata-rata', tone: 'ok' };
  if (p >= 25) return { label: 'Di bawah rata-rata', tone: 'low' };
  return { label: 'Perlu banyak peningkatan', tone: 'low' };
}

// Mean scores of seniors/recent graduates by intended broad graduate field (ETS Table 3A).
export const FIELDS = [
  { id: 'life', name: 'Life Sciences (biologi, kesehatan, pertanian)', V: 150, Q: 150, AW: 3.7 },
  { id: 'physical', name: 'Physical Sciences (fisika, kimia, matematika, ilmu komputer)', V: 152, Q: 162, AW: 3.4 },
  { id: 'cs', name: 'Computer & Information Sciences', V: 151, Q: 162, AW: 3.4 },
  { id: 'math', name: 'Mathematics & Statistics', V: 154, Q: 165, AW: 3.6 },
  { id: 'eng', name: 'Engineering', V: 151, Q: 160, AW: 3.4 },
  { id: 'social', name: 'Social & Behavioral Sciences', V: 154, Q: 155, AW: 3.8 },
  { id: 'econ', name: 'Social Sciences (mis. ekonomi, ilmu politik, sosiologi)', V: 155, Q: 160, AW: 3.8 },
  { id: 'psych', name: 'Psychology', V: 152, Q: 149, AW: 3.8 },
  { id: 'pubadmin', name: 'Public Administration & Social Service', V: 156, Q: 155, AW: 4.0 },
  { id: 'hum', name: 'Humanities & Arts', V: 153, Q: 160, AW: 3.4 },
  { id: 'english', name: 'English Language & Literature', V: 155, Q: 153, AW: 3.9 },
  { id: 'philo', name: 'Philosophy & Religious Studies', V: 159, Q: 156, AW: 4.2 },
  { id: 'history', name: 'History', V: 157, Q: 151, AW: 4.0 },
  { id: 'edu', name: 'Education', V: 152, Q: 150, AW: 3.7 },
  { id: 'business', name: 'Business & Management', V: 154, Q: 160, AW: 3.7 },
  { id: 'law', name: 'Law & Legal Studies', V: 154, Q: 152, AW: 3.9 },
];
export const FIELD_BY_ID = Object.fromEntries(FIELDS.map((f) => [f.id, f]));
