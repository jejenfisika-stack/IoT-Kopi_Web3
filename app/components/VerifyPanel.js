'use client'

import { useEffect, useState } from 'react'

const short = a => (a ? `${a.slice(0, 10)}...${a.slice(-8)}` : '—')

export default function VerifyPanel({ t, forecast, contractAddr, explorer }) {
  const v = t.verify
  const [open, setOpen] = useState(false)
  const [teks, setTeks] = useState('entry 9299: 30.8,49,37')
  const [hash, setHash] = useState('')

  // Hitung SHA-256 secara live setiap teks berubah (demonstrasi avalanche effect)
  useEffect(() => {
    let batal = false
    ;(async () => {
      const buf = new TextEncoder().encode(teks)
      const d = await crypto.subtle.digest('SHA-256', buf)
      const h = Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join('')
      if (!batal) setHash(h)
    })()
    return () => { batal = true }
  }, [teks])

  const suhu = forecast?.sumber === 'lokal' ? forecast.suhu : null
  const metodePer = forecast?.metodePer || null  // {suhu,udara,tanah} bila sumber HF
  const Arrow = () => <span className="select-none text-gray-600">→</span>

  return (
    <section className="mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="glass glass-hover flex w-full items-center justify-between px-5 py-3 text-left">
        <span className="display text-base font-bold text-white">{open ? v.title : v.toggle}</span>
        <span className="chip px-2.5 py-1 text-[11px] font-bold text-gray-300">{open ? v.toggleClose + ' ▲' : '▼'}</span>
      </button>

      {open && (
        <div className="glass mt-3 space-y-6 p-5 sm:p-6">
          <p className="text-xs text-gray-400">{v.subtitle}</p>

          {/* ── Pipeline ── */}
          <div>
            <div className="mb-2 mono text-[10px] uppercase tracking-wider text-gray-500">{v.pipeline}</div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <PipeStep emoji="📡" title={v.stepSensor} desc={v.stepSensorD} c="#38bdf8" /><Arrow />
              <PipeStep emoji="🔑" title={v.stepHash} desc={v.stepHashD} c="#fbbf24" /><Arrow />
              <PipeStep emoji="📦" title={v.stepIPFS} desc={v.stepIPFSD} c="#a78bfa" /><Arrow />
              <PipeStep emoji="⛓️" title={v.stepChain} desc={v.stepChainD} c="#4ade80" />
            </div>
          </div>

          {/* ── 1. Bukti kriptografis ── */}
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <h4 className="mb-1 font-bold text-amber-300">{v.hashTitle}</h4>
            <p className="mb-3 text-xs text-gray-400">{v.hashDesc}</p>
            <label className="mb-1 block text-[11px] font-semibold text-gray-400">{v.hashInput}</label>
            <input
              value={teks} onChange={e => setTeks(e.target.value)}
              className="mono w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-emerald-200 outline-none focus:border-amber-400/50"
            />
            <div className="mt-2 text-[11px] font-semibold text-gray-400">{v.hashOutput}</div>
            <div className="mono mt-1 break-all rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-200">
              {hash}
            </div>
            <p className="mt-2 text-[11px] text-gray-500">{v.hashHint}</p>
          </div>

          {/* ── 2. Rumus forecasting ── */}
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <h4 className="mb-1 font-bold text-emerald-300">{v.formulaTitle}</h4>
            <p className="mb-3 text-xs text-gray-400">{v.formulaDesc}</p>
            <div className="mono mb-3 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-3 text-center text-base text-emerald-200">
              ŷ = a + b·x
            </div>
            {suhu && Number.isFinite(suhu.slope) && (
              <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
                <MiniBox label={v.intercept} val={Number(suhu.intercept ?? 0).toFixed(2)} />
                <MiniBox label={v.slope} val={Number(suhu.slope).toFixed(4)} />
                <MiniBox label="R²" val={Number(suhu.r2).toFixed(3)} />
              </div>
            )}
            <ul className="space-y-1 text-[11px] text-gray-400">
              <li>• {v.formulaR2}</li>
              <li>• {v.formulaMape}</li>
            </ul>
          </div>

          {/* ── Model yang dipakai (Linear / Naive / Prophet) ── */}
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <h4 className="mb-1 font-bold text-sky-300">{v.models}</h4>
            <p className="mb-3 text-xs text-gray-400">{v.modelsDesc}</p>
            <div className="space-y-2">
              {[
                { key: 'Linear',  nama: v.mLinear,  desc: v.mLinearD,  c: '#fb7185' },
                { key: 'Naive',   nama: v.mNaive,   desc: v.mNaiveD,   c: '#9ca3af' },
                { key: 'Prophet', nama: v.mProphet, desc: v.mProphetD, c: '#4ade80' },
              ].map(m => {
                const dipakai = metodePer ? Object.entries(metodePer).filter(([, mm]) => mm === m.key).map(([vv]) => vv) : []
                return (
                  <div key={m.key} className="rounded-lg border border-white/8 bg-black/20 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold" style={{ color: m.c }}>{m.nama}</span>
                      {dipakai.length > 0 && (
                        <span className="chip px-2 py-0.5 text-[10px] text-gray-300">{v.usedFor}: {dipakai.join(', ')}</span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{m.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── 3. On-chain ── */}
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
            <h4 className="mb-1 font-bold text-violet-300">{v.onchainTitle}</h4>
            <p className="mb-2 text-xs text-gray-400">{v.onchainDesc}</p>
            <div className="mono mb-2 rounded-lg border border-violet-400/20 bg-violet-400/5 px-3 py-2 text-[11px] text-violet-200">
              {v.onchainStored}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
              <span>{v.contractLabel}</span>
              <span className="mono text-gray-300">{short(contractAddr)}</span>
              {contractAddr && (
                <a href={`${explorer}/address/${contractAddr}`} target="_blank" rel="noreferrer"
                  className="text-violet-300 underline hover:text-violet-200">{v.viewExplorer}</a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function PipeStep({ emoji, title, desc, c }) {
  return (
    <div className="min-w-[120px] flex-1 rounded-xl border border-white/8 bg-white/[0.03] p-2.5">
      <div className="flex items-center gap-1.5">
        <span>{emoji}</span>
        <span className="font-bold" style={{ color: c }}>{title}</span>
      </div>
      <div className="mt-0.5 text-[10px] leading-tight text-gray-500">{desc}</div>
    </div>
  )
}

function MiniBox({ label, val }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/5 p-2">
      <div className="mono text-sm font-bold text-gray-100">{val}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  )
}
