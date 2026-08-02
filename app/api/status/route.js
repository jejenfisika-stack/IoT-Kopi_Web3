import { NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { AMOY_RPCS, CONTRACT_ADDRESS, CONTRACT_ABI, AMOY, SKALA } from '../../lib/config'

// ============================================================
//  GET /api/status
// ------------------------------------------------------------
//  Ringkasan status on-chain dalam bentuk JSON datar, dirancang
//  agar ringan dibaca perangkat kecil (NodeMCU ESP8266 dengan
//  ArduinoJson). Tidak ada nesting dalam, tidak ada array besar.
//
//  Dipakai oleh layar OLED jam digital untuk menampilkan bukti
//  bahwa data sensor sudah tercatat permanen di Polygon Amoy.
// ============================================================

export const dynamic = 'force-dynamic'

// Daftar RPC dipusatkan di config (AMOY_RPCS) supaya endpoint yang mati cukup
// dicabut di satu tempat. Tanpa cadangan, layar OLED ikut kehilangan data
// on-chain padahal blockchain-nya sendiri baik-baik saja.
const DAFTAR_RPC = AMOY_RPCS

// Jaringan statis: tanpa ini ethers mengulang deteksi jaringan berkali-kali
// pada endpoint mati, sehingga tiap endpoint menghabiskan jatah batas waktu
// penuh sebelum berpindah.
const NET_AMOY = new ethers.Network(AMOY.chainName, AMOY.chainId)

// Ambil satu nilai dengan batas waktu, supaya RPC yang lambat
// tidak menggantung permintaan dari perangkat.
function denganBatasWaktu(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, tolak) => setTimeout(() => tolak(new Error('RPC timeout')), ms)),
  ])
}

// Coba tiap RPC sampai ada yang berhasil memberi nomor blok.
async function providerPertamaYangHidup() {
  let terakhir
  for (const url of DAFTAR_RPC) {
    try {
      const provider = new ethers.JsonRpcProvider(url, NET_AMOY, { staticNetwork: NET_AMOY })
      const blok = await denganBatasWaktu(provider.getBlockNumber(), 6000)
      return { provider, blok: Number(blok), rpc: url }
    } catch (e) {
      terakhir = e
    }
  }
  throw new Error(`Semua RPC gagal. Terakhir: ${terakhir?.message || 'tidak diketahui'}`)
}

export async function GET() {
  const kepala = {
    // Cache di edge Vercel: perangkat boleh sering menanyakan tanpa
    // membebani RPC publik. Data on-chain toh berubah paling cepat
    // beberapa menit sekali.
    'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
  }

  try {
    const { provider, blok, rpc } = await providerPertamaYangHidup()
    const kontrak = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

    const [totalRingkasan, totalForecast] = await denganBatasWaktu(
      Promise.all([kontrak.totalRingkasan(), kontrak.totalForecast()])
    )

    const nRingkasan = Number(totalRingkasan)
    const nForecast = Number(totalForecast)

    const hasil = {
      ok: true,
      jaringan: 'Polygon Amoy',
      kontrak: CONTRACT_ADDRESS,
      rpc,
      blok,
      ringkasan: nRingkasan,
      forecast: nForecast,
      // Diisi di bawah bila ada entri
      tglRingkasan: 0,
      waktuRingkasan: 0,
      jumlahData: 0,
      hash: '',
      suhuAvg: 0,
      udaraAvg: 0,
      tanahAvg: 0,
      tglForecast: 0,
      horizon: 0,
      waktuForecast: 0,
      explorer: AMOY.blockExplorerUrls[0],
    }

    // Ringkasan harian terakhir
    if (nRingkasan > 0) {
      const r = await denganBatasWaktu(kontrak.getRingkasan(nRingkasan - 1))
      hasil.tglRingkasan = Number(r.tanggal)
      hasil.waktuRingkasan = Number(r.waktuCatat)
      hasil.jumlahData = Number(r.jumlahData)
      hasil.hash = String(r.dataHash || '')
      hasil.suhuAvg = Number(r.suhuAvg) / SKALA
      hasil.udaraAvg = Number(r.udaraAvg) / SKALA
      hasil.tanahAvg = Number(r.tanahAvg) / SKALA
    }

    // Snapshot forecast terakhir
    if (nForecast > 0) {
      const f = await denganBatasWaktu(kontrak.getForecast(nForecast - 1))
      hasil.tglForecast = Number(f.tanggalBuat)
      hasil.horizon = Number(f.horizonHari)
      hasil.waktuForecast = Number(f.waktuCatat)
    }

    return NextResponse.json(hasil, { headers: kepala })
  } catch (error) {
    console.error('/api/status error:', error)
    // Tetap balas HTTP 200 dengan ok:false — perangkat kecil lebih mudah
    // memproses satu bentuk JSON daripada bercabang pada kode status HTTP.
    return NextResponse.json(
      { ok: false, pesan: String(error?.message || error) },
      { headers: kepala }
    )
  }
}
