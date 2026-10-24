# Dataset Beku — Sesi Kontinu Sensor Kebun Kopi

Berkas di folder ini adalah **rekaman beku** yang dipakai seluruh analisis.
Jangan menariknya ulang dari API saat menganalisis.

## Mengapa dibekukan

ThingSpeak hanya mengembalikan **8.000 pembacaan terakhir**, dan jendela itu
bergeser. Sesi 24–29 Agustus 2026 berisi 7.992 pembacaan — hampir seluruh
jendela. Begitu sensor merekam kembali pada laju ~1.400 bacaan/hari, sesi ini
**terdorong keluar dari jendela dan tidak dapat diambil lagi**.

Membekukannya membuat setiap angka di paper dapat ditelusuri ke berkas yang
sama persis, dan membuat analisis dapat diulang oleh pihak lain.

## Isi

| Berkas | Keterangan |
|---|---|
| `sesi_20260824-20260829.csv` | 7.992 pembacaan mentah, kolom: `entry_id, waktu, suhu, udara, tanah` |
| `MANIFEST.json` | Metadata, SHA-256, dan laporan kelengkapan per resolusi |

## Identitas berkas

```
SHA-256  92025679db8c2ab50123ebe812ace209f60643cd0c229ac16aca5e1c44454690
```

Verifikasi sebelum dipakai:

```bash
# Linux/macOS
sha256sum sesi_20260824-20260829.csv

# Windows PowerShell
Get-FileHash sesi_20260824-20260829.csv -Algorithm SHA256
```

## Ciri rekaman

| Aspek | Nilai |
|---|---|
| Mulai | 2026-08-24 06:00:51 (WIB) |
| Akhir | 2026-08-29 20:15:23 (WIB) |
| Durasi | 134,24 jam (5,6 hari) |
| Jumlah pembacaan | 7.992 |
| Jeda antar pembacaan | median 1 menit |
| Kriteria sesi | jeda antar pembacaan ≤ 30 menit |

### Kelengkapan setelah penyeragaman jarak

| Resolusi | Bin | Terisi | Kelengkapan |
|---|---|---|---|
| 1 menit | 8.056 | 7.982 | 99,08% |
| 5 menit | 1.612 | 1.608 | **99,75%** |
| 10 menit | 806 | 805 | 99,88% |
| 30 menit | 269 | 269 | **100%** |
| 1 jam | 135 | 135 | **100%** |

Deret berjarak teratur dengan kelengkapan setinggi ini memenuhi syarat untuk
uji stasioneritas (ADF, KPSS), analisis autokorelasi (ACF/PACF), uji rasio
ragam, dan uji Diebold-Mariano — yang semuanya tidak terdefinisi pada deret
harian proyek ini karena terlalu banyak hari kosong.

## Sumber

Channel ThingSpeak **1848413** (publik), kebun kopi Bondowoso, Jawa Timur.
Perangkat: NodeMCU ESP8266 + DHT11 (suhu & kelembaban udara) + sensor
kelembaban tanah kapasitif.

Ketelitian DHT11 ±2 °C dan ±5 % RH merupakan batas bawah ketepatan peramalan
dan harus dinyatakan saat melaporkan hasil.

## Satuan

| Kolom | Satuan |
|---|---|
| `suhu` | °C |
| `udara` | % kelembaban relatif |
| `tanah` | % kelembaban tanah |
