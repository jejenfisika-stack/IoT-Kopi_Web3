/**
 * Apps Script penyimpan hasil Pre/Post-test — Web3 Sensor Kopi Blockchain.
 * Tempel skrip ini di Google Sheet Anda: menu Extensions → Apps Script.
 *
 * Fungsi:
 *  - Menerima hasil tes dari situs (lewat server situs, bukan langsung browser).
 *  - Menolak data tanpa token yang benar.
 *  - Mencegah pengisian ganda (1 NIM hanya boleh 1x per fase pre/post).
 *  - Menghitung N-gain otomatis saat post-test masuk, TERPISAH untuk skor total,
 *    subskala Computational Thinking, dan subskala AI Literacy.
 *
 * Data TIDAK dapat DIBACA lewat webhook ini — skrip hanya menambah baris.
 */

// ⚠️ GANTI dengan token rahasia Anda sendiri (huruf+angka acak, ±32 karakter).
// Nilai ini HARUS SAMA PERSIS dengan env var SHEET_WEBHOOK_TOKEN di Vercel.
const TOKEN = 'GANTI_DENGAN_TOKEN_RAHASIA_ANDA';

const SHEET_NAME = 'Hasil';

// Skor maksimum tiap subskala — harus sama dengan blueprint di soalPrePost.js
const MAKS_TOTAL = 25;
const MAKS_CT    = 12;
const MAKS_AIL   = 13;

// ── Batas pengaman di sisi Apps Script sendiri ──
// PENTING: seluruh pembatas di situs (panjang teks, laju kiriman) hanya berlaku
// bila data lewat situs. Kiriman LANGSUNG ke URL ini melewati semuanya, jadi
// pemeriksaan yang setara harus ada juga di sini.
const MAKS_TEKS = 100;
const MAKS_JAWABAN = 2000;
const MAKS_BARIS = 20000;

// Netralkan karakter pembuka rumus agar isian tidak pernah dieksekusi sebagai
// formula di Sheets. Apostrof di depan memaksa Sheets membacanya sebagai teks
// dan tidak ikut tampil, sehingga data tetap terbaca apa adanya.
function aman(v, maks) {
  var s = String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim();
  if (s.length > (maks || MAKS_TEKS)) s = s.substring(0, maks || MAKS_TEKS);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

// NIM dipakai sebagai kunci pencocokan, jadi dibatasi ke karakter aman saja
function amanNim(v) {
  return String(v == null ? '' : v).trim().replace(/[^A-Za-z0-9._-]/g, '').substring(0, 30);
}

function angka(v) {
  var n = Number(v);
  return isFinite(n) && n >= 0 ? n : 0;
}

const HEADER = [
  'Waktu', 'NIM', 'Nama', 'Kelas', 'Fase', 'Skor', 'Maks', 'CT', 'AIL',
  'Dekomposisi', 'PengenalanPola', 'Abstraksi', 'Algoritma', 'Evaluasi', 'Generalisasi',
  'Memahami', 'Menerapkan', 'Mengevaluasi', 'Mencipta', 'Etika',
  'Jawaban', 'Skor Pre', 'N-gain', 'Kategori', 'N-gain CT', 'N-gain AIL'
];

function hitungNgain(post, pre, maks) {
  if (pre === null || isNaN(pre)) return null;
  var penyebut = maks - pre;
  var g = penyebut <= 0 ? 1 : (post - pre) / penyebut;
  return Math.round(g * 100) / 100;
}

function kategoriNgain(g) {
  if (g === null) return '';
  return g >= 0.7 ? 'Tinggi' : g >= 0.3 ? 'Sedang' : 'Rendah';
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    // 1) Keamanan: cek token
    if (!body || body.token !== TOKEN) {
      return jsonOut({ status: 'error', message: 'token tidak valid' });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) {
      sh = ss.insertSheet(SHEET_NAME);
      sh.appendRow(HEADER);
      sh.setFrozenRows(1);
    }

    const nim  = amanNim(body.nim);
    const form = body.form === 'post' ? 'post' : 'pre';
    const skor = angka(body.skor);
    const maks = angka(body.maks) || MAKS_TOTAL;
    const ct   = angka(body.ct);
    const ail  = angka(body.ail);

    // 1b) Pemeriksaan kewajaran — berlaku juga untuk kiriman langsung
    if (!nim) return jsonOut({ status: 'error', message: 'NIM wajib diisi' });
    if (maks !== MAKS_TOTAL || skor > maks) {
      return jsonOut({ status: 'error', message: 'skor tidak wajar' });
    }
    if (ct > MAKS_CT || ail > MAKS_AIL || (ct + ail) !== skor) {
      return jsonOut({ status: 'error', message: 'rincian subskala tidak konsisten' });
    }
    if (sh.getLastRow() > MAKS_BARIS) {
      return jsonOut({ status: 'error', message: 'sheet penuh, hubungi pengelola' });
    }

    // Baca HANYA kolom B..I (NIM, Nama, Kelas, Fase, Skor, Maks, CT, AIL).
    // Membaca seluruh sheet membuat tiap pengiriman makin lambat seiring
    // bertambahnya baris, dan bisa melewati tenggat 9 detik di sisi situs.
    const barisAkhir = sh.getLastRow();
    // rows[i] = [NIM, Nama, Kelas, Fase, Skor, Maks, CT, AIL]
    const rows = barisAkhir > 1 ? sh.getRange(2, 2, barisAkhir - 1, 8).getValues() : [];

    // 2) Cegah pengisian ganda (NIM + fase sama)
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === nim && String(rows[i][3]) === form) {
        return jsonOut({ status: 'duplicate' });
      }
    }

    // 3) Hitung N-gain bila ini post-test dan pre-test-nya sudah ada
    let skorPre = null, preCt = null, preAil = null;
    let ngain = null, ngainCt = null, ngainAil = null, kategori = '';
    if (form === 'post') {
      for (let i = 0; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === nim && String(rows[i][3]) === 'pre') {
          skorPre = Number(rows[i][4]);
          preCt   = Number(rows[i][6]);
          preAil  = Number(rows[i][7]);
          break;
        }
      }
      ngain    = hitungNgain(skor, skorPre, MAKS_TOTAL);
      ngainCt  = hitungNgain(ct,   preCt,   MAKS_CT);
      ngainAil = hitungNgain(ail,  preAil,  MAKS_AIL);
      kategori = kategoriNgain(ngain);
    }

    // 4) Simpan baris — seluruh nilai teks dilewatkan aman()
    sh.appendRow([
      new Date(), nim, aman(body.nama), aman(body.kelas), form,
      skor, maks, ct, ail,
      angka(body.dek), angka(body.pol), angka(body.abs),
      angka(body.alg), angka(body.eva), angka(body.gen),
      angka(body.mem), angka(body.men), angka(body.mgv),
      angka(body.mcp), angka(body.etk),
      aman(body.jawaban, MAKS_JAWABAN),
      skorPre === null ? '' : skorPre,
      ngain === null ? '' : ngain,
      kategori,
      ngainCt === null ? '' : ngainCt,
      ngainAil === null ? '' : ngainAil,
    ]);

    return jsonOut({
      status: 'ok', ngain: ngain, skorPre: skorPre, kategori: kategori,
      ngainCt: ngainCt, ngainAil: ngainAil,
    });
  } catch (err) {
    return jsonOut({ status: 'error', message: String(err) });
  }
}

function doGet() {
  return jsonOut({ status: 'ok', message: 'Webhook aktif. Gunakan POST untuk mengirim data.' });
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
