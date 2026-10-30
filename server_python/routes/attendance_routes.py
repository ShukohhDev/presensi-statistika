# ==============================================================
# routes/attendance_routes.py - Presensi Mahasiswa & Rekap Kehadiran
# Dibuat ringkas, bersih, dan mudah dipelajari oleh pemula.
# ==============================================================

import os
import sys
import shutil
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

# Menambahkan direktori server_python ke sys.path agar import modul selalu terbaca
_server_dir = str(Path(__file__).resolve().parent.parent)
if _server_dir not in sys.path:
    sys.path.insert(0, _server_dir)

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
from auth import get_current_user

router = APIRouter(prefix="/api/attendance", tags=["Presensi Mahasiswa"])

# Folder untuk menyimpan foto bukti surat izin/sakit
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "evidence")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# 1. Endpoint GET /api/attendance/active-session
@router.get("/active-session")
def get_active_session(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Memeriksa apakah saat ini ada sesi presensi yang sedang dibuka (status 'open').
    Sekaligus memeriksa status presensi mahasiswa saat ini di sesi tersebut.
    """
    # Cari sesi terakhir yang statusnya 'open'
    session = db.query(models.Session).filter(
        models.Session.status == "open"
    ).order_by(models.Session.id.desc()).first()

    if not session:
        return {"session": None, "attendance": None}

    # Cari apakah mahasiswa yang sedang login sudah presensi di sesi ini
    attendance = db.query(models.Attendance).filter(
        models.Attendance.user_id == current_user.id,
        models.Attendance.session_id == session.id
    ).first()

    return {
        "session": {
            "id": session.id,
            "meeting_number": session.meeting_number,
            "title": session.title,
            "status": session.status,
            "duration_minutes": session.duration_minutes,
            "attendance_mode": session.attendance_mode,
            "opened_at": session.opened_at,
            "created_by": session.created_by
        },
        "attendance": {
            "id": attendance.id,
            "status": attendance.status,
            "note": attendance.note,
            "evidence_image": attendance.evidence_image,
            "submitted_at": attendance.submitted_at
        } if attendance else None
    }


# 2. Endpoint POST /api/attendance/submit
@router.post("/submit")
async def submit_attendance(
    session_id: int = Form(...),
    status_hadir: str = Form(..., alias="status"),
    note: Optional[str] = Form(None),
    evidence: Optional[UploadFile] = File(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mahasiswa mengirimkan formulir presensi mandiri (Hadir, Izin, atau Sakit).
    """
    # 1. Validasi sesi
    session = db.query(models.Session).filter(
        models.Session.id == session_id,
        models.Session.status == "open"
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sesi presensi tidak ditemukan atau sudah ditutup."
        )

    # 2. Jika mode manual admin, mahasiswa dilarang submit mandiri
    if session.attendance_mode == "admin_only" and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sesi presensi ini dikelola secara manual oleh PJ MK. Mahasiswa tidak dapat melakukan presensi mandiri."
        )

    # 3. Cek apakah sudah pernah absen sebelumnya
    existing = db.query(models.Attendance).filter(
        models.Attendance.user_id == current_user.id,
        models.Attendance.session_id == session_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Anda sudah melakukan presensi untuk sesi ini."
        )

    # 4. Validasi izin / sakit wajib mengisi catatan dan foto bukti
    if status_hadir in ["izin", "sakit"]:
        if not note or not note.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Catatan/alasan wajib diisi untuk status izin atau sakit."
            )
        if not evidence:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Foto surat bukti dokter/izin wajib diunggah."
            )

    # 5. Simpan file foto bukti jika diunggah
    evidence_path = None
    if evidence:
        filename = f"evidence-{current_user.id}-{int(datetime.now(timezone.utc).timestamp())}_{evidence.filename}"
        file_destination = os.path.join(UPLOAD_DIR, filename)
        with open(file_destination, "wb") as buffer:
            shutil.copyfileobj(evidence.file, buffer)
        evidence_path = f"/uploads/evidence/{filename}"

    # 6. Catat presensi ke database
    new_att = models.Attendance(
        user_id=current_user.id,
        session_id=session_id,
        status=status_hadir,
        note=note.strip() if note else None,
        evidence_image=evidence_path,
        submitted_at=datetime.now(timezone.utc)
    )
    db.add(new_att)
    db.commit()

    return {"message": "Presensi berhasil dicatat.", "status": status_hadir}


# 3. Endpoint GET /api/attendance/history
@router.get("/history")
def get_attendance_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Melihat riwayat presensi pribadi mahasiswa dari setiap pertemuan.
    """
    records = db.query(
        models.Attendance, models.Session
    ).join(
        models.Session, models.Attendance.session_id == models.Session.id
    ).filter(
        models.Attendance.user_id == current_user.id
    ).order_by(models.Session.meeting_number.desc()).all()

    history_list = []
    for att, sess in records:
        history_list.append({
            "id": att.id,
            "session_id": att.session_id,
            "meeting_number": sess.meeting_number,
            "title": sess.title,
            "status": att.status,
            "note": att.note,
            "evidence_image": att.evidence_image,
            "opened_at": sess.opened_at,
            "closed_at": sess.closed_at
        })

    return {"history": history_list}


# 4. Endpoint GET /api/attendance/summary
@router.get("/summary")
def get_attendance_summary(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ringkasan total hadir, izin, sakit, dan persentase kehadiran mahasiswa saat ini.
    """
    total_sessions = db.query(func.count(models.Session.id)).scalar() or 0

    hadir = db.query(func.count(models.Attendance.id)).filter(
        models.Attendance.user_id == current_user.id,
        models.Attendance.status == "hadir"
    ).scalar() or 0

    izin = db.query(func.count(models.Attendance.id)).filter(
        models.Attendance.user_id == current_user.id,
        models.Attendance.status == "izin"
    ).scalar() or 0

    sakit = db.query(func.count(models.Attendance.id)).filter(
        models.Attendance.user_id == current_user.id,
        models.Attendance.status == "sakit"
    ).scalar() or 0

    alpha = max(0, total_sessions - (hadir + izin + sakit))
    percentage = round((hadir / total_sessions) * 100) if total_sessions > 0 else 0

    return {
        "summary": {
            "hadir": hadir,
            "izin": izin,
            "sakit": sakit,
            "alpha": alpha,
            "totalSessions": total_sessions,
            "percentage": percentage
        }
    }


# 5. Endpoint GET /api/attendance/recap
@router.get("/recap")
def get_attendance_recap(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Rekap kehadiran seluruh mahasiswa kelas TI25C (untuk tabel matriks rekap).
    """
    sessions = db.query(models.Session).order_by(models.Session.meeting_number.asc()).all()

    if current_user.role == "admin":
        users = db.query(models.User).filter(
            models.User.role == "user"
        ).order_by(models.User.name.asc()).all()
    else:
        users = [current_user]

    recap_list = []
    for u in users:
        atts = db.query(models.Attendance).filter(models.Attendance.user_id == u.id).all()
        att_map = {a.session_id: a.status for a in atts}

        counts = {
            "hadir": sum(1 for a in atts if a.status == "hadir"),
            "izin": sum(1 for a in atts if a.status == "izin"),
            "sakit": sum(1 for a in atts if a.status == "sakit"),
            "alpha": max(0, len(sessions) - len(atts))
        }
        percentage = round((counts["hadir"] / len(sessions)) * 100) if sessions else 0

        recap_list.append({
            "id": u.id,
            "name": u.name,
            "counts": counts,
            "percentage": percentage,
            "attendanceMap": att_map
        })

    return {
        "recap": recap_list,
        "sessions": [
            {"id": s.id, "meeting_number": s.meeting_number, "title": s.title}
            for s in sessions
        ]
    }

