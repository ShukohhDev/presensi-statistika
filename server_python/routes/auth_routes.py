# ==============================================================
# routes/auth_routes.py - Rute Autentikasi (Login, Logout, Me)
# Dibuat ringkas dan terstruktur agar mudah dibaca pemula.
# ==============================================================

import sys
from pathlib import Path

# Menambahkan direktori server_python ke sys.path agar import modul selalu terbaca
_server_dir = str(Path(__file__).resolve().parent.parent)
if _server_dir not in sys.path:
    sys.path.insert(0, _server_dir)

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
from auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Autentikasi"])


# 1. Skema Data Masukan (Input Validation menggunakan Pydantic)
class LoginRequest(BaseModel):
    name: str
    password: str


# 2. Endpoint POST /api/auth/login
@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Menerima nama mahasiswa/admin dan password.
    Jika cocok, menghasilkan Token JWT dan data akun.
    """
    nama_input = req.name.strip()
    if not nama_input or not req.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nama dan password wajib diisi."
        )

    # Cari user di database (tidak peka huruf besar/kecil)
    user = db.query(models.User).filter(
        func.lower(models.User.name) == nama_input.lower()
    ).first()

    # Periksa apakah user ditemukan dan password cocok
    if not user or not verify_password(req.password, str(user.password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nama atau password salah."
        )

    # Buat token JWT yang menyimpan ID, Nama, dan Role
    token_jwt = create_access_token(data={
        "id": user.id,
        "name": user.name,
        "role": user.role
    })

    # Kembalikan response yang 100% sama dengan format Express.js sebelumnya
    return {
        "token": token_jwt,
        "user": {
            "id": user.id,
            "name": user.name,
            "role": user.role,
            "profile_photo": user.profile_photo
        }
    }


# 3. Endpoint GET /api/auth/me
@router.get("/me")
def get_me(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mengambil data profil user yang sedang login saat ini.
    """
    settings = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == current_user.id
    ).first()

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "role": current_user.role,
            "profile_photo": current_user.profile_photo,
            "created_at": current_user.created_at
        },
        "settings": {
            "theme": settings.theme if settings else "cobalt-slate",
            "dark_mode": settings.dark_mode if settings else 0,
            "auto_logout_minutes": settings.auto_logout_minutes if settings else 30
        }
    }


# 4. Endpoint POST /api/auth/logout
@router.post("/logout")
def logout(current_user: models.User = Depends(get_current_user)):
    """
    Logout dari sistem.
    """
    return {"message": "Berhasil keluar."}

