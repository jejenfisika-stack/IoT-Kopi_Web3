# Panduan Pemasangan — Penyimpanan Hasil Pre/Post-test ke Google Sheet

Sekali pasang saja (±10 menit). Setelah ini seluruh hasil tes mahasiswa masuk
otomatis ke Google Sheet milik Anda, lengkap dengan N-gain untuk skor total,
subskala Computational Thinking, dan subskala AI Literacy.

---

## Langkah 1 — Buat Google Sheet

1. Buka <https://sheets.google.com> → **Blank spreadsheet**.
2. Beri nama, misalnya **"Hasil CT & AI Literacy — Web3 Sensor Kopi"**.
3. Biarkan tabnya kosong; skrip akan membuat tab **Hasil** beserta judul kolomnya.

> ⚠️ **Jaga privasi.** Jangan pernah membagikan Sheet ini ke "Anyone with the link".
> Biarkan privat, hanya Anda yang dapat membukanya.

## Langkah 2 — Buat token rahasia

Buat kata sandi acak sepanjang ±32 karakter. Cara cepat: buka Console peramban
(F12 → Console), lalu jalankan:

```
crypto.randomUUID().replace(/-/g,'') + crypto.randomUUID().replace(/-/g,'')
```

Salin dan simpan hasilnya — inilah **token rahasia** Anda.

## Langkah 3 — Pasang skrip

1. Di Google Sheet: menu **Extensions → Apps Script**.
2. Hapus seluruh kode contoh di `Code.gs`.
3. Tempel **seluruh isi berkas `Code.gs`** dari folder ini.
4. Ganti baris `const TOKEN = 'GANTI_DENGAN_TOKEN_RAHASIA_ANDA';` dengan token dari Langkah 2.
5. Klik **Simpan** (💾).

## Langkah 4 — Terapkan sebagai Web App

1. Klik **Deploy → New deployment**.
2. Klik ikon gerigi ⚙️ → pilih **Web app**.
3. Isi:
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
     *(wajib — yang mengakses adalah server situs, bukan mahasiswa. Keamanannya
     dijaga oleh token, bukan oleh pembatasan akses ini.)*
4. Klik **Deploy**, izinkan akses saat diminta.
5. **Salin Web app URL** yang muncul (diakhiri `/exec`).

## Langkah 5 — Pasang env var

**Untuk pengembangan lokal** — buat berkas `.env.local` di akar proyek:

```
SHEET_WEBHOOK_URL=https://script.google.com/macros/s/XXXX/exec
SHEET_WEBHOOK_TOKEN=token_rahasia_anda
```

**Untuk Vercel** — buka Project → Settings → Environment Variables, tambahkan
kedua variabel di atas, lalu **Redeploy** agar terbaca.

> Kedua nilai ini hanya dibaca di sisi server. Halaman tes memanggil
> `/api/simpan-hasil`, dan route itulah yang meneruskan ke webhook. Token tidak
> pernah sampai ke peramban mahasiswa.

## Langkah 6 — Uji

1. Buka `/tes`, isi nama dan NIM percobaan, kerjakan beberapa soal, lalu kirim.
2. Periksa Google Sheet — satu baris baru harus muncul di tab **Hasil**.
3. Kirim ulang dengan NIM yang sama dan fase yang sama; hasilnya harus ditolak
   dengan keterangan sudah pernah mengerjakan.
4. Kirim sebagai **Tes Akhir** dengan NIM yang sama; kolom **N-gain**,
   **N-gain CT**, dan **N-gain AIL** harus terisi otomatis.

Setelah uji selesai, hapus baris percobaan dari Sheet.

---

## Kolom yang tersimpan

| Kolom | Isi |
|---|---|
| Waktu, NIM, Nama, Kelas, Fase | Identitas dan jenis tes |
| Skor, Maks | Skor total dari 25 |
| CT, AIL | Skor subskala (maks 12 dan 13) |
| Dekomposisi … Generalisasi | Enam dimensi Computational Thinking (maks 2 tiap dimensi) |
| Memahami … Etika | Lima dimensi AI Literacy |
| Jawaban | Rincian tiap butir untuk analisis butir |
| Skor Pre, N-gain, Kategori | Terisi otomatis saat post-test |
| N-gain CT, N-gain AIL | N-gain terpisah tiap subskala |

Kolom **Jawaban** berisi larik `{i, j, b}` — `i` indeks butir pada bank,
`j` indeks opsi yang dipilih, `b` benar/salah. Dari kolom ini Anda dapat
menghitung tingkat kesukaran dan daya beda tiap butir.

---

## Catatan keamanan

- Token diperiksa di dua tempat: di route server dan di dalam Apps Script.
- Isian teks dinetralkan dari karakter pembuka rumus (`=`, `+`, `-`, `@`)
  supaya jawaban mahasiswa tidak pernah dieksekusi sebagai formula Sheets.
- Pembatas laju berlaku per-IP (longgar, karena satu kelas tampak sebagai satu IP)
  dan per-NIM (ketat).
- Apps Script menolak kiriman bila rincian subskala tidak konsisten dengan skor
  total, sehingga kiriman palsu yang melewati situs tetap tersaring.
