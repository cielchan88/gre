// Test-taking techniques shown after a practice question (explained in our own words).
export const STRATEGIES = {
  plug: { name: 'Plugging In', tip: 'Ganti variabel dengan angka sederhana (mis. 2, 3, 10) lalu uji setiap pilihan. Di Quantitative Comparison, coba juga 0, 1, angka negatif, dan pecahan; jika dua angka memberi hasil berbeda, jawabannya (D).' },
  pita: { name: 'Plug In the Answers', tip: 'Jika pilihan berupa angka dan soal bertanya “berapa”, masukkan pilihan ke soal. Mulai dari nilai tengah, lalu naik atau turun sesuai hasilnya.' },
  ballpark: { name: 'Ballparking', tip: 'Bulatkan angka dan perkirakan dulu. Eliminasi pilihan yang mustahil (terlalu besar, negatif, pecahan untuk jumlah orang) sebelum menghitung.' },
  compare: { name: 'Bandingkan, jangan hitung', tip: 'Di Quantitative Comparison kamu hanya perlu tahu mana yang lebih besar. Hilangkan bagian yang sama di kedua kolom dan sederhanakan; perhitungan panjang hampir selalu tanda ada jalan pintas.' },
  trap: { name: 'Waspadai jawaban jebakan', tip: 'Pada soal sulit, pilihan yang “terlalu mudah” (rata-rata biasa untuk kecepatan rata-rata, angka yang muncul langsung di soal) sering adalah jebakan. Cek ulang sebelum memilih.' },
  di: { name: 'Data Interpretation', tip: 'Baca judul, satuan, skala, dan catatan grafik sebelum menjawab. Untuk soal “approximately”, bulatkan; untuk persentase, pastikan nilai awalnya benar.' },
  tc: { name: 'Text Completion', tip: 'Tutup dulu pilihan jawaban. Cari petunjuk (clue) dan kata penanda arah (although, despite = berlawanan; thus, because = searah), isi blank dengan kata sendiri, baru cocokkan. Untuk banyak blank, kerjakan blank yang paling mudah dulu.' },
  se: { name: 'Sentence Equivalence', tip: 'Tentukan dulu kata yang dibutuhkan kalimat, lalu cari DUA pilihan yang sama-sama cocok dan menghasilkan arti sama. Dua sinonim yang tidak cocok konteks adalah jebakan.' },
  rc: { name: 'Reading Comprehension', tip: 'Jawaban yang benar harus didukung teks. Eliminasi pilihan yang terlalu ekstrem (always, never, all), yang benar tapi tidak menjawab pertanyaan, dan yang memakai kata-kata dari bacaan untuk ide yang berbeda.' },
  poe: { name: 'Process of Elimination', tip: 'Coret pilihan yang pasti salah (✗), tandai yang mungkin (~), lalu bandingkan sisanya. Tidak ada pengurangan nilai untuk jawaban salah, jadi jangan biarkan soal kosong.' },
};

const PLUG_GENS = new Set(['ineq_mcn', 'digit_reverse']);
const PITA_GENS = new Set(['linear_eq', 'system', 'quad_roots', 'consecutive', 'ratio_min']);
const TRAP_GENS = new Set(['rate_dist', 'pct_chain', 'meet_before', 'markup']);

/** Pick the technique most useful for a question. */
export function strategyFor(q) {
  if (q.strategy) return STRATEGIES[q.strategy];
  if (q.section === 'V') return STRATEGIES[q.type === 'tc' ? 'tc' : q.type === 'se' ? 'se' : 'rc'];
  if (q.data || q.table) return STRATEGIES.di;
  if (q.gen && PLUG_GENS.has(q.gen)) return STRATEGIES.plug;
  if (q.gen && PITA_GENS.has(q.gen)) return STRATEGIES.pita;
  if (q.gen && TRAP_GENS.has(q.gen) && q.difficulty >= 3) return STRATEGIES.trap;
  if (q.type === 'qc') return /\b[a-z]\b/.test(`${q.info || ''} ${q.qa} ${q.qb}`.replace(/<[^>]+>/g, '')) ? STRATEGIES.plug : STRATEGIES.compare;
  if (q.type === 'mcn') return STRATEGIES.poe;
  if (q.type === 'mc1' && q.topic === 'algebra') return STRATEGIES.pita;
  return STRATEGIES.ballpark;
}
