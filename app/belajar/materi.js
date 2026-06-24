// ============================================================
//  Materi & soal "Belajar" — melatih Computational Thinking (CSTA)
//  & AI Literacy (Ng et al.). Konten Bahasa Indonesia.
//  Level soal bertingkat (Bloom): S1 (memahami/menggunakan),
//  S2 (menganalisis/mengevaluasi), S3 (mencipta/meneliti).
// ============================================================

export const KERANGKA = {
  ct: ['Dekomposisi', 'Pengenalan Pola', 'Abstraksi', 'Algoritma', 'Evaluasi', 'Generalisasi'],
  ail: ['Memahami', 'Menerapkan', 'Mengevaluasi', 'Mencipta', 'Etika'],
}

export const MODUL = [
  // ── MODUL 1 ──────────────────────────────────────────────
  {
    no: 1, ikon: '📡', judul: 'Merakit Sensor & Mengumpulkan Data',
    ct: ['Dekomposisi', 'Abstraksi', 'Algoritma'],
    ail: ['Memahami', 'Menerapkan'],
    tujuan: [
      'Mengenali komponen sistem IoT dan fungsinya.',
      'Memahami bagaimana sinyal fisik diubah menjadi data digital (abstraksi).',
      'Menyadari bahwa data adalah bahan baku utama AI.',
    ],
    materi: [
      { h: 'Komponen', p: 'NodeMCU ESP8266 (otak + WiFi), DHT11 (suhu & kelembaban udara), Soil Moisture (kelembaban tanah), OLED (tampilan). Tiap komponen punya satu peran — ini contoh dekomposisi.' },
      { h: 'Dari sinyal ke angka', p: 'Sensor menghasilkan sinyal (mis. soil moisture berupa nilai ADC 0–1023). Mikrokontroler mengubahnya menjadi angka bermakna (mis. persen). Menyaring detail listrik menjadi angka = abstraksi.' },
      { h: 'Algoritma pengambilan data', p: 'Program berulang: baca sensor → tampilkan → kirim ke ThingSpeak tiap ±20 detik. Urutan langkah sistematis ini adalah algoritma.' },
      { h: 'Data = bahan baku AI', p: 'Tanpa data yang cukup & berkualitas, AI tidak berguna — prinsip "garbage in, garbage out".' },
    ],
    aktivitas: [
      { teks: 'Buka Dashboard, amati kartu live (Suhu/Udara/Tanah). Catat nilainya sekarang.', link: '/' },
      { teks: 'Klik tombol "Ekspor CSV", buka di Excel/Spreadsheet. Amati struktur kolom & timestamp.', link: '/' },
    ],
    soal: [
      { level: 'S1', tipe: 'mc', ct: 'Algoritma', ail: 'Memahami',
        q: 'Urutan kerja program sensor yang benar adalah…',
        opsi: ['Kirim ke cloud → baca sensor → tampilkan', 'Baca sensor → tampilkan → kirim ke cloud', 'Tampilkan → kirim → baca sensor', 'Acak, tidak berurutan'],
        jawab: 1, pembahasan: 'Program berurutan: membaca sensor dulu, menampilkan, lalu mengirim — sebuah algoritma.' },
      { level: 'S1', tipe: 'mc', ct: 'Abstraksi', ail: 'Memahami',
        q: 'Soil moisture mengeluarkan nilai ADC 0–1023 lalu diubah jadi persen. Proses ini contoh…',
        opsi: ['Dekomposisi', 'Abstraksi', 'Generalisasi', 'Debugging'],
        jawab: 1, pembahasan: 'Menyaring detail sinyal listrik menjadi angka bermakna = abstraksi.' },
      { level: 'S2', tipe: 'esai', ct: 'Dekomposisi', ail: 'Menerapkan',
        q: 'Pecah sistem IoT kebun kopi ini menjadi sub-sistem (sensing, pemrosesan, komunikasi, penyimpanan). Jelaskan fungsi tiap bagian dan bagaimana mereka terhubung.' },
      { level: 'S3', tipe: 'esai', ct: 'Generalisasi', ail: 'Mencipta',
        q: 'Rancang penambahan satu sensor baru (mis. intensitas cahaya / CO₂). Data apa yang dihasilkan, untuk memprediksi apa, dan tantangan kalibrasi/kualitas datanya?' },
    ],
  },

  // ── MODUL 2 ──────────────────────────────────────────────
  {
    no: 2, ikon: '🧹', judul: 'Data & Pra-pemrosesan',
    ct: ['Pengenalan Pola', 'Abstraksi'],
    ail: ['Menerapkan', 'Mengevaluasi'],
    tujuan: [
      'Memahami pentingnya kualitas data sebelum pemodelan.',
      'Mengenali outlier dan teknik pembersihannya.',
      'Memahami agregasi harian, windowing, dan normalisasi.',
    ],
    materi: [
      { h: 'Data mentah itu berisik', p: 'Sensor kadang error (mis. DHT11 mengirim nilai ngawur). Nilai ekstrem (outlier) dapat merusak model. Tanda outlier: RMSE jauh lebih besar dari MAE.' },
      { h: 'Pembersihan', p: 'Buang nilai di luar rentang fisik wajar + outlier ekstrem (median ± 3.5·MAD), lalu agregasi harian (rata-rata/min/max).' },
      { h: 'Windowing', p: 'Mengubah deret waktu menjadi data terawasi: 7 hari terakhir (X) → memprediksi hari ke-8 (y). Ini abstraksi kunci agar bisa dilatih model.' },
      { h: 'Normalisasi', p: 'Menskala data ke rentang 0–1 agar jaringan saraf belajar lebih stabil.' },
    ],
    aktivitas: [
      { teks: 'Di Dashboard, amati grafik riwayat tiap variabel. Cari lonjakan/penurunan aneh (kandidat outlier).', link: '/' },
      { teks: 'Ekspor CSV, lalu hitung manual rata-rata satu hari di spreadsheet. Bandingkan dengan tampilan dashboard.', link: '/' },
    ],
    soal: [
      { level: 'S1', tipe: 'mc', ct: 'Pengenalan Pola', ail: 'Mengevaluasi',
        q: 'Nilai RMSE jauh lebih besar daripada MAE biasanya menandakan…',
        opsi: ['Model sempurna', 'Adanya outlier / error besar', 'Data terlalu sedikit', 'Tidak ada artinya'],
        jawab: 1, pembahasan: 'RMSE menghukum error besar lebih keras, jadi RMSE >> MAE = ada outlier.' },
      { level: 'S1', tipe: 'mc', ct: 'Abstraksi', ail: 'Menerapkan',
        q: 'Windowing dengan W=7 berarti…',
        opsi: ['Memakai 7 sensor', '7 hari terakhir dipakai memprediksi hari berikutnya', 'Membuang 7 data pertama', 'Melatih 7 model'],
        jawab: 1, pembahasan: 'Window = jumlah hari lampau sebagai input untuk memprediksi 1 hari ke depan.' },
      { level: 'S2', tipe: 'esai', ct: 'Evaluasi', ail: 'Mengevaluasi',
        q: 'Pada proyek ini, membersihkan outlier menurunkan error model 70–85%. Jelaskan mengapa, kaitkan dengan prinsip "garbage in, garbage out".' },
      { level: 'S3', tipe: 'esai', ct: 'Generalisasi', ail: 'Mencipta',
        q: 'Rancang strategi pra-pemrosesan bila sensor sering offline berhari-hari (banyak data hilang). Pertimbangkan interpolasi, penandaan ketidakpastian, dan dampaknya pada model.' },
    ],
  },

  // ── MODUL 3 ──────────────────────────────────────────────
  {
    no: 3, ikon: '🔮', judul: 'Forecasting & Jaringan Saraf (ANN/DNN/LSTM)',
    ct: ['Algoritma', 'Pengenalan Pola', 'Evaluasi', 'Generalisasi'],
    ail: ['Memahami', 'Mengevaluasi', 'Etika'],
    tujuan: [
      'Memahami forecasting deret waktu dari statistik hingga deep learning.',
      'Membaca kurva loss & mendeteksi overfitting.',
      'Mengevaluasi model secara jujur (MAE/RMSE, multi-step, multi-seed) serta keterbatasannya.',
    ],
    materi: [
      { h: 'Tangga model', p: 'Naive (ulangi nilai terakhir) → Linear (garis tren) → Prophet (tren + musiman) → ANN/MLP → DNN (lebih dalam) → LSTM (untuk urutan). Dari sederhana ke kompleks.' },
      { h: 'Bagaimana ANN belajar', p: 'Neuron tersusun berlapis dengan fungsi aktivasi; "belajar" via backpropagation tiap epoch. Kurva loss yang menurun = proses belajar; bila val-loss naik sementara train-loss turun = overfitting.' },
      { h: 'Evaluasi jujur', p: 'MAE & RMSE (error), MAPE (akurasi = 100 − MAPE). Uji multi-step (prediksi banyak hari ke depan) lebih sulit daripada one-step. Multi-seed (banyak run) mengungkap kestabilan (MAE_std).' },
      { h: 'Temuan penting', p: 'Pada data sedikit: model kompleks ≠ lebih baik. Naive sering mengalahkan deep learning; DL tidak stabil (MAE_std besar). Pemenang berbeda tiap variabel → "best-per-variable".' },
      { h: 'Etika AI', p: 'Jangan mengklaim akurasi berlebihan; laporkan keterbatasan, ukuran data, dan metode evaluasi secara transparan.' },
    ],
    aktivitas: [
      { teks: 'Di bagian Forecasting, ganti toggle "Statistik lokal" ↔ "Model HF". Bandingkan prediksi & metode tiap variabel.', link: '/' },
      { teks: 'Buka Verify Panel → baca kartu "Model yang dipakai" (Linear/Naive/Prophet) dan rumus regresi.', link: '/' },
      { teks: '(Lab Colab) Jalankan notebook Deep Learning: amati kurva loss/MAE dan tabel MAE_std.', link: null },
    ],
    soal: [
      { level: 'S1', tipe: 'mc', ct: 'Algoritma', ail: 'Memahami',
        q: 'Model "Naive" memprediksi hari esok dengan cara…',
        opsi: ['Rata-rata semua data', 'Mengulang nilai terakhir', 'Melatih neural network', 'Mengacak angka'],
        jawab: 1, pembahasan: 'Naive = baseline: nilai terakhir diulang. Sederhana tapi sering kuat.' },
      { level: 'S1', tipe: 'mc', ct: 'Pengenalan Pola', ail: 'Memahami',
        q: 'Kurva loss pada pelatihan jaringan saraf yang ideal akan…',
        opsi: ['Naik terus', 'Menurun lalu mendatar', 'Konstan', 'Acak'],
        jawab: 1, pembahasan: 'Loss menurun = model belajar; mendatar = konvergen. Val-loss yang naik = overfitting.' },
      { level: 'S2', tipe: 'esai', ct: 'Evaluasi', ail: 'Mengevaluasi',
        q: 'Pada variabel suhu, Naive (MAE 0.78) mengalahkan LSTM (MAE 2.9). Jelaskan mengapa. Apa makna nilai MAE_std MLP yang besar (mis. 0.58)?' },
      { level: 'S2', tipe: 'mc', ct: 'Evaluasi', ail: 'Etika',
        q: 'Akurasi suhu 97% terlihat hebat. Mengapa kita TETAP harus melaporkan MAE & RMSE?',
        opsi: ['Agar terlihat rumit', 'Karena akurasi (100−MAPE) bisa "menggembung" pada nilai besar/stabil sehingga menyesatkan', 'MAE tidak penting', 'Supaya tabel penuh'],
        jawab: 1, pembahasan: 'Pada nilai besar & stabil, MAPE kecil otomatis → akurasi tampak tinggi meski model biasa. Laporkan MAE/RMSE agar jujur.' },
      { level: 'S3', tipe: 'esai', ct: 'Generalisasi', ail: 'Mencipta',
        q: 'Rancang eksperimen agar deep learning berpeluang unggul (mis. menambah data, menambah fitur eksogen, tuning). Tuliskan hipotesis, variabel, dan cara mengukur keberhasilan secara jujur.' },
    ],
  },

  // ── MODUL 4 ──────────────────────────────────────────────
  {
    no: 4, ikon: '⛓️', judul: 'Blockchain & Integritas Data',
    ct: ['Abstraksi', 'Algoritma', 'Dekomposisi'],
    ail: ['Etika', 'Memahami'],
    tujuan: [
      'Memahami hash (SHA-256), IPFS/CID, dan smart contract.',
      'Memahami pola hibrida (ringkasan+hash on-chain, data lengkap di IPFS).',
      'Menghubungkan blockchain dengan etika data: transparansi & akuntabilitas.',
    ],
    materi: [
      { h: 'Hash = sidik jari', p: 'SHA-256 mengubah data apa pun menjadi 64 karakter unik. Ubah 1 karakter → hash berubah total (avalanche effect). Inilah yang membuat data tak bisa dipalsukan diam-diam.' },
      { h: 'IPFS & CID', p: 'Metadata lengkap disimpan terdesentralisasi (Pinata/IPFS); CID adalah alamat berbasis isi file.' },
      { h: 'Smart contract', p: 'Program di blockchain (Polygon Amoy) menyimpan ringkasan harian + hash + CID. Hanya pemilik (owner) yang boleh menulis; semua orang dapat membaca/memverifikasi.' },
      { h: 'Etika data ilmiah', p: 'Prinsip Web3 "don\'t trust, verify": data yang sudah dicatat tak bisa diubah → mendukung kejujuran & akuntabilitas penelitian.' },
    ],
    aktivitas: [
      { teks: 'Buka Verify Panel → demo SHA-256. Ubah satu karakter pada teks, amati seluruh hash berubah.', link: '/' },
      { teks: '(Jika punya wallet) Catat ringkasan harian ke blockchain, lalu buka link transaksi (Polygonscan) & Metadata IPFS.', link: '/' },
    ],
    soal: [
      { level: 'S1', tipe: 'mc', ct: 'Abstraksi', ail: 'Memahami',
        q: 'Fungsi utama hash SHA-256 dalam sistem ini adalah…',
        opsi: ['Mengenkripsi agar rahasia', 'Membuat "sidik jari" unik untuk mendeteksi perubahan data', 'Mempercepat internet', 'Menyimpan gambar'],
        jawab: 1, pembahasan: 'Hash = sidik jari integritas; sedikit perubahan data → hash berubah total.' },
      { level: 'S1', tipe: 'mc', ct: 'Algoritma', ail: 'Etika',
        q: 'Mengapa data di blockchain disebut "tak bisa dipalsukan diam-diam"?',
        opsi: ['Karena dienkripsi', 'Karena tercatat permanen & terdistribusi, perubahan akan ketahuan lewat hash', 'Karena disimpan di satu server aman', 'Karena gratis'],
        jawab: 1, pembahasan: 'Sifat immutable + terdistribusi + hash membuat manipulasi mudah terdeteksi.' },
      { level: 'S2', tipe: 'esai', ct: 'Dekomposisi', ail: 'Menerapkan',
        q: 'Jelaskan alur data langkah demi langkah dari sensor hingga tersimpan di blockchain (sensor → ThingSpeak → ringkasan/hash → IPFS → smart contract).' },
      { level: 'S3', tipe: 'esai', ct: 'Evaluasi', ail: 'Etika',
        q: 'Diskusikan: bagaimana blockchain meningkatkan akuntabilitas penelitian IoT/AI? Sebutkan minimal dua keterbatasannya (mis. testnet bisa direset, biaya/energi mainnet, privasi lokasi).' },
    ],
  },

  // ── MODUL 5 ──────────────────────────────────────────────
  {
    no: 5, ikon: '🧩', judul: 'Sintesis & Proyek Mini',
    ct: ['Generalisasi', 'Evaluasi', 'Dekomposisi'],
    ail: ['Mengevaluasi', 'Mencipta', 'Etika'],
    tujuan: [
      'Mengintegrasikan seluruh pipeline (sensor → data → model → blockchain).',
      'Berpikir komputasional menyeluruh & berliterasi AI secara kritis.',
    ],
    materi: [
      { h: 'Pipeline utuh', p: 'Sensor → Pengumpulan Data → Pra-pemrosesan → Pemodelan → Evaluasi → Penyimpanan terverifikasi (blockchain). Tiap tahap melatih indikator CT & AI-literacy tertentu.' },
      { h: 'Refleksi', p: 'Petakan: di tahap mana Anda melakukan dekomposisi, abstraksi, evaluasi? Di mana literasi AI (memahami, menerapkan, mengevaluasi, etika) berperan?' },
    ],
    aktivitas: [
      { teks: 'Proyek mini: pilih 1 variabel → ekspor data → jalankan forecast (lokal & HF) → bandingkan → catat ringkasan + forecast ke blockchain.', link: '/' },
      { teks: 'Tulis laporan singkat: tujuan, metode, hasil (MAE/RMSE), keterbatasan, dan pertimbangan etika.', link: null },
    ],
    soal: [
      { level: 'S2', tipe: 'esai', ct: 'Generalisasi', ail: 'Mencipta',
        q: 'Terapkan kerangka sistem ini ke domain IPA lain (mis. kualitas air, cuaca mikro tanaman lain). Apa yang dapat dipertahankan dan apa yang harus diubah?' },
      { level: 'S3', tipe: 'esai', ct: 'Evaluasi', ail: 'Mengevaluasi',
        q: 'Rancang penelitian pendidikan: bagaimana mengukur peningkatan Computational Thinking & AI Literacy mahasiswa setelah memakai media ini? (desain, instrumen, indikator, N-gain).' },
      { level: 'S3', tipe: 'esai', ct: 'Evaluasi', ail: 'Etika',
        q: 'Identifikasi 3 isu etika pada sistem ini (mis. privasi data lokasi kebun, bias akibat data sedikit, ketergantungan pada model) dan usulkan mitigasinya.' },
    ],
  },
]
