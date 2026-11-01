/**
 * =============================================================================
 * login.js - Halaman Login Mahasiswa & Admin (Vanilla JavaScript)
 * =============================================================================
 */

import { api } from '../utils/api.js';
import { setAuth } from '../state.js';
import { showToast } from '../toast.js';
import siteLogo from '../assets/logo-ketelitian.jpg';

export function renderLoginPage(container, navigate) {
    container.innerHTML = `
        <div class="login-container">
            <div class="login-card">
                <div class="login-header">
                    <span class="login-badge">PORTAL AKADEMIK TI25C</span>
                    <div class="login-logo-box" title="Prinsip Ketelitian - Presensi MK Statistika">
                        <img
                            src="${siteLogo}"
                            alt="Logo Presensi MK Statistika - Ketelitian"
                            class="login-logo-img"
                        />
                    </div>
                    <h1>Presensi MK Statistika</h1>
                    <p>Sistem Informasi dan Pencatatan Kehadiran Mahasiswa Kelas TI25C</p>
                </div>

                <div id="login-error-box" class="login-error" style="display: none;"></div>

                <form id="login-form">
                    <div class="form-group">
                        <label class="form-label" for="login-name">Nama Lengkap Mahasiswa</label>
                        <input
                            id="login-name"
                            type="text"
                            class="form-input"
                            placeholder="Contoh: Dafa Rizki / Shukoh#Dev"
                            required
                            autocomplete="name"
                        />
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="login-password">Kata Sandi (NIM)</label>
                        <div style="position: relative;">
                            <input
                                id="login-password"
                                type="password"
                                class="form-input"
                                placeholder="Masukkan NIM / Sandi Admin"
                                required
                                autocomplete="current-password"
                                style="padding-right: 46px;"
                            />
                            <button
                                type="button"
                                id="toggle-password-btn"
                                style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--color-text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 8px; width: 42px; height: 42px; z-index: 5;"
                                title="Tampilkan kata sandi"
                                aria-label="Tampilkan kata sandi"
                            >
                                👁️
                            </button>
                        </div>
                    </div>

                    <div style="margin: 14px 0 6px;">
                        <label style="display: flex; align-items: flex-start; gap: 8px; cursor: pointer; font-size: 0.813rem; color: var(--color-text); user-select: none;">
                            <input
                                type="checkbox"
                                id="login-remember"
                                style="width: 16px; height: 16px; margin-top: 2px; cursor: pointer; accent-color: var(--color-primary);"
                            />
                            <div>
                                <span style="font-weight: 500;">Ingat saya di perangkat ini</span>
                                <span style="display: block; font-size: 0.725rem; color: var(--color-text-muted); margin-top: 2px;">
                                    Biarkan tidak dicentang jika menggunakan perangkat teman.
                                </span>
                            </div>
                        </label>
                    </div>

                    <button
                        type="submit"
                        id="login-submit-btn"
                        class="btn btn-primary btn-block btn-lg"
                        style="margin-top: 16px;"
                    >
                        Masuk ke Portal
                    </button>
                </form>

                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--color-border); text-align: center; font-size: 0.75rem; color: var(--color-text-muted);">
                    <div>PJ MK: Faqih Hidayatus Salam</div>
                </div>
            </div>
        </div>
    `;

    // Password visibility toggle
    const passInput = container.querySelector('#login-password');
    const toggleBtn = container.querySelector('#toggle-password-btn');
    let isShowing = false;
    toggleBtn?.addEventListener('click', () => {
        isShowing = !isShowing;
        passInput.type = isShowing ? 'text' : 'password';
        toggleBtn.textContent = isShowing ? '🔒' : '👁️';
        toggleBtn.title = isShowing ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi';
        toggleBtn.setAttribute('aria-label', isShowing ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
    });

    // Form submit
    const form = container.querySelector('#login-form');
    const errorBox = container.querySelector('#login-error-box');
    const submitBtn = container.querySelector('#login-submit-btn');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorBox.style.display = 'none';

        const nameVal = container.querySelector('#login-name').value.trim();
        const passVal = passInput.value.trim();
        const rememberVal = container.querySelector('#login-remember').checked;

        if (!nameVal || !passVal) {
            errorBox.textContent = 'Nama dan kata sandi wajib diisi.';
            errorBox.style.display = 'block';
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Memverifikasi Kredensial...';

            const data = await api.login(nameVal, passVal);
            setAuth(data.user, data.token, rememberVal);
            showToast(`Selamat datang, ${data.user.name}!`, 'success');

            navigate(data.user.role === 'admin' ? 'admin' : 'attendance');
        } catch (err) {
            errorBox.textContent = err.message || 'Nama atau password salah.';
            errorBox.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Masuk ke Portal';
        }
    });
}
