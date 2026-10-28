# Sistem Presensi MK Statistika - Kelas TI25C

Website sistem presensi, pengumpulan tugas, dan repositori materi perkuliahan untuk mahasiswa kelas TI25C pada Mata Kuliah Statistika.

🌐 **Tautan Resmi Website**: [https://presensi-statistika-ti25c.shukohh21.workers.dev](https://presensi-statistika-ti25c.shukohh21.workers.dev)

---

## Fitur Utama

1. **Presensi Kehadiran Terintegrasi**
   - Pencatatan kehadiran digital per sesi pertemuan perkuliahan.
   - Dukungan status Hadir, Izin, Sakit, dan Alpha.
   - Unggah bukti foto surat dokter atau keterangan untuk status Izin dan Sakit.

2. **Dashboard Khusus Admin**
   - Pembukaan dan penutupan sesi presensi secara berkala.
   - Rekapitulasi matriks kehadiran seluruh mahasiswa dari pertemuan 1 hingga 16.
   - Fitur Simulator Kelayakan UTS & UAS: Kalkulasi otomatis syarat minimal kehadiran 45% (minimal 4 dari 8 sesi UTS, 8 dari 16 pertemuan UAS) untuk menentukan kelayakan mahasiswa mengikuti Ujian Tengah/Akhir Semester.
   - Pratinjau bukti foto izin dan sakit mahasiswa langsung dari panel kendali.

3. **Bank Materi dan Dataset Praktikum**
   - Repositori unduhan materi slide presentasi, berkas PDF modul, dan tautan referensi.
   - Kategori khusus Bank Dataset & Praktikum untuk file data analisis (CSV, Excel, dataset statistik).

4. **Pengumpulan Tugas Mahasiswa**
   - Manajemen tugas dan batas waktu pengumpulan tugas perkuliahan.
   - Pengunggahan berkas tugas dan tautan Google Drive langsung ke sistem.

5. **Konsultasi WhatsApp Cepat**
   - Tombol bantuan langsung terhubung ke nomor WhatsApp Penanggung Jawab (PJ) perkuliahan.
   - Format pesan terstruktur otomatis mencakup identitas mahasiswa, pertemuan perkuliahan, dan pertanyaan materi.

6. **Desain Antarmuka Solid dan Aksesibel**
   - Desain bersih tanpa warna gradasi dengan palet abu-abu slate dan biru solid.
   - Dukungan tema Mode Terang (Light Mode) dan Mode Gelap (Dark Mode).

---

## Teknologi yang Digunakan

- **Frontend**: React.js, Vite, Vanilla CSS Design System
- **Backend**: Node.js, Express.js
- **Database**: SQLite (better-sqlite3)
- **Deployment**: Cloudflare (Frontend Web, Edge CDN & Reverse Proxy), Railway (Backend Server & Database)

---

## Panduan Akun Pengguna

- **Akun Mahasiswa**:
  - Username: Nama lengkap mahasiswa (sesuai daftar kelas)
  - Password: NIM masing-masing mahasiswa
