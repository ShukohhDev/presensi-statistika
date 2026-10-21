import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon } from '../components/Common/Icons';
import siteLogo from '../assets/logo-ketelitian.jpg';

export function Login() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user, login } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    // If already logged in, redirect
    useEffect(() => {
        if (user) {
            navigate(user.role === 'admin' ? '/admin' : '/presensi', { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || !password.trim()) {
            setError('Nama dan kata sandi wajib diisi.');
            return;
        }

        try {
            setLoading(true);
            const loggedInUser = await login(name.trim(), password.trim(), rememberMe);
            addToast(`Selamat datang, ${loggedInUser.name}!`, 'success');
            navigate(loggedInUser.role === 'admin' ? '/admin' : '/presensi', { replace: true });
        } catch (err) {
            setError(err.message || 'Nama atau kata sandi tidak sesuai.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <span className="login-badge">PORTAL AKADEMIK TI25C</span>
                    <div className="login-logo-box" title="Prinsip Ketelitian - Presensi MK Statistika">
                        <img
                            src={siteLogo}
                            alt="Logo Presensi MK Statistika - Ketelitian"
                            className="login-logo-img"
                        />
                    </div>
                    <h1>Presensi MK Statistika</h1>
                    <p>Sistem Informasi dan Pencatatan Kehadiran Mahasiswa Kelas TI25C</p>
                </div>

                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="name">
                            Nama Lengkap Mahasiswa
                        </label>
                        <input
                            id="name"
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                            required
                            autoComplete="name"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">
                            Kata Sandi (NIM)
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                                autoComplete="current-password"
                                style={{ paddingRight: '46px', fontFamily: showPassword ? 'var(--font-mono)' : 'inherit' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '4px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '8px',
                                    width: '42px',
                                    height: '42px',
                                    zIndex: 5,
                                    touchAction: 'manipulation'
                                }}
                                title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                            >
                                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                            </button>
                        </div>
                    </div>

                    <div style={{ margin: '14px 0 6px' }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '0.813rem', color: 'var(--color-text)', userSelect: 'none' }}>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                            />
                            <div>
                                <span style={{ fontWeight: 500 }}>Ingat saya di perangkat ini</span>
                                <span style={{ display: 'block', fontSize: '0.725rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                    Biarkan tidak dicentang jika menggunakan HP/laptop teman agar sesi hanya aktif di tab ini dan meminta login ulang di tab lain.
                                </span>
                            </div>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block btn-lg"
                        disabled={loading}
                        style={{ marginTop: '16px' }}
                    >
                        {loading ? 'Memverifikasi Kredensial...' : 'Masuk ke Portal'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <div>PJ MK: Faqih Hidayatus Salam</div>
                </div>
            </div>
        </div>
    );
}
