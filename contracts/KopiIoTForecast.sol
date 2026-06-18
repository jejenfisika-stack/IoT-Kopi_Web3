// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ============================================================
 *  KopiIoTForecast — Pencatatan Ringkasan Sensor + Forecast
 * ============================================================
 *  Tujuan:
 *    Menyimpan BUKTI (ringkasan harian + hasil forecasting) dari
 *    sensor kebun kopi (NodeMCU + DHT11 + Soil Moisture) ke
 *    blockchain Polygon Amoy (testnet, GRATIS).
 *
 *  Prinsip hemat gas:
 *    - TIDAK menyimpan data mentah (tiap 20 detik).
 *    - Hanya 1 ringkasan per hari: rata-rata, min, max + hash.
 *    - Snapshot forecast dicatat berkala (mis. 1x seminggu).
 *
 *  Skala nilai:
 *    Semua suhu/kelembaban disimpan sebagai integer ×100.
 *    Contoh: 29.85 °C  ->  2985
 *    (Solidity tidak punya desimal; frontend membagi 100.)
 *
 *  Catatan desain:
 *    Field avg/min/max disimpan sebagai variabel terpisah (bukan
 *    array) agar kontrak kompilasi mulus dengan setelan default
 *    Remix (menghindari error "stack too deep").
 *
 *  Hak tulis:
 *    Hanya `owner` (deployer / pemilik sensor) yang boleh mencatat,
 *    sehingga data tidak bisa dipalsukan pihak lain. Semua orang
 *    tetap bisa MEMBACA (view) data sebagai bukti publik.
 * ============================================================
 */
contract KopiIoTForecast {
    address public owner;

    // ── Ringkasan harian ────────────────────────────────────
    struct Ringkasan {
        uint32  tanggal;     // format YYYYMMDD, contoh 20260618
        int256  suhuAvg;  int256 suhuMin;  int256 suhuMax;   // ×100 (°C)
        int256  udaraAvg; int256 udaraMin; int256 udaraMax;  // ×100 (% udara)
        int256  tanahAvg; int256 tanahMin; int256 tanahMax;  // ×100 (% tanah)
        uint32  jumlahData;  // jumlah pembacaan sensor hari itu
        string  dataHash;    // SHA-256 data mentah hari itu (sidik jari)
        string  metadataCID; // CID IPFS (Pinata) berisi metadata lengkap (opsional)
        address pencatat;    // alamat yang mencatat
        uint256 waktuCatat;  // block.timestamp saat dicatat
    }

    // ── Snapshot forecast ───────────────────────────────────
    struct Forecast {
        uint32   tanggalBuat;   // tanggal forecast dibuat (YYYYMMDD)
        uint8    horizonHari;   // prediksi berapa hari ke depan
        // prediksi gabungan (×100), panjang = horizonHari * 3, layout:
        //   [ suhu(0..h-1), udara(0..h-1), tanah(0..h-1) ]
        int256[] prediksi;
        string   dataHash;      // hash input yang dipakai forecasting
        string   metadataCID;   // CID IPFS (Pinata) berisi metadata lengkap (metode, dll)
        uint256  waktuCatat;
    }

    Ringkasan[] private daftarRingkasan;
    Forecast[]  private daftarForecast;

    // Anti-duplikat: 1 tanggal hanya boleh dicatat sekali
    mapping(uint32 => bool) public tanggalSudahDicatat;

    event RingkasanDicatat(uint256 indexed id, uint32 indexed tanggal, string dataHash);
    event ForecastDicatat(uint256 indexed id, uint32 indexed tanggalBuat, uint8 horizon);

    modifier hanyaOwner() {
        require(msg.sender == owner, "Hanya pemilik sensor yang boleh mencatat");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ── Catat ringkasan harian ──────────────────────────────
    // suhu/udara/tanah dikirim sebagai [avg, min, max] (×100).
    function catatRingkasan(
        uint32 tanggal,
        int256[3] calldata suhu,
        int256[3] calldata udara,
        int256[3] calldata tanah,
        uint32 jumlahData,
        string calldata dataHash,
        string calldata metadataCID
    ) external hanyaOwner returns (uint256) {
        require(!tanggalSudahDicatat[tanggal], "Tanggal ini sudah dicatat");

        daftarRingkasan.push();
        uint256 id = daftarRingkasan.length - 1;
        Ringkasan storage r = daftarRingkasan[id];
        r.tanggal     = tanggal;
        r.suhuAvg     = suhu[0];  r.suhuMin  = suhu[1];  r.suhuMax  = suhu[2];
        r.udaraAvg    = udara[0]; r.udaraMin = udara[1]; r.udaraMax = udara[2];
        r.tanahAvg    = tanah[0]; r.tanahMin = tanah[1]; r.tanahMax = tanah[2];
        r.jumlahData  = jumlahData;
        r.dataHash    = dataHash;
        r.metadataCID = metadataCID;
        r.pencatat    = msg.sender;
        r.waktuCatat  = block.timestamp;

        tanggalSudahDicatat[tanggal] = true;
        emit RingkasanDicatat(id, tanggal, dataHash);
        return id;
    }

    // ── Catat snapshot forecast ─────────────────────────────
    // prediksi = array gabungan [suhu..., udara..., tanah...], panjang = horizonHari*3.
    function catatForecast(
        uint32 tanggalBuat,
        uint8 horizonHari,
        int256[] calldata prediksi,
        string calldata dataHash,
        string calldata metadataCID
    ) external hanyaOwner returns (uint256) {
        require(prediksi.length == uint256(horizonHari) * 3, "Panjang prediksi tidak sesuai horizon");

        daftarForecast.push();
        Forecast storage f = daftarForecast[daftarForecast.length - 1];
        f.tanggalBuat  = tanggalBuat;
        f.horizonHari  = horizonHari;
        f.prediksi     = prediksi;
        f.dataHash     = dataHash;
        f.metadataCID  = metadataCID;
        f.waktuCatat   = block.timestamp;

        // Pakai pembacaan dari storage di emit/return untuk mengurangi
        // kedalaman stack (menghindari "stack too deep").
        emit ForecastDicatat(daftarForecast.length - 1, f.tanggalBuat, f.horizonHari);
        return daftarForecast.length - 1;
    }

    // ── Getter ──────────────────────────────────────────────
    function totalRingkasan() external view returns (uint256) {
        return daftarRingkasan.length;
    }

    function totalForecast() external view returns (uint256) {
        return daftarForecast.length;
    }

    function getRingkasan(uint256 id) external view returns (Ringkasan memory) {
        return daftarRingkasan[id];
    }

    function getForecast(uint256 id) external view returns (Forecast memory) {
        return daftarForecast[id];
    }
}
