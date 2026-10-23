import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    backgroundColor: 'var(--color-bg, #F8FAFC)',
                    color: 'var(--color-text, #0F172A)',
                    fontFamily: 'var(--font-family, sans-serif)'
                }}>
                    <div style={{
                        maxWidth: '480px',
                        width: '100%',
                        backgroundColor: 'var(--color-bg-card, #FFFFFF)',
                        borderRadius: 'var(--radius-lg, 8px)',
                        border: '1px solid var(--color-border, #E2E8F0)',
                        boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))',
                        padding: '32px 24px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(225, 29, 72, 0.1)',
                            color: '#E11D48',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            fontSize: '24px'
                        }}>
                            ⚠️
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
                            Terjadi Kendala Memuat Halaman
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #475569)', marginBottom: '24px', lineHeight: 1.5 }}>
                            Sistem mendeteksi kendala sementara saat merender tampilan. Silakan coba muat ulang halaman.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={this.handleReload}
                                className="btn btn-primary"
                                style={{ minWidth: '130px' }}
                            >
                                Muat Ulang
                            </button>
                            <button
                                type="button"
                                onClick={this.handleGoHome}
                                className="btn btn-secondary"
                                style={{ minWidth: '130px' }}
                            >
                                Ke Beranda
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
