// ============================================================
//  Interaksi blockchain (Polygon Amoy) via ethers v6
// ============================================================
import { ethers } from 'ethers'
import { AMOY, AMOY_RPC, CONTRACT_ADDRESS, CONTRACT_ABI, SKALA } from './config'

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

// Provider read-only (tanpa wallet) untuk membaca data publik.
export function kontrakBaca() {
  const provider = new ethers.JsonRpcProvider(AMOY_RPC)
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
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
