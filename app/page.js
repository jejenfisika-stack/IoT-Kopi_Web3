'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ethers } from 'ethers'
import { ambilFeeds, ambilTerbaru, agregasiHarian, feedsTanggal, hashHarian } from './lib/thingspeak'
import { forecastSemua, labelKepercayaan } from './lib/forecast'
import { ambilForecastHF } from './lib/hfforecast'
import { CONTRACT_ADDRESS, AMOY, PINATA_GATEWAY } from './lib/config'
import { adaKontrak, kontrakBaca, kontrakTulis, keSkala, dariSkala, gasAman, linkTx } from './lib/chain'
import { DICT } from './lib/i18n'
import MetricChart from './components/MetricChart'
import VerifyPanel from './components/VerifyPanel'

const fmt = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '—')
const short = a => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '')
const linkIPFS = cid => (cid ? `https://${PINATA_GATEWAY}/ipfs/${cid}` : '')

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

const csvNum = v => (Number.isFinite(v) ? Number(v).toFixed(2) : '')

// Unduh data sebagai CSV (open data). BOM ﻿ agar Excel baca UTF-8.
function unduhCSV(namaFile, header, baris) {
  const esc = x => { const s = String(x ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  const csv = [header.map(esc).join(','), ...baris.map(r => r.map(esc).join(','))].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = namaFile; a.click()
  URL.revokeObjectURL(url)
}

export default function Home() {
  const [lang, setLang]         = useState('id')
  const [channel, setChannel]   = useState(null)
  const [feeds, setFeeds]       = useState([])
  const [harian, setHarian]     = useState([])
  const [terbaru, setTerbaru]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [loadingHistori, setLoadingHistori] = useState(false)
  const [error, setError]       = useState('')

  const [horizon, setHorizon]   = useState(7)
  const [forecast, setForecast] = useState(null)
  const [sumberFc, setSumberFc] = useState('lokal')
  const [fcLoading, setFcLoading] = useState(false)
  const [fcError, setFcError]   = useState('')

  const [wallet, setWallet]     = useState('')
  const [tglPilih, setTglPilih] = useState('')
  const [status, setStatus]     = useState('')
  const [txHash, setTxHash]     = useState('')
  const [busy, setBusy]         = useState('')

  const [onchainRingkasan, setOnchainRingkasan] = useState([])
  const [onchainForecast, setOnchainForecast]   = useState([])
  const [kontribusi, setKontribusi] = useState(null) // { ringkasan, forecast, owner }

  const t = DICT[lang]

  // Bahasa: muat dari localStorage
  useEffect(() => {
    const l = typeof window !== 'undefined' && localStorage.getItem('lang')
    if (l === 'id' || l === 'en') setLang(l)
  }, [])
  function ubahLang(l) {
    setLang(l)
    try { localStorage.setItem('lang', l) } catch {}
  }

  // ── Muat data sensor dari ThingSpeak ──────────────────────
  const muatData = useCallback(async () => {
    setError('')
    // 1) Pembacaan terakhir (cepat, results=1) → kartu live tampil < 1 detik
    try {
      const { channel, terbaru } = await ambilTerbaru()
      setChannel(channel)
      if (terbaru) setTerbaru(terbaru)
    } catch (e) { /* lanjut ke riwayat */ }
    finally { setLoading(false) }

    // 2) Riwayat lengkap (berat) untuk grafik & forecast → di latar belakang
    setLoadingHistori(true)
    try {
      const { channel, feeds } = await ambilFeeds({ results: 8000 })
      setChannel(channel)
      setFeeds(feeds)
      const agg = agregasiHarian(feeds)
      setHarian(agg)
      if (feeds.length) setTerbaru(feeds[feeds.length - 1])
      if (agg.length && !tglPilih) setTglPilih(agg[agg.length - 1].tanggal)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingHistori(false)
    }
  }, [tglPilih])

  useEffect(() => { muatData() }, [])  // eslint-disable-line

  // ── Hitung/ambil forecast ─────────────────────────────────
  useEffect(() => {
    let batal = false
    async function jalan() {
      if (!harian.length) return
      setFcError('')
      if (sumberFc === 'lokal') {
        setForecast({ ...forecastSemua(harian, horizon), sumber: 'lokal' })
        return
      }
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
        const p = f.prediksi.map(dariSkala)
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

  // ── Proof of Contribution: hitung kontribusi wallet on-chain ─
  const hitungKontribusi = useCallback(async (addr) => {
    if (!adaKontrak() || !addr) { setKontribusi(null); return }
    try {
      const c = kontrakBaca()
      const [totR, totF, owner] = await Promise.all([c.totalRingkasan(), c.totalForecast(), c.owner()])
      const nR = Number(totR)
      const proms = []
      for (let i = 0; i < nR; i++) proms.push(c.getRingkasan(i))
      const res = await Promise.all(proms)
      const milikku = res.filter(r => r.pencatat?.toLowerCase() === addr.toLowerCase()).length
      const adalahOwner = owner.toLowerCase() === addr.toLowerCase()
      setKontribusi({ ringkasan: milikku, forecast: adalahOwner ? Number(totF) : 0, owner: adalahOwner })
    } catch (e) { console.warn('hitungKontribusi:', e.message) }
  }, [])

  // ── Wallet ────────────────────────────────────────────────
  async function handleConnect() {
    if (wallet) { setWallet(''); setKontribusi(null); return }
    try {
      const { address } = await kontrakTulis()
      setWallet(address)
      hitungKontribusi(address)
    } catch (e) { alert(e.message) }
  }

  // ── Catat ringkasan harian ke blockchain ──────────────────
  async function catatRingkasan() {
    if (!adaKontrak()) { alert(t.alNoContract); return }
    const hari = harian.find(h => h.tanggal === tglPilih)
    if (!hari) { alert(t.alPilihTgl); return }
    setBusy('ringkasan'); setStatus(t.stMenyiapkan); setTxHash('')
    try {
      const c = kontrakBaca()
      const sudah = await c.tanggalSudahDicatat(hari.tanggalNum)
      if (sudah) { setStatus(''); alert(t.alSudah(tanggalCantik(hari.tanggalNum))); setBusy(''); return }

      const dataMentah = feedsTanggal(feeds, hari.tanggal)
      const dataHash = await hashHarian(dataMentah)
      const suhuArr  = [keSkala(hari.suhu.avg),  keSkala(hari.suhu.min),  keSkala(hari.suhu.max)]
      const udaraArr = [keSkala(hari.udara.avg), keSkala(hari.udara.min), keSkala(hari.udara.max)]
      const tanahArr = [keSkala(hari.tanah.avg), keSkala(hari.tanah.min), keSkala(hari.tanah.max)]

      setStatus(t.stUploadIPFS)
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

      setStatus(t.stMetaMask)
      const { contract } = await kontrakTulis()
      const provider = new ethers.BrowserProvider(window.ethereum)
      const gas = await gasAman(provider)

      setStatus(t.stKirim)
      const tx = await contract.catatRingkasan(hari.tanggalNum, suhuArr, udaraArr, tanahArr, hari.jumlahData, dataHash, cid, gas)
      setStatus(t.stKonfirmasi)
      const receipt = await tx.wait()
      setTxHash(receipt.hash)
      setStatus(t.stRingkasanOk)
      bacaOnChain(); hitungKontribusi(wallet)
    } catch (e) {
      setStatus('❌ ' + (e.reason || e.shortMessage || e.message))
    } finally { setBusy('') }
  }

  // ── Catat forecast ke blockchain ──────────────────────────
  async function catatForecast() {
    if (!adaKontrak()) { alert(t.alNoContract); return }
    if (!forecast) { alert(t.alForecastBelum); return }
    setBusy('forecast'); setStatus(t.stSiapForecast); setTxHash('')
    try {
      const tglBuat = parseInt(new Date().toISOString().slice(0, 10).replaceAll('-', ''), 10)
      const prediksi = [
        ...forecast.suhu.prediksi.map(keSkala),
        ...forecast.udara.prediksi.map(keSkala),
        ...forecast.tanah.prediksi.map(keSkala),
      ]
      const dataHash = await hashString(JSON.stringify({
        s: forecast.suhu.prediksi, u: forecast.udara.prediksi, t: forecast.tanah.prediksi, h: horizon,
      }))

      setStatus(t.stUploadForecast)
      const metadata = {
        tipe: 'forecast',
        proyek: 'Kopi IoT Web3',
        dibuat: new Date().toISOString(),
        horizonHari: horizon,
        metode: forecast.metode,
        basisRiwayatHari: forecast.jumlahHariRiwayat,
        prediksi: forecast.tanggalPrediksi.map((tt, i) => ({
          tanggal: tt,
          suhu:  forecast.suhu.prediksi[i],
          udara: forecast.udara.prediksi[i],
          tanah: forecast.tanah.prediksi[i],
        })),
        kepercayaan: { suhuR2: forecast.suhu.r2, udaraR2: forecast.udara.r2, tanahR2: forecast.tanah.r2 },
        dataHash,
        blockchain: 'Polygon Amoy Testnet',
      }
      const cid = await uploadMetadata(metadata, `forecast-${tglBuat}.json`)

      setStatus(t.stMetaMask)
      const { contract } = await kontrakTulis()
      const provider = new ethers.BrowserProvider(window.ethereum)
      const gas = await gasAman(provider)

      setStatus(t.stKirim)
      const tx = await contract.catatForecast(tglBuat, horizon, prediksi, dataHash, cid, gas)
      setStatus(t.stKonfirmasi)
      const receipt = await tx.wait()
      setTxHash(receipt.hash)
      setStatus(t.stForecastOk)
      bacaOnChain(); hitungKontribusi(wallet)
    } catch (e) {
      setStatus('❌ ' + (e.reason || e.shortMessage || e.message))
    } finally { setBusy('') }
  }

  // ── Ekspor CSV (open data) ────────────────────────────────
  function eksporDataCSV() {
    const header = ['tanggal', 'suhu_avg', 'suhu_min', 'suhu_max', 'udara_avg', 'udara_min', 'udara_max', 'tanah_avg', 'tanah_min', 'tanah_max', 'jumlah_data']
    const baris = harian.map(h => [
      h.tanggal,
      csvNum(h.suhu?.avg), csvNum(h.suhu?.min), csvNum(h.suhu?.max),
      csvNum(h.udara?.avg), csvNum(h.udara?.min), csvNum(h.udara?.max),
      csvNum(h.tanah?.avg), csvNum(h.tanah?.min), csvNum(h.tanah?.max),
      h.jumlahData,
    ])
    unduhCSV('kopi-iot-data-harian.csv', header, baris)
  }
  function eksporForecastCSV() {
    if (!forecast) return
    const header = ['tanggal', 'suhu', 'udara', 'tanah']
    const baris = forecast.tanggalPrediksi.map((tt, i) => [
      tt, csvNum(forecast.suhu.prediksi[i]), csvNum(forecast.udara.prediksi[i]), csvNum(forecast.tanah.prediksi[i]),
    ])
    unduhCSV(`kopi-iot-forecast-${horizon}hari.csv`, header, baris)
  }

  const hariPilih = harian.find(h => h.tanggal === tglPilih)
  const histSuhu  = harian.map(d => d.suhu?.avg)
  const histUdara = harian.map(d => d.udara?.avg)
  const histTanah = harian.map(d => d.tanah?.avg)
  const totalOnchain = onchainRingkasan.length + onchainForecast.length

  return (
    <>
      <div className="bg-fx" aria-hidden="true">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* ── NAVBAR ── */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <div className="display text-lg font-bold leading-none text-white">
                Kopi<span className="grad-emerald"> IoT </span>Web3
              </div>
              <div className="mono mt-1 text-[10px] uppercase tracking-[3px] text-gray-500">{t.tagline}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/belajar" className="chip px-3 py-1.5 text-xs font-bold text-emerald-300 transition hover:text-emerald-200">{t.belajar}</Link>
            <Link href="/lab" className="chip hidden px-3 py-1.5 text-xs font-bold text-violet-300 transition hover:text-violet-200 sm:inline">{t.lab}</Link>
            {/* Toggle bahasa */}
            <div className="chip flex items-center gap-0.5 p-0.5 text-[11px] font-bold">
              <button onClick={() => ubahLang('id')} className={`rounded-full px-2.5 py-1 transition ${lang === 'id' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>🇮🇩 ID</button>
              <button onClick={() => ubahLang('en')} className={`rounded-full px-2.5 py-1 transition ${lang === 'en' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>🇬🇧 EN</button>
            </div>
            <span className="chip mono hidden px-3 py-1.5 text-[10px] font-bold tracking-wide text-violet-200 sm:inline">{t.chain}</span>
            <button
              onClick={handleConnect}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${wallet ? 'chip text-emerald-300' : 'btn-violet'}`}
            >
              <span className={`h-2 w-2 rounded-full ${wallet ? 'live-dot bg-emerald-400' : 'bg-white/70'}`} />
              {wallet ? short(wallet) : t.connect}
            </button>
          </div>
        </header>

        {/* ── HERO ── */}
        <section className="mb-10 text-center">
          <div className="chip mx-auto mb-5 inline-flex items-center gap-2 px-4 py-1.5 text-[11px] font-medium text-gray-300">
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {t.heroBadge}
          </div>
          <h1 className="display mx-auto max-w-3xl text-4xl font-bold leading-[1.1] text-white sm:text-5xl">
            {t.heroA}<span className="grad-emerald">{t.heroEm}</span>{t.heroMid}<span className="grad-violet">{t.heroVi}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-gray-400 sm:text-base">{t.heroDesc}</p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Stat label={t.statPembacaan} value={feeds.length ? feeds.length.toLocaleString('id-ID') : '—'} />
            <Stat label={t.statHari} value={harian.length || '—'} />
            <Stat label={t.statOnchain} value={totalOnchain} />
            <Stat label={t.statStatus} value={loading ? t.memuat : t.online} accent />
          </div>
        </section>

        {!adaKontrak() && (
          <div className="mb-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            <b>{t.warnNoContractA}</b>{t.warnNoContractB}
          </div>
        )}
        {error && <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{t.errLoad}{error}</div>}

        {/* ── KARTU LIVE ── */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <LiveCard emoji="🌡️" label={t.suhuUdara} live={t.liveSensor} value={fmt(terbaru?.suhu)} unit="°C" warna="#fb7185" />
          <LiveCard emoji="💧" label={t.kelUdara} live={t.liveSensor} value={fmt(terbaru?.udara, 0)} unit="%" warna="#38bdf8" />
          <LiveCard emoji="🌱" label={t.kelTanah} live={t.liveSensor} value={fmt(terbaru?.tanah, 0)} unit="%" warna="#4ade80" />
        </section>

        {/* ── STATUS BAR ── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 glass px-4 py-3 text-sm">
          <div className="text-gray-400">
            {loading ? t.memuatSensor : (
              <>{t.channel} <b className="text-gray-200">{channel?.name}</b>
              {feeds.length > 0 && <> · {feeds.length.toLocaleString('id-ID')} {t.pembacaan} · {harian.length} {t.hari}</>}
              {terbaru && <> · {t.terakhir} <b className="text-gray-200">{new Date(terbaru.waktu).toLocaleString(lang === 'en' ? 'en-GB' : 'id-ID')}</b></>}
              {loadingHistori && <> · <span className="text-gray-500">{t.memuatHistori}</span></>}</>
            )}
          </div>
          <div className="flex items-center gap-2">
            {harian.length > 0 && (
              <button onClick={eksporDataCSV} className="chip px-3 py-1.5 text-xs font-bold text-emerald-300 transition hover:text-emerald-200">{t.csvData}</button>
            )}
            <button onClick={muatData} className="chip px-3 py-1.5 text-xs font-bold text-gray-200 transition hover:text-white">{t.refresh}</button>
          </div>
        </div>

        {/* ── FORECASTING ── */}
        <section className="mb-6 glass p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="display text-xl font-bold text-white">🔮 {t.forecasting}</h2>
              <p className="text-xs text-gray-400">
                {sumberFc === 'hf' ? t.srcHF : t.srcLokal} {t.prediksiNhari(horizon)}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">{t.horizon}</span>
              {[3, 5, 7].map(h => (
                <button key={h} onClick={() => setHorizon(h)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${horizon === h ? 'btn-primary' : 'chip text-gray-300 hover:text-white'}`}>
                  {t.nhari(h)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500">{t.sumber}</span>
            <button onClick={() => setSumberFc('lokal')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${sumberFc === 'lokal' ? 'btn-primary' : 'chip text-gray-300 hover:text-white'}`}>
              {t.statistikLokal}
            </button>
            <button onClick={() => setSumberFc('hf')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${sumberFc === 'hf' ? 'btn-violet' : 'chip text-gray-300 hover:text-white'}`}>
              {t.modelHF}
            </button>
            {fcLoading && <span className="text-xs text-gray-500">{t.memuatHF}</span>}
            {fcError && <span className="text-xs text-red-300">{t.hfGagal}</span>}
          </div>

          {harian.length < 7 && (
            <div className="mb-4 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
              {t.warnDataA}<b>{t.warnDataHari(harian.length)}</b>{t.warnDataB}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <MetricChart title={t.suhuUdara} emoji="🌡️" unit="°C" color="#fb7185" history={histSuhu}  forecast={forecast?.suhu.prediksi} />
            <MetricChart title={t.kelUdara} emoji="💧" unit="%" color="#38bdf8" history={histUdara} forecast={forecast?.udara.prediksi} />
            <MetricChart title={t.kelTanah} emoji="🌱" unit="%" color="#4ade80" history={histTanah} forecast={forecast?.tanah.prediksi} />
          </div>

          {forecast && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2">{t.thTanggal}</th><th>🌡️ {t.suhuUdara}</th><th>💧 {t.kelUdara}</th><th>🌱 {t.kelTanah}</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.tanggalPrediksi.map((tt, i) => (
                    <tr key={tt} className="border-t border-white/5">
                      <td className="py-2 font-semibold text-gray-300">{tt}</td>
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
                      <span key={n}>{t.metode(n)}: <b className="text-violet-300">{forecast.metodePer?.[n] || '-'}</b></span>
                    ))
                  : [['suhu', forecast.suhu], ['udara', forecast.udara], ['tanah', forecast.tanah]].map(([n, f]) => {
                      const k = labelKepercayaan(f.r2)
                      return <span key={n}>{t.kepercayaan(n)}: <b style={{ color: k.warna }}>{t.conf[k.teks]}</b> (R²={Number(f.r2).toFixed(2)})</span>
                    })}
              </div>
              <button onClick={eksporForecastCSV} className="mt-3 chip px-3 py-1.5 text-xs font-bold text-emerald-300 transition hover:text-emerald-200">{t.csvForecast}</button>
            </div>
          )}
        </section>

        {/* ── VERIFY / CARA KERJA ── */}
        <VerifyPanel t={t} forecast={forecast} contractAddr={CONTRACT_ADDRESS} explorer={AMOY.blockExplorerUrls[0]} />

        {/* ── BLOCKCHAIN ── */}
        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="glass glass-hover p-5">
            <h3 className="display mb-1 text-base font-bold text-white">{t.catatRingkasanT}</h3>
            <p className="mb-3 text-xs text-gray-400">{t.catatRingkasanD}</p>
            <label className="mb-2 block text-xs font-semibold text-gray-400">{t.pilihTanggal}</label>
            <select value={tglPilih} onChange={e => setTglPilih(e.target.value)}
              className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-400/40">
              {harian.slice().reverse().map(h => <option key={h.tanggal} value={h.tanggal}>{h.tanggal} ({t.nData(h.jumlahData)})</option>)}
            </select>
            {hariPilih && (
              <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
                <Mini label={t.suhuAvg} v={`${fmt(hariPilih.suhu?.avg)}°C`} sub={`${fmt(hariPilih.suhu?.min)}–${fmt(hariPilih.suhu?.max)}`} />
                <Mini label={t.udaraAvg} v={`${fmt(hariPilih.udara?.avg, 0)}%`} sub={`${fmt(hariPilih.udara?.min, 0)}–${fmt(hariPilih.udara?.max, 0)}`} />
                <Mini label={t.tanahAvg} v={`${fmt(hariPilih.tanah?.avg, 0)}%`} sub={`${fmt(hariPilih.tanah?.min, 0)}–${fmt(hariPilih.tanah?.max, 0)}`} />
              </div>
            )}
            <button onClick={catatRingkasan} disabled={busy === 'ringkasan'} className="btn-primary w-full rounded-xl px-4 py-2.5 text-sm">
              {busy === 'ringkasan' ? t.memproses : t.simpanBC}
            </button>
          </div>

          <div className="glass glass-hover p-5">
            <h3 className="display mb-1 text-base font-bold text-white">{t.catatForecastT}</h3>
            <p className="mb-3 text-xs text-gray-400">{t.catatForecastD(horizon)}</p>
            {forecast && (
              <div className="mb-3 rounded-xl border border-white/8 bg-white/5 p-3 text-xs text-gray-300">
                {t.metodeLbl} <b className="text-violet-300">{forecast.metode}</b><br />
                {t.horizonInfo(horizon, forecast.jumlahHariRiwayat)}
              </div>
            )}
            <button onClick={catatForecast} disabled={busy === 'forecast'} className="btn-violet w-full rounded-xl px-4 py-2.5 text-sm">
              {busy === 'forecast' ? t.memproses : t.simpanForecastBC}
            </button>
          </div>
        </section>

        {(status || txHash) && (
          <div className="mb-6 glass px-4 py-3 text-sm">
            {status && <div className="text-gray-200">{status}</div>}
            {txHash && <a href={linkTx(txHash)} target="_blank" rel="noreferrer" className="mono break-all text-xs text-sky-300 underline">{t.lihatTx} {txHash}</a>}
          </div>
        )}

        {/* ── PROOF OF CONTRIBUTION ── */}
        {adaKontrak() && wallet && kontribusi && (
          <section className="mb-6 glass glass-hover p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="display text-base font-bold text-white">{t.pocTitle}</h3>
                <p className="mt-0.5 text-xs text-gray-400">{t.pocDesc}</p>
                <div className="mt-1 mono text-[11px] text-gray-500">{short(wallet)} · {kontribusi.owner
                  ? <span className="text-emerald-300">{t.pocOwner}</span>
                  : <span className="text-amber-300">{t.pocBukanOwner}</span>}</div>
              </div>
              <div className="flex gap-3">
                <PocStat label={t.pocRingkasan} value={kontribusi.ringkasan} warna="#4ade80" />
                <PocStat label={t.pocForecast} value={kontribusi.forecast} warna="#a78bfa" />
              </div>
            </div>
          </section>
        )}

        {/* ── DATA ON-CHAIN ── */}
        {adaKontrak() && (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <OnchainBox title={t.onchainRingkasanT} empty={t.emptyRingkasan}>
              {onchainRingkasan.map((r, i) => (
                <div key={i} className="border-t border-white/5 py-2 text-xs">
                  <div className="flex justify-between"><b className="text-gray-200">{tanggalCantik(r.tanggal)}</b><span className="text-gray-500">{t.nDataShort(r.jumlahData)}</span></div>
                  <div className="mono text-gray-400">🌡️{fmt(r.suhu[0])}°C 💧{fmt(r.udara[0], 0)}% 🌱{fmt(r.tanah[0], 0)}%</div>
                  <div className="mono truncate text-[10px] text-gray-600">hash: {r.dataHash}</div>
                  {r.metadataCID && <a href={linkIPFS(r.metadataCID)} target="_blank" rel="noreferrer" className="text-[10px] text-violet-300 underline">{t.metaIPFS}</a>}
                </div>
              ))}
            </OnchainBox>
            <OnchainBox title={t.onchainForecastT} empty={t.emptyForecast}>
              {onchainForecast.map((f, i) => (
                <div key={i} className="border-t border-white/5 py-2 text-xs">
                  <div className="flex justify-between"><b className="text-gray-200">{t.dibuat} {tanggalCantik(f.tanggalBuat)}</b><span className="text-gray-500">{t.nhari(f.horizon)}</span></div>
                  <div className="mono text-gray-400">🌡️{f.suhu.map(v => fmt(v)).join(', ')}</div>
                  <div className="mono truncate text-[10px] text-gray-600">hash: {f.dataHash}</div>
                  {f.metadataCID && <a href={linkIPFS(f.metadataCID)} target="_blank" rel="noreferrer" className="text-[10px] text-violet-300 underline">{t.metaIPFS}</a>}
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
          {t.footer}
          <a href={`${AMOY.blockExplorerUrls[0]}/address/${CONTRACT_ADDRESS || ''}`} target="_blank" rel="noreferrer" className="text-gray-400 underline hover:text-white">{t.lihatKontrak}</a>
        </footer>
      </main>
    </>
  )
}

// ── Komponen kecil ──────────────────────────────────────────
function Logo() {
  const [ok, setOk] = useState(true)
  return (
    <div className="relative h-11 w-11 shrink-0">
      {ok ? (
        <img src="/logo-kopi.jpg" alt="Kopi" onError={() => setOk(false)}
          className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/20"
          style={{ boxShadow: '0 0 22px rgba(74,222,128,.28)' }} />
      ) : (
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-amber-300/10 text-2xl ring-1 ring-white/15">🍒</div>
      )}
      <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[8px] font-bold text-emerald-950 ring-2 ring-[#070a12]">✓</span>
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="glass px-5 py-3 text-center">
      <div className={`display text-xl font-bold ${accent ? 'grad-emerald' : 'text-white'}`}>{value}</div>
      <div className="mono mt-0.5 text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
    </div>
  )
}

function LiveCard({ emoji, label, value, unit, warna, live }) {
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
        <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> {live}
      </div>
    </div>
  )
}

function PocStat({ label, value, warna }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-2 text-center">
      <div className="display text-2xl font-bold" style={{ color: warna }}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
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
