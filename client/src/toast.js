/**
 * =============================================================================
 * toast.js - Floating Notification Toasts (Vanilla JavaScript)
 * =============================================================================
 */

let toastContainer = null;

function ensureToastContainer() {
    if (!toastContainer || !document.body.contains(toastContainer)) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
            max-width: 380px;
            width: calc(100% - 48px);
        `;
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

export function showToast(message, type = 'info', duration = 3500) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.style.cssText = `
        pointer-events: auto;
        padding: 12px 18px;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        transform: translateY(20px);
        opacity: 0;
        backdrop-filter: blur(8px);
    `;

    // Colors matching theme
    if (type === 'success') {
        toast.style.background = 'var(--color-primary, #107C41)';
        toast.style.color = '#ffffff';
    } else if (type === 'error') {
        toast.style.background = '#d13438';
        toast.style.color = '#ffffff';
    } else if (type === 'warning') {
        toast.style.background = '#f7630c';
        toast.style.color = '#ffffff';
    } else {
        toast.style.background = 'var(--color-bg-card, #252423)';
        toast.style.color = 'var(--color-text, #ffffff)';
        toast.style.border = '1px solid var(--color-border, rgba(255,255,255,0.1))';
    }

    toast.innerHTML = `
        <div style="flex: 1; word-break: break-word;">${message}</div>
        <button style="background: none; border: none; color: inherit; cursor: pointer; padding: 2px; opacity: 0.8; font-size: 1.1rem; line-height: 1;" title="Tutup">×</button>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });

    const closeBtn = toast.querySelector('button');
    const dismiss = () => {
        toast.style.transform = 'translateY(10px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 250);
    };

    closeBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
}
