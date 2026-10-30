# ==============================================================
# routes/admin_routes.py - Kendali Admin PJ MK & Laporan
# Dibuat terstruktur, rapi, dan mudah dibaca oleh pemula.
# ==============================================================

import io
import sys
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

# Menambahkan direktori server_python ke sys.path agar import modul selalu terbaca
_server_dir = str(Path(__file__).resolve().parent.parent)
if _server_dir not in sys.path:
    sys.path.insert(0, _server_dir)

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from database import get_db
import models
from auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["Panel Kendali Admin PJ MK"])


# 1. Skema Validasi Input
class OpenSessionRequest(BaseModel):
    meeting_number: int
    title: Optional[str] = "Pertemuan Perkuliahan"
    duration_minutes: Optional[int] = 15
    attendance_mode: Optional[str] = "self"


class UpdateAttendanceStatusRequest(BaseModel):
    user_id: int
    session_id: int
    status: str
    note: Optional[str] = None


class UpdateModeRequest(BaseModel):
    session_id: int
    attendance_mode: str


class UpdateSessionRequest(BaseModel):
    meeting_number: Optional[int] = None
    title: Optional[str] = None
    duration_minutes: Optional[int] = None


# 2. Endpoint GET /api/admin/dashboard-stats
@router.get("/dashboard-stats")
def get_dashboard_stats(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Statistik ringkasan untuk dashboard admin:
    - Jumlah mahasiswa
    - Total sesi perkuliahan
    - Sesi aktif (jika ada)
    - Total laporan masuk
    """
    total_students = db.query(func.count(models.User.id)).filter(models.User.role == "user").scalar() or 0
    total_sessions = db.query(func.count(models.Session.id)).scalar() or 0
    open_session = db.query(models.Session).filter(models.Session.status == "open").first()
    total_reports = db.query(func.count(models.Report.id)).filter(models.Report.status == "baru").scalar() or 0
    total_tasks = db.query(func.count(models.Task.id)).scalar() or 0

    return {
        "totalStudents": total_students,
        "totalSessions": total_sessions,
        "openSession": open_session,
        "totalReports": total_reports,
        "totalTasks": total_tasks,
        "avgAttendance": 95.0
    }


# 3. Endpoint POST /api/admin/session/open
@router.post("/session/open")
def open_session(
    req: OpenSessionRequest,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Membuka sesi pertemuan presensi baru.
    """
    # Cek apakah masih ada sesi yang sedang terbuka
    active = db.query(models.Session).filter(models.Session.status == "open").first()
    if active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Masih ada sesi yang terbuka. Tutup sesi tersebut terlebih dahulu."
        )

    # Cek apakah nomor pertemuan sudah pernah ada
    existing = db.query(models.Session).filter(
        models.Session.meeting_number == req.meeting_number
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pertemuan ke-{req.meeting_number} sudah pernah dibuat."
        )

    new_session = models.Session(
        meeting_number=req.meeting_number,
        title=req.title or f"Pertemuan {req.meeting_number}",
        status="open",
        duration_minutes=req.duration_minutes or 15,
        attendance_mode=req.attendance_mode or "self",
        opened_at=datetime.now(timezone.utc),
        created_by=admin.id
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return {
        "message": "Sesi presensi berhasil dibuka.",
        "sessionId": new_session.id,
        "attendance_mode": new_session.attendance_mode
    }


# 4. Endpoint POST /api/admin/session/close
@router.post("/session/close")
def close_session(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Menutup sesi presensi yang sedang aktif.
    """
    active = db.query(models.Session).filter(models.Session.status == "open").first()
    if not active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak ada sesi presensi yang sedang aktif."
        )

    active.status = "closed"
    active.closed_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": f"Sesi Pertemuan {active.meeting_number} berhasil ditutup."}


# 5. Endpoint PUT /api/admin/session/mode
@router.put("/session/mode")
def update_session_mode(
    req: UpdateModeRequest,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Mengubah mode pengisian presensi: 'self' (mandiri mahasiswa) atau 'admin_only' (manual admin).
    """
    sess = db.query(models.Session).filter(models.Session.id == req.session_id).first()
    if not sess:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesi presensi tidak ditemukan."
        )

    sess.attendance_mode = req.attendance_mode
    db.commit()

    return {
        "message": f"Mode presensi berhasil diubah ke {req.attendance_mode}",
        "attendance_mode": req.attendance_mode
    }


# 6. Endpoint GET /api/admin/session/{session_id}/attendances
@router.get("/session/{session_id}/attendances")
def get_session_attendances(
    session_id: int,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Menampilkan daftar seluruh mahasiswa dan status presensi pada sesi tertentu.
    Jika mahasiswa belum mengisi, status otomatis ditampilkan sebagai 'alpha'.
    """
    sess = db.query(models.Session).filter(models.Session.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan.")

    users = db.query(models.User).filter(models.User.role == "user").order_by(models.User.name.asc()).all()
    attendances = db.query(models.Attendance).filter(models.Attendance.session_id == session_id).all()
    att_map = {a.user_id: a for a in attendances}

    list_data = []
    for u in users:
        att = att_map.get(u.id)
        list_data.append({
            "user_id": u.id,
            "name": u.name,
            "status": att.status if att else "alpha",
            "note": att.note if att else None,
            "evidence_image": att.evidence_image if att else None,
            "timestamp": att.submitted_at if att else None
        })

    return {
        "session": sess,
        "attendances": list_data
    }


# 7. Endpoint POST /api/admin/attendance/update
@router.post("/attendance/update")
def update_student_attendance(
    req: UpdateAttendanceStatusRequest,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Admin mengubah status kehadiran mahasiswa secara manual per sesi.
    """
    att = db.query(models.Attendance).filter(
        models.Attendance.user_id == req.user_id,
        models.Attendance.session_id == req.session_id
    ).first()

    if att:
        att.status = req.status
        if req.note is not None:
            att.note = req.note
        att.updated_at = datetime.now(timezone.utc)
    else:
        new_att = models.Attendance(
            user_id=req.user_id,
            session_id=req.session_id,
            status=req.status,
            note=req.note,
            submitted_at=datetime.now(timezone.utc)
        )
        db.add(new_att)

    db.commit()
    return {"message": "Status kehadiran berhasil diperbarui."}


# 8. Endpoint GET /api/admin/export/excel
@router.get("/export/excel")
def export_excel(
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Menghasilkan dan mengunduh file Microsoft Excel (.xlsx) rekap kehadiran kelas.
    """
    users = db.query(models.User).filter(models.User.role == "user").order_by(models.User.name.asc()).all()
    sessions = db.query(models.Session).order_by(models.Session.meeting_number.asc()).all()
    course = db.query(models.CourseInfo).first()

    wb = Workbook()
    ws = wb.active if wb.active is not None else wb.create_sheet("Rekapitulasi Kehadiran")
    ws.title = "Rekapitulasi Kehadiran"

    # Header Dokumen
    ws.append(["DAFTAR HADIR DAN REKAPITULASI KEHADIRAN MAHASISWA"])
    ws.append(["PROGRAM STUDI TEKNIK INFORMATIKA - KELAS TI25C"])
    ws.append(["MATA KULIAH: STATISTIKA DAN PROBABILITAS"])
    ws.append([f"Dosen Pengampu: {course.lecturer_name if course else 'RIFQI HIDAYAT'}", "", f"NIP: {course.lecturer_nip if course else '-'}"])
    ws.append([f"Jadwal: {course.schedule_day if course else 'Kamis'}, {course.schedule_time if course else '13:00 - 15:30 WIB'}", "", f"Ruang: {course.room if course else 'G. Mahdor'}"])
    ws.append([])

    # Header Kolom
    header_row = ["No", "Nama Mahasiswa"]
    for s in sessions:
        header_row.append(f"P{s.meeting_number}")
    header_row.extend(["Hadir (H)", "Izin (I)", "Sakit (S)", "Alpha (A)", "Total Sesi", "Persentase", "Status Syarat UAS"])
    ws.append(header_row)

    # Baris Tiap Mahasiswa
    for idx, u in enumerate(users, start=1):
        row = [idx, u.name]
        atts = {a.session_id: a.status for a in db.query(models.Attendance).filter(models.Attendance.user_id == u.id).all()}
        
        h_cnt = i_cnt = s_cnt = a_cnt = 0
        for s in sessions:
            st = atts.get(s.id, "alpha")
            if st == "hadir":
                row.append("H"); h_cnt += 1
            elif st == "izin":
                row.append("I"); i_cnt += 1
            elif st == "sakit":
                row.append("S"); s_cnt += 1
            else:
                row.append("A"); a_cnt += 1

        percent = round((h_cnt / len(sessions)) * 100) if sessions else 0
        uas_status = "MEMENUHI SYARAT" if percent >= 75 else "WASPADAI KEHADIRAN" if percent >= 45 else "TIDAK MEMENUHI (<45%)"

        row.extend([h_cnt, i_cnt, s_cnt, a_cnt, len(sessions), f"{percent}%", uas_status])
        ws.append(row)

    # Simpan ke memori buffer dan kirimkan sebagai file unduhan
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=rekap_kehadiran_statistika_TI25C.xlsx"}
    )

