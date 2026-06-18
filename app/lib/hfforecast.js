// ============================================================
//  Ambil forecast dari Hugging Face Space (best-per-variable)
// ============================================================
import { HF_FORECAST } from './config'

// Parse respons SSE Gradio: ambil baris "data: [...]" terakhir yang valid.
function parseSSE(text) {
  const lines = text.split('\n')
  let hasil = null
  for (const line of lines) {
    const t = line.trim()
    if (!t.startsWith('data:')) continue
    const raw = t.slice(5).trim()
    if (!raw || raw === 'null') continue
    try {
      const arr = JSON.parse(raw)
      hasil = Array.isArray(arr) ? arr[0] : arr
    } catch (_) { /* abaikan baris non-JSON */ }
  }
  if (!hasil) throw new Error('Tidak ada data dari HF Space')
  return hasil
}

// Panggil endpoint Gradio (2 langkah: POST -> event_id, GET -> hasil).
export async function ambilForecastHF(horizon) {
  const base = HF_FORECAST.base.replace(/\/$/, '')
  const url = `${base}/gradio_api/call/${HF_FORECAST.endpoint}`

  const post = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [horizon] }),
  })
  if (!post.ok) throw new Error(`HF Space tidak merespons (POST ${post.status})`)
  const { event_id } = await post.json()
  if (!event_id) throw new Error('event_id tidak ditemukan dari HF Space')

  const res = await fetch(`${url}/${event_id}`)
  if (!res.ok) throw new Error(`HF Space gagal mengirim hasil (GET ${res.status})`)
  const out = parseSSE(await res.text())

  const pred = out.prediksi || []
  // Normalisasi agar bentuknya sama dengan forecast lokal (dipakai grafik & tabel).
  return {
    horizon: out.horizon ?? horizon,
    tanggalPrediksi: pred.map(p => p.tanggal),
    suhu:  { prediksi: pred.map(p => p.suhu),  r2: null },
    udara: { prediksi: pred.map(p => p.udara), r2: null },
    tanah: { prediksi: pred.map(p => p.tanah), r2: null },
    metode: 'HF Space (best-per-variable)',
    metodePer: out.metode || {},
    lastDate: out.last_date || null,
    sumber: 'hf',
  }
}
