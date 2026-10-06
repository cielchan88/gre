# GRE Practice Lab

Latihan GRE adaptif: **modul harian** (20 soal, adaptif per soal) dan **mock test penuh** setiap 5 modul harian
(format GRE: Analytical Writing + 2 section Verbal + 2 section Quant, adaptif per section, skor 130–170).
Jalur: 30 hari + 6 mock test. Tanpa dependensi npm (hanya Node.js ≥ 18).

## Menjalankan
```bash
npm start            # http://localhost:8888  (ubah dengan PORT=xxxx)
npm test             # validasi bank soal, generator, logika adaptif & skor
```

## Deploy di VPS (port 8888)
**Opsi A – systemd**
```bash
sudo apt install -y nodejs           # Node >= 18
sudo mkdir -p /opt/gre && sudo cp -r server.js package.json lib public /opt/gre/
sudo cp deploy/gre-practice.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now gre-practice
sudo ufw allow 8888/tcp              # bila memakai ufw
curl http://localhost:8888/healthz   # -> ok
```
**Opsi B – Docker**: `docker compose up -d --build`

Untuk HTTPS/domain, letakkan reverse proxy (Caddy/nginx) di depan `127.0.0.1:8888`.

## Penilaian esai
- **Offline (selalu aktif):** estimasi 0–6 dari fitur permukaan (panjang, paragraf, contoh, sisi lain, transisi, variasi bahasa). Tidak bisa menilai kualitas logika.
- **AI (opsional):** rubrik GRE Issue task via Claude, dengan skor, subskor, kekuatan, perbaikan, dan kesalahan bahasa. Aktifkan dengan env di server:
  `ANTHROPIC_API_KEY=sk-ant-...` (opsional `ANTHROPIC_MODEL`, `ESSAY_RATE_PER_HOUR` default 20 per IP). Untuk systemd tambahkan `Environment=ANTHROPIC_API_KEY=...` (atau `EnvironmentFile=`); untuk Docker `-e ANTHROPIC_API_KEY`.
  Esai dikirim ke server ini lalu ke Anthropic API; setiap penilaian berbiaya kecil. Tanpa key, tombol AI menampilkan pesan bahwa layanan belum dikonfigurasi.
- Dipakai di hasil mock test dan di halaman **Esai** (latihan bebas dengan 6 topik).
- Skor bukan skor resmi ETS (yang memakai e-rater + penilai manusia).

## Kosakata & interpretasi skor
- **Bank kosakata:** 344 kata GRE dalam 109 kelompok sinonim (definisi Inggris + arti Indonesia, sinonim, antonim, contoh kalimat), termasuk daftar **Top 52** (pilihan kata mengikuti artikel Kaplan; definisi, contoh, dan catatan ditulis ulang) yang diajarkan pertama dan punya dek review sendiri. Dipakai untuk: 11 kata per hari di modul harian (30 hari mencakup semua kata), review kartu (Leitner 1/3/7/14/30 hari), dan soal Text Completion / Sentence Equivalence yang dibangkitkan otomatis (pasangan sinonim jebakan diambil dari kelompok lain).
- **Skor:** persentil memakai tabel resmi ETS (*GRE Guide to the Use of Scores*, data Juli 2022–Juni 2025), termasuk rata-rata per bidang studi dan SEM. Target skor / bidang studi bisa diatur di Pengaturan.

## Cara kerja
- **Adaptif (modul harian):** level kemampuan (skala 1–5) diperbarui tiap soal dengan model Elo; benar → soal berikutnya lebih sulit, salah → lebih mudah. Soal yang pernah salah muncul lagi lebih cepat.
- **Adaptif (mock):** Section 1 menengah; skor terbobot kesulitan menentukan Section 2 (mudah/menengah/sulit) dan batas atas skor, seperti GRE asli.
- **Alur mock seperti tes asli:** esai selalu pertama, lalu Verbal/Quant dalam urutan acak tanpa jeda; layar petunjuk tiap section; tombol Quit Test / Exit Section / Review / Mark / Help / Back / Next; layar akhir section (Return / Review / Continue); Review dengan status Answered / Not Answered / Incomplete / Not Seen; jam bisa disembunyikan dan muncul lagi 5 menit terakhir; Report / Cancel Scores di akhir.
- **Susunan soal:** Text Completion di awal Verbal, lalu passage berselang Sentence Equivalence; Quantitative Comparison di awal Quant dengan set Data Interpretation (tabel / grafik batang / diagram lingkaran) di tengah.
- **Alat:** kalkulator dengan urutan operasi, kurung, memori (MR/MC/M+), CE/C, √, ±, Transfer Display, bisa digeser; editor esai dengan Cut / Paste / Undo / Redo, tanpa spell-check, dan tidak menerima tempelan teks dari luar.
- **Soal:** Text Completion (1–3 blank), Sentence Equivalence, Reading Comprehension (termasuk select-all & select-in-passage), Quantitative Comparison, Multiple Choice (1/banyak jawaban), Numeric Entry (angka/pecahan), kalkulator, Mark/Review/Back, timer.
- **Progres:** disimpan di `localStorage` browser (per browser/perangkat); ada ekspor/impor JSON di Pengaturan.

## Batasan
- Soal orisinal, bukan soal ETS. Quant dihasilkan parametrik (33 generator + 43 soal manual); Verbal: ~100 soal manual + soal TC/SE dari bank kosakata; passage RC masih 10 sehingga akan berulang. Tambahkan soal di `public/js/bank-verbal.js` dan kata di `public/js/vocab.js`.
- Skor & persentil hanyalah estimasi kasar; kalibrasi belum diuji pada peserta nyata.
- Kunci jawaban ada di kode klien (cocok untuk latihan pribadi, bukan ujian yang diawasi).
- Penilai esai offline hanya heuristik; penilai AI bisa keliru dan cenderung tidak konsisten antar-percobaan.
