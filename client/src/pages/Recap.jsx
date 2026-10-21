import { useState, useEffect, useCallback } from 'react';
import { api, sortStudentsByName } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
    SearchIcon,
    DownloadIcon,
    BarChartIcon,
    RefreshIcon,
    AlertCircleIcon,
    CheckCircleIcon,
    WhatsAppIcon,
    FileTextIcon
} from '../components/Common/Icons';

export function Recap() {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [recapData, setRecapData] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'aman', 'waspada', 'kritis'
    const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'matrix'
    const [exportingExcel, setExportingExcel] = useState(false);
    const [exportingCSV, setExportingCSV] = useState(false);
    const [copyingWA, setCopyingWA] = useState(false);

    const loadRecap = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getAttendanceRecap();
            setRecapData(sortStudentsByName(data.recap || []));
            setSessions(data.sessions || []);
        } catch (err) {
            console.error('Error loading recap:', err);
            addToast('Gagal memuat rekapitulasi kehadiran.', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadRecap();
    }, [loadRecap]);

    const handleExportExcel = async () => {
        try {
            setExportingExcel(true);
            addToast('Menyiapkan file Excel rekap kehadiran resmi...', 'info');
            await api.exportExcel();
            addToast('Berkas Excel berhasil diunduh. Siap dikirim ke dosen pengampu.', 'success');
        } catch (err) {
            addToast(err.message || 'Gagal mengunduh file Excel.', 'error');
        } finally {
            setExportingExcel(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            setExportingCSV(true);
            addToast('Menyiapkan berkas CSV...', 'info');
            await api.exportCSV();
            addToast('Berkas CSV berhasil diunduh.', 'success');
        } catch (err) {
            addToast(err.message || 'Gagal mengunduh berkas CSV.', 'error');
        } finally {
            setExportingCSV(false);
        }
    };

    const handleCopyClassWASummary = async () => {
        try {
            setCopyingWA(true);
            const lines = [
                `*REKAPITULASI KEHADIRAN KELAS TI25C*`,
                `*Mata Kuliah:* Statistika dan Probabilitas`,
                `*Total Sesi Pertemuan:* ${sessions.length} Pertemuan`,
                `*Rata-rata Kehadiran Kelas:* ${averagePercentage}%`,
                `*Lolos Syarat UTS & UAS (>= 45%):* ${totalAman + totalWaspada} Mahasiswa`,
                `*Kritis (< 45%):* ${totalKritis} Mahasiswa`,
                ``,
                `*Daftar Status Kehadiran Mahasiswa:*`
            ];

            recapData.forEach((s, idx) => {
                const uas = getUASStatus(s.percentage || 0);
                const mark = uas.type === 'kritis' ? '[KRITIS]' : (uas.type === 'waspada' ? '[WASPADA]' : '[AMAN]');
                lines.push(`${idx + 1}. ${s.name}: ${s.percentage}% (${s.counts?.hadir || 0}H, ${s.counts?.izin || 0}I, ${s.counts?.sakit || 0}S, ${s.counts?.alpha || 0}A) ${mark}`);
            });

            lines.push(``);
            lines.push(`_Diekspor otomatis dari Sistem Presensi Statistika TI25C - PJ MK_`);

            await navigator.clipboard.writeText(lines.join('\n'));
            addToast('Format rekap WhatsApp berhasil disalin ke clipboard! Siap dikirim ke dosen.', 'success');
        } catch (err) {
            addToast('Gagal menyalin format pesan WhatsApp.', 'error');
        } finally {
            setCopyingWA(false);
        }
    };

    const getUASStatus = (percentage) => {
        if (percentage < 45) {
            return {
                type: 'kritis',
                label: 'Kritis (< 45%)',
                badgeClass: 'badge-alpha',
                desc: 'Tidak memenuhi syarat UTS & UAS'
            };
        }
        if (percentage < 60) {
            return {
                type: 'waspada',
                label: 'Waspada (45-59%)',
                badgeClass: 'badge-warning',
                desc: 'Mendekati batas minimal 45%'
            };
        }
        return {
            type: 'aman',
            label: 'Aman (>= 60%)',
            badgeClass: 'badge-hadir',
            desc: 'Memenuhi syarat UTS & UAS'
        };
    };

    const isAdmin = user?.role === 'admin';

    // Filter data based on role: Mahasiswa HANYA melihat data miliknya sendiri
    const displayedRecap = isAdmin
        ? recapData.filter((item) => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
            const uas = getUASStatus(item.percentage || 0);
            let matchesStatus = true;
            if (statusFilter === 'aman') matchesStatus = uas.type === 'aman';
            else if (statusFilter === 'waspada') matchesStatus = uas.type === 'waspada';
            else if (statusFilter === 'kritis') matchesStatus = uas.type === 'kritis';
            return matchesSearch && matchesStatus;
        })
        : recapData.filter((item) => {
            // Strict privacy: hanya akun pemilik
            if (user?.id && item.id === user.id) return true;
            if (user?.name && item.name.trim().toLowerCase() === user.name.trim().toLowerCase()) return true;
            return false;
        });

    // Counts for stats (Admin view)
    const totalAman = recapData.filter(i => (i.percentage || 0) >= 60).length;
    const totalWaspada = recapData.filter(i => (i.percentage || 0) >= 45 && (i.percentage || 0) < 60).length;
    const totalKritis = recapData.filter(i => (i.percentage || 0) < 45).length;

    // Calculate class average
    const averagePercentage =
        recapData.length > 0
            ? Math.round(
                  recapData.reduce((acc, curr) => acc + (curr.percentage || 0), 0) /
                      recapData.length
              )
            : 0;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'hadir':
                return <span className="badge-status badge-hadir">H</span>;
            case 'izin':
                return <span className="badge-status badge-izin">I</span>;
            case 'sakit':
                return <span className="badge-status badge-sakit">S</span>;
            case 'alpha':
                return <span className="badge-status badge-alpha">A</span>;
            default:
                return <span style={{ color: 'var(--color-text-muted)' }}>-</span>;
        }
    };

    const studentItem = !isAdmin && displayedRecap.length > 0
        ? displayedRecap[0]
        : (!isAdmin && recapData.length === 1 ? recapData[0] : null);

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 className="page-title">{isAdmin ? 'Rekapitulasi Kehadiran Kelas' : 'Rekapitulasi Kehadiran Pribadi'}</h1>
                    <p className="page-subtitle">
                        {isAdmin
                            ? 'Daftar kehadiran seluruh mahasiswa Mata Kuliah Statistika - Kelas TI25C dengan evaluasi syarat minimal UTS & UAS (45%)'
                            : `Rekapitulasi resmi kehadiran perkuliahan untuk ${user?.name || 'Mahasiswa'}. Sesuai kebijakan privasi kelas, hanya data kehadiran Anda yang ditampilkan.`}
                    </p>
                </div>

                {isAdmin && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={handleExportExcel}
                            disabled={exportingExcel}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: '#10B981',
                                borderColor: '#10B981',
                                color: '#ffffff',
                                fontWeight: 600
                            }}
                            title="Unduh format Excel resmi untuk dikirim ke Dosen Pengampu"
                        >
                            <DownloadIcon size={16} />
                            <span>{exportingExcel ? 'Menyiapkan...' : 'Ekspor Excel (.xlsx)'}</span>
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={handleExportCSV}
                            disabled={exportingCSV}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            title="Unduh berkas CSV"
                        >
                            <DownloadIcon size={16} />
                            <span>{exportingCSV ? 'Mengunduh...' : 'Unduh CSV'}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Banner Aksi Ekspor untuk Dosen Pengampu (Khusus Admin) */}
            {isAdmin && (
                <div className="card" style={{
                    background: 'var(--color-bg-hover)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px 20px',
                    marginBottom: '20px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ flex: '1 1 300px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <span className="badge-status badge-hadir" style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px' }}>
                                    Dokumen Akademik Resmi Dosen
                                </span>
                                <span style={{ fontSize: '0.813rem', color: 'var(--color-text-muted)' }}>
                                    Statistika & Probabilitas - TI25C
                                </span>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                                Ekspor Rekapitulasi Kehadiran Mahasiswa
                            </h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.813rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                Berkas Excel (.xlsx) diformat khusus untuk diserahkan ke Dosen Pengampu, mencakup kop akademik resmi, data pertemuan P1 s/d P{sessions.length || 'n'}, total H/I/S/A, persentase kehadiran, dan status syarat kelayakan UTS & UAS (&gt;= 45%).
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleExportExcel}
                                disabled={exportingExcel}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 18px',
                                    fontWeight: 600,
                                    backgroundColor: '#10B981',
                                    borderColor: '#10B981',
                                    color: '#ffffff'
                                }}
                            >
                                <DownloadIcon size={18} />
                                <span>{exportingExcel ? 'Menyiapkan Excel...' : 'Ekspor ke Excel (.xlsx)'}</span>
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleExportCSV}
                                disabled={exportingCSV}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }}
                            >
                                <DownloadIcon size={16} />
                                <span>Unduh CSV</span>
                            </button>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={handleCopyClassWASummary}
                                disabled={copyingWA}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 14px' }}
                                title="Salin ringkasan kehadiran seluruh mahasiswa untuk dikirim ke WhatsApp dosen"
                            >
                                <WhatsAppIcon size={16} />
                                <span>{copyingWA ? 'Menyalin...' : 'Salin Format WA Dosen'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ringkasan Statistik */}
            {isAdmin ? (
                <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div className="stat-card">
                        <div className="stat-icon primary">
                            <BarChartIcon size={22} />
                        </div>
                        <div className="stat-info">
                            <h3 style={{ color: 'var(--color-accent)' }}>{averagePercentage}%</h3>
                            <p>Rata-rata Kehadiran Kelas</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon success">
                            <CheckCircleIcon size={22} />
                        </div>
                        <div className="stat-info">
                            <h3>{totalAman + totalWaspada}</h3>
                            <p>Lolos Syarat UTS & UAS (&gt;= 45%)</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon warning">
                            <AlertCircleIcon size={22} />
                        </div>
                        <div className="stat-info">
                            <h3>{totalWaspada}</h3>
                            <p>Waspada (45% - 59%)</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon danger">
                            <AlertCircleIcon size={22} />
                        </div>
                        <div className="stat-info">
                            <h3 style={{ color: 'var(--color-danger)' }}>{totalKritis}</h3>
                            <p>Kritis / Tidak Lolos (&lt; 45%)</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div className="stat-card">
                        <div className="stat-icon primary">
                            <BarChartIcon size={22} />
                        </div>
                        <div className="stat-info">
                            <h3 style={{ color: 'var(--color-accent)' }}>{studentItem?.percentage ?? 0}%</h3>
                            <p>Persentase Kehadiran Anda</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon success">
                            <CheckCircleIcon size={22} />
                        </div>
                        <div className="stat-info">
                            <h3>{studentItem?.counts?.hadir ?? 0} Sesi</h3>
                            <p>Hadir Mengikuti Kelas</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon warning">
                            <AlertCircleIcon size={22} />
                        </div>
                        <div className="stat-info">
                            <h3>{(studentItem?.counts?.izin ?? 0) + (studentItem?.counts?.sakit ?? 0)} Sesi</h3>
                            <p>Izin ({studentItem?.counts?.izin ?? 0}) & Sakit ({studentItem?.counts?.sakit ?? 0})</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon danger">
                            <AlertCircleIcon size={22} />
                        </div>
                        <div className="stat-info">
                            <h3 style={{ color: (studentItem?.counts?.alpha ?? 0) > 0 ? 'var(--color-danger)' : 'var(--color-text)' }}>
                                {studentItem?.counts?.alpha ?? 0} Sesi
                            </h3>
                            <p>Alpha / Tanpa Keterangan</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Visual Milestone UTS & UAS 45% Progress Tracker (Tingkat Kematangan UX 9.8) */}
            {!isAdmin && studentItem && (
                <div className="uas-progress-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                                    Simulator &amp; Status Kelayakan UTS &amp; UAS (Batas Minimal 45%)
                                </h3>
                                <span className={`badge-status ${getUASStatus(studentItem.percentage || 0).badgeClass}`}>
                                    {getUASStatus(studentItem.percentage || 0).label}
                                </span>
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.813rem', color: 'var(--color-text-secondary)' }}>
                                Syarat mutlak mengikuti UTS &amp; UAS Statistika adalah minimal 45% kehadiran (minimal 4 dari 8 sesi UTS, 8 dari 16 pertemuan UAS)
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                                {studentItem.counts?.hadir || 0} / 16 Sesi
                            </span>
                            <span style={{ fontSize: '0.813rem', color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                                ({studentItem.percentage || 0}%)
                            </span>
                        </div>
                    </div>

                    {/* Bar Visual dengan Penanda Batas Merah 45% */}
                    <div className="uas-bar-outer">
                        <div className="uas-milestone-marker" />
                        <div className="uas-milestone-label">Batas 45% (8 Sesi UAS / 4 Sesi UTS)</div>
                        <div
                            className={`uas-bar-inner ${
                                (studentItem.percentage || 0) >= 60 ? 'success' : (studentItem.percentage || 0) >= 45 ? 'warning' : 'danger'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(4, studentItem.percentage || 0))}%` }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '0.813rem', color: 'var(--color-text-secondary)' }}>
                        <div>
                            {(studentItem.counts?.hadir || 0) >= 8 ? (
                                <span style={{ color: 'var(--color-status-hadir)', fontWeight: 600 }}>
                                    Status Aman: Kehadiran Anda telah melampaui batas minimal 45% (siap mengikuti UTS &amp; UAS).
                                </span>
                            ) : (
                                <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                                    Perhatian: Anda butuh hadir di minimal {Math.max(0, 8 - (studentItem.counts?.hadir || 0))} sesi lagi untuk batas 45% UAS (atau {Math.max(0, 4 - (studentItem.counts?.hadir || 0))} sesi lagi untuk UTS).
                                </span>
                            )}
                        </div>
                        <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                            Target: 8 Sesi (UAS) / 4 Sesi (UTS) | Tercapai: {studentItem.counts?.hadir || 0} Sesi
                        </div>
                    </div>
                </div>
            )}

            {/* Filter & Navigasi Tampilan */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    {isAdmin ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px' }}>
                            <div style={{ position: 'relative', width: '100%' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Cari nama mahasiswa..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ paddingLeft: '36px' }}
                                />
                                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                                    <SearchIcon size={16} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="badge-status badge-hadir" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                                Privasi Terjaga
                            </span>
                            <span style={{ fontSize: '0.813rem', color: 'var(--color-text-secondary)' }}>
                                Menampilkan rekapitulasi akun {user?.name}
                            </span>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Filter Status Syarat UAS (Admin Only) */}
                        {isAdmin && (
                            <div style={{ display: 'flex', gap: '4px', background: 'var(--color-bg-hover)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => setStatusFilter('all')}
                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                >
                                    Semua ({recapData.length})
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${statusFilter === 'aman' ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => setStatusFilter('aman')}
                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                >
                                    Aman ({totalAman})
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${statusFilter === 'waspada' ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => setStatusFilter('waspada')}
                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                >
                                    Waspada ({totalWaspada})
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-sm ${statusFilter === 'kritis' ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => setStatusFilter('kritis')}
                                    style={{ padding: '4px 10px', fontSize: '0.75rem', color: statusFilter === 'kritis' ? '#ffffff' : 'var(--color-danger)' }}
                                >
                                    Kritis &lt; 45% ({totalKritis})
                                </button>
                            </div>
                        )}

                        <div className="tabs" style={{ margin: 0, borderBottom: 'none' }}>
                            <button
                                type="button"
                                className={`tab ${viewMode === 'summary' ? 'active' : ''}`}
                                onClick={() => setViewMode('summary')}
                            >
                                Tabel Ringkasan
                            </button>
                            <button
                                type="button"
                                className={`tab ${viewMode === 'matrix' ? 'active' : ''}`}
                                onClick={() => setViewMode('matrix')}
                            >
                                Matriks Pertemuan
                            </button>
                        </div>

                        {isAdmin && (
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={handleExportExcel}
                                disabled={exportingExcel}
                                title="Ekspor rekapitulasi ke Excel (.xlsx)"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                                <DownloadIcon size={14} />
                                <span>{exportingExcel ? 'Menyiapkan...' : 'Ekspor Excel'}</span>
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={loadRecap}
                            title="Segarkan data"
                        >
                            <RefreshIcon size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabel Konten */}
            {loading ? (
                <div className="card" style={{ padding: '24px' }}>
                    <div className="skeleton skeleton-title" style={{ width: '35%', height: '18px' }} />
                    <div className="skeleton skeleton-text" style={{ width: '60%', marginBottom: '24px' }} />
                    <div className="skeleton skeleton-box" style={{ height: '44px', marginBottom: '8px' }} />
                    <div className="skeleton skeleton-box" style={{ height: '44px', marginBottom: '8px' }} />
                    <div className="skeleton skeleton-box" style={{ height: '44px', marginBottom: '8px' }} />
                    <div className="skeleton skeleton-box" style={{ height: '44px' }} />
                </div>
            ) : displayedRecap.length === 0 ? (
                <div className="card empty-state" style={{ padding: '48px 16px' }}>
                    <BarChartIcon size={48} />
                    <h3>Tidak Ada Data Mahasiswa Sesuai Filter</h3>
                    <p>Coba ubah kata kunci pencarian atau pilih filter status lainnya.</p>
                </div>
            ) : viewMode === 'summary' ? (
                /* Tabel Ringkasan */
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '48px' }}>No</th>
                                <th>Nama Mahasiswa</th>
                                <th style={{ textAlign: 'center' }}>Hadir</th>
                                <th style={{ textAlign: 'center' }}>Izin</th>
                                <th style={{ textAlign: 'center' }}>Sakit</th>
                                <th style={{ textAlign: 'center' }}>Alpha</th>
                                <th style={{ textAlign: 'center' }}>Persentase</th>
                                <th style={{ textAlign: 'center' }}>Status Syarat UTS &amp; UAS (Min 45%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedRecap.map((item, index) => {
                                const uas = getUASStatus(item.percentage || 0);
                                return (
                                    <tr key={item.id}>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-muted)' }}>{index + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                                        <td style={{ textAlign: 'center', color: 'var(--color-status-hadir)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                            {item.counts.hadir}
                                        </td>
                                        <td style={{ textAlign: 'center', color: 'var(--color-status-izin)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                            {item.counts.izin}
                                        </td>
                                        <td style={{ textAlign: 'center', color: 'var(--color-status-sakit)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                            {item.counts.sakit}
                                        </td>
                                        <td style={{ textAlign: 'center', color: 'var(--color-status-alpha)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                            {item.counts.alpha}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.938rem', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{item.percentage}%</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`badge-status ${uas.badgeClass}`} style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                                                {uas.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Tabel Matriks Rekapitulasi (Mahasiswa x Pertemuan) */
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '48px' }}>No</th>
                                <th style={{ minWidth: '180px' }}>Nama Mahasiswa</th>
                                {sessions.length === 0 ? (
                                    <th style={{ textAlign: 'center' }}>Belum Ada Pertemuan</th>
                                ) : (
                                    sessions.map((s) => (
                                        <th key={s.id} style={{ textAlign: 'center', minWidth: '40px' }} title={`Pertemuan ${s.meeting_number}: ${s.title}`}>
                                            P{s.meeting_number}
                                        </th>
                                    ))
                                )}
                                <th style={{ textAlign: 'center', minWidth: '70px' }}>Hadir</th>
                                <th style={{ textAlign: 'center', minWidth: '80px' }}>Persentase</th>
                                <th style={{ textAlign: 'center', minWidth: '110px' }}>Status UAS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedRecap.map((item, index) => {
                                const uas = getUASStatus(item.percentage || 0);
                                return (
                                    <tr key={item.id}>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-muted)' }}>{index + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                                        {sessions.length === 0 ? (
                                            <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>-</td>
                                        ) : (
                                            sessions.map((s) => (
                                                <td key={s.id} style={{ textAlign: 'center', padding: '6px' }}>
                                                    {getStatusBadge(item.attendanceMap?.[s.id])}
                                                </td>
                                            ))
                                        )}
                                        <td style={{ textAlign: 'center', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                                            {item.counts.hadir}
                                        </td>
                                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                                            {item.percentage}%
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`badge-status ${uas.badgeClass}`} style={{ fontSize: '0.688rem', padding: '2px 8px' }}>
                                                {uas.type === 'kritis' ? '< 45%' : uas.type === 'waspada' ? 'Waspada' : 'Lolos'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
