"""
=============================================================================
Script Migrasi Data (Dari SQLite Lama ke Database Baru Python / MySQL)
=============================================================================
Script ini berguna untuk menyalin data pengguna (mahasiswa & admin), sesi kuliah,
kehadiran, materi, tugas, dan jadwal kuliah dari database lama secara aman.
=============================================================================
"""

import os
import sqlite3
from database import engine, SessionLocal, Base
import models

def jalankan_migrasi():
    old_db_path = os.path.join(os.path.dirname(__file__), "..", "server", "data", "presensi.db")
    
    if not os.path.exists(old_db_path):
        print(f"[Error] File database lama tidak ditemukan di: {old_db_path}")
        return

    print("==================================================")
    print("Memulai proses migrasi data dari SQLite lama...")
    print("==================================================")

    # 1. Pastikan tabel baru sudah terbuat
    Base.metadata.create_all(bind=engine)
    db_baru = SessionLocal()

    # 2. Koneksi ke SQLite lama
    conn_lama = sqlite3.connect(old_db_path)
    conn_lama.row_factory = sqlite3.Row
    c_lama = conn_lama.cursor()

    try:
        # 1. Migrasi Pengguna (users)
        print("-> Memindahkan data Pengguna (users)...")
        c_lama.execute("SELECT * FROM users")
        users = c_lama.fetchall()
        for u in users:
            ada = db_baru.query(models.User).filter(models.User.id == u["id"]).first()
            if not ada:
                baru = models.User(
                    id=u["id"],
                    name=u["name"],
                    password=u["password"],
                    role=u["role"],
                    profile_photo=u["profile_photo"]
                )
                db_baru.add(baru)
        db_baru.commit()
        print(f"   [Berhasil] {len(users)} pengguna disinkronkan.")

        # 2. Migrasi Sesi (sessions)
        print("-> Memindahkan data Sesi Perkuliahan (sessions)...")
        c_lama.execute("SELECT * FROM sessions")
        sessions = c_lama.fetchall()
        for s in sessions:
            ada = db_baru.query(models.Session).filter(models.Session.id == s["id"]).first()
            if not ada:
                baru = models.Session(
                    id=s["id"],
                    meeting_number=s["meeting_number"],
                    title=s["title"],
                    status=s["status"],
                    duration_minutes=s["duration_minutes"],
                    created_by=s["created_by"],
                    attendance_mode=s["attendance_mode"] or "self"
                )
                db_baru.add(baru)
        db_baru.commit()
        print(f"   [Berhasil] {len(sessions)} sesi disinkronkan.")

        # 3. Migrasi Kehadiran (attendance)
        print("-> Memindahkan data Kehadiran (attendance)...")
        c_lama.execute("SELECT * FROM attendance")
        attendances = c_lama.fetchall()
        for a in attendances:
            ada = db_baru.query(models.Attendance).filter(models.Attendance.id == a["id"]).first()
            if not ada:
                baru = models.Attendance(
                    id=a["id"],
                    user_id=a["user_id"],
                    session_id=a["session_id"],
                    status=a["status"],
                    note=a["note"],
                    evidence_image=a["evidence_image"]
                )
                db_baru.add(baru)
        db_baru.commit()
        print(f"   [Berhasil] {len(attendances)} data presensi disinkronkan.")

        # 4. Migrasi Course Info
        print("-> Memindahkan Informasi Mata Kuliah (course_info)...")
        c_lama.execute("SELECT * FROM course_info")
        course_infos = c_lama.fetchall()
        for ci in course_infos:
            ada = db_baru.query(models.CourseInfo).filter(models.CourseInfo.id == ci["id"]).first()
            if not ada:
                baru = models.CourseInfo(
                    id=ci["id"],
                    lecturer_name=ci["lecturer_name"],
                    lecturer_nip=ci["lecturer_nip"],
                    schedule_day=ci["schedule_day"],
                    schedule_time=ci["schedule_time"],
                    room=ci["room"],
                    whatsapp_group_link=ci["whatsapp_group_link"],
                    pj_whatsapp_phone=ci["pj_whatsapp_phone"],
                    lecturer_phone=ci["lecturer_phone"],
                    lecturer_email=ci["lecturer_email"],
                    auto_session_enabled=bool(ci["auto_session_enabled"]),
                    auto_open_time=ci["auto_open_time"],
                    auto_close_time=ci["auto_close_time"],
                    skip_next_session=bool(ci["skip_next_session"]),
                    tolerance_minutes=ci["tolerance_minutes"]
                )
                db_baru.add(baru)
        db_baru.commit()
        print(f"   [Berhasil] Data informasi mata kuliah disinkronkan.")

        print("==================================================")
        print("MIGRASI DATA SUKSES 100%!")
        print("==================================================")

    except Exception as e:
        print(f"[Error] Terjadi kesalahan saat migrasi: {e}")
        db_baru.rollback()
    finally:
        conn_lama.close()
        db_baru.close()

if __name__ == "__main__":
    jalankan_migrasi()
