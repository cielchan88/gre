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
sudo mkdir -p /opt/gre && sudo cp -r server.js package.json public /opt/gre/
sudo cp deploy/gre-practice.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now gre-practice
sudo ufw allow 8888/tcp              # bila memakai ufw
curl http://localhost:8888/healthz   # -> ok
```
**Opsi B – Docker**: `docker compose up -d --build`

Untuk HTTPS/domain, letakkan reverse proxy (Caddy/nginx) di depan `127.0.0.1:8888`.

## Cara kerja
- **Adaptif (modul harian):** level kemampuan (skala 1–5) diperbarui tiap soal dengan model Elo; benar → soal berikutnya lebih sulit, salah → lebih mudah. Soal yang pernah salah muncul lagi lebih cepat.
- **Adaptif (mock):** Section 1 menengah; skor terbobot kesulitan menentukan Section 2 (mudah/menengah/sulit) dan batas atas skor, seperti GRE asli.
- **Soal:** Text Completion (1–3 blank), Sentence Equivalence, Reading Comprehension (termasuk select-all & select-in-passage), Quantitative Comparison, Multiple Choice (1/banyak jawaban), Numeric Entry (angka/pecahan), kalkulator, Mark/Review/Back, timer.
- **Progres:** disimpan di `localStorage` browser (per browser/perangkat); ada ekspor/impor JSON di Pengaturan.

## Batasan
- Soal orisinal, bukan soal ETS. Quant dihasilkan parametrik (33 generator + 43 soal manual); Verbal ditulis manual (~100 soal, 10 passage) sehingga akan berulang di siklus akhir. Tambahkan soal di `public/js/bank-verbal.js`.
- Skor & persentil hanyalah estimasi kasar; kalibrasi belum diuji pada peserta nyata.
- Kunci jawaban ada di kode klien (cocok untuk latihan pribadi, bukan ujian yang diawasi).
- Penulisan esai tidak dinilai otomatis.
