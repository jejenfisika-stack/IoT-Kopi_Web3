// ============================================================
//  Interaksi blockchain (Polygon Amoy) via ethers v6
// ============================================================
import { ethers } from 'ethers'
import { AMOY, AMOY_RPC, AMOY_RPCS, CONTRACT_ADDRESS, CONTRACT_ABI, SKALA } from './config'

// Jaringan statis: mencegah ethers melakukan deteksi jaringan berulang yang
// membuatnya menggantung dalam loop retry saat sebuah endpoint tidak resolve.
const NET_AMOY = new ethers.Network(AMOY.chainName, AMOY.chainId)

export function adaKontrak() {
  return Boolean(CONTRACT_ADDRESS && CONTRACT_ADDRESS.length === 42)
}

// Skala: angka desimal -> integer ×100 (BigInt) untuk on-chain.
export function keSkala(nilai) {
  return BigInt(Math.round(Number(nilai) * SKALA))
}
// Sebaliknya: integer on-chain -> angka desimal.
export function dariSkala(big) {
  return Number(big) / SKALA
}

// Provider read-only (tanpa wallet) dengan fallback berlapis: endpoint dicoba
// berurutan sesuai prioritas, quorum 1 sehingga jawaban tercepat yang dipakai.
// Bila satu endpoint mati/lambat, ethers otomatis pindah ke berikutnya.
export function providerBaca() {
  const daftar = (AMOY_RPCS?.length ? AMOY_RPCS : [AMOY_RPC]).map((url, i) => ({
    provider: new ethers.JsonRpcProvider(url, NET_AMOY, { staticNetwork: NET_AMOY }),
    priority: i + 1,
    stallTimeout: 2500,
    weight: 1,
  }))
  return new ethers.FallbackProvider(daftar, NET_AMOY, { quorum: 1 })
}

export function kontrakBaca() {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, providerBaca())
}

// Simulasikan transaksi lewat provider baca yang andal SEBELUM benar-benar
// dikirim. Alasannya: banyak RPC (termasuk yang dipakai MetaMask) tidak
// menyertakan alasan revert pada eth_estimateGas, sehingga ethers hanya
// melaporkan "missing revert data" — pesan yang tidak bisa ditindaklanjuti.
// Provider baca kita mengembalikan alasan aslinya, mis. "Tanggal ini sudah
// dicatat" atau "Hanya pemilik sensor yang boleh mencatat".
//
// Mengembalikan string alasan bila transaksi akan ditolak, atau null bila
// aman. Bila simulasi sendiri gagal (mis. jaringan), tetap null supaya
// pengiriman tidak terhalang oleh pembacaan yang rewel.
export async function alasanRevert(namaFungsi, args, from) {
  try {
    await kontrakBaca()[namaFungsi].staticCall(...args, { from })
    return null
  } catch (e) {
    if (e?.reason) return e.reason
    const m = String(e?.shortMessage || e?.message || '')
    const cocok = m.match(/execution reverted:?\s*"?([^"]+?)"?\s*$/i)
    return cocok ? cocok[1].trim() : null
  }
}

// Pesan ethers saat semua endpoint tumbang ("no runners?!") tidak informatif
// bagi pengguna. Terjemahkan ke sebab yang sebenarnya.
export function pesanErrorRpc(e) {
  const raw = String(e?.shortMessage || e?.message || e)
  if (/no runners|could not coalesce|ENOTFOUND|getaddrinfo|Failed to fetch|NETWORK_ERROR|timeout/i.test(raw)) {
    return 'Tidak dapat menghubungi jaringan Polygon Amoy. Periksa koneksi internet Anda.'
  }
  return raw
}

// Connect MetaMask + pastikan jaringan Amoy. Kembalikan { signer, address }.
export async function connectWallet() {
  if (!window.ethereum) throw new Error('MetaMask tidak ditemukan. Install dari metamask.io')
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  const chainId = await window.ethereum.request({ method: 'eth_chainId' })
  if (chainId !== AMOY.chainIdHex) {
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: AMOY.chainIdHex }] })
    } catch {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: AMOY.chainIdHex,
          chainName: AMOY.chainName,
          nativeCurrency: AMOY.nativeCurrency,
          rpcUrls: AMOY.rpcUrls,
          blockExplorerUrls: AMOY.blockExplorerUrls,
        }],
      })
    }
  }
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  return { signer, address: accounts[0] }
}

// Kontrak dengan signer (untuk transaksi tulis).
export async function kontrakTulis() {
  const { signer, address } = await connectWallet()
  return { contract: new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer), address }
}

// Gas override aman untuk Polygon Amoy (minimum ~25 Gwei).
export async function gasAman(provider) {
  try {
    const feeData = await provider.getFeeData()
    const minGas = ethers.parseUnits('30', 'gwei')
    const net = feeData.gasPrice || feeData.maxFeePerGas || minGas
    const finalGas = net < minGas ? minGas : net
    return { maxFeePerGas: finalGas, maxPriorityFeePerGas: finalGas }
  } catch {
    const g = ethers.parseUnits('30', 'gwei')
    return { maxFeePerGas: g, maxPriorityFeePerGas: g }
  }
}

export function linkTx(hash) {
  return `${AMOY.blockExplorerUrls[0]}/tx/${hash}`
}
