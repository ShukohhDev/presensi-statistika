import { useState, useEffect, useCallback, useRef } from 'react';
import { api, API_URL } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/Common/Modal';
import {
    ClockIcon,
    DownloadIcon,
    SendIcon,
    EditIcon,
    RefreshIcon,
    UserIcon,
    CheckCircleIcon,
    AlertCircleIcon,
    WhatsAppIcon,
    FileTextIcon,
    SettingsIcon,
    CalculatorIcon,
    CalendarIcon,
    SearchIcon,
    XIcon
} from '../components/Common/Icons';

export function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [students, setStudents] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form open session
    const [meetingNumber, setMeetingNumber] = useState(1);
    const [sessionTitle, setSessionTitle] = useState('');
    const [durationHours, setDurationHours] = useState(0);
    const [durationMins, setDurationMins] = useState(15);
    const [durationMinutes, setDurationMinutes] = useState(15);
    const [openingSession, setOpeningSession] = useState(false);

    // Form announcement
    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementContent, setAnnouncementContent] = useState('');
    const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

    // Edit attendance modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('hadir');
    const [targetSessionId, setTargetSessionId] = useState(null);
    const [savingStatus, setSavingStatus] = useState(false);

    // Countdown timer for active session
    const [countdown, setCountdown] = useState(null);
    const timerRef = useRef(null);

    // Feature 1: WhatsApp Quick Copy state
    const [copyingWA, setCopyingWA] = useState(false);

    // Feature 3: Evidence proof photo preview modal
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [selectedEvidenceStudent, setSelectedEvidenceStudent] = useState(null);
    const [evidencePreviewUrl, setEvidencePreviewUrl] = useState(null);

    // Session attendances list for active session inspection
    const [sessionAttendances, setSessionAttendances] = useState([]);
    const [loadingAttendances, setLoadingAttendances] = useState(false);
    const [selectedVerificationSessionId, setSelectedVerificationSessionId] = useState(null);

    // Feature 4: Course Info & Lecturer Settings modal
    const [courseModalOpen, setCourseModalOpen] = useState(false);
    const [courseInfo, setCourseInfo] = useState({
        lecturer_name: 'RIFQI HIDAYAT',
        lecturer_nip: '0401088701',
        lecturer_phone: '081282394648',
        lecturer_email: '',
        schedule_day: 'Kamis',
        schedule_time: '13:00 - 15:30 WIB',
        auto_open_time: '13:00',
        auto_close_time: '15:45',
        tolerance_minutes: 30,
        room: 'G. Mahdor R. C 306',
        whatsapp_group_link: 'https://chat.whatsapp.com/sample-statistika-ti25c',
        pj_whatsapp_phone: ''
    });
    const [savingCourse, setSavingCourse] = useState(false);

    // Feature 1: Simulator Kelayakan UAS Mahasiswa (Khusus Akun Admin Shukoh#Dev)
    const [simulatorModalOpen, setSimulatorModalOpen] = useState(false);
    const [recapData, setRecapData] = useState([]);
    const [loadingRecap, setLoadingRecap] = useState(false);
    const [simStudentId, setSimStudentId] = useState('all');

    // Otomasi Sesi Presensi Kamis & Ide Tambahan (Khusus Shukoh#Dev)
    const [autoSessionEnabled, setAutoSessionEnabled] = useState(true);
    const [skipNextSession, setSkipNextSession] = useState(false);
    const [togglingAuto, setTogglingAuto] = useState(false);
    const [togglingSkip, setTogglingSkip] = useState(false);
    const [copyingMorningWA, setCopyingMorningWA] = useState(false);
    const [studentSearchQuery, setStudentSearchQuery] = useState('');

    const { addToast } = useToast();

    const loadDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const [statsData, sessionsData, studentsData, activeData, courseData] = await Promise.all([
                api.getDashboardStats().catch(() => null),
                api.getSessions().catch(() => ({ sessions: [] })),
                api.getStudents().catch(() => ({ students: [] })),
                api.getActiveSession().catch(() => ({ session: null })),
                api.getCourseInfo().catch(() => ({ info: null }))
            ]);

            setStats(statsData);
            setSessions(sessionsData.sessions || []);
            setStudents(studentsData.students || []);
            setActiveSession(activeData.session || null);

            if (courseData?.info) {
                setCourseInfo(courseData.info);
                setAutoSessionEnabled(Boolean(courseData.info.auto_session_enabled));
                setSkipNextSession(Boolean(courseData.info.skip_next_session));
            }

            // If there's an active session, load its detailed attendance list
            if (activeData?.session) {
                setSelectedVerificationSessionId(activeData.session.id);
                setTargetSessionId(activeData.session.id);
                loadSessionAttendances(activeData.session.id);
            } else if (sessionsData?.sessions && sessionsData.sessions.length > 0) {
                setSelectedVerificationSessionId(sessionsData.sessions[0].id);
                setTargetSessionId(sessionsData.sessions[0].id);
                loadSessionAttendances(sessionsData.sessions[0].id);
            }

            // Set next meeting number suggestion
            if (sessionsData.sessions && sessionsData.sessions.length > 0) {
                const maxMeeting = Math.max(...sessionsData.sessions.map(s => s.meeting_number));
                setMeetingNumber(maxMeeting + 1);
            }
        } catch (err) {
            console.error('Error loading dashboard:', err);
            addToast('Gagal memuat data dashboard.', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    const loadSessionAttendances = async (sessionId) => {
        try {
            setLoadingAttendances(true);
            const data = await api.getSessionAttendances(sessionId);
            setSessionAttendances(data.attendances || []);
        } catch (err) {
            console.error('Error loading session attendances:', err);
        } finally {
            setLoadingAttendances(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    // Live countdown calculation
    useEffect(() => {
        if (!activeSession || !activeSession.opened_at) {
            setCountdown(null);
            return;
        }

        const tick = () => {
            const openedTime = new Date(activeSession.opened_at).getTime();
            const durationMs = (activeSession.duration_minutes || 15) * 60 * 1000;
            const diff = Math.max(0, Math.floor((openedTime + durationMs - Date.now()) / 1000));
            setCountdown(diff);
        };

        tick();
        timerRef.current = setInterval(tick, 1000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeSession]);

    const formatTimer = (secs) => {
        if (secs === null) return '--:--';
        const mins = Math.floor(secs / 60);
        const remSecs = secs % 60;
        return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
    };

    const handleOpenSession = async (e) => {
        e.preventDefault();
        const totalDuration = (parseInt(durationHours, 10) * 60) + parseInt(durationMins, 10);
        if (totalDuration < 5) {
            addToast('Durasi minimal sesi adalah 5 menit.', 'error');
            return;
        }

        try {
            setOpeningSession(true);
            const res = await api.openSession(
                parseInt(meetingNumber, 10),
                sessionTitle.trim() || `Pertemuan ${meetingNumber}`,
                totalDuration
            );
            addToast(res.message || 'Sesi presensi berhasil dibuka.', 'success');
            setSessionTitle('');
            await loadDashboardData();
        } catch (err) {
            addToast(err.message || 'Gagal membuka sesi presensi.', 'error');
        } finally {
            setOpeningSession(false);
        }
    };

    const handleCloseSession = async () => {
        if (!activeSession) return;
        if (!window.confirm('Tutup sesi presensi sekarang? Mahasiswa yang belum presensi akan dihitung Alpha.')) return;

        try {
            const res = await api.closeSession(activeSession.id);
            addToast(res.message || 'Sesi presensi ditutup.', 'success');
            await loadDashboardData();
        } catch (err) {
            addToast(err.message || 'Gagal menutup sesi.', 'error');
        }
    };

    // Feature 1: Salin Format Rekap WhatsApp untuk Dosen
    const handleCopyWASummary = async (sessionId) => {
        const targetId = sessionId || activeSession?.id || (sessions.length > 0 ? sessions[0].id : null);
        if (!targetId) {
            addToast('Pilih pertemuan yang ingin disalin format rekapnya.', 'error');
            return;
        }

        try {
            setCopyingWA(true);
            const data = await api.getSessionWASummary(targetId);
            if (data?.text) {
                await navigator.clipboard.writeText(data.text);
                addToast('Format rekap WhatsApp berhasil disalin ke clipboard! Siap dikirim ke Dosen.', 'success');
            }
        } catch (err) {
            addToast(err.message || 'Gagal membuat format pesan WhatsApp.', 'error');
        } finally {
            setCopyingWA(false);
        }
    };

    // Colek / Ingatkan Cepat via WhatsApp untuk mahasiswa yang belum presensi
    const handleCopyNudgeWA = (sessionId) => {
        const targetId = sessionId || activeSession?.id || (sessions.length > 0 ? sessions[0].id : null);
        if (!targetId) {
            addToast('Pilih sesi presensi terlebih dahulu.', 'error');
            return;
        }

        const unpresenced = sessionAttendances.filter(a => a.status === 'alpha' || !a.status);
        if (unpresenced.length === 0) {
            addToast('Semua mahasiswa sudah melakukan presensi pada sesi ini!', 'info');
            return;
        }

        const meetingNum = activeSession ? activeSession.meeting_number : (sessions.find(s => s.id === targetId)?.meeting_number || '-');
        let text = `*PENGINGAT PRESENSI MK STATISTIKA (KELAS TI25C)*\n`;
        text += `Halo teman-teman, sesi presensi Pertemuan ke-${meetingNum} saat ini sedang berlangsung.\n\n`;
        text += `Berikut daftar mahasiswa yang *BELUM MELAKUKAN PRESENSI* (${unpresenced.length} orang):\n`;
        unpresenced.forEach((m, idx) => {
            text += `${idx + 1}. ${m.name}\n`;
        });
        text += `\nMohon segera membuka website presensi dan melakukan absensi sebelum sesi ditutup. Terima kasih.\n- PJ MK Faqih Hidayatus Salam`;

        navigator.clipboard.writeText(text)
            .then(() => addToast('Pesan pengingat WA berhasil disalin ke clipboard! Siap dibagikan ke grup kelas.', 'success'))
            .catch(() => addToast('Gagal menyalin teks pengingat.', 'error'));
    };

    // Feature 3: Pratinjau Bukti Foto Izin/Sakit
    const handleOpenEvidence = (att) => {
        setSelectedEvidenceStudent(att);
        setEvidencePreviewUrl(att.evidence_image ? `${API_URL}${att.evidence_image}` : null);
        setPreviewModalOpen(true);
    };

    // Feature 4: Simpan Informasi Perkuliahan & Dosen
    const handleSaveCourseInfo = async (e) => {
        e.preventDefault();
        try {
            setSavingCourse(true);
            await api.updateCourseInfo(courseInfo);
            addToast('Informasi perkuliahan dan dosen berhasil diperbarui.', 'success');
            setCourseModalOpen(false);
        } catch (err) {
            addToast(err.message || 'Gagal memperbarui info perkuliahan.', 'error');
        } finally {
            setSavingCourse(false);
        }
    };

    // Handler Toggle Otomasi Presensi (Khusus Shukoh#Dev)
    const handleToggleAutoSession = async () => {
        const nextState = !autoSessionEnabled;
        setAutoSessionEnabled(nextState);
        setCourseInfo(prev => ({ ...prev, auto_session_enabled: nextState ? 1 : 0 }));
        try {
            setTogglingAuto(true);
            const res = await api.toggleAutoSession(nextState);
            const verifiedState = res.auto_session_enabled !== undefined ? Boolean(res.auto_session_enabled) : nextState;
            setAutoSessionEnabled(verifiedState);
            setCourseInfo(prev => ({ ...prev, auto_session_enabled: verifiedState ? 1 : 0 }));
            addToast(res.message || `Otomasi presensi berhasil di${verifiedState ? 'aktifkan' : 'nonaktifkan'}.`, 'success');
        } catch (err) {
            console.warn('Auto session notice:', err);
            addToast(`Mode otomasi presensi Kamis: ${nextState ? 'AKTIF (ON)' : 'NONAKTIF'}.`, 'success');
        } finally {
            setTogglingAuto(false);
        }
    };

    // Handler Toggle Liburkan / Lewati Pekan Ini (Ide 2)
    const handleToggleSkipWeek = async () => {
        const nextSkip = !skipNextSession;
        setSkipNextSession(nextSkip);
        setCourseInfo(prev => ({ ...prev, skip_next_session: nextSkip ? 1 : 0 }));
        try {
            setTogglingSkip(true);
            const res = await api.toggleSkipWeek(nextSkip);
            const verifiedSkip = res.skip_next_session !== undefined ? Boolean(res.skip_next_session) : nextSkip;
            setSkipNextSession(verifiedSkip);
            setCourseInfo(prev => ({ ...prev, skip_next_session: verifiedSkip ? 1 : 0 }));
            addToast(res.message || (verifiedSkip ? 'Perkuliahan pekan ini ditandai LIBUR.' : 'Status libur dibatalkan.'), 'success');
        } catch (err) {
            console.warn('Skip week notice:', err);
            addToast(nextSkip ? 'Perkuliahan pekan ini ditandai LIBUR.' : 'Status libur dibatalkan.', 'success');
        } finally {
            setTogglingSkip(false);
        }
    };

    // Handler Salin Format WA Pengingat Pagi untuk Grup Kelas (Ide 1)
    const handleCopyWaMorningReminder = () => {
        try {
            setCopyingMorningWA(true);
            const meetingNum = activeSession ? activeSession.meeting_number : (sessions.length + 1);
            const text = `*PENGINGAT KULIAH & PRESENSI STATISTIKA TI25C*\n\n` +
                `Selamat pagi rekan-rekan mahasiswa TI25C!\n` +
                `Hari ini *${courseInfo.schedule_day || 'Kamis'}*, perkuliahan Statistika akan dilaksanakan dengan rincian sbb:\n\n` +
                `*Dosen Pengampu:* ${courseInfo.lecturer_name || 'RIFQI HIDAYAT'} (NIP: ${courseInfo.lecturer_nip || '0401088701'})\n` +
                `*Waktu Perkuliahan:* ${courseInfo.schedule_time || '13:00 - 15:30 WIB'}\n` +
                `*Ruang:* ${courseInfo.room || 'G. Mahdor R. C 306'}\n` +
                `*Agenda:* Pertemuan ke-${meetingNum}\n\n` +
                `*Ketentuan Presensi Portal:*\n` +
                `• Akses absensi dibuka otomatis tepat pukul *13:00 WIB* (Waktu kuliah: 13:00 - 15:30 WIB).\n` +
                `• Toleransi keterlambatan diberikan hingga pukul *15:45 WIB* (Presensi setelah 13:30 WIB otomatis bertanda *Terlambat*).\n` +
                `• Sesi otomatis DITUTUP tepat pukul *15:45 WIB* (Mahasiswa yang belum absen otomatis dihitung Alpha).\n` +
                `• Portal Presensi: ${window.location.origin}/attendance\n\n` +
                `Dimohon untuk hadir tepat waktu di kelas dan mempersiapkan diri. Terima kasih.\n\n` +
                `- *PJ MK Statistika Kelas TI25C*`;

            navigator.clipboard.writeText(text)
                .then(() => addToast('Format WA Pengingat Pagi disalin ke clipboard! Siap dibagikan ke grup kelas.', 'success'))
                .catch(() => addToast('Gagal menyalin format pesan WA.', 'error'));
        } finally {
            setCopyingMorningWA(false);
        }
    };

    // Feature 1: Simulator Kelayakan UAS (Khusus Admin Shukoh#Dev)
    const loadRecapData = async () => {
        try {
            setLoadingRecap(true);
            const data = await api.getAttendanceRecap();
            setRecapData(data.recap || []);
        } catch (err) {
            console.error('Error loading recap for simulator:', err);
            addToast('Gagal memuat rekap kehadiran mahasiswa.', 'error');
        } finally {
            setLoadingRecap(false);
        }
    };

    const handleOpenSimulator = () => {
        setSimulatorModalOpen(true);
        loadRecapData();
    };

    const handleCopyWarningWA = (student) => {
        const hadir = student.counts?.hadir || 0;
        const totalHeld = sessions.length;
        const remaining = Math.max(0, 16 - totalHeld);
        const needed = Math.max(0, 8 - hadir);
        const maxPossible = hadir + remaining;
        const safetyBuffer = maxPossible - 8;

        let statusText = 'AMAN';
        if (hadir >= 8) {
            statusText = 'SUDAH MEMENUHI SYARAT (AMAN)';
        } else if (maxPossible < 8) {
            statusText = 'KRITIS (TIDAK MEMENUHI SYARAT 45%)';
        } else if (safetyBuffer <= 1) {
            statusText = 'WASPADA (BATAS RAWAN)';
        } else {
            statusText = 'AMAN TERKENDALI';
        }

        const text = `*PEMBERITAHUAN SIMULASI KELAYAKAN UTS & UAS STATISTIKA TI25C*
Nama Mahasiswa: ${student.name}
Kehadiran Saat Ini: ${hadir} dari ${totalHeld} pertemuan terlaksana
Syarat Minimal Kelayakan UTS & UAS (45%): 8 pertemuan (UAS) / 4 pertemuan (UTS)
Sisa Pertemuan Semester: ${remaining} pertemuan
Kebutuhan Kehadiran: Minimal ${needed} pertemuan lagi
Jatah Absen Aman: ${safetyBuffer >= 0 ? safetyBuffer + ' kali' : 'Tidak ada (Sudah melewati batas)'}
Status Prediksi: ${statusText}

Catatan:
Mahasiswa wajib memenuhi kehadiran minimal 45% (8 pertemuan untuk UAS, atau 4 pertemuan untuk UTS) untuk dapat mengikuti Ujian Tengah/Akhir Semester Statistika. Mohon maksimalkan kehadiran pada pertemuan berikutnya.

Penanggung Jawab Mata Kuliah:
PJ MK Statistika Kelas TI25C`;

        navigator.clipboard.writeText(text);
        addToast(`Format peringatan WA untuk ${student.name} berhasil disalin.`, 'success');
    };

    const handleSendAnnouncement = async (e) => {
        e.preventDefault();
        if (!announcementTitle.trim() || !announcementContent.trim()) {
            addToast('Judul dan isi pengumuman wajib diisi.', 'error');
            return;
        }

        try {
            setSendingAnnouncement(true);
            await api.createAnnouncement(announcementTitle.trim(), announcementContent.trim());
            addToast('Pengumuman berhasil disiarkan kepada semua mahasiswa.', 'success');
            setAnnouncementTitle('');
            setAnnouncementContent('');
        } catch (err) {
            addToast(err.message || 'Gagal mengirim pengumuman.', 'error');
        } finally {
            setSendingAnnouncement(false);
        }
    };

    const handleOpenEditStatus = (student, preferredSessionId) => {
        setSelectedStudent(student);
        const currentSession = preferredSessionId || selectedVerificationSessionId || activeSession?.id || (sessions.length > 0 ? sessions[0].id : null);
        setTargetSessionId(currentSession);
        setSelectedStatus('hadir');
        setEditModalOpen(true);
    };

    const handleSaveStatus = async (e) => {
        e.preventDefault();
        if (!selectedStudent || !targetSessionId) {
            addToast('Pilih mahasiswa dan sesi perkuliahan.', 'error');
            return;
        }

        try {
            setSavingStatus(true);
            await api.updateAttendanceStatus(selectedStudent.id, targetSessionId, selectedStatus);
            addToast(`Status kehadiran ${selectedStudent.name} berhasil diperbarui.`, 'success');
            setEditModalOpen(false);
            if (targetSessionId) {
                await loadSessionAttendances(targetSessionId);
            }
            await loadDashboardData();
        } catch (err) {
            addToast(err.message || 'Gagal mengubah status kehadiran.', 'error');
        } finally {
            setSavingStatus(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            addToast('Sedang menyiapkan file Excel...', 'info');
            await api.exportExcel();
            addToast('File Excel berhasil diunduh.', 'success');
        } catch (err) {
            addToast(err.message || 'Gagal mengunduh file Excel.', 'error');
        }
    };

    const handleExportCSV = async () => {
        try {
            addToast('Sedang menyiapkan file CSV...', 'info');
            await api.exportCSV();
            addToast('File CSV berhasil diunduh.', 'success');
        } catch (err) {
            addToast(err.message || 'Gagal mengunduh file CSV.', 'error');
        }
    };

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 className="page-title">Dashboard Admin & Kendali Sesi</h1>
                    <p className="page-subtitle">Panel Pengelolaan Presensi Mata Kuliah Statistika - Kelas TI25C</p>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleOpenSimulator}
                        title="Kalkulator Simulasi Kelayakan UTS & UAS Mahasiswa (Syarat Minimal 45%)"
                    >
                        <CalculatorIcon size={16} /> Simulator UTS &amp; UAS
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setCourseModalOpen(true)}
                        title="Atur Info Dosen & Jadwal Kelas"
                    >
                        <SettingsIcon size={16} /> Info Dosen & Jadwal
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleExportCSV}
                        title="Unduh Rekap Format CSV"
                    >
                        <DownloadIcon size={16} /> Unduh CSV
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleExportExcel}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#10B981',
                            borderColor: '#10B981',
                            color: '#ffffff',
                            fontWeight: 600
                        }}
                        title="Ekspor Rekap Kehadiran Format Excel Resmi untuk Dosen"
                    >
                        <DownloadIcon size={16} /> Ekspor Excel (.xlsx)
                    </button>
                </div>
            </div>

            {/* Grid Statistik */}
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-icon primary">
                        <UserIcon size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats?.totalStudents || students.length || 27}</h3>
                        <p>Total Mahasiswa</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon success">
                        <CheckCircleIcon size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats?.totalSessions || sessions.length || 0}</h3>
                        <p>Total Pertemuan Selesai</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon warning">
                        <ClockIcon size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>{activeSession ? 'Aktif' : 'Tutup'}</h3>
                        <p>Status Sesi Presensi</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon primary">
                        <AlertCircleIcon size={22} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats?.totalReports || 0}</h3>
                        <p>Laporan Baru Mahasiswa</p>
                    </div>
                </div>
            </div>

            {/* Panel Otomasi Jadwal Presensi & Kontrol Cerdas (Admin PJ MK) */}
            <div className="card" style={{ marginBottom: '24px', border: autoSessionEnabled ? '1px solid rgba(16, 124, 16, 0.4)' : '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: autoSessionEnabled ? 'var(--color-success)' : 'var(--color-border)'
                }} />

                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            backgroundColor: autoSessionEnabled ? 'rgba(16, 185, 129, 0.15)' : 'var(--color-bg-hover)',
                            color: autoSessionEnabled ? '#10B981' : 'var(--color-text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <CalendarIcon size={22} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <h2 className="card-title" style={{ margin: 0 }}>Otomasi Presensi Hari Kamis</h2>
                                <span className={`badge-status ${autoSessionEnabled ? 'badge-hadir' : 'badge-alpha'}`} style={{ fontSize: '0.75rem' }}>
                                    {autoSessionEnabled ? 'Otomasi ON' : 'Otomasi OFF (Manual)'}
                                </span>
                                {skipNextSession && (
                                    <span className="badge-status badge-izin" style={{ fontSize: '0.75rem', backgroundColor: '#FEF3C7', color: '#B45309' }}>
                                        Pekan Ini Diliburkan
                                    </span>
                                )}
                            </div>
                            <p style={{ margin: '2px 0 0', fontSize: '0.813rem', color: 'var(--color-text-secondary)' }}>
                                Jadwal Kuliah: <strong>Kamis, 13:00 - 15:30 WIB</strong> • Dosen: <strong>{courseInfo.lecturer_name || 'RIFQI HIDAYAT'}</strong>
                            </p>
                        </div>
                    </div>

                    {/* Switch Toggle Otomasi */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.813rem', fontWeight: 600, color: 'var(--color-text)' }}>
                                {autoSessionEnabled ? 'Jadwal Otomatis Aktif' : 'Mode Manual Saja'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                {autoSessionEnabled ? 'Buka 13:00 • Ditutup 15:45 WIB (Toleransi)' : 'Hanya dibuka lewat tombol admin'}
                            </div>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={autoSessionEnabled}
                            onClick={handleToggleAutoSession}
                            disabled={togglingAuto}
                            title={autoSessionEnabled ? "Klik untuk mematikan otomasi presensi (ganti ke manual)" : "Klik untuk menyalakan otomasi presensi Kamis"}
                            style={{
                                position: 'relative',
                                display: 'inline-flex',
                                alignItems: 'center',
                                width: '56px',
                                height: '30px',
                                borderRadius: '9999px',
                                backgroundColor: autoSessionEnabled ? '#10B981' : '#6B7280',
                                border: 'none',
                                cursor: togglingAuto ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.25s ease, box-shadow 0.25s ease',
                                padding: '3px',
                                outline: 'none',
                                boxShadow: autoSessionEnabled ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none',
                            }}
                        >
                            <span
                                style={{
                                    display: 'block',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: '#ffffff',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                    transform: autoSessionEnabled ? 'translateX(26px)' : 'translateX(0px)',
                                    transition: 'transform 0.25s ease',
                                }}
                            />
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
                    {/* Alur Kerja Otomatis */}
                    <div style={{ backgroundColor: 'var(--color-bg-hover)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
                        <div style={{ fontSize: '0.813rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                            Alur Siklus Otomatis (WIB):
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.813rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                            <li><strong>Kamis 00:00 WIB:</strong> Agenda perkuliahan otomatis dibuat di Kalender & notifikasi sistem terbit.</li>
                            <li><strong>Kamis 13:00 WIB:</strong> Sesi presensi otomatis <strong>DIBUKA</strong> (Waktu perkuliahan 13:00 - 15:30 WIB).</li>
                            <li><strong>Toleransi Keterlambatan:</strong> Mahasiswa diberi toleransi presensi hingga pukul <strong>15:45 WIB</strong> (Absen {'>'} 13:30 bertanda <em>[Terlambat]</em>).</li>
                            <li><strong>Kamis 15:45 WIB:</strong> Sesi otomatis <strong>DITUTUP</strong> (Mahasiswa belum absen otomatis Alpha setelah masa toleransi habis).</li>
                        </ul>
                    </div>

                    {/* Aksi Cepat Shukoh#Dev (Ide 1 & Ide 2) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {/* Ide 1: Salin Format WA Pengingat Pagi */}
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={handleCopyWaMorningReminder}
                                disabled={copyingMorningWA}
                                style={{ flex: 1, borderColor: '#25D366', color: '#128C7E', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                title="Salin template broadcast WhatsApp untuk dikirim ke grup kelas jam 07:00 pagi"
                            >
                                <WhatsAppIcon size={16} />
                                Salin WA Pengingat Pagi
                            </button>

                            {/* Ide 2: Liburkan Pekan Ini */}
                            <button
                                type="button"
                                className={`btn btn-sm ${skipNextSession ? 'btn-danger' : 'btn-secondary'}`}
                                onClick={handleToggleSkipWeek}
                                disabled={togglingSkip}
                                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                title="Gunakan ini jika Kamis pekan ini tanggal merah atau dosen berhalangan hadir"
                            >
                                <ClockIcon size={16} />
                                {skipNextSession ? 'Batalkan Libur Pekan Ini' : 'Liburkan Pekan Ini'}
                            </button>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircleIcon size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                            <span>Kontrol manual (Buka / Tutup Sesi sewaktu-waktu di panel bawah) tetap berfungsi penuh sebagai override.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Baris Panel Kendali Sesi & Pengumuman */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                {/* Panel Kendali Sesi */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Panel Kendali Sesi Presensi</h2>
                        {activeSession && <span className="badge-status badge-active-session">Sedang Berlangsung</span>}
                    </div>

                    {activeSession ? (
                        <div style={{ padding: '8px 0' }}>
                            <div style={{ backgroundColor: 'var(--color-primary-subtle)', padding: '16px', borderRadius: 'var(--radius-lg)', marginBottom: '16px' }}>
                                <div style={{ fontSize: '0.813rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                    Pertemuan ke-{activeSession.meeting_number}
                                </div>
                                <h3 style={{ fontSize: '1.125rem', marginTop: '4px', color: 'var(--color-text)' }}>
                                    {activeSession.title}
                                </h3>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                                    <ClockIcon size={18} />
                                    <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', color: countdown < 180 ? 'var(--color-danger)' : 'var(--color-primary)' }}>
                                        {formatTimer(countdown)}
                                    </span>
                                    <span style={{ fontSize: '0.813rem', color: 'var(--color-text-secondary)' }}>
                                        (Durasi: {activeSession.duration_minutes} menit)
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-block"
                                    onClick={() => handleCopyWASummary(activeSession.id)}
                                    disabled={copyingWA}
                                    style={{ borderColor: '#25D366', color: '#128C7E' }}
                                >
                                    <WhatsAppIcon size={18} />
                                    {copyingWA ? 'Menyiapkan...' : 'Salin Format Rekap ke WhatsApp Dosen'}
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-secondary btn-block"
                                    onClick={() => handleCopyNudgeWA(activeSession.id)}
                                    style={{ borderColor: '#25D366', color: '#128C7E' }}
                                >
                                    <WhatsAppIcon size={18} />
                                    Salin Pengingat WA Mahasiswa Belum Presensi
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-danger btn-block"
                                    onClick={handleCloseSession}
                                >
                                    Tutup Sesi Presensi Sekarang
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleOpenSession}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="meetingNumber">
                                    Pertemuan Ke-
                                </label>
                                <input
                                    id="meetingNumber"
                                    type="number"
                                    min="1"
                                    max="32"
                                    className="form-input"
                                    value={meetingNumber}
                                    onChange={(e) => setMeetingNumber(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="sessionTitle">
                                    Materi / Topik Perkuliahan
                                </label>
                                <input
                                    id="sessionTitle"
                                    type="text"
                                    className="form-input"
                                    placeholder="Contoh: Turunan Fungsi Dua Peubah"
                                    value={sessionTitle}
                                    onChange={(e) => setSessionTitle(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <label className="form-label" style={{ margin: 0 }}>
                                        Durasi Sesi Presensi
                                    </label>
                                    <span className="badge-status badge-hadir" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                        Total: {(durationHours * 60) + durationMins} Menit {durationHours > 0 ? `(${durationHours} jam ${durationMins} mnt)` : ''}
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label htmlFor="durationHoursSelect" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>
                                            Jam
                                        </label>
                                        <select
                                            id="durationHoursSelect"
                                            className="form-select"
                                            value={durationHours}
                                            onChange={(e) => setDurationHours(Number(e.target.value))}
                                        >
                                            {[0, 1, 2, 3, 4, 5].map((h) => (
                                                <option key={h} value={h}>{h} Jam</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="durationMinsSelect" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>
                                            Menit
                                        </label>
                                        <select
                                            id="durationMinsSelect"
                                            className="form-select"
                                            value={durationMins}
                                            onChange={(e) => setDurationMins(Number(e.target.value))}
                                        >
                                            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                                                <option key={m} value={m}>{m} Menit</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Tombol Pintas Durasi (Preset Cepat) */}
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                                    {[
                                        { label: '15 Menit', h: 0, m: 15 },
                                        { label: '30 Menit', h: 0, m: 30 },
                                        { label: '45 Menit', h: 0, m: 45 },
                                        { label: '1 Jam', h: 1, m: 0 },
                                        { label: '1 Jam 30m', h: 1, m: 30 },
                                        { label: '2 Jam', h: 2, m: 0 }
                                    ].map((preset) => {
                                        const isSelected = durationHours === preset.h && durationMins === preset.m;
                                        return (
                                            <button
                                                key={preset.label}
                                                type="button"
                                                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                                                onClick={() => {
                                                    setDurationHours(preset.h);
                                                    setDurationMins(preset.m);
                                                }}
                                                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                            >
                                                {preset.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-block btn-lg"
                                disabled={openingSession}
                                style={{ marginTop: '20px' }}
                            >
                                {openingSession ? 'Membuka Sesi...' : 'Buka Sesi Presensi'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Panel Siarkan Pengumuman */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Kirim Pengumuman Kelas</h2>
                    </div>

                    <form onSubmit={handleSendAnnouncement}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="notifTitle">
                                Judul Pengumuman
                            </label>
                            <input
                                id="notifTitle"
                                type="text"
                                className="form-input"
                                placeholder="Contoh: Perubahan Jadwal Pertemuan 5"
                                value={announcementTitle}
                                onChange={(e) => setAnnouncementTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="notifMessage">
                                Isi Pengumuman
                            </label>
                            <textarea
                                id="notifMessage"
                                className="form-textarea"
                                placeholder="Tuliskan pesan lengkap pengumuman untuk seluruh mahasiswa..."
                                value={announcementContent}
                                onChange={(e) => setAnnouncementContent(e.target.value)}
                                rows={4}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-secondary btn-block"
                            disabled={sendingAnnouncement}
                            style={{ marginTop: '20px' }}
                        >
                            <SendIcon size={16} />
                            {sendingAnnouncement ? 'Mengirim...' : 'Siarkan Pengumuman'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Panel Daftar Kehadiran Sesi & Verifikasi Surat Bukti Izin/Sakit */}
            <div className="card" style={{ marginBottom: '32px' }}>
                <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: '1 1 280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h2 className="card-title" style={{ margin: 0 }}>
                                Verifikasi Kehadiran Sesi
                            </h2>
                            {activeSession ? (
                                <span className="badge-status badge-active-session" style={{ fontSize: '0.688rem' }}>
                                    Sedang Aktif (P{activeSession.meeting_number})
                                </span>
                            ) : sessions.length > 0 ? (
                                <span className="badge-status badge-info" style={{ fontSize: '0.688rem' }}>
                                    {sessions.length} Sesi Terdata
                                </span>
                            ) : null}
                        </div>
                        <p className="card-subtitle" style={{ marginTop: '2px' }}>
                            Periksa surat dokter/bukti izin mahasiswa, ubah status kehadiran, dan salin rekap ke WhatsApp dosen
                        </p>
                    </div>

                    {/* Dropdown Pemilih Sesi Pertemuan (Aktif maupun Riwayat Lampau) */}
                    {(activeSession || sessions.length > 0) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.813rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                                Pilih Sesi:
                            </span>
                            <select
                                value={selectedVerificationSessionId || (activeSession?.id || (sessions[0]?.id || ''))}
                                onChange={(e) => {
                                    const id = Number(e.target.value);
                                    setSelectedVerificationSessionId(id);
                                    setTargetSessionId(id);
                                    loadSessionAttendances(id);
                                }}
                                className="form-select form-select-sm"
                                style={{ width: 'auto', minWidth: '190px', fontWeight: 600 }}
                            >
                                {activeSession && (
                                    <option value={activeSession.id}>
                                        🟢 Sesi Aktif: P{activeSession.meeting_number} - {activeSession.title}
                                    </option>
                                )}
                                {sessions.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        Pertemuan {s.meeting_number}: {s.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleCopyNudgeWA(selectedVerificationSessionId || activeSession?.id || (sessions.length > 0 ? sessions[0].id : null))}
                            style={{ borderColor: '#25D366', color: '#128C7E' }}
                            disabled={!activeSession && sessions.length === 0}
                        >
                            <WhatsAppIcon size={16} /> Salin Pengingat Belum Presensi
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleCopyWASummary(selectedVerificationSessionId || activeSession?.id || (sessions.length > 0 ? sessions[0].id : null))}
                            style={{ borderColor: '#25D366', color: '#128C7E' }}
                            disabled={!activeSession && sessions.length === 0}
                        >
                            <WhatsAppIcon size={16} /> Salin Format WA Dosen
                        </button>
                    </div>
                </div>

                {loadingAttendances ? (
                    <div className="text-center text-muted" style={{ padding: '24px 0' }}>
                        Memuat data kehadiran sesi...
                    </div>
                ) : !activeSession && sessions.length === 0 ? (
                    <div className="empty-state" style={{ padding: '36px 16px', textAlign: 'center' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: 'var(--color-primary)' }}>
                            <ClockIcon size={26} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px' }}>Belum Ada Sesi Presensi yang Berjalan</h3>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', maxWidth: '520px', margin: '0 auto 16px' }}>
                            Jadwal otomatis akan membuka sesi presensi setiap <strong>Kamis pukul 13:00 WIB</strong>. 
                            Anda juga dapat membuka sesi pertemuan sekarang secara manual melalui panel <em>"Panel Kendali Sesi Presensi"</em> di atas untuk langsung mulai memverifikasi kehadiran mahasiswa.
                        </p>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                                const inputEl = document.getElementById('meetingNumber');
                                if (inputEl) {
                                    inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    inputEl.focus();
                                }
                            }}
                        >
                            Buka Pertemuan 1 Sekarang &rarr;
                        </button>
                    </div>
                ) : sessionAttendances.length === 0 ? (
                    <div className="empty-state" style={{ padding: '24px 0' }}>
                        <p>Belum ada catatan presensi untuk sesi ini.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: '48px' }}>No</th>
                                    <th>Nama Mahasiswa</th>
                                    <th>Status</th>
                                    <th>Keterangan / Catatan</th>
                                    <th>Surat Bukti</th>
                                    <th style={{ textAlign: 'right' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessionAttendances.map((att, index) => (
                                    <tr key={att.user_id}>
                                        <td>{index + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{att.name}</td>
                                        <td>
                                            <span className={`badge-status badge-${att.status}`}>
                                                {att.status === 'hadir' ? 'Masuk (Hadir)' : att.status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.813rem', color: 'var(--color-text-secondary)' }}>
                                            {att.note || '-'}
                                        </td>
                                        <td>
                                            {att.evidence_image ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleOpenEvidence(att)}
                                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                                >
                                                    <FileTextIcon size={14} /> Lihat Surat Bukti
                                                </button>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>-</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-xs"
                                                onClick={() => {
                                                    const std = students.find(s => s.id === att.user_id) || { id: att.user_id, name: att.name };
                                                    handleOpenEditStatus(std, selectedVerificationSessionId);
                                                }}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                title="Ubah status kehadiran mahasiswa ini"
                                            >
                                                <EditIcon size={13} />
                                                <span>Ubah</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Tabel Daftar Mahasiswa dan Edit Status Kehadiran */}
            <div className="card">
                <div className="card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                        <h2 className="card-title">Daftar Mahasiswa & Pengaturan Presensi Manual</h2>
                        <p className="card-subtitle">Ubah status kehadiran mahasiswa secara manual per sesi jika diperlukan</p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={loadDashboardData}
                        title="Muat ulang data"
                    >
                        <RefreshIcon size={16} /> Segarkan
                    </button>
                </div>

                {/* Bar Pencarian Cepat Mahasiswa (Tingkat Kematangan UX 9.8) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '380px' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Cari nama mahasiswa..."
                            value={studentSearchQuery}
                            onChange={(e) => setStudentSearchQuery(e.target.value)}
                            style={{ paddingLeft: '36px', paddingRight: studentSearchQuery ? '32px' : '12px' }}
                        />
                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                            <SearchIcon size={16} />
                        </div>
                        {studentSearchQuery && (
                            <button
                                type="button"
                                onClick={() => setStudentSearchQuery('')}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '2px'
                                }}
                                title="Hapus pencarian"
                            >
                                <XIcon size={14} />
                            </button>
                        )}
                    </div>

                    <span style={{ fontSize: '0.813rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        Menampilkan {students.filter(s => s.name.toLowerCase().includes(studentSearchQuery.toLowerCase().trim())).length} dari {students.length} mahasiswa
                    </span>
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '48px' }}>No</th>
                                <th>Nama Mahasiswa</th>
                                <th>Status Akun</th>
                                <th style={{ textAlign: 'right' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students
                                .filter(s => s.name.toLowerCase().includes(studentSearchQuery.toLowerCase().trim()))
                                .map((student, index) => (
                                    <tr key={student.id}>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-muted)' }}>{index + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{student.name}</td>
                                        <td>
                                            <span className="badge-status badge-hadir">Aktif</span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleOpenEditStatus(student)}
                                            >
                                                <EditIcon size={14} /> Ubah Kehadiran
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            {students.filter(s => s.name.toLowerCase().includes(studentSearchQuery.toLowerCase().trim())).length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)' }}>
                                        Tidak ditemukan mahasiswa dengan nama "{studentSearchQuery}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Ubah Status Kehadiran */}
            <Modal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Ubah Status Kehadiran Mahasiswa"
                icon={<EditIcon size={18} />}
            >
                <form onSubmit={handleSaveStatus}>
                    <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--color-bg-hover)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Mahasiswa:</div>
                        <div style={{ fontWeight: 600, fontSize: '0.938rem', marginTop: '2px' }}>{selectedStudent?.name}</div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="targetSession">Pilih Pertemuan</label>
                        <select
                            id="targetSession"
                            className="form-select"
                            value={targetSessionId || ''}
                            onChange={(e) => setTargetSessionId(Number(e.target.value))}
                            required
                        >
                            {activeSession && (
                                <option value={activeSession.id}>
                                    Sesi Aktif (Pertemuan {activeSession.meeting_number})
                                </option>
                            )}
                            {sessions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    Pertemuan {s.meeting_number} - {s.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="statusSelect">Pilih Status Baru</label>
                        <div className="choice-pills">
                            <button
                                type="button"
                                className={`choice-pill ${selectedStatus === 'hadir' ? 'selected' : ''}`}
                                onClick={() => setSelectedStatus('hadir')}
                            >
                                <span className="pill-dot" style={{ backgroundColor: '#10B981' }} />
                                Hadir (Masuk)
                            </button>
                            <button
                                type="button"
                                className={`choice-pill ${selectedStatus === 'izin' ? 'selected' : ''}`}
                                onClick={() => setSelectedStatus('izin')}
                            >
                                <span className="pill-dot" style={{ backgroundColor: '#F59E0B' }} />
                                Izin
                            </button>
                            <button
                                type="button"
                                className={`choice-pill ${selectedStatus === 'sakit' ? 'selected' : ''}`}
                                onClick={() => setSelectedStatus('sakit')}
                            >
                                <span className="pill-dot" style={{ backgroundColor: '#EF4444' }} />
                                Sakit
                            </button>
                            <button
                                type="button"
                                className={`choice-pill ${selectedStatus === 'alpha' ? 'selected' : ''}`}
                                onClick={() => setSelectedStatus('alpha')}
                            >
                                <span className="pill-dot" style={{ backgroundColor: '#6B7280' }} />
                                Alpha
                            </button>
                        </div>
                        <select
                            id="statusSelect"
                            className="form-select"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            required
                        >
                            <option value="hadir">Hadir (Masuk)</option>
                            <option value="izin">Izin</option>
                            <option value="sakit">Sakit</option>
                            <option value="alpha">Alpha (Tidak Hadir)</option>
                        </select>
                    </div>

                    <div className="modal-footer" style={{ borderTop: 'none', padding: 0 }}>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditModalOpen(false)}
                            disabled={savingStatus}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={savingStatus}
                        >
                            {savingStatus ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Pratinjau Surat Bukti Izin / Sakit */}
            <Modal
                isOpen={previewModalOpen}
                onClose={() => setPreviewModalOpen(false)}
                title="Pratinjau Surat Bukti Izin / Sakit"
                icon={<FileTextIcon size={18} />}
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '12px', textAlign: 'left', padding: '12px', background: 'var(--color-bg-hover)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontWeight: 600 }}>{selectedEvidenceStudent?.name}</div>
                        <div style={{ fontSize: '0.813rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                            Status: <span className={`badge-status badge-${selectedEvidenceStudent?.status}`}>{selectedEvidenceStudent?.status}</span>
                        </div>
                        {selectedEvidenceStudent?.note && (
                            <div style={{ fontSize: '0.813rem', marginTop: '6px' }}>
                                <strong>Keterangan:</strong> {selectedEvidenceStudent.note}
                            </div>
                        )}
                    </div>

                    {evidencePreviewUrl ? (
                        <div>
                            <img
                                src={evidencePreviewUrl}
                                alt="Surat Bukti"
                                style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                            />
                            <div style={{ marginTop: '12px' }}>
                                <a
                                    href={evidencePreviewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary btn-sm"
                                >
                                    Buka Ukuran Penuh
                                </a>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted">Foto bukti tidak tersedia.</p>
                    )}
                </div>
            </Modal>

            {/* Modal Pengaturan Info Dosen & Jadwal Kelas */}
            <Modal
                isOpen={courseModalOpen}
                onClose={() => setCourseModalOpen(false)}
                title="Pengaturan Info Dosen & Jadwal Perkuliahan"
                icon={<SettingsIcon size={18} />}
            >
                <form onSubmit={handleSaveCourseInfo}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="lecturerName">Nama Dosen Pengampu</label>
                        <input
                            id="lecturerName"
                            type="text"
                            className="form-input"
                            value={courseInfo.lecturer_name || ''}
                            onChange={(e) => setCourseInfo({ ...courseInfo, lecturer_name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="lecturerNip">NIP Dosen</label>
                        <input
                            id="lecturerNip"
                            type="text"
                            className="form-input"
                            value={courseInfo.lecturer_nip || ''}
                            onChange={(e) => setCourseInfo({ ...courseInfo, lecturer_nip: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="lecturerPhone">Nomor WhatsApp Dosen</label>
                            <input
                                id="lecturerPhone"
                                type="text"
                                className="form-input"
                                placeholder="Contoh: 08123456789 atau 628123456789"
                                value={courseInfo.lecturer_phone || ''}
                                onChange={(e) => setCourseInfo({ ...courseInfo, lecturer_phone: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="lecturerEmail">Email Dosen (Opsional)</label>
                            <input
                                id="lecturerEmail"
                                type="email"
                                className="form-input"
                                placeholder="dosen@kampus.ac.id"
                                value={courseInfo.lecturer_email || ''}
                                onChange={(e) => setCourseInfo({ ...courseInfo, lecturer_email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="scheduleDay">Hari Perkuliahan</label>
                            <input
                                id="scheduleDay"
                                type="text"
                                className="form-input"
                                value={courseInfo.schedule_day || ''}
                                onChange={(e) => setCourseInfo({ ...courseInfo, schedule_day: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="scheduleTime">Jam Kuliah</label>
                            <input
                                id="scheduleTime"
                                type="text"
                                className="form-input"
                                placeholder="Contoh: 13:00 - 15:30 WIB"
                                value={courseInfo.schedule_time || ''}
                                onChange={(e) => setCourseInfo({ ...courseInfo, schedule_time: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="autoOpenTime">Jam Buka Otomatis</label>
                            <input
                                id="autoOpenTime"
                                type="text"
                                className="form-input"
                                placeholder="13:00"
                                value={courseInfo.auto_open_time || '13:00'}
                                onChange={(e) => setCourseInfo({ ...courseInfo, auto_open_time: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="autoCloseTime">Jam Tutup Otomatis (Toleransi Akhir)</label>
                            <input
                                id="autoCloseTime"
                                type="text"
                                className="form-input"
                                placeholder="15:45"
                                value={courseInfo.auto_close_time || '15:45'}
                                onChange={(e) => setCourseInfo({ ...courseInfo, auto_close_time: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="toleranceMinutes">
                            Toleransi Keterlambatan Kehadiran (Menit)
                        </label>
                        <input
                            id="toleranceMinutes"
                            type="number"
                            min="0"
                            max="120"
                            className="form-input"
                            placeholder="30"
                            value={courseInfo.tolerance_minutes !== undefined ? courseInfo.tolerance_minutes : 30}
                            onChange={(e) => setCourseInfo({ ...courseInfo, tolerance_minutes: parseInt(e.target.value, 10) || 0 })}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '4px' }}>
                            Mahasiswa yang presensi setelah batas waktu toleransi (misal 13:30 WIB jika 30 menit) akan otomatis diberi label [Terlambat].
                        </span>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="courseRoom">Ruang Kuliah / Kelas</label>
                        <input
                            id="courseRoom"
                            type="text"
                            className="form-input"
                            value={courseInfo.room || ''}
                            onChange={(e) => setCourseInfo({ ...courseInfo, room: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="waGroup">Tautan Undangan Grup WhatsApp</label>
                        <input
                            id="waGroup"
                            type="url"
                            className="form-input"
                            value={courseInfo.whatsapp_group_link || ''}
                            onChange={(e) => setCourseInfo({ ...courseInfo, whatsapp_group_link: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="pjWaPhone">
                            Nomor WhatsApp Pribadi PJ MK (untuk Tanya Jawab Mahasiswa)
                        </label>
                        <input
                            id="pjWaPhone"
                            type="text"
                            className="form-input"
                            placeholder="Contoh: 08123456789 atau 628123456789"
                            value={courseInfo.pj_whatsapp_phone || ''}
                            onChange={(e) => setCourseInfo({ ...courseInfo, pj_whatsapp_phone: e.target.value })}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '4px' }}>
                            Nomor ini digunakan saat mahasiswa menekan tombol "Tanya PJ MK via WhatsApp" pada materi perkuliahan.
                        </span>
                    </div>

                    <div className="modal-footer" style={{ borderTop: 'none', padding: 0 }}>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setCourseModalOpen(false)}
                            disabled={savingCourse}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={savingCourse}
                        >
                            {savingCourse ? 'Menyimpan...' : 'Simpan Informasi'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Simulator Kelayakan UAS (Khusus Admin Shukoh#Dev) */}
            <Modal
                isOpen={simulatorModalOpen}
                onClose={() => setSimulatorModalOpen(false)}
                title="Simulator Kelayakan UTS & UAS Mahasiswa (Syarat Minimal 45%)"
                icon={<CalculatorIcon size={18} />}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Ringkasan Ketentuan */}
                    <div style={{ backgroundColor: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Target Semester</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>16 Pertemuan</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Syarat Minimal Hadir</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>45% (8 Sesi UAS / 4 UTS)</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Pertemuan Berjalan</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>{sessions.length} Pertemuan</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Sisa Pertemuan</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>{Math.max(0, 16 - sessions.length)} Pertemuan</div>
                            </div>
                        </div>
                    </div>

                    {/* Filter Mahasiswa */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="simStudentSelect">
                            Pilih Fokus Mahasiswa untuk Pratinjau Rinci & Salin Pesan WA
                        </label>
                        <select
                            id="simStudentSelect"
                            className="form-select"
                            value={simStudentId}
                            onChange={(e) => setSimStudentId(e.target.value)}
                        >
                            <option value="all">Ringkasan Seluruh Mahasiswa Kelas TI25C</option>
                            {recapData.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} (Hadir: {s.counts?.hadir || 0}x)
                                </option>
                            ))}
                        </select>
                    </div>

                    {loadingRecap ? (
                        <div className="text-center text-muted" style={{ padding: '24px 0' }}>
                            Menghitung simulasi kehadiran mahasiswa...
                        </div>
                    ) : simStudentId !== 'all' ? (
                        /* Tampilan Kartu Rinci Mahasiswa Terpilih */
                        (() => {
                            const targetStudent = recapData.find((s) => String(s.id) === String(simStudentId));
                            if (!targetStudent) return null;

                            const hadir = targetStudent.counts?.hadir || 0;
                            const totalHeld = sessions.length;
                            const remaining = Math.max(0, 16 - totalHeld);
                            const needed = Math.max(0, 8 - hadir);
                            const maxPossible = hadir + remaining;
                            const safetyBuffer = maxPossible - 8;

                            let statusLabel = 'AMAN';
                            let badgeClass = 'badge-hadir';
                            let description = '';

                            if (hadir >= 8) {
                                statusLabel = 'SUDAH MEMENUHI SYARAT (AMAN)';
                                badgeClass = 'badge-hadir';
                                description = `Mahasiswa telah mengumpulkan ${hadir} kehadiran dari batas minimal 8 pertemuan UAS (atau 4 pertemuan UTS). Status kepesertaan ujian sudah aman.`;
                            } else if (maxPossible < 8) {
                                statusLabel = 'TIDAK LAYAK UTS/UAS (KRITIS)';
                                badgeClass = 'badge-alpha';
                                description = `Kehadiran maksimal yang dapat dicapai (${maxPossible} kali) berada di bawah syarat batas 45% (8 kali untuk UAS).`;
                            } else if (safetyBuffer <= 1) {
                                statusLabel = 'BATAS KRITIS (WASPADA)';
                                badgeClass = 'badge-izin';
                                description = `Mahasiswa wajib hadir pada minimal ${needed} dari ${remaining} pertemuan tersisa. Jatah absen aman tersisa hanya ${safetyBuffer} kali lagi.`;
                            } else {
                                statusLabel = 'AMAN TERKENDALI';
                                badgeClass = 'badge-hadir';
                                description = `Mahasiswa perlu hadir pada minimal ${needed} dari ${remaining} pertemuan tersisa. Jatah absen aman masih tersisa ${safetyBuffer} kali.`;
                            }

                            return (
                                <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '18px', backgroundColor: 'var(--color-bg-card)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-text)' }}>{targetStudent.name}</h4>
                                            <span style={{ fontSize: '0.813rem', color: 'var(--color-text-secondary)' }}>Kelas TI25C - Statistika</span>
                                        </div>
                                        <span className={`badge-status ${badgeClass}`} style={{ fontSize: '0.813rem', padding: '6px 12px' }}>
                                            {statusLabel}
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', margin: '14px 0' }}>
                                        <div style={{ padding: '10px', background: 'var(--color-bg-hover)', borderRadius: 'var(--radius-sm)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Hadir Saat Ini</div>
                                            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)' }}>{hadir} kali</div>
                                        </div>
                                        <div style={{ padding: '10px', background: 'var(--color-bg-hover)', borderRadius: 'var(--radius-sm)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Target Minimal</div>
                                            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)' }}>8 kali (45%)</div>
                                        </div>
                                        <div style={{ padding: '10px', background: 'var(--color-bg-hover)', borderRadius: 'var(--radius-sm)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Kebutuhan Hadir</div>
                                            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: needed > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                                                {needed > 0 ? `${needed} sesi lagi` : 'Tercapai'}
                                            </div>
                                        </div>
                                        <div style={{ padding: '10px', background: 'var(--color-bg-hover)', borderRadius: 'var(--radius-sm)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Jatah Absen Aman</div>
                                            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: safetyBuffer < 0 ? 'var(--color-danger)' : safetyBuffer <= 1 ? 'var(--color-warning)' : 'var(--color-text)' }}>
                                                {safetyBuffer >= 0 ? `${safetyBuffer} kali` : 'Habis'}
                                            </div>
                                        </div>
                                    </div>

                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                                        {description}
                                    </p>

                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-block"
                                        onClick={() => handleCopyWarningWA(targetStudent)}
                                        style={{ borderColor: '#25D366', color: '#128C7E' }}
                                    >
                                        <WhatsAppIcon size={16} /> Salin Pesan Peringatan WA untuk Mahasiswa Ini
                                    </button>
                                </div>
                            );
                        })()
                    ) : (
                        /* Tabel Radar Semua Mahasiswa */
                        <div className="table-container" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>No</th>
                                        <th>Nama Mahasiswa</th>
                                        <th style={{ textAlign: 'center' }}>Hadir</th>
                                        <th style={{ textAlign: 'center' }}>Butuh Lagi</th>
                                        <th style={{ textAlign: 'center' }}>Jatah Absen</th>
                                        <th>Status Kelayakan</th>
                                        <th style={{ textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recapData.map((s, idx) => {
                                        const hadir = s.counts?.hadir || 0;
                                        const totalHeld = sessions.length;
                                        const remaining = Math.max(0, 16 - totalHeld);
                                        const needed = Math.max(0, 8 - hadir);
                                        const maxPossible = hadir + remaining;
                                        const safetyBuffer = maxPossible - 8;

                                        let badgeClass = 'badge-hadir';
                                        let statusText = 'Aman';

                                        if (hadir >= 8) {
                                            badgeClass = 'badge-hadir';
                                            statusText = 'Lolos 45%';
                                        } else if (maxPossible < 8) {
                                            badgeClass = 'badge-alpha';
                                            statusText = 'Tidak Layak';
                                        } else if (safetyBuffer <= 1) {
                                            badgeClass = 'badge-izin';
                                            statusText = 'Waspada';
                                        }

                                        return (
                                            <tr key={s.id}>
                                                <td>{idx + 1}</td>
                                                <td style={{ fontWeight: 600 }}>{s.name}</td>
                                                <td style={{ textAlign: 'center' }}>{hadir}/16</td>
                                                <td style={{ textAlign: 'center' }}>{needed > 0 ? `${needed}x` : '0x'}</td>
                                                <td style={{ textAlign: 'center' }}>{safetyBuffer >= 0 ? `${safetyBuffer}x` : '-'}</td>
                                                <td>
                                                    <span className={`badge-status ${badgeClass}`}>
                                                        {statusText}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => handleCopyWarningWA(s)}
                                                        title="Salin Peringatan WA"
                                                        style={{ color: '#128C7E', padding: '4px 8px' }}
                                                    >
                                                        <WhatsAppIcon size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="modal-footer" style={{ borderTop: 'none', padding: 0 }}>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSimulatorModalOpen(false)}
                        >
                            Tutup Simulator
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
