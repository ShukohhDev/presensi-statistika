import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
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
    WhatsAppIcon
} from '../components/Common/Icons';

export function Attendance() {
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [activeSession, setActiveSession] = useState(null);
    const [userAttendance, setUserAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [courseInfo, setCourseInfo] = useState(null);

    // Form selection
    const [selectedOption, setSelectedOption] = useState('hadir'); // 'hadir' (Masuk), 'izin', 'sakit'
    const [note, setNote] = useState('');
    const [evidenceFile, setEvidenceFile] = useState(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState(null);

    // Countdown timer
    const [timeLeft, setTimeLeft] = useState(null);
    const timerRef = useRef(null);
    const { addToast } = useToast();

    const fetchSessionData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getActiveSession();
            setActiveSession(data.session);
            setUserAttendance(data.attendance);
        } catch (err) {
            console.error('Error fetching session:', err);
        } finally {
            setLoading(false);
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

    useEffect(() => {
        fetchSessionData();
        fetchCourseInfo();
        const poll = setInterval(fetchSessionData, 15000);
        return () => clearInterval(poll);
    }, [fetchSessionData, fetchCourseInfo]);

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
        const now = new Date();
        const dayFormatter = new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta',
            weekday: 'long'
        });
        const todayName = dayFormatter.format(now);
        const scheduledDay = courseInfo?.schedule_day || 'Kamis';
        const isScheduledDay = todayName.toLowerCase() === scheduledDay.toLowerCase();

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
        const [openH, openM] = openTime.split(':').map(Number);
        const [closeH, closeM] = closeTime.split(':').map(Number);
        const openMins = openH * 60 + openM;
        const closeMins = closeH * 60 + closeM;

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
            addToast('Presensi Anda berhasil dicatat.', 'success');
            removeFile();
            setNote('');
            await fetchSessionData();
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
            <div className="page-header">
                <h1 className="page-title">Halaman Presensi</h1>
                <p className="page-subtitle">Pencatatan kehadiran perkuliahan Mata Kuliah Statistika - Kelas TI25C</p>
            </div>

            {/* Kartu Informasi Perkuliahan & Dosen Pengampu */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--color-bg-hover)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-primary)'
                        }}>
                            <BookOpenIcon size={22} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>Mata Kuliah Statistika</h2>
                                <span className="badge-status badge-hadir" style={{ fontSize: '0.688rem', padding: '2px 8px' }}>
                                    Kelas TI25C - 3 SKS
                                </span>
                            </div>
                            <p style={{ fontSize: '0.813rem', color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>
                                Program Studi Teknik Informatika - Kelas TI25C
                            </p>
                        </div>
                    </div>
                    {courseInfo?.whatsapp_group_link && (
                        <a
                            href={courseInfo.whatsapp_group_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                            <WhatsAppIcon size={16} />
                            Grup WhatsApp Kelas
                            <ExternalLinkIcon size={14} />
                        </a>
                    )}
                </div>

                <div className="course-meta-grid">
                    <div style={{ padding: '12px 14px', background: 'var(--color-bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: '0.688rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Dosen Pengampu
                            </div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)', marginTop: '4px' }}>
                                {courseInfo?.lecturer_name || 'RIFQI HIDAYAT'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                NIP / NIDN: {courseInfo?.lecturer_nip || '0401088701'}
                            </div>
                        </div>
                        {(courseInfo?.lecturer_phone || '081282394648') && (
                            <div style={{ marginTop: '10px' }}>
                                <a
                                    href={`https://wa.me/${(courseInfo?.lecturer_phone || '081282394648').trim().replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent('Halo Pak Rifqi Hidayat, mohon maaf mengganggu waktunya. Saya mahasiswa kelas TI25C...')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary btn-xs"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '0.75rem',
                                        color: '#25D366',
                                        borderColor: 'rgba(37, 211, 102, 0.3)',
                                        backgroundColor: 'rgba(37, 211, 102, 0.08)',
                                        padding: '4px 10px',
                                        borderRadius: 'var(--radius-sm)',
                                        textDecoration: 'none',
                                        fontWeight: 600
                                    }}
                                    title="Hubungi Dosen Pengampu via WhatsApp (081282394648)"
                                >
                                    <WhatsAppIcon size={14} />
                                    <span>Hubungi Dosen</span>
                                    <ExternalLinkIcon size={12} />
                                </a>
                            </div>
                        )}
                    </div>

                    <div style={{ padding: '12px 14px', background: 'var(--color-bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '0.688rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Jadwal Perkuliahan
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', marginTop: '4px' }}>
                            {courseInfo?.schedule_day || 'Kamis'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            {(!courseInfo?.schedule_time || courseInfo?.schedule_time.includes('08:00')) ? '13:00 - 15:30 WIB' : courseInfo.schedule_time}
                        </div>
                    </div>

                    <div style={{ padding: '12px 14px', background: 'var(--color-bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '0.688rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Ruang Kuliah
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', marginTop: '4px' }}>
                            {courseInfo?.room || 'G. Mahdor R. C 306'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            Perkuliahan Tatap Muka
                        </div>
                    </div>

                    <div style={{ padding: '12px 14px', background: 'var(--color-bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '0.688rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Penanggung Jawab (PJ MK)
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--color-primary)', marginTop: '4px' }}>
                            Faqih Hidayatus Salam
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            NIM: 250511067 (Kelas TI25C)
                        </div>
                    </div>
                </div>
            </div>

            <div className="attendance-panel">
                {/* Panel Mata Kuliah Resmi */}
                <div
                    className={`attendance-subject ${isPanelOpen ? 'expanded' : ''}`}
                    onClick={() => setIsPanelOpen(!isPanelOpen)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsPanelOpen(!isPanelOpen); }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--color-primary-light)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-primary)',
                            flexShrink: 0
                        }}>
                            <BookOpenIcon size={20} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <h3>Mata Kuliah Statistika</h3>
                                <span className="badge-status badge-info" style={{ fontSize: '0.688rem', padding: '2px 8px' }}>
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
                                        fontSize: '0.688rem',
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
                                        fontSize: '0.688rem',
                                        fontWeight: 500
                                    }}>
                                        Sesi Ditutup
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
                    <div className="arrow-icon">
                        <ChevronDownIcon size={18} />
                    </div>
                </div>

                {isPanelOpen && (
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
                                    <Link to="/rekap" className="btn btn-secondary btn-xs" style={{ textDecoration: 'none', fontWeight: 600 }}>
                                        Cek Status Kelayakan UAS &rarr;
                                    </Link>
                                </div>
                            </div>
                        ) : activeSession ? (
                            /* Sesi Presensi Sedang Dibuka */
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
                                            <span>Sisa Waktu: {formatTimer(timeLeft)}</span>
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
                                            onClick={() => setSelectedOption('hadir')}
                                        >
                                            <div className="option-icon-box">
                                                <CheckCircleIcon size={20} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>Masuk (Hadir)</span>
                                                    <span className="badge-status badge-hadir" style={{ fontSize: '0.688rem', padding: '2px 8px' }}>
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
                                            onClick={() => setSelectedOption('izin')}
                                        >
                                            <div className="option-icon-box">
                                                <ClockIcon size={20} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>Izin</span>
                                                    <span className="badge-status badge-izin" style={{ fontSize: '0.688rem', padding: '2px 8px' }}>
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
                                            onClick={() => setSelectedOption('sakit')}
                                        >
                                            <div className="option-icon-box">
                                                <AlertCircleIcon size={20} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '0.925rem' }}>Sakit</span>
                                                    <span className="badge-status badge-sakit" style={{ fontSize: '0.688rem', padding: '2px 8px' }}>
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

                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-block btn-lg"
                                        style={{ marginTop: '24px' }}
                                        disabled={submitting || (timeLeft !== null && timeLeft <= 0)}
                                    >
                                        {submitting ? 'Memproses Presensi...' : 'Kirim Presensi Kehadiran'}
                                    </button>
                                </form>
                            </div>
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
                )}
            </div>
        </div>
    );
}
