// ============================================================
//  Konfigurasi global aplikasi Kopi IoT Web3
// ============================================================

// ── ThingSpeak ──────────────────────────────────────────────
// Channel publik milik sensor kebun kopi.
//   field1 = Suhu (°C) | field2 = Kelembaban udara (%) | field3 = Kelembaban tanah (%)
export const THINGSPEAK = {
  channelId: 1848413,
  // Channel ini publik, jadi readApiKey boleh kosong.
  // Jika suatu saat channel dijadikan privat, isi Read API Key di sini.
  readApiKey: '',
  timezone: 'Asia/Jakarta',
  fields: {
    suhu:  'field1',
    udara: 'field2',
    tanah: 'field3',
  },
}

// ── Forecasting via Hugging Face Space (Prophet/best-per-variable) ──
export const HF_FORECAST = {
  base: 'https://jejenfis06-iot-kebun-kopi.hf.space',
  endpoint: 'forecast',
}

// ── Blockchain: Polygon Amoy (testnet, GRATIS) ──────────────
export const AMOY = {
  chainIdHex: '0x13882', // 80002
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: ['https://rpc-amoy.polygon.technology'],
  blockExplorerUrls: ['https://amoy.polygonscan.com'],
}

// RPC publik untuk membaca data on-chain tanpa wallet.
export const AMOY_RPC = 'https://rpc-amoy.polygon.technology'

// ── Smart Contract ──────────────────────────────────────────
// KopiIoTForecast.sol versi dengan field metadataCID (deploy 2026-06-18).
export const CONTRACT_ADDRESS = '0x23844Db35cc005310403cEf78A899FB6376C5fc2'

// ── IPFS / Pinata ───────────────────────────────────────────
// Gateway untuk membuka file IPFS. Ganti dengan gateway Pinata Anda jika ada.
// API key Pinata diisi di .env.local (PINATA_API_KEY & PINATA_API_SECRET),
// tidak di sini, agar tidak bocor ke browser.
export const PINATA_GATEWAY = 'gateway.pinata.cloud'

// Skala nilai on-chain: semua suhu/kelembaban disimpan ×100.
export const SKALA = 100

export const CONTRACT_ABI = [
  { inputs: [], name: 'owner', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
  {
    inputs: [
      { name: 'tanggal',    type: 'uint32'     },
      { name: 'suhu',       type: 'int256[3]'  },
      { name: 'udara',      type: 'int256[3]'  },
      { name: 'tanah',      type: 'int256[3]'  },
      { name: 'jumlahData',  type: 'uint32' },
      { name: 'dataHash',    type: 'string' },
      { name: 'metadataCID', type: 'string' },
    ],
    name: 'catatRingkasan',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tanggalBuat', type: 'uint32'   },
      { name: 'horizonHari', type: 'uint8'    },
      { name: 'prediksi',    type: 'int256[]' },
      { name: 'dataHash',    type: 'string'   },
      { name: 'metadataCID', type: 'string'   },
    ],
    name: 'catatForecast',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  { inputs: [{ name: 'tanggal', type: 'uint32' }], name: 'tanggalSudahDicatat', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalRingkasan', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalForecast',  outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  {
    inputs: [{ name: 'id', type: 'uint256' }],
    name: 'getRingkasan',
    outputs: [{
      name: '', type: 'tuple',
      components: [
        { name: 'tanggal',    type: 'uint32'  },
        { name: 'suhuAvg',    type: 'int256'  }, { name: 'suhuMin',  type: 'int256' }, { name: 'suhuMax',  type: 'int256' },
        { name: 'udaraAvg',   type: 'int256'  }, { name: 'udaraMin', type: 'int256' }, { name: 'udaraMax', type: 'int256' },
        { name: 'tanahAvg',   type: 'int256'  }, { name: 'tanahMin', type: 'int256' }, { name: 'tanahMax', type: 'int256' },
        { name: 'jumlahData',  type: 'uint32'  },
        { name: 'dataHash',    type: 'string'  },
        { name: 'metadataCID', type: 'string'  },
        { name: 'pencatat',    type: 'address' },
        { name: 'waktuCatat',  type: 'uint256' },
      ],
    }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'uint256' }],
    name: 'getForecast',
    outputs: [{
      name: '', type: 'tuple',
      components: [
        { name: 'tanggalBuat', type: 'uint32'   },
        { name: 'horizonHari', type: 'uint8'    },
        { name: 'prediksi',    type: 'int256[]' },
        { name: 'dataHash',    type: 'string'   },
        { name: 'metadataCID', type: 'string'   },
        { name: 'waktuCatat',  type: 'uint256'  },
      ],
    }],
    stateMutability: 'view',
    type: 'function',
  },
  { anonymous: false, inputs: [ { indexed: true, name: 'id', type: 'uint256' }, { indexed: true, name: 'tanggal', type: 'uint32' }, { indexed: false, name: 'dataHash', type: 'string' } ], name: 'RingkasanDicatat', type: 'event' },
  { anonymous: false, inputs: [ { indexed: true, name: 'id', type: 'uint256' }, { indexed: true, name: 'tanggalBuat', type: 'uint32' }, { indexed: false, name: 'horizon', type: 'uint8' } ], name: 'ForecastDicatat', type: 'event' },
]
