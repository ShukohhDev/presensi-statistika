/**
 * =============================================================================
 * Definisi Tipe Data Aplikasi Presensi (TypeScript)
 * =============================================================================
 * File ini berisi struktur data (interface) untuk semua entitas dalam sistem.
 * Dibuat sederhana dan dilengkapi penjelasan bahasa Indonesia agar mudah dipelajari.
 * =============================================================================
 */

// 1. Tipe Data Pengguna (Mahasiswa / Dosen / Admin)
export interface User {
  id: string;               // ID unik pengguna (UUID)
  nim: string;              // Nomor Induk Mahasiswa atau username admin
  name: string;             // Nama lengkap mahasiswa / pengampu
  role: 'student' | 'admin';// Peran akun: 'student' (mahasiswa) atau 'admin' (dosen/PJ)
  created_at?: string;      // Waktu akun dibuat
}

// 2. Tipe Data Sesi Perkuliahan
export interface Session {
  id: string;                                // ID unik sesi
  meeting_number: number;                   // Nomor pertemuan ke (misal: 1, 2, dst)
  title: string;                            // Judul materi sesi
  status: 'open' | 'closed';                // Status sesi: aktif ('open') atau selesai ('closed')
  duration_minutes: number;                 // Durasi sesi dalam menit (misal: 15 menit)
  attendance_mode: 'self' | 'admin_only';   // Mode presensi: 'self' (mandiri) atau 'admin_only' (manual PJ MK)
  opened_at?: string;                       // Waktu sesi dibuka
  closed_at?: string;                       // Waktu sesi ditutup
}

// 3. Tipe Status Kehadiran
export type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alpha';

// 4. Tipe Data Catatan Presensi Mahasiswa
export interface Attendance {
  id: string;                     // ID unik presensi
  session_id: string;             // ID sesi perkuliahan terkait
  user_id: string;                // ID mahasiswa yang presensi
  status: AttendanceStatus;       // Status: hadir / izin / sakit / alpha
  note?: string;                  // Catatan tambahan (misal alasan izin/sakit)
  proof_file?: string;            // Nama/link file surat dokter jika sakit
  submitted_at: string;           // Waktu mahasiswa mengirim presensi
  user_name?: string;             // Nama mahasiswa (opsional saat join tabel)
  user_nim?: string;              // NIM mahasiswa (opsional saat join tabel)
}

// 5. Tipe Data Informasi Mata Kuliah
export interface CourseInfo {
  id: string;
  lecturer_name: string;          // Nama dosen pengampu
  schedule_day: string;           // Hari kuliah (contoh: Rabu)
  schedule_time: string;          // Jam mulai kuliah (contoh: 13:00)
  schedule_duration_minutes: number;
  room: string;                   // Ruangan kuliah
  whatsapp_group_link: string;    // Link grup WhatsApp kelas
  pj_whatsapp_phone: string;      // Nomor WhatsApp PJ MK (082316188656)
  auto_session_enabled: boolean;  // Pembukaan sesi otomatis aktif/tidak
  skip_next_session: boolean;     // Lewati sesi otomatis minggu ini
}

