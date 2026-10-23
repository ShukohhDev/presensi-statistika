import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import presensiSticker from '../assets/presensi-masuk-boskyuh.png';
import {
    ChevronDownIcon,
    CheckCircleIcon,
    ClockIcon,
    AlertCircleIcon,
    UploadIcon,
    FileTextIcon,
    XIcon,
    BookOpenIcon,
    ExternalLinkIcon,
    WhatsAppIcon,
    LockIcon
} from '../components/Common/Icons';

export function Attendance() {
    const [activeSession, setActiveSession] = useState(null);
    const [userAttendance, setUserAttendance] = useState(null);
    const [userSummary, setUserSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [courseInfo, setCourseInfo] = useState(null);

    // Form selection
    const [selectedOption, setSelectedOption] = useState('hadir'); // 'hadir' (Masuk), 'izin', 'sakit'
    const [note, setNote] = useState('');
    const [evidenceFile, setEvidenceFile] = useState(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState(null);

    // Pop-up Animasi Stiker Perayaan Presensi (WOKEE PRESENSI MASUK BOSKYUH)
    const [showSuccessSticker, setShowSuccessSticker] = useState(false);
    const [isClosingSticker, setIsClosingSticker] = useState(false);
    const stickerTimerRef = useRef(null);

    const closeSticker = useCallback(() => {
        setIsClosingSticker(true);
        setTimeout(() => {
            setShowSuccessSticker(false);
            setIsClosingSticker(false);
        }, 250);
    }, []);

    const triggerSticker = useCallback(() => {
        if (stickerTimerRef.current) clearTimeout(stickerTimerRef.current);
        setIsClosingSticker(false);
        setShowSuccessSticker(true);
        // Otomatis menutup sebentar (~2.8 detik)
        stickerTimerRef.current = setTimeout(() => {
            closeSticker();
        }, 2800);
    }, [closeSticker]);

    useEffect(() => {
        return () => {
            if (stickerTimerRef.current) clearTimeout(stickerTimerRef.current);
        };
    }, []);

    // Haptic feedback helper
    const handleSelectOption = (opt) => {
        setSelectedOption(opt);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(25); } catch {}
        }
    };

    // Countdown timer
    const [timeLeft, setTimeLeft] = useState(null);
    const timerRef = useRef(null);
    const { addToast } = useToast();

    const fetchSessionData = useCallback(async (silent = false) => {
        try {
            if (silent) {
                setIsSyncing(true);
            } else {
                setLoading(true);
            }
            const data = await api.getActiveSession();
            setActiveSession(data.session);
            setUserAttendance(data.attendance);
        } catch (err) {
            console.error('Error fetching session:', err);
        } finally {
            if (silent) {
                setIsSyncing(false);
            } else {
                setLoading(false);
            }
        }
    }, []);

    const fetchCourseInfo = useCallback(async () => {
        try {
            const data = await api.getCourseInfo();
            if (data?.info) {
                setCourseInfo(data.info);
            }
        } catch (err) {
            console.error('Error fetching course info:', err);
        }
    }, []);

    const fetchAttendanceSummary = useCallback(async () => {
        try {
            const data = await api.getAttendanceSummary();
            if (data?.summary) {
                setUserSummary(data.summary);
            }
        } catch (err) {
            console.error('Error fetching attendance summary:', err);
        }
    }, []);

    useEffect(() => {
        fetchSessionData(false);
        fetchCourseInfo();
        fetchAttendanceSummary();
        const poll = setInterval(() => {
            fetchSessionData(true);
        }, 15000);
        return () => clearInterval(poll);
    }, [fetchSessionData, fetchCourseInfo, fetchAttendanceSummary]);

    // Timer calculation
    useEffect(() => {
        if (!activeSession || !activeSession.opened_at) {
            setTimeLeft(null);
            return;
        }

        const calculateTimeLeft = () => {
            const openedTime = new Date(activeSession.opened_at).getTime();
            const durationMs = (activeSession.duration_minutes || 15) * 60 * 1000;
            const endTime = openedTime + durationMs;
            const diff = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
            setTimeLeft(diff);
        };

        calculateTimeLeft();
        timerRef.current = setInterval(calculateTimeLeft, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeSession]);

    const formatTimer = (seconds) => {
        if (seconds === null) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getScheduleStatus = () => {
        const parseTimeToMinutes = (timeStr, defaultMinutes = 0) => {
            if (!timeStr) return defaultMinutes;
            const match = timeStr.trim().replace('.', ':').match(/(\d{1,2}):(\d{2})/);
            if (!match) return defaultMinutes;
            return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        };

        const now = new Date();
        const shortDayFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Jakarta',
            weekday: 'short'
        });
        const shortDay = shortDayFormatter.format(now);
        const dayMap = { 'Sun': 'minggu', 'Mon': 'senin', 'Tue': 'selasa', 'Wed': 'rabu', 'Thu': 'kamis', 'Fri': 'jumat', 'Sat': 'sabtu' };
        const currentWibDay = dayMap[shortDay] || 'kamis';

        const scheduledDay = courseInfo?.schedule_day || 'Jumat';
        const scheduledDayRaw = scheduledDay.toLowerCase().trim();
        const isScheduledDay = scheduledDayRaw.includes(currentWibDay) || currentWibDay.includes(scheduledDayRaw);

        const timeFormatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        const timeParts = timeFormatter.format(now).split(':').map(Number);
        const currentMins = timeParts[0] * 60 + timeParts[1];

        const openTime = courseInfo?.auto_open_time || '13:00';
        const closeTime = courseInfo?.auto_close_time || '15:30';
        const openMins = parseTimeToMinutes(openTime, 13 * 60);
        const closeMins = parseTimeToMinutes(closeTime, 15 * 60 + 30);

        if (courseInfo?.skip_next_session) {
            return {
                type: 'libur',
                title: 'Perkuliahan Pekan Ini Diliburkan',
                desc: 'Berdasarkan instruksi PJ MK / Dosen Pengampu, sesi perkuliahan tatap muka hari ini ditiadakan/diliburkan.'
            };
        }

        if (isScheduledDay) {
            if (currentMins < openMins) {
                const diff = openMins - currentMins;
                const hours = Math.floor(diff / 60);
                const mins = diff % 60;
                return {
                    type: 'upcoming_today',
                    title: `Sesi Presensi Dibuka Otomatis Pukul ${openTime} WIB`,
                    countdownText: hours > 0 ? `${hours} jam ${mins} menit lagi` : `${mins} menit lagi`,
                    desc: `Hari ini jadwal perkuliahan Statistika tatap muka (${openTime} - ${closeTime} WIB). Presensi akan aktif secara otomatis.`
                };
            } else if (currentMins >= closeMins) {
                return {
                    type: 'ended_today',
                    title: 'Perkuliahan Hari Ini Telah Selesai',
                    desc: `Sesi presensi dan perkuliahan telah ditutup pada pukul ${closeTime} WIB.`
                };
            } else {
                return {
                    type: 'waiting_open',
                    title: 'Menunggu Pembukaan Sesi Presensi',
                    desc: 'Sesi presensi sedang disiapkan oleh sistem atau PJ MK. Halaman ini akan memuat sesi secara otomatis.'
                };
            }
        }

        return {
            type: 'other_day',
            title: 'Sesi Presensi Belum Dibuka',
            desc: `Jadwal perkuliahan Statistika berikutnya adalah hari ${scheduledDay}, pukul ${(!courseInfo?.schedule_time || courseInfo?.schedule_time.includes('08:00')) ? '13:00 - 15:30 WIB' : courseInfo.schedule_time}.`
        };
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setEvidenceFile(file);
            setFilePreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeFile = () => {
        setEvidenceFile(null);
        if (filePreviewUrl) {
            URL.revokeObjectURL(filePreviewUrl);
            setFilePreviewUrl(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!activeSession) {
            addToast('Tidak ada sesi presensi yang sedang berlangsung.', 'error');
            return;
        }

        if ((selectedOption === 'izin' || selectedOption === 'sakit') && !note.trim()) {
            addToast('Catatan wajib diisi untuk permohonan izin atau sakit.', 'error');
            return;
        }

        if ((selectedOption === 'izin' || selectedOption === 'sakit') && !evidenceFile) {
            addToast('Bukti gambar wajib diunggah untuk permohonan izin atau sakit.', 'error');
            return;
        }

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append('session_id', activeSession.id);
            formData.append('status', selectedOption);

            if (selectedOption !== 'hadir') {
                formData.append('note', note.trim());
                if (evidenceFile) {
                    formData.append('evidence', evidenceFile);
                }
            }

            await api.submitAttendance(formData);
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                try { navigator.vibrate([40, 30, 40]); } catch {}
            }
            addToast('Presensi Anda berhasil dicatat.', 'success');
            removeFile();
            setNote('');
            triggerSticker();
            await fetchSessionData();
            await fetchAttendanceSummary();
        } catch (err) {
            addToast(err.message || 'Gagal mengirim presensi.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDateTime = (timestamp) => {
        if (!timestamp) return '-';
        try {
            const date = new Date(timestamp);
            return date.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return timestamp;
        }
    };

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 className="page-title">Halaman Presensi</h1>
                    <p className="page-subtitle">Pencatatan kehadiran perkuliahan Mata Kuliah Statistika - Kelas TI25C</p>
                </div>
                {userSummary && (
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-control)',
                        backgroundColor: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        fontSize: '0.813rem',
                        boxShadow: 'var(--shadow-xs)'
                    }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Kehadiran:</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                            {userSummary.percentage}%
                        </span>
                        <span style={{ color: 'var(--color-text-muted)' }}>
                            ({userSummary.hadir} Hadir)
                        </span>
                        <span className={`badge-status ${userSummary.percentage >= 45 ? 'badge-hadir' : 'badge-alpha'}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                            {userSummary.percentage >= 45 ? 'Lolos Syarat UAS' : 'Kritis (<45%)'}
                        </span>
                    </div>
                )}
            </div>

            <div className="attendance-panel">
                {/* Panel Mata Kuliah Resmi (Header Tetap, Selalu Terbuka) */}
                <div className="attendance-subject-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--color-primary-light)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-primary)',
                            flexShrink: 0
                        }}>
                            <BookOpenIcon size={22} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>Mata Kuliah Statistika</h2>
                                <span className="badge-status badge-info" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                    TI25C
                                </span>
                                {activeSession ? (
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '2px 8px',
                                        borderRadius: 'var(--radius-xs)',
                                        backgroundColor: 'var(--color-success-light)',
                                        color: 'var(--color-success)',
                                        border: '1px solid rgba(22, 163, 74, 0.2)',
                                        fontSize: '0.75rem',
                                        fontWeight: 600
                                    }}>
                                        <span style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            backgroundColor: 'currentColor'
                                        }} />
                                        Presensi Dibuka
                                    </span>
                                ) : (
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '2px 8px',
                                        borderRadius: 'var(--radius-xs)',
                                        backgroundColor: 'var(--color-bg-card)',
                                        color: 'var(--color-text-muted)',
                                        border: '1px solid var(--color-border)',
                                        fontSize: '0.75rem',
                                        fontWeight: 500
                                    }}>
                                        Sesi Ditutup
                                    </span>
                                )}
                                {isSyncing && (
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '0.75rem',
                                        color: 'var(--color-text-muted)'
                                    }}>
                                        <span style={{
                                            width: '5px',
                                            height: '5px',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--color-primary)',
                                            animation: 'pulse 1.5s infinite ease-in-out'
                                        }} />
                                        Sinkronisasi...
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: '0.813rem', color: 'var(--color-text-secondary)', marginTop: '2px', margin: 0 }}>
                                {activeSession ? (
                                    `Pertemuan ${activeSession.meeting_number}: ${activeSession.title}`
                                ) : (
                                    'Sesi Perkuliahan Statistika - Kelas TI25C'
                                )}
                            </p>
                        </div>
                    </div>
                    {courseInfo?.whatsapp_group_link && (
                        <a
                            href={courseInfo.whatsapp_group_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-xs"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: '#107C41' }}
                            title="Buka Grup WhatsApp Kelas TI25C"
                        >
                            <WhatsAppIcon size={14} />
                            <span>Grup WhatsApp</span>
                            <ExternalLinkIcon size={12} />
                        </a>
                    )}
                </div>

                <div style={{ marginTop: '20px' }}>
                        {loading ? (
                            <div style={{ padding: '8px 0' }}>
                                <div className="skeleton skeleton-title" style={{ width: '45%', height: '18px' }} />
                                <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: '16px' }} />
                                <div className="skeleton skeleton-box" style={{ height: '62px', marginBottom: '10px' }} />
                                <div className="skeleton skeleton-box" style={{ height: '62px', marginBottom: '10px' }} />
                                <div className="skeleton skeleton-box" style={{ height: '62px' }} />
                            </div>
                        ) : userAttendance ? (
                            /* Tampilan Setelah Presensi Berhasil */
                            <div className="attendance-done-msg">
                                <div className="check-icon">
                                    <CheckCircleIcon size={36} />
                                </div>
                                <h3>Presensi Berhasil Dicatat</h3>
                                <p>
                                    Anda telah melakukan presensi dengan status{' '}
                                    <span className={`badge-status badge-${userAttendance.status}`} style={{ margin: '0 4px' }}>
                                        {userAttendance.status === 'hadir' ? 'Masuk (Hadir)' : userAttendance.status}
                                    </span>
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                                    Waktu Presensi: {formatDateTime(userAttendance.timestamp)}
                                </p>
                                {userAttendance.note && (
                                    <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-bg-hover)', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Catatan:</div>
                                        <div style={{ fontSize: '0.875rem', marginTop: '4px' }}>{userAttendance.note}</div>
                                    </div>
                                )}

                                {/* Konfirmasi Sinkronisasi Real-Time & Navigasi Cepat (Level 9.8 UX) */}
                                <div style={{
                                    marginTop: '20px',
                                    padding: '12px 16px',
                                    background: 'var(--color-bg-hover)',
                                    borderRadius: 'var(--radius-control)',
                                    border: '1px solid var(--color-border)',
                                    textAlign: 'left',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--color-status-hadir)',
                                            display: 'inline-block'
                                        }} />
                                        <span style={{ fontSize: '0.813rem', color: 'var(--color-text)' }}>
                                            Tersimpan & tersinkronisasi otomatis ke rekap dosen
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-xs"
                                            onClick={triggerSticker}
                                            style={{ textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                            title="Tampilkan animasi stiker presensi"
                                        >
                                            <span>⚡</span>
                                            <span>Lihat Stiker Presensi</span>
                                        </button>
                                        <Link to="/rekap" className="btn btn-secondary btn-xs" style={{ textDecoration: 'none', fontWeight: 600 }}>
                                            Cek Status Kelayakan UAS &rarr;
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ) : activeSession ? (
                            activeSession.attendance_mode === 'admin_only' ? (
                                /* Sesi Presensi Sedang Berjalan dalam Mode Manual oleh Admin / Dosen */
                                <div style={{
                                    padding: '28px 20px',
                                    backgroundColor: 'var(--color-bg-hover)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '1.5px dashed rgba(234, 88, 12, 0.45)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(234, 88, 12, 0.12)',
                                        color: '#ea580c',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 16px'
                                    }}>
                                        <LockIcon size={30} />
                                    </div>

                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 12px',
                                        borderRadius: 'var(--radius-full)',
                                        backgroundColor: 'rgba(234, 88, 12, 0.15)',
                                        color: '#c2410c',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        marginBottom: '12px'
                                    }}>
                                        <LockIcon size={13} />
                                        <span>Mode Presensi Manual oleh Dosen / Admin</span>
                                    </div>

                                    <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text)', marginBottom: '8px' }}>
                                        Pertemuan ke-{activeSession.meeting_number}: {activeSession.title}
                                    </h3>

                                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', maxWidth: '520px', margin: '0 auto 18px', lineHeight: '1.55' }}>
                                        Pada sesi perkuliahan ini, presensi kehadiran dicatat dan dikelola secara <strong>MANUAL</strong> langsung oleh <strong>Dosen Pengampu / PJ MK (Faqih Hidayatus Salam)</strong>.
                                    </p>

                                    <div style={{
                                        maxWidth: '480px',
                                        margin: '0 auto 20px',
                                        padding: '14px 16px',
                                        backgroundColor: 'var(--color-bg-card)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                        textAlign: 'left'
                                    }}>
                                        <div style={{ fontSize: '0.813rem', color: 'var(--color-text)', display: 'flex', alignItems: 'flex-start', gap: '10px', lineHeight: 1.5 }}>
                                            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>ℹ️</span>
                                            <span>
                                                <strong>Catatan Mahasiswa:</strong> Tombol <em>"Kirim Presensi Kehadiran"</em> mandiri dinonaktifkan untuk sesi ini. Anda tidak perlu mengirim presensi mandiri. Status kehadiran Anda akan otomatis terupdate di halaman ini segera setelah diinput oleh PJ MK / Dosen.
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <Link to="/rekap" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none', fontWeight: 600 }}>
                                            Cek Rekap Kehadiran & Status UAS &rarr;
                                        </Link>
                                        {courseInfo?.whatsapp_group_link && (
                                            <a
                                                href={courseInfo.whatsapp_group_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-secondary btn-sm"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#128C7E', borderColor: '#25D366', textDecoration: 'none' }}
                                            >
                                                <WhatsAppIcon size={16} /> Grup WhatsApp Kelas
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Sesi Presensi Sedang Dibuka (Mode Mandiri oleh Mahasiswa) */
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                                        <div>
                                            <span className="badge-status badge-active-session">Sesi Aktif</span>
                                            <span style={{ fontSize: '0.813rem', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
                                                Pertemuan ke-{activeSession.meeting_number}
                                            </span>
                                        </div>

                                    {timeLeft !== null && (
                                        <div className={`session-timer ${timeLeft < 180 ? 'urgent' : ''}`}>
                                            <ClockIcon size={16} />
                                            <span>
                                                {timeLeft > 0 ? `Sisa Waktu: ${formatTimer(timeLeft)}` : 'Waktu Reguler Habis (Masih Dibuka)'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <label className="form-label" style={{ marginBottom: '12px' }}>
                                        Pilih Status Kehadiran Anda
                                    </label>

                                    <div className="attendance-options">
                                        {/* Pilihan Masuk (Hadir) */}
                                        <button
                                            type="button"
                                            className={`attendance-option attendance-option-hadir ${selectedOption === 'hadir' ? 'selected' : ''}`}
                                            onClick={() => handleSelectOption('hadir')}
                                        >
                                            <div className="option-icon-box">
                                                <CheckCircleIcon size={20} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>Masuk (Hadir)</span>
                                                    <span className="badge-status badge-hadir" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                                        Tatap Muka
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                                                    Hadir dan mengikuti seluruh sesi perkuliahan aktif
                                                </div>
                                            </div>
                                            <span className="option-dot" />
                                        </button>

                                        {/* Pilihan Izin */}
                                        <button
                                            type="button"
                                            className={`attendance-option attendance-option-izin ${selectedOption === 'izin' ? 'selected' : ''}`}
                                            onClick={() => handleSelectOption('izin')}
                                        >
                                            <div className="option-icon-box">
                                                <ClockIcon size={20} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>Izin</span>
                                                    <span className="badge-status badge-izin" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                                        Keterangan Tertulis
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                                                    Berhalangan hadir dengan alasan atau keperluan jelas
                                                </div>
                                            </div>
                                            <span className="option-dot" />
                                        </button>

                                        {/* Pilihan Sakit */}
                                        <button
                                            type="button"
                                            className={`attendance-option attendance-option-sakit ${selectedOption === 'sakit' ? 'selected' : ''}`}
                                            onClick={() => handleSelectOption('sakit')}
                                        >
                                            <div className="option-icon-box">
                                                <AlertCircleIcon size={20} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>Sakit</span>
                                                    <span className="badge-status badge-sakit" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                                                        Surat Dokter
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                                                    Kondisi kesehatan tidak memungkinkan untuk mengikuti kuliah
                                                </div>
                                            </div>
                                            <span className="option-dot" />
                                        </button>
                                    </div>

                                    {/* Form Catatan & Bukti Gambar Jika Izin atau Sakit */}
                                    {(selectedOption === 'izin' || selectedOption === 'sakit') && (
                                        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                                            <div className="form-group">
                                                <label className="form-label" htmlFor="note">
                                                    Catatan Keterangan <span style={{ color: 'var(--color-danger)' }}>*</span>
                                                </label>
                                                <textarea
                                                    id="note"
                                                    className="form-textarea"
                                                    placeholder={`Tuliskan alasan ${selectedOption === 'izin' ? 'izin' : 'sakit'} secara jelas...`}
                                                    value={note}
                                                    onChange={(e) => setNote(e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">
                                                    Unggah Bukti Gambar <span style={{ color: 'var(--color-danger)' }}>*</span>
                                                </label>

                                                {!evidenceFile ? (
                                                    <label className="file-upload-zone" htmlFor="evidenceInput" style={{ display: 'block' }}>
                                                        <UploadIcon size={32} />
                                                        <p>Klik atau seret gambar bukti ke area ini</p>
                                                        <span className="upload-hint">Format: JPG, PNG, atau WEBP</span>
                                                        <input
                                                            id="evidenceInput"
                                                            type="file"
                                                            accept="image/*"
                                                            style={{ display: 'none' }}
                                                            onChange={handleFileChange}
                                                        />
                                                    </label>
                                                ) : (
                                                    <div>
                                                        <div className="file-preview">
                                                            <div className="file-preview-icon">
                                                                <FileTextIcon size={20} />
                                                            </div>
                                                            <div className="file-preview-info">
                                                                <div className="file-name">{evidenceFile.name}</div>
                                                                <div className="file-size">
                                                                    {(evidenceFile.size / 1024).toFixed(1)} KB
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="modal-close"
                                                                onClick={removeFile}
                                                                aria-label="Hapus file bukti"
                                                            >
                                                                <XIcon size={16} />
                                                            </button>
                                                        </div>

                                                        {filePreviewUrl && (
                                                            <div style={{ marginTop: '12px', textAlign: 'center' }}>
                                                                <img
                                                                    src={filePreviewUrl}
                                                                    alt="Pratinjau Bukti"
                                                                    style={{ maxHeight: '180px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {timeLeft !== null && timeLeft <= 0 && (
                                        <div style={{
                                            marginTop: '16px',
                                            padding: '10px 14px',
                                            backgroundColor: 'var(--color-warning-light)',
                                            border: '1px solid var(--color-warning)',
                                            borderRadius: 'var(--radius-control)',
                                            fontSize: '0.813rem',
                                            color: 'var(--color-warning)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <ClockIcon size={16} style={{ flexShrink: 0 }} />
                                            <span>
                                                Waktu reguler sesi telah habis, namun tombol absensi tetap aktif dan Anda tetap dapat mengirim presensi selama sesi belum ditutup oleh PJ MK.
                                            </span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-block btn-lg"
                                        style={{ marginTop: '24px' }}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Memproses Presensi...' : 'Kirim Presensi Kehadiran'}
                                    </button>
                                </form>
                            </div>
                        )
                    ) : (
                            /* Sesi Sedang Ditutup / Menunggu Jadwal */
                            (() => {
                                const sched = getScheduleStatus();
                                return (
                                    <div className="empty-state" style={{ padding: '36px 16px' }}>
                                        {sched.type === 'upcoming_today' ? (
                                            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                                                <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                                                    <ClockIcon size={28} />
                                                </div>
                                                <span className="badge-status badge-active-session" style={{ fontSize: '0.75rem', padding: '3px 10px', marginBottom: '10px' }}>
                                                    Hari Ini: Kuliah Statistika
                                                </span>
                                                <h3 style={{ fontSize: '1.25rem', marginTop: '6px' }}>{sched.title}</h3>
                                                {sched.countdownText && (
                                                    <div style={{ margin: '14px 0', padding: '10px 16px', background: 'var(--color-bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--color-primary)' }}>
                                                        <ClockIcon size={16} />
                                                        <span>Dimulai dalam: {sched.countdownText}</span>
                                                    </div>
                                                )}
                                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{sched.desc}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '12px' }}>
                                                    Halaman ini otomatis merefresh saat waktu tiba.
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <AlertCircleIcon size={44} />
                                                <h3>{sched.title}</h3>
                                                <p>{sched.desc}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                                                    Halaman ini akan diperbarui secara berkala saat sesi dibuka.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()
                        )}
                    </div>
            </div>

            {/* Kartu Informasi Perkuliahan & Dosen Pengampu (Secondary Reference) */}
            <div className="card" style={{ maxWidth: '760px', margin: '0 auto 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)' }}>
                            Informasi Akademik & Pengampu
                        </span>
                        <span className="badge-status badge-info" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                            Statistika TI25C
                        </span>
                    </div>
                    {courseInfo?.whatsapp_group_link && (
                        <a
                            href={courseInfo.whatsapp_group_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.75rem', fontWeight: 600, color: '#107C41', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                        >
                            <WhatsAppIcon size={14} />
                            <span>Grup WA Kelas</span>
                        </a>
                    )}
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '12px'
                }}>
                    <div className="course-meta-item">
                        <div className="course-meta-label">Dosen Pengampu</div>
                        <div className="course-meta-val">
                            {courseInfo?.lecturer_name || 'Dr. H. Ade Mubarok, S.Kom., M.T.'}
                        </div>
                        <div className="course-meta-sub">
                            {courseInfo?.lecturer_title || 'Dosen Pengampu Mata Kuliah'}
                        </div>
                    </div>

                    <div className="course-meta-item">
                        <div className="course-meta-label">Jadwal Perkuliahan</div>
                        <div className="course-meta-val">
                            {courseInfo?.schedule_day || 'Jumat'}
                        </div>
                        <div className="course-meta-sub">
                            {courseInfo?.schedule_time || '13:00 - 15:30 WIB'}
                        </div>
                    </div>

                    <div className="course-meta-item">
                        <div className="course-meta-label">Ruang Kuliah</div>
                        <div className="course-meta-val">
                            {courseInfo?.room || 'G. Mahdor R. C 306'}
                        </div>
                        <div className="course-meta-sub">
                            Perkuliahan Tatap Muka
                        </div>
                    </div>

                    <div className="course-meta-item">
                        <div className="course-meta-label">Penanggung Jawab (PJ MK)</div>
                        <div className="course-meta-val" style={{ color: 'var(--color-primary)' }}>
                            Faqih Hidayatus Salam
                        </div>
                        <div className="course-meta-sub">
                            NIM: 250511067 (Kelas TI25C)
                        </div>
                    </div>
                </div>
            </div>

            {/* Pop-up Animasi Stiker Perayaan Presensi - WOKEE PRESENSI MASUK BOSKYUH */}
            {showSuccessSticker && (
                <div
                    className={`attendance-sticker-overlay ${isClosingSticker ? 'closing' : ''}`}
                    onClick={closeSticker}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Presensi Berhasil Dicatat"
                >
                    <div className="attendance-sticker-container" onClick={(e) => e.stopPropagation()}>
                        <div className="attendance-sticker-aura" />
                        <div className="attendance-sticker-shockwave" />
                        <div className="attendance-sticker-shockwave delay-1" />
                        <div className="attendance-sticker-wrapper" onClick={closeSticker}>
                            <img
                                src={presensiSticker}
                                alt="Wokee Presensi Masuk Boskyuh"
                                className="attendance-sticker-img"
                            />
                        </div>
                        <div className="attendance-sticker-badge" onClick={closeSticker}>
                            <CheckCircleIcon size={18} />
                            <span>Presensi Berhasil Dicatat!</span>
                        </div>
                        <div className="attendance-sticker-hint">
                            Klik di mana saja untuk menutup
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
