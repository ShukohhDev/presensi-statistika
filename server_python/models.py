# ==============================================================
# models.py - Struktur Tabel Database (SQLAlchemy Models)
# Setiap kelas di bawah mewakili 1 tabel di dalam MySQL / Database.
# ==============================================================

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Index, Date, Time
)
from sqlalchemy.orm import relationship
from database import Base


# 1. Tabel Pengguna (Mahasiswa dan Admin PJ MK)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False, comment="Nama lengkap mahasiswa / admin")
    password = Column(String(255), nullable=False, comment="Password terenkripsi (hash bcrypt)")
    role = Column(String(20), default="user", nullable=False, comment="'user' (mahasiswa) atau 'admin' (PJ MK)")
    profile_photo = Column(String(255), nullable=True, comment="Path foto profil pengguna")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relasi ke data kehadiran dan tugas
    attendances = relationship("Attendance", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")


# 2. Tabel Sesi Perkuliahan (Dibuka oleh Admin)
class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    meeting_number = Column(Integer, nullable=False, comment="Pertemuan ke- (1, 2, 3...)")
    title = Column(String(255), default="Pertemuan Perkuliahan", comment="Topik / Judul Materi Kuliah")
    status = Column(String(20), default="closed", nullable=False, comment="'open' (sedang dibuka) atau 'closed' (ditutup)")
    duration_minutes = Column(Integer, default=15, comment="Durasi sesi dalam menit")
    attendance_mode = Column(String(30), default="self", comment="'self' (mandiri) atau 'admin_only' (manual admin)")
    opened_at = Column(DateTime, nullable=True, comment="Waktu sesi presensi dibuka")
    closed_at = Column(DateTime, nullable=True, comment="Waktu sesi presensi ditutup")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relasi ke catatan kehadiran mahasiswa di sesi ini
    attendances = relationship("Attendance", back_populates="session", cascade="all, delete-orphan")


# 3. Tabel Catatan Kehadiran (Presensi Mahasiswa per Sesi)
class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    status = Column(String(20), default="alpha", nullable=False, comment="'hadir', 'izin', 'sakit', atau 'alpha'")
    note = Column(Text, nullable=True, comment="Keterangan atau alasan jika izin/sakit")
    evidence_image = Column(String(255), nullable=True, comment="Path foto surat bukti dokter / izin")
    submitted_at = Column(DateTime, default=datetime.utcnow, comment="Waktu presensi dikirim")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relasi balik ke User dan Session
    user = relationship("User", back_populates="attendances")
    session = relationship("Session", back_populates="attendances")


# 4. Tabel Pengumpulan Tugas Mahasiswa
class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_title = Column(String(255), nullable=True, comment="Judul Tugas")
    description = Column(Text, nullable=True, comment="Catatan dari mahasiswa")
    file_name = Column(String(255), nullable=False, comment="Nama file berkas asli")
    file_path = Column(String(255), nullable=True, comment="Lokasi file di server")
    file_type = Column(String(100), nullable=False, comment="Tipe file (PDF, ZIP, DOCX, dll)")
    file_size = Column(Integer, nullable=False, comment="Ukuran file dalam byte")
    google_drive_id = Column(String(100), nullable=True)
    google_drive_link = Column(String(255), nullable=True)
    submitted_date = Column(Date, default=datetime.utcnow().date)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="tasks")


# 5. Tabel Slot Tugas dari Admin (Assignments)
class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(Date, nullable=False)
    due_time = Column(String(10), default="23:59")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# 6. Tabel Bank Materi Kuliah (Slide & Dataset)
class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    meeting_number = Column(Integer, default=1)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(255), nullable=True)
    file_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    external_link = Column(String(500), nullable=True, comment="Link Google Drive materi")
    category = Column(String(30), default="slide", comment="'slide' atau 'dataset'")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# 7. Tabel Pengumuman Kuliah (Announcements)
class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# 8. Tabel Kalender Akademik
class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    event_date = Column(Date, nullable=False)
    event_time = Column(Time, nullable=True)
    event_type = Column(String(30), default="kuliah", comment="'kuliah', 'tugas', 'ujian', 'lainnya'")
    location = Column(String(100), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# 9. Tabel Laporan Kritik, Saran, dan Kendala Bug
class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(30), nullable=False, comment="'kritik', 'saran', 'bug'")
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(30), default="baru", comment="'baru', 'diproses', 'selesai'")
    admin_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="reports")


# 10. Tabel Informasi Dosen, Jadwal, dan Kontak Kelas
class CourseInfo(Base):
    __tablename__ = "course_info"

    id = Column(Integer, primary_key=True, default=1)
    lecturer_name = Column(String(100), default="RIFQI HIDAYAT")
    lecturer_nip = Column(String(50), default="0401088701")
    lecturer_phone = Column(String(50), default="081282394648")
    lecturer_email = Column(String(100), default="")
    schedule_day = Column(String(30), default="Kamis")
    schedule_time = Column(String(50), default="13:00 - 15:30 WIB")
    room = Column(String(100), default="G. Mahdor R. C 306")
    whatsapp_group_link = Column(String(255), default="https://chat.whatsapp.com/BoluTrJnZ0p7nQ0FtONain")
    pj_whatsapp_phone = Column(String(50), default="082316188656")
    auto_session_enabled = Column(Integer, default=1)
    auto_open_time = Column(String(10), default="13:00")
    auto_close_time = Column(String(10), default="15:30")
    skip_next_session = Column(Integer, default=0)
    tolerance_minutes = Column(Integer, default=30)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# 11. Tabel Pengaturan Preferensi Mahasiswa
class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    theme = Column(String(50), default="cobalt-slate")
    dark_mode = Column(Integer, default=0)
    auto_logout_minutes = Column(Integer, default=30)

