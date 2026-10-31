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
        <div class="login-container" style="
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 16px;
            background: linear-gradient(135deg, rgba(16, 124, 65, 0.08) 0%, rgba(0, 0, 0, 0.02) 100%), var(--color-bg, #f3f2f1);
        ">
            <div class="login-card" style="
                width: 100%;
                max-width: 440px;
                background: var(--color-bg-card, #ffffff);
                border: 1px solid var(--color-border, #edebe9);
                border-radius: 12px;
                padding: 36px 32px;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
            ">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 28px;">
                    <div style="
                        display: inline-block;
                        padding: 3px 10px;
                        background: #ecfdf5;
                        color: #047857;
                        border: 1px solid #a7f3d0;
                        border-radius: 9999px;
                        font-size: 0.72rem;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        margin-bottom: 14px;
                    ">
                        Portal Akademik TI25C
                    </div>

                    <div style="margin-bottom: 12px; display: flex; justify-content: center;">
                        <img
                            src="${siteLogo}"
                            alt="Logo Presensi MK Statistika - Ketelitian"
                            style="width: 72px; height: 72px; border-radius: 12px; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
                        />
                    </div>

                    <h1 style="font-size: 1.35rem; font-weight: 700; color: var(--color-text); margin: 0 0 6px;">
                        Presensi MK Statistika
                    </h1>
                    <p style="font-size: 0.825rem; color: var(--color-text-secondary); margin: 0; line-height: 1.4;">
                        Sistem Informasi dan Pencatatan Kehadiran Mahasiswa Kelas TI25C
                    </p>
                </div>

                <!-- Error Alert Box -->
                <div id="login-error-box" style="
                    display: none;
                    margin-bottom: 18px;
                    padding: 10px 14px;
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    border-radius: 6px;
                    color: #b91c1c;
                    font-size: 0.825rem;
                    line-height: 1.4;
                "></div>

                <!-- Form -->
                <form id="login-form">
                    <div class="form-group" style="margin-bottom: 16px;">
                        <label class="form-label" for="login-name" style="display: block; font-size: 0.825rem; font-weight: 600; color: var(--color-text); margin-bottom: 6px;">
                            Nama Lengkap Mahasiswa
                        </label>
                        <input
                            id="login-name"
                            type="text"
                            class="form-input"
                            placeholder="Contoh: Dafa Rizki / Shukoh#Dev"
                            required
                            autocomplete="name"
                            style="width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text); font-size: 0.875rem;"
                        />
                    </div>

                    <div class="form-group" style="margin-bottom: 16px;">
                        <label class="form-label" for="login-password" style="display: block; font-size: 0.825rem; font-weight: 600; color: var(--color-text); margin-bottom: 6px;">
                            Kata Sandi (NIM)
                        </label>
                        <div style="position: relative;">
                            <input
                                id="login-password"
                                type="password"
                                class="form-input"
                                placeholder="Masukkan NIM / Sandi Admin"
                                required
                                autocomplete="current-password"
                                style="width: 100%; padding: 10px 42px 10px 12px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text); font-size: 0.875rem;"
                            />
                            <button
                                type="button"
                                id="toggle-password-btn"
                                style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--color-text-secondary); cursor: pointer; padding: 6px; font-size: 1rem;"
                                title="Tampilkan / Sembunyikan Sandi"
                            >
                                👁️
                            </button>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display: flex; align-items: flex-start; gap: 8px; cursor: pointer; font-size: 0.813rem; color: var(--color-text); user-select: none;">
                            <input
                                type="checkbox"
                                id="login-remember"
                                style="width: 16px; height: 16px; margin-top: 2px; cursor: pointer; accent-color: var(--color-primary, #107C41);"
                            />
                            <div>
                                <span style="font-weight: 500;">Ingat saya di perangkat ini</span>
                                <span style="display: block; font-size: 0.725rem; color: var(--color-text-secondary); margin-top: 2px;">
                                    Biarkan tidak dicentang jika menggunakan perangkat teman.
                                </span>
                            </div>
                        </label>
                    </div>

                    <button
                        type="submit"
                        id="login-submit-btn"
                        class="btn btn-primary"
                        style="
                            width: 100%;
                            padding: 11px;
                            border-radius: 6px;
                            border: none;
                            background: var(--color-primary, #107C41);
                            color: #ffffff;
                            font-size: 0.9rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: background 0.15s ease;
                        "
                    >
                        Masuk ke Portal
                    </button>
                </form>

                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--color-border, #edebe9); text-align: center; font-size: 0.75rem; color: var(--color-text-secondary);">
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
            submitBtn.textContent = 'Memverifikasi...';

            const data = await api.login(nameVal, passVal);
            setAuth(data.user, data.token, rememberVal);
            showToast(`Selamat datang, ${data.user.name}!`, 'success');

            navigate(data.user.role === 'admin' ? 'admin' : 'attendance');
        } catch (err) {
            errorBox.textContent = err.message || 'Nama lengkap atau kata sandi tidak sesuai.';
            errorBox.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Masuk ke Portal';
        }
    });
}
