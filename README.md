# Kopi IoT Web3 ☕⛓️

Dashboard **Web3** untuk sensor kebun kopi (NodeMCU + DHT11 + Soil Moisture):

- 📡 **Monitoring live** — membaca data sensor langsung dari ThingSpeak.
- 🔮 **Forecasting** — prediksi suhu & kelembaban 3–7 hari ke depan (regresi linear, jalan di browser).
- ⛓️ **Blockchain** — menyimpan **ringkasan harian** (rata-rata/min/max + hash) dan **snapshot forecast** ke Polygon Amoy.

> **100% gratis**: ThingSpeak (gratis) + Vercel (gratis) + Polygon Amoy testnet (gratis via faucet). Tidak menyimpan data mentah ke blockchain — hanya ringkasan & sidik jari (hash) agar hemat dan anti-palsu.

---

## Stack

| Bagian | Teknologi |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Blockchain | Polygon Amoy Testnet, ethers v6, MetaMask |
| Smart contract | `contracts/KopiIoTForecast.sol` (Solidity ^0.8.20) |
| Sumber data | ThingSpeak channel `1848413` (publik) |

---

## 1. Jalankan lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000 — monitoring & forecasting **langsung jalan** tanpa konfigurasi apa pun.
Fitur *simpan ke blockchain* baru aktif setelah langkah 2–3.

---

## 2. Deploy smart contract (GRATIS, via Remix)

1. Buka https://remix.ethereum.org
2. Buat file baru `KopiIoTForecast.sol`, salin isi dari `contracts/KopiIoTForecast.sol`.
3. Tab **Solidity Compiler** → pilih versi `0.8.20+` → **Compile**.
4. Tab **Deploy & Run**:
   - Environment: **Injected Provider - MetaMask**
   - Pastikan MetaMask berada di jaringan **Polygon Amoy** (chainId 80002).
   - Klik **Deploy**, konfirmasi di MetaMask.
5. Salin **alamat kontrak** yang muncul (0x...).

### Butuh POL gratis untuk gas?
Ambil di faucet (gratis):
- https://faucet.polygon.technology (pilih Amoy)
- https://www.alchemy.com/faucets/polygon-amoy

### Tambah jaringan Amoy ke MetaMask (jika belum)
- Network Name: `Polygon Amoy Testnet`
- RPC URL: `https://rpc-amoy.polygon.technology`
- Chain ID: `80002`
- Symbol: `POL`
- Explorer: `https://amoy.polygonscan.com`

---

## 3. Hubungkan website ke kontrak

Buka `app/lib/config.js`, isi alamat hasil deploy:

```js
export const CONTRACT_ADDRESS = '0x....' // alamat kontrak Anda
```

Simpan, refresh halaman. Peringatan kuning hilang dan tombol blockchain aktif.

> **Penting:** hanya **wallet deployer** (owner) yang boleh mencatat data. Connect dengan wallet yang sama saat deploy.

---

## 3b. Siapkan Pinata (IPFS) — penyimpanan metadata

Saat mencatat, **metadata lengkap** (statistik + data mentah harian / detail forecast) di-upload ke IPFS via Pinata, lalu **CID**-nya disimpan di blockchain. Pola hibrida ini hemat gas tapi metadata tetap kaya.

1. Buat akun gratis di [pinata.cloud](https://app.pinata.cloud).
2. **API Keys → New Key** → centang `pinJSONToIPFS` → buat → salin **API Key** & **API Secret**.
3. Salin `.env.local.example` menjadi `.env.local` dan isi:
   ```
   PINATA_API_KEY=...
   PINATA_API_SECRET=...
   PINATA_GATEWAY=gateway.pinata.cloud
   ```
4. Restart `npm run dev`. (Di Vercel: isi 3 variabel ini di **Settings → Environment Variables**.)

> Jika `PINATA_*` belum diisi, tombol simpan akan menampilkan error upload IPFS — isi dulu key-nya.

---

## 4. Cara pakai

1. **Connect Wallet** (pojok kanan atas) — pakai wallet deployer.
2. **Catat Ringkasan Harian**: pilih tanggal → *Simpan ke Blockchain*. 1 tanggal hanya bisa sekali (anti-duplikat).
3. **Catat Snapshot Forecast**: simpan prediksi terbaru (disarankan 1× seminggu).
4. Data tersimpan tampil di panel **Data On-Chain** + bisa dicek di Polygonscan.

### Ritme yang disarankan
| Aksi | Frekuensi |
|---|---|
| Ringkasan harian | 1× / hari |
| Snapshot forecast | 1× / minggu |
| Hitung forecast | otomatis tiap buka halaman (gratis) |

Forecast mulai berarti setelah **±14 hari** data, ideal **≥30 hari**.

---

## 5. Deploy ke internet (GRATIS, Vercel)

1. Push folder ini ke GitHub.
2. Buka https://vercel.com → **Import Project** → pilih repo.
3. Framework otomatis terdeteksi (Next.js) → **Deploy**.
4. Selesai — dapat URL publik gratis.

---

## Struktur

```
contracts/KopiIoTForecast.sol   Smart contract (deploy via Remix)
app/lib/config.js               Konfigurasi: ThingSpeak, Amoy, alamat & ABI kontrak
app/lib/thingspeak.js           Ambil & agregasi data sensor harian
app/lib/forecast.js             Mesin forecasting (regresi linear + damping)
app/lib/chain.js                Helper ethers (wallet, baca/tulis kontrak)
app/components/MetricChart.js   Grafik garis SVG (riwayat + prediksi)
app/page.js                     Dashboard utama
```

---

## Catatan

- **Testnet** = data untuk riset/demo, bukan aset bernilai. Bisa di-reset oleh jaringan.
- Skala on-chain: nilai disimpan integer **×100** (Solidity tanpa desimal). Frontend membagi 100 otomatis.
- Channel ThingSpeak publik; jika dijadikan privat, isi `readApiKey` di `config.js`.
