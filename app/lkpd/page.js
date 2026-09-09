'use client'

// ============================================================
//  /lkpd — Lembar Kerja Digital · Predict · Observe · Explain
//
//  Bedanya dari LKPD berbasis klasifikasi citra: di sini kebenaran TIDAK
//  berasal dari label yang sudah ditentukan, melainkan dari data sensor
//  sungguhan yang disembunyikan. Aplikasi memotong beberapa hari terakhir,
//  mahasiswa meramalkannya, lalu potongan itu dibuka dan dibandingkan dengan
//  dua pembanding: Naive dan regresi linear.
//
//  Inti POE: prediksi WAJIB dikunci sebelum pengamatan dibuka. Nilai yang
//  disembunyikan disimpan di ref, bukan di state yang ikut ter-render.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ambilFeeds } from '../lib/thingspeak'
import { regresiLinear } from '../lib/forecast'

const K = 3             // jumlah titik yang disembunyikan & diramalkan
const MIN_RIWAYAT = 8   // titik minimum yang harus terlihat agar layak diramal

// Resolusi JAM, bukan harian. Alasannya: jendela 8.000 pembacaan terakhir kini
// hanya menjangkau sekitar dua minggu karena sensor merekam sangat rapat,
// sehingga deret harian terlalu pendek dan penuh lubang. Di dalam sesi
// perekaman, data justru rapat — di situlah peramalan jangka pendek bermakna.
const MENIT_BIN = 60

// Kelompokkan pembacaan mentah ke dalam bin waktu, lalu ambil rentetan bin
// BERURUTAN terpanjang (tanpa lubang) supaya jarak antar titik selalu sama.
function deretBerurutan(feeds, vr) {
  const bin = new Map()
  for (const f of feeds) {
    const nilai = f[vr]
    if (!Number.isFinite(nilai)) continue
    const t = new Date(f.waktu)
    if (isNaN(t)) continue
    const ms = Math.floor(t.getTime() / (MENIT_BIN * 60000)) * MENIT_BIN * 60000
    if (!bin.has(ms)) bin.set(ms, [])
    bin.get(ms).push(nilai)
  }
  const titik = [...bin.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ms, arr]) => ({ ms, nilai: arr.reduce((s, v) => s + v, 0) / arr.length }))

  // rentetan terpanjang dengan selisih tepat satu bin
  const langkah = MENIT_BIN * 60000
  let terbaik = [], kini = []
  for (let i = 0; i < titik.length; i++) {
    if (i === 0 || titik[i].ms - titik[i - 1].ms === langkah) kini.push(titik[i])
    else { if (kini.length > terbaik.length) terbaik = kini; kini = [titik[i]] }
  }
  if (kini.length > terbaik.length) terbaik = kini

  return terbaik.map(p => ({
    tanggal: new Date(p.ms).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
    nilai: p.nilai,
  }))
}

const VARIABEL = {
  suhu:  { label: 'Suhu udara',       satuan: '°C', warna: '#fb7185' },
  udara: { label: 'Kelembaban udara', satuan: '%',  warna: '#38bdf8' },
  tanah: { label: 'Kelembaban tanah', satuan: '%',  warna: '#4ade80' },
}

const KOSONG = {
  nama: '', nim: '', kelas: '', vr: 'suhu',
  tebakan: ['', '', ''], yakin: 60, alasan: '',
  terkunci: false,
  e1: '', e2: '', e3: '',
}

const mae = (a, b) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / a.length
const fmt = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '—')

export default function Lkpd() {
  const [feeds, setFeeds]   = useState([])
  const [muat, setMuat]     = useState(true)
  const [galat, setGalat]   = useState('')
  const [d, setD]           = useState(KOSONG)
  const [pesan, setPesan]   = useState('')
  const [tersalin, setTersalin] = useState(false)
  const rahasia = useRef(null)   // nilai tersembunyi — sengaja di luar state

  // ── Muat draf ──
  useEffect(() => {
    try {
      const s = localStorage.getItem('lkpd_draf')
      if (s) setD({ ...KOSONG, ...JSON.parse(s) })
    } catch {}
  }, [])

  function simpan(patch) {
    setD(prev => {
      const next = typeof patch === 'function' ? { ...prev, ...patch(prev) } : { ...prev, ...patch }
      try { localStorage.setItem('lkpd_draf', JSON.stringify(next)) } catch {}
      return next
    })
  }

  // ── Ambil data sensor ──
  useEffect(() => {
    ambilFeeds({ results: 8000 })
      .then(({ feeds }) => setFeeds(feeds))
      .catch(e => setGalat(e.message))
      .finally(() => setMuat(false))
  }, [])

  // ── Pisahkan bagian terlihat dan bagian tersembunyi ──
  const seri = useMemo(() => {
    const titik = deretBerurutan(feeds, d.vr)
    if (titik.length < MIN_RIWAYAT + K) return null
    // batasi riwayat yang ditampilkan agar grafik tetap terbaca
    const dipakai = titik.slice(-Math.min(titik.length, 30))
    const potong = dipakai.length - K
    return { terlihat: dipakai.slice(0, potong), tersembunyi: dipakai.slice(potong), totalBin: titik.length }
  }, [feeds, d.vr])

  // Simpan nilai tersembunyi di ref supaya tidak ikut ter-render sebelum dikunci
  useEffect(() => { rahasia.current = seri ? seri.tersembunyi : null }, [seri])

  // ── Pembanding ──
  const banding = useMemo(() => {
    if (!seri) return null
    const ys = seri.terlihat.map(t => t.nilai)
    const naive = Array(K).fill(ys[ys.length - 1])
    const m = regresiLinear(ys)
    const linear = Array.from({ length: K }, (_, i) => m ? m.slope * (ys.length + i) + m.intercept : ys[ys.length - 1])
    return { naive, linear, r2: m?.r2 ?? 0 }
  }, [seri])

  const tebakAngka = d.tebakan.map(v => parseFloat(String(v).replace(',', '.')))
  const tebakLengkap = tebakAngka.every(Number.isFinite)

  function kunci() {
    if (!d.nama.trim() || !d.nim.trim()) { setPesan('Nama dan NIM wajib diisi.'); return }
    if (!tebakLengkap) { setPesan(`Isi ketiga tebakan nilai ${VARIABEL[d.vr].label.toLowerCase()}.`); return }
    if (!d.alasan.trim()) { setPesan('Tuliskan alasan tebakanmu — ini bagian inti dari LKPD.'); return }
    setPesan('')
    simpan({ terkunci: true })
  }

  function kosongkan() {
    if (!confirm('Kosongkan seluruh isian LKPD?')) return
    setD(KOSONG)
    try { localStorage.removeItem('lkpd_draf') } catch {}
  }

  // ── Hasil (hanya dihitung setelah terkunci) ──
  const hasil = useMemo(() => {
    if (!d.terkunci || !seri || !banding) return null
    const aktual = seri.tersembunyi.map(t => t.nilai)
    return {
      aktual,
      tanggal: seri.tersembunyi.map(t => t.tanggal),
      maeSaya: mae(aktual, tebakAngka),
      maeNaive: mae(aktual, banding.naive),
      maeLinear: mae(aktual, banding.linear),
    }
  }, [d.terkunci, d.tebakan, seri, banding])

  const V = VARIABEL[d.vr]

  // ── Ekspor ──
  function teksLkpd() {
    const b = []
    b.push('LKPD DIGITAL — PREDICT · OBSERVE · EXPLAIN')
    b.push('Peramalan Deret Waktu Sensor Kebun Kopi')
    b.push('')
    b.push(`Nama   : ${d.nama}`)
    b.push(`NIM    : ${d.nim}`)
    b.push(`Kelas  : ${d.kelas || '-'}`)
    b.push(`Waktu  : ${new Date().toLocaleString('id-ID')}`)
    b.push(`Variabel: ${V.label} (${V.satuan})`)
    b.push('')
    b.push('① PREDICT')
    if (seri) b.push(`Riwayat terlihat: ${seri.terlihat.length} jam berturut-turut, berakhir ${seri.terlihat[seri.terlihat.length - 1].tanggal}`)
    d.tebakan.forEach((t, i) => b.push(`  Tebakan jam ke-${i + 1}: ${t} ${V.satuan}`))
    b.push(`  Tingkat keyakinan: ${d.yakin}%`)
    b.push(`  Alasan: ${d.alasan}`)
    b.push('')
    if (hasil) {
      b.push('② OBSERVE')
      hasil.tanggal.forEach((tg, i) => {
        b.push(`  ${tg} — aktual ${fmt(hasil.aktual[i])} | tebakanmu ${fmt(tebakAngka[i])} | Naive ${fmt(banding.naive[i])} | Linear ${fmt(banding.linear[i])}`)
      })
      b.push(`  MAE tebakanmu : ${fmt(hasil.maeSaya, 2)}`)
      b.push(`  MAE Naive     : ${fmt(hasil.maeNaive, 2)}`)
      b.push(`  MAE Linear    : ${fmt(hasil.maeLinear, 2)}  (R² riwayat ${fmt(banding.r2, 3)})`)
      b.push('')
    }
    b.push('③ EXPLAIN')
    b.push(`  1) ${d.e1 || '-'}`)
    b.push(`  2) ${d.e2 || '-'}`)
    b.push(`  3) ${d.e3 || '-'}`)
    return b.join('\n')
  }

  function unduh() {
    const isi = teksLkpd()
    const html = `<!doctype html><meta charset="utf-8"><title>LKPD ${d.nama}</title>` +
      `<body style="font-family:Georgia,serif;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.6">` +
      `<pre style="white-space:pre-wrap;font-family:Georgia,serif">${isi.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}</pre></body>`
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `LKPD_${(d.nama || 'mahasiswa').replace(/[^\w\-]+/g, '_')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function salin() {
    try { await navigator.clipboard.writeText(teksLkpd()); setTersalin(true); setTimeout(() => setTersalin(false), 2500) }
    catch { setPesan('Gagal menyalin. Pakai tombol unduh saja.') }
  }

  return (
    <>
      <div className="bg-fx" aria-hidden="true"><div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" /></div>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/belajar" className="chip inline-flex min-h-[44px] items-center px-4 text-xs font-bold text-gray-200 transition hover:text-white">← Mode Belajar</Link>
          {d.terkunci && <span className="chip px-4 py-2 text-[11px] font-bold text-emerald-300">🔒 Prediksi terkunci</span>}
        </header>

        <section className="mb-6 text-center">
          <div className="chip mx-auto mb-4 inline-flex items-center gap-2 px-4 py-1.5 text-[11px] text-gray-300">📝 LKPD · Predict · Observe · Explain</div>
          <h1 className="display text-3xl font-bold text-white sm:text-4xl">
            Ramalkan Dulu, <span className="grad-emerald">Baru Lihat Datanya</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-400">
            Aplikasi menyembunyikan <b className="text-gray-200">{K} jam terakhir</b> data sensor sungguhan.
            Ramalkan ketiganya, kunci jawabanmu, lalu bandingkan dengan data asli dan dua model pembanding.
          </p>
        </section>

        {muat && <div className="glass p-6 text-center text-sm text-gray-400">Memuat data sensor…</div>}
        {galat && <div className="glass p-4 text-sm text-rose-300">Gagal memuat data: {galat}</div>}

        {!muat && !galat && !seri && (
          <div className="glass p-5 text-sm text-amber-200">
            Belum ada rentetan jam berurutan yang cukup untuk {V.label.toLowerCase()} (perlu minimal {MIN_RIWAYAT + K} jam
            berturut-turut tanpa putus). Coba pilih variabel lain, atau tunggu sensor merekam lebih lama.
            <div className="mt-3 flex gap-2">
              {Object.entries(VARIABEL).map(([k, v]) => (
                <button key={k} onClick={() => simpan({ vr: k })}
                  className={`chip min-h-[44px] px-3 text-xs font-bold ${d.vr === k ? 'text-emerald-300' : 'text-gray-300'}`}>{v.label}</button>
              ))}
            </div>
          </div>
        )}

        {seri && (
          <>
            {/* ① IDENTITAS */}
            <Bagian nomor="①" judul="Identitas">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Isian label="Nama lengkap" v={d.nama} set={v => simpan({ nama: v })} ph="Nama sesuai daftar hadir" kunci={d.terkunci} />
                <Isian label="NIM" v={d.nim} set={v => simpan({ nim: v })} ph="mis. 2201234" kunci={d.terkunci} />
                <Isian label="Kelas (opsional)" v={d.kelas} set={v => simpan({ kelas: v })} ph="mis. Pendidikan IPA A" kunci={d.terkunci} />
              </div>
              {!d.terkunci && (
                <div className="mt-3">
                  <div className="mb-1.5 text-[11px] font-semibold text-gray-400">Variabel yang diramalkan</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(VARIABEL).map(([k, v]) => (
                      <button key={k} onClick={() => simpan({ vr: k, tebakan: ['', '', ''] })}
                        className={`min-h-[44px] rounded-xl border px-3 text-xs font-bold transition ${
                          d.vr === k ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/[0.03] text-gray-300'}`}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Bagian>

            {/* ② PREDICT */}
            <Bagian nomor="②" judul="PREDICT — ramalkan sebelum melihat">
              <p className="mb-3 text-xs leading-relaxed text-gray-400">
                Grafik di bawah menampilkan {seri.terlihat.length} jam berturut-turut, berakhir pada{' '}
                <b className="text-gray-200">{seri.terlihat[seri.terlihat.length - 1].tanggal}</b>.
                Perhatikan pola naik-turunnya, lalu ramalkan nilai {K} jam berikutnya.
              </p>

              <Grafik terlihat={seri.terlihat} warna={V.warna} satuan={V.satuan}
                aktual={d.terkunci ? hasil?.aktual : null}
                tebak={d.terkunci ? tebakAngka : null}
                naive={d.terkunci ? banding.naive : null} />

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[0, 1, 2].map(i => (
                  <div key={i}>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-400">Jam ke-{i + 1} ({V.satuan})</label>
                    <input inputMode="decimal" disabled={d.terkunci} value={d.tebakan[i]}
                      onChange={e => simpan(p => ({ tebakan: p.tebakan.map((t, j) => (j === i ? e.target.value : t)) }))}
                      placeholder="mis. 29,5"
                      className="min-h-[44px] w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-gray-200 outline-none focus:border-emerald-400/40 disabled:opacity-60" />
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-[11px] font-semibold text-gray-400">Seberapa yakin kamu? {d.yakin}%</label>
                <input type="range" min={0} max={100} step={5} value={d.yakin} disabled={d.terkunci}
                  onChange={e => simpan({ yakin: parseInt(e.target.value, 10) })}
                  className="h-11 w-full accent-emerald-400 disabled:opacity-60" />
              </div>

              <div className="mt-3">
                <label className="mb-1 block text-[11px] font-semibold text-gray-400">Apa dasar tebakanmu?</label>
                <textarea rows={3} value={d.alasan} disabled={d.terkunci}
                  onChange={e => simpan({ alasan: e.target.value })}
                  placeholder="Saya menebak begitu karena beberapa hari terakhir polanya…"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-200 outline-none focus:border-emerald-400/40 disabled:opacity-60" />
              </div>

              {pesan && <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{pesan}</div>}

              {!d.terkunci ? (
                <>
                  <button onClick={kunci} className="btn-primary mt-4 w-full rounded-xl px-5 py-3 text-sm">🔒 Kunci prediksi</button>
                  <p className="mt-2 text-center text-[11px] text-gray-500">
                    Data asli baru dibuka setelah prediksimu dikunci. Setelah dikunci, tebakan tidak dapat diubah.
                  </p>
                </>
              ) : (
                <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/5 px-3 py-2.5 text-xs text-emerald-200">
                  🔒 Prediksi terkunci — bagian pengamatan di bawah sudah terbuka.
                </div>
              )}
            </Bagian>

            {/* ③ OBSERVE */}
            <Bagian nomor="③" judul="OBSERVE — data asli dibuka">
              {!d.terkunci ? (
                <p className="py-6 text-center text-xs text-gray-500">Bagian ini terbuka setelah prediksimu dikunci.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[460px] text-sm">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                          <th className="py-1.5">Tanggal</th><th>Aktual</th><th>Tebakanmu</th><th>Naive</th><th>Linear</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hasil.tanggal.map((tg, i) => (
                          <tr key={tg} className="border-t border-white/5">
                            <td className="py-1.5 text-gray-300">{tg}</td>
                            <td className="mono font-bold text-gray-100">{fmt(hasil.aktual[i])}</td>
                            <td className="mono" style={{ color: V.warna }}>{fmt(tebakAngka[i])}</td>
                            <td className="mono text-gray-400">{fmt(banding.naive[i])}</td>
                            <td className="mono text-gray-400">{fmt(banding.linear[i])}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Metrik label="MAE tebakanmu" nilai={hasil.maeSaya} warna={V.warna}
                      juara={hasil.maeSaya <= Math.min(hasil.maeNaive, hasil.maeLinear)} />
                    <Metrik label="MAE Naive" nilai={hasil.maeNaive} warna="#9ca3af"
                      juara={hasil.maeNaive < Math.min(hasil.maeSaya, hasil.maeLinear)} />
                    <Metrik label="MAE Linear" nilai={hasil.maeLinear} warna="#a78bfa"
                      juara={hasil.maeLinear < Math.min(hasil.maeSaya, hasil.maeNaive)} />
                  </div>

                  <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
                    MAE = rata-rata selisih mutlak; makin kecil makin tepat. R² riwayat yang terlihat: {fmt(banding.r2, 3)} —
                    makin dekat ke 0, makin lemah tren garis lurus pada data ini.
                  </p>
                </>
              )}
            </Bagian>

            {/* ④ EXPLAIN */}
            <Bagian nomor="④" judul="EXPLAIN — jelaskan selisihnya">
              {!d.terkunci ? (
                <p className="py-6 text-center text-xs text-gray-500">Bagian ini terbuka setelah prediksimu dikunci.</p>
              ) : (
                <div className="space-y-4">
                  <Esai label={`1) Seberapa jauh tebakanmu dari data asli? Menurutmu mengapa demikian?`}
                    v={d.e1} set={v => simpan({ e1: v })} />
                  <Esai label={`2) Bandingkan MAE tebakanmu dengan MAE Naive. Apa artinya bila model yang hanya mengulang nilai terakhir sulit dikalahkan?`}
                    v={d.e2} set={v => simpan({ e2: v })} />
                  <Esai label={`3) Ramalan ini hanya sejauh ${K} jam ke depan. Menurutmu, apa yang berubah bila horizonnya diperpanjang menjadi beberapa hari?`}
                    v={d.e3} set={v => simpan({ e3: v })} />
                </div>
              )}
            </Bagian>

            {/* Ekspor */}
            <section className="glass mt-4 p-5">
              <div className="mb-3 text-sm font-bold text-white">Kumpulkan hasil</div>
              <div className="flex flex-wrap gap-2">
                <button onClick={unduh} disabled={!d.terkunci}
                  className="btn-primary min-h-[44px] rounded-xl px-4 text-xs disabled:opacity-40">⬇ Unduh LKPD (HTML)</button>
                <button onClick={salin} disabled={!d.terkunci}
                  className="btn-violet min-h-[44px] rounded-xl px-4 text-xs disabled:opacity-40">📋 Salin jawaban</button>
                <button onClick={kosongkan} className="chip min-h-[44px] rounded-xl px-4 text-xs font-bold text-rose-300">Kosongkan</button>
              </div>
              {tersalin && <div className="mt-3 text-xs text-emerald-300">✓ Tersalin. Tempel di Google Classroom atau WhatsApp.</div>}
              <p className="mt-3 text-[11px] text-gray-500">
                💾 Isianmu tersimpan sementara di peramban ini. Berkas HTML dapat dibuka di peramban mana pun lalu dicetak menjadi PDF.
              </p>
            </section>
          </>
        )}

        <footer className="mt-10 border-t border-white/5 pt-6 text-center text-xs text-gray-500">
          LKPD Digital · data dari sensor sungguhan, bukan simulasi
        </footer>
      </main>
    </>
  )
}

// ══════════════════════════════════════════════════════════════
function Bagian({ nomor, judul, children }) {
  return (
    <section className="glass mt-4 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="display text-lg font-bold text-emerald-300">{nomor}</span>
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">{judul}</h2>
      </div>
      {children}
    </section>
  )
}

function Isian({ label, v, set, ph, kunci }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-gray-400">{label}</label>
      <input value={v} onChange={e => set(e.target.value)} placeholder={ph} disabled={kunci}
        className="min-h-[44px] w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-gray-200 outline-none focus:border-emerald-400/40 disabled:opacity-60" />
    </div>
  )
}

function Esai({ label, v, set }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs leading-relaxed text-gray-300">{label}</label>
      <textarea rows={3} value={v} onChange={e => set(e.target.value)} placeholder="Tulis jawabanmu di sini…"
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-200 outline-none focus:border-violet-400/40" />
    </div>
  )
}

function Metrik({ label, nilai, warna, juara }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
      <div className="display text-2xl font-bold" style={{ color: warna }}>{fmt(nilai, 2)}</div>
      {juara && <div className="mt-0.5 text-[11px] text-emerald-300">🏆 paling tepat</div>}
    </div>
  )
}

// Grafik sederhana: riwayat terlihat + (setelah dikunci) aktual, tebakan, Naive
function Grafik({ terlihat, warna, satuan, aktual, tebak, naive }) {
  const W = 640, H = 220, PAD = 34
  const nT = terlihat.length
  const total = nT + K
  const semua = [
    ...terlihat.map(t => t.nilai),
    ...(aktual || []), ...(tebak || []).filter(Number.isFinite), ...(naive || []),
  ].filter(Number.isFinite)
  let mn = Math.min(...semua), mx = Math.max(...semua)
  if (!Number.isFinite(mn) || mn === mx) { mn = (mn || 0) - 1; mx = (mx || 0) + 1 }
  const pad = (mx - mn) * 0.12
  mn -= pad; mx += pad

  const x = i => PAD + (i * (W - PAD * 2)) / Math.max(1, total - 1)
  const y = v => H - PAD - ((v - mn) / (mx - mn)) * (H - PAD * 2)
  const garis = (nilai, mulai) => nilai.map((v, i) => `${x(mulai + i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  const xPotong = x(nT - 1)

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[420px]">
        {[0, 0.5, 1].map((t, i) => {
          const yy = PAD + t * (H - PAD * 2), v = mx - t * (mx - mn)
          return (
            <g key={i}>
              <line x1={PAD} y1={yy} x2={W - PAD} y2={yy} stroke="rgba(255,255,255,0.07)" />
              <text x={2} y={yy + 3} fontSize="9" fill="#6b7280">{v.toFixed(0)}</text>
            </g>
          )
        })}
        {/* batas antara yang terlihat dan yang disembunyikan */}
        <line x1={xPotong} y1={PAD - 6} x2={xPotong} y2={H - PAD} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" />
        <text x={xPotong + 5} y={PAD - 8} fontSize="9" fill="#9ca3af">mulai diramalkan →</text>

        <polyline points={garis(terlihat.map(t => t.nilai), 0)} fill="none" stroke={warna} strokeWidth="2.5" />

        {naive && <polyline points={garis(naive, nT)} fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeDasharray="5 3" />}
        {tebak && tebak.every(Number.isFinite) && (
          <>
            <polyline points={garis(tebak, nT)} fill="none" stroke={warna} strokeWidth="2" strokeDasharray="2 3" />
            {tebak.map((v, i) => <circle key={i} cx={x(nT + i)} cy={y(v)} r="3.5" fill={warna} />)}
          </>
        )}
        {aktual && (
          <>
            <polyline points={garis(aktual, nT)} fill="none" stroke="#ffffff" strokeWidth="2.5" />
            {aktual.map((v, i) => <circle key={i} cx={x(nT + i)} cy={y(v)} r="3.5" fill="#ffffff" />)}
          </>
        )}
      </svg>
      <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="inline-block h-[2px] w-4" style={{ background: warna }} />riwayat ({satuan})</span>
        {tebak && <span className="flex items-center gap-1"><span className="inline-block h-[2px] w-4 border-t border-dashed" style={{ borderColor: warna }} />tebakanmu</span>}
        {naive && <span className="flex items-center gap-1"><span className="inline-block h-[2px] w-4 bg-gray-400" />Naive</span>}
        {aktual && <span className="flex items-center gap-1"><span className="inline-block h-[2px] w-4 bg-white" />aktual</span>}
      </div>
    </div>
  )
}
