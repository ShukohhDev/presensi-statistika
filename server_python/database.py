# ==============================================================
# database.py - Modul Pengaturan Koneksi Basis Data (MySQL / SQLite)
# Dibuat sederhana agar mudah dibaca dan dipelajari oleh pemula.
# ==============================================================

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 1. Muat variabel lingkungan dari file .env (jika ada)
load_dotenv()

# 2. Tentukan Alamat Koneksi Database:
# - Secara default, jika DATABASE_URL tidak diisi, sistem otomatis menggunakan SQLite lokal (data.db).
# - Jika ingin menggunakan MySQL, cukup isi DATABASE_URL di file .env:
#   Contoh MySQL: mysql+pymysql://root:password@localhost:3306/presensi_statistika
_default_sqlite_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "presensi_lokal.db")).replace("\\", "/")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{_default_sqlite_path}")

# 3. Buat Engine Koneksi Database
if DATABASE_URL.startswith("sqlite"):
    # Pengaturan khusus SQLite agar mendukung thread FastAPI
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Pengaturan untuk MySQL (dengan koneksi otomatis pulih jika putus)
    engine = create_engine(
        DATABASE_URL, pool_pre_ping=True, pool_recycle=3600
    )

# 4. Buat Pabrik Sesi (SessionMaker) untuk melakukan query database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 5. Base Class untuk semua Model Tabel (akan digunakan di models.py)
Base = declarative_base()


# 6. Fungsi Helper (Dependency) untuk mendapatkan sesi database di setiap rute API
def get_db():
    """
    Fungsi ini membuka sesi database saat ada request masuk dari user,
    dan otomatis menutupnya kembali setelah request selesai.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

