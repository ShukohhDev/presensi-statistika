# ==============================================================
# auth.py - Keamanan, Hash Password, dan Token JWT (Python)
# Dibuat sangat sederhana, bersih, dan modern untuk autentikasi.
# ==============================================================

import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
import bcrypt
from sqlalchemy.orm import Session
from database import get_db
import models

# 1. Kunci Rahasia dan Algoritma Token JWT
SECRET_KEY = os.getenv("JWT_SECRET", "presensi-statistika-ti25c-super-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24  # Token aktif selama 24 jam

# 2. Skema OAuth2 untuk membaca Bearer Token dari Header Request
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# Fungsi untuk memeriksa kecocokan password yang diketik dengan hash di database
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Memeriksa kecocokan password yang diinput dengan hash di database."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


# Fungsi untuk mengubah password teks biasa menjadi hash aman
def get_password_hash(password: str) -> str:
    """Mengubah password menjadi hash bcrypt yang aman."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


# Fungsi untuk membuat Token JWT baru saat user berhasil login
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Membuat token JWT baru saat user berhasil login."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# Dependency untuk memeriksa apakah user yang memanggil API sedang login
def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """Mengecek apakah pengguna yang memanggil API sedang login dengan token yang valid."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sesi login tidak valid atau telah berakhir. Silakan login kembali.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub") or payload.get("id")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user


# Dependency untuk memastikan yang mengakses rute khusus adalah Admin/PJ MK
def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    """Memastikan bahwa pengguna yang mengakses adalah Admin / Dosen / PJ MK."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: Hanya Dosen / PJ MK yang berwenang melakukan tindakan ini."
        )
    return current_user
