'use client'

import { useEffect, useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { ambilFeeds, agregasiHarian, feedsTanggal, hashHarian } from './lib/thingspeak'
import { forecastSemua, labelKepercayaan } from './lib/forecast'
import { ambilForecastHF } from './lib/hfforecast'
import { CONTRACT_ADDRESS, AMOY, PINATA_GATEWAY } from './lib/config'
import { adaKontrak, kontrakBaca, kontrakTulis, keSkala, dariSkala, gasAman, linkTx } from './lib/chain'
import MetricChart from './components/MetricChart'

const fmt = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '—')
const short = a => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '')
const linkIPFS = cid => (cid ? `https://${PINATA_GATEWAY}/ipfs/${cid}` : '')

// Upload metadata JSON ke IPFS via API route (Pinata). Kembalikan CID.
async function uploadMetadata(metadata, namaFile) {
  const res = await fetch('/api/upload-ipfs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata, namaFile }),
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Upload IPFS gagal')
  return data.cid
}

async function hashString(str) {
  const buf = new TextEncoder().encode(str)
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function tanggalCantik(num) {
  const s = String(num)
  return `${s.slice(6, 8)}/${s.slice(4, 6)}/${s.slice(0, 4)}`
}

export default function Home() {
  const [channel, setChannel]   = useState(null)
  const [feeds, setFeeds]       = useState([])
  const [harian, setHarian]     = useState([])
  const [terbaru, setTerbaru]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const [horizon, setHorizon]   = useState(7)
  const [forecast, setForecast] = useState(null)
  const [sumberFc, setSumberFc] = useState('lokal') // 'lokal' | 'hf'
  const [fcLoading, setFcLoading] = useState(false)
  const [fcError, setFcError]   = useState('')

  const [wallet, setWallet]     = useState('')
  const [tglPilih, setTglPilih] = useState('')
  const [status, setStatus]     = useState('')
  const [txHash, setTxHash]     = useState('')
  const [busy, setBusy]         = useState('')

  const [onchainRingkasan, setOnchainRingkasan] = useState([])
  const [onchainForecast, setOnchainForecast]   = useState([])

  // ── Muat data sensor dari ThingSpeak ──────────────────────
  const muatData = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const { channel, feeds } = await ambilFeeds({ results: 8000 })
      setChannel(channel)
      setFeeds(feeds)
      const agg = agregasiHarian(feeds)
      setHarian(agg)
      setTerbaru(feeds[feeds.length - 1] || null)
      if (agg.length && !tglPilih) setTglPilih(agg[agg.length - 1].tanggal)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [tglPilih])

  useEffect(() => { muatData() }, [])  // eslint-disable-line

  // ── Hitung/ambil forecast saat data/horizon/sumber berubah ─
  useEffect(() => {
    let batal = false
    async function jalan() {
      if (!harian.length) return
      setFcError('')
      if (sumberFc === 'lokal') {
        setForecast({ ...forecastSemua(harian, horizon), sumber: 'lokal' })
        return
      }
      // sumber HF
      setFcLoading(true)
      try {
        const r = await ambilForecastHF(horizon)
        if (!batal) setForecast({ ...r, jumlahHariRiwayat: harian.length })
      } catch (e) {
        if (!batal) { setFcError(e.message); setForecast({ ...forecastSemua(harian, horizon), sumber: 'lokal' }) }
      } finally {
        if (!batal) setFcLoading(false)
      }
    }
    jalan()
    return () => { batal = true }
  }, [harian, horizon, sumberFc])

  // ── Baca data on-chain ────────────────────────────────────
  const bacaOnChain = useCallback(async () => {
    if (!adaKontrak()) return
    try {
      const c = kontrakBaca()
      const [totR, totF] = await Promise.all([c.totalRingkasan(), c.totalForecast()])
      const nR = Number(totR), nF = Number(totF)

      const rPromises = []
      for (let i = Math.max(0, nR - 10); i < nR; i++) rPromises.push(c.getRingkasan(i))
      const rRes = await Promise.all(rPromises)
      setOnchainRingkasan(rRes.map(r => ({
        tanggal: Number(r.tanggal),
        suhu:  [dariSkala(r.suhuAvg),  dariSkala(r.suhuMin),  dariSkala(r.suhuMax)],
        udara: [dariSkala(r.udaraAvg), dariSkala(r.udaraMin), dariSkala(r.udaraMax)],
        tanah: [dariSkala(r.tanahAvg), dariSkala(r.tanahMin), dariSkala(r.tanahMax)],
        jumlahData: Number(r.jumlahData), dataHash: r.dataHash, metadataCID: r.metadataCID, pencatat: r.pencatat, waktu: Number(r.waktuCatat),
      })).reverse())

      const fPromises = []
      for (let i = Math.max(0, nF - 5); i < nF; i++) fPromises.push(c.getForecast(i))
      const fRes = await Promise.all(fPromises)
      setOnchainForecast(fRes.map(f => {
        const h = Number(f.horizonHari)
        const p = f.prediksi.map(dariSkala) // [suhu..., udara..., tanah...]
        return {
          tanggalBuat: Number(f.tanggalBuat), horizon: h,
          suhu: p.slice(0, h), udara: p.slice(h, h * 2), tanah: p.slice(h * 2, h * 3),
          dataHash: f.dataHash, metadataCID: f.metadataCID, waktu: Number(f.waktuCatat),
        }
      }).reverse())
    } catch (e) {
      console.warn('Baca on-chain gagal:', e.message)
    }
  }, [])

  useEffect(() => { bacaOnChain() }, [bacaOnChain])

  // ── Wallet ────────────────────────────────────────────────
  async function handleConnect() {
    if (wallet) { setWallet(''); return }
    try {
      const { address } = await kontrakTulis()
      setWallet(address)
    } catch (e) { alert(e.message) }
  }

  // ── Catat ringkasan harian ke blockchain ──────────────────
  async function catatRingkasan() {
    if (!adaKontrak()) { alert('CONTRACT_ADDRESS belum diisi. Deploy kontrak dulu (lihat README).'); return }
    const hari = harian.find(h => h.tanggal === tglPilih)
    if (!hari) { alert('Pilih tanggal yang valid.'); return }
    setBusy('ringkasan'); setStatus('Menyiapkan data...'); setTxHash('')
    try {
      const c = kontrakBaca()
      const sudah = await c.tanggalSudahDicatat(hari.tanggalNum)
      if (sudah) { setStatus(''); alert(`Tanggal ${tanggalCantik(hari.tanggalNum)} sudah pernah dicatat di blockchain.`); setBusy(''); return }

      const dataMentah = feedsTanggal(feeds, hari.tanggal)
      const dataHash = await hashHarian(dataMentah)
      const suhuArr  = [keSkala(hari.suhu.avg),  keSkala(hari.suhu.min),  keSkala(hari.suhu.max)]
      const udaraArr = [keSkala(hari.udara.avg), keSkala(hari.udara.min), keSkala(hari.udara.max)]
      const tanahArr = [keSkala(hari.tanah.avg), keSkala(hari.tanah.min), keSkala(hari.tanah.max)]

      // ── Upload metadata lengkap (statistik + data mentah) ke IPFS/Pinata ──
      setStatus('Mengunggah metadata ke IPFS (Pinata)...')
      const metadata = {
        tipe: 'ringkasan-harian',
        proyek: 'Kopi IoT Web3',
        tanggal: hari.tanggal,
        statistik: {
          suhu:  { avg: hari.suhu.avg,  min: hari.suhu.min,  max: hari.suhu.max,  satuan: '°C' },
          udara: { avg: hari.udara.avg, min: hari.udara.min, max: hari.udara.max, satuan: '%' },
          tanah: { avg: hari.tanah.avg, min: hari.tanah.min, max: hari.tanah.max, satuan: '%' },
        },
        jumlahData: hari.jumlahData,
        dataMentah: dataMentah.map(d => ({ waktu: d.waktu, suhu: d.suhu, udara: d.udara, tanah: d.tanah })),
        dataHash,
        sumber: { channel: channel?.name, channelId: channel?.id, platform: 'ThingSpeak' },
        blockchain: 'Polygon Amoy Testnet',
        dibuat: new Date().toISOString(),
      }
      const cid = await uploadMetadata(metadata, `ringkasan-${hari.tanggal}.json`)

      setStatus('Membuka MetaMask...')
      const { contract } = await kontrakTulis()
      const provider = new ethers.BrowserProvider(window.ethereum)
      const gas = await gasAman(provider)

      setStatus('Mengirim transaksi ke Polygon Amoy...')
      const tx = await contract.catatRingkasan(hari.tanggalNum, suhuArr, udaraArr, tanahArr, hari.jumlahData, dataHash, cid, gas)
      setStatus('Menunggu konfirmasi blockchain...')
      const receipt = await tx.wait()
      setTxHash(receipt.hash)
      setStatus('✅ Ringkasan harian tersimpan di blockchain!')
      bacaOnChain()
    } catch (e) {
      setStatus('❌ ' + (e.reason || e.shortMessage || e.message))
    } finally { setBusy('') }
  }

  // ── Catat forecast ke blockchain ──────────────────────────
  async function catatForecast() {
    if (!adaKontrak()) { alert('CONTRACT_ADDRESS belum diisi. Deploy kontrak dulu (lihat README).'); return }
    if (!forecast) { alert('Forecast belum siap.'); return }
    setBusy('forecast'); setStatus('Menyiapkan forecast...'); setTxHash('')
    try {
      const tglBuat = parseInt(new Date().toISOString().slice(0, 10).replaceAll('-', ''), 10)
      // Gabung jadi satu array: [suhu..., udara..., tanah...] (panjang = horizon*3)
      const prediksi = [
        ...forecast.suhu.prediksi.map(keSkala),
        ...forecast.udara.prediksi.map(keSkala),
        ...forecast.tanah.prediksi.map(keSkala),
      ]
      const dataHash = await hashString(JSON.stringify({
        s: forecast.suhu.prediksi, u: forecast.udara.prediksi, t: forecast.tanah.prediksi, h: horizon,
      }))

      // ── Upload metadata forecast (termasuk metode) ke IPFS/Pinata ──
      setStatus('Mengunggah metadata forecast ke IPFS (Pinata)...')
      const metadata = {
        tipe: 'forecast',
        proyek: 'Kopi IoT Web3',
        dibuat: new Date().toISOString(),
        horizonHari: horizon,
        metode: forecast.metode,
        basisRiwayatHari: forecast.jumlahHariRiwayat,
        prediksi: forecast.tanggalPrediksi.map((t, i) => ({
          tanggal: t,
          suhu:  forecast.suhu.prediksi[i],
          udara: forecast.udara.prediksi[i],
          tanah: forecast.tanah.prediksi[i],
        })),
        kepercayaan: { suhuR2: forecast.suhu.r2, udaraR2: forecast.udara.r2, tanahR2: forecast.tanah.r2 },
        dataHash,
        blockchain: 'Polygon Amoy Testnet',
      }
      const cid = await uploadMetadata(metadata, `forecast-${tglBuat}.json`)

      setStatus('Membuka MetaMask...')
      const { contract } = await kontrakTulis()
      const provider = new ethers.BrowserProvider(window.ethereum)
      const gas = await gasAman(provider)

      setStatus('Mengirim transaksi ke Polygon Amoy...')
      const tx = await contract.catatForecast(tglBuat, horizon, prediksi, dataHash, cid, gas)
      setStatus('Menunggu konfirmasi blockchain...')
      const receipt = await tx.wait()
      setTxHash(receipt.hash)
      setStatus('✅ Forecast tersimpan di blockchain!')
      bacaOnChain()
    } catch (e) {
      setStatus('❌ ' + (e.reason || e.shortMessage || e.message))
    } finally { setBusy('') }
  }

  const hariPilih = harian.find(h => h.tanggal === tglPilih)
  const histSuhu  = harian.map(d => d.suhu?.avg)
  const histUdara = harian.map(d => d.udara?.avg)
  const histTanah = harian.map(d => d.tanah?.avg)
  const totalOnchain = onchainRingkasan.length + onchainForecast.length

  return (
    <>
      {/* Background FX */}
      <div className="bg-fx" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* ── NAVBAR ── */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-amber-300/10 text-2xl ring-1 ring-white/15">☕</div>
            <div>
              <div className="display text-lg font-bold leading-none text-white">
                Kopi<span className="grad-emerald"> IoT </span>Web3
              </div>
              <div className="mono mt-1 text-[10px] uppercase tracking-[3px] text-gray-500">Sensor · AI · Blockchain</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip mono px-3 py-1.5 text-[10px] font-bold tracking-wide text-violet-200">⬡ POLYGON AMOY</span>
            <button
              onClick={handleConnect}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${wallet ? 'chip text-emerald-300' : 'btn-violet'}`}
            >
              <span className={`h-2 w-2 rounded-full ${wallet ? 'live-dot bg-emerald-400' : 'bg-white/70'}`} />
              {wallet ? short(wallet) : 'Connect Wallet'}
            </button>
          </div>
        </header>

        {/* ── HERO ── */}
        <section className="mb-10 text-center">
          <div className="chip mx-auto mb-5 inline-flex items-center gap-2 px-4 py-1.5 text-[11px] font-medium text-gray-300">
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live dari kebun kopi · Bondowoso, Jawa Timur
          </div>
          <h1 className="display mx-auto max-w-3xl text-4xl font-bold leading-[1.1] text-white sm:text-5xl">
            Monitoring &amp; <span className="grad-emerald">Forecasting</span> Sensor,
            <br className="hidden sm:block" /> Terverifikasi di <span className="grad-violet">Blockchain</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-gray-400 sm:text-base">
            Data suhu, kelembaban udara &amp; tanah dari sensor IoT — diprediksi dengan AI dan dicatat permanen
            di Polygon. Transparan, anti-palsu, 100% gratis.
          </p>

          {/* Stat chips */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Stat label="Pembacaan" value={feeds.length ? feeds.length.toLocaleString('id-ID') : '—'} />
            <Stat label="Hari riwayat" value={harian.length || '—'} />
            <Stat label="Tercatat on-chain" value={totalOnchain} />
            <Stat label="Status" value={loading ? 'Memuat…' : 'Online'} accent />
          </div>
        </section>

        {/* ── PERINGATAN / ERROR ── */}
        {!adaKontrak() && (
          <div className="mb-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            <b>⚙️ Belum terhubung ke blockchain.</b> Isi <code className="mono">CONTRACT_ADDRESS</code> di <code className="mono">app/lib/config.js</code> (lihat README).
          </div>
        )}
        {error && <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">Gagal memuat data: {error}</div>}

        {/* ── KARTU LIVE ── */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <LiveCard emoji="🌡️" label="Suhu Udara" value={fmt(terbaru?.suhu)} unit="°C" warna="#fb7185" />
          <LiveCard emoji="💧" label="Kelembaban Udara" value={fmt(terbaru?.udara, 0)} unit="%" warna="#38bdf8" />
          <LiveCard emoji="🌱" label="Kelembaban Tanah" value={fmt(terbaru?.tanah, 0)} unit="%" warna="#4ade80" />
        </section>

        {/* ── STATUS BAR ── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 glass px-4 py-3 text-sm">
          <div className="text-gray-400">
            {loading ? 'Memuat data sensor…' : (
              <>Channel <b className="text-gray-200">{channel?.name}</b> · {feeds.length.toLocaleString('id-ID')} pembacaan · {harian.length} hari
              {terbaru && <> · terakhir <b className="text-gray-200">{new Date(terbaru.waktu).toLocaleString('id-ID')}</b></>}</>
            )}
          </div>
          <button onClick={muatData} className="chip px-3 py-1.5 text-xs font-bold text-gray-200 transition hover:text-white">↻ Refresh</button>
        </div>

        {/* ── FORECASTING ── */}
        <section className="mb-6 glass p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="display text-xl font-bold text-white">🔮 Forecasting</h2>
              <p className="text-xs text-gray-400">
                {sumberFc === 'hf' ? 'Model Hugging Face (best-per-variable)' : 'Regresi linear (browser)'} · prediksi {horizon} hari ke depan
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Horizon:</span>
              {[3, 5, 7].map(h => (
                <button key={h} onClick={() => setHorizon(h)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${horizon === h ? 'btn-primary' : 'chip text-gray-300 hover:text-white'}`}>
                  {h} hari
                </button>
              ))}
            </div>
          </div>

          {/* Sumber forecast: lokal vs Hugging Face */}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500">Sumber:</span>
            <button onClick={() => setSumberFc('lokal')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${sumberFc === 'lokal' ? 'btn-primary' : 'chip text-gray-300 hover:text-white'}`}>
              📈 Statistik lokal
            </button>
            <button onClick={() => setSumberFc('hf')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${sumberFc === 'hf' ? 'btn-violet' : 'chip text-gray-300 hover:text-white'}`}>
              🤗 Model HF
            </button>
            {fcLoading && <span className="text-xs text-gray-500">memuat dari HF…</span>}
            {fcError && <span className="text-xs text-red-300">HF gagal — pakai lokal</span>}
          </div>

          {harian.length < 7 && (
            <div className="mb-4 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
              ⚠️ Baru ada <b>{harian.length} hari</b> data. Forecast mulai dapat dipercaya setelah ≥14 hari, ideal ≥30 hari.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <MetricChart title="Suhu" emoji="🌡️" unit="°C" color="#fb7185" history={histSuhu}  forecast={forecast?.suhu.prediksi} />
            <MetricChart title="Kelembaban Udara" emoji="💧" unit="%" color="#38bdf8" history={histUdara} forecast={forecast?.udara.prediksi} />
            <MetricChart title="Kelembaban Tanah" emoji="🌱" unit="%" color="#4ade80" history={histTanah} forecast={forecast?.tanah.prediksi} />
          </div>

          {forecast && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2">Tanggal</th><th>🌡️ Suhu (°C)</th><th>💧 Udara (%)</th><th>🌱 Tanah (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.tanggalPrediksi.map((t, i) => (
                    <tr key={t} className="border-t border-white/5">
                      <td className="py-2 font-semibold text-gray-300">{t}</td>
                      <td className="mono text-rose-300">{fmt(forecast.suhu.prediksi[i])}</td>
                      <td className="mono text-sky-300">{fmt(forecast.udara.prediksi[i], 0)}</td>
                      <td className="mono text-emerald-300">{fmt(forecast.tanah.prediksi[i], 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                {forecast.sumber === 'hf'
                  ? ['suhu', 'udara', 'tanah'].map(n => (
                      <span key={n}>Metode {n}: <b className="text-violet-300">{forecast.metodePer?.[n] || '-'}</b></span>
                    ))
                  : [['Suhu', forecast.suhu], ['Udara', forecast.udara], ['Tanah', forecast.tanah]].map(([n, f]) => {
                      const k = labelKepercayaan(f.r2)
                      return <span key={n}>Kepercayaan {n}: <b style={{ color: k.warna }}>{k.teks}</b> (R²={Number(f.r2).toFixed(2)})</span>
                    })}
              </div>
            </div>
          )}
        </section>

        {/* ── BLOCKCHAIN ── */}
        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Catat ringkasan */}
          <div className="glass glass-hover p-5">
            <h3 className="display mb-1 text-base font-bold text-white">📦 Catat Ringkasan Harian</h3>
            <p className="mb-3 text-xs text-gray-400">Simpan rata-rata/min/max + hash 1 hari ke blockchain (sekali per hari).</p>
            <label className="mb-2 block text-xs font-semibold text-gray-400">Pilih tanggal</label>
            <select value={tglPilih} onChange={e => setTglPilih(e.target.value)}
              className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-400/40">
              {harian.slice().reverse().map(h => <option key={h.tanggal} value={h.tanggal}>{h.tanggal} ({h.jumlahData} data)</option>)}
            </select>
            {hariPilih && (
              <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
                <Mini label="Suhu avg" v={`${fmt(hariPilih.suhu?.avg)}°C`} sub={`${fmt(hariPilih.suhu?.min)}–${fmt(hariPilih.suhu?.max)}`} />
                <Mini label="Udara avg" v={`${fmt(hariPilih.udara?.avg, 0)}%`} sub={`${fmt(hariPilih.udara?.min, 0)}–${fmt(hariPilih.udara?.max, 0)}`} />
                <Mini label="Tanah avg" v={`${fmt(hariPilih.tanah?.avg, 0)}%`} sub={`${fmt(hariPilih.tanah?.min, 0)}–${fmt(hariPilih.tanah?.max, 0)}`} />
              </div>
            )}
            <button onClick={catatRingkasan} disabled={busy === 'ringkasan'}
              className="btn-primary w-full rounded-xl px-4 py-2.5 text-sm">
              {busy === 'ringkasan' ? 'Memproses…' : '⛓️ Simpan ke Blockchain'}
            </button>
          </div>

          {/* Catat forecast */}
          <div className="glass glass-hover p-5">
            <h3 className="display mb-1 text-base font-bold text-white">🔮 Catat Snapshot Forecast</h3>
            <p className="mb-3 text-xs text-gray-400">Simpan hasil prediksi {horizon} hari ke depan (disarankan 1× seminggu).</p>
            {forecast && (
              <div className="mb-3 rounded-xl border border-white/8 bg-white/5 p-3 text-xs text-gray-300">
                Metode: <b className="text-violet-300">{forecast.metode}</b><br />
                Horizon: <b>{horizon} hari</b> · berdasarkan <b>{forecast.jumlahHariRiwayat} hari</b> riwayat
              </div>
            )}
            <button onClick={catatForecast} disabled={busy === 'forecast'}
              className="btn-violet w-full rounded-xl px-4 py-2.5 text-sm">
              {busy === 'forecast' ? 'Memproses…' : '⛓️ Simpan Forecast ke Blockchain'}
            </button>
          </div>
        </section>

        {(status || txHash) && (
          <div className="mb-6 glass px-4 py-3 text-sm">
            {status && <div className="text-gray-200">{status}</div>}
            {txHash && <a href={linkTx(txHash)} target="_blank" rel="noreferrer" className="mono break-all text-xs text-sky-300 underline">Lihat transaksi: {txHash}</a>}
          </div>
        )}

        {/* ── DATA ON-CHAIN ── */}
        {adaKontrak() && (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <OnchainBox title="📜 Ringkasan di Blockchain" empty="Belum ada ringkasan tercatat.">
              {onchainRingkasan.map((r, i) => (
                <div key={i} className="border-t border-white/5 py-2 text-xs">
                  <div className="flex justify-between"><b className="text-gray-200">{tanggalCantik(r.tanggal)}</b><span className="text-gray-500">{r.jumlahData} data</span></div>
                  <div className="mono text-gray-400">🌡️{fmt(r.suhu[0])}°C 💧{fmt(r.udara[0], 0)}% 🌱{fmt(r.tanah[0], 0)}%</div>
                  <div className="mono truncate text-[10px] text-gray-600">hash: {r.dataHash}</div>
                  {r.metadataCID && <a href={linkIPFS(r.metadataCID)} target="_blank" rel="noreferrer" className="text-[10px] text-violet-300 underline">📦 Metadata IPFS</a>}
                </div>
              ))}
            </OnchainBox>
            <OnchainBox title="🔮 Forecast di Blockchain" empty="Belum ada forecast tercatat.">
              {onchainForecast.map((f, i) => (
                <div key={i} className="border-t border-white/5 py-2 text-xs">
                  <div className="flex justify-between"><b className="text-gray-200">Dibuat {tanggalCantik(f.tanggalBuat)}</b><span className="text-gray-500">{f.horizon} hari</span></div>
                  <div className="mono text-gray-400">🌡️{f.suhu.map(v => fmt(v)).join(', ')}</div>
                  <div className="mono truncate text-[10px] text-gray-600">hash: {f.dataHash}</div>
                  {f.metadataCID && <a href={linkIPFS(f.metadataCID)} target="_blank" rel="noreferrer" className="text-[10px] text-violet-300 underline">📦 Metadata IPFS</a>}
                </div>
              ))}
            </OnchainBox>
          </section>
        )}

        <footer className="mt-10 border-t border-white/5 pt-6 text-center text-xs text-gray-500">
          <div className="mb-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span className="chip px-2.5 py-1">📡 ThingSpeak</span>
            <span className="chip px-2.5 py-1">🤗 Hugging Face</span>
            <span className="chip px-2.5 py-1">⬡ Polygon Amoy</span>
            <span className="chip px-2.5 py-1">📦 IPFS / Pinata</span>
            <span className="chip px-2.5 py-1">▲ Vercel</span>
          </div>
          Kopi IoT Web3 · 100% gratis (testnet) ·{' '}
          <a href={`${AMOY.blockExplorerUrls[0]}/address/${CONTRACT_ADDRESS || ''}`} target="_blank" rel="noreferrer" className="text-gray-400 underline hover:text-white">lihat kontrak</a>
        </footer>
      </main>
    </>
  )
}

// ── Komponen kecil ──────────────────────────────────────────
function Stat({ label, value, accent }) {
  return (
    <div className="glass px-5 py-3 text-center">
      <div className={`display text-xl font-bold ${accent ? 'grad-emerald' : 'text-white'}`}>{value}</div>
      <div className="mono mt-0.5 text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
    </div>
  )
}

function LiveCard({ emoji, label, value, unit, warna }) {
  return (
    <div className="glass glass-hover relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ background: warna }} />
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-400">{label}</span>
        <span className="text-2xl">{emoji}</span>
      </div>
      <div className="mt-2 flex items-end gap-1">
        <span className="display text-4xl font-bold" style={{ color: warna }}>{value}</span>
        <span className="mb-1 text-lg font-bold text-gray-500">{unit}</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-500">
        <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> live dari sensor
      </div>
    </div>
  )
}

function Mini({ label, v, sub }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/5 p-2">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className="text-sm font-bold text-gray-100">{v}</div>
      <div className="mono text-[10px] text-gray-500">{sub}</div>
    </div>
  )
}

function OnchainBox({ title, empty, children }) {
  const kosong = !children || (Array.isArray(children) && children.length === 0)
  return (
    <div className="glass p-5">
      <h3 className="display mb-2 text-base font-bold text-white">{title}</h3>
      <div className="max-h-72 overflow-y-auto pr-1">
        {kosong ? <div className="py-6 text-center text-xs text-gray-500">{empty}</div> : children}
      </div>
    </div>
  )
}
