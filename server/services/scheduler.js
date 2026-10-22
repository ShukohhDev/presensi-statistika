const { getDb } = require('../config/database');

/**
 * Service Penjadwalan Otomatis Sesi Presensi & Kalender Akademik
 * Berjalan otomatis pada background server dengan zona waktu WIB (Asia/Jakarta, UTC+7).
 */

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAY_ALIAS_MAP = {
    0: ['minggu', 'sunday', 'sun', 'ahad'],
    1: ['senin', 'monday', 'mon'],
    2: ['selasa', 'tuesday', 'tue'],
    3: ['rabu', 'wednesday', 'wed'],
    4: ['kamis', 'thursday', 'thu'],
    5: ['jumat', 'jum\'at', 'friday', 'fri'],
    6: ['sabtu', 'saturday', 'sat']
};

/**
 * Konversi string waktu format "HH:mm", "HH.mm", "HH:mm WIB" ke total menit sejak tengah malam (0 - 1439).
 */
function parseTimeToMinutes(timeStr, defaultMinutes = 0) {
    if (!timeStr || typeof timeStr !== 'string') return defaultMinutes;
    const cleaned = timeStr.trim().replace('.', ':');
    const match = cleaned.match(/(\d{1,2}):(\d{2})/);
    if (!match) return defaultMinutes;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return (hours * 60) + minutes;
}

/**
 * Parsing timestamp SQLite (CURRENT_TIMESTAMP disimpan dalam UTC "YYYY-MM-DD HH:MM:SS").
 * Mengonversi string ke Date UTC agar kalkulasi expireTime akurat dan tidak bias zona lokal.
 */
function parseSqliteTimestamp(ts) {
    if (!ts) return null;
    if (ts instanceof Date) return ts;
    if (typeof ts === 'string') {
        const cleaned = ts.trim();
        if (cleaned.includes('Z') || cleaned.includes('+')) {
            return new Date(cleaned);
        }
        return new Date(cleaned.replace(' ', 'T') + 'Z');
    }
    return new Date(ts);
}

/**
 * Validasi kecocokan hari jadwal secara universal (kebal perbedaan locale OS/Server/Container).
 */
function isScheduledDayMatching(dayIndex, targetDayString) {
    if (!targetDayString) return false;
    const cleanTarget = targetDayString.trim().toLowerCase();
    const aliases = DAY_ALIAS_MAP[dayIndex] || [];
    return aliases.some(alias => cleanTarget.includes(alias));
}

/**
 * Dapatkan informasi waktu dan kalender real-time zona waktu WIB (Asia/Jakarta, UTC+7).
 */
function getWibInfo() {
    const now = new Date();
    
    // Format bagian tanggal dan waktu spesifik Asia/Jakarta
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    const parts = formatter.formatToParts(now);
    const map = {};
    parts.forEach(p => (map[p.type] = p.value));

    // Dapatkan indeks hari dalam zona waktu Asia/Jakarta secara deterministik
    const weekdayShort = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        weekday: 'short'
    }).format(now);
    const shortDayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
    const dayIndex = shortDayMap[weekdayShort] !== undefined ? shortDayMap[weekdayShort] : now.getUTCDay();
    const dayName = INDONESIAN_DAYS[dayIndex] || 'Kamis';

    const hour = parseInt(map.hour, 10);
    const minute = parseInt(map.minute, 10);
    const currentMinutes = (hour * 60) + minute;

    return {
        dateString: `${map.year}-${map.month}-${map.day}`, // YYYY-MM-DD
        timeString: `${map.hour}:${map.minute}`, // HH:mm
        hour,
        minute,
        currentMinutes,
        dayIndex,
        dayName,
        rawDate: now
    };
}

let schedulerInterval = null;
let isChecking = false;

async function checkSchedulerTick() {
    // Cegah overlapping concurrent checks
    if (isChecking) return;
    isChecking = true;

    try {
        const db = getDb();
        const wib = getWibInfo();

        const course = db.prepare('SELECT * FROM course_info WHERE id = 1').get();
        if (!course) return;

        const scheduledDay = course.schedule_day || 'Kamis';
        const isScheduledDay = isScheduledDayMatching(wib.dayIndex, scheduledDay);

        const openMins = parseTimeToMinutes(course.auto_open_time, 13 * 60); // 13:00 -> 780
        let closeMins = parseTimeToMinutes(course.auto_close_time, 15 * 60 + 30); // 15:30 -> 930
        if (closeMins <= openMins) {
            closeMins = openMins + 150; // Fallback 2.5 jam jika salah setel
        }

        const isAutoEnabled = Boolean(course.auto_session_enabled);
        const isSkipped = Boolean(course.skip_next_session);

        // 1. OTOMASI KALENDER & NOTIFIKASI HARI KULIAH (00:00 WIB ke atas)
        if (isScheduledDay && isAutoEnabled) {
            const existingCalendar = db.prepare(
                `SELECT id FROM calendar_events 
                 WHERE event_date = ? AND event_type = 'kuliah' AND title LIKE '%Statistika%'`
            ).get(wib.dateString);

            if (!existingCalendar) {
                if (isSkipped) {
                    db.prepare(
                        `INSERT INTO calendar_events (title, description, event_date, event_time, event_type, location, room, building, created_by)
                         VALUES (?, ?, ?, ?, 'kuliah', 'G. Mahdor R. C 306', 'R. C 306', 'G. Mahdor', 1)`
                    ).run(
                        'Perkuliahan Statistika TI25C (DILIBURKAN)',
                        'Perkuliahan Statistika tatap muka hari ini ditiadakan/diliburkan sesuai arahan PJ MK/Dosen.',
                        wib.dateString,
                        '13:00'
                    );

                    const students = db.prepare("SELECT id FROM users WHERE role = 'user'").all();
                    const notifStmt = db.prepare(
                        `INSERT INTO notifications (user_id, title, message, type, created_by)
                         VALUES (?, ?, ?, 'info', 1)`
                    );
                    students.forEach(s => {
                        notifStmt.run(
                            s.id,
                            'Info Perkuliahan Statistika Diliburkan',
                            'Pemberitahuan: Perkuliahan tatap muka Statistika hari ini diliburkan / ditiadakan.'
                        );
                    });
                } else {
                    const maxM = db.prepare('SELECT COALESCE(MAX(meeting_number), 0) as maxM FROM sessions').get().maxM;
                    const nextMeeting = maxM + 1;

                    db.prepare(
                        `INSERT INTO calendar_events (title, description, event_date, event_time, event_type, location, room, building, created_by)
                         VALUES (?, ?, ?, ?, 'kuliah', 'G. Mahdor R. C 306', 'R. C 306', 'G. Mahdor', 1)`
                    ).run(
                        `Perkuliahan Statistika TI25C - Pertemuan ${nextMeeting}`,
                        `Jadwal tatap muka perkuliahan Statistika jam 13:00 - 15:30 WIB di G. Mahdor R. C 306. Dosen Pengampu: ${course.lecturer_name || 'RIFQI HIDAYAT'} (NIP: ${course.lecturer_nip || '0401088701'}).`,
                        wib.dateString,
                        '13:00'
                    );

                    const students = db.prepare("SELECT id FROM users WHERE role = 'user'").all();
                    const notifStmt = db.prepare(
                        `INSERT INTO notifications (user_id, title, message, type, created_by)
                         VALUES (?, ?, ?, 'reminder', 1)`
                    );
                    students.forEach(s => {
                        notifStmt.run(
                            s.id,
                            'Pengingat Kuliah Statistika Hari Ini',
                            `Hari ini terdapat perkuliahan tatap muka Statistika (Pertemuan ke-${nextMeeting}) pukul 13:00 - 15:30 WIB di G. Mahdor R. C 306.`
                        );
                    });

                    db.prepare(
                        'INSERT INTO activity_log (user_id, action, description) VALUES (1, ?, ?)'
                    ).run('otomasi_kalender', `Otomatis membuat agenda kalender dan notifikasi Pertemuan ${nextMeeting}`);
                }
            }
        }

        // 2. OTOMASI BUKA SESI PRESENSI
        // Syarat: Hari sesuai, otomasi aktif, tidak diliburkan, dan waktu WIB berada di antara openMins dan closeMins
        if (
            isScheduledDay &&
            isAutoEnabled &&
            !isSkipped &&
            wib.currentMinutes >= openMins &&
            wib.currentMinutes < closeMins
        ) {
            const currentOpen = db.prepare("SELECT * FROM sessions WHERE status = 'open'").get();

            // Cek apakah sesi hari ini sudah pernah dibuat dan ditutup sebelumnya di tanggal WIB yang sama
            const sessionClosedToday = db.prepare(
                `SELECT * FROM sessions 
                 WHERE date(datetime(opened_at, '+7 hours')) = ? AND status = 'closed'`
            ).get(wib.dateString);

            // Jika belum ada sesi terbuka dan belum pernah ditutup hari ini: Buka Sesi Otomatis!
            if (!currentOpen && !sessionClosedToday) {
                const maxM = db.prepare('SELECT COALESCE(MAX(meeting_number), 0) as maxM FROM sessions').get().maxM;
                const nextMeeting = maxM + 1;

                // Durasi sesi dalam menit dihitung dari waktu sekarang hingga waktu tutup (minimal 30 menit)
                const remainingMinutes = Math.max(30, closeMins - wib.currentMinutes);

                db.prepare(
                    `INSERT INTO sessions (meeting_number, title, status, duration_minutes, attendance_mode, opened_at, created_by)
                     VALUES (?, ?, 'open', ?, 'self', CURRENT_TIMESTAMP, 1)`
                ).run(nextMeeting, `Pertemuan ${nextMeeting}`, remainingMinutes);

                // Kirim notifikasi ke seluruh mahasiswa
                const students = db.prepare("SELECT id FROM users WHERE role = 'user'").all();
                const insertNotif = db.prepare(
                    `INSERT INTO notifications (user_id, title, message, type, created_by) VALUES (?, ?, ?, 'reminder', 1)`
                );
                students.forEach(s => {
                    insertNotif.run(
                        s.id,
                        'Sesi Presensi Dibuka Otomatis',
                        `Sesi presensi untuk Pertemuan ${nextMeeting} telah dibuka secara otomatis. Sesi presensi aktif hingga pukul ${course.auto_close_time || '15:30'} WIB.`
                    );
                });

                // Catat log aktivitas
                db.prepare(
                    'INSERT INTO activity_log (user_id, action, description) VALUES (1, ?, ?)'
                ).run('buka_sesi_otomatis', `Sesi presensi pertemuan ${nextMeeting} dibuka otomatis oleh sistem (WIB: ${wib.timeString}, durasi ${remainingMinutes} menit)`);

                console.log(`[Scheduler] Sesi presensi pertemuan ${nextMeeting} berhasil dibuka otomatis.`);
            }
        }

        // 3. OTOMASI TUTUP SESI PRESENSI & PERHITUNGAN ALPHA
        const openSession = db.prepare("SELECT * FROM sessions WHERE status = 'open'").get();
        if (openSession) {
            let shouldClose = false;

            // Periksa kedaluwarsa durasi sesi menggunakan parsing UTC SQLite yang akurat
            if (openSession.opened_at && openSession.duration_minutes) {
                const openedDate = parseSqliteTimestamp(openSession.opened_at);
                if (openedDate) {
                    const expireMs = openedDate.getTime() + (openSession.duration_minutes * 60 * 1000);
                    if (Date.now() >= expireMs) {
                        shouldClose = true;
                    }
                }
            }

            // Jika hari ini adalah hari jadwal dan waktu WIB telah melewati jam tutup otomatis
            if (isScheduledDay && wib.currentMinutes >= closeMins) {
                shouldClose = true;
            }

            if (shouldClose) {
                db.prepare(
                    "UPDATE sessions SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE id = ?"
                ).run(openSession.id);

                // Tandai mahasiswa yang tidak absen sebagai Alpha
                const usersWhoAttended = db.prepare(
                    'SELECT user_id FROM attendance WHERE session_id = ?'
                ).all(openSession.id).map(a => a.user_id);

                const allStudents = db.prepare("SELECT id FROM users WHERE role = 'user'").all();
                const insertAlpha = db.prepare(
                    "INSERT OR IGNORE INTO attendance (user_id, session_id, status) VALUES (?, ?, 'alpha')"
                );

                allStudents.forEach(s => {
                    if (!usersWhoAttended.includes(s.id)) {
                        insertAlpha.run(s.id, openSession.id);
                    }
                });

                // Reset skip_next_session jika hari kuliah telah usai
                if (course.skip_next_session === 1) {
                    db.prepare('UPDATE course_info SET skip_next_session = 0 WHERE id = 1').run();
                }

                // Catat log aktivitas
                db.prepare(
                    'INSERT INTO activity_log (user_id, action, description) VALUES (1, ?, ?)'
                ).run('tutup_sesi_otomatis', `Sesi presensi pertemuan ${openSession.meeting_number} ditutup otomatis oleh sistem. Mahasiswa tidak hadir dihitung Alpha.`);

                console.log(`[Scheduler] Sesi presensi pertemuan ${openSession.meeting_number} berhasil ditutup otomatis.`);
            }
        }
    } catch (err) {
        console.error('[Scheduler Error]:', err);
    } finally {
        isChecking = false;
    }
}

function startScheduler() {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
    }
    console.log('[Scheduler] Background Scheduler aktif. Memantau jadwal presensi (WIB)...');
    // Jalankan pengecekan pertama saat server mulai
    checkSchedulerTick();
    // Jalankan setiap 30 detik
    schedulerInterval = setInterval(checkSchedulerTick, 30000);
}

function getSchedulerStatus() {
    const db = getDb();
    const wib = getWibInfo();
    const course = db.prepare('SELECT * FROM course_info WHERE id = 1').get() || {};
    const openSession = db.prepare("SELECT * FROM sessions WHERE status = 'open'").get();
    const maxM = db.prepare('SELECT COALESCE(MAX(meeting_number), 0) as maxM FROM sessions').get().maxM;

    const scheduledDay = course.schedule_day || 'Kamis';
    const isTodayScheduled = isScheduledDayMatching(wib.dayIndex, scheduledDay);

    const openMins = parseTimeToMinutes(course.auto_open_time, 13 * 60);
    const closeMins = parseTimeToMinutes(course.auto_close_time, 15 * 60 + 30);
    const isWithinTimeWindow = isTodayScheduled && (wib.currentMinutes >= openMins && wib.currentMinutes < closeMins);

    return {
        currentTimeWib: `${wib.dateString} ${wib.timeString} WIB`,
        currentDay: wib.dayName,
        isTodayScheduled,
        isWithinTimeWindow,
        autoSessionEnabled: Boolean(course.auto_session_enabled),
        skipNextSession: Boolean(course.skip_next_session),
        autoOpenTime: course.auto_open_time || '13:00',
        autoCloseTime: course.auto_close_time || '15:30',
        toleranceMinutes: course.tolerance_minutes || 30,
        activeSession: openSession || null,
        nextMeetingNumber: maxM + 1
    };
}

module.exports = {
    startScheduler,
    checkSchedulerTick,
    getSchedulerStatus,
    getWibInfo,
    parseTimeToMinutes,
    parseSqliteTimestamp,
    isScheduledDayMatching
};
