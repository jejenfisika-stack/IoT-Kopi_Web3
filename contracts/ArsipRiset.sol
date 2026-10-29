// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ============================================================
 *  ArsipRiset — Penambatan Sidik Jari Berkas Riset
 * ============================================================
 *  Tujuan:
 *    Mencatat SHA-256 dari berkas riset (dataset beku dan arsip
 *    hasil analisis) ke blockchain Polygon Amoy (testnet, GRATIS),
 *    supaya pembaca paper dapat membuktikan berkas yang dirilis
 *    tidak berubah sejak tanggal penambatan.
 *
 *  Hubungan dengan KopiIoTForecast:
 *    TIDAK menggantikannya. Kontrak itu tetap berjalan melayani
 *    aplikasi Web3 untuk ringkasan harian sensor. Kontrak ini
 *    berdiri sendiri di alamat lain, dipakai beberapa kali saja
 *    untuk keperluan arsip paper, lalu diam.
 *
 *  Mengapa menyimpan, bukan sekadar emit event:
 *    Supaya penelaah bisa memeriksa lewat tab "Read Contract" di
 *    PolygonScan tanpa perlu membaca log. Di testnet gas gratis,
 *    jadi kemudahan verifikasi lebih berharga daripada hemat gas.
 *
 *  Yang TIDAK dilakukan kontrak ini:
 *    Tidak menerbitkan token atau NFT. Tidak menyimpan datanya
 *    sendiri — hanya sidik jarinya. Berkas aslinya tetap di
 *    GitHub dan IPFS.
 *
 *  Hak tulis:
 *    Hanya `pemilik` (yang menyebar kontrak) yang boleh menambat,
 *    supaya daftar arsip tidak bisa dikotori pihak lain. Siapa pun
 *    boleh membaca.
 * ============================================================
 */
contract ArsipRiset {
    struct Arsip {
        string  label;      // penanda singkat, mis. "dataset-sesi-20260824"
        string  sha256Hex;  // 64 karakter heksadesimal, tanpa awalan 0x
        string  cid;        // CID IPFS; boleh dikosongkan dengan ""
        string  catatan;    // keterangan bebas, mis. judul paper
        uint256 waktu;      // block.timestamp saat ditambatkan
    }

    address public immutable pemilik;

    Arsip[] private daftarArsip;

    // Anti-duplikat: satu sidik jari hanya boleh ditambatkan sekali.
    mapping(string => bool) public hashSudahDitambat;

    event Ditambatkan(
        uint256 indexed id,
        string  label,
        string  sha256Hex,
        string  cid,
        uint256 waktu
    );

    modifier hanyaPemilik() {
        require(msg.sender == pemilik, "Hanya pemilik arsip yang boleh menambat");
        _;
    }

    constructor() {
        pemilik = msg.sender;
    }

    // ── Tambatkan satu sidik jari berkas ────────────────────
    // sha256Hex WAJIB 64 karakter. Penjagaan ini disengaja: sidik
    // jari yang salah ketik tidak bisa dicabut setelah masuk rantai.
    function tambatkan(
        string calldata label,
        string calldata sha256Hex,
        string calldata cid,
        string calldata catatan
    ) external hanyaPemilik returns (uint256) {
        require(bytes(label).length > 0, "Label tidak boleh kosong");
        require(bytes(sha256Hex).length == 64, "SHA-256 harus tepat 64 karakter");
        require(!hashSudahDitambat[sha256Hex], "Sidik jari ini sudah ditambatkan");

        daftarArsip.push(Arsip({
            label:     label,
            sha256Hex: sha256Hex,
            cid:       cid,
            catatan:   catatan,
            waktu:     block.timestamp
        }));

        uint256 id = daftarArsip.length - 1;
        hashSudahDitambat[sha256Hex] = true;

        emit Ditambatkan(id, label, sha256Hex, cid, block.timestamp);
        return id;
    }

    // ── Pembacaan publik ────────────────────────────────────
    function jumlahArsip() external view returns (uint256) {
        return daftarArsip.length;
    }

    function getArsip(uint256 id) external view returns (Arsip memory) {
        require(id < daftarArsip.length, "Arsip tidak ditemukan");
        return daftarArsip[id];
    }

    // Pemeriksaan satu langkah untuk penelaah: tempel sidik jari
    // berkas yang diunduh, kontrak menjawab benar atau salah.
    function cocok(string calldata sha256Hex) external view returns (bool) {
        return hashSudahDitambat[sha256Hex];
    }
}
