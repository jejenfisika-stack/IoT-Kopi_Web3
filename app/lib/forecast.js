// ============================================================
//  Forecasting statistik (jalan 100% di browser, gratis)
// ============================================================
//  Metode: Regresi Linear (least squares) untuk menangkap tren,
//  dipadukan dengan damping ringan ke rata-rata terakhir agar
//  prediksi tidak meledak jauh saat horizon panjang.
//
//  Cocok untuk data sensor harian (suhu, kelembaban) yang tren-nya
//  halus. Menyertakan R² sebagai indikator kepercayaan tren.
// ============================================================

// Regresi linear sederhana atas pasangan (x, y).
export function regresiLinear(ys) {
  const n = ys.length
  if (n < 2) return null
  const xs = ys.map((_, i) => i)
  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumY = ys.reduce((a, b) => a + b, 0)
  const meanX = sumX / n
  const meanY = sumY / n

  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY)
    den += (xs[i] - meanX) ** 2
  }
  const slope = den === 0 ? 0 : num / den
  const intercept = meanY - slope * meanX

  // R² (koefisien determinasi)
  let ssTot = 0, ssRes = 0
  for (let i = 0; i < n; i++) {
    const pred = slope * xs[i] + intercept
    ssTot += (ys[i] - meanY) ** 2
    ssRes += (ys[i] - pred) ** 2
  }
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot)

  return { slope, intercept, r2, n, meanY }
}

// Prediksi `horizon` langkah ke depan untuk satu seri nilai harian.
// `clamp` membatasi hasil ke rentang masuk akal (mis. kelembaban 0–100).
export function forecastSeri(ys, horizon, clamp) {
  const model = regresiLinear(ys)
  if (!model) {
    // Data terlalu sedikit -> ulangi nilai terakhir.
    const last = ys.length ? ys[ys.length - 1] : 0
    return { prediksi: Array(horizon).fill(last), r2: 0, slope: 0, cukupData: false }
  }

  const { slope, intercept: b0, r2, n, meanY } = model
  const intercept = b0
  const prediksi = []
  for (let h = 1; h <= horizon; h++) {
    const x = n - 1 + h
    let nilai = slope * x + intercept
    // Damping: makin jauh horizon, makin ditarik ke rata-rata terakhir
    // supaya tren linear tidak meledak tak realistis.
    const w = Math.min(1, (h - 1) * 0.12)
    nilai = nilai * (1 - w) + meanY * w
    if (clamp) nilai = Math.min(clamp[1], Math.max(clamp[0], nilai))
    prediksi.push(nilai)
  }
  return { prediksi, r2, slope, intercept, cukupData: n >= 7 }
}

// Forecast lengkap untuk ketiga parameter dari agregasi harian.
// `harian` = output agregasiHarian (sudah terurut naik).
export function forecastSemua(harian, horizon = 7) {
  const suhu  = harian.map(d => d.suhu?.avg).filter(Number.isFinite)
  const udara = harian.map(d => d.udara?.avg).filter(Number.isFinite)
  const tanah = harian.map(d => d.tanah?.avg).filter(Number.isFinite)

  const fSuhu  = forecastSeri(suhu,  horizon, [0, 60])
  const fUdara = forecastSeri(udara, horizon, [0, 100])
  const fTanah = forecastSeri(tanah, horizon, [0, 100])

  // Tanggal-tanggal prediksi (lanjutan dari tanggal terakhir).
  // Format manual dari komponen lokal — hindari toISOString() yang
  // bisa menggeser tanggal akibat konversi ke UTC.
  const tanggalPrediksi = []
  if (harian.length) {
    const last = harian[harian.length - 1].tanggal // 'YYYY-MM-DD'
    const base = new Date(last + 'T00:00:00')
    const pad = n => String(n).padStart(2, '0')
    for (let h = 1; h <= horizon; h++) {
      const d = new Date(base)
      d.setDate(d.getDate() + h)
      tanggalPrediksi.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
    }
  }

  return {
    horizon,
    tanggalPrediksi,
    suhu:  fSuhu,
    udara: fUdara,
    tanah: fTanah,
    jumlahHariRiwayat: harian.length,
    metode: 'Linear Regression + Damping',
  }
}

// Label kepercayaan dari R².
export function labelKepercayaan(r2) {
  if (r2 >= 0.7) return { teks: 'Tinggi',  warna: '#22C55E' }
  if (r2 >= 0.4) return { teks: 'Sedang',  warna: '#EAB308' }
  return { teks: 'Rendah', warna: '#EF4444' }
}
