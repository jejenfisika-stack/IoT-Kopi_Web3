'use client'

// ============================================================
//  /tes — Pre-test & Post-test (instrumen pengukuran)
//
//  BEDA dari /belajar: halaman ini MENGUKUR, bukan melatih.
//  Karena itu tidak ada umpan balik per butir, tidak ada pembahasan, dan
//  hasilnya dikirim ke server (bukan sekadar tersimpan di perangkat).
//  Bank soalnya pun terpisah dari kuis latihan supaya tidak ada kebocoran.
// ============================================================

import { useState } from 'react'
import Link from 'next/link'
import { SOAL_PP, DIM_PP, SUBSKALA } from '../data/soalPrePost'

const MAKS = 25

function acak(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Menyiapkan set soal teracak: urutan butir diacak DAN urutan opsi tiap butir
// diacak, sambil melacak indeks asli agar penskoran tetap benar.
function siapkanSoal(form) {
  const bank = form === 'post' ? SOAL_PP.B : SOAL_PP.A
  return acak(bank.map((q, i) => ({ q, iAsli: i }))).map(({ q, iAsli }) => {
    const urutan = acak(q.opts.map((_, i) => i))     // posisi tampil → indeks asli
    return {
      iAsli, dim: q.dim, bloom: q.bloom, teks: q.teks,
      opts: urutan.map(i => q.opts[i]),
      asli: urutan,
      jwbAsli: q.jwb,
    }
  })
}

export default function Tes() {
  const [tahap, setTahap]   = useState('mulai')   // mulai · kerjakan · selesai
  const [form, setForm]     = useState('pre')
  const [nama, setNama]     = useState('')
  const [nim, setNim]       = useState('')
  const [kelas, setKelas]   = useState('')
  const [soal, setSoal]     = useState([])
  const [jawab, setJawab]   = useState({})        // idxTampil → indeks opsi tampil
  const [kirim, setKirim]   = useState(false)
  const [hasil, setHasil]   = useState(null)
  const [pesan, setPesan]   = useState('')

  const terjawab = Object.keys(jawab).length

  function mulai() {
    if (!nama.trim() || !nim.trim()) { setPesan('Nama dan NIM wajib diisi.'); return }
    setPesan('')
    setSoal(siapkanSoal(form))
    setJawab({})
    setTahap('kerjakan')
    window.scrollTo(0, 0)
  }

  function pilih(idx, opsiTampil) {
    setJawab(prev => ({ ...prev, [idx]: opsiTampil }))
  }

  function hitung() {
    let skor = 0
    const perDim = {}, perSub = { CT: 0, AIL: 0 }
    Object.keys(DIM_PP).forEach(d => { perDim[d] = 0 })
    const rincian = []

    soal.forEach((s, idx) => {
      const tampil = jawab[idx]
      const dipilihAsli = tampil == null ? -1 : s.asli[tampil]
      const benar = dipilihAsli === s.jwbAsli ? 1 : 0
      if (benar) {
        skor += 1
        perDim[s.dim] += 1
        perSub[DIM_PP[s.dim].sub] += 1
      }
      rincian.push({ i: s.iAsli, j: dipilihAsli, b: benar })
    })
    return { skor, perDim, perSub, rincian }
  }

  async function selesaikan() {
    if (terjawab < soal.length) {
      const sisa = soal.length - terjawab
      if (!confirm(`Masih ada ${sisa} soal yang belum dijawab. Kirim sekarang?`)) return
    }
    setKirim(true); setPesan('')
    const { skor, perDim, perSub, rincian } = hitung()

    let balasan = null
    try {
      const res = await fetch('/api/simpan-hasil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama, nim, kelas, form, skor, maks: MAKS,
          perDim, perSub, jawaban: rincian,
        }),
      })
      balasan = await res.json().catch(() => null)
      if (!res.ok) {
        setPesan(balasan?.error || 'Hasil belum tersimpan ke server. Simpan tangkapan layar halaman ini sebagai bukti.')
      } else if (balasan?.status === 'duplicate') {
        setPesan(`NIM ${nim} sudah pernah mengerjakan tes ${form === 'pre' ? 'awal' : 'akhir'}. Hasil kali ini tidak disimpan lagi.`)
      } else if (balasan?.status === 'error') {
        setPesan(balasan?.message || 'Server menolak penyimpanan.')
      }
    } catch {
      setPesan('Tidak dapat menghubungi server. Simpan tangkapan layar halaman ini sebagai bukti.')
    }

    setHasil({ skor, perDim, perSub, server: balasan })
    setKirim(false)
    setTahap('selesai')
    window.scrollTo(0, 0)
  }

  return (
    <>
      <div className="bg-fx" aria-hidden="true"><div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" /></div>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/belajar" className="chip inline-flex min-h-[44px] items-center px-4 text-xs font-bold text-gray-200 transition hover:text-white">← Mode Belajar</Link>
          {tahap === 'kerjakan' && (
            <div className="chip px-4 py-2 text-[11px] font-bold text-emerald-300">{terjawab}/{soal.length} dijawab</div>
          )}
        </header>

        {tahap === 'mulai' && (
          <MulaiPanel {...{ form, setForm, nama, setNama, nim, setNim, kelas, setKelas, mulai, pesan }} />
        )}

        {tahap === 'kerjakan' && (
          <>
            <div className="glass mb-4 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-bold text-white">
                  {form === 'pre' ? 'Tes Awal (Pre-test)' : 'Tes Akhir (Post-test)'}
                </div>
                <div className="mono text-[11px] text-gray-500">{nama} · {nim}</div>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${(terjawab / Math.max(1, soal.length)) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-3">
              {soal.map((s, idx) => (
                <div key={idx} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="chip px-2 py-0.5 text-[10px] font-bold text-gray-400">{idx + 1}</span>
                    {jawab[idx] != null && <span className="text-[10px] text-emerald-400">✓ terjawab</span>}
                  </div>
                  <div className="mb-3 text-sm font-semibold leading-relaxed text-gray-100">{s.teks}</div>
                  <div className="space-y-2">
                    {s.opts.map((o, i) => {
                      const dipilih = jawab[idx] === i
                      return (
                        <button key={i} onClick={() => pilih(idx, i)}
                          className={`flex w-full min-h-[44px] items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                            dipilih
                              ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-100'
                              : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/25'}`}>
                          <span className="shrink-0 text-gray-500">{String.fromCharCode(65 + i)}.</span>
                          <span className="flex-1">{o}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {pesan && <div className="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{pesan}</div>}

            <button onClick={selesaikan} disabled={kirim}
              className="btn-primary mt-5 w-full rounded-xl px-5 py-3 text-sm disabled:opacity-50">
              {kirim ? 'Mengirim…' : 'Selesai & kirim jawaban'}
            </button>
            <p className="mt-2 text-center text-[11px] text-gray-500">
              Jawaban tidak dapat diubah setelah dikirim. Tes ini tidak menampilkan pembahasan.
            </p>
          </>
        )}

        {tahap === 'selesai' && hasil && <HasilPanel hasil={hasil} form={form} nama={nama} nim={nim} pesan={pesan} />}

        <footer className="mt-10 border-t border-white/5 pt-6 text-center text-xs text-gray-500">
          Instrumen pengukuran · CSTA Computational Thinking + AI Literacy (Ng et al.)
        </footer>
      </main>
    </>
  )
}

// ══════════════════════════════════════════════════════════════
function MulaiPanel({ form, setForm, nama, setNama, nim, setNim, kelas, setKelas, mulai, pesan }) {
  return (
    <>
      <section className="mb-6 text-center">
        <div className="chip mx-auto mb-4 inline-flex items-center gap-2 px-4 py-1.5 text-[11px] text-gray-300">📋 Instrumen Pengukuran</div>
        <h1 className="display text-3xl font-bold text-white sm:text-4xl">
          Tes <span className="grad-emerald">Computational Thinking</span> &amp; <span className="grad-violet">AI Literacy</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-gray-400">
          25 soal pilihan ganda. Urutan soal dan pilihan jawaban diacak untuk tiap peserta.
          Tes ini <b className="text-gray-200">tidak menampilkan pembahasan</b> dan hanya dapat dikerjakan satu kali per NIM.
        </p>
      </section>

      <section className="glass p-5">
        <div className="mb-4">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Jenis tes</div>
          <div className="grid grid-cols-2 gap-2">
            {[['pre', 'Tes Awal', 'sebelum pembelajaran'], ['post', 'Tes Akhir', 'sesudah pembelajaran']].map(([v, t, k]) => (
              <button key={v} onClick={() => setForm(v)}
                className={`min-h-[44px] rounded-xl border px-3 py-2 text-left transition ${
                  form === v ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}>
                <div className={`text-sm font-bold ${form === v ? 'text-emerald-200' : 'text-gray-200'}`}>{t}</div>
                <div className="text-[11px] text-gray-500">{k}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Isian label="Nama lengkap" value={nama} set={setNama} ph="mis. Ani Rahmawati" />
          <Isian label="NIM" value={nim} set={setNim} ph="mis. 2201234" />
          <Isian label="Kelas (opsional)" value={kelas} set={setKelas} ph="mis. S1-IPA-A" />
        </div>

        {pesan && <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{pesan}</div>}

        <button onClick={mulai} className="btn-primary mt-5 w-full rounded-xl px-5 py-3 text-sm">Mulai mengerjakan</button>

        <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/5 px-3 py-2.5 text-[11px] leading-relaxed text-amber-200/90">
          NIM dipakai sebagai penanda peserta dan untuk memasangkan tes awal dengan tes akhir saat menghitung N-gain.
          Satu NIM hanya dapat mengerjakan satu kali untuk tiap jenis tes.
        </div>
      </section>
    </>
  )
}

function Isian({ label, value, set, ph }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-gray-400">{label}</label>
      <input value={value} onChange={e => set(e.target.value)} placeholder={ph}
        className="min-h-[44px] w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-gray-200 outline-none focus:border-emerald-400/40" />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
function HasilPanel({ hasil, form, nama, nim, pesan }) {
  const { skor, perDim, perSub, server } = hasil
  const persen = Math.round((skor / MAKS) * 100)
  const tersimpan = server?.status === 'ok'

  return (
    <section className="glass p-5">
      <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
        {form === 'pre' ? 'Tes Awal selesai' : 'Tes Akhir selesai'}
      </div>
      <div className="flex items-baseline gap-3">
        <span className="display text-5xl font-bold text-white">{skor}</span>
        <span className="text-lg text-gray-500">/ {MAKS}</span>
        <span className="ml-auto text-sm text-gray-400">{persen}%</span>
      </div>
      <div className="mt-1 text-xs text-gray-500">{nama} · {nim}</div>

      <div className={`mt-4 rounded-xl border px-3 py-2.5 text-xs ${
        tersimpan ? 'border-emerald-400/30 bg-emerald-400/5 text-emerald-200'
                  : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>
        {tersimpan ? '✓ Hasil sudah tersimpan ke server.' : `⚠ ${pesan || 'Hasil belum tentu tersimpan.'}`}
      </div>

      {server?.ngain != null && (
        <div className="mt-3 rounded-xl border border-violet-400/30 bg-violet-400/5 px-3 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-violet-300">Peningkatan (N-gain)</div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="display text-3xl font-bold text-white">{Number(server.ngain).toFixed(2)}</span>
            <span className="text-sm text-violet-200">{server.kategori}</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-500">Skor tes awal: {server.skorPre} / {MAKS}</div>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Object.entries(SUBSKALA).map(([k, def]) => (
          <div key={k} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-xs font-bold text-gray-200">{def.label}</span>
              <span className="mono text-xs" style={{ color: def.warna }}>{perSub[k]}/{def.max}</span>
            </div>
            <div className="mb-2 text-[10px] text-gray-500">{def.ket}</div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${(perSub[k] / def.max) * 100}%`, background: def.warna }} />
            </div>
            <div className="mt-3 space-y-1.5">
              {Object.entries(DIM_PP).filter(([, d]) => d.sub === k).map(([kode, d]) => (
                <div key={kode} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 truncate text-[11px] text-gray-400">{d.label}</span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full" style={{ width: `${(perDim[kode] / d.max) * 100}%`, background: def.warna }} />
                  </div>
                  <span className="mono w-8 shrink-0 text-right text-[10px] text-gray-500">{perDim[kode]}/{d.max}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-gray-500">
        Rincian per dimensi ditampilkan sebagai umpan balik capaian, bukan kunci jawaban.
        Pembahasan tiap butir sengaja tidak ditampilkan agar instrumen tetap dapat dipakai pada tes berikutnya.
      </p>

      <Link href="/belajar" className="btn-primary mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl px-5 text-sm">
        Kembali ke Mode Belajar
      </Link>
    </section>
  )
}
