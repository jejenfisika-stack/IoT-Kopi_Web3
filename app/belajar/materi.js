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
      { level: 'S2', tipe: 'pasangan', ct: 'Dekomposisi', ail: 'Menerapkan',
        q: 'Pecah sistem ini menjadi sub-sistem: pasangkan tiap komponen dengan perannya.',
        kiri: ['DHT11 & Soil Moisture', 'NodeMCU ESP8266', 'Modul WiFi → ThingSpeak', 'Smart contract + IPFS'],
        kanan: ['Komunikasi', 'Penyimpanan terverifikasi', 'Penginderaan (sensing)', 'Pemrosesan'],
        jawab: [2, 3, 0, 1],
        pembahasan: 'Dekomposisi memecah sistem menjadi bagian ber-tanggung jawab tunggal: sensor menangkap besaran fisik, mikrokontroler mengolah, modul WiFi mengirim, blockchain+IPFS menyimpan secara terverifikasi.' },
      { level: 'S3', tipe: 'dua-tingkat', ct: 'Generalisasi', ail: 'Mencipta',
        q: 'Anda ingin menambah satu sensor untuk memprediksi risiko penyakit karat daun kopi. Sensor mana yang paling tepat?',
        opsi: ['Sensor intensitas cahaya (LDR)', 'Sensor kebasahan daun (leaf wetness)', 'Sensor tekanan udara', 'Sensor suara'],
        jawab: 1,
        alasanQ: 'Alasan pemilihan sensor tersebut adalah…',
        alasan: [
          'Karena sensornya paling murah dan mudah didapat',
          'Karena durasi daun basah adalah faktor penyebab langsung perkecambahan spora jamur',
          'Karena cahaya menentukan laju fotosintesis tanaman',
          'Karena tekanan udara selalu berkorelasi dengan curah hujan'],
        jawabAlasan: 1,
        pembahasan: 'Karat daun (Hemileia vastatrix) berkecambah bila daun basah cukup lama. Pemilihan sensor harus diturunkan dari hipotesis kausal, bukan dari ketersediaan atau harga.' },
      { level: 'S1', tipe: 'mc', ct: 'Pengenalan Pola', ail: 'Memahami',
        q: 'Grafik suhu menunjukkan nilai naik tiap siang dan turun tiap malam secara berulang. Pola seperti ini disebut…',
        opsi: ['Outlier', 'Pola musiman (siklus harian)', 'Tren jangka panjang', 'Derau acak'],
        jawab: 1,
        pembahasan: 'Pengulangan teratur dengan periode tetap adalah komponen musiman — berbeda dari tren (arah jangka panjang) maupun derau (tanpa pola).' },
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
      { level: 'S2', tipe: 'dua-tingkat', ct: 'Evaluasi', ail: 'Mengevaluasi',
        q: 'Membersihkan outlier menurunkan error model 70–85%. Penjelasan yang paling tepat adalah…',
        opsi: [
          'Datanya menjadi lebih sedikit sehingga error otomatis mengecil',
          'Model tidak lagi memaksakan diri mencocokkan nilai ekstrem yang bukan berasal dari proses fisik sebenarnya',
          'Outlier membuat proses komputasi menjadi lambat',
          'Pembersihan mengubah satuan pengukuran menjadi lebih kecil'],
        jawab: 1,
        alasanQ: 'Kaitannya dengan prinsip "garbage in, garbage out" adalah…',
        alasan: [
          'Model hanya sebaik kualitas data yang dimasukkan; galat sensor yang ikut dilatih akan direproduksi sebagai pola palsu',
          'Semua data harus dibuang sebelum pelatihan dimulai',
          'Prinsip tersebut hanya berlaku untuk data teks, bukan sensor',
          'Semakin banyak data yang dipakai, semakin buruk hasil model'],
        jawabAlasan: 0,
        pembahasan: 'Nilai ekstrem dari kerusakan sensor bukan sinyal fisik. Bila ikut dilatih, model mengalokasikan kapasitasnya untuk mencocokkan derau — persis yang dimaksud "garbage in, garbage out".' },
      { level: 'S3', tipe: 'ganda', ct: 'Generalisasi', ail: 'Mencipta',
        q: 'Sensor Anda sering offline berhari-hari sehingga banyak data hilang. Pilih SEMUA strategi pra-pemrosesan yang tepat.',
        opsi: [
          'Interpolasi hanya untuk celah pendek, dan menandai nilai hasil interpolasi',
          'Mengisi seluruh celah dengan rata-rata global agar deret menjadi penuh',
          'Menyimpan kolom penanda ketidakpastian / jumlah data per periode',
          'Menganalisis per sesi perekaman yang kontinu, bukan memaksakan deret harian',
          'Menghapus seluruh variabel yang pernah mengalami offline'],
        jawab: [0, 2, 3],
        pembahasan: 'Interpolasi celah panjang menciptakan pola semu, dan rata-rata global menghapus dinamika asli. Menandai ketidakpastian serta menganalisis per sesi kontinu adalah praktik yang jujur secara metodologis.' },
      { level: 'S2', tipe: 'dua-tingkat', ct: 'Pengenalan Pola', ail: 'Menerapkan',
        q: 'Sensor kelembaban tanah tiba-tiba membaca 0% selama tiga pembacaan berturut-turut, lalu kembali ke 45%. Tindakan yang paling tepat adalah…',
        opsi: [
          'Membiarkannya karena itu tetap data hasil pengukuran',
          'Menandainya sebagai anomali dan mengeluarkannya dari data pelatihan',
          'Mengganti seluruh data hari itu dengan rata-rata bulanan',
          'Menghentikan pengumpulan data sampai sensor diganti'],
        jawab: 1,
        alasanQ: 'Alasan tindakan tersebut adalah…',
        alasan: [
          'Nilai 0% yang terjepit di antara pembacaan 45% tidak masuk akal secara fisik dan menandakan sensor lepas atau koneksi terputus',
          'Kelembaban tanah wajar berubah drastis dalam hitungan menit',
          'Semua nilai rendah pada sensor apa pun memang harus selalu dibuang',
          'Model pembelajaran mesin tidak terpengaruh oleh nilai ekstrem'],
        jawabAlasan: 0,
        pembahasan: 'Kuncinya adalah menilai kemasukakalan fisik: perubahan 45% → 0% → 45% dalam hitungan menit mustahil pada media tanah, sehingga itu galat instrumen, bukan sinyal.' },
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
      { teks: 'Buka Lab AI: latih jaringan saraf langsung di browser, ubah parameter, amati kurva loss turun real-time.', link: '/lab' },
      { teks: '(Lanjutan) Jalankan notebook Deep Learning di Colab: amati kurva loss/MAE dan tabel MAE_std.', link: null },
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
      { level: 'S2', tipe: 'dua-tingkat', ct: 'Evaluasi', ail: 'Mengevaluasi',
        q: 'Pada variabel suhu, Naive (MAE 0,78) mengalahkan LSTM (MAE 2,9). Penjelasan yang paling tepat adalah…',
        opsi: [
          'LSTM pasti salah diprogram',
          'Data terlalu sedikit dan deretnya mendekati random walk, sehingga nilai terakhir sudah merupakan penduga terbaik',
          'MAE bukan metrik yang sah untuk deret waktu',
          'Suhu memang tidak mungkin diprediksi sama sekali'],
        jawab: 1,
        alasanQ: 'Nilai MAE_std MLP yang besar (mis. 0,58) menunjukkan…',
        alasan: [
          'Model tersebut sangat akurat dan stabil',
          'Hasil model sangat bergantung pada inisialisasi bobot acak, sehingga tidak stabil dan tidak boleh dilaporkan dari satu kali run',
          'Datanya sudah sepenuhnya bersih dari outlier',
          'Learning rate yang dipakai sudah optimal'],
        jawabAlasan: 1,
        pembahasan: 'Bila deret mendekati random walk, nilai terakhir secara teori adalah penduga optimal — Naive menang bukan karena kebetulan. MAE_std besar berarti hasil berubah-ubah antar seed, sehingga pelaporan satu run menyesatkan.' },
      { level: 'S2', tipe: 'mc', ct: 'Evaluasi', ail: 'Etika',
        q: 'Akurasi suhu 97% terlihat hebat. Mengapa kita TETAP harus melaporkan MAE & RMSE?',
        opsi: ['Agar terlihat rumit', 'Karena akurasi (100−MAPE) bisa "menggembung" pada nilai besar/stabil sehingga menyesatkan', 'MAE tidak penting', 'Supaya tabel penuh'],
        jawab: 1, pembahasan: 'Pada nilai besar & stabil, MAPE kecil otomatis → akurasi tampak tinggi meski model biasa. Laporkan MAE/RMSE agar jujur.' },
      { level: 'S3', tipe: 'urut', ct: 'Generalisasi', ail: 'Mencipta',
        q: 'Susun langkah eksperimen yang benar untuk menguji apakah deep learning dapat mengungguli baseline.',
        langkah: [
          'Rumuskan hipotesis yang dapat diuji (mis. DL unggul bila data > 300 titik)',
          'Tetapkan baseline Naive dan protokol evaluasi yang sama untuk semua model',
          'Kumpulkan atau tambah data hingga memenuhi ambang yang dihipotesiskan',
          'Latih setiap model dengan beberapa seed acak yang berbeda',
          'Bandingkan MAE beserta simpangan bakunya, lalu uji signifikansi (Diebold-Mariano)',
          'Laporkan hasil apa adanya, termasuk bila hipotesis tidak terdukung'],
        pembahasan: 'Hipotesis dan protokol ditetapkan SEBELUM data dikumpulkan agar tidak terjadi penyesuaian hasil di belakang. Uji signifikansi dan pelaporan hasil negatif adalah syarat integritas ilmiah.' },
      { level: 'S1', tipe: 'mc', ct: 'Abstraksi', ail: 'Menerapkan',
        q: 'Sebelum dilatih ke jaringan saraf, data suhu (20–35 °C) diskalakan menjadi rentang 0–1. Tujuan utamanya adalah…',
        opsi: [
          'Menghemat ruang penyimpanan data',
          'Membuat pelatihan lebih stabil karena tidak ada variabel berskala besar yang mendominasi bobot',
          'Mengubah satuan dari Celsius menjadi Fahrenheit',
          'Menambah jumlah sampel data pelatihan'],
        jawab: 1,
        pembahasan: 'Normalisasi menyamakan skala antar fitur sehingga gradien tidak timpang dan proses konvergensi menjadi lebih stabil.' },
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
      { level: 'S2', tipe: 'urut', ct: 'Dekomposisi', ail: 'Menerapkan',
        q: 'Susun alur data dari sensor hingga tercatat di blockchain.',
        langkah: [
          'Sensor membaca suhu, kelembaban udara, dan kelembaban tanah',
          'NodeMCU mengirim pembacaan ke ThingSpeak melalui WiFi',
          'dApp mengambil data dan menghitung ringkasan harian (rata-rata/min/maks)',
          'Ringkasan di-hash dengan SHA-256 menjadi sidik jari data',
          'Metadata lengkap diunggah ke IPFS sehingga memperoleh CID',
          'Smart contract menyimpan ringkasan + hash + CID di Polygon Amoy'],
        pembahasan: 'Hash dihitung SETELAH ringkasan terbentuk, dan CID diperoleh SEBELUM transaksi dikirim — karena CID termasuk data yang ditulis ke smart contract.' },
      { level: 'S3', tipe: 'ganda', ct: 'Evaluasi', ail: 'Etika',
        q: 'Pilih SEMUA pernyataan yang merupakan keterbatasan nyata dari sistem blockchain ini.',
        opsi: [
          'Jaringan testnet dapat direset, sehingga rekaman tidak permanen selamanya',
          'Blockchain menjamin data yang dicatat pasti benar secara ilmiah',
          'Biaya dan konsumsi energi menjadi pertimbangan bila berpindah ke mainnet',
          'Identitas atau koordinat kebun yang tercatat permanen menimbulkan isu privasi',
          'Hash SHA-256 dapat dengan mudah dibalik untuk memulihkan data aslinya'],
        jawab: [0, 2, 3],
        pembahasan: 'Blockchain menjamin data tidak berubah SETELAH dicatat — bukan menjamin data benar SAAT dicatat ("garbage in, garbage forever"). SHA-256 bersifat satu arah sehingga tidak dapat dibalik.' },
      { level: 'S2', tipe: 'pasangan', ct: 'Dekomposisi', ail: 'Menerapkan',
        q: 'Pasangkan tiap elemen penyimpanan dengan isi yang disimpannya.',
        kiri: ['Smart contract (on-chain)', 'IPFS / Pinata (off-chain)', 'Hash SHA-256', 'CID'],
        kanan: [
          'Metadata lengkap dalam berkas JSON',
          'Sidik jari ringkas untuk mendeteksi perubahan',
          'Ringkasan statistik + hash + CID',
          'Alamat berbasis isi untuk menemukan berkas'],
        jawab: [2, 0, 1, 3],
        pembahasan: 'Rantai menyimpan yang ringkas namun mahal (ringkasan, hash, CID); IPFS menampung yang besar. Hash membuktikan integritas, CID menunjukkan lokasi.' },
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
      { level: 'S2', tipe: 'pasangan', ct: 'Generalisasi', ail: 'Mencipta',
        q: 'Kerangka ini akan diterapkan ke domain IPA lain (mis. pemantauan kualitas air). Klasifikasikan tiap elemen.',
        kiri: [
          'Arsitektur pipeline: sensor → cloud → pra-pemrosesan → model → blockchain',
          'Rentang fisik wajar untuk penyaringan outlier',
          'Protokol evaluasi multi-step dengan baseline Naive',
          'Jenis sensor dan satuan pengukuran',
          'Ambang batas peringatan untuk tindakan lapangan'],
        kanan: ['Dapat dipertahankan', 'Harus diubah / dikalibrasi ulang'],
        jawab: [0, 1, 0, 1, 1],
        pembahasan: 'Yang dapat digeneralisasi adalah struktur dan metodologi; yang harus diganti adalah semua parameter yang terikat pada besaran fisik dan konteks domain tertentu.' },
      { level: 'S3', tipe: 'urut', ct: 'Evaluasi', ail: 'Mengevaluasi',
        q: 'Susun langkah penelitian untuk mengukur peningkatan CT & AI Literacy mahasiswa setelah memakai media ini.',
        langkah: [
          'Tetapkan indikator CT (CSTA) dan AI Literacy (Ng et al.) yang akan diukur',
          'Susun atau adaptasi instrumen, lalu lakukan validasi ahli dan uji reliabilitas',
          'Berikan pre-test kepada mahasiswa sebelum perlakuan',
          'Laksanakan pembelajaran menggunakan media selama periode yang ditetapkan',
          'Berikan post-test dengan instrumen yang setara',
          'Hitung N-gain dan uji signifikansi peningkatannya'],
        pembahasan: 'Instrumen wajib divalidasi SEBELUM pre-test. Bila instrumen disusun setelah data terkumpul, hasil N-gain tidak dapat dipertanggungjawabkan.' },
      { level: 'S3', tipe: 'pasangan', ct: 'Evaluasi', ail: 'Etika',
        q: 'Pasangkan setiap isu etika dengan mitigasi yang paling tepat.',
        kiri: [
          'Privasi lokasi kebun yang tercatat permanen',
          'Bias akibat data yang sangat sedikit',
          'Ketergantungan berlebihan pada keluaran model',
          'Klaim akurasi yang menyesatkan'],
        kanan: [
          'Laporkan MAE/RMSE beserta selang kepercayaan, bukan hanya persentase akurasi',
          'Simpan hanya ringkasan teragregasi; hindari koordinat presisi di rantai publik',
          'Tampilkan baseline pembanding dan nyatakan ketidakpastian prediksi di antarmuka',
          'Nyatakan ukuran sampel dan batas keberlakuan; hindari generalisasi lintas lokasi'],
        jawab: [1, 3, 2, 0],
        pembahasan: 'Mitigasi etika harus menyasar mekanisme penyebabnya: privasi ditangani di tingkat data yang disimpan, bias di tingkat klaim keberlakuan, ketergantungan di tingkat antarmuka, dan klaim akurasi di tingkat pelaporan metrik.' },
      { level: 'S3', tipe: 'ganda', ct: 'Dekomposisi', ail: 'Etika',
        q: 'Anda merancang skema penyimpanan untuk kebun milik petani lain. Pilih SEMUA data yang sebaiknya TIDAK ditulis langsung ke rantai publik.',
        opsi: [
          'Koordinat GPS presisi lokasi kebun',
          'Rata-rata suhu harian',
          'Nama dan nomor telepon pemilik kebun',
          'Hash SHA-256 dari data mentah',
          'Foto kondisi lahan beserta metadata lokasinya'],
        jawab: [0, 2, 4],
        pembahasan: 'Data pengenal pribadi dan lokasi presisi bersifat permanen begitu ditulis ke rantai publik dan tidak dapat ditarik kembali. Statistik teragregasi serta hash aman karena tidak mengungkap identitas.' },
    ],
  },
]

// ============================================================
//  Jalur terpisah: tugas proyek untuk mengukur dimensi "Mencipta"
//  secara LANGSUNG (produksi artefak), yang tidak dapat dijangkau
//  soal tertutup. Dinilai dosen dengan rubrik analitik di bawah —
//  TIDAK masuk ke nilai otomatis.
// ============================================================
export const SKALA_RUBRIK = [
  { n: 1, label: 'Belum memadai' },
  { n: 2, label: 'Berkembang' },
  { n: 3, label: 'Kompeten' },
  { n: 4, label: 'Mahir' },
]

export const PROYEK = {
  judul: 'Proyek Mini — Pipeline IoT → AI → Blockchain',
  ringkas:
    'Kerjakan satu siklus penuh pada satu variabel sensor pilihan Anda, lalu susun laporan singkat (maksimal 4 halaman). ' +
    'Tugas ini mengukur kemampuan MENCIPTA secara langsung, yaitu menghasilkan artefak dan keputusan rancangan Anda sendiri.',
  instruksi: [
    'Pilih satu variabel (suhu, kelembaban udara, atau kelembaban tanah) dan ekspor datanya dari Dashboard sebagai CSV.',
    'Bersihkan data: tentukan rentang fisik wajar Anda sendiri dan jelaskan dasar penetapannya.',
    'Latih minimal dua model pembanding di Lab AI (mis. ANN dan DNN), catat MAE masing-masing.',
    'Bandingkan hasilnya dengan baseline Naive. Nyatakan secara eksplisit bila baseline menang.',
    'Catat ringkasan atau forecast ke blockchain, lalu lampirkan tautan transaksi dan CID IPFS sebagai bukti.',
    'Tulis laporan: tujuan, metode, hasil (MAE/RMSE), keterbatasan, dan pertimbangan etika.',
  ],
  catatan:
    'Nilai proyek ini diberikan dosen memakai rubrik di bawah dan TIDAK termasuk dalam nilai otomatis. ' +
    'Penilaian diri Anda ikut terekspor ke CSV sebagai bahan refleksi, bukan sebagai nilai.',
  rubrik: [
    {
      kriteria: 'Dekomposisi & rancangan pipeline',
      ct: 'Dekomposisi', ail: 'Menerapkan', bobot: 20,
      level: [
        'Tahapan tidak terurai; laporan hanya mendeskripsikan hasil akhir.',
        'Tahapan disebutkan tetapi keterkaitan antar tahap belum dijelaskan.',
        'Seluruh tahap terurai jelas beserta masukan dan keluarannya.',
        'Tahapan terurai jelas disertai justifikasi mengapa rancangan itu dipilih dibanding alternatif lain.',
      ],
    },
    {
      kriteria: 'Kualitas data & pra-pemrosesan',
      ct: 'Abstraksi', ail: 'Menerapkan', bobot: 20,
      level: [
        'Data dipakai apa adanya tanpa pemeriksaan kualitas.',
        'Outlier dibuang tanpa kriteria yang dinyatakan.',
        'Kriteria pembersihan dinyatakan dan diterapkan secara konsisten.',
        'Kriteria dinyatakan, diterapkan, dan dampaknya terhadap error model ditunjukkan dengan angka.',
      ],
    },
    {
      kriteria: 'Pemodelan & evaluasi jujur',
      ct: 'Evaluasi', ail: 'Mengevaluasi', bobot: 25,
      level: [
        'Hanya melaporkan satu angka akurasi tanpa pembanding.',
        'Membandingkan dua model tetapi tanpa baseline Naive.',
        'Membandingkan model dengan baseline Naive memakai MAE/RMSE.',
        'Membandingkan dengan baseline, melaporkan kestabilan antar-seed, dan mengakui bila baseline unggul.',
      ],
    },
    {
      kriteria: 'Verifikasi & integritas data',
      ct: 'Algoritma', ail: 'Memahami', bobot: 15,
      level: [
        'Tidak ada bukti pencatatan maupun verifikasi.',
        'Data tercatat tetapi tautan bukti tidak dilampirkan.',
        'Tautan transaksi dan CID dilampirkan.',
        'Tautan dilampirkan disertai penjelasan cara pihak lain memverifikasi ulang hash secara mandiri.',
      ],
    },
    {
      kriteria: 'Refleksi etika & keterbatasan',
      ct: 'Evaluasi', ail: 'Etika', bobot: 20,
      level: [
        'Keterbatasan tidak disinggung.',
        'Keterbatasan disebut secara umum tanpa kaitan pada data sendiri.',
        'Keterbatasan spesifik pada data dan model sendiri diidentifikasi.',
        'Keterbatasan diidentifikasi, dampaknya pada klaim dinyatakan, dan mitigasi konkret diusulkan.',
      ],
    },
  ],
}
