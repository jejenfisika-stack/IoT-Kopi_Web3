'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { MODUL, KERANGKA, PROYEK, SKALA_RUBRIK } from './materi'

const LEVELS = ['S1', 'S2', 'S3']
const levelWarna = { S1: '#4ade80', S2: '#38bdf8', S3: '#a78bfa' }

const LABEL_TIPE = {
  mc: 'Pilihan ganda',
  'dua-tingkat': 'Dua tingkat',
  ganda: 'Jawaban ganda',
  urut: 'Urutkan',
  pasangan: 'Menjodohkan',
}

// ── Acak deterministik ────────────────────────────────────────
// Semua pengacakan diturunkan dari SATU benih milik mahasiswa yang tersimpan
// di localStorage. Akibatnya: urutan berbeda antar mahasiswa, tetapi tetap
// SAMA bagi mahasiswa yang sama walau halaman dimuat ulang — syarat mutlak
// agar jawaban tersimpan tidak tertukar.
function hashStr(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function acakTetap(n, seed) {
  const r = mulberry32(hashStr(String(seed)))
  const a = [...Array(n).keys()]
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
// Untuk soal "urutkan": pastikan tampilan awal tidak kebetulan sudah benar.
function acakBukanIdentitas(n, seed) {
  let a = acakTetap(n, seed)
  if (n > 1 && a.every((v, i) => v === i)) { const t = a[0]; a[0] = a[n - 1]; a[n - 1] = t }
  return a
}

// ── Penilaian otomatis ────────────────────────────────────────
export function nilaiSoal(s, j) {
  if (!j) return null
  switch (s.tipe) {
    case 'mc': {
      if (j.pilih == null) return null
      return { skor: j.pilih === s.jawab ? 1 : 0, kategori: j.pilih === s.jawab ? 'Benar' : 'Salah' }
    }
    case 'dua-tingkat': {
      if (j.pilih == null || j.pilihAlasan == null) return null
      const a = j.pilih === s.jawab, b = j.pilihAlasan === s.jawabAlasan
      const kategori = a && b ? 'Paham utuh' : a && !b ? 'Miskonsepsi'
        : !a && b ? 'Paham sebagian' : 'Tidak paham'
      return { skor: a && b ? 1 : a || b ? 0.5 : 0, kategori }
    }
    case 'ganda': {
      if (!j.cek) return null
      const dipilih = j.set || []
      const tepat = dipilih.filter(i => s.jawab.includes(i)).length
      const keliru = dipilih.filter(i => !s.jawab.includes(i)).length
      const skor = Math.max(0, (tepat - keliru) / s.jawab.length)
      return { skor, kategori: skor === 1 ? 'Lengkap' : skor > 0 ? 'Sebagian' : 'Belum tepat' }
    }
    case 'urut': {
      // Konkordansi berpasangan (Kendall) — menilai urutan RELATIF, bukan posisi
      // persis, sehingga satu langkah tergeser tidak menghanguskan seluruh skor.
      if (!j.cek) return null
      const u = j.urutan || []
      const n = s.langkah.length
      if (u.length !== n) return { skor: 0, kategori: 'tidak lengkap' }
      let konkordan = 0, total = 0
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) { total++; if (u[p] < u[q]) konkordan++ }
      const persis = u.filter((v, i) => v === i).length
      return {
        skor: total ? konkordan / total : 0,
        kategori: `${konkordan}/${total} urutan relatif benar · ${persis}/${n} posisi persis`,
      }
    }
    case 'pasangan': {
      if (!j.cek) return null
      const p = j.map || []
      const tepat = s.jawab.filter((v, i) => p[i] === v).length
      const n = s.jawab.length
      return { skor: n ? tepat / n : 0, kategori: `${tepat}/${n} pasangan tepat` }
    }
    default:
      return null
  }
}

export default function Belajar() {
  const [level, setLevel] = useState('Semua')
  const [selesai, setSelesai] = useState({})
  const [buka, setBuka] = useState({ 1: true })
  const [jawaban, setJawaban] = useState({})
  const [proyek, setProyek] = useState({})
  const [dimuat, setDimuat] = useState(false)
  const [nama, setNama] = useState('')
  const [seed, setSeed] = useState('')

  useEffect(() => {
    const baca = (k, fb) => { try { return JSON.parse(localStorage.getItem(k) || fb) } catch { return JSON.parse(fb) } }
    setSelesai(baca('belajar_selesai', '{}'))
    setJawaban(baca('belajar_jawaban', '{}'))
    setProyek(baca('belajar_proyek', '{}'))
    try { setNama(localStorage.getItem('belajar_nama') || '') } catch {}
    let s = ''
    try {
      s = localStorage.getItem('belajar_seed') || ''
      if (!s) {
        s = Math.random().toString(36).slice(2) + Date.now().toString(36)
        localStorage.setItem('belajar_seed', s)
      }
    } catch { s = 'default' }
    setSeed(s)
    setDimuat(true)
  }, [])

  // `patch` boleh objek, atau fungsi (jawabanLama) => tambahan. Bentuk fungsi wajib
  // dipakai bila nilai baru diturunkan dari nilai lama, agar klik beruntun yang
  // cepat tidak saling menimpa.
  function simpanJawab(key, patch) {
    setJawaban(prev => {
      const lama = prev[key] || {}
      const next = { ...prev, [key]: { ...lama, ...(typeof patch === 'function' ? patch(lama) : patch) } }
      try { localStorage.setItem('belajar_jawaban', JSON.stringify(next)) } catch {}
      return next
    })
  }

  function tandaiSelesai(no) {
    setSelesai(prev => {
      const next = { ...prev, [no]: !prev[no] }
      try { localStorage.setItem('belajar_selesai', JSON.stringify(next)) } catch {}
      return next
    })
  }

  function simpanProyek(i, v) {
    setProyek(prev => {
      const next = { ...prev, [i]: v }
      try { localStorage.setItem('belajar_proyek', JSON.stringify(next)) } catch {}
      return next
    })
  }

  function ubahNama(v) {
    setNama(v)
    try { localStorage.setItem('belajar_nama', v) } catch {}
  }

  // ── Rekap nilai ──
  const rekap = useMemo(() => {
    const baris = []
    for (const m of MODUL) {
      m.soal.forEach((s, i) => {
        baris.push({ modul: m.no, judul: m.judul, no: i + 1, s, hasil: nilaiSoal(s, jawaban[`${m.no}-${i}`]) })
      })
    }
    const dijawab = baris.filter(b => b.hasil)
    const jumlahSkor = dijawab.reduce((a, b) => a + b.hasil.skor, 0)
    const perIndikator = (kunci, daftar) => daftar.map(nm => {
      const sub = baris.filter(b => b.s[kunci] === nm)
      const subJawab = sub.filter(b => b.hasil)
      return {
        nama: nm, n: sub.length, nJawab: subJawab.length,
        // dihitung dari SELURUH soal indikator itu (belum dijawab = 0)
        skor: sub.length ? subJawab.reduce((a, b) => a + b.hasil.skor, 0) / sub.length : null,
      }
    })
    return {
      baris, total: baris.length, dijawab: dijawab.length,
      akurasi: dijawab.length ? jumlahSkor / dijawab.length : 0,   // dari yang dijawab saja
      nilaiAkhir: baris.length ? jumlahSkor / baris.length : 0,     // dari SELURUH soal
      ct: perIndikator('ct', KERANGKA.ct),
      ail: perIndikator('ail', KERANGKA.ail),
    }
  }, [jawaban])

  function unduhCSV() {
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
    const baris = [
      ['Nama', 'Modul', 'Judul modul', 'No soal', 'Level', 'Tipe', 'CT', 'AI Literacy', 'Skor', 'Kategori'].map(esc).join(','),
      ...rekap.baris.map(b => [
        nama || '(tanpa nama)', b.modul, b.judul, b.no, b.s.level,
        LABEL_TIPE[b.s.tipe] || b.s.tipe, b.s.ct, b.s.ail,
        b.hasil ? b.hasil.skor.toFixed(2) : '0.00',
        b.hasil ? b.hasil.kategori : 'Belum dijawab',
      ].map(esc).join(',')),
      '',
      esc('RINGKASAN'),
      [esc('Soal dijawab'), esc(`${rekap.dijawab}/${rekap.total}`)].join(','),
      [esc('NILAI AKHIR (dari seluruh soal)'), esc((rekap.nilaiAkhir * 100).toFixed(1) + '%')].join(','),
      [esc('Akurasi (dari yang dijawab saja)'), esc((rekap.akurasi * 100).toFixed(1) + '%')].join(','),
      '',
      esc('PER INDIKATOR CT (dari seluruh soal indikator)'),
      [esc('Indikator'), esc('Dijawab'), esc('Jumlah soal'), esc('Skor')].join(','),
      ...rekap.ct.map(x => [esc(x.nama), esc(x.nJawab), esc(x.n), esc(x.skor == null ? '-' : (x.skor * 100).toFixed(1) + '%')].join(',')),
      '',
      esc('PER INDIKATOR AI LITERACY (dari seluruh soal indikator)'),
      [esc('Dimensi'), esc('Dijawab'), esc('Jumlah soal'), esc('Skor')].join(','),
      ...rekap.ail.map(x => [esc(x.nama), esc(x.nJawab), esc(x.n), esc(x.skor == null ? '-' : (x.skor * 100).toFixed(1) + '%')].join(',')),
      '',
      esc('PENILAIAN DIRI PROYEK — BUKAN NILAI OTOMATIS, dinilai dosen'),
      [esc('Kriteria'), esc('Bobot (%)'), esc('Penilaian diri (1-4)')].join(','),
      ...PROYEK.rubrik.map((r, i) => [esc(r.kriteria), esc(r.bobot), esc(proyek[i] ?? '-')].join(',')),
    ]
    const csv = '﻿' + baris.join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `hasil-belajar_${(nama || 'mahasiswa').replace(/[^\w\-]+/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function ulangSemua() {
    if (!confirm('Hapus semua jawaban Anda pada halaman ini?')) return
    setJawaban({})
    setProyek({})
    try { localStorage.removeItem('belajar_jawaban'); localStorage.removeItem('belajar_proyek') } catch {}
  }

  const totalSelesai = Object.values(selesai).filter(Boolean).length

  return (
    <>
      <div className="bg-fx" aria-hidden="true">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      </div>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="chip px-3 py-1.5 text-xs font-bold text-gray-200 transition hover:text-white">← Dashboard</Link>
          <div className="chip px-3 py-1.5 text-[11px] font-bold text-emerald-300">Progres: {totalSelesai}/{MODUL.length} modul</div>
        </header>

        <section className="mb-8 text-center">
          <div className="chip mx-auto mb-4 inline-flex items-center gap-2 px-4 py-1.5 text-[11px] text-gray-300">📚 Mode Belajar · S1 · S2 · S3 Pendidikan IPA</div>
          <h1 className="display text-3xl font-bold text-white sm:text-4xl">
            Melatih <span className="grad-emerald">Computational Thinking</span> &amp; <span className="grad-violet">AI Literacy</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-400">
            Belajar dengan <b className="text-gray-200">melakukan langsung</b> di sistem Web3 nyata: dari merakit sensor,
            memproses data, melatih jaringan saraf (ANN), hingga menyimpan data terverifikasi di blockchain.
            Urutan soal dan pilihan jawaban <b className="text-gray-200">diacak untuk tiap mahasiswa</b>.
          </p>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="glass p-4">
            <div className="mb-2 text-sm font-bold text-emerald-300">🧠 Computational Thinking (CSTA)</div>
            <div className="flex flex-wrap gap-1.5">{KERANGKA.ct.map(x => <span key={x} className="chip px-2 py-0.5 text-[10px] text-gray-300">{x}</span>)}</div>
          </div>
          <div className="glass p-4">
            <div className="mb-2 text-sm font-bold text-violet-300">🤖 AI Literacy (Ng et al.)</div>
            <div className="flex flex-wrap gap-1.5">{KERANGKA.ail.map(x => <span key={x} className="chip px-2 py-0.5 text-[10px] text-gray-300">{x}</span>)}</div>
          </div>
        </section>

        {dimuat && <PanelNilai rekap={rekap} nama={nama} onNama={ubahNama} onUnduh={unduhCSV} onUlang={ulangSemua} />}

        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-500">Tingkat soal:</span>
          {['Semua', ...LEVELS].map(l => (
            <button key={l} onClick={() => setLevel(l)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${level === l ? 'btn-primary' : 'chip text-gray-300 hover:text-white'}`}>
              {l === 'Semua' ? 'Semua' : `${l} · ${l === 'S1' ? 'Memahami' : l === 'S2' ? 'Mengevaluasi' : 'Mencipta'}`}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {MODUL.map(m => (
            <ModulCard key={m.no} m={m} level={level} terbuka={!!buka[m.no]} dimuat={dimuat} seed={seed}
              jawaban={jawaban} onJawab={simpanJawab}
              onToggle={() => setBuka(p => ({ ...p, [m.no]: !p[m.no] }))}
              selesai={!!selesai[m.no]} onSelesai={() => tandaiSelesai(m.no)} />
          ))}
        </div>

        {dimuat && <PanelProyek nilai={proyek} onNilai={simpanProyek} />}

        <footer className="mt-10 border-t border-white/5 pt-6 text-center text-xs text-gray-500">
          Mode Belajar · Kerangka: CSTA Computational Thinking + AI Literacy (Ng et al.) ·{' '}
          <Link href="/" className="text-gray-400 underline hover:text-white">kembali ke Dashboard</Link>
        </footer>
      </main>
    </>
  )
}

// ══════════════════════════════════════════════════════════════
function PanelNilai({ rekap, nama, onNama, onUnduh, onUlang }) {
  return (
    <section className="glass mb-6 p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <div className="mono text-[11px] font-bold uppercase tracking-wider text-emerald-300">Nilai akhir</div>
            <div className="display text-4xl font-bold text-white">{(rekap.nilaiAkhir * 100).toFixed(0)}%</div>
            <div className="text-[11px] text-gray-500">dari seluruh {rekap.total} soal</div>
          </div>
          <div>
            <div className="mono text-[11px] font-bold uppercase tracking-wider text-gray-500">Akurasi</div>
            <div className="display text-2xl font-bold text-gray-300">{(rekap.akurasi * 100).toFixed(0)}%</div>
            <div className="text-[11px] text-gray-500">dari {rekap.dijawab} soal yang dijawab</div>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="nama-mhs" className="mb-1 block text-[11px] font-semibold text-gray-400">Nama / NIM</label>
            <input id="nama-mhs" value={nama} onChange={e => onNama(e.target.value)} placeholder="mis. Ani — 2201234"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-gray-200 outline-none focus:border-emerald-400/40" />
          </div>
          <button onClick={onUnduh} className="btn-primary rounded-lg px-4 py-2 text-xs">⬇ Unduh hasil (CSV)</button>
          <button onClick={onUlang} className="chip rounded-lg px-3 py-2 text-xs font-bold text-rose-300">Ulangi</button>
        </div>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${(rekap.dijawab / Math.max(1, rekap.total)) * 100}%` }} />
      </div>
      <div className="mt-1 text-[11px] text-gray-500">{rekap.dijawab} dari {rekap.total} soal dijawab</div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Indikator judul="🧠 Computational Thinking" data={rekap.ct} warna="#4ade80" />
        <Indikator judul="🤖 AI Literacy" data={rekap.ail} warna="#a78bfa" />
      </div>
      <p className="mt-3 text-[11px] text-gray-500">
        <b className="text-gray-400">Nilai akhir</b> menghitung soal yang belum dijawab sebagai 0 — inilah angka untuk penilaian.
        <b className="text-gray-400"> Akurasi</b> hanya mengukur ketepatan pada soal yang sudah dikerjakan.
        Skor tersimpan lokal di perangkat Anda; unduh CSV untuk dikumpulkan.
      </p>
    </section>
  )
}

function Indikator({ judul, data, warna }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <div className="mb-2 text-xs font-bold text-gray-200">{judul}</div>
      <div className="space-y-1.5">
        {data.map(x => (
          <div key={x.nama} className="flex items-center gap-2">
            <span className="w-32 shrink-0 truncate text-[11px] text-gray-400">{x.nama}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${x.skor == null ? 0 : x.skor * 100}%`, background: warna }} />
            </div>
            <span className="mono w-16 shrink-0 text-right text-[10px] text-gray-500">
              {x.skor == null ? '—' : `${(x.skor * 100).toFixed(0)}%`} ({x.nJawab}/{x.n})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
function PanelProyek({ nilai, onNilai }) {
  const [buka, setBuka] = useState(false)
  return (
    <section className="glass mt-4 overflow-hidden">
      <button onClick={() => setBuka(v => !v)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-white/[0.03]">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎓</span>
          <div>
            <div className="display font-bold text-white">{PROYEK.judul}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="chip px-1.5 py-0.5 text-[9px] text-amber-300">Dinilai dosen</span>
              <span className="chip px-1.5 py-0.5 text-[9px] text-violet-300">Mengukur &quot;Mencipta&quot; secara langsung</span>
            </div>
          </div>
        </div>
        <span className="shrink-0 text-gray-400">{buka ? '▲' : '▼'}</span>
      </button>

      {buka && (
        <div className="space-y-5 border-t border-white/5 px-5 py-5">
          <p className="text-sm leading-relaxed text-gray-300">{PROYEK.ringkas}</p>

          <div>
            <H>📋 Langkah pengerjaan</H>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-gray-300">
              {PROYEK.instruksi.map((t, i) => <li key={i}>{t}</li>)}
            </ol>
          </div>

          <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-xs text-amber-200">
            ⚠ {PROYEK.catatan}
          </div>

          <div>
            <H>📐 Rubrik analitik</H>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-left text-gray-400">
                    <th className="py-2 pr-3 font-semibold">Kriteria</th>
                    {SKALA_RUBRIK.map(s => (
                      <th key={s.n} className="py-2 pr-3 font-semibold">{s.n} — {s.label}</th>
                    ))}
                    <th className="py-2 font-semibold">Diri</th>
                  </tr>
                </thead>
                <tbody>
                  {PROYEK.rubrik.map((r, i) => (
                    <tr key={i} className="border-b border-white/5 align-top">
                      <td className="py-2 pr-3">
                        <div className="font-bold text-gray-100">{r.kriteria}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="chip px-1.5 py-0.5 text-[9px] text-emerald-300">{r.ct}</span>
                          <span className="chip px-1.5 py-0.5 text-[9px] text-violet-300">{r.ail}</span>
                          <span className="chip px-1.5 py-0.5 text-[9px] text-gray-400">{r.bobot}%</span>
                        </div>
                      </td>
                      {r.level.map((d, k) => (
                        <td key={k} className="py-2 pr-3 text-[11px] leading-relaxed text-gray-400">{d}</td>
                      ))}
                      <td className="py-2">
                        <select value={nilai[i] ?? ''} onChange={e => onNilai(i, e.target.value ? parseInt(e.target.value, 10) : '')}
                          aria-label={`Penilaian diri untuk ${r.kriteria}`}
                          className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-gray-200 outline-none focus:border-violet-400/40">
                          <option value="">—</option>
                          {SKALA_RUBRIK.map(s => <option key={s.n} value={s.n}>{s.n}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              Kolom <b className="text-gray-400">Diri</b> adalah penilaian diri Anda untuk refleksi. Nilai ini ikut terekspor
              ke CSV dengan penanda terpisah dan tidak memengaruhi nilai otomatis.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

// ══════════════════════════════════════════════════════════════
function ModulCard({ m, level, terbuka, dimuat, seed, jawaban, onJawab, onToggle, selesai, onSelesai }) {
  // Urutan soal diacak per mahasiswa; indeks ASLI tetap dipakai sebagai kunci
  // penyimpanan sehingga jawaban tidak pernah tertukar.
  const urutanSoal = useMemo(
    () => (seed ? acakTetap(m.soal.length, `${seed}|modul${m.no}`) : m.soal.map((_, i) => i)),
    [seed, m.no, m.soal.length])

  const soal = urutanSoal
    .map(i => ({ s: m.soal[i], i }))
    .filter(({ s }) => level === 'Semua' || s.level === level)

  return (
    <section className="glass overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-white/[0.03]">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{m.ikon}</span>
          <div>
            <div className="display font-bold text-white">Modul {m.no} — {m.judul}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {m.ct.map(x => <span key={x} className="chip px-1.5 py-0.5 text-[9px] text-emerald-300">{x}</span>)}
              {m.ail.map(x => <span key={x} className="chip px-1.5 py-0.5 text-[9px] text-violet-300">{x}</span>)}
            </div>
          </div>
        </div>
        <span className="shrink-0 text-gray-400">{selesai ? '✅' : ''} {terbuka ? '▲' : '▼'}</span>
      </button>

      {terbuka && (
        <div className="space-y-5 border-t border-white/5 px-5 py-5">
          <div>
            <H>🎯 Tujuan</H>
            <ul className="list-disc space-y-1 pl-5 text-sm text-gray-300">{m.tujuan.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </div>

          <div>
            <H>📖 Materi</H>
            <div className="space-y-2">
              {m.materi.map((x, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                  <div className="text-sm font-bold text-gray-100">{x.h}</div>
                  <div className="mt-1 text-sm leading-relaxed text-gray-400">{x.p}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <H>🧪 Aktivitas (lakukan di dApp)</H>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-gray-300">
              {m.aktivitas.map((a, i) => (
                <li key={i}>{a.teks}{' '}{a.link && <Link href={a.link} className="text-emerald-300 underline hover:text-emerald-200">Buka →</Link>}</li>
              ))}
            </ol>
          </div>

          <div>
            <H>📝 Soal &amp; Latihan {level !== 'Semua' && <span className="text-xs font-normal text-gray-500">(tingkat {level})</span>}</H>
            {!dimuat
              ? <div className="text-sm text-gray-500">Memuat soal…</div>
              : soal.length === 0
                ? <div className="text-sm text-gray-500">Tidak ada soal untuk tingkat ini di modul ini.</div>
                : <div className="space-y-3">
                    {soal.map(({ s, i }, urutTampil) => (
                      <Soal key={`${m.no}-${i}`} s={s} no={urutTampil + 1} qid={`${m.no}-${i}`} seed={seed}
                        nilai={jawaban[`${m.no}-${i}`]}
                        onJawab={isi => onJawab(`${m.no}-${i}`, isi)} />
                    ))}
                  </div>}
          </div>

          <button onClick={onSelesai} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${selesai ? 'chip text-emerald-300' : 'btn-primary'}`}>
            {selesai ? '✅ Selesai (klik untuk batal)' : 'Tandai modul selesai'}
          </button>
        </div>
      )}
    </section>
  )
}

// ══════════════════════════════════════════════════════════════
function Soal({ s, no, qid, seed, nilai, onJawab }) {
  const hasil = nilaiSoal(s, nilai)
  const props = { s, qid, seed, nilai, onJawab }

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="chip px-2 py-0.5 text-[10px] font-bold" style={{ color: levelWarna[s.level] }}>{s.level}</span>
        <span className="chip px-2 py-0.5 text-[10px] text-emerald-300">CT: {s.ct}</span>
        <span className="chip px-2 py-0.5 text-[10px] text-violet-300">AI: {s.ail}</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-gray-600">{LABEL_TIPE[s.tipe] || s.tipe}</span>
      </div>
      <div className="mb-3 text-sm font-semibold text-gray-100">{no}. {s.q}</div>

      {s.tipe === 'mc' && <TipeMC {...props} />}
      {s.tipe === 'dua-tingkat' && <TipeDuaTingkat {...props} />}
      {s.tipe === 'ganda' && <TipeGanda {...props} />}
      {s.tipe === 'urut' && <TipeUrut {...props} />}
      {s.tipe === 'pasangan' && <TipePasangan {...props} />}

      {hasil && (
        <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
          hasil.skor === 1 ? 'border-emerald-400/30 bg-emerald-400/5 text-emerald-200'
          : hasil.skor > 0 ? 'border-amber-400/30 bg-amber-400/5 text-amber-200'
          : 'border-rose-400/30 bg-rose-400/5 text-rose-200'}`}>
          <div className="mb-1 flex items-center gap-2">
            <b>{hasil.kategori}</b>
            <span className="mono ml-auto text-[10px] opacity-80">skor {(hasil.skor * 100).toFixed(0)}%</span>
          </div>
          {s.pembahasan}
        </div>
      )}
    </div>
  )
}

// `perm` memetakan posisi tampilan -> indeks ASLI. Nilai yang disimpan selalu
// indeks asli, sehingga pengacakan tidak pernah merusak jawaban tersimpan.
function OpsiList({ opsi, perm, pilih, jawab, terkunci, onPilih }) {
  return (
    <div className="space-y-1.5">
      {perm.map((asli, pos) => {
        const dipilih = pilih === asli
        const tampilBenar = terkunci && asli === jawab
        const tampilSalah = terkunci && dipilih && asli !== jawab
        return (
          <button key={asli} onClick={() => onPilih(asli)}
            className={`flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
              tampilBenar ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200'
              : tampilSalah ? 'border-rose-400/50 bg-rose-400/10 text-rose-200'
              : dipilih ? 'border-sky-400/40 bg-sky-400/10 text-sky-100'
              : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/20'}`}>
            <span className="shrink-0 text-gray-500">{String.fromCharCode(65 + pos)}.</span>
            <span className="flex-1">{opsi[asli]}</span>
            {tampilBenar && <span className="shrink-0">✓</span>}
            {tampilSalah && <span className="shrink-0">✗</span>}
          </button>
        )
      })}
    </div>
  )
}

function TipeMC({ s, qid, seed, nilai, onJawab }) {
  const perm = useMemo(() => acakTetap(s.opsi.length, `${seed}|${qid}|opsi`), [seed, qid, s.opsi.length])
  const pilih = nilai?.pilih ?? null
  return <OpsiList opsi={s.opsi} perm={perm} pilih={pilih} jawab={s.jawab} terkunci={pilih !== null}
    onPilih={i => onJawab({ pilih: i })} />
}

function TipeDuaTingkat({ s, qid, seed, nilai, onJawab }) {
  const permA = useMemo(() => acakTetap(s.opsi.length, `${seed}|${qid}|opsi`), [seed, qid, s.opsi.length])
  const permB = useMemo(() => acakTetap(s.alasan.length, `${seed}|${qid}|alasan`), [seed, qid, s.alasan.length])
  const pilih = nilai?.pilih ?? null
  const pilihAlasan = nilai?.pilihAlasan ?? null
  const lengkap = pilih !== null && pilihAlasan !== null
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">Tingkat 1 · Jawaban</div>
        <OpsiList opsi={s.opsi} perm={permA} pilih={pilih} jawab={s.jawab} terkunci={lengkap}
          onPilih={i => onJawab({ pilih: i })} />
      </div>
      <div>
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">Tingkat 2 · {s.alasanQ}</div>
        <OpsiList opsi={s.alasan} perm={permB} pilih={pilihAlasan} jawab={s.jawabAlasan} terkunci={lengkap}
          onPilih={i => onJawab({ pilihAlasan: i })} />
      </div>
    </div>
  )
}

function TipeGanda({ s, qid, seed, nilai, onJawab }) {
  const perm = useMemo(() => acakTetap(s.opsi.length, `${seed}|${qid}|opsi`), [seed, qid, s.opsi.length])
  const set = nilai?.set || []
  const cek = !!nilai?.cek
  const toggle = i => {
    if (cek) return
    onJawab(lama => {
      const s0 = lama.set || []
      return { set: s0.includes(i) ? s0.filter(x => x !== i) : [...s0, i], cek: false }
    })
  }
  return (
    <div className="space-y-1.5">
      {perm.map(asli => {
        const dipilih = set.includes(asli)
        const harusnya = s.jawab.includes(asli)
        const benar = cek && dipilih && harusnya
        const salah = cek && dipilih && !harusnya
        const terlewat = cek && !dipilih && harusnya
        return (
          <button key={asli} onClick={() => toggle(asli)} disabled={cek}
            className={`flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
              benar ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200'
              : salah ? 'border-rose-400/50 bg-rose-400/10 text-rose-200'
              : terlewat ? 'border-amber-400/40 bg-amber-400/5 text-amber-200'
              : dipilih ? 'border-sky-400/40 bg-sky-400/10 text-sky-100'
              : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/20'}`}>
            <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border text-[10px] ${dipilih ? 'border-sky-300 bg-sky-400/30' : 'border-white/25'}`}>
              {dipilih ? '✓' : ''}
            </span>
            <span className="flex-1">{s.opsi[asli]}</span>
            {terlewat && <span className="shrink-0 text-[10px]">terlewat</span>}
          </button>
        )
      })}
      {!cek && (
        <button onClick={() => onJawab(lama => ({ set: lama.set || [], cek: true }))} disabled={set.length === 0}
          className="btn-violet mt-1 rounded-lg px-4 py-2 text-xs disabled:opacity-40">Periksa jawaban</button>
      )}
    </div>
  )
}

function TipeUrut({ s, qid, seed, nilai, onJawab }) {
  const n = s.langkah.length
  const awal = useMemo(() => acakBukanIdentitas(n, `${seed}|${qid}|urut`), [n, seed, qid])
  const urutan = nilai?.urutan || awal
  const cek = !!nilai?.cek

  const geser = (i, arah) => {
    if (cek) return
    const j = i + arah
    if (j < 0 || j >= n) return
    onJawab(lama => {
      const next = [...(lama.urutan || awal)]
      ;[next[i], next[j]] = [next[j], next[i]]
      return { urutan: next, cek: false }
    })
  }

  return (
    <div className="space-y-1.5">
      {urutan.map((asli, i) => {
        const tepat = cek && asli === i
        return (
          <div key={asli}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              tepat ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200'
              : cek ? 'border-rose-400/40 bg-rose-400/5 text-rose-200'
              : 'border-white/10 bg-white/[0.03] text-gray-300'}`}>
            <span className="mono w-5 shrink-0 text-center text-xs text-gray-500">{i + 1}</span>
            <span className="flex-1">{s.langkah[asli]}</span>
            {cek
              ? <span className="shrink-0 text-xs">{tepat ? '✓' : `→ ${asli + 1}`}</span>
              : (
                <span className="flex shrink-0 flex-col gap-0.5">
                  <button onClick={() => geser(i, -1)} disabled={i === 0} aria-label="Naikkan"
                    className="rounded bg-white/5 px-1.5 text-[10px] leading-4 text-gray-300 hover:bg-white/15 disabled:opacity-25">▲</button>
                  <button onClick={() => geser(i, 1)} disabled={i === n - 1} aria-label="Turunkan"
                    className="rounded bg-white/5 px-1.5 text-[10px] leading-4 text-gray-300 hover:bg-white/15 disabled:opacity-25">▼</button>
                </span>
              )}
          </div>
        )
      })}
      {!cek && (
        <button onClick={() => onJawab(lama => ({ urutan: lama.urutan || awal, cek: true }))}
          className="btn-violet mt-1 rounded-lg px-4 py-2 text-xs">Periksa urutan</button>
      )}
      {cek && <div className="text-[11px] text-gray-500">Angka di kanan = posisi yang seharusnya. Skor dihitung dari urutan relatif antar langkah.</div>}
    </div>
  )
}

function TipePasangan({ s, qid, seed, nilai, onJawab }) {
  const permKiri = useMemo(() => acakTetap(s.kiri.length, `${seed}|${qid}|kiri`), [seed, qid, s.kiri.length])
  const permKanan = useMemo(() => acakTetap(s.kanan.length, `${seed}|${qid}|kanan`), [seed, qid, s.kanan.length])
  const map = nilai?.map || Array(s.kiri.length).fill(-1)
  const cek = !!nilai?.cek
  const lengkap = map.length === s.kiri.length && map.every(v => v >= 0)

  const set = (i, v) => {
    if (cek) return
    onJawab(lama => {
      const next = [...(lama.map || Array(s.kiri.length).fill(-1))]
      next[i] = v
      return { map: next, cek: false }
    })
  }

  return (
    <div className="space-y-1.5">
      {permKiri.map(asli => {
        const tepat = cek && map[asli] === s.jawab[asli]
        return (
          <div key={asli}
            className={`flex flex-col gap-2 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center ${
              tepat ? 'border-emerald-400/50 bg-emerald-400/10'
              : cek ? 'border-rose-400/40 bg-rose-400/5'
              : 'border-white/10 bg-white/[0.03]'}`}>
            <span className={`flex-1 ${cek ? (tepat ? 'text-emerald-200' : 'text-rose-200') : 'text-gray-300'}`}>{s.kiri[asli]}</span>
            <select value={map[asli] ?? -1} disabled={cek} onChange={e => set(asli, parseInt(e.target.value, 10))}
              aria-label={`Pasangan untuk ${s.kiri[asli]}`}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-gray-200 outline-none focus:border-emerald-400/40 disabled:opacity-70 sm:w-64">
              <option value={-1}>— pilih —</option>
              {permKanan.map(k => <option key={k} value={k}>{s.kanan[k]}</option>)}
            </select>
            {cek && !tepat && <span className="shrink-0 text-[11px] text-emerald-300">✓ {s.kanan[s.jawab[asli]]}</span>}
          </div>
        )
      })}
      {!cek && (
        <button onClick={() => onJawab(lama => ({ map: lama.map || map, cek: true }))} disabled={!lengkap}
          className="btn-violet mt-1 rounded-lg px-4 py-2 text-xs disabled:opacity-40">Periksa pasangan</button>
      )}
    </div>
  )
}

function H({ children }) {
  return <div className="mb-2 mono text-[11px] font-bold uppercase tracking-wider text-gray-400">{children}</div>
}
