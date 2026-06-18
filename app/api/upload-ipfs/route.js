import { NextResponse } from 'next/server'

// Kredensial Pinata diambil dari environment (.env.local) — TIDAK di-hardcode.
const PINATA_API_KEY    = process.env.PINATA_API_KEY
const PINATA_API_SECRET = process.env.PINATA_API_SECRET
const PINATA_GATEWAY    = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'

// Upload metadata JSON (ringkasan / forecast) ke IPFS via Pinata.
export async function POST(request) {
  try {
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
      return NextResponse.json(
        { success: false, error: 'PINATA_API_KEY / PINATA_API_SECRET belum diset di .env.local' },
        { status: 500 }
      )
    }

    const { metadata, namaFile } = await request.json()
    if (!metadata) {
      return NextResponse.json({ success: false, error: 'metadata kosong' }, { status: 400 })
    }

    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: namaFile || `kopi-iot-${Date.now()}.json`,
          keyvalues: { project: 'kopi-iot-web3' },
        },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Upload Pinata gagal: ${errText}`)
    }

    const result = await res.json()
    const cid = result.IpfsHash
    return NextResponse.json({
      success: true,
      cid,
      url: `https://${PINATA_GATEWAY}/ipfs/${cid}`,
    })
  } catch (error) {
    console.error('Upload IPFS error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
