---
title: Kopi IoT Prophet Forecast
emoji: 📈
colorFrom: green
colorTo: yellow
sdk: gradio
app_file: app.py
pinned: false
---

# Kopi IoT — Forecast (best-per-variable)

Hugging Face Space yang menyajikan prediksi time-series (suhu, kelembaban udara, kelembaban tanah)
untuk sensor kebun kopi. Tiap variabel memakai **model terbaiknya sendiri** (Prophet / Linear / Naive),
dipilih otomatis di Colab berdasarkan MAE terkecil.

## Isi repo
- `app.py` — aplikasi Gradio + endpoint API (ringan, tanpa Prophet)
- `requirements.txt` — dependensi (cukup gradio)
- `model_config.json` — metode terbaik tiap variabel + prediksi 14 hari (dari Colab)

> Prediksi sudah dihitung di Colab dan disimpan sebagai angka di `model_config.json`,
> jadi Space tidak perlu memuat Prophet/Stan (build ringan & stabil).
> Untuk menyegarkan prediksi dengan data baru: latih ulang di Colab lalu ganti `model_config.json`.

## API
Endpoint: `POST /gradio_api/call/predict` dengan body `{ "data": [horizon] }` (horizon = 1..14).
Mengembalikan JSON berisi prediksi per hari untuk ketiga variabel + metode yang dipakai tiap variabel.
