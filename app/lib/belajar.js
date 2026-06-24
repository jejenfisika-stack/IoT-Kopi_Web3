// ============================================================
//  Kurikulum "Menu Belajar" — Computational Thinking & AI Literacy
//  Konteks nyata: sistem Kopi IoT Web3 (sensor → ANN → blockchain)
//  Sasaran: mahasiswa S1/S2/S3 Pendidikan IPA
// ============================================================

// ── Indikator Computational Thinking (CT) ──
export const CT = {
  dek:  { nama: 'Dekomposisi',       warna: '#38bdf8', desc: 'Memecah masalah kompleks menjadi bagian-bagian kecil yang dapat dikelola.' },
  pola: { nama: 'Pengenalan Pola',   warna: '#22d3ee', desc: 'Menemukan keteraturan, tren, atau kemiripan dalam data.' },
  abs:  { nama: 'Abstraksi',         warna: '#a78bfa', desc: 'Menyaring informasi penting & membuat representasi/model.' },
  algo: { nama: 'Algoritma',         warna: '#4ade80', desc: 'Menyusun langkah sistematis untuk menyelesaikan masalah.' },
  eval: { nama: 'Evaluasi',          warna: '#f59e0b', desc: 'Menilai solusi: akurasi, efisiensi, dan keterbatasan.' },
  gen:  { nama: 'Generalisasi',      warna: '#fb7185', desc: 'Menerapkan solusi atau pola ke konteks/masalah lain.' },
}

// ── Indikator AI Literacy (Ng et al., 2021) ──
export const AIL = {
  kenal: { nama: 'Mengenal AI',              warna: '#60a5fa', desc: 'Memahami konsep dasar AI: data, model, prediksi.' },
  guna:  { nama: 'Menggunakan AI',           warna: '#34d399', desc: 'Menerapkan & menjalankan alat/model AI untuk tugas nyata.' },
  cipta: { nama: 'Mengevaluasi & Mencipta',  warna: '#c084fc', desc: 'Menilai, merancang, atau memodifikasi model AI.' },
  etika: { nama: 'Etika AI',                 warna: '#fbbf24', desc: 'Integritas, transparansi, bias, dampak & tanggung jawab.' },
}

export const LEVEL = {
  S1: { warna: '#22c55e', desc: 'Memahami & mengoperasikan' },
  S2: { warna: '#f59e0b', desc: 'Menganalisis & mengevaluasi' },
  S3: { warna: '#a78bfa', desc: 'Merancang, mengkritik & meneliti' },
}

export const MODUL = [
  {
    id: 1,
    ikon: '🔌',
    judul: 'Merakit Sensor & Akuisisi Data',
    ringkas: 'Merangkai NodeMCU + DHT11 + Soil Moisture dan mengirim data ke cloud (ThingSpeak).',
    materi: [
      'Komponen: NodeMCU ESP8266 (mikrokontroler + WiFi), DHT11 (suhu & kelembaban udara), sensor Soil Moisture (kelembaban tanah).',
      'Alur: sensor membaca besaran fisis → NodeMCU mengirim via WiFi → ThingSpeak menyimpan & menampilkan.',
      'Kalibrasi & satuan: sensor menghasilkan nilai mentah yang perlu dikonversi ke besaran bermakna (°C, %).',
      'Prinsip: data adalah "bahan bakar" AI — tanpa data berkualitas, model tidak bermakna.',
    ],
    aktivitas: [
      'Buka Dashboard → amati 3 kartu live (suhu/udara/tanah) yang berasal dari sensor nyata Anda.',
      'Lihat folder kode "IoT Kopi" (wiring + sketsa Arduino) untuk memahami rangkaian.',
    ],
    soal: [
      { teks: 'Uraikan sistem IoT ini menjadi sub-sistem (penginderaan, koneksi, penyimpanan, tampilan) dan jelaskan fungsi tiap bagian.', level: 'S1', ct: ['dek'], ai: ['kenal'] },
      { teks: 'Sebuah pembacaan suhu tertulis 80°C di siang hari kebun kopi. Apakah wajar? Rancang aturan sederhana untuk menyaring data tak masuk akal (abstraksi rentang valid).', level: 'S2', ct: ['abs', 'eval'], ai: ['guna'] },
      { teks: 'Rancang protokol akuisisi data yang menjamin keterwakilan & kualitas untuk sebuah penelitian, lalu argumentasikan bagaimana data yang bias dapat menyesatkan kesimpulan berbasis AI.', level: 'S3', ct: ['gen'], ai: ['etika'] },
    ],
    refleksi: 'Mengapa kualitas & keterwakilan data menentukan kualitas prediksi AI?',
  },
  {
    id: 2,
    ikon: '🧹',
    judul: 'Memahami & Menyiapkan Data',
    ringkas: 'Membersihkan outlier, agregasi harian, normalisasi, dan windowing (deret → data terawasi).',
    materi: [
      'Agregasi harian: ribuan pembacaan diringkas menjadi rata-rata/min/max per hari.',
      'Outlier: nilai ekstrem (mis. sensor error) dibuang dengan aturan robust (median ± k·MAD).',
      'Normalisasi: menyetarakan skala agar model belajar adil.',
      'Windowing: mengubah deret waktu menjadi pasangan (X = 7 hari terakhir, y = hari ke-8).',
    ],
    aktivitas: [
      'Klik "Ekspor CSV" di Dashboard → buka di Excel/Google Sheets/Colab.',
      'Buka Verify Panel → lihat bagaimana data ringkas dibentuk.',
    ],
    soal: [
      { teks: 'Dari data CSV, temukan pola harian suhu: kapan cenderung tertinggi dan terendah? Sajikan bukti dari data.', level: 'S1', ct: ['pola'], ai: ['kenal'] },
      { teks: 'Jelaskan mengapa "windowing" (W=7) mengubah deret menjadi data terawasi. Gambarkan satu contoh sampel (X, y).', level: 'S2', ct: ['abs'], ai: ['guna'] },
      { teks: 'Rancang strategi penanganan data hilang (gap) dan outlier yang dapat dipertanggungjawabkan secara ilmiah, lalu prediksikan dampaknya terhadap performa model.', level: 'S3', ct: ['eval', 'gen'], ai: ['cipta'] },
    ],
    refleksi: 'Mengapa "data kotor menghasilkan prediksi kotor" (garbage in, garbage out)?',
  },
  {
    id: 3,
    ikon: '📈',
    judul: 'Forecasting Statistik: Naive, Linear, Prophet',
    ringkas: 'Memahami tiga pendekatan klasik untuk memprediksi nilai sensor ke depan.',
    materi: [
      'Naive: prediksi = nilai terakhir diulang (asas persistensi).',
      'Regresi Linear: menarik garis tren ŷ = a + b·x dari data lampau.',
      'Prophet (Meta): menangkap tren + pola musiman, tahan data berlubang.',
      'Tidak ada model "terbaik untuk semua" — bergantung karakter data (best-per-variable).',
    ],
    aktivitas: [
      'Dashboard → bagian Forecasting → ganti sumber "Statistik lokal" vs "Model HF".',
      'Ubah Horizon (3/5/7 hari) dan amati perubahan prediksi & grafik.',
    ],
    soal: [
      { teks: 'Tuliskan langkah-langkah (algoritma) model Naive dan Linear untuk memprediksi hari berikutnya.', level: 'S1', ct: ['algo'], ai: ['kenal'] },
      { teks: 'Pada variabel suhu, model Naive justru mengalahkan model yang lebih kompleks. Mengapa model sederhana bisa unggul? Kaitkan dengan sifat data suhu.', level: 'S2', ct: ['eval', 'pola'], ai: ['guna'] },
      { teks: 'Usulkan karakteristik data di mana Prophet akan unggul ATAU gagal, lalu uji hipotesis Anda menggunakan variabel udara & tanah pada sistem ini.', level: 'S3', ct: ['gen'], ai: ['cipta'] },
    ],
    refleksi: 'Kapan kita sebaiknya memilih model sederhana dibanding yang kompleks?',
  },
  {
    id: 4,
    ikon: '🧠',
    judul: 'Jaringan Saraf Tiruan (ANN & Deep Learning)',
    ringkas: 'Konsep neuron, layer, pelatihan (epoch, loss), overfitting; MLP → DNN → LSTM.',
    materi: [
      'Neuron & bobot: unit yang menjumlahkan input berbobot lalu melewatkan fungsi aktivasi (mis. ReLU).',
      'ANN/MLP: 1 lapisan tersembunyi; DNN: beberapa lapisan ("dalam"); LSTM: untuk urutan/deret waktu.',
      'Pelatihan: epoch (putaran belajar), loss (MSE) yang diminimalkan via backpropagation.',
      'Overfitting: model hafal data latih tapi gagal di data baru → dilawan Dropout & Early Stopping.',
      'Deep learning "lapar data": pada data sedikit sering kalah dari model sederhana.',
    ],
    aktivitas: [
      'Jalankan notebook Colab "Deep Learning Forecast" (folder forecasting-model) → Run all.',
      'Amati kurva Loss/MAE per epoch untuk MLP, DNN, LSTM.',
    ],
    soal: [
      { teks: 'Jelaskan dengan kata-kata sendiri apa itu "epoch" dan "loss". Apa makna grafik loss yang menurun?', level: 'S1', ct: ['abs'], ai: ['kenal'] },
      { teks: 'Dari kurva loss, bagaimana cara mengenali gejala overfitting? Tindakan apa yang sebaiknya diambil?', level: 'S2', ct: ['eval', 'algo'], ai: ['guna'] },
      { teks: 'Rancang arsitektur ANN alternatif (ubah jumlah lapisan/neuron) dan hipotesiskan efeknya pada data terbatas. Kaitkan dengan konsep bias–variance.', level: 'S3', ct: ['algo', 'gen'], ai: ['cipta'] },
    ],
    refleksi: 'Mengapa menambah lapisan (model lebih "dalam") tidak selalu meningkatkan akurasi?',
  },
  {
    id: 5,
    ikon: '⚖️',
    judul: 'Evaluasi & Perbandingan Model',
    ringkas: 'Metrik MAE/RMSE/Akurasi, evaluasi multi-step, multi-seed (kestabilan), best-per-variable.',
    materi: [
      'MAE = rata-rata selisih absolut; RMSE = akar rata-rata kuadrat (lebih sensitif outlier).',
      'Akurasi = 100 − MAPE; hati-hati: bisa terlihat tinggi otomatis untuk nilai besar & stabil.',
      'Evaluasi multi-step: memprediksi banyak hari ke depan tanpa melihat data aktual (lebih realistis).',
      'Multi-seed: melatih beberapa kali → rata-rata ± simpangan baku (std) menunjukkan kestabilan.',
      'Best-per-variable: tiap variabel memilih modelnya sendiri yang paling sesuai.',
    ],
    aktivitas: [
      'Lihat tabel perbandingan (notebook): bandingkan MAE dan kolom MAE_std antar model.',
      'Identifikasi model dengan std besar (tidak stabil).',
    ],
    soal: [
      { teks: 'Apa perbedaan MAE dan RMSE? Mengapa RMSE lebih sensitif terhadap kesalahan besar (outlier)?', level: 'S1', ct: ['abs'], ai: ['kenal'] },
      { teks: 'Model MLP memiliki MAE_std besar. Apa maknanya, dan mengapa hasil deep learning harus dilaporkan sebagai rata-rata banyak run (seed)?', level: 'S2', ct: ['eval'], ai: ['cipta'] },
      { teks: 'Rancang prosedur evaluasi yang adil untuk membandingkan model deret waktu, dan kritik kelemahan metrik "akurasi (100−MAPE)" sebagai satu-satunya tolok ukur.', level: 'S3', ct: ['eval', 'gen'], ai: ['cipta'] },
    ],
    refleksi: 'Mengapa satu angka akurasi tidak cukup untuk menilai sebuah model?',
  },
  {
    id: 6,
    ikon: '⛓️',
    judul: 'Penyimpanan & Integritas Data di Blockchain',
    ringkas: 'Hash SHA-256, IPFS/CID, smart contract, immutability — menjaga data tak bisa dipalsukan.',
    materi: [
      'Hash SHA-256: "sidik jari" data; ubah 1 karakter → seluruh hash berubah (avalanche effect).',
      'IPFS/CID: penyimpanan file terdesentralisasi; CID adalah alamat unik berbasis isi.',
      'Smart contract: program di blockchain yang menyimpan ringkasan + hash + CID secara permanen.',
      'Pola hemat: simpan ringkasan & sidik jari (bukan data mentah) → murah & tetap terverifikasi.',
      'Testnet: jaringan uji coba, gratis, tanpa uang sungguhan.',
    ],
    aktivitas: [
      'Buka Verify Panel → ubah satu huruf pada kotak teks dan amati hash berubah total.',
      'Catat satu ringkasan harian ke blockchain → buka tautan Polygonscan & Metadata IPFS.',
    ],
    soal: [
      { teks: 'Apa fungsi hash? Jelaskan mengapa mengubah satu karakter data mengubah keseluruhan hash.', level: 'S1', ct: ['abs'], ai: ['kenal', 'etika'] },
      { teks: 'Mengapa sistem ini menyimpan ringkasan + hash (bukan seluruh data mentah) di blockchain? Diskusikan trade-off-nya (biaya, transparansi, privasi).', level: 'S2', ct: ['dek', 'eval'], ai: ['etika'] },
      { teks: 'Argumentasikan peran blockchain bagi integritas & reproduktibilitas data penelitian. Kapan blockchain TIDAK diperlukan?', level: 'S3', ct: ['gen'], ai: ['etika'] },
    ],
    refleksi: 'Bagaimana transparansi & ketakterubahan data mendukung kejujuran ilmiah?',
  },
]
