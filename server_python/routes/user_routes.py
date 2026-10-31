# ==============================================================
# routes/user_routes.py - Pengaturan Profil, Foto & Aktivitas
# ==============================================================

import os
import sys
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel

# Menambahkan direktori server_python ke sys.path agar import modul selalu terbaca
_server_dir = str(Path(__file__).resolve().parent.parent)
if _server_dir not in sys.path:
    sys.path.insert(0, _server_dir)

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["Pengguna & Profil"])

UPLOAD_PROFILES = os.path.join(os.path.dirname(__file__), "..", "uploads", "profiles")
os.makedirs(UPLOAD_PROFILES, exist_ok=True)


# 1. PUT /api/users/profile-photo - Unggah foto profil pengguna
@router.put("/profile-photo")
async def upload_profile_photo(
    photo: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mengunggah dan menyimpan foto profil mahasiswa."""
    filename = f"profile-{current_user.id}-{int(datetime.now(timezone.utc).timestamp())}_{photo.filename}"
    dest_path = os.path.join(UPLOAD_PROFILES, filename)

    content = await photo.read()
    with open(dest_path, "wb") as f:
        f.write(content)

    photo_url = f"/uploads/profiles/{filename}"
    current_user.profile_photo = photo_url

    # Catat log aktivitas
    db.add(models.ActivityLog(
        user_id=current_user.id,
        action="update_profil",
        description="Mengubah foto profil akun"
    ))
    db.commit()
    db.refresh(current_user)

    return {"message": "Foto profil berhasil diperbarui.", "photo": photo_url}


# 2. PUT /api/users/settings - Simpan preferensi tema dan pengaturan
class UserSettingsUpdate(BaseModel):
    theme: Optional[str] = "cobalt-slate"
    dark_mode: Optional[int] = 0
    auto_logout_minutes: Optional[int] = 30


@router.put("/settings")
def update_user_settings(
    body: UserSettingsUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Menyimpan tema warna, mode gelap, dan durasi logout otomatis."""
    settings = db.query(models.UserSettings).filter(
        models.UserSettings.user_id == current_user.id
    ).first()

    if not settings:
        settings = models.UserSettings(
            user_id=current_user.id,
            theme=body.theme or "cobalt-slate",
            dark_mode=body.dark_mode or 0,
            auto_logout_minutes=body.auto_logout_minutes or 30
        )
        db.add(settings)
    else:
        if body.theme is not None:
            settings.theme = body.theme
        if body.dark_mode is not None:
            settings.dark_mode = body.dark_mode
        if body.auto_logout_minutes is not None:
            settings.auto_logout_minutes = body.auto_logout_minutes

    db.commit()
    return {"message": "Pengaturan berhasil disimpan."}


# 3. GET /api/users/activity - Riwayat aktivitas pengguna
@router.get("/activity")
def get_user_activity(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mengambil catatan riwayat aktivitas pengguna."""
    activities = db.query(models.ActivityLog).filter(
        models.ActivityLog.user_id == current_user.id
    ).order_by(models.ActivityLog.created_at.desc()).limit(100).all()

    return {"activities": activities}


# 4. GET /api/users/login-history - Riwayat sesi login/logout pengguna
@router.get("/login-history")
def get_user_login_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mengambil riwayat catatan login dan logout."""
    history = db.query(models.ActivityLog).filter(
        models.ActivityLog.user_id == current_user.id,
        models.ActivityLog.action.in_(["login", "logout"])
    ).order_by(models.ActivityLog.created_at.desc()).limit(50).all()

    return {"history": history}

