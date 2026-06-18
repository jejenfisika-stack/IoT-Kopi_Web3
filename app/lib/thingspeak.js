// ============================================================
//  ThingSpeak — ambil & agregasi data sensor
// ============================================================
import { THINGSPEAK } from './config'

const BASE = 'https://api.thingspeak.com'

function buildUrl(path, params = {}) {
  const url = new URL(`${BASE}${path}`)
  if (THINGSPEAK.readApiKey) url.searchParams.set('api_key', THINGSPEAK.readApiKey)
  url.searchParams.set('timezone', THINGSPEAK.timezone)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return url.toString()
}

// Ambil N pembacaan terakhir (data mentah).
export async function ambilFeeds({ results = 8000, days } = {}) {
  const params = days ? { days } : { results }
  const res = await fetch(buildUrl(`/channels/${THINGSPEAK.channelId}/feeds.json`, params), { cache: 'no-store' })
  if (!res.ok) throw new Error(`ThingSpeak gagal: ${res.status}`)
  const json = await res.json()
  return {
    channel: json.channel,
    feeds: (json.feeds || []).map(f => ({
      waktu: f.created_at,
      entryId: f.entry_id,
      suhu:  parseFloat(f[THINGSPEAK.fields.suhu]),
      udara: parseFloat(f[THINGSPEAK.fields.udara]),
      tanah: parseFloat(f[THINGSPEAK.fields.tanah]),
    })).filter(f => Number.isFinite(f.suhu) || Number.isFinite(f.udara) || Number.isFinite(f.tanah)),
  }
}

// Pembacaan terakhir (untuk kartu "live").
export async function ambilTerbaru() {
  const { channel, feeds } = await ambilFeeds({ results: 1 })
  return { channel, terbaru: feeds[feeds.length - 1] || null }
}

// Ambil bagian tanggal "YYYY-MM-DD" dari string waktu ThingSpeak (sudah dlm timezone lokal).
function tanggalDari(waktu) {
  return String(waktu).slice(0, 10)
}

function statistik(arr) {
  const v = arr.filter(Number.isFinite)
  if (v.length === 0) return null
  const sum = v.reduce((a, b) => a + b, 0)
  return {
    avg: sum / v.length,
    min: Math.min(...v),
    max: Math.max(...v),
    n: v.length,
  }
}

// Agregasi feeds menjadi ringkasan per hari.
// Hasil: array { tanggal:'YYYY-MM-DD', tanggalNum:YYYYMMDD, suhu:{avg,min,max,n}, udara, tanah, jumlahData }
export function agregasiHarian(feeds) {
  const perHari = new Map()
  for (const f of feeds) {
    const t = tanggalDari(f.waktu)
    if (!perHari.has(t)) perHari.set(t, { suhu: [], udara: [], tanah: [] })
    const g = perHari.get(t)
    if (Number.isFinite(f.suhu))  g.suhu.push(f.suhu)
    if (Number.isFinite(f.udara)) g.udara.push(f.udara)
    if (Number.isFinite(f.tanah)) g.tanah.push(f.tanah)
  }

  const hasil = []
  for (const [tanggal, g] of perHari) {
    const suhu = statistik(g.suhu), udara = statistik(g.udara), tanah = statistik(g.tanah)
    const jumlahData = Math.max(g.suhu.length, g.udara.length, g.tanah.length)
    hasil.push({
      tanggal,
      tanggalNum: parseInt(tanggal.replaceAll('-', ''), 10), // YYYYMMDD
      suhu, udara, tanah, jumlahData,
    })
  }
  // Urut tanggal naik
  hasil.sort((a, b) => a.tanggalNum - b.tanggalNum)
  return hasil
}

// SHA-256 dari data mentah satu hari (sidik jari untuk anti-palsu di blockchain).
export async function hashHarian(feedsHariItu) {
  const ringkas = feedsHariItu.map(f => `${f.entryId}:${f.suhu},${f.udara},${f.tanah}`).join('|')
  const buf = new TextEncoder().encode(ringkas)
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Ambil semua feed milik satu tanggal tertentu ('YYYY-MM-DD').
export function feedsTanggal(feeds, tanggal) {
  return feeds.filter(f => tanggalDari(f.waktu) === tanggal)
}
