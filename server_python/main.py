"""
=============================================================================
Aplikasi Utama Backend Presensi Statistika (FastAPI + Python)
=============================================================================
File ini adalah titik masuk utama (entry point) aplikasi backend Python.
Dibuat dengan kode yang sederhana, bersih, dan mudah dipahami untuk pemula.
Menyediakan API lengkap yang 100% kompatibel dengan frontend React/HTML/CSS.
=============================================================================
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Import konfigurasi database dan pembuatan tabel
from database import engine, Base

# Import semua router (jalur API)
from routes import auth_routes, attendance_routes, admin_routes, other_routes

# Otomatis membuat semua tabel di database (MySQL / SQLite) saat aplikasi pertama kali dijalankan
Base.metadata.create_all(bind=engine)

# Inisialisasi aplikasi FastAPI dengan dokumentasi otomatis (Swagger UI)
app = FastAPI(
    title="API Presensi MK Statistika - TI25C",
    description="Backend sederhana & tangguh menggunakan Python FastAPI dan MySQL/SQLite",
    version="1.0.0"
)

# ---------------------------------------------------------------------------
# Konfigurasi CORS (Cross-Origin Resource Sharing)
# Mengizinkan frontend (Vite lokal, Cloudflare Workers, dan Domain Resmi)
# untuk berkomunikasi dengan API backend ini.
# ---------------------------------------------------------------------------
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://presensi-statistika-ti25c.shukohdev.web.id",
    "https://presensi-statistika-ti25c.shukohh21.workers.dev"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Folder Upload Berkas (Foto Bukti Sakit / File Tugas)
# ---------------------------------------------------------------------------
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ---------------------------------------------------------------------------
# Pendaftaran Rute API (Endpoints)
# ---------------------------------------------------------------------------
app.include_router(auth_routes.router)        # Rute Login, Logout, Info Akun
app.include_router(attendance_routes.router)  # Rute Presensi Mahasiswa
app.include_router(admin_routes.router)       # Rute Pengelolaan Admin / Dosen
app.include_router(other_routes.router)       # Rute Tugas, Materi, Kalender, dll.

# ---------------------------------------------------------------------------
# Endpoint Cek Kesehatan Sistem (Health Check)
# ---------------------------------------------------------------------------
@app.get("/")
def root():
    """Halaman pembuka sederhana untuk memastikan server aktif."""
    return {
        "status": "online",
        "message": "Backend Presensi MK Statistika (Python + FastAPI) Berjalan Normal!",
        "docs_url": "/docs"  # Buka /docs di browser untuk melihat dokumentasi interaktif
    }

@app.get("/api/health")
def health_check():
    """Endpoint untuk pemantauan sistem (Uptime monitoring)."""
    return {"status": "ok", "engine": "FastAPI + Python", "database": "Connected"}

# ---------------------------------------------------------------------------
# Menjalankan server secara mandiri jika file ini dieksekusi langsung
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PYTHON_PORT", os.environ.get("PORT", 5000)))
    print(f"Server Python berjalan di: http://127.0.0.1:{port}")
    print(f"Buka dokumentasi interaktif API di: http://127.0.0.1:{port}/docs")
    # Jika dijalankan di background (pythonw), langsung jalankan instance app
    uvicorn.run(app, host="127.0.0.1", port=port)

