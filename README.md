# Ferry — Linggau AI Studio

Portofolio statis: HTML, CSS, JavaScript biasa. Tidak membutuhkan npm, build, Vercel, atau server Node.js untuk hosting. Empat blok JavaScript dimuat berurutan setelah Matter.js 0.19.0 dari cdnjs.

## Status 12 November 2026

- Database baru `Linggau_AI_Studio_Portfolio_DB` dibuat di akun Drive **elangputihllg@gmail.com**. Sheet lama tidak digunakan.
- Database: https://docs.google.com/spreadsheets/d/1VOJV8zmSJXc3afnh6ly34_8Rguue5R2t4EXemjouYeM/edit
- Lima proyek default, cincin 20 kartu, studi kasus dalam modal, katalog, 10 chip fisika, kontak WhatsApp/email, serta CMS tersedia dalam kode.
- **Backend belum diterbitkan.** `config.json` memakai `gasUrl` kosong dengan sengaja; tidak ada endpoint palsu. Form menampilkan status belum aktif sampai Web app diterbitkan dan URL aslinya diisi.
- **Kondisi admin sebelum setup:** kolom `admin.password` masih berformat `pending$…`, bukan verifier final. Fungsi `setupDatabase()` wajib dijalankan dari editor Apps Script agar nilai menjadi `hmac-sha256$…` dan rahasia HMAC disimpan di Script Properties. Endpoint `?action=health` sekarang mengembalikan `ready:false` sampai setup berhasil. Jangan publikasikan Sheet admin.
- **QA otomatis tanpa build:** workflow `.github/workflows/backend-qa.yml` menjalankan `node tests/backend.test.cjs` saat file backend atau tes berubah. Node dipakai hanya untuk unit test, bukan untuk membangun situs GitHub Pages.
- Password admin tidak ada dalam repo. Database privat memuat verifier dari password yang diberikan Ferry. `setupDatabase()` mengubahnya menjadi HMAC dengan pepper privat di Script Properties.
- Uji lokal menggunakan mock GAS; pengujian end-to-end Google Apps Script harus dilakukan setelah deployment.

## Aktivasi backend — melalui browser

1. Buka database di atas dengan akun **elangputihllg@gmail.com**. Pilih **Extensions / Ekstensi → Apps Script**.
2. Ganti isi `Code.gs` dengan file `Code.gs` dari repo ini, lalu simpan. Nama proyek: `Linggau AI Studio Backend`.
3. Jalankan fungsi **setupDatabase**. Selesaikan otorisasi Google pada akun pemilik. Fungsi ini mempertahankan proyek dan leads yang sudah ada; tidak melakukan reset database.
4. Pilih **Deploy → New deployment → Web app**. **Execute as: Me**, **Who has access: Anyone**. Terbitkan dan salin URL berakhiran **/exec**. Jangan membagikan Sheet secara publik; endpoint hanya mengembalikan data proyek yang memang publik.
5. Jalankan **getFrontendConfig**. Salin JSON dari Execution log dan ganti isi `config.json` di root repo GitHub. Commit ke `main`.
6. Buka portofolio. Klik badge status **tiga kali cepat**, atau gunakan `#/linggau-core-session`. Login dengan email **peyaje531@gmail.com** dan password awal yang Anda berikan dalam instruksi. Akun login CMS berbeda dari akun pemilik Google Drive.

Alternatif langkah 5: pada modal admin buka **Hubungkan backend Apps Script**, tempel URL `/exec`, pilih **Uji koneksi**, lalu **Unduh config.json**. Unggah file itu ke root repo. Pengujian URL di modal saja hanya mengaktifkan sesi browser saat itu; semua pengunjung membutuhkan konfigurasi yang dikomit.

Jika memasang ulang pada Sheet baru yang benar-benar kosong, ganti `STUDIO_DB_ID` dan tambahkan Script Property `ADMIN_INITIAL_PASSWORD` dengan password pribadi minimal 12 karakter sebelum menjalankan setup. Property bootstrap dihapus oleh setup. Untuk database yang sudah disiapkan dalam tugas ini, langkah tersebut tidak diperlukan.

## Memperbarui proyek

- Klik proyek pada daftar admin, ubah data, lalu **Simpan proyek**. ID proyek yang sudah ada tidak bisa diganti melalui editor.
- Maksimal lima proyek ditandai `featured_ring`; sisanya masuk katalog. Cincin selalu memakai lima proyek × empat salinan = 20 kartu.
- Jika kurang dari lima proyek unggulan, default melengkapi cincin. Data katalog berasal dari seluruh baris proyek.
- Saat ada perubahan bersamaan, penyimpanan ditolak; tekan **Muat ulang**, pilih ulang proyek, lalu terapkan perubahan kembali.
- `thumbnail` menerima URL HTTPS atau path lokal `assets/nama-file`. Path lokal mengacu pada repo website, bukan folder Drive.

## GitHub Pages

Pada **Settings → Pages**, gunakan **Deploy from a branch → main → /(root)**. `.nojekyll` memastikan file statis langsung dilayani. Semua aset lokal memakai path relatif agar juga bekerja di `username.github.io/nama-repo/`.

## Keamanan dan batas operasional

- API publik hanya menyediakan `projects` dan `health`; tidak ada endpoint pembacaan leads/admin.
- Penulisan proyek membutuhkan token sesi dua jam. Token disimpan dalam memori tab, bukan localStorage atau URL. Cache Google dapat menghapus sesi lebih awal sehingga login ulang diperlukan.
- Password diverifikasi melalui salted SHA-256 yang dibungkus HMAC-SHA-256 dengan pepper privat. Ini bukan bcrypt/Argon2; jangan gunakan ulang password akun utama. Jangan membagikan Sheet atau Script Properties.
- Maksimal 10 percobaan login per 15 menit secara global, dengan reset setelah login berhasil. Pembatasan sederhana ini dapat dipakai penyerang untuk menunda login; bukan perlindungan DDoS penuh.
- Leads memakai persetujuan, honeypot, batas panjang, jeda kirim, maksimum 100 pesan per hari, serta ID permintaan unik untuk retry yang tidak menggandakan data.
- Formula spreadsheet dinetralkan; input publik dirender sebagai teks dan link dibatasi HTTPS. LockService menyerialkan penulisan.
- Cache/rate limit dan honeypot adalah proteksi dasar, bukan CAPTCHA. Apps Script dan Sheets tetap memiliki kuota layanan; tidak ada jaminan kapasitas tanpa batas.
- Frontend menggunakan POST `text/plain` agar tidak memicu preflight JSON, mengikuti redirect ContentService, dan menunggu respons `ok` serta ID pesan. Tidak memakai `no-cors` atau mengklaim sukses dari respons opaque.

## Pengujian setelah backend diterbitkan

1. URL `/exec?action=projects` mengembalikan lima proyek dan `revision`; tidak mengandung password/admin/leads.
2. Kirim satu pesan uji; pastikan ada tepat satu baris di `leads` dan balasan sukses terlihat. Ulangi request ID yang sama: tetap satu baris.
3. Login admin, edit nama/link, simpan, lalu buka ulang halaman di tab lain. Data baru harus tampil.
4. Login salah dan request simpan tanpa token harus ditolak. Setelah logout token lama ditolak.
5. Uji desktop/Android: drag ring, buka/tutup studi kasus, keyboard Tab/Escape, salin email, drag chip dan scroll halaman.

Uji mock backend: `node tests/backend.test.cjs`. Node hanya untuk QA pengembang, tidak diperlukan untuk hosting.

## Aset dan kesesuaian referensi

Sumber anatomi/animasi: https://uxbyanterdeep-website.vercel.app/ (diambil 12 November 2026). Aset inti dipertahankan byte aslinya. Tidak ada lisensi pihak ketiga yang diasumsikan atau diberikan ulang oleh proyek ini.

| Aset | Ukuran asli yang benar-benar tersedia |
| --- | --- |
| char.webp | 651 × 1075 |
| plate.png | 76 × 62 |
| wave.png | 91 × 96 |
| grain.png | 180 × 180 |

Koordinat animasi tetap `IMG_W=930`, `IMG_H=1536`, `PLATE=[566,414,76,62]`, FA/FB, EYE_L/EYE_R, LID, dan DIRTY sesuai sumber. File sumber `char.webp` bukan 930 × 1536; tidak di-upscale atau diubah agar klaim ukuran tidak menyesatkan.

Tiga URL thumbnail dari instruksi gagal diakses. POS memakai `proyek-pos-sederhana.jpg` dari repo Ferry, katalog template memakai `proyek-smartlink.jpg`. Kartu AI photography memakai sampul tipografi baru `ai-photography-cover.svg`, **bukan foto Madu Ku/Artisan Bakery milik Ferry**. Dua foto ilustrasi kurir/buku diunduh dari URL Unsplash yang diberikan. Semua visual dapat diganti di CMS setelah backend aktif.

## Rollback

Commit sebelum migrasi: `bf29bd1171fb092acaf9efffe06b234050d3167b`. Gunakan revert commit migrasi untuk memulihkan website. File gambar lama di root repo dipertahankan. Database baru terpisah dari website dan tidak dihapus oleh rollback GitHub.

Referensi API: https://developers.google.com/apps-script/guides/web dan https://developers.google.com/apps-script/guides/content
