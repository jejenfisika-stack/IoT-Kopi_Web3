# Verifikasi Kode Sumber Kontrak di PolygonScan

Membuat kode sumber `ArsipRiset` terbaca di PolygonScan, sehingga penelaah bisa
memanggil `cocok()` langsung dari peramban tanpa menulis satu baris kode.

**Waktu:** sekitar 5 menit. **Biaya:** nol — tanpa gas, tanpa transaksi.

---

## Yang terjadi saat verifikasi

Bapak menyerahkan kode sumber Solidity ke PolygonScan. PolygonScan
**mengompilasinya sendiri**, lalu membandingkan hasilnya dengan bytecode yang
sudah ada di blockchain. Kalau sama, sumbernya ditampilkan dan tab
**Read Contract** terbuka.

Blockchain tidak disentuh sama sekali. Yang berubah hanya tampilan di
PolygonScan.

> **Verifikasi tidak pernah meminta tanda tangan dompet, seed phrase, atau
> pembayaran.** Kalau ada halaman yang memintanya, itu bukan proses verifikasi —
> hentikan saat itu juga.

---

## Parameter yang harus dipakai

Nilai-nilai ini bukan tebakan. Semuanya ditentukan dengan membandingkan bytecode
yang terpasang di Amoy terhadap hasil kompilasi ulang: kode programnya terbukti
identik, dan satu-satunya selisih adalah alamat pemilik yang disisipkan saat
deploy serta cacah metadata.

| Isian | Nilai |
|---|---|
| Alamat kontrak | `0xF1FDDaAe2E7c23f4d425Dd5F940686864fc9d39B` |
| Compiler Type | **Solidity (Single file)** |
| Compiler Version | **v0.8.34+commit.80d5c536** |
| Open Source License | **MIT** |
| Optimization | **No** |
| EVM Version | **cancun** (atau `default`) |
| Constructor Arguments | **kosongkan** — kontrak ini tanpa argumen |

Kalau versi compiler atau setelan optimasi meleset, verifikasi ditolak dan tidak
terjadi apa-apa. Tinggal ulangi dengan nilai yang benar.

---

## Langkah

### 1. Buka halaman verifikasi

<https://amoy.polygonscan.com/verifyContract>

Atau: buka alamat kontraknya, klik tab **Contract**, lalu **Verify and Publish**.

> Pakai formulir situs ini, **bukan** plugin Contract Verification di Remix.
> Plugin itu meminta API key, yang berarti harus membuat akun dengan surel.
> Formulir situs tidak memerlukan akun sama sekali.

### 2. Isi empat isian pertama

Alamat kontrak, Compiler Type, Compiler Version, dan License — sesuai tabel di
atas. Klik **Continue**.

### 3. Tempel kode sumber

Salin **seluruh isi** [`contracts/ArsipRiset.sol`](../contracts/ArsipRiset.sol)
ke kotak besar. Paling aman menyalinnya dari Remix, karena itu sumber yang
benar-benar dikompilasi saat deploy.

Periksa tempelannya utuh: 112 baris, diawali `// SPDX-License-Identifier: MIT`
dan diakhiri satu kurung kurawal tunggal.

### 4. Setel Optimization dan EVM Version

- **Optimization: No**
- **EVM Version: cancun**
- **Constructor Arguments ABI-encoded:** biarkan kosong

### 5. Kirim

Klik **Verify and Publish**, tunggu beberapa detik.

---

## Hasil yang diharapkan

Muncul pesan berhasil, lalu tab **Contract** mendapat tanda centang hijau dan
dua tab baru: **Read Contract** dan **Write Contract**.

PolygonScan mungkin menyebutnya *Similar Match* dan bukan *Exact Match*. Itu
normal dan tidak mengurangi apa pun: cacah metadata ikut merekam nama berkas
saat kompilasi, sehingga berbeda kalau nama berkasnya tidak persis sama. Kode
programnya tetap terbukti identik, dan seluruh fungsi tetap terbaca.

---

## Uji seperti penelaah

Buka tab **Read Contract**, cari `cocok`, tempel:

```
92025679db8c2ab50123ebe812ace209f60643cd0c229ac16aca5e1c44454690
```

Klik **Query**. Jawabannya harus `true`.

Coba juga `jumlahArsip` (harus `2`) dan `getArsip` dengan isian `0`.

Kalau ketiganya benar, siapa pun yang membaca paper bisa melakukan hal yang sama
hanya dengan peramban.

---

## Kalau ditolak

| Pesan | Sebab |
|---|---|
| *Unable to generate Contract ByteCode and ABI* | versi compiler salah — pastikan **v0.8.34+commit.80d5c536** |
| bytecode tidak cocok | Optimization keliru disetel **Yes**; harus **No** |
| bytecode tidak cocok, optimasi sudah benar | EVM Version — coba `cancun`, lalu `default` |
| *Invalid constructor arguments* | isian constructor harus dikosongkan |

Penolakan tidak merusak apa pun dan tidak memakai gas. Boleh diulang
sebanyak-banyaknya.

---

## Setelah berhasil

PolygonScan otomatis menerbitkan ABI kontrak di tab **Contract**. Salinan ABI
juga tersimpan di repo pada [`contracts/ArsipRiset.abi.json`](../contracts/ArsipRiset.abi.json)
untuk keperluan luring atau pemanggilan lewat program.
