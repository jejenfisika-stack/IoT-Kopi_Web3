'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ambilHarianAvg } from '../lib/thingspeak'

const VARS = [
  { key: 'suhu', label: 'Suhu', unit: '°C', warna: '#fb7185' },
  { key: 'udara', label: 'Kelembaban Udara', unit: '%', warna: '#38bdf8' },
  { key: 'tanah', label: 'Kelembaban Tanah', unit: '%', warna: '#4ade80' },
]
const mae = (a, b) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / a.length

export default function Lab() {
  const [harian, setHarian] = useState([])
  const [loadErr, setLoadErr] = useState('')
  // sandbox params
  const [vr, setVr]         = useState('suhu')
  const [W, setW]           = useState(7)
  const [hidden, setHidden] = useState(16)
  const [layers2, setLayers2] = useState(false) // jadi DNN (2 hidden layer)
  const [epochs, setEpochs] = useState(60)
  const [lr, setLr]         = useState(0.01)
  // training state
  const [latih, setLatih]   = useState(false)
  const [riwayat, setRiwayat] = useState([]) // {ep, loss, val}
  const [hasil, setHasil]   = useState(null)
  const [pesan, setPesan]   = useState('')
  const batal = useRef(false)

  useEffect(() => {
    ambilHarianAvg({ days: 1500 })
      .then(({ harian }) => setHarian(harian))
      .catch(e => setLoadErr(e.message))
  }, [])

  const meta = VARS.find(v => v.key === vr)
  const seri = harian.map(d => d[vr]).filter(Number.isFinite)

  async function jalankan() {
    if (seri.length < W + 12) { alert('Data harian belum cukup untuk pelatihan.'); return }
    setLatih(true); setRiwayat([]); setHasil(null); setPesan(''); batal.current = false
    try {
      const tf = await import('@tensorflow/tfjs')   // lazy-load
      // Paksa backend CPU: model kecil → cepat, dan andal di semua perangkat
      // (WebGL kadang tak tersedia / bermasalah, mis. di sebagian browser/headless).
      try { await tf.setBackend('cpu'); await tf.ready() } catch {}
      // ── Windowing ──
      const K = 10
      const X = [], y = []
      for (let i = 0; i < seri.length - W; i++) { X.push(seri.slice(i, i + W)); y.push(seri[i + W]) }
      const Xtr = X.slice(0, -K), ytr = y.slice(0, -K)
      const Xte = X.slice(-K),   yte = y.slice(-K)
      // ── Normalisasi (statistik train) ──
      const flat = Xtr.flat(); const mn = Math.min(...flat), mx = Math.max(...flat)
      const nz = a => (a - mn) / (mx - mn + 1e-9), dz = a => a * (mx - mn + 1e-9) + mn
      const xs = tf.tensor2d(Xtr.map(w => w.map(nz)))
      const ys = tf.tensor2d(ytr.map(v => [nz(v)]))
      // ── Model (ANN / DNN) ──
      const model = tf.sequential()
      model.add(tf.layers.dense({ units: hidden, activation: 'relu', inputShape: [W] }))
      if (layers2) model.add(tf.layers.dense({ units: Math.max(4, Math.round(hidden / 2)), activation: 'relu' }))
      model.add(tf.layers.dense({ units: 1 }))
      model.compile({ optimizer: tf.train.adam(lr), loss: 'meanSquaredError', metrics: ['mae'] })
      // ── Latih dengan kurva loss live ──
      // yieldEvery:'never' → hindari yield internal tfjs (pakai requestAnimationFrame
      // yang tak jalan di tab background). Kita yield manual via setTimeout agar UI live.
      await model.fit(xs, ys, {
        epochs, batchSize: 8, validationSplit: 0.2, shuffle: true, yieldEvery: 'never',
        callbacks: {
          onEpochEnd: async (ep, logs) => {
            setRiwayat(prev => [...prev, { ep: ep + 1, loss: logs.loss, val: logs.val_loss ?? logs.loss }])
            await new Promise(res => setTimeout(res, 0))
            if (batal.current) model.stopTraining = true
          },
        },
      })
      // ── Evaluasi holdout (one-step, lag aktual) + baseline Naive ──
      const xte = tf.tensor2d(Xte.map(w => w.map(nz)))
      const pAnn = Array.from(model.predict(xte).dataSync()).map(dz)
      const pNaive = Xte.map(w => w[w.length - 1])
      setHasil({
        maeAnn: mae(yte, pAnn), maeNaive: mae(yte, pNaive),
        aktual: yte, ann: pAnn, naive: pNaive,
        tglUji: harian.slice(-K).map(d => d.tanggal),
      })
      xs.dispose(); ys.dispose(); xte.dispose(); model.dispose()
    } catch (e) {
      console.error('Lab train error:', e)
      setPesan('Gagal melatih: ' + (e?.message || e))
    } finally {
      setLatih(false)
    }
  }

  return (
    <>
      <div className="bg-fx" aria-hidden="true"><div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" /></div>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="chip px-3 py-1.5 text-xs font-bold text-gray-200 transition hover:text-white">← Dashboard</Link>
          <Link href="/belajar" className="chip px-3 py-1.5 text-xs font-bold text-emerald-300 transition hover:text-emerald-200">📚 Belajar</Link>
        </header>

        <section className="mb-8 text-center">
          <div className="chip mx-auto mb-4 inline-flex items-center gap-2 px-4 py-1.5 text-[11px] text-gray-300">🧪 Lab AI · TensorFlow.js</div>
          <h1 className="display text-3xl font-bold text-white sm:text-4xl">
            Latih <span className="grad-emerald">Jaringan Saraf (ANN)</span> di Browser
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-400">
            Ubah parameter (sandbox), klik <b className="text-gray-200">Latih</b>, dan amati <b className="text-gray-200">kurva loss</b> turun
            secara langsung — neural network benar-benar belajar di perangkat Anda. Bandingkan dengan baseline Naive.
          </p>
          {loadErr && <div className="mt-3 text-xs text-red-300">Gagal memuat data: {loadErr}</div>}
        </section>

        {/* Sandbox parameter */}
        <section className="mb-6 glass p-5">
          <div className="mb-3 text-sm font-bold text-white">🎚️ Parameter (Sandbox)</div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Variabel">
              <select value={vr} onChange={e => setVr(e.target.value)} disabled={latih}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-gray-200 outline-none">
                {VARS.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
              </select>
            </Field>
            <Slider label={`Window (hari): ${W}`} min={3} max={14} value={W} set={setW} disabled={latih} />
            <Slider label={`Hidden units: ${hidden}`} min={4} max={64} step={4} value={hidden} set={setHidden} disabled={latih} />
            <Slider label={`Epoch: ${epochs}`} min={20} max={300} step={10} value={epochs} set={setEpochs} disabled={latih} />
            <Slider label={`Learning rate: ${lr}`} min={0.001} max={0.1} step={0.001} value={lr} set={setLr} disabled={latih} float />
            <Field label="Arsitektur">
              <button onClick={() => setLayers2(v => !v)} disabled={latih}
                className={`w-full rounded-lg px-2 py-1.5 text-xs font-bold transition ${layers2 ? 'btn-violet' : 'chip text-gray-300'}`}>
                {layers2 ? 'DNN (2 hidden)' : 'ANN (1 hidden)'}
              </button>
            </Field>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={jalankan} disabled={latih || seri.length < W + 12} className="btn-primary rounded-xl px-5 py-2.5 text-sm">
              {latih ? `Melatih… (epoch ${riwayat.length}/${epochs})` : '▶ Latih jaringan'}
            </button>
            {latih && <button onClick={() => { batal.current = true }} className="chip px-3 py-2 text-xs font-bold text-rose-300">Hentikan</button>}
            <span className="text-xs text-gray-500">{seri.length} hari data ({meta.label})</span>
          </div>
          {pesan && <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{pesan}</div>}
        </section>

        {/* Kurva loss */}
        {riwayat.length > 0 && (
          <section className="mb-6 glass p-5">
            <div className="mb-1 flex items-center justify-between">
              <div className="text-sm font-bold text-white">📉 Kurva Loss (MSE) — live</div>
              <div className="flex gap-3 text-[11px] text-gray-400">
                <span className="flex items-center gap-1"><span className="inline-block h-[2px] w-4 bg-emerald-400" />train</span>
                <span className="flex items-center gap-1"><span className="inline-block h-[2px] w-4 bg-amber-400" />val</span>
              </div>
            </div>
            <LossCurve data={riwayat} />
            <p className="mt-1 text-[11px] text-gray-500">Loss turun = jaringan belajar. Bila garis val (kuning) naik sementara train (hijau) terus turun → <b>overfitting</b>.</p>
          </section>
        )}

        {/* Hasil */}
        {hasil && (
          <section className="mb-6 glass p-5">
            <div className="mb-3 text-sm font-bold text-white">📊 Hasil di data uji ({hasil.aktual.length} hari)</div>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <Metric label={`MAE ${layers2 ? 'DNN' : 'ANN'}`} val={hasil.maeAnn.toFixed(3)} warna={meta.warna}
                badge={hasil.maeAnn <= hasil.maeNaive ? '🏆 lebih baik' : 'kalah dari Naive'} />
              <Metric label="MAE Naive (baseline)" val={hasil.maeNaive.toFixed(3)} warna="#9ca3af" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wide text-gray-500"><th className="py-1">Tanggal</th><th>Aktual</th><th>{layers2 ? 'DNN' : 'ANN'}</th><th>Naive</th></tr></thead>
                <tbody>
                  {hasil.tglUji.map((t, i) => (
                    <tr key={t} className="border-t border-white/5">
                      <td className="py-1 text-gray-300">{t}</td>
                      <td className="mono text-gray-100">{hasil.aktual[i].toFixed(1)}</td>
                      <td className="mono" style={{ color: meta.warna }}>{hasil.ann[i].toFixed(1)}</td>
                      <td className="mono text-gray-400">{hasil.naive[i].toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              💡 Coba ubah parameter dan latih lagi. Sering kali pada data sedikit, <b>Naive sulit dikalahkan</b> — bukti penting bahwa
              kompleksitas model harus sepadan dengan jumlah & sifat data.
            </p>
          </section>
        )}

        <footer className="mt-10 border-t border-white/5 pt-6 text-center text-xs text-gray-500">
          Lab AI · TensorFlow.js berjalan di browser Anda ·{' '}
          <Link href="/belajar" className="text-gray-400 underline hover:text-white">Mode Belajar</Link>
        </footer>
      </main>
    </>
  )
}

function LossCurve({ data }) {
  const W = 520, H = 200, PAD = 36
  const all = data.flatMap(d => [d.loss, d.val]).filter(Number.isFinite)
  let mn = Math.min(...all), mx = Math.max(...all)
  if (!Number.isFinite(mn) || mn === mx) { mn = 0; mx = (mx || 1) + 1e-6 }
  const n = data.length
  const x = i => PAD + (i * (W - PAD * 2)) / Math.max(1, n - 1)
  const y = v => H - PAD - ((v - mn) / (mx - mn)) * (H - PAD * 2)
  const line = key => data.map((d, i) => `${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 0.5, 1].map((t, i) => {
        const yy = PAD + t * (H - PAD * 2), v = mx - t * (mx - mn)
        return <g key={i}><line x1={PAD} y1={yy} x2={W - PAD} y2={yy} stroke="rgba(255,255,255,0.07)" /><text x={4} y={yy + 3} fontSize="9" fill="#6b7280" className="mono">{v.toFixed(3)}</text></g>
      })}
      <polyline points={line('val')} fill="none" stroke="#f59e0b" strokeWidth="2" />
      <polyline points={line('loss')} fill="none" stroke="#4ade80" strokeWidth="2.5" />
    </svg>
  )
}

function Field({ label, children }) {
  return <div><div className="mb-1 text-[11px] font-semibold text-gray-400">{label}</div>{children}</div>
}
function Slider({ label, min, max, step = 1, value, set, disabled, float }) {
  return (
    <Field label={label}>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled}
        onChange={e => set(float ? parseFloat(e.target.value) : parseInt(e.target.value))}
        className="w-full accent-emerald-400" />
    </Field>
  )
}
function Metric({ label, val, warna, badge }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
      <div className="display text-2xl font-bold" style={{ color: warna }}>{val}</div>
      {badge && <div className="mt-0.5 text-[11px] text-gray-400">{badge}</div>}
    </div>
  )
}
