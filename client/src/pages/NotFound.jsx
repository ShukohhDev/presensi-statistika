import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircleIcon } from '../components/Common/Icons';

export function NotFound() {
    const { user } = useAuth();
    const homeUrl = user?.role === 'admin' ? '/admin' : '/presensi';

    return (
        <div style={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center'
        }}>
            <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
            }}>
                <AlertCircleIcon size={36} />
            </div>

            <h1 style={{
                fontSize: '3rem',
                fontWeight: 800,
                color: 'var(--color-text)',
                margin: '0 0 8px 0',
                lineHeight: 1
            }}>
                404
            </h1>

            <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                margin: '0 0 12px 0'
            }}>
                Halaman Tidak Ditemukan
            </h2>

            <p style={{
                fontSize: '0.938rem',
                color: 'var(--color-text-secondary)',
                maxWidth: '420px',
                lineHeight: 1.6,
                marginBottom: '28px'
            }}>
                Tautan atau halaman yang Anda tuju tidak tersedia atau telah dipindahkan. Silakan kembali ke menu utama.
            </p>

            <Link
                to={homeUrl}
                className="btn btn-primary"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textDecoration: 'none'
                }}
            >
                Kembali ke Beranda
            </Link>
        </div>
    );
}
