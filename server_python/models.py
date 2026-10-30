# ==============================================================
# models.py - Struktur Tabel Database (SQLAlchemy Models 2.0)
# Setiap kelas di bawah mewakili 1 tabel di dalam MySQL / Database.
# Menggunakan Mapped bawaan SQLAlchemy 2.0 agar terbaca sempurna oleh IDE/Pylance.
# ==============================================================

from datetime import datetime, timezone, date as date_type, time as time_type


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def utc_today() -> date_type:
    return datetime.now(timezone.utc).date()
from typing import Optional, List
from sqlalchemy import (
    Integer, String, Text, DateTime, ForeignKey, Date, Time
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from database import Base


# 1. Tabel Pengguna (Mahasiswa dan Admin PJ MK)
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="Nama lengkap mahasiswa / admin")
    password: Mapped[str] = mapped_column(String(255), nullable=False, comment="Password terenkripsi (hash bcrypt)")
    role: Mapped[str] = mapped_column(String(20), default="user", nullable=False, comment="'user' (mahasiswa) atau 'admin' (PJ MK)")
    profile_photo: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, comment="Path foto profil pengguna")
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    # Relasi ke data kehadiran dan tugas
    attendances: Mapped[List["Attendance"]] = relationship("Attendance", back_populates="user", cascade="all, delete-orphan")
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    reports: Mapped[List["Report"]] = relationship("Report", back_populates="user", cascade="all, delete-orphan")


# 2. Tabel Sesi Perkuliahan (Dibuka oleh Admin)
class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    meeting_number: Mapped[int] = mapped_column(Integer, nullable=False, comment="Pertemuan ke- (1, 2, 3...)")
    title: Mapped[str] = mapped_column(String(255), default="Pertemuan Perkuliahan", comment="Topik / Judul Materi Kuliah")
    status: Mapped[str] = mapped_column(String(20), default="closed", nullable=False, comment="'open' (sedang dibuka) atau 'closed' (ditutup)")
    duration_minutes: Mapped[int] = mapped_column(Integer, default=15, comment="Durasi sesi dalam menit")
    attendance_mode: Mapped[str] = mapped_column(String(30), default="self", comment="'self' (mandiri) atau 'admin_only' (manual admin)")
    opened_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, comment="Waktu sesi presensi dibuka")
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, comment="Waktu sesi presensi ditutup")
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=utc_now)

    # Relasi ke catatan kehadiran mahasiswa di sesi ini
    attendances: Mapped[List["Attendance"]] = relationship("Attendance", back_populates="session", cascade="all, delete-orphan")


# 3. Tabel Catatan Kehadiran (Presensi Mahasiswa per Sesi)
class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("sessions.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="alpha", nullable=False, comment="'hadir', 'izin', 'sakit', atau 'alpha'")
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="Keterangan atau alasan jika izin/sakit")
    evidence_image: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, comment="Path foto surat bukti dokter / izin")
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=utc_now, comment="Waktu presensi dikirim")
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    # Relasi balik ke User dan Session
    user: Mapped["User"] = relationship("User", back_populates="attendances")
    session: Mapped["Session"] = relationship("Session", back_populates="attendances")


# 4. Tabel Pengumpulan Tugas Mahasiswa
class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    task_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, comment="Judul Tugas")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="Catatan dari mahasiswa")
    file_name: Mapped[str] = mapped_column(String(255), nullable=False, comment="Nama file berkas asli")
    file_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, comment="Lokasi file di server")
    file_type: Mapped[str] = mapped_column(String(100), nullable=False, comment="Tipe file (PDF, ZIP, DOCX, dll)")
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, comment="Ukuran file dalam byte")
    google_drive_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    google_drive_link: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    submitted_date: Mapped[Optional[date_type]] = mapped_column(Date, default=utc_today)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=utc_now)

    user: Mapped["User"] = relationship("User", back_populates="tasks")


# 5. Tabel Slot Tugas dari Admin (Assignments)
class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    due_date: Mapped[date_type] = mapped_column(Date, nullable=False)
    due_time: Mapped[str] = mapped_column(String(10), default="23:59")
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=utc_now)


# 6. Tabel Bank Materi Kuliah (Slide & Dataset)
class Material(Base):
    __tablename__ = "materials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    meeting_number: Mapped[int] = mapped_column(Integer, default=1)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    file_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    external_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, comment="Link Google Drive materi")
    category: Mapped[str] = mapped_column(String(30), default="slide", comment="'slide' atau 'dataset'")
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=utc_now)


# 7. Tabel Pengumuman Kuliah (Announcements)
class Announcement(Base):
    __tablename__ = "announcements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)


# 8. Tabel Kalender Akademik
class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    event_date: Mapped[date_type] = mapped_column(Date, nullable=False)
    event_time: Mapped[Optional[time_type]] = mapped_column(Time, nullable=True)
    event_type: Mapped[str] = mapped_column(String(30), default="kuliah", comment="'kuliah', 'tugas', 'ujian', 'lainnya'")
    location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=utc_now)


# 9. Tabel Laporan Kritik, Saran, dan Kendala Bug
class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False, comment="'kritik', 'saran', 'bug'")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="baru", comment="'baru', 'diproses', 'selesai'")
    admin_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    user: Mapped["User"] = relationship("User", back_populates="reports")


# 10. Tabel Informasi Dosen, Jadwal, dan Kontak Kelas
class CourseInfo(Base):
    __tablename__ = "course_info"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    lecturer_name: Mapped[str] = mapped_column(String(100), default="RIFQI HIDAYAT")
    lecturer_nip: Mapped[str] = mapped_column(String(50), default="0401088701")
    lecturer_phone: Mapped[str] = mapped_column(String(50), default="081282394648")
    lecturer_email: Mapped[str] = mapped_column(String(100), default="")
    schedule_day: Mapped[str] = mapped_column(String(30), default="Kamis")
    schedule_time: Mapped[str] = mapped_column(String(50), default="13:00 - 15:30 WIB")
    room: Mapped[str] = mapped_column(String(100), default="G. Mahdor R. C 306")
    whatsapp_group_link: Mapped[str] = mapped_column(String(255), default="https://chat.whatsapp.com/BoluTrJnZ0p7nQ0FtONain")
    pj_whatsapp_phone: Mapped[str] = mapped_column(String(50), default="082316188656")
    auto_session_enabled: Mapped[int] = mapped_column(Integer, default=1)
    auto_open_time: Mapped[str] = mapped_column(String(10), default="13:00")
    auto_close_time: Mapped[str] = mapped_column(String(10), default="15:30")
    skip_next_session: Mapped[int] = mapped_column(Integer, default=0)
    tolerance_minutes: Mapped[int] = mapped_column(Integer, default=30)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)


# 11. Tabel Pengaturan Preferensi Mahasiswa
class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    theme: Mapped[str] = mapped_column(String(50), default="cobalt-slate")
    dark_mode: Mapped[int] = mapped_column(Integer, default=0)
    auto_logout_minutes: Mapped[int] = mapped_column(Integer, default=30)
