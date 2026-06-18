"""
Kopi IoT Web3 — Forecast best-per-variable (Hugging Face Space, Gradio)
-----------------------------------------------------------------------
Membaca `model_config.json` (dibuat di Colab) yang sudah berisi prediksi
14 hari ke depan untuk tiap variabel + metode terbaiknya.

Space ini SENGAJA tidak memuat Prophet/numpy/pandas: semua prediksi sudah
dihitung di Colab, jadi server cukup membaca angka -> ringan & stabil.

File yang harus ada di repo Space:
  - app.py, requirements.txt, README.md
  - model_config.json
"""
import json
from datetime import datetime, timedelta
import gradio as gr

VARS = ["suhu", "udara", "tanah"]

with open("model_config.json") as f:
    CONFIG = json.load(f)


def forecast(horizon):
    maxh = int(CONFIG["info"].get("max_horizon", 14))
    horizon = max(1, min(maxh, int(horizon)))
    base = datetime.strptime(CONFIG["info"]["last_date"], "%Y-%m-%d")
    tanggal = [(base + timedelta(days=h)).strftime("%Y-%m-%d") for h in range(1, horizon + 1)]
    preds = {v: CONFIG["variabel"][v]["prediksi14"][:horizon] for v in VARS}
    return {
        "metode": {v: CONFIG["variabel"][v]["metode"] for v in VARS},
        "horizon": horizon,
        "last_date": CONFIG["info"]["last_date"],
        "prediksi": [
            {
                "tanggal": tanggal[i],
                "suhu": preds["suhu"][i],
                "udara": preds["udara"][i],
                "tanah": preds["tanah"][i],
            }
            for i in range(horizon)
        ],
    }


demo = gr.Interface(
    fn=forecast,
    inputs=gr.Slider(1, 14, value=7, step=1, label="Horizon (hari)"),
    outputs=gr.JSON(label="Hasil Forecast"),
    title="Kopi IoT — Forecast (best-per-variable)",
    description="Prediksi suhu, kelembaban udara & tanah. Tiap variabel memakai model "
                "terbaiknya (Prophet / Linear / Naive). Endpoint: /gradio_api/call/predict",
)

if __name__ == "__main__":
    demo.launch()
