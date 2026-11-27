# Simulasi Bisnis: Dari Ide ke Pasar

Alat simulasi bisnis dari Pusat Pengembangan Karir dan Kewirausahaan (CEDC) UNPRI. Pendamping modul *Financial Literacy & Strategic Pitching*.

Halaman berjalan sepenuhnya di peramban, tanpa server. Data tersimpan di `localStorage` perangkat masing-masing.

* **Lembar Usaha Tim:** dibuka setiap tim di HP atau laptop.
* **Pasar Live:** ditayangkan fasilitator di proyektor.

Gagasan dan pelaksanaan: Arie Pratania Putri, S.E., M.Si., Ak., CA, Kepala Pusat Pengembangan Karir dan Kewirausahaan (CEDC) UNPRI.

Desain dan pengembangan digital: Ilman Akbar Effendi, S.IP., M.I.Kom., Kepala Career and Alumni Relations Unit, CEDC UNPRI.

## Mode daring (tersinkron)

Permainan bisa dimainkan dari HP setiap peserta. Data tersimpan di database Supabase (proyek `simulasi-bisnis`, organisasi CEDC UNPRI).

1. **Fasilitator** membuka *Ruang Fasilitator*, membuat sesi (jumlah tim, ronde, uang virtual per ronde), lalu menayangkan kode dan QR di proyektor.
2. **Peserta** memindai QR atau memasukkan kode, mengisi nama, memilih nomor tim, dan memilih peran: *Anggota tim* atau *Ketua tim* (satu orang per tim, juga mengisi Lembar Usaha Tim yang otomatis terkirim). Semua orang ikut belanja saat tim lain berjualan.
3. Fasilitator membuka pasar (produksi dan biaya terkunci), lalu menjalankan setiap ronde: pitch, belanja, tutup belanja, ronde berikutnya.
4. Setelah ronde terakhir, fasilitator menutup pasar dan mengumumkan juara dari tab *Hasil*.

Semua aturan (stok, saldo per ronde, batas beli per tim, larangan beli produk tim sendiri) dicek di server lewat fungsi di `supabase/schema.sql`. Tabel hanya bisa dibaca publik; perubahan hanya lewat fungsi tersebut. Kunci fasilitator tersimpan di perangkat pembuat sesi.

**Mode kelas (20 sampai 40 orang):** di Ruang Fasilitator pilih *Kelas*. Sesi dibuat dengan sedikit tim, 1 ronde, dan peran *Pembeli umum* (peserta tanpa tim yang hanya belanja). Peran ini bisa dinyalakan atau dimatikan di *Pengaturan* sesi; untuk sesi inkubasi biarkan mati agar semua peserta masuk tim.

**Antrean pitch:** di fase pitch, layar fasilitator menampilkan tim yang sedang pitch, hitung mundur (bawaan 60 detik), dan urutan tim. Fasilitator menekan *Mulai pitch* lalu *Tim berikutnya*. Sisa 10 detik ditandai kuning dan bunyi singkat, waktu habis ditandai merah. HP pembeli menyorot produk tim yang sedang pitch, dan tim berikutnya mendapat aba-aba bersiap.

**Pengaturan bebas:** jumlah tim, tim yang berjualan per ronde (jumlah ronde dihitung otomatis), uang virtual per ronde, batas beli per tim, waktu pitch, pembeli umum, dan bunyi aba-aba. Jumlah tim dan tim per ronde bisa diubah di *Pengaturan* selama pasar belum dibuka; ronde setiap tim juga bisa dipindah satu per satu di tab *Tim*.

Catatan: proyek Supabase paket gratis berhenti sementara setelah 7 hari tanpa aktivitas. Buka dasbor Supabase sehari sebelum acara untuk memastikan proyek aktif.

Mode luring (satu perangkat, tanpa internet) tetap tersedia dari tautan di bawah menu beranda.

## Menjalankan di komputer sendiri
1. Unduh atau clone repo ini.
2. Di folder repo, jalankan `python3 -m http.server 8000`.
3. Buka `http://localhost:8000`. Mode daring memakai database Supabase yang sama dengan versi tayang.

## Struktur
- `index.html`: markup halaman.
- `assets/css/`: tiga file gaya per bagian.
- `assets/js/`: `config.js` (Supabase), `utils/`, `services/daring.js`, `features/` (satu file per layar), dan `main.js`.
- `supabase/schema.sql`: struktur database, RLS, dan fungsi aturan permainan. Jalankan di SQL Editor Supabase untuk membuat ulang database.
- `qrcode.min.js`: pustaka pembuat QR.
- `CLAUDE.md`: aturan kerja untuk alat AI dan programmer.
- `CHANGELOG.md`: catatan perubahan.

## Keamanan data
Kunci yang ada di kode hanya kunci publik Supabase. Aksesnya dibatasi Row Level Security: tabel hanya bisa dibaca, dan perubahan hanya lewat fungsi di `supabase/schema.sql`. Nama peserta dan nama tim dapat dibaca publik selama sesi masih tersimpan.

## Pemilik dan kontak
Career and Alumni Relations Unit, Pusat Pengembangan Karir dan Kewirausahaan (CEDC) UNPRI. Kontak: ilmanakbareffendi@unprimdn.ac.id.

Status hak cipta dan lisensi akan dicantumkan di file `LICENSE` setelah ditetapkan.
