import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { Layout } from './components/Layout/Layout';
import { ErrorBoundary } from './components/Common/ErrorBoundary';

// Entry Page (Static import untuk LCP tercepat pada login)
import { Login } from './pages/Login';

// Lazy Loaded Pages (Code-splitting untuk memangkas bundle awal)
const Attendance = lazy(() => import('./pages/Attendance').then(m => ({ default: m.Attendance })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Recap = lazy(() => import('./pages/Recap').then(m => ({ default: m.Recap })));
const Tasks = lazy(() => import('./pages/Tasks').then(m => ({ default: m.Tasks })));
const History = lazy(() => import('./pages/History').then(m => ({ default: m.History })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Calendar = lazy(() => import('./pages/Calendar').then(m => ({ default: m.Calendar })));
const Materials = lazy(() => import('./pages/Materials').then(m => ({ default: m.Materials })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

function PageLoading() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span>Memuat halaman...</span>
            </div>
        </div>
    );
}

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-secondary)' }}>
                Memuat aplikasi...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function AdminRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-secondary)' }}>
                Memuat...
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return <Navigate to="/presensi" replace />;
    }

    return children;
}

function StudentOnlyRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-secondary)' }}>
                Memuat...
            </div>
        );
    }

    if (user?.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }

    return children;
}

function HomeRedirect() {
    const { user, loading } = useAuth();
    if (loading) return null;
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/presensi'} replace />;
}

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <ThemeProvider>
                    <ToastProvider>
                        <BrowserRouter>
                            <Suspense fallback={<PageLoading />}>
                                <Routes>
                                    {/* Public Login Route */}
                                    <Route path="/login" element={<Login />} />

                                    {/* Protected Routes inside Layout */}
                                    <Route
                                        path="/"
                                        element={
                                            <ProtectedRoute>
                                                <Layout />
                                            </ProtectedRoute>
                                        }
                                    >
                                        <Route index element={<HomeRedirect />} />
                                        <Route
                                            path="presensi"
                                            element={
                                                <StudentOnlyRoute>
                                                    <Attendance />
                                                </StudentOnlyRoute>
                                            }
                                        />
                                        <Route
                                            path="admin"
                                            element={
                                                <AdminRoute>
                                                    <AdminDashboard />
                                                </AdminRoute>
                                            }
                                        />
                                        <Route path="rekap" element={<Recap />} />
                                        <Route path="tugas" element={<Tasks />} />
                                        <Route
                                            path="riwayat"
                                            element={
                                                <StudentOnlyRoute>
                                                    <History />
                                                </StudentOnlyRoute>
                                            }
                                        />
                                        <Route path="profil" element={<Profile />} />
                                        <Route path="laporan" element={<Reports />} />
                                        <Route path="kalender" element={<Calendar />} />
                                        <Route path="materi" element={<Materials />} />
                                    </Route>

                                    {/* Catch-all 404 route */}
                                    <Route path="*" element={<NotFound />} />
                                </Routes>
                            </Suspense>
                        </BrowserRouter>
                    </ToastProvider>
            </ThemeProvider>
        </AuthProvider>
    </ErrorBoundary>
    );
}

export default App;
