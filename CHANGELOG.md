# Catatan Perubahan

Semua perubahan penting pada project ini dicatat di sini. Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/) dan penomoran versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Belum dirilis]

## [1.0.0] - 2026-11-27

Versi pertama yang memenuhi Standar Pengembangan Web CEDC UNPRI v1.0.

### Diubah
- Kode dipecah dari satu `index.html` (2.583 baris) menjadi 3 file CSS dan 15 file JavaScript menurut layar dan fungsinya. Alamat dan kunci publik Supabase dipindah ke `assets/js/config.js`. Tidak ada file di atas 340 baris. Tampilan dan perilaku tidak berubah: diuji dengan membandingkan 13 langkah (beranda, empat langkah lembar tim dengan isian, pasar, hasil, gabung, fasilitator) sebelum dan sesudah.

### Keamanan
- Fungsi `esc()` kini juga mengamankan tanda kutip, sehingga nama bahan, nama tim, atau nama produk yang mengandung tanda `"` tidak bisa keluar dari atribut HTML.

### Ditambahkan
- `CLAUDE.md` dan `AGENTS.md` berisi aturan struktur dan keamanan untuk alat AI.
- `.gitignore`, `.editorconfig`, dan catatan perubahan ini.
- README diperluas: cara menjalankan lokal, struktur, layanan pihak ketiga, dan keamanan data.
