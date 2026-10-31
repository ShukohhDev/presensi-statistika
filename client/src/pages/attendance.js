/**
 * =============================================================================
 * attendance.js - Halaman Presensi Mahasiswa (Vanilla JavaScript)
 * =============================================================================
 */

import { api } from '../utils/api.js';
import { getState } from '../state.js';
import { showToast } from '../toast.js';
import { getIcon } from '../icons.js';

let countdownInterval = null;

export async function renderAttendancePage(container, navigate) {
    // Clear any existing countdown timer
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <!-- Page Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div>
                    <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin: 0 0 4px;">
                        Presensi Perkuliahan
                    </h1>
                    <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin: 0;">
                        Mata Kuliah Statistika • Kelas TI25C
                    </p>
                </div>

                <div id="course-info-badge" style="
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 12px;
                    border-radius: 6px;
                    background: var(--color-bg-card, #ffffff);
                    border: 1px solid var(--color-border, #edebe9);
                    font-size: 0.8rem;
                    color: var(--color-text-secondary);
                ">
                    <span>Dosen: <strong>Rifqi Hidayat</strong></span>
                    <span>•</span>
                    <span>Kamis, 13:00 WIB</span>
                </div>
            </div>

            <!-- Active Session Card Container -->
            <div id="session-card-container">
                <div class="card" style="padding: 24px; text-align: center; border-radius: 10px;">
                    <div style="font-size: 0.875rem; color: var(--color-text-secondary);">Memeriksa status sesi presensi...</div>
                </div>
            </div>

            <!-- Attendance Submission Form Container -->
            <div id="attendance-form-container" style="display: none;"></div>

            <!-- Attendance Summary & Stats -->
            <div id="attendance-summary-container"></div>
        </div>
    `;

    loadAttendanceData(container, navigate);
}

async function loadAttendanceData(container, navigate) {
    const sessionCardBox = container.querySelector('#session-card-container');
    const formBox = container.querySelector('#attendance-form-container');
    const summaryBox = container.querySelector('#attendance-summary-container');

    try {
        const [sessionData, summaryData, courseData] = await Promise.all([
            api.getActiveSession().catch(() => ({ session: null })),
            api.getAttendanceSummary().catch(() => ({ summary: { percentage: 0, present: 0, sick: 0, permit: 0, total_sessions: 0 } })),
            api.getCourseInfo().catch(() => ({}))
        ]);

        const session = sessionData?.session;
        const myAttendance = sessionData?.user_attendance;

        // Render Session Card
        renderActiveSessionCard(sessionCardBox, session, myAttendance);

        // Render Form if session active & not yet submitted
        if (session && session.is_active) {
            renderAttendanceForm(formBox, session, myAttendance, () => {
                loadAttendanceData(container, navigate);
            });
        } else {
            formBox.style.display = 'none';
        }

        // Render Summary
        renderSummaryCards(summaryBox, summaryData?.summary || summaryData);

    } catch (err) {
        console.error('Error loading attendance:', err);
        sessionCardBox.innerHTML = `
            <div class="card" style="padding: 20px; border-radius: 10px; border-left: 4px solid #ef4444;">
                <div style="font-weight: 600; color: #dc2626; margin-bottom: 4px;">Gagal Memuat Status Sesi</div>
                <div style="font-size: 0.825rem; color: var(--color-text-secondary);">${err.message || 'Silakan muat ulang halaman.'}</div>
            </div>
        `;
    }
}

function renderActiveSessionCard(container, session, myAttendance) {
    if (!session || !session.is_active) {
        container.innerHTML = `
            <div class="card" style="
                padding: 28px 24px;
                border-radius: 10px;
                background: var(--color-bg-card, #ffffff);
                border: 1px solid var(--color-border, #edebe9);
                text-align: center;
            ">
                <div style="
                    display: inline-flex;
                    padding: 4px 12px;
                    border-radius: 9999px;
                    background: var(--color-bg, #f3f2f1);
                    color: var(--color-text-secondary);
                    font-size: 0.75rem;
                    font-weight: 600;
                    margin-bottom: 12px;
                ">
                    Belum Ada Sesi Dibuka
                </div>
                <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--color-text); margin: 0 0 6px;">
                    Presensi Belum Dimulai
                </h2>
                <p style="font-size: 0.85rem; color: var(--color-text-secondary); max-width: 480px; margin: 0 auto 16px; line-height: 1.5;">
                    Sesi presensi perkuliahan Statistika akan dibuka oleh PJ MK atau Dosen saat jam perkuliahan berlangsung.
                </p>
                <div style="font-size: 0.8rem; color: var(--color-text-muted);">
                    Jadwal Reguler: Setiap Kamis • 13:00 - 15:30 WIB • G. Mahdor R. C 306
                </div>
            </div>
        `;
        return;
    }

    // Session is ACTIVE
    const isManual = session.attendance_mode === 'manual';
    const isSelf = session.attendance_mode === 'self' || !session.attendance_mode;

    container.innerHTML = `
        <div class="card" style="
            padding: 24px;
            border-radius: 10px;
            background: linear-gradient(to right, rgba(16, 124, 65, 0.05), transparent), var(--color-bg-card, #ffffff);
            border: 1px solid var(--color-primary, #107C41);
            position: relative;
            overflow: hidden;
        ">
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 6px;
                height: 100%;
                background: var(--color-primary, #107C41);
            "></div>

            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
                <div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span style="
                            padding: 3px 10px;
                            border-radius: 9999px;
                            background: #dcfce7;
                            color: #15803d;
                            font-size: 0.72rem;
                            font-weight: 700;
                            display: inline-flex;
                            align-items: center;
                            gap: 5px;
                        ">
                            <span style="width: 6px; height: 6px; border-radius: 50%; background: #15803d; animation: pulse 1.5s infinite;"></span>
                            Sesi Aktif
                        </span>
                        <span style="font-size: 0.8rem; font-weight: 600; color: var(--color-primary);">
                            Pertemuan ${session.meeting_number || '1'}
                        </span>
                    </div>

                    <h2 style="font-size: 1.35rem; font-weight: 700; color: var(--color-text); margin: 0 0 6px;">
                        ${session.title || `Pertemuan Ke-${session.meeting_number || '1'}`}
                    </h2>
                    <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin: 0;">
                        Mode: <strong>${isManual ? 'Presensi Manual (Dicatat PJ MK)' : 'Presensi Mandiri'}</strong>
                    </p>
                </div>

                <!-- Timer countdown -->
                <div style="
                    background: var(--color-bg, #f3f2f1);
                    border: 1px solid var(--color-border);
                    border-radius: 8px;
                    padding: 10px 16px;
                    text-align: right;
                ">
                    <div style="font-size: 0.72rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 600;">
                        Sisa Waktu Sesi
                    </div>
                    <div id="session-countdown-timer" style="font-size: 1.4rem; font-weight: 700; color: var(--color-primary); font-family: var(--font-mono, monospace);">
                        --:--
                    </div>
                </div>
            </div>

            ${isManual ? `
                <div style="
                    margin-top: 16px;
                    padding: 12px 14px;
                    border-radius: 8px;
                    background: #eff6ff;
                    border: 1px solid #bfdbfe;
                    color: #1e40af;
                    font-size: 0.825rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 10px;
                ">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>ℹ️</span>
                        <span>Presensi pada sesi ini dicatat langsung secara manual oleh <strong>PJ MK (Faqih Hidayatus Salam)</strong>.</span>
                    </div>
                    <a
                        href="https://wa.me/6282316188656?text=Halo%20PJ%20MK%20Faqih%2C%20saya%20sudah%20hadir%20di%20kelas%20Statistika"
                        target="_blank"
                        class="btn btn-sm"
                        style="background: #2563eb; color: #ffffff; padding: 6px 12px; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 0.78rem;"
                    >
                        Konfirmasi ke WhatsApp PJ MK
                    </a>
                </div>
            ` : ''}

            ${myAttendance ? `
                <div style="
                    margin-top: 16px;
                    padding: 12px 14px;
                    border-radius: 8px;
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    color: #166534;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <span style="font-size: 1.2rem;">✓</span>
                    <div>
                        <strong>Anda Sudah Mengisi Presensi untuk Sesi Ini!</strong>
                        <div style="font-size: 0.78rem; opacity: 0.9; margin-top: 2px;">
                            Status: <span style="font-weight: 700; text-transform: uppercase;">${myAttendance.status}</span> • Waktu: ${myAttendance.time ? myAttendance.time : 'Hari Ini'}
                        </div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    // Start timer countdown
    startTimer(session.opened_at || session.created_at, session.duration_minutes || 60);
}

function startTimer(openedAtStr, durationMinutes) {
    const timerEl = document.getElementById('session-countdown-timer');
    if (!timerEl) return;

    const startTime = openedAtStr ? new Date(openedAtStr).getTime() : Date.now();
    const endTime = startTime + (durationMinutes * 60 * 1000);

    const update = () => {
        const remaining = Math.max(0, endTime - Date.now());
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);

        timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        if (remaining <= 0) {
            timerEl.textContent = '00:00 (Selesai)';
            clearInterval(countdownInterval);
        }
    };

    update();
    countdownInterval = setInterval(update, 1000);
}

function renderAttendanceForm(container, session, myAttendance, onSubmitted) {
    // If user already submitted, do not show form
    if (myAttendance) {
        container.style.display = 'none';
        return;
    }

    // If manual mode, do not show self form
    if (session.attendance_mode === 'manual') {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    container.innerHTML = `
        <div class="card" style="
            padding: 24px;
            border-radius: 10px;
            background: var(--color-bg-card, #ffffff);
            border: 1px solid var(--color-border, #edebe9);
        ">
            <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--color-text); margin: 0 0 16px;">
                Formulir Pengisian Presensi
            </h3>

            <form id="attendance-submit-form">
                <!-- Status Picker -->
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; color: var(--color-text); margin-bottom: 8px;">
                        Pilih Status Kehadiran
                    </label>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                        <label class="status-option-label" style="
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 10px;
                            border: 2px solid var(--color-primary, #107C41);
                            background: rgba(16, 124, 65, 0.08);
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 0.85rem;
                            font-weight: 600;
                            color: var(--color-primary, #107C41);
                            transition: all 0.15s ease;
                        ">
                            <input type="radio" name="status" value="hadir" checked style="display: none;" />
                            <span>Hadir</span>
                        </label>

                        <label class="status-option-label" style="
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 10px;
                            border: 1px solid var(--color-border);
                            background: var(--color-bg-card);
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 0.85rem;
                            font-weight: 600;
                            color: var(--color-text);
                            transition: all 0.15s ease;
                        ">
                            <input type="radio" name="status" value="izin" style="display: none;" />
                            <span>Izin</span>
                        </label>

                        <label class="status-option-label" style="
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            padding: 10px;
                            border: 1px solid var(--color-border);
                            background: var(--color-bg-card);
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 0.85rem;
                            font-weight: 600;
                            color: var(--color-text);
                            transition: all 0.15s ease;
                        ">
                            <input type="radio" name="status" value="sakit" style="display: none;" />
                            <span>Sakit</span>
                        </label>
                    </div>
                </div>

                <!-- Photo Upload / Selfie -->
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; color: var(--color-text); margin-bottom: 8px;">
                        Unggah Bukti Kehadiran / Foto Selfie di Kelas (Opsional)
                    </label>
                    <div style="
                        border: 2px dashed var(--color-border);
                        border-radius: 8px;
                        padding: 20px;
                        text-align: center;
                        position: relative;
                        background: var(--color-bg, #f3f2f1);
                    ">
                        <input
                            type="file"
                            id="photo-file-input"
                            accept="image/*"
                            style="position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;"
                        />
                        <div id="photo-preview-box">
                            <div style="margin-bottom: 6px; color: var(--color-text-secondary);">
                                ${getIcon('camera', 'w-8 h-8 mx-auto')}
                            </div>
                            <div style="font-size: 0.85rem; font-weight: 600; color: var(--color-text);">
                                Klik atau Seret Foto ke Sini
                            </div>
                            <div style="font-size: 0.72rem; color: var(--color-text-secondary); margin-top: 2px;">
                                Format JPG, PNG, atau WEBP (Maksimal 5MB)
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Notes Input -->
                <div style="margin-bottom: 20px;">
                    <label for="attendance-notes" style="display: block; font-size: 0.825rem; font-weight: 600; color: var(--color-text); margin-bottom: 6px;">
                        Catatan Tambahan (Opsional)
                    </label>
                    <input
                        type="text"
                        id="attendance-notes"
                        class="form-input"
                        placeholder="Contoh: Sakit flu disertai surat dokter / Izin kegiatan fakultas"
                        style="width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text); font-size: 0.85rem;"
                    />
                </div>

                <button
                    type="submit"
                    id="btn-submit-attendance"
                    class="btn btn-primary"
                    style="
                        width: 100%;
                        padding: 12px;
                        border-radius: 8px;
                        border: none;
                        background: var(--color-primary, #107C41);
                        color: #ffffff;
                        font-size: 0.925rem;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                    "
                >
                    ${getIcon('check', 'w-5 h-5')}
                    <span>Kirim Presensi Sekarang</span>
                </button>
            </form>
        </div>
    `;

    // Radio status click handling
    const labels = container.querySelectorAll('.status-option-label');
    labels.forEach(label => {
        label.addEventListener('click', () => {
            labels.forEach(l => {
                l.style.border = '1px solid var(--color-border)';
                l.style.background = 'var(--color-bg-card)';
                l.style.color = 'var(--color-text)';
            });
            label.style.border = '2px solid var(--color-primary, #107C41)';
            label.style.background = 'rgba(16, 124, 65, 0.08)';
            label.style.color = 'var(--color-primary, #107C41)';
            label.querySelector('input').checked = true;
        });
    });

    // File Preview
    const fileInput = container.querySelector('#photo-file-input');
    const previewBox = container.querySelector('#photo-preview-box');
    let selectedFile = null;

    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            const reader = new FileReader();
            reader.onload = (ev) => {
                previewBox.innerHTML = `
                    <img src="${ev.target.result}" style="max-height: 120px; border-radius: 6px; margin: 0 auto 8px; object-fit: contain;" />
                    <div style="font-size: 0.78rem; font-weight: 600; color: var(--color-text);">${file.name}</div>
                    <div style="font-size: 0.7rem; color: var(--color-primary); cursor: pointer; margin-top: 4px;">Klik untuk ganti foto</div>
                `;
            };
            reader.readAsDataURL(file);
        }
    });

    // Submit handler
    const form = container.querySelector('#attendance-submit-form');
    const submitBtn = container.querySelector('#btn-submit-attendance');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusVal = form.querySelector('input[name="status"]:checked')?.value || 'hadir';
        const notesVal = container.querySelector('#attendance-notes')?.value?.trim() || '';

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span>Memproses presensi...</span>`;

            const formData = new FormData();
            formData.append('session_id', session.id);
            formData.append('status', statusVal);
            if (notesVal) formData.append('notes', notesVal);
            if (selectedFile) formData.append('photo', selectedFile);

            await api.submitAttendance(formData);
            showToast('Presensi berhasil dikirim!', 'success');
            onSubmitted();
        } catch (err) {
            showToast(err.message || 'Gagal mengirim presensi', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                ${getIcon('check', 'w-5 h-5')}
                <span>Kirim Presensi Sekarang</span>
            `;
        }
    });
}

function renderSummaryCards(container, summary) {
    const present = summary.present || 0;
    const sick = summary.sick || 0;
    const permit = summary.permit || 0;
    const total = summary.total_sessions || 0;
    const percent = summary.percentage !== undefined ? summary.percentage : (total > 0 ? Math.round((present / total) * 100) : 0);

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
            <div class="card" style="padding: 16px; border-radius: 8px; background: var(--color-bg-card, #ffffff); border: 1px solid var(--color-border, #edebe9);">
                <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 600;">
                    Tingkat Kehadiran
                </div>
                <div style="font-size: 1.6rem; font-weight: 700; color: var(--color-primary, #107C41); margin-top: 4px;">
                    ${percent}%
                </div>
                <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 2px;">
                    Dari total ${total} pertemuan dibuka
                </div>
            </div>

            <div class="card" style="padding: 16px; border-radius: 8px; background: var(--color-bg-card, #ffffff); border: 1px solid var(--color-border, #edebe9);">
                <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 600;">
                    Total Hadir
                </div>
                <div style="font-size: 1.6rem; font-weight: 700; color: var(--color-text); margin-top: 4px;">
                    ${present} Sesi
                </div>
                <div style="font-size: 0.72rem; color: #15803d; margin-top: 2px;">
                    Status tervalidasi
                </div>
            </div>

            <div class="card" style="padding: 16px; border-radius: 8px; background: var(--color-bg-card, #ffffff); border: 1px solid var(--color-border, #edebe9);">
                <div style="font-size: 0.75rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 600;">
                    Izin & Sakit
                </div>
                <div style="font-size: 1.6rem; font-weight: 700; color: var(--color-text); margin-top: 4px;">
                    ${permit + sick} Sesi
                </div>
                <div style="font-size: 0.72rem; color: var(--color-text-muted); margin-top: 2px;">
                    ${permit} Izin • ${sick} Sakit
                </div>
            </div>
        </div>
    `;
}
