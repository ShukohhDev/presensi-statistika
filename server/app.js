const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Auto inisialisasi database jika belum ada
const initDb = require('./database/init');
initDb();

// Mulai background scheduler presensi & kalender otomatis
const { startScheduler } = require('./services/scheduler');
startScheduler();

const app = express();
const PORT = process.env.PORT || 7860;

// Security Headers (CSP disesuaikan agar font Google & aset statis berjalan mulus)
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false
}));

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (process.env.NODE_ENV !== 'production') return callback(null, true);
        const allowed = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(s => s.trim()) : [];
        if (allowed.length === 0 || allowed.includes(origin)) return callback(null, true);
        return callback(new Error('CORS policy violation'));
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Routes
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');
const taskRoutes = require('./routes/tasks');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');
const calendarRoutes = require('./routes/calendar');
const announcementRoutes = require('./routes/announcements');
const materialsRoutes = require('./routes/materials');

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/materials', materialsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend build if dist folder exists (Single-service deployment)
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
            return res.sendFile(path.join(clientDist, 'index.html'));
        }
        next();
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    if (err.message && err.message.includes('file')) {
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Terjadi kesalahan internal server.' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di http://0.0.0.0:${PORT}`);
    console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
