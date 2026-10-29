# ==============================================================
# routes/other_routes.py - Bank Materi, Tugas, Kalender & Laporan
# ==============================================================

import os
import sys
from pathlib import Path
from typing import Optional

# Menambahkan direktori server_python ke sys.path agar import modul selalu terbaca
_server_dir = str(Path(__file__).resolve().parent.parent)
if _server_dir not in sys.path:
    sys.path.insert(0, _server_dir)

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import get_current_user, require_admin

router = APIRouter(prefix="/api", tags=["Layanan Pendukung"])

# Folder uploads berkas materi & tugas
UPLOAD_TASKS = os.path.join(os.path.dirname(__file__), "..", "uploads", "tasks")
UPLOAD_MATERIALS = os.path.join(os.path.dirname(__file__), "..", "uploads", "materials")
os.makedirs(UPLOAD_TASKS, exist_ok=True)
os.makedirs(UPLOAD_MATERIALS, exist_ok=True)


# --- 1. BANK MATERI KULIAH ---
@router.get("/materials")
def get_materials(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mengambil daftar seluruh materi kuliah yang diunggah dosen/PJ MK."""
    materials = db.query(models.Material).order_by(models.Material.meeting_number.asc()).all()
    return {"materials": materials}


# --- 2. PENGUMPULAN TUGAS ---
@router.get("/tasks")
def get_tasks(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mengambil riwayat tugas yang sudah dikumpulkan."""
    if current_user.role == "admin":
        tasks = db.query(models.Task).order_by(models.Task.submitted_at.desc()).all()
    else:
        tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).all()
    return {"tasks": tasks}


# --- 3. KALENDER AKADEMIK ---
@router.get("/calendar")
def get_calendar_events(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mengambil jadwal agenda kegiatan di kalender akademik."""
    events = db.query(models.CalendarEvent).order_by(models.CalendarEvent.event_date.asc()).all()
    return {"events": events}


# --- 4. LAPORAN & SARAN MAHASISWA ---
@router.get("/reports/my")
def get_my_reports(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mengambil laporan dan saran yang pernah dikirim oleh user saat ini."""
    reports = db.query(models.Report).filter(models.Report.user_id == current_user.id).all()
    return {"reports": reports}


# --- 5. INFORMASI KELAS & DOSEN ---
@router.get("/admin/course-info")
def get_course_info(db: Session = Depends(get_db)):
    """Mengambil informasi nama dosen, NIP, kontak WA, dan jadwal kelas."""
    course = db.query(models.CourseInfo).first()
    if not course:
        course = models.CourseInfo()
        db.add(course)
        db.commit()
        db.refresh(course)
    return course

