// ============================================================
//  Bank soal Pre-test (Form A) & Post-test (Form B) — PARALLEL FORMS
//  Proyek: Web3 Sensor Kopi Blockchain (IoT · peramalan deret waktu)
//
//  Blueprint IDENTIK antara Form A dan Form B:
//    Subskala CT  (CSTA)      : Dekomposisi 2, Pengenalan Pola 2, Abstraksi 2,
//                               Algoritma 2, Evaluasi 2, Generalisasi 2  = 12
//    Subskala AIL (Ng et al.) : Memahami 3, Menerapkan 3, Mengevaluasi 3,
//                               Mencipta 2, Etika 2                      = 13
//    Total 25 butir · skor maksimum 25
//
//  Tiap sel (dimensi × level Bloom) di Form B menguji konstruk yang SAMA
//  dengan pasangannya di Form A, tetapi dengan butir yang berbeda.
//
//  PENTING — butir di sini SENGAJA BERBEDA dari kuis latihan di
//  app/belajar/materi.js supaya tidak ada kebocoran instrumen. Berbeda pula
//  dari kuis latihan, tes ini TIDAK menampilkan pembahasan.
//
//  CATATAN: draf awal. Wajib divalidasi ahli (expert judgment) dan diuji
//  reliabilitasnya sebelum dipakai mengambil data penelitian.
//
//  POSISI KUNCI: `jwb` di berkas ini hampir selalu bernilai 1. Itu semata urutan
//  penulisan dan TIDAK terlihat mahasiswa — halaman /tes mengacak urutan butir
//  sekaligus urutan opsi tiap butir, lalu melacak ulang posisi jawaban benarnya.
//  Panjang antar-opsi juga sudah disetarakan agar tidak ada petunjuk tak sengaja.
// ============================================================

export const SUBSKALA = {
  CT:  { label: 'Computational Thinking', ket: 'CSTA',        max: 12, warna: '#4ade80' },
  AIL: { label: 'AI Literacy',            ket: 'Ng et al.',   max: 13, warna: '#a78bfa' },
}

export const DIM_PP = {
  DEK: { sub: 'CT',  label: 'Dekomposisi',     max: 2 },
  POL: { sub: 'CT',  label: 'Pengenalan Pola', max: 2 },
  ABS: { sub: 'CT',  label: 'Abstraksi',       max: 2 },
  ALG: { sub: 'CT',  label: 'Algoritma',       max: 2 },
  EVA: { sub: 'CT',  label: 'Evaluasi',        max: 2 },
  GEN: { sub: 'CT',  label: 'Generalisasi',    max: 2 },
  MEM: { sub: 'AIL', label: 'Memahami',        max: 3 },
  MEN: { sub: 'AIL', label: 'Menerapkan',      max: 3 },
  MGV: { sub: 'AIL', label: 'Mengevaluasi',    max: 3 },
  MCP: { sub: 'AIL', label: 'Mencipta',        max: 2 },
  ETK: { sub: 'AIL', label: 'Etika',           max: 2 },
}

// ══════════════════════════════════════════════════════════════
//  FORM A — PRE-TEST
// ══════════════════════════════════════════════════════════════
const FORM_A = [
  // ── Dekomposisi ──
  { dim: 'DEK', bloom: 'C2', teks: 'Sistem pemantauan kebun ini dipecah menjadi empat lapisan. Lapisan yang bertugas mengubah besaran fisik menjadi angka adalah…',
    opts: ['Lapisan penyimpanan', 'Lapisan penginderaan', 'Lapisan aplikasi', 'Lapisan pengumpulan data'], jwb: 1 },
  { dim: 'DEK', bloom: 'C3', teks: 'Sebuah tim ingin mengganti layanan awan yang dipakai tanpa membongkar bagian lain. Perancangan seperti apa yang memungkinkan hal itu?',
    opts: ['Menyatukan seluruh kode dalam satu berkas agar mudah dicari dan diubah', 'Memisahkan sistem menjadi lapisan dengan tanggung jawab tunggal dan antarmuka jelas', 'Menyimpan seluruh data pada satu tempat agar mudah ditelusuri kembali', 'Menghapus lapisan peramalan supaya jumlah komponen menjadi lebih sedikit'], jwb: 1 },

  // ── Pengenalan Pola ──
  { dim: 'POL', bloom: 'C2', teks: 'Grafik kelembaban tanah menurun perlahan selama dua minggu tanpa naik kembali. Komponen deret waktu yang paling menonjol adalah…',
    opts: ['Musiman', 'Tren', 'Derau acak', 'Outlier'], jwb: 1 },
  { dim: 'POL', bloom: 'C3', teks: 'Dalam satu jam, sensor suhu membaca 29, 29, 30, 78, 30, 29. Kesimpulan yang paling tepat adalah…',
    opts: ['Terjadi lonjakan suhu nyata yang perlu dicatat', 'Nilai 78 adalah anomali instrumen yang perlu ditandai', 'Sensor bekerja normal karena rata-ratanya wajar', 'Seluruh data jam itu harus dibuang'], jwb: 1 },

  // ── Abstraksi ──
  { dim: 'ABS', bloom: 'C2', teks: 'Ribuan pembacaan dalam sehari diringkas menjadi rata-rata, minimum, dan maksimum. Proses ini adalah contoh…',
    opts: ['Dekomposisi', 'Abstraksi', 'Debugging', 'Iterasi'], jwb: 1 },
  { dim: 'ABS', bloom: 'C3', teks: 'Deret waktu diubah menjadi pasangan masukan-keluaran: tujuh nilai terakhir memprediksi nilai berikutnya. Manfaat utama pengubahan ini adalah…',
    opts: ['Menghemat ruang penyimpanan data', 'Mengubah masalah deret waktu menjadi masalah pembelajaran terawasi', 'Menghilangkan seluruh derau dari data', 'Menambah jumlah sampel tanpa batas'], jwb: 1 },

  // ── Algoritma ──
  { dim: 'ALG', bloom: 'C2', teks: 'Urutan yang benar sebelum sebuah ringkasan harian dapat dicatat ke blockchain adalah…',
    opts: ['Kirim transaksi → hitung hash → unggah metadata', 'Hitung ringkasan → hitung hash → unggah metadata → kirim transaksi', 'Unggah metadata → kirim transaksi → hitung ringkasan', 'Hitung hash → kirim transaksi → hitung ringkasan'], jwb: 1 },
  { dim: 'ALG', bloom: 'C3', teks: 'Peramalan tujuh hari ke depan dilakukan secara rekursif. Artinya…',
    opts: ['Model dilatih ulang setiap hari dengan data baru', 'Hasil prediksi hari sebelumnya dipakai sebagai masukan untuk memprediksi hari berikutnya', 'Tujuh model berbeda dilatih untuk tujuh hari', 'Model membaca data aktual hari berikutnya sebelum memprediksi'], jwb: 1 },

  // ── Evaluasi ──
  { dim: 'EVA', bloom: 'C4', teks: 'Pada data uji yang sama, sebuah model memiliki MAE 1,2 dan RMSE 4,8. Penafsiran yang paling tepat adalah…',
    opts: ['Model tersebut sangat akurat karena nilai MAE-nya tergolong kecil', 'Terdapat beberapa kesalahan berukuran besar yang menaikkan RMSE', 'MAE dan RMSE tidak dapat dibandingkan pada data uji yang sama', 'Jumlah data uji terlalu banyak sehingga metriknya menjadi bias'], jwb: 1 },
  { dim: 'EVA', bloom: 'C5', teks: 'Model A diuji memprediksi satu hari ke depan dengan data aktual sebagai masukan, sedangkan model B diuji memprediksi tujuh hari ke depan secara rekursif. Penilaian yang tepat atas perbandingan itu adalah…',
    opts: ['Perbandingan sah karena keduanya memakai data yang sama', 'Perbandingan tidak setara karena tingkat kesulitan tugasnya berbeda', 'Model A pasti lebih baik karena errornya lebih kecil', 'Model B pasti lebih baik karena horizonnya lebih panjang'], jwb: 1 },

  // ── Generalisasi ──
  { dim: 'GEN', bloom: 'C4', teks: 'Kerangka sistem ini akan diterapkan untuk memantau kualitas air tambak. Bagian yang paling mungkin dipertahankan tanpa perubahan adalah…',
    opts: ['Rentang fisik wajar yang dipakai untuk menyaring outlier', 'Alur pipeline dari sensor hingga pencatatan terverifikasi', 'Jenis sensor beserta satuan pengukuran yang dipakai', 'Ambang peringatan yang memicu tindakan di lapangan'], jwb: 1 },
  { dim: 'GEN', bloom: 'C5', teks: 'Sebuah metode terbukti baik pada satu kebun. Syarat paling penting sebelum metode itu diklaim berlaku umum adalah…',
    opts: ['Menambah jumlah model yang dibandingkan', 'Mengujinya pada lokasi dan kondisi yang berbeda', 'Memperpanjang horizon peramalan', 'Mempercantik tampilan antarmuka'], jwb: 1 },

  // ── AIL · Memahami ──
  { dim: 'MEM', bloom: 'C1', teks: 'Pernyataan yang paling tepat tentang pembelajaran mesin adalah…',
    opts: ['Program yang menjalankan rumus tetap yang ditulis manusia', 'Sistem yang menemukan pola dari data untuk membuat prediksi', 'Perangkat keras khusus penyimpan data besar', 'Aplikasi yang selalu memerlukan blockchain'], jwb: 1 },
  { dim: 'MEM', bloom: 'C2', teks: 'Pada pelatihan jaringan saraf, "loss" menyatakan…',
    opts: ['Jumlah data yang hilang saat pelatihan', 'Seberapa jauh prediksi model dari nilai sebenarnya', 'Lamanya waktu pelatihan', 'Banyaknya neuron yang tidak aktif'], jwb: 1 },
  { dim: 'MEM', bloom: 'C2', teks: 'Model Naive dalam peramalan bekerja dengan cara…',
    opts: ['Merata-ratakan seluruh data historis', 'Mengulang nilai pengamatan terakhir', 'Melatih jaringan saraf berlapis', 'Memilih nilai secara acak'], jwb: 1 },

  // ── AIL · Menerapkan ──
  { dim: 'MEN', bloom: 'C3', teks: 'Data suhu berkisar 20–35 °C akan dilatihkan ke jaringan saraf. Langkah pra-pemrosesan yang tepat adalah…',
    opts: ['Membulatkan seluruh nilai ke bilangan bulat', 'Menskalakan nilai ke rentang 0–1 agar pelatihan stabil', 'Mengubah satuan menjadi Fahrenheit', 'Mengurutkan nilai dari kecil ke besar'], jwb: 1 },
  { dim: 'MEN', bloom: 'C3', teks: 'Anda ingin memeriksa apakah berkas metadata di IPFS masih asli. Langkah yang benar adalah…',
    opts: ['Membandingkan ukuran berkas dengan catatan di blockchain', 'Menghitung ulang hash berkas lalu membandingkannya dengan hash di blockchain', 'Membuka berkas dan membaca isinya sekilas', 'Mengunggah ulang berkas tersebut ke IPFS'], jwb: 1 },
  { dim: 'MEN', bloom: 'C3', teks: 'Data sensor memiliki banyak hari kosong. Penanganan yang paling dapat dipertanggungjawabkan adalah…',
    opts: ['Mengisi seluruh celah dengan rata-rata global', 'Menginterpolasi hanya celah pendek dan menandai nilai hasil interpolasi', 'Menyalin nilai hari pertama ke semua hari kosong', 'Membiarkan celah tanpa keterangan apa pun'], jwb: 1 },

  // ── AIL · Mengevaluasi ──
  { dim: 'MGV', bloom: 'C4', teks: 'Sebuah laporan menyebut akurasi peramalan 97% tanpa menyertakan pembanding apa pun. Sikap kritis yang tepat adalah…',
    opts: ['Menerima laporan itu karena angkanya sudah tergolong tinggi', 'Menanyakan berapa akurasi model dasar seperti Naive pada data yang sama', 'Meminta akurasinya ditingkatkan lagi hingga mencapai 99%', 'Meminta modelnya diganti dengan arsitektur yang lebih rumit'], jwb: 1 },
  { dim: 'MGV', bloom: 'C4', teks: 'Sebuah model deep learning dilatih tiga kali dengan benih acak berbeda dan menghasilkan MAE 1,1; 2,4; dan 3,0. Kesimpulan yang tepat adalah…',
    opts: ['Model itu akurat karena pernah mencapai MAE 1,1 pada salah satu percobaan', 'Hasil model tidak stabil sehingga tidak layak dilaporkan dari satu kali pelatihan', 'Data uji terlalu kecil sehingga metrik MAE menjadi tidak berlaku', 'Benih acak seharusnya ditetapkan bernilai sama agar hasilnya konsisten'], jwb: 1 },
  { dim: 'MGV', bloom: 'C5', teks: 'Pada data yang pendek dan tidak kontinu, model Naive mengungguli LSTM. Penjelasan yang paling masuk akal adalah…',
    opts: ['Penerapan LSTM pada kasus itu pasti mengandung kesalahan teknis', 'Deret tersebut mendekati jalan acak sehingga nilai terakhir memang penduga terbaik', 'MAE bukan metrik yang sah dipakai untuk data deret waktu', 'Data uji sengaja dipilih agar menguntungkan model Naive'], jwb: 1 },

  // ── AIL · Mencipta ──
  { dim: 'MCP', bloom: 'C6', teks: 'Anda ingin menguji secara jujur apakah penambahan data membuat deep learning unggul. Rancangan yang paling tepat adalah…',
    opts: ['Melatih ulang model sampai hasilnya bagus lalu melaporkannya', 'Menetapkan hipotesis dan protokol evaluasi lebih dulu, lalu melaporkan hasil apa adanya', 'Membandingkan hanya model deep learning satu sama lain', 'Memilih data uji setelah melihat hasil prediksi'], jwb: 1 },
  { dim: 'MCP', bloom: 'C6', teks: 'Anda hendak menambah satu sensor untuk memprediksi risiko busuk akar pada kopi. Dasar pemilihan yang paling tepat adalah…',
    opts: ['Sensor yang paling murah di pasaran', 'Sensor yang mengukur faktor penyebab langsung, misalnya lama tanah jenuh air', 'Sensor yang paling banyak dipakai orang lain', 'Sensor yang menghasilkan angka paling besar'], jwb: 1 },

  // ── AIL · Etika ──
  { dim: 'ETK', bloom: 'C5', teks: 'Sistem akan mencatat data kebun milik petani lain ke blockchain publik. Data yang sebaiknya TIDAK ditulis ke sana adalah…',
    opts: ['Rata-rata suhu harian', 'Koordinat GPS presisi lokasi kebun', 'Hash dari data mentah', 'Jumlah pembacaan per hari'], jwb: 1 },
  { dim: 'ETK', bloom: 'C5', teks: 'Pernyataan yang benar tentang batas jaminan blockchain adalah…',
    opts: ['Blockchain menjamin data yang dicatat pasti benar secara ilmiah', 'Blockchain menjamin data tidak berubah setelah dicatat, bukan menjamin kebenarannya saat dicatat', 'Blockchain dapat memperbaiki kesalahan sensor secara otomatis', 'Blockchain membuat data menjadi rahasia dan hanya terbaca pemiliknya'], jwb: 1 },
]

// ══════════════════════════════════════════════════════════════
//  FORM B — POST-TEST (blueprint identik, butir berbeda)
// ══════════════════════════════════════════════════════════════
const FORM_B = [
  // ── Dekomposisi ──
  { dim: 'DEK', bloom: 'C2', teks: 'Dalam sistem ini, tugas menyimpan metadata lengkap yang berukuran besar dipegang oleh…',
    opts: ['Kontrak pintar di blockchain', 'IPFS', 'Mikrokontroler di kebun', 'Layar OLED di lokasi'], jwb: 1 },
  { dim: 'DEK', bloom: 'C3', teks: 'Satu titik akhir jaringan berhenti beroperasi dan seluruh fungsi sistem lumpuh. Akar persoalan rancangannya adalah…',
    opts: ['Sistem terlalu banyak dipecah menjadi bagian kecil', 'Satu ketergantungan dipakai di banyak tempat tanpa cadangan', 'Data yang disimpan terlalu besar', 'Jumlah sensor terlalu sedikit'], jwb: 1 },

  // ── Pengenalan Pola ──
  { dim: 'POL', bloom: 'C2', teks: 'Kelembaban udara naik setiap dini hari dan turun setiap siang, berulang setiap hari. Komponen deret waktu yang paling menonjol adalah…',
    opts: ['Tren', 'Musiman', 'Outlier', 'Derau acak'], jwb: 1 },
  { dim: 'POL', bloom: 'C3', teks: 'Grafik kelembaban tanah mendatar sempurna pada nilai 0% selama beberapa jam, lalu kembali normal. Dugaan yang paling masuk akal adalah…',
    opts: ['Tanah benar-benar mengering total dalam hitungan jam', 'Sensor terlepas atau kabelnya terputus pada rentang itu', 'Terjadi hujan deras di lokasi', 'Model peramalan sedang bekerja'], jwb: 1 },

  // ── Abstraksi ──
  { dim: 'ABS', bloom: 'C2', teks: 'Nilai ADC 0–1023 dari sensor tanah diubah menjadi persentase kelembaban. Proses ini adalah contoh…',
    opts: ['Iterasi', 'Abstraksi', 'Dekomposisi', 'Validasi'], jwb: 1 },
  { dim: 'ABS', bloom: 'C3', teks: 'Seluruh data mentah satu hari diringkas menjadi satu sidik jari SHA-256 sepanjang 64 karakter. Sifat penting yang membuat ringkasan itu berguna adalah…',
    opts: ['Ukurannya kecil sehingga hemat biaya penyimpanan saja', 'Perubahan sekecil apa pun pada data akan mengubah sidik jarinya secara total', 'Sidik jari dapat dibalik untuk memulihkan data asli', 'Sidik jari selalu sama untuk data yang berbeda'], jwb: 1 },

  // ── Algoritma ──
  { dim: 'ALG', bloom: 'C2', teks: 'Urutan kerja program pada mikrokontroler yang benar adalah…',
    opts: ['Kirim ke awan → baca sensor → tampilkan', 'Baca sensor → tampilkan → kirim ke awan', 'Tampilkan → kirim ke awan → baca sensor', 'Kirim ke awan → tampilkan → baca sensor'], jwb: 1 },
  { dim: 'ALG', bloom: 'C3', teks: 'Kontrak pintar menolak pencatatan ringkasan untuk tanggal yang sama dua kali. Mekanisme yang membuatnya demikian adalah…',
    opts: ['Kontrak memeriksa saldo pengirim sebelum mencatat', 'Kontrak menyimpan penanda tanggal yang sudah tercatat dan menolak bila sudah ada', 'Kontrak membandingkan seluruh isi data lama dengan data baru', 'Kontrak membatasi jumlah transaksi per hari'], jwb: 1 },

  // ── Evaluasi ──
  { dim: 'EVA', bloom: 'C4', teks: 'Setelah outlier dibersihkan, error model turun tajam. Penafsiran yang paling tepat adalah…',
    opts: ['Data menjadi lebih sedikit sehingga error otomatis mengecil', 'Model tidak lagi memaksakan diri mencocokkan nilai yang bukan berasal dari proses fisik', 'Pembersihan turut mengubah satuan pengukuran yang dipakai', 'Model menjadi lebih rumit setelah proses pembersihan dijalankan'], jwb: 1 },
  { dim: 'EVA', bloom: 'C5', teks: 'Sebuah studi melaporkan hasil model deep learning hanya dari satu kali proses pelatihan. Kelemahan metodologis utamanya adalah…',
    opts: ['Waktu pelatihan menjadi terlalu lama', 'Hasilnya bisa merupakan kebetulan inisialisasi dan tidak dapat diulang', 'Jumlah data uji menjadi berkurang', 'Metrik yang dipakai menjadi tidak sah'], jwb: 1 },

  // ── Generalisasi ──
  { dim: 'GEN', bloom: 'C4', teks: 'Kerangka sistem ini akan dipakai memantau cuaca mikro rumah kaca. Bagian yang paling wajib disesuaikan adalah…',
    opts: ['Alur dari sensor hingga pencatatan terverifikasi', 'Protokol evaluasi dengan pembanding Naive', 'Rentang fisik wajar dan ambang peringatan', 'Cara menghitung sidik jari data'], jwb: 2 },
  { dim: 'GEN', bloom: 'C5', teks: 'Temuan "model sederhana mengungguli model kompleks" diperoleh dari satu lokasi dengan data terbatas. Klaim yang paling dapat dipertanggungjawabkan adalah…',
    opts: ['Model sederhana selalu lebih baik pada semua kasus pertanian', 'Pada kondisi data seperti ini, model sederhana perlu selalu diuji sebagai pembanding', 'Model kompleks tidak perlu dipakai lagi', 'Temuan itu berlaku untuk semua jenis data deret waktu'], jwb: 1 },

  // ── AIL · Memahami ──
  { dim: 'MEM', bloom: 'C1', teks: 'Pernyataan yang paling tepat tentang jaringan saraf tiruan adalah…',
    opts: ['Tiruan fisik sel otak manusia yang ditanam pada perangkat keras', 'Model matematis berlapis yang menyesuaikan bobot berdasarkan data', 'Basis data khusus untuk menyimpan citra', 'Protokol pengiriman data antar perangkat'], jwb: 1 },
  { dim: 'MEM', bloom: 'C2', teks: 'Kurva loss pelatihan menurun, tetapi kurva loss validasi mulai naik. Keadaan ini disebut…',
    opts: ['Underfitting', 'Overfitting', 'Normalisasi', 'Konvergensi sempurna'], jwb: 1 },
  { dim: 'MEM', bloom: 'C2', teks: 'Istilah "horizon" dalam peramalan deret waktu berarti…',
    opts: ['Banyaknya data historis yang dipakai melatih model', 'Berapa langkah ke depan yang diprediksi', 'Jumlah variabel yang diukur sensor', 'Batas maksimum nilai yang boleh diprediksi'], jwb: 1 },

  // ── AIL · Menerapkan ──
  { dim: 'MEN', bloom: 'C3', teks: 'Anda ingin membandingkan dua model secara adil. Langkah yang wajib dilakukan adalah…',
    opts: ['Memberi model baru data uji yang lebih mudah', 'Memakai data uji dan protokol evaluasi yang sama untuk keduanya', 'Melatih model baru lebih lama daripada model lama', 'Memilih metrik yang berbeda untuk masing-masing model'], jwb: 1 },
  { dim: 'MEN', bloom: 'C3', teks: 'Sebuah dokumen metadata diunduh dari IPFS dan hash-nya berbeda dari yang tercatat di blockchain. Kesimpulan yang benar adalah…',
    opts: ['Blockchain sedang mengalami gangguan', 'Berkas tersebut sudah berubah atau bukan berkas yang sama dengan yang dicatat', 'Hash memang selalu berubah setiap kali dihitung', 'Berkas perlu diunggah ulang agar hash-nya cocok'], jwb: 1 },
  { dim: 'MEN', bloom: 'C3', teks: 'Data sensor hanya tersedia dalam sesi-sesi pendek yang terpisah jauh. Analisis yang paling sesuai adalah…',
    opts: ['Memaksakan deret harian dengan mengisi seluruh hari kosong', 'Menganalisis di dalam tiap sesi perekaman yang kontinu', 'Membuang seluruh sesi yang pendek', 'Menggabungkan semua sesi seolah berurutan tanpa jeda'], jwb: 1 },

  // ── AIL · Mengevaluasi ──
  { dim: 'MGV', bloom: 'C4', teks: 'Sebuah antarmuka menampilkan angka 0 pada kartu data padahal sebenarnya gagal membaca blockchain. Masalah utamanya adalah…',
    opts: ['Angka 0 terlalu kecil untuk dibaca pengguna', 'Kegagalan disamarkan sebagai keadaan normal sehingga menyesatkan pengguna', 'Kartu data seharusnya tidak ditampilkan sama sekali', 'Blockchain seharusnya menyimpan angka selain 0'], jwb: 1 },
  { dim: 'MGV', bloom: 'C4', teks: 'Akurasi dihitung sebagai 100 dikurangi MAPE. Pada data bernilai besar dan stabil, metrik ini cenderung…',
    opts: ['Menghasilkan angka yang terlalu rendah dibanding kenyataannya', 'Menghasilkan angka tinggi yang terkesan mengesankan meski model biasa saja', 'Tidak dapat dihitung sama sekali pada data bernilai besar', 'Selalu menghasilkan nilai yang sama persis dengan MAE'], jwb: 1 },
  { dim: 'MGV', bloom: 'C5', teks: 'Dua model memiliki MAE yang hanya berbeda tipis pada data uji yang kecil. Langkah yang paling tepat sebelum menyatakan salah satunya lebih unggul adalah…',
    opts: ['Memilih model dengan angka lebih kecil dan melaporkannya', 'Menguji apakah perbedaan itu signifikan secara statistik', 'Menambah jumlah lapisan pada model yang kalah', 'Mengganti metrik hingga selisihnya membesar'], jwb: 1 },

  // ── AIL · Mencipta ──
  { dim: 'MCP', bloom: 'C6', teks: 'Anda merancang penelitian untuk menguji pengaruh lebar jendela masukan terhadap ketepatan peramalan. Rancangan yang paling tepat adalah…',
    opts: ['Mengubah lebar jendela sekaligus mengganti arsitektur model', 'Mengubah hanya lebar jendela sambil menahan variabel lain tetap', 'Memakai data uji berbeda untuk tiap lebar jendela', 'Melaporkan hanya lebar jendela yang hasilnya terbaik'], jwb: 1 },
  { dim: 'MCP', bloom: 'C6', teks: 'Anda ingin memperkuat kepercayaan terhadap data sensor tanpa bergantung pada kejujuran satu pihak. Rancangan yang paling menjanjikan adalah…',
    opts: ['Menambah jumlah pembacaan per hari dari satu alat', 'Memasang beberapa simpul sensor yang saling memeriksa sebelum data dicatat', 'Menyimpan data di dua layanan awan berbeda', 'Mengganti sensor dengan merek yang lebih mahal'], jwb: 1 },

  // ── AIL · Etika ──
  { dim: 'ETK', bloom: 'C5', teks: 'Sebuah sistem AI dipakai menentukan harga beli hasil panen petani. Kewajiban etis yang paling mendasar adalah…',
    opts: ['Menyembunyikan cara kerja model agar tidak disalahgunakan', 'Menyatakan keterbatasan dan ketidakpastian model secara terbuka kepada yang terdampak', 'Menaikkan akurasi yang dilaporkan agar petani percaya', 'Menyerahkan seluruh keputusan kepada model tanpa peninjauan'], jwb: 1 },
  { dim: 'ETK', bloom: 'C5', teks: 'Data yang telanjur dicatat ke blockchain publik ternyata memuat informasi pribadi. Kenyataan yang harus disadari adalah…',
    opts: ['Data dapat dihapus dengan mudah oleh pemilik kontrak', 'Data bersifat permanen sehingga pencegahan sebelum pencatatan jauh lebih penting', 'Data akan hilang sendiri setelah beberapa bulan', 'Data hanya dapat dibaca oleh pemilik kontrak'], jwb: 1 },
]

export const SOAL_PP = { A: FORM_A, B: FORM_B }

// ── Pemeriksaan blueprint (dipakai skrip validasi & saat pengembangan) ──
export function ringkasBlueprint(form) {
  const bank = form === 'post' ? FORM_B : FORM_A
  const per = {}
  bank.forEach(s => { per[s.dim] = (per[s.dim] || 0) + 1 })
  const perSub = { CT: 0, AIL: 0 }
  bank.forEach(s => { perSub[DIM_PP[s.dim].sub] += 1 })
  return { total: bank.length, perDim: per, perSub }
}
