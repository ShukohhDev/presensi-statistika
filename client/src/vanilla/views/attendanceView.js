/**
 * =============================================================================
 * attendanceView.js - Halaman Utama Presensi Mahasiswa (Vanilla JavaScript)
 * =============================================================================
 * Menampilkan status presensi, hitung mundur sesi, formulir presensi mandiri,
 * tombol WhatsApp PJ MK Faqih, dan informasi mata kuliah statistika.
 * =============================================================================
 */

import { api } from '../api.js';
import { getState } from '../state.js';
import { showToast } from '../toast.js';
import { whatsAppIcon, clockIcon, checkCircleIcon } from '../icons.js';
import presensiSticker from '../../assets/presensi-masuk-boskyuh.png';

let countdownInterval = null;

export async function renderAttendance(container, navigate) {
    // Bersihkan timer countdown sebelumnya jika ada
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    container.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 200px;">
            <div class="spinner"></div>
        </div>
    `;

    try {
        const [sessionData, courseData, summaryData] = await Promise.all([
            api.getActiveSession().catch(() => ({ session: null, attendance: null })),
            api.getCourseInfo().catch(() => ({ info: null })),
            api.getAttendanceSummary().catch(() => ({ summary: null })),
        ]);

        const session = sessionData?.session;
        const attendance = sessionData?.attendance;
        const info = courseData?.info || {
            lecturer_name: 'Dosen Pengampu Statistika',
            schedule_day: 'Rabu',
            schedule_time: '13:00 - 15:30 WIB',
            room: 'G. Mahdor R. C 306',
            whatsapp_group_link: 'https://chat.whatsapp.com/BoluTrJnZ0p7nQ0FtONain',
            pj_whatsapp_phone: '082316188656'
        };

        const pjWhatsAppLink = `https://wa.me/6282316188656?text=${encodeURIComponent('Halo PJ MK Statistika Faqih, saya ingin bertanya terkait presensi/perkuliahan.')}`;

        container.innerHTML = `
            <div class="page-container">
                <!-- Header Halaman -->
                <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h1 class="page-title">Presensi Perkuliahan</h1>
                        <p class="page-subtitle">Mata Kuliah Statistika - Kelas TI25C</p>
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <a href="${pjWhatsAppLink}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="color: #25D366; border-color: rgba(37, 211, 102, 0.4);">
                            ${whatsAppIcon('', 16)} Hubungi PJ MK (Faqih)
                        </a>
                        <a href="${info.whatsapp_group_link}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="color: #25D366; border-color: rgba(37, 211, 102, 0.4);">
                            ${whatsAppIcon('', 16)} Grup WhatsApp
                        </a>
                    </div>
                </div>

                <!-- Kartu Status Sesi Presensi -->
                <div class="card" style="margin-bottom: 24px; position: relative; overflow: hidden;">
                    ${renderSessionContent(session, attendance, info, pjWhatsAppLink)}
                </div>

                <!-- Kartu Informasi Akademik & Pengampu -->
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h2 style="font-size: 1rem; font-weight: 600; margin: 0;">Informasi Akademik & Pengampu</h2>
                        <span class="badge badge-primary">Statistika TI25C</span>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        <div style="padding: 12px; border-radius: 8px; background-color: var(--color-bg-secondary);">
                            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 4px;">DOSEN PENGAMPU</div>
                            <div style="font-weight: 600; font-size: 0.938rem;">${info.lecturer_name}</div>
                        </div>
                        <div style="padding: 12px; border-radius: 8px; background-color: var(--color-bg-secondary);">
                            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 4px;">JADWAL PERKULIAHAN</div>
                            <div style="font-weight: 600; font-size: 0.938rem;">${info.schedule_day}, ${info.schedule_time}</div>
                        </div>
                        <div style="padding: 12px; border-radius: 8px; background-color: var(--color-bg-secondary);">
                            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 4px;">RUANG KULIAH</div>
                            <div style="font-weight: 600; font-size: 0.938rem;">${info.room}</div>
                        </div>
                    </div>
                </div>

                <!-- Pop-up Stiker Keberhasilan Presensi -->
                <div id="attendance-sticker-modal" style="display: none; position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.6); align-items: center; justify-content: center; backdrop-filter: blur(4px);">
                    <div style="background: var(--color-surface); padding: 24px; border-radius: 16px; text-align: center; max-width: 320px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);">
                        <img src="${presensiSticker}" alt="Presensi Masuk Boskyuh" style="max-width: 220px; border-radius: 12px; margin-bottom: 12px;" />
                        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--color-success); margin-bottom: 6px;">WOKEE! PRESENSI MASUK BOSKYUH!</h3>
                        <p style="font-size: 0.813rem; color: var(--color-text-muted); margin: 0;">Presensi Anda telah berhasil dicatat ke sistem.</p>
                    </div>
                </div>
            </div>
        `;

        // Pasang Event Listeners
        attachAttendanceEvents(container, session, attendance, navigate);

        // Pasang Countdown jika sesi aktif
        if (session && session.opened_at) {
            setupCountdown(container, session);
        }

    } catch (err) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px;">
                <p style="color: var(--color-danger);">Gagal memuat data presensi: ${err.message}</p>
                <button id="retry-btn" class="btn btn-primary" style="margin-top: 12px;">Coba Lagi</button>
            </div>
        `;
        container.querySelector('#retry-btn')?.addEventListener('click', () => renderAttendance(container, navigate));
    }
}

/**
 * Merender isi kartu sesi presensi
 */
function renderSessionContent(session, attendance, info, pjWhatsAppLink) {
    if (!session || session.status !== 'open') {
        return `
            <div style="text-align: center; padding: 36px 16px;">
                <div style="font-size: 2.5rem; margin-bottom: 12px;">☕</div>
                <h2 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 8px;">Belum Ada Sesi Presensi Aktif</h2>
                <p style="color: var(--color-text-muted); font-size: 0.875rem; max-width: 460px; margin: 0 auto 16px;">
                    Sesi presensi perkuliahan belum dibuka oleh Dosen / PJ MK. Anda dapat menghubungi PJ MK jika perkuliahan sudah dimulai.
                </p>
                <a href="${pjWhatsAppLink}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="color: #25D366; border-color: rgba(37, 211, 102, 0.4);">
                    ${whatsAppIcon('', 16)} Hubungi PJ MK (Faqih)
                </a>
            </div>
        `;
    }

    // Jika Mahasiswa Sudah Presensi di Sesi Ini
    if (attendance) {
        return `
            <div style="padding: 12px 0;">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
                    <span class="badge badge-success" style="font-size: 0.85rem; padding: 6px 12px;">
                        ${checkCircleIcon('', 16)} Status: Anda Sudah Melakukan Presensi (${attendance.status.toUpperCase()})
                    </span>
                    <span id="countdown-timer" class="badge badge-outline" style="font-family: var(--font-mono);">
                        ${clockIcon('', 14)} Sisa Waktu: --:--
                    </span>
                </div>

                <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 6px;">Pertemuan ke-${session.meeting_number}: ${session.title}</h2>
                <p style="color: var(--color-text-muted); font-size: 0.875rem; margin-bottom: 16px;">
                    Presensi Anda tercatat pada: <strong>${new Date(attendance.submitted_at || Date.now()).toLocaleTimeString('id-ID')} WIB</strong>
                </p>

                <div style="background-color: var(--color-bg-secondary); padding: 16px; border-radius: 8px; border-left: 4px solid var(--color-success);">
                    <div style="font-weight: 600; font-size: 0.875rem; margin-bottom: 4px;">Keterangan Status:</div>
                    <div style="font-size: 0.875rem; color: var(--color-text-secondary); text-transform: capitalize;">
                        ${attendance.status} ${attendance.note ? `- "${attendance.note}"` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Jika Mode Manual Admin (PJ MK yang absenkan)
    if (session.attendance_mode === 'admin_only') {
        return `
            <div style="padding: 12px 0;">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
                    <span class="badge badge-warning" style="font-size: 0.85rem; padding: 6px 12px;">
                        Mode Presensi: Manual oleh Dosen / PJ MK
                    </span>
                    <span id="countdown-timer" class="badge badge-outline" style="font-family: var(--font-mono);">
                        ${clockIcon('', 14)} Sisa Waktu: --:--
                    </span>
                </div>

                <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">Pertemuan ke-${session.meeting_number}: ${session.title}</h2>
                <p style="color: var(--color-text-secondary); font-size: 0.875rem; line-height: 1.5; margin-bottom: 20px;">
                    Pada sesi perkuliahan ini, presensi kehadiran dicatat dan dikelola secara <strong>MANUAL</strong> langsung oleh <strong>Dosen Pengampu / PJ MK (Faqih Hidayatus Salam)</strong>.
                </p>

                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <a href="${pjWhatsAppLink}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="color: #25D366; border-color: rgba(37, 211, 102, 0.4);">
                        ${whatsAppIcon('', 16)} Hubungi PJ MK (Faqih)
                    </a>
                    <button type="button" id="btn-to-recap" class="btn btn-primary">
                        Cek Rekap Kehadiran Saya &rarr;
                    </button>
                </div>
            </div>
        `;
    }

    // Mode Mandiri (Mahasiswa Absen Sendiri)
    return `
        <div style="padding: 12px 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
                <span class="badge badge-primary">Sesi Presensi Mandiri Aktif</span>
                <span id="countdown-timer" class="badge badge-outline" style="font-family: var(--font-mono);">
                    ${clockIcon('', 14)} Sisa Waktu: --:--
                </span>
            </div>

            <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">Pertemuan ke-${session.meeting_number}: ${session.title}</h2>
            <p style="color: var(--color-text-muted); font-size: 0.875rem; margin-bottom: 20px;">
                Silakan pilih status kehadiran Anda pada opsi di bawah ini lalu tekan tombol kirim.
            </p>

            <form id="attendance-submit-form">
                <!-- Pilihan Hadir / Izin / Sakit -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">
                    <label class="attendance-option" style="cursor: pointer; padding: 12px; border: 2px solid var(--color-border); border-radius: 8px; text-align: center;">
                        <input type="radio" name="attendance_status" value="hadir" checked style="display: none;" />
                        <div style="font-size: 1.25rem; margin-bottom: 4px;">✅</div>
                        <div style="font-weight: 600; font-size: 0.875rem;">Hadir</div>
                    </label>
                    <label class="attendance-option" style="cursor: pointer; padding: 12px; border: 2px solid var(--color-border); border-radius: 8px; text-align: center;">
                        <input type="radio" name="attendance_status" value="izin" style="display: none;" />
                        <div style="font-size: 1.25rem; margin-bottom: 4px;">📝</div>
                        <div style="font-weight: 600; font-size: 0.875rem;">Izin</div>
                    </label>
                    <label class="attendance-option" style="cursor: pointer; padding: 12px; border: 2px solid var(--color-border); border-radius: 8px; text-align: center;">
                        <input type="radio" name="attendance_status" value="sakit" style="display: none;" />
                        <div style="font-size: 1.25rem; margin-bottom: 4px;">🏥</div>
                        <div style="font-weight: 600; font-size: 0.875rem;">Sakit</div>
                    </label>
                </div>

                <!-- Bagian Form Izin / Sakit (Muncul jika dipilih) -->
                <div id="izin-sakit-details" style="display: none; margin-bottom: 16px;">
                    <div class="form-group">
                        <label class="form-label" for="attendance-note">Alasan / Catatan Izin atau Sakit</label>
                        <textarea id="attendance-note" class="form-input" rows="2" placeholder="Tuliskan keterangan detail..."></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="attendance-evidence">Foto Bukti (Surat Izin / Keterangan Dokter)</label>
                        <input type="file" id="attendance-evidence" class="form-input" accept="image/*" />
                    </div>
                </div>

                <button type="submit" id="submit-presensi-btn" class="btn btn-primary btn-block btn-lg">
                    Kirim Presensi Kehadiran
                </button>
            </form>
        </div>
    `;
}

/**
 * Menghubungkan Event Handlers pada halaman presensi
 */
function attachAttendanceEvents(container, session, attendance, navigate) {
    // Tombol Cek Rekap
    container.querySelector('#btn-to-recap')?.addEventListener('click', () => navigate('recap'));

    // Pilihan Status Hadir / Izin / Sakit
    const options = container.querySelectorAll('.attendance-option');
    const detailsBox = container.querySelector('#izin-sakit-details');

    options.forEach(opt => {
        const input = opt.querySelector('input');
        if (input.checked) {
            opt.style.borderColor = 'var(--color-primary)';
            opt.style.backgroundColor = 'rgba(37, 99, 235, 0.08)';
        }

        opt.addEventListener('click', () => {
            options.forEach(o => {
                o.style.borderColor = 'var(--color-border)';
                o.style.backgroundColor = 'transparent';
            });
            input.checked = true;
            opt.style.borderColor = 'var(--color-primary)';
            opt.style.backgroundColor = 'rgba(37, 99, 235, 0.08)';

            if (detailsBox) {
                detailsBox.style.display = input.value === 'hadir' ? 'none' : 'block';
            }
        });
    });

    // Submit Presensi
    const form = container.querySelector('#attendance-submit-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const selectedStatus = container.querySelector('input[name="attendance_status"]:checked')?.value || 'hadir';
            const noteVal = container.querySelector('#attendance-note')?.value || '';
            const evidenceInput = container.querySelector('#attendance-evidence');
            const submitBtn = container.querySelector('#submit-presensi-btn');

            if (selectedStatus !== 'hadir' && !noteVal.trim()) {
                showToast('Catatan alasan wajib diisi untuk izin atau sakit.', 'error');
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Mengirim Presensi...';

                const formData = new FormData();
                formData.append('session_id', session.id);
                formData.append('status', selectedStatus);
                formData.append('note', noteVal);
                if (evidenceInput && evidenceInput.files[0]) {
                    formData.append('evidence', evidenceInput.files[0]);
                }

                await api.submitAttendance(formData);

                // Tampilkan stiker perayaan
                const stickerModal = container.querySelector('#attendance-sticker-modal');
                if (stickerModal) {
                    stickerModal.style.display = 'flex';
                    setTimeout(() => {
                        stickerModal.style.display = 'none';
                        renderAttendance(container, navigate);
                    }, 2800);
                } else {
                    showToast('Presensi berhasil dikirim!', 'success');
                    renderAttendance(container, navigate);
                }
            } catch (err) {
                showToast(err.message || 'Gagal mengirim presensi.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Kirim Presensi Kehadiran';
            }
        });
    }
}

/**
 * Menghitung dan memperbarui countdown waktu tersisa di layar
 */
function setupCountdown(container, session) {
    const timerElem = container.querySelector('#countdown-timer');
    if (!timerElem) return;

    const updateTimer = () => {
        const openedAt = new Date(session.opened_at).getTime();
        const durationMs = (session.duration_minutes || 15) * 60 * 1000;
        const endTime = openedAt + durationMs;
        const diff = Math.max(0, Math.floor((endTime - Date.now()) / 1000));

        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        timerElem.textContent = `⏱️ Sisa Waktu: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        if (diff <= 0) {
            timerElem.textContent = '⏱️ Waktu Sesi Berakhir';
            clearInterval(countdownInterval);
        }
    };

    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
}
