# ==============================================================
# routes/other_routes.py - Bank Materi, Tugas, Kalender, Notifikasi & Laporan
# ==============================================================

import os
import sys
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel

# Menambahkan direktori server_python ke sys.path agar import modul selalu terbaca
_server_dir = str(Path(__file__).resolve().parent.parent)
if _server_dir not in sys.path:
    sys.path.insert(0, _server_dir)

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
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


@router.post("/materials/upload")
async def upload_material(
    meeting_number: int = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    external_link: Optional[str] = Form(None),
    category: str = Form("slide"),
    file: Optional[UploadFile] = File(None),
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin/PJ MK mengunggah materi perkuliahan."""
    local_path = None
    file_name = None
    file_type = None
    file_size = 0

    if file:
        file_name = file.filename
        file_type = file.content_type
        save_name = f"material-p{meeting_number}-{int(datetime.now(timezone.utc).timestamp())}_{file_name}"
        dest_path = os.path.join(UPLOAD_MATERIALS, save_name)
        content = await file.read()
        file_size = len(content)
        with open(dest_path, "wb") as f:
            f.write(content)
        local_path = f"/uploads/materials/{save_name}"

    material = models.Material(
        meeting_number=meeting_number,
        title=title,
        description=description,
        file_name=file_name,
        file_path=local_path,
        file_type=file_type,
        file_size=file_size,
        external_link=external_link,
        category=category,
        created_by=current_user.id
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return {"message": "Materi perkuliahan berhasil diunggah.", "material": material}


@router.delete("/materials/{material_id}")
def delete_material(
    material_id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin menghapus berkas materi perkuliahan."""
    mat = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Materi tidak ditemukan.")
    db.delete(mat)
    db.commit()
    return {"message": "Materi perkuliahan berhasil dihapus."}


# --- 2. PENGUMPULAN TUGAS ---
@router.get("/tasks")
@router.get("/tasks/history")
def get_task_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mengambil riwayat tugas yang sudah dikumpulkan oleh mahasiswa saat ini."""
    tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).order_by(models.Task.submitted_at.desc()).all()
    return {"tasks": tasks}


@router.get("/tasks/all")
def get_all_tasks(
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin mengambil seluruh tugas yang telah dikumpulkan semua mahasiswa."""
    results = db.query(models.Task, models.User.name.label("student_name")).join(
        models.User, models.Task.user_id == models.User.id
    ).order_by(models.Task.submitted_at.desc()).all()

    tasks_list = []
    for t, student_name in results:
        task_dict = {
            "id": t.id,
            "user_id": t.user_id,
            "student_name": student_name,
            "assignment_id": t.assignment_id,
            "task_title": t.task_title,
            "description": t.description,
            "file_name": t.file_name,
            "file_path": t.file_path,
            "file_type": t.file_type,
            "file_size": t.file_size,
            "google_drive_link": t.google_drive_link,
            "submitted_date": str(t.submitted_date),
            "submitted_at": t.submitted_at.isoformat() if t.submitted_at else None
        }
        tasks_list.append(task_dict)
    return {"tasks": tasks_list}


@router.get("/tasks/assignments")
def get_assignments(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mengambil daftar penugasan aktif beserta jumlah pengumpulan."""
    assignments = db.query(models.Assignment).order_by(models.Assignment.due_date.asc()).all()
    result = []
    for a in assignments:
        submitted_count = db.query(models.Task).filter(models.Task.assignment_id == a.id).count()
        my_submission_count = db.query(models.Task).filter(
            models.Task.assignment_id == a.id,
            models.Task.user_id == current_user.id
        ).count()
        result.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "due_date": str(a.due_date),
            "due_time": a.due_time,
            "submitted_count": submitted_count,
            "my_submission_count": my_submission_count
        })
    return {"assignments": result}


class AssignmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: str
    due_time: Optional[str] = "23:59"


@router.post("/tasks/assignments/create")
def create_assignment(
    body: AssignmentCreate,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin membuka slot penugasan baru."""
    new_assignment = models.Assignment(
        title=body.title,
        description=body.description,
        due_date=body.due_date,
        due_time=body.due_time or "23:59",
        created_by=current_user.id
    )
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)

    # Kirim notifikasi ke semua mahasiswa
    users = db.query(models.User).filter(models.User.role == "user").all()
    for u in users:
        db.add(models.Notification(
            user_id=u.id,
            title="Tugas Baru Dibuka",
            message=f"PJ MK telah membuka pengumpulan tugas baru: {body.title}. Batas: {body.due_date}.",
            type="reminder",
            created_by=current_user.id
        ))
    db.commit()
    return {"message": "Slot penugasan berhasil dibuat.", "assignmentId": new_assignment.id}


@router.delete("/tasks/assignments/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin menghapus slot penugasan."""
    asg = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not asg:
        raise HTTPException(status_code=404, detail="Penugasan tidak ditemukan.")
    db.delete(asg)
    db.commit()
    return {"message": "Penugasan berhasil dihapus."}


@router.post("/tasks/upload")
async def upload_task(
    assignment_id: Optional[int] = Form(None),
    task_title: Optional[str] = Form("Tugas Statistika"),
    description: Optional[str] = Form(None),
    submitted_date: Optional[str] = Form(None),
    drive_link: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mahasiswa mengumpulkan tugas kuliah (berkas atau tautan Google Drive)."""
    if not file and not drive_link:
        raise HTTPException(status_code=400, detail="Harap pilih file tugas atau masukkan tautan Google Drive.")

    today_str = submitted_date or datetime.now().strftime("%Y-%m-%d")
    local_path = None
    file_name = "Tautan Google Drive"
    file_type = "application/octet-stream"
    file_size = 0

    if file:
        file_name = file.filename
        file_type = file.content_type
        save_name = f"task-{current_user.id}-{int(datetime.now(timezone.utc).timestamp())}_{file_name}"
        dest_path = os.path.join(UPLOAD_TASKS, save_name)
        content = await file.read()
        file_size = len(content)
        with open(dest_path, "wb") as f:
            f.write(content)
        local_path = f"/uploads/tasks/{save_name}"

    new_task = models.Task(
        user_id=current_user.id,
        assignment_id=assignment_id,
        task_title=task_title,
        description=description,
        file_name=file_name,
        file_path=local_path,
        file_type=file_type,
        file_size=file_size,
        google_drive_link=drive_link,
        submitted_date=today_str
    )
    db.add(new_task)

    # Catat ke activity log
    db.add(models.ActivityLog(
        user_id=current_user.id,
        action="upload_tugas",
        description=f"Mengumpulkan tugas: {file_name}"
    ))
    db.commit()
    db.refresh(new_task)

    return {"message": "Tugas berhasil dikumpulkan.", "task": new_task}


@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mahasiswa atau Admin menghapus tugas yang pernah diunggah."""
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tugas tidak ditemukan.")

    if current_user.role != "admin" and task.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Akses ditolak.")

    # Hapus file lokal jika ada
    if task.file_path:
        fname = os.path.basename(task.file_path)
        real_file = os.path.join(UPLOAD_TASKS, fname)
        if os.path.exists(real_file):
            try:
                os.remove(real_file)
            except Exception:
                pass

    db.delete(task)
    db.commit()
    return {"message": "Berkas tugas berhasil dihapus."}


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
class ReportCreate(BaseModel):
    category: str
    title: str
    description: str


@router.post("/reports/create")
@router.post("/reports")
def create_report(
    body: ReportCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mahasiswa mengirimkan kritik, saran, atau kendala sistem."""
    new_report = models.Report(
        user_id=current_user.id,
        category=body.category,
        title=body.title,
        description=body.description,
        status="baru"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return {"message": "Laporan berhasil dikirim.", "report": new_report}


@router.get("/reports/my")
def get_my_reports(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mengambil laporan dan saran yang pernah dikirim oleh user saat ini."""
    reports = db.query(models.Report).filter(models.Report.user_id == current_user.id).order_by(models.Report.created_at.desc()).all()
    return {"reports": reports}


@router.get("/reports/all")
def get_all_reports(
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin mengambil seluruh laporan yang masuk."""
    reports = db.query(models.Report).order_by(models.Report.created_at.desc()).all()
    return {"reports": reports}


class ReportStatusUpdate(BaseModel):
    report_id: int
    status: str
    admin_response: Optional[str] = None


@router.put("/reports/update-status")
def update_report_status(
    body: ReportStatusUpdate,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin memperbarui status laporan (baru, diproses, selesai) dan memberikan tanggapan."""
    rep = db.query(models.Report).filter(models.Report.id == body.report_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Laporan tidak ditemukan.")
    rep.status = body.status
    if body.admin_response is not None:
        rep.admin_response = body.admin_response
    db.commit()
    return {"message": "Status laporan berhasil diperbarui."}


# --- 5. NOTIFIKASI PENGGUNA ---
@router.get("/notifications")
def get_notifications(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mengambil daftar notifikasi pengguna dan menghitung jumlah belum dibaca."""
    notifs = db.query(models.Notification).filter(
        (models.Notification.user_id == current_user.id) | (models.Notification.user_id == None)
    ).order_by(models.Notification.created_at.desc()).limit(50).all()

    unread_count = db.query(models.Notification).filter(
        ((models.Notification.user_id == current_user.id) | (models.Notification.user_id == None)),
        models.Notification.is_read == 0
    ).count()

    return {"notifications": notifs, "unreadCount": unread_count}


@router.put("/notifications/{notif_id}/read")
@router.put("/notifications/read/{notif_id}")
def mark_notification_read(
    notif_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Menandai satu notifikasi sebagai sudah dibaca."""
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = 1
        db.commit()
    return {"message": "Notifikasi ditandai sudah dibaca."}


@router.put("/notifications/read-all")
def mark_all_notifications_read(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Menandai seluruh notifikasi pengguna sebagai sudah dibaca."""
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).update({"is_read": 1})
    db.commit()
    return {"message": "Semua notifikasi ditandai sudah dibaca."}


# --- 6. LOG AKTIVITAS (Activity Log) ---
@router.get("/activity")
@router.get("/activity/my")
def get_activity_log(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mengambil rekam jejak aktivitas pengguna."""
    activities = db.query(models.ActivityLog).filter(
        models.ActivityLog.user_id == current_user.id
    ).order_by(models.ActivityLog.created_at.desc()).limit(100).all()
    return {"activities": activities}


# --- 7. INFORMASI KELAS & DOSEN ---
@router.get("/admin/course-info")
@router.get("/attendance/course-info")
def get_course_info(db: Session = Depends(get_db)):
    """Mengambil informasi nama dosen, NIP, kontak WA, dan jadwal kelas."""
    course = db.query(models.CourseInfo).first()
    if not course:
        course = models.CourseInfo()
        db.add(course)
        db.commit()
        db.refresh(course)
    return {"info": course}
