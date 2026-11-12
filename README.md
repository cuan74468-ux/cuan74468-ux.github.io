# Ferry — Linggau AI Studio

Portofolio statis: HTML, CSS, JavaScript biasa. Tidak membutuhkan npm, build, Vercel, atau server Node.js untuk hosting. Modul JavaScript statis dimuat berurutan setelah Matter.js 0.19.0 dari cdnjs.

## CMS Workspace V4 — Content & Media CRUD (12 November 2026)

**Fitur baru pada source:**
- **Pustaka Media:** tambah gambar lewat URL HTTPS atau path \`assets/\`, ubah judul/alt/link (untuk URL eksternal), cari, filter, pagination 12 item/halaman, arsipkan dan pulihkan. File dan media yang sedang digunakan proyek aktif, arsip proyek, konten terbit, atau blok konten tidak boleh diarsipkan sampai referensi diganti.
- **Upload langsung dari browser:** gambar JPG/PNG/WebP/GIF hingga 900 KB setelah optimasi opsional pada browser, dikirim melalui POST terautentikasi ke GAS. GAS mengunggah file ke GitHub \`main/assets/uploads/\` menggunakan REST API GitHub **dengan token yang disimpan hanya di GAS Script Properties**. Upload GitHub akan memicu deployment Pages; URL baru tidak selalu dapat diakses seketika.
- **Asset picker:** pilih gambar untuk thumbnail proyek serta field gambar website tanpa perlu mengetik URL manual. Foto pengganti karakter secara otomatis menggunakan mode \`static\` agar koordinat animasi lama tidak digunakan.
- **Editor halaman:** setiap field teks memiliki kontrol Kosongkan/Default jika relevan; gambar mendapat kontrol Pilih Media / Default; menyimpan tetap memakai revisi dan snapshot.
- **Konten Tambahan:** tambah blok editorial baru (judul, isi, gambar, CTA, urutan), Draft / Terbitkan, edit, cari, pagination, arsip dan pulihkan. Konten berstatus \`draft\` atau \`archived\` tidak terlihat publik. Tidak mengubah atau menghapus seksi lama.

**Schema Google Sheets tambahan:** \`media_library\` (10 kolom) dan \`content_blocks\` (10 kolom). Keduanya ditambahkan tanpa menghapus atau mereset tabel lain. \`setupDatabase()\` idempotent dan memverifikasi header.

### Aktivasi dan integrasi (wajib untuk source backend yang baru)

1. Buka spreadsheet pemilik \`Linggau_AI_Studio_Portfolio_DB\` → **Ekstensi → Apps Script**. Periksa bahwa ini proyek GAS yang benar dan Web App-nya sesuai URL \`config.json\`.
2. Ganti **isi Code.gs** di editor GAS dengan versi terbaru di repository. **Jangan menghapus file AdminRecovery.gs** atau Script Properties yang sudah ada.
3. Save. Jalankan \`setupDatabase()\` sekali. Dua tab tambahan \`media_library\` dan \`content_blocks\` otomatis diperiksa atau disiapkan. Tidak perlu reset akun admin.
4. **Deploy → Manage deployments → Edit → New version → Deploy** pada deployment GAS yang sudah ada agar URL tidak berubah.
5. Login admin di \`/studio-admin.html\`. Uji **Tambah URL** terlebih dahulu (tidak memerlukan GitHub token). Uji pula buat konten Draft, Terbitkan, dan Arsip dengan konten dummy.
6. **Opsional untuk mengaktifkan Unggah Gambar:** di akun GitHub pemilik repository, buat *fine-grained personal access token* khusus repository \`cuan74468-ux/cuan74468-ux.github.io\`, permission repository **Contents: Read and write** (minimal; Metadata Read otomatis). Jangan beri akses ke repository lain. Simpan token pada **Apps Script → Project Settings → Script Properties → MEDIA_GITHUB_TOKEN**. **Jangan memasukkan token ke Google Sheets, source GitHub, config.json, atau chat.** Setelah menyimpan property, backend yang sudah dideploy dapat membaca token tanpa perubahan source.
7. Refresh admin. Menu Pustaka Media seharusnya memperlihatkan status upload aktif. Unggah gambar dummy kecil, tunggu GitHub Pages deploy dan verifikasi gambar URL bisa diakses tanpa login.
8. Sebelum memublikasikan perubahan nyata, uji penggantian gambar proyek, field hero, dan blok konten; hapus/arsip media yang tidak digunakan; periksa apakah gambar yang dipakai ditolak untuk diarsipkan; periksa log eksekusi GAS.

**Catatan penting tentang keamanan dan pembatasan:**
- Upload server memeriksa token sesi, MIME dan *magic bytes*, batas ukuran, path acak, dan menyimpan credential GitHub hanya di Script Properties.
- Penghapusan media atau konten menggunakan **soft delete (arsip)** agar bisa dipulihkan. File fisik GitHub tidak dihapus. Untuk mengganti gambar yang sudah diunggah, upload gambar baru dan ubah referensi konten/proyek.
- Pustaka mendukung URL eksternal yang benar-benar mengarah ke gambar. **Link berbagi Google Drive tidak dijamin bisa ditampilkan sebagai \`<img>\`**, jadi hosting gambar paling stabil adalah GitHub Pages atau penyedia gambar HTTPS yang memang mendukung hotlink.
- **Source sudah diuji di GitHub Actions melalui mock**, tetapi integrasi token GitHub di GAS aktif dan pengujian upload browser nyata **belum diverifikasi** dari alat ini. Jangan menyimpulkan integrasi produksi sudah tuntas hanya karena CI lulus.
- GitHub Pages gratis untuk repository publik dengan penggunaan wajar, namun upload otomatis menciptakan commit/deployment; hindari upload berulang tanpa kebutuhan.
- \`MEDIA_GITHUB_TOKEN\` adalah kredensial sensitif. Rotasi jika bocor dan pastikan expiry sesuai kebutuhan. Simpan hanya pada Script Properties GAS.

---

## Studio Admin Workspace V3 — 12 November 2026

**Workspace:** https://cuan74468-ux.github.io/studio-admin.html (login admin privat). Dari situs publik, 3 klik badge status atau URL hash admin lama sekarang membuka workspace ini.

### Fitur

- **Dashboard:** jumlah proyek aktif/unggulan, pesan masuk, pesan perlu tindak lanjut, statistik backend.
- **Editor halaman:** skema field bersama dengan situs publik; pencarian per label/key, kategori dan pagination (9 field/halaman), pratinjau langsung berbasis iframe asli (desktop/HP), simpan dan terbitkan melalui sesi admin.
- **Proyek:** CRUD dengan thumbnail, deskripsi, kategori, URL demo, unggulan; tabel pencarian, 8 per halaman. Delete diperlakukan sebagai **arsip lunak**, bukan penghapusan permanen. Arsip dapat dipulihkan.
- **Inbox pesan:** daftar privat dengan pencarian, filter status dan pagination server 12 pesan/halaman. Admin dapat menandai **baru**, **diproses**, **selesai**, atau **arsip**, dan menyimpan catatan internal. Mengarsipkan tidak menghapus pesan asli.
- **Media:** katalog thumbnail dan aset yang digunakan; dapat menyalin path/URL untuk penggantian pada editor. **Belum mendukung unggah/hapus file biner langsung dari CMS**; gunakan GitHub Web untuk mengunggah ke `assets/`.
- **Riwayat:** daftar publikasi per halaman dan pemulihan snapshot versi yang dipilih, dengan pemeriksaan revisi sebelum pemulihan.
- **Pengaturan:** status koneksi backend, akses GitHub dan Google Sheets. Semua berjalan sebagai HTML/CSS/JavaScript biasa; tanpa Node/Vercel saat runtime.

**Data:** Spreadsheet yang sama, tujuh tab: `projects`, `leads`, `admin`, `site_content`, `site_history`, `lead_meta`, `project_archive`. Dua tab terakhir ditambahkan tanpa menghapus proyek/leads/admin.

### Aktivasi backend V3 WAJIB sebelum fitur CRUD baru bisa dipakai

1. Buka database pemilik → **Ekstensi → Apps Script**. Gunakan proyek skrip yang saat ini melayani URL `/exec` pada `config.json`.
2. Salin seluruh isi [Code.gs terbaru](https://github.com/cuan74468-ux/cuan74468-ux.github.io/blob/main/Code.gs) menggantikan isi `Code.gs` di editor GAS. Simpan. Jangan hapus file lain seperti `AdminRecovery.gs` (jika sudah digunakan).
3. Jalankan fungsi `setupDatabase()` satu kali untuk memastikan header pada dua tab tambahan benar. Fungsi memelihara data existing dan tidak mengulang seed proyek yang telah diarsipkan.
4. **Deploy → Manage deployments → Edit (ikon pensil) → New version → Deploy**. Pertahankan deployment lama agar URL `/exec` tidak berubah. Jangan hanya menekan Save; web app /exec memakai versi deployment terakhir.
5. Buka https://cuan74468-ux.github.io/studio-admin.html, login dengan **password admin terbaru yang sudah Anda simpan**. Jangan menempelkan password ke percakapan, Google Sheets, GitHub, atau source.
6. Uji urutan: buka **Karya & Proyek** → edit proyek dummy; **Editor Halaman** → ubah satu kalimat, pratinjau, Simpan & Terbitkan; **Inbox** → ubah status pesan dummy; **Riwayat** → lihat snapshot. Verifikasi di situs publik dan Google Sheets.
7. Bila muncul "Aksi tidak tersedia" atau "Backend membutuhkan GAS V3", kemungkinan Code.gs belum di-deploy menjadi versi Web App terbaru. Jangan mereset password sebagai solusi untuk error versi backend.

**Batas verifikasi:** GitHub Actions menguji sintaks source dan API melalui mock. Hasil itu tidak membuktikan sesi login, iframe, dan operasi CRUD berjalan di browser dan deployment GAS milik pemilik. Jangan menganggap integrasi live selesai sebelum uji nyata di langkah 6.

---

## Status implementasi CMS V2 — 12 November 2026

- GitHub Pages tetap berupa HTML/CSS/JavaScript murni tanpa Vercel, npm, atau langkah build.
- Repository mengandung editor CMS V2 untuk konten publik, proyek, karakter, warna, font, kontak, dan metadata SEO.
- Spreadsheet yang dipakai: https://docs.google.com/spreadsheets/d/1VOJV8zmSJXc3afnh6ly34_8Rguue5R2t4EXemjouYeM/edit
- Lima tab database: `projects` (5 proyek), `leads` (pesan masuk), `admin` (verifier login privat), `site_content` (isi halaman), `site_history` (cadangan revisi).
- URL GAS yang diberikan pemilik sudah dipasang pada `config.json`. **Memperbarui `Code.gs` di GitHub TIDAK otomatis memperbarui Apps Script yang berjalan.** Pemilik harus memasang kode terbaru pada editor GAS dan menerbitkan versi deployment baru.
- Data proyek, pesan pengunjung, dan login tidak direset dalam migrasi ini.
- `.github/workflows/backend-qa.yml` memeriksa syntax frontend dan GAS serta tes backend dengan mock. QA ini bukan bukti browser publik dan GAS sudah terintegrasi secara end-to-end.

## Satu kali aktivasi CMS V2 di Apps Script

1. Buka database di atas dengan akun pemilik. Pilih **Ekstensi → Apps Script**.
2. Buka `Code.gs` di GitHub: https://github.com/cuan74468-ux/cuan74468-ux.github.io/blob/main/Code.gs
3. Salin **seluruh** isi `Code.gs` ke file `Code.gs` pada editor Apps Script; simpan. Jangan mengubah `STUDIO_DB_ID` untuk database ini.
4. Pilih fungsi **setupDatabase** lalu **Run/Jalankan**, setujui izin jika diminta. Operasi ini idempotent: tidak menghapus baris proyek atau leads, hanya melengkapi tab/header dan memproses verifier admin bila perlu.
5. Buka **Deploy → Manage deployments / Kelola deployment**. Pilih deployment Web App yang sudah ada, klik **Edit (pensil)**, pilih **New version / Versi baru**, kemudian **Deploy**. Jangan membuat deployment baru bila ingin mempertahankan URL `/exec` yang telah dipasang pada website.
6. Cek `/exec?action=health` harus mengembalikan `"ok":true` dan `"ready":true`. Cek `/exec?action=projects` harus memuat `projects`, `content`, dan `siteRevision`; tidak boleh berisi password, hash admin, atau leads.
7. Buka https://cuan74468-ux.github.io/#/linggau-core-session atau klik badge status tiga kali cepat. Login dengan akun admin yang sudah dikonfigurasi. Pilih tab **Seluruh Konten Website**.

Jika CMS menampilkan "Backend CMS v2 perlu diaktifkan", URL GAS sudah terbaca tetapi deployment GAS belum menggunakan kode CMS terbaru atau respons GAS tidak lengkap. Deploy ulang **versi baru** pada deployment yang sama; tidak perlu mengubah `config.json`.

## Menggunakan editor CMS

- **Karya & Proyek:** menambah/edit proyek, thumbnail, teks tooltip, kategori, link demo, dan penanda cincin utama. Maksimal lima proyek unggulan.
- **Seluruh Konten Website:** editor per seksi untuk navbar, hero, About, proses, 10 chip keahlian, formulir, kontak, teks studi kasus, footer, SEO, warna, font, dan mode karakter.
- **Pratinjau halaman:** menampilkan draf hanya pada browser admin saat ini; tidak mengubah database. Untuk kembali buka CMS dengan klik badge tiga kali lalu pilih **Batalkan pratinjau**.
- **Simpan & Terbitkan:** menulis konten tervalidasi ke `site_content`, menyimpan versi sebelum perubahan ke `site_history`, dan memperbarui halaman yang sedang dibuka. Pengunjung lain melihat perubahan saat memuat ulang.
- **Pulihkan versi sebelumnya:** kembali ke versi terakhir yang dicadangkan; lakukan setelah memastikan draf tidak diperlukan.
- **Aset gambar:** editor menerima URL HTTPS atau path `assets/...` yang sudah tersedia di GitHub. **Belum ada unggah file gambar langsung dari CMS.** Upload file baru ke repository dulu sebelum mengisi path.
- **Karakter:** mode `animated` hanya sesuai untuk sprite dengan struktur/koordinat asli. Karakter gambar lain muncul sebagai gambar statis; mode `hidden` menyembunyikannya. Posisi horizontal dan ukuran juga dapat diatur.
- **Chip fisika:** jumlah tetap sepuluh; judul dapat diedit dan tata letak memakai indeks stabil, bukan label yang dapat diganti.

## Pemulihan login admin (tanpa membocorkan password)

Jika password CMS tidak cocok, jangan menaruh password baru di chat, repo, ataupun URL. Kolom `admin.password` adalah verifier HMAC privat dan tidak dapat dibaca kembali menjadi password asli. Paling aman lakukan reset dari Apps Script **yang saat ini digunakan oleh deployment website**.

1. Buka spreadsheet proyek → **Ekstensi → Apps Script**; pastikan ini proyek Apps Script yang menangani URL web app dari `config.json`.
2. Klik **+** di samping Files/Berkas → **Script**, beri nama **AdminRecovery**.
3. Salin isi [AdminRecovery.gs](https://github.com/cuan74468-ux/cuan74468-ux.github.io/blob/main/AdminRecovery.gs) ke editor file itu, lalu simpan. **Jangan** menghapus file `Code.gs`.
4. Di menu **Project Settings / Setelan proyek (ikon roda gigi) → Script Properties**, pilih **Add script property**. Nama tepat: `ADMIN_RESET_PASSWORD`. Nilainya: password **baru dan unik** sepanjang minimal 14 karakter. Simpan nilainya hanya di sana (bukan di chat).
5. Kembali ke editor, pilih fungsi `resetStudioAdminPassword` dari daftar fungsi lalu klik **Run/Jalankan**, setujui otorisasi jika diminta.
6. Bila berhasil, fungsi mengubah **hanya** verifier password admin pada kolom B, menghapus properti reset sekali-pakai, dan membersihkan penghitung percobaan login. **Tidak menghapus proyek maupun leads.**
7. Buka https://cuan74468-ux.github.io/#/linggau-core-session dan login dengan password baru. Anda tidak perlu menempel URL GAS. Jika CMS seluruh konten menyatakan backend V2 belum aktif, deploy Code.gs versi terbaru secara terpisah.

Penting: menjalankan fungsi reset pada Apps Script milik proyek lain tidak akan memulihkan login di deployment ini. Tidak perlu mengubah atau membagikan pepper dan tidak perlu mengedit hash admin secara manual. Sesi lama dapat tetap berlaku sampai kedaluwarsa maksimal dua jam; pemulihan ini tidak mengklaim mencabut seluruh token yang telah terbit.

## Keamanan data CMS

- Google Sheet **harus tetap privat**. Tab `admin` dan `site_history` tidak disajikan ke publik.
- API GET hanya mengembalikan proyek dan konten publik (serta health). Operasi perubahan memakai sesi admin yang diperiksa server, batasan input, kunci penulisan, dan pengecekan revisi.
- Konten ditampilkan sebagai teks biasa, bukan HTML bebas; URL dan pengaturan sensitif divalidasi.
- Jangan memasukkan password rahasia ke editor konten ataupun repository.

## Memperbarui proyek

- Klik proyek pada daftar admin, ubah data, lalu **Simpan proyek**. ID proyek yang sudah ada tidak bisa diganti melalui editor.
- Maksimal lima proyek ditandai `featured_ring`; sisanya masuk katalog. Cincin selalu memakai lima proyek × empat salinan = 20 kartu.
- Jika kurang dari lima proyek unggulan, default melengkapi cincin. Data katalog berasal dari seluruh baris proyek.
- Saat ada perubahan bersamaan, penyimpanan ditolak; tekan **Muat ulang**, pilih ulang proyek, lalu terapkan perubahan kembali.
- `thumbnail` menerima URL HTTPS atau path lokal `assets/nama-file`. Path lokal mengacu pada repo website, bukan folder Drive.

## GitHub Pages

Pada **Settings → Pages**, gunakan **Deploy from a branch → main → /(root)**. `.nojekyll` memastikan file statis langsung dilayani. Semua aset lokal memakai path relatif agar juga bekerja di `username.github.io/nama-repo/`.

## Keamanan dan batas operasional

- API publik menyediakan proyek, konten halaman publik, dan `health`; tidak ada endpoint pembacaan leads/admin/riwayat privat.
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
