'use client'

// Grafik garis (tema gelap): riwayat (garis solid) + forecast (garis putus-putus).
// Props: history[], forecast[], color, unit, title, emoji
export default function MetricChart({ history = [], forecast = [], color = '#4ade80', unit = '', title = '', emoji = '' }) {
  const W = 520, H = 200, PAD = 34
  const all = [...history, ...forecast].filter(Number.isFinite)
  if (all.length < 2) {
    return (
      <div className="glass p-4">
        <div className="mb-2 text-sm font-bold text-gray-200">{emoji} {title}</div>
        <div className="flex h-[160px] items-center justify-center text-sm text-gray-500">
          Data belum cukup untuk grafik
        </div>
      </div>
    )
  }

  let min = Math.min(...all), max = Math.max(...all)
  if (min === max) { min -= 1; max += 1 }
  const pad = (max - min) * 0.12
  min -= pad; max += pad

  const total = history.length + forecast.length
  const x = i => PAD + (i * (W - PAD * 2)) / Math.max(1, total - 1)
  const y = v => H - PAD - ((v - min) / (max - min)) * (H - PAD * 2)

  const histPts = history.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const startIdx = history.length - 1
  const fcPts = forecast.map((v, i) => `${x(startIdx + 1 + i).toFixed(1)},${y(v).toFixed(1)}`)
  const fcLine = history.length
    ? [`${x(startIdx).toFixed(1)},${y(history[startIdx]).toFixed(1)}`, ...fcPts].join(' ')
    : fcPts.join(' ')

  const gridY = [0, 0.25, 0.5, 0.75, 1].map(t => ({ v: max - t * (max - min), yy: PAD + t * (H - PAD * 2) }))
  const gid = `grad-${title.replace(/\W/g, '')}`

  return (
    <div className="glass glass-hover p-4">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-sm font-bold text-gray-200">{emoji} {title}</div>
        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-1"><span className="inline-block h-[2px] w-4" style={{ background: color }} />Riwayat</span>
          <span className="flex items-center gap-1"><span className="inline-block h-[2px] w-4 border-t-2 border-dashed" style={{ borderColor: color }} />Prediksi</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridY.map((g, i) => (
          <g key={i}>
            <line x1={PAD} y1={g.yy} x2={W - PAD} y2={g.yy} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            <text x={4} y={g.yy + 3} fontSize="9" fill="#6b7280" className="mono">{g.v.toFixed(0)}</text>
          </g>
        ))}
        {history.length > 1 && (
          <polygon
            points={`${histPts} ${x(startIdx).toFixed(1)},${(H - PAD).toFixed(1)} ${x(0).toFixed(1)},${(H - PAD).toFixed(1)}`}
            fill={`url(#${gid})`} stroke="none"
          />
        )}
        {forecast.length > 0 && history.length > 0 && (
          <line x1={x(startIdx)} y1={PAD} x2={x(startIdx)} y2={H - PAD} stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3,3" />
        )}
        <polyline points={histPts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {forecast.length > 0 && (
          <polyline points={fcLine} fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="6,4" strokeLinejoin="round" opacity="0.9" />
        )}
        {history.map((v, i) => <circle key={`h${i}`} cx={x(i)} cy={y(v)} r="2.2" fill={color} />)}
        {forecast.map((v, i) => <circle key={`f${i}`} cx={x(startIdx + 1 + i)} cy={y(v)} r="2.6" fill="#0a0e1a" stroke={color} strokeWidth="1.6" />)}
      </svg>
      <div className="mt-1 text-right text-[11px] text-gray-500">satuan: {unit}</div>
    </div>
  )
}
