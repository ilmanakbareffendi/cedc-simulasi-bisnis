# CLAUDE.md

## Tentang project
Simulasi Bisnis: Dari Ide ke Pasar: alat simulasi bisnis untuk inkubator IBT dan kelas kewirausahaan, dengan mode luring (satu perangkat) dan mode daring tersinkron lewat Supabase.
Pemilik: Career and Alumni Relations Unit, Pusat Pengembangan Karir dan Kewirausahaan (CEDC) UNPRI.
Acuan: Standar Pengembangan Web CEDC UNPRI v1.0.

## Struktur saat ini
- `index.html`: markup halaman saja (sekitar 430 baris).
- `assets/css/`: `base.css` (dasar, tombol, beranda), `permainan.css` (lembar tim, pasar, hasil, modal), `daring.css` (gabung, arena, fasilitator, logo).
- `assets/js/config.js`: alamat dan kunci publik Supabase.
- `assets/js/utils/`: `utils.js` (`$`, `rp`, `esc`, penyimpanan, `toast`) dan `umum.js` (fungsi bersama tampilan).
- `assets/js/services/daring.js`: akses API Supabase, polling, hitung mundur.
- `assets/js/features/`: gerak, lembar tim, pasar luring, gabung, arena pemain, lembar tersambung, ruang fasilitator, tab fasilitator, beranda, router.
- `assets/js/main.js`: titik masuk.
- `supabase/schema.sql`: tabel, RLS, dan semua fungsi RPC. Tabel hanya bisa dibaca publik; perubahan hanya lewat fungsi.
- `qrcode.min.js`: pustaka QR yang disalin ke repo.
- Logo CEDC (`cedc-*.png`), trailer (`trailer.mp4`, `trailer-poster.jpg`).
- Semua file JavaScript adalah skrip klasik tanpa `"use strict"`, dimuat berurutan dan berbagi nama global (handler `onclick` di HTML yang dibangun JavaScript bergantung pada ini). Urutan tag `<script>` di `index.html` penting.

## Struktur target (Standar Pengembangan Web CEDC UNPRI v1.0)

```
index.html, pages/          hanya markup
assets/css/                 base.css, components.css, pages/
assets/js/main.js           titik masuk
assets/js/config.js         semua konfigurasi (URL, kunci publik)
assets/js/services/         akses Supabase dan API
assets/js/features/         satu folder per fitur
assets/js/utils/            fungsi umum (format, escape)
assets/data/                data statis .json
assets/vendor/              salinan pustaka luar versi tetap
tests/  docs/
```

## Catatan khusus
- Logo CEDC tidak boleh diubah warna atau bentuknya.
- Aturan permainan (stok, saldo, batas beli) wajib tetap dicek di fungsi database.
- Langkah berikutnya: ganti handler `onclick="..."` dengan `addEventListener` dan atribut `data-*`, ubah ke ES modules, lalu pasang Content Security Policy.

## Aturan wajib

1. Sebelum menulis fungsi baru, cari dulu fungsi serupa (grep). Pakai ulang, jangan salin.
2. Satu file satu tugas. Target di bawah 300 baris. File di atas 500 baris wajib dipecah sebelum menambah fitur baru; usulkan dulu kepada pemilik.
3. File baru tidak memuat CSS atau JavaScript di dalam HTML, dan tidak memakai `style=""` atau `onclick=""`. Selector JavaScript memakai atribut `data-*`.
4. Teks dari pengguna, file, atau database ditampilkan lewat `textContent`, atau lewat `esc()` bila harus disusun sebagai HTML. `esc()` wajib mengamankan `& < > " '`.
5. Jangan pernah menulis secret key atau service_role key. Kunci publik Supabase saja yang boleh ada di kode.
6. Setiap tabel Supabase wajib RLS. Pengecekan hak admin, PIN, dan aturan permainan dilakukan di fungsi database, bukan di JavaScript.
7. Pustaka luar: versi dikunci dan memakai atribut `integrity` plus `crossorigin="anonymous"`, atau disalin ke `assets/vendor/`.
8. Logika hitung ditulis sebagai fungsi murni dan diuji di `tests/` dengan `node --test`.
9. Kerja di branch `fitur/...` atau `perbaikan/...`, bukan langsung di `main`, karena `main` langsung tayang di GitHub Pages. Catat setiap perubahan di `CHANGELOG.md`.
10. Jangan menghapus atau menulis ulang riwayat Git.

## Gaya tulisan

Teks antarmuka dan dokumentasi memakai bahasa Indonesia. Jangan memakai tanda pisah panjang atau en dash dalam kalimat. Tulis jenjang sebagai Sarjana, Magister, Doktoral, bukan singkatan S1, S2, S3.

## Perintah

- Jalankan lokal: `python3 -m http.server 8000`, lalu buka `http://localhost:8000`
- Pengujian (bila ada): `node --test` (menjalankan semua file `tests/*.test.js`)
