# Forecasting Model — Prophet (Colab → Hugging Face Space)

Paket untuk melatih model **Prophet** dari data sensor dan menyajikannya sebagai API
yang dipanggil website Kopi IoT Web3.

```
ThingSpeak → [Colab: latih + backtest] → model *.json
                                              │ upload
                                              ▼
                              [HF Space: app.py Gradio] → API /forecast
                                              │
                                              ▼
                                   Website (memanggil API)
```

## Isi folder
- `Colab_Train_Prophet.ipynb` — generator `model_config.json` untuk website/HF. Memilih **best-per-variable** dari evaluasi **multi-step** (Naive, Linear recursive-lag, Prophet) → konsisten dengan analisis DL.
- `Colab_DeepLearning_Forecast.ipynb` — **deep learning** (Keras): windowing → MLP (ANN), DNN, LSTM, evaluasi **multi-step** & **multi-seed** (rata-rata ± std) → kurva Loss/MAE → bandingkan dgn Naive/Linear/Prophet (3 variabel). Untuk mengajar ANN/DNN.
- `huggingface-space/` — file untuk di-upload ke HF Space (`app.py`, `requirements.txt`, `README.md`)

## Langkah

### 1. Latih model di Colab
1. Buka [colab.research.google.com](https://colab.research.google.com) → **File → Upload notebook** → pilih `Colab_Train_Prophet.ipynb`.
2. **Runtime → Run all**. Notebook akan: ambil data ThingSpeak → bersihkan outlier → bandingkan Prophet/Naive/Linear → **pilih model terbaik per variabel** → **hitung prediksi 14 hari** → mengunduh `model_config.json` (berisi metode + prediksi) dan `metrik_backtest.json` (untuk laporan).

### 2. Buat Hugging Face Space
1. [huggingface.co](https://huggingface.co) → **New → Space** → SDK **Gradio** → buat (gratis).
2. Upload ke repo Space (total 4 file): `app.py`, `requirements.txt`, `README.md` (dari folder `huggingface-space/`) **dan** `model_config.json` hasil Colab.
3. Tunggu build (beberapa menit, Prophet agak lama saat pertama). Setelah "Running", Space online.

### 3. Sambungkan ke website
Kirim **URL Space** Anda (mis. `https://namauser-kopi-iot-forecast.hf.space`) ke asisten.
Website akan dihubungkan agar bisa memilih sumber forecast: **Statistik lokal (regresi linear)** atau **Prophet (HF Space)** — bagus untuk perbandingan akademik.

## Catatan
- Model Prophet di-serialize via `prophet.serialize` (JSON), bukan pickle — aman lintas versi.
- Semakin banyak & rutin data harian, semakin baik MAE/RMSE. Latih ulang berkala.
- Untuk skripsi: laporkan tabel MAE/RMSE (backtest) dan bandingkan dengan baseline regresi linear.
