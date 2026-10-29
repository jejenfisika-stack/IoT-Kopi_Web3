# -*- coding: utf-8 -*-
"""Bangun arsip hasil Fase 2 secara DETERMINISTIK, lalu cetak sidik jarinya.

Mengapa deterministik: berkas ZIP biasanya menyimpan jam pembuatan, sehingga
dua kali pembangunan menghasilkan sidik jari berbeda walau isinya sama. Di sini
seluruh stempel waktu dipaku, urutan berkas diurutkan, dan tingkat pemampatan
ditetapkan. Akibatnya siapa pun yang menjalankan skrip ini dari isi repo yang
sama akan memperoleh SHA-256 yang sama persis -- dan itulah yang membuat sidik
jari ini layak ditambatkan ke blockchain.

    python bangun_arsip.py
"""
import hashlib
import os
import zipfile

AKAR = os.path.dirname(os.path.abspath(__file__))
PROYEK = os.path.dirname(AKAR)
SUMBER = os.path.join(PROYEK, "paper", "data")
ZIP = os.path.join(AKAR, "hasil_fase2.zip")

# Stempel waktu dipaku: tanggal sesi pengambilan data, bukan jam pembangunan.
WAKTU_TETAP = (2026, 8, 24, 0, 0, 0)

ISI = [
    "tabel1_praproses.csv",
    "tabel2_hasil.csv",
    "tabel3_diebold_mariano.csv",
    "tabel4_juara_horizon.csv",
]

KETERANGAN = """Arsip Hasil Fase 2
==================

Keluaran numerik dari forecasting-model/Fase2_Perbandingan_Model.ipynb,
yang menjadi dasar seluruh tabel di naskah "Diagnose Before You Train".

Isi
---
tabel1_praproses.csv          ringkasan pra-pemrosesan per variabel
tabel2_hasil.csv              MAE/RMSE/MASE tiap model x horizon,
                              lengkap dengan selang kepercayaan bootstrap
tabel3_diebold_mariano.csv    540 uji Diebold-Mariano berpasangan
tabel4_juara_horizon.csv      model terbaik tiap variabel dan horizon

Sumber data
-----------
dataset/sesi_20260824-20260829.csv
SHA-256 92025679db8c2ab50123ebe812ace209f60643cd0c229ac16aca5e1c44454690

Keterulangan
------------
Arsip ini dibangun oleh arsip-hasil/bangun_arsip.py dengan seluruh stempel
waktu dipaku, sehingga sidik jarinya dapat dihitung ulang oleh siapa pun.
Menjalankan ulang notebook tidak menghasilkan berkas yang identik byte demi
byte -- pustaka numerik berbeda di digit terakhir antar versi. Keterulangan
diperiksa terhadap angka di dalam tabel pada ketelitian yang tercetak,
sedangkan sidik jari di blockchain menjawab pertanyaan lain: apakah tabel ini
berubah sejak ditambatkan.
"""


def tulis(zf, nama, data):
    info = zipfile.ZipInfo(nama, date_time=WAKTU_TETAP)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o644 << 16
    info.create_system = 0           # paku ke Unix, jangan ikut OS pembangun
    zf.writestr(info, data)


hilang = [n for n in ISI if not os.path.exists(os.path.join(SUMBER, n))]
if hilang:
    raise SystemExit(f"berkas sumber tidak ada: {hilang}")

with zipfile.ZipFile(ZIP, "w") as zf:
    tulis(zf, "README.txt", KETERANGAN.encode("utf-8"))
    for nama in sorted(ISI):
        with open(os.path.join(SUMBER, nama), "rb") as f:
            tulis(zf, nama, f.read())

with open(ZIP, "rb") as f:
    sidik = hashlib.sha256(f.read()).hexdigest()

print(f"arsip   : {ZIP}")
print(f"ukuran  : {os.path.getsize(ZIP):,} byte")
print(f"berkas  : {len(ISI) + 1}")
print()
print("SHA-256 arsip hasil (tambatkan nilai ini):")
print(f"  {sidik}")
