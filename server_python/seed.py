# ==============================================================
# seed.py - Inisialisasi Otomatis Data Awal (Akun Mahasiswa & Admin)
# ==============================================================

import sys
from pathlib import Path

_server_dir = str(Path(__file__).resolve().parent)
if _server_dir not in sys.path:
    sys.path.insert(0, _server_dir)

from database import SessionLocal
import models
from auth import get_password_hash

STUDENTS = [
    {"name": "Dafa Rizki", "password": "250511019", "role": "user"},
    {"name": "Choirul Mustakim", "password": "250511017", "role": "user"},
    {"name": "Muhammad Reza Pahlevi Fairuz", "password": "250511029", "role": "user"},
    {"name": "Putri Dian Puspita Sari", "password": "250511004", "role": "user"},
    {"name": "Delviera Renada Anrelia", "password": "250511021", "role": "user"},
    {"name": "Inggi Febriani Sepina", "password": "250511068", "role": "user"},
    {"name": "Islananda Enjeli", "password": "250511104", "role": "user"},
    {"name": "Putra Sadewo", "password": "250511121", "role": "user"},
    {"name": "Dipo Endratanaya Kunto", "password": "250511095", "role": "user"},
    {"name": "Bayu Setiawan Hadi", "password": "250511082", "role": "user"},
    {"name": "Rommy Zaidan Zidna Fann", "password": "250511115", "role": "user"},
    {"name": "Sayyid Sakhiy Sulaeman", "password": "250511048", "role": "user"},
    {"name": "Handini", "password": "250511087", "role": "user"},
    {"name": "Tyara Septyanita", "password": "250511078", "role": "user"},
    {"name": "Syifa Hayatun Nisa", "password": "250511089", "role": "user"},
    {"name": "Ananda Abel Deas Pratama", "password": "250511023", "role": "user"},
    {"name": "Zain Akbar Mujahidan", "password": "250511097", "role": "user"},
    {"name": "Muhammad 'Azmi", "password": "250511043", "role": "user"},
    {"name": "IlhamAuliatullah", "password": "250511022", "role": "user"},
    {"name": "Rengga Ramdani Anggari", "password": "250511053", "role": "user"},
    {"name": "Faqih Hidayatus Salam", "password": "250511067", "role": "user"},
    {"name": "Shukoh#Dev", "password": "FAFA17052007", "role": "admin"},
    {"name": "Nisa Amaliyah Zahira", "password": "250511133", "role": "user"},
    {"name": "Asep Fauzan Muhammad Salman Al Baihaqi", "password": "250511079", "role": "user"},
    {"name": "Naufal Irsyadillah", "password": "250511088", "role": "user"},
    {"name": "Ahmad Fajar", "password": "250511091", "role": "user"},
    {"name": "Fadilah Wildan Firdaus", "password": "250511125", "role": "user"},
    {"name": "Andhika Prasetia Nugraha Putra", "password": "250511103", "role": "user"},
    {"name": "Rangga Aditama", "password": "250511150", "role": "user"},
    {"name": "Falih Arifin", "password": "250511044", "role": "user"},
]


def seed_initial_data():
    """Memeriksa dan mengisi data awal jika database masih kosong."""
    db = SessionLocal()
    try:
        user_count = db.query(models.User).count()
        if user_count == 0:
            print("[DATABASE] Inisialisasi akun pengguna awal...")
            for st in STUDENTS:
                user = models.User(
                    name=st["name"],
                    password=get_password_hash(st["password"]),
                    role=st["role"]
                )
                db.add(user)
                db.flush()

                # Tambahkan pengaturan tema default
                settings = models.UserSettings(
                    user_id=user.id,
                    theme="cobalt-slate",
                    dark_mode=0,
                    auto_logout_minutes=30
                )
                db.add(settings)

            # Inisialisasi info mata kuliah jika belum ada
            if not db.query(models.CourseInfo).first():
                info = models.CourseInfo(
                    id=1,
                    lecturer_name="RIFQI HIDAYAT",
                    lecturer_nip="0401088701",
                    lecturer_phone="081282394648",
                    schedule_day="Kamis",
                    schedule_time="13:00 - 15:30 WIB",
                    room="G. Mahdor R. C 306",
                    whatsapp_group_link="https://chat.whatsapp.com/BoluTrJnZ0p7nQ0FtONain",
                    pj_whatsapp_phone="082316188656"
                )
                db.add(info)

            db.commit()
            print(f"[DATABASE] Sukses memasukkan {len(STUDENTS)} akun pengguna.")
    except Exception as e:
        db.rollback()
        print(f"[DATABASE WARNING] Gagal seeding: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_initial_data()

