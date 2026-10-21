const { getDb } = require('../config/database');

/**
 * Service Penjadwalan Otomatis Sesi Presensi & Kalender Akademik
 * Berjalan otomatis pada background server dengan zona waktu WIB (Asia/Jakarta, UTC+7).
 */

function getWibInfo() {
    const now = new Date();
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

    const dayFormatter = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long'
    });
    const dayName = dayFormatter.format(now); // e.g. "Kamis"

    return {
        dateString: `${map.year}-${map.month}-${map.day}`, // YYYY-MM-DD
        timeString: `${map.hour}:${map.minute}`, // HH:mm
        hour: parseInt(map.hour, 10),
        minute: parseInt(map.minute, 10),
        dayName,
        rawDate: now
    };
}

let schedulerInterval = null;
let lastProcessedTick = null;

async function checkSchedulerTick() {
    try {
        const db = getDb();
        const wib = getWibInfo();
        const tickKey = `${wib.dateString} ${wib.timeString}`;

        // Hindari eksekusi ganda pada menit yang sama
        if (lastProcessedTick === tickKey) {
            return;
        }
        lastProcessedTick = tickKey;

        const course = db.prepare('SELECT * FROM course_info WHERE id = 1').get();
        if (!course) return;

        const scheduledDay = course.schedule_day || 'Kamis';
        const isScheduledDay = wib.dayName.toLowerCase() === scheduledDay.toLowerCase();

        // 1. OTOMASI JAM 00:00 (Pergantian Hari Menuju Hari Kuliah)
        // Buat pengingat di Kalender Akademik dan notifikasi ke seluruh mahasiswa
        if (isScheduledDay) {
            // Periksa apakah agenda kalender untuk hari kuliah ini sudah terbuat
            const existingCalendar = db.prepare(
                `SELECT id FROM calendar_events 
                 WHERE event_date = ? AND event_type = 'kuliah' AND title LIKE '%Statistika%'`
            ).get(wib.dateString);

            if (!existingCalendar && course.auto_session_enabled === 1) {
                if (course.skip_next_session === 1) {
                    // Jika admin menyetel libur pekan ini
                    db.prepare(
                        `INSERT INTO calendar_events (title, description, event_date, event_time, event_type, location, room, building, created_by)
                         VALUES (?, ?, ?, ?, 'kuliah', 'G. Mahdor R. C 306', 'R. C 306', 'G. Mahdor', 1)`
                    ).run(
                        'Perkuliahan Statistika TI25C (DILIBURKAN)',
                        'Perkuliahan Statistika tatap muka hari ini ditiadakan/diliburkan sesuai arahan PJ MK/Dosen.',
                        wib.dateString,
                        '13:00'
                    );

                    // Kirim notifikasi libur ke mahasiswa
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
                    // Dapatkan nomor pertemuan berikutnya
                    const maxM = db.prepare('SELECT COALESCE(MAX(meeting_number), 0) as maxM FROM sessions').get().maxM;
                    const nextMeeting = maxM + 1;

                    // Buat acara resmi di kalender
                    db.prepare(
                        `INSERT INTO calendar_events (title, description, event_date, event_time, event_type, location, room, building, created_by)
                         VALUES (?, ?, ?, ?, 'kuliah', 'G. Mahdor R. C 306', 'R. C 306', 'G. Mahdor', 1)`
                    ).run(
                        `Perkuliahan Statistika TI25C - Pertemuan ${nextMeeting}`,
                        `Jadwal tatap muka perkuliahan Statistika jam 13:00 - 15:30 WIB di G. Mahdor R. C 306. Dosen Pengampu: ${course.lecturer_name || 'RIFQI HIDAYAT'} (NIP: ${course.lecturer_nip || '0401088701'}).`,
                        wib.dateString,
                        '13:00'
                    );

                    // Kirim notifikasi pengingat ke seluruh mahasiswa
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

                    // Log aktivitas
                    db.prepare(
                        'INSERT INTO activity_log (user_id, action, description) VALUES (1, ?, ?)'
                    ).run('otomasi_kalender', `Otomatis membuat agenda kalender dan notifikasi Pertemuan ${nextMeeting}`);
                }
            }
        }

        // 2. OTOMASI JAM 13:00 (Buka Sesi Presensi Otomatis)
        const autoOpenTime = course.auto_open_time || '13:00';
        const autoCloseTime = course.auto_close_time || '15:45';

        if (
            isScheduledDay &&
            course.auto_session_enabled === 1 &&
            course.skip_next_session === 0 &&
            wib.timeString >= autoOpenTime &&
            wib.timeString < autoCloseTime
        ) {
            // Periksa apakah sedang ada sesi yang terbuka
            const currentOpen = db.prepare("SELECT * FROM sessions WHERE status = 'open'").get();

            // Periksa apakah sesi hari ini sudah pernah dibuat/dibuka
            const sessionToday = db.prepare(
                `SELECT * FROM sessions 
                 WHERE opened_at LIKE ? OR (created_at LIKE ? AND status = 'closed')`
            ).get(`${wib.dateString}%`, `${wib.dateString}%`);

            if (!currentOpen && !sessionToday) {
                const maxM = db.prepare('SELECT COALESCE(MAX(meeting_number), 0) as maxM FROM sessions').get().maxM;
                const nextMeeting = maxM + 1;

                // Hitung durasi dalam menit (13:00 ke 15:45 = 165 menit, jadwal 13:00-15:30 + toleransi s.d 15:45)
                const [startH, startM] = autoOpenTime.split(':').map(Number);
                const [endH, endM] = autoCloseTime.split(':').map(Number);
                const durationMinutes = Math.max(30, (endH * 60 + endM) - (startH * 60 + startM));

                const result = db.prepare(
                    `INSERT INTO sessions (meeting_number, title, status, duration_minutes, opened_at, created_by)
                     VALUES (?, ?, 'open', ?, CURRENT_TIMESTAMP, 1)`
                ).run(nextMeeting, `Pertemuan ${nextMeeting}`, durationMinutes);

                // Kirim notifikasi ke mahasiswa
                const students = db.prepare("SELECT id FROM users WHERE role = 'user'").all();
                const insertNotif = db.prepare(
                    `INSERT INTO notifications (user_id, title, message, type, created_by) VALUES (?, ?, ?, 'reminder', 1)`
                );
                students.forEach(s => {
                    insertNotif.run(
                        s.id,
                        'Sesi Presensi Dibuka Otomatis',
                        `Sesi presensi untuk Pertemuan ${nextMeeting} telah dibuka secara otomatis (Jadwal kuliah 13:00 - 15:30 WIB). Toleransi keterlambatan presensi dibuka hingga pukul ${autoCloseTime} WIB.`
                    );
                });

                // Catat log aktivitas
                db.prepare(
                    'INSERT INTO activity_log (user_id, action, description) VALUES (1, ?, ?)'
                ).run('buka_sesi_otomatis', `Sesi presensi pertemuan ${nextMeeting} dibuka otomatis oleh sistem (${autoOpenTime} WIB, toleransi s.d ${autoCloseTime} WIB)`);

                console.log(`[Scheduler] Sesi presensi pertemuan ${nextMeeting} berhasil dibuka otomatis.`);
            }
        }

        // 3. OTOMASI JAM 15:45 (Tutup Sesi Presensi Otomatis & Hitung Alpha setelah Batas Toleransi)
        const openSession = db.prepare("SELECT * FROM sessions WHERE status = 'open'").get();
        if (openSession) {
            let shouldClose = false;

            // Jika hari ini hari kuliah dan waktu >= jam tutup
            if (isScheduledDay && wib.timeString >= autoCloseTime) {
                shouldClose = true;
            }

            // Atau jika durasi sesi telah habis
            if (openSession.opened_at && openSession.duration_minutes) {
                const openedTime = new Date(openSession.opened_at).getTime();
                const expireTime = openedTime + openSession.duration_minutes * 60 * 1000;
                if (Date.now() >= expireTime) {
                    shouldClose = true;
                }
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
    const isTodayScheduled = wib.dayName.toLowerCase() === scheduledDay.toLowerCase();

    return {
        currentTimeWib: `${wib.dateString} ${wib.timeString} WIB`,
        currentDay: wib.dayName,
        isTodayScheduled,
        autoSessionEnabled: Boolean(course.auto_session_enabled),
        skipNextSession: Boolean(course.skip_next_session),
        autoOpenTime: course.auto_open_time || '13:00',
        autoCloseTime: course.auto_close_time || '15:45',
        toleranceMinutes: course.tolerance_minutes || 30,
        activeSession: openSession || null,
        nextMeetingNumber: maxM + 1
    };
}

module.exports = {
    startScheduler,
    checkSchedulerTick,
    getSchedulerStatus,
    getWibInfo
};
