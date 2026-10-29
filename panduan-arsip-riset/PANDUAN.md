# Panduan Penambatan Arsip Riset lewat Remix

Menambatkan sidik jari berkas paper ke Polygon Amoy, seluruhnya lewat peramban.
Tidak ada yang perlu dipasang di komputer.

**Waktu:** sekitar 45 menit, termasuk menunggu faucet.
**Biaya:** nol rupiah. Rinciannya di bagian terakhir.

---

## Yang akan terjadi

Bapak menyebar satu kontrak kecil bernama `ArsipRiset`, lalu memanggilnya dua
kali — sekali untuk dataset, sekali untuk arsip hasil. Setiap panggilan
menghasilkan satu kode transaksi, dan dua kode itulah yang masuk ke §5 naskah.

Kontrak lama `KopiIoTForecast` tidak disentuh sama sekali. Ia tetap di alamatnya,
tetap melayani aplikasi Web3, dan semua ringkasan harian yang sudah tercatat
tetap ada.

---

## Langkah 0 — Siapkan dompet

1. Buka MetaMask, pastikan jaringannya **Polygon Amoy**. Kalau belum ada,
   tambahkan lewat tombol "Add network" di aplikasi Web3 Bapak sendiri, atau
   isi manual: Chain ID `80002`, RPC `https://polygon-amoy-bor-rpc.publicnode.com`,
   simbol `POL`, penjelajah `https://amoy.polygonscan.com`.

2. **Pakai akun yang sama dengan pemilik sensor** kalau Bapak ingin kedua
   kontrak dimiliki alamat yang sama. Tidak wajib, tapi lebih rapi untuk
   dijelaskan di paper.

3. Ambil POL uji dari faucet: <https://faucet.polygon.technology> — pilih
   jaringan Amoy, tempel alamat dompet, kirim. Biasanya tiba dalam satu menit.
   Butuh sekitar 0,02 POL; faucet memberi jauh lebih banyak.

> Kalau faucet menolak karena dompet baru, coba
> <https://www.alchemy.com/faucets/polygon-amoy>. Keduanya gratis.

---

## Langkah 1 — Buka Remix dan muat kontrak

1. Buka <https://remix.ethereum.org>. Tidak perlu mendaftar.

2. Di panel kiri (ikon berkas), klik kanan folder `contracts` → **New File** →
   beri nama `ArsipRiset.sol`.

3. Buka berkas [`contracts/ArsipRiset.sol`](../contracts/ArsipRiset.sol) dari
   proyek ini, salin **seluruh** isinya, tempel ke Remix.

---

## Langkah 2 — Kompilasi

1. Klik ikon **Solidity Compiler** (lambang huruf S di bilah kiri).
2. Pilih versi compiler **0.8.26** atau yang lebih baru.
3. Klik **Compile ArsipRiset.sol**.

Yang benar: muncul centang hijau, tanpa pesan merah. Kontrak ini sudah saya
kompilasi dengan solc 0.8.26 — **0 galat, 0 peringatan**, ukuran 3.390 byte —
lalu dijalankan di EVM lokal dan diuji **20 pemeriksaan, seluruhnya lulus**:
penjaga panjang hash, penolakan label kosong, anti-duplikat, pembatasan hak
tulis, serta pembacaan `getArsip` dan `cocok`. Kalau Bapak melihat galat,
kemungkinan besar penyalinannya terpotong.

---

## Langkah 3 — Uji dulu di VM, jangan langsung ke Amoy

**Jangan lewati langkah ini.** Sidik jari yang salah ketik tidak bisa dicabut
setelah masuk blockchain. Di sini Bapak boleh salah sebanyak-banyaknya.

1. Klik ikon **Deploy & Run Transactions**.
2. Pada **ENVIRONMENT**, pilih **Remix VM (Cancun)** — ini blockchain pura-pura
   di dalam peramban. Gratis, instan, tidak menyentuh jaringan nyata.
3. Klik **Deploy** (tombol oranye).
4. Kontrak muncul di bawah, di bagian **Deployed Contracts**. Klik panah untuk
   membukanya.

Sekarang coba empat hal ini, untuk memastikan penjaganya bekerja:

| Coba | Isi | Yang seharusnya terjadi |
|---|---|---|
| `tambatkan` dengan hash pendek | label `uji`, sha256Hex `abc`, cid kosong, catatan kosong | **ditolak**: "SHA-256 harus tepat 64 karakter" |
| `tambatkan` dengan hash benar | label `uji`, sha256Hex 64 karakter apa saja | berhasil, mengembalikan id `0` |
| `tambatkan` lagi hash yang sama | sama persis | **ditolak**: "Sidik jari ini sudah ditambatkan" |
| `getArsip` dengan `0` | — | menampilkan isi arsip tadi |

Kalau keempatnya berperilaku begitu, kontraknya sehat. Buang saja hasil uji ini;
Remix VM hilang sendiri saat halaman ditutup.

---

## Langkah 4 — Sebar ke Amoy

1. Pada **ENVIRONMENT**, ganti ke **Injected Provider - MetaMask**.
2. MetaMask meminta izin sambung — setujui. Pastikan yang tampil
   **Polygon Amoy (80002)**, bukan jaringan lain.
3. Klik **Deploy**. MetaMask memunculkan konfirmasi; periksa bahwa biayanya POL
   uji, lalu **Confirm**.
4. Tunggu beberapa detik. Di panel bawah Remix muncul tautan transaksi.

**Catat alamat kontraknya.** Ada di bagian "Deployed Contracts", berbentuk
`0x…`. Kirimkan ke saya — alamat ini menggantikan alamat lama di §5 naskah.

---

## Langkah 5 — Tambatkan dua sidik jari

Buka kontrak yang baru tersebar, isi `tambatkan` dua kali.

### Penambatan pertama — dataset

| Kolom | Isi |
|---|---|
| `label` | `dataset-sesi-20260824-20260829` |
| `sha256Hex` | `92025679db8c2ab50123ebe812ace209f60643cd0c229ac16aca5e1c44454690` |
| `cid` | CID IPFS dataset, atau kosongkan dengan `""` |
| `catatan` | `Diagnose Before You Train - dataset beku 7992 bacaan` |

### Penambatan kedua — arsip hasil

| Kolom | Isi |
|---|---|
| `label` | `hasil-fase2` |
| `sha256Hex` | `4d14324ef2218c1e8d71d545e32e2d54d300e2f6afccbc9bdb2bfa3f0d1028b7` |
| `cid` | CID IPFS arsip, atau `""` |
| `catatan` | `Diagnose Before You Train - keluaran numerik Fase 2` |

> Arsipnya ada di [`arsip-hasil/hasil_fase2.zip`](../arsip-hasil/hasil_fase2.zip),
> dibangun deterministik oleh `arsip-hasil/bangun_arsip.py`. Bapak boleh
> memeriksa sendiri sidik jarinya sebelum menambat:
> ```
> certutil -hashfile arsip-hasil\hasil_fase2.zip SHA256
> ```
> Hasilnya harus sama dengan nilai di tabel atas. Kalau Bapak menjalankan ulang
> `bangun_arsip.py`, sidik jarinya juga tetap sama — stempel waktunya dipaku,
> jadi tidak ikut berubah menurut jam pembangunan.

Setelah tiap panggilan, MetaMask minta konfirmasi. **Salin kode transaksinya**
(`0x…`, 66 karakter) dari panel Remix atau dari riwayat MetaMask.

---

## Langkah 6 — Periksa seperti penelaah

Buka `https://amoy.polygonscan.com/address/ALAMAT_KONTRAK_BAPAK`.

1. Tab **Transactions** — harus ada tiga: satu deploy, dua tambatkan.
2. Tab **Contract → Read Contract → `cocok`** — tempel sidik jari dataset,
   klik Query. Jawabannya harus `true`.
3. Tab **Read Contract → `getArsip`** dengan `0` — isinya terbaca lengkap.

Kalau ketiganya benar, penelaah mana pun bisa melakukan hal yang sama.

---

## Langkah 7 — Kirimkan ke saya

Tiga hal:

1. Alamat kontrak `ArsipRiset`
2. Kode transaksi penambatan dataset
3. Kode transaksi penambatan arsip hasil

Saya pasang ke §5 menggantikan penanda `[TX … menunggu Fase 5]`, lalu naskahnya
bersih.

---

## Apakah semuanya gratis?

Ya, untuk seluruh bagian teknis.

| Komponen | Status |
|---|---|
| Polygon Amoy (gas) | gratis, POL uji dari faucet |
| MetaMask | gratis |
| Remix | gratis, tanpa akun |
| GitHub | gratis |
| ThingSpeak | gratis untuk kanal publik |
| Google Colab | gratis |
| Overleaf | gratis untuk proyek tunggal |
| Vercel | gratis untuk paket hobi |
| Pinata / IPFS | gratis sampai 1 GB; berkas kita di bawah 1 MB |

Gas yang benar-benar terpakai, diukur dari uji di EVM lokal:

| Transaksi | Gas |
|---|---|
| Deploy kontrak | 775.216 |
| Penambatan pertama | 232.388 |
| Penambatan kedua | 194.582 |

Seluruhnya dibayar dengan POL uji dari faucet, jadi nilainya nol rupiah.

**Tetapi ada satu biaya di luar sisi teknis, dan jumlahnya tidak kecil.**
Jurnal sasaran SOIC memungut Article Publication Charge sebesar **2.500 CNY per
naskah yang diproses** (sekitar Rp 5,5–6 juta), ditambah 100 CNY per penulis bila
lebih dari empat orang. Ada pula biaya opsional yang tidak perlu diambil:
fast-track 800 CNY dan bantuan format 100 CNY per halaman.

Jadi proyeknya gratis, penerbitannya tidak. Kalau syarat bebas biaya berlaku
sampai ke penerbitan, jurnal sasarannya perlu ditinjau ulang — ada jurnal
terindeks yang tidak memungut APC sama sekali.

---

## Kalau ada yang tidak beres

| Gejala | Sebab yang paling sering |
|---|---|
| "insufficient funds" | POL uji belum masuk; tunggu atau ulangi faucet |
| Deploy tidak muncul di MetaMask | ENVIRONMENT masih "Remix VM"; ganti ke Injected Provider |
| "Hanya pemilik arsip yang boleh menambat" | akun MetaMask berbeda dari yang menyebar kontrak; ganti akun |
| "SHA-256 harus tepat 64 karakter" | ada spasi atau awalan `0x` ikut tersalin |
| Transaksi menggantung lama | RPC Amoy sedang lambat; tunggu, jangan kirim ulang |
