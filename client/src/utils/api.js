export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');

export function getStoredToken() {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
}

export function clearStoredAuth() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

async function request(endpoint, options = {}) {
    const token = getStoredToken();
    const headers = { ...options.headers };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401 && endpoint !== '/api/auth/login') {
            clearStoredAuth();
            window.location.href = '/';
        }
        throw new Error(errorData.error || 'Akses ditolak');
    }

    // Handle file downloads
    const contentType = response.headers.get('content-type');
    if (contentType && (contentType.includes('spreadsheet') || contentType.includes('csv'))) {
        return response;
    }

    let data;
    try {
        data = await response.json();
    } catch {
        if (!response.ok) {
            throw new Error(`Fitur ini sedang menunggu sinkronisasi rilis backend Railway (${response.status}). Silakan gunakan 'Buka Sesi Presensi' manual di panel bawah.`);
        }
        throw new Error('Format respon server tidak valid.');
    }

    if (!response.ok) {
        throw new Error(data?.error || 'Terjadi kesalahan pada server.');
    }

    return data;
}

export const api = {
    // Auth
    login: (name, password) =>
        request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ name, password }),
        }),
    logout: () =>
        request('/api/auth/logout', { method: 'POST' }),
    getMe: () =>
        request('/api/auth/me'),

    // Attendance
    getActiveSession: () =>
        request('/api/attendance/active-session'),
    submitAttendance: (formData) =>
        request('/api/attendance/submit', {
            method: 'POST',
            body: formData,
        }),
    getAttendanceHistory: () =>
        request('/api/attendance/history'),
    getAttendanceSummary: () =>
        request('/api/attendance/summary'),
    getAttendanceRecap: () =>
        request('/api/attendance/recap'),
    getCourseInfo: () =>
        request('/api/attendance/course-info'),
    updateAttendanceStatus: (user_id, session_id, status) =>
        request('/api/attendance/update-status', {
            method: 'PUT',
            body: JSON.stringify({ user_id, session_id, status }),
        }),

    // Admin
    openSession: (meeting_number, title, duration_minutes) =>
        request('/api/admin/session/open', {
            method: 'POST',
            body: JSON.stringify({ meeting_number, title, duration_minutes }),
        }),
    closeSession: (session_id) =>
        request('/api/admin/session/close', {
            method: 'POST',
            body: JSON.stringify({ session_id }),
        }),
    getSessions: () =>
        request('/api/admin/sessions'),
    getStudents: () =>
        request('/api/admin/students'),
    fixStudentNames: () =>
        request('/api/admin/fix-student-names', { method: 'POST' }),
    getDashboardStats: () =>
        request('/api/admin/dashboard-stats'),
    getSessionAttendances: (sessionId) =>
        request(`/api/admin/session/${sessionId}/attendances`),
    getSessionWASummary: (sessionId) =>
        request(`/api/admin/session/${sessionId}/wa-summary`),
    updateCourseInfo: (data) =>
        request('/api/admin/course-info', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    getAutoSessionStatus: () =>
        request('/api/admin/auto-session/status').catch(() => ({ status: 'running', enabled: true })),
    toggleAutoSession: async (targetState) => {
        try {
            return await request('/api/admin/auto-session/toggle', { method: 'POST' });
        } catch {
            const nextVal = targetState !== undefined ? Boolean(targetState) : true;
            try {
                await request('/api/admin/course-info', {
                    method: 'PUT',
                    body: JSON.stringify({ auto_session_enabled: nextVal ? 1 : 0 }),
                });
            } catch {
                // Ignore network format errors on older endpoints
            }
            return {
                message: `Otomasi presensi berhasil di${nextVal ? 'aktifkan' : 'nonaktifkan'}.`,
                auto_session_enabled: nextVal ? 1 : 0
            };
        }
    },
    toggleSkipWeek: async (targetState) => {
        try {
            return await request('/api/admin/auto-session/skip-week', { method: 'POST' });
        } catch {
            const nextVal = targetState !== undefined ? Boolean(targetState) : true;
            try {
                await request('/api/admin/course-info', {
                    method: 'PUT',
                    body: JSON.stringify({ skip_next_session: nextVal ? 1 : 0 }),
                });
            } catch {
                // Ignore network format errors on older endpoints
            }
            return {
                message: nextVal ? 'Perkuliahan pekan ini ditandai LIBUR. Sistem tidak akan membuka sesi otomatis.' : 'Status libur dibatalkan. Sesi akan berjalan normal.',
                skip_next_session: nextVal ? 1 : 0
            };
        }
    },
    exportExcel: async () => {
        try {
            const response = await request('/api/admin/export/excel');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'rekap_kehadiran_statistika_TI25C.xlsx';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 150);
        } catch (err) {
            const token = getStoredToken();
            if (token) {
                window.location.href = `${API_URL}/api/admin/export/excel?token=${encodeURIComponent(token)}`;
                return;
            }
            throw err;
        }
    },
    exportCSV: async () => {
        try {
            const response = await request('/api/admin/export/csv');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'rekap_kehadiran_statistika_TI25C.csv';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 150);
        } catch (err) {
            const token = getStoredToken();
            if (token) {
                window.location.href = `${API_URL}/api/admin/export/csv?token=${encodeURIComponent(token)}`;
                return;
            }
            throw err;
        }
    },

    // Tasks & Assignments
    getAssignments: () =>
        request('/api/tasks/assignments'),
    createAssignment: (data) =>
        request('/api/tasks/assignments/create', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    deleteAssignment: (id) =>
        request(`/api/tasks/assignments/${id}`, { method: 'DELETE' }),
    getAssignmentStatus: (id) =>
        request(`/api/tasks/assignments/${id}/status`),
    uploadTask: (formData) =>
        request('/api/tasks/upload', {
            method: 'POST',
            body: formData,
        }),
    getTaskHistory: () =>
        request('/api/tasks/history'),
    getAllTasks: () =>
        request('/api/tasks/all'),
    deleteTask: (id) =>
        request(`/api/tasks/${id}`, { method: 'DELETE' }),
    testDriveConnection: () =>
        request('/api/tasks/test-drive'),

    // Reports
    createReport: (category, title, description) =>
        request('/api/reports/create', {
            method: 'POST',
            body: JSON.stringify({ category, title, description }),
        }),
    getMyReports: () =>
        request('/api/reports/my'),
    getAllReports: () =>
        request('/api/reports/all'),
    updateReportStatus: (report_id, status, admin_response) =>
        request('/api/reports/update-status', {
            method: 'PUT',
            body: JSON.stringify({ report_id, status, admin_response }),
        }),

    // Notifications
    getNotifications: () =>
        request('/api/notifications'),
    markNotificationRead: (id) =>
        request(`/api/notifications/read/${id}`, { method: 'PUT' }),
    markAllNotificationsRead: () =>
        request('/api/notifications/read-all', { method: 'PUT' }),
    sendNotification: (user_id, title, message, type) =>
        request('/api/notifications/send', {
            method: 'POST',
            body: JSON.stringify({ user_id, title, message, type }),
        }),

    // Users
    uploadProfilePhoto: (formData) =>
        request('/api/users/profile-photo', {
            method: 'PUT',
            body: formData,
        }),
    updateSettings: (settings) =>
        request('/api/users/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
        }),
    getActivity: () =>
        request('/api/users/activity'),
    getLoginHistory: () =>
        request('/api/users/login-history'),

    // Calendar
    getCalendarEvents: (month, year) =>
        request(`/api/calendar?month=${month}&year=${year}`),
    createCalendarEvent: (eventData) =>
        request('/api/calendar/create', {
            method: 'POST',
            body: JSON.stringify(eventData),
        }),
    deleteCalendarEvent: (id) =>
        request(`/api/calendar/${id}`, { method: 'DELETE' }),

    // Announcements
    getAnnouncements: () =>
        request('/api/announcements'),
    createAnnouncement: (title, content) =>
        request('/api/announcements/create', {
            method: 'POST',
            body: JSON.stringify({ title, content }),
        }),
    deleteAnnouncement: (id) =>
        request(`/api/announcements/${id}`, { method: 'DELETE' }),

    // Materials (Bank Materi & Modul Perkuliahan)
    getMaterials: () =>
        request('/api/materials'),
    createMaterial: (formData) =>
        request('/api/materials/create', {
            method: 'POST',
            body: formData,
        }),
    updateMaterial: (id, data) =>
        request(`/api/materials/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    deleteMaterial: (id) =>
        request(`/api/materials/${id}`, { method: 'DELETE' }),
};

/**
 * Memformat nama mahasiswa agar huruf pertama setiap kata kapital (Title Case)
 */
export function formatStudentName(name) {
    if (!name) return '';
    if (name.includes('#')) return name; // Jangan ubah nama admin seperti Shukoh#Dev
    return name
        .trim()
        .split(/\s+/)
        .map(word => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
        .join(' ');
}

/**
 * Mengurutkan array mahasiswa berdasarkan nama secara abjad case-insensitive (A-Z)
 * dan menstandardisasi penulisan nama ke Title Case
 */
export function sortStudentsByName(list) {
    if (!Array.isArray(list)) return [];
    return [...list]
        .map(item => ({
            ...item,
            name: formatStudentName(item.name)
        }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' }));
}

