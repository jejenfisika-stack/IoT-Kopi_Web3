// ============================================================
//  Pembatas laju sederhana berbasis memori per-instance.
//
//  Catatan: di Vercel serverless, tiap instance punya memori sendiri dan bisa
//  ter-reset saat cold start. Ini lapisan pertahanan pertama yang ringan,
//  BUKAN pengganti pembatas terpusat (mis. Upstash/Vercel KV) untuk skala besar.
//  Pemeriksaan yang setara juga ada di sisi Apps Script, sebab kiriman langsung
//  ke URL webhook akan melewati seluruh pembatas di sini.
// ============================================================

const ember = new Map()

export function rateLimit(kunci, { limit = 8, windowMs = 60_000 } = {}) {
  const kini = Date.now()

  // Bersihkan entri kedaluwarsa sesekali agar memori tidak terus bertambah
  if (ember.size > 5000) {
    for (const [k, v] of ember) {
      if (kini - v.mulai > windowMs) ember.delete(k)
    }
  }

  const entri = ember.get(kunci)
  if (!entri || kini - entri.mulai > windowMs) {
    ember.set(kunci, { mulai: kini, jumlah: 1 })
    return { ok: true, sisa: limit - 1 }
  }

  entri.jumlah++
  if (entri.jumlah > limit) return { ok: false, sisa: 0 }
  return { ok: true, sisa: limit - entri.jumlah }
}

export function getClientIp(request) {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}
