'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MODUL, KERANGKA } from './materi'

const LEVELS = ['S1', 'S2', 'S3']
const levelWarna = { S1: '#4ade80', S2: '#38bdf8', S3: '#a78bfa' }

export default function Belajar() {
  const [level, setLevel] = useState('Semua')
  const [selesai, setSelesai] = useState({})
  const [buka, setBuka] = useState({ 1: true })

  useEffect(() => {
    try { setSelesai(JSON.parse(localStorage.getItem('belajar_selesai') || '{}')) } catch {}
  }, [])

  function tandaiSelesai(no) {
    setSelesai(prev => {
      const next = { ...prev, [no]: !prev[no] }
      try { localStorage.setItem('belajar_selesai', JSON.stringify(next)) } catch {}
      return next
    })
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
            Tiap materi &amp; soal dipetakan ke indikator CT dan AI Literacy.
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
            <ModulCard key={m.no} m={m} level={level} terbuka={!!buka[m.no]}
              onToggle={() => setBuka(p => ({ ...p, [m.no]: !p[m.no] }))}
              selesai={!!selesai[m.no]} onSelesai={() => tandaiSelesai(m.no)} />
          ))}
        </div>

        <footer className="mt-10 border-t border-white/5 pt-6 text-center text-xs text-gray-500">
          Mode Belajar · Kerangka: CSTA Computational Thinking + AI Literacy (Ng et al.) ·{' '}
          <Link href="/" className="text-gray-400 underline hover:text-white">kembali ke Dashboard</Link>
        </footer>
      </main>
    </>
  )
}

function ModulCard({ m, level, terbuka, onToggle, selesai, onSelesai }) {
  const soal = m.soal.filter(s => level === 'Semua' || s.level === level)
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
            {soal.length === 0
              ? <div className="text-sm text-gray-500">Tidak ada soal untuk tingkat ini di modul ini.</div>
              : <div className="space-y-3">{soal.map((s, i) => <Soal key={i} s={s} no={i + 1} />)}</div>}
          </div>

          <button onClick={onSelesai} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${selesai ? 'chip text-emerald-300' : 'btn-primary'}`}>
            {selesai ? '✅ Selesai (klik untuk batal)' : 'Tandai modul selesai'}
          </button>
        </div>
      )}
    </section>
  )
}

function Soal({ s, no }) {
  const [pilih, setPilih] = useState(null)
  const [jawabEsai, setJawabEsai] = useState('')
  const benar = s.tipe === 'mc' && pilih === s.jawab

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="chip px-2 py-0.5 text-[10px] font-bold" style={{ color: levelWarna[s.level] }}>{s.level}</span>
        <span className="chip px-2 py-0.5 text-[10px] text-emerald-300">CT: {s.ct}</span>
        <span className="chip px-2 py-0.5 text-[10px] text-violet-300">AI: {s.ail}</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-gray-600">{s.tipe === 'mc' ? 'Pilihan ganda' : 'Esai/Refleksi'}</span>
      </div>
      <div className="mb-3 text-sm font-semibold text-gray-100">{no}. {s.q}</div>

      {s.tipe === 'mc' ? (
        <div className="space-y-1.5">
          {s.opsi.map((o, i) => {
            const dipilih = pilih === i
            const tampilBenar = pilih !== null && i === s.jawab
            const tampilSalah = dipilih && i !== s.jawab
            return (
              <button key={i} onClick={() => setPilih(i)}
                className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                  tampilBenar ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200'
                  : tampilSalah ? 'border-rose-400/50 bg-rose-400/10 text-rose-200'
                  : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/20'}`}>
                <span className="text-gray-500">{String.fromCharCode(65 + i)}.</span> {o}
                {tampilBenar && <span className="ml-auto">✓</span>}
                {tampilSalah && <span className="ml-auto">✗</span>}
              </button>
            )
          })}
          {pilih !== null && (
            <div className={`mt-2 rounded-lg border px-3 py-2 text-xs ${benar ? 'border-emerald-400/30 bg-emerald-400/5 text-emerald-200' : 'border-amber-400/30 bg-amber-400/5 text-amber-200'}`}>
              <b>{benar ? 'Benar! ' : 'Belum tepat. '}</b>{s.pembahasan}
            </div>
          )}
        </div>
      ) : (
        <div>
          <textarea value={jawabEsai} onChange={e => setJawabEsai(e.target.value)} rows={3}
            placeholder="Tulis jawaban / refleksi Anda di sini…"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-200 outline-none focus:border-violet-400/40" />
          <div className="mt-1 text-[11px] text-gray-500">Soal esai dinilai dosen — gunakan indikator di atas sebagai rubrik.</div>
        </div>
      )}
    </div>
  )
}

function H({ children }) {
  return <div className="mb-2 mono text-[11px] font-bold uppercase tracking-wider text-gray-400">{children}</div>
}
