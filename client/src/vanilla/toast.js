/**
 * =============================================================================
 * toast.js - Sistem Notifikasi Pop-up Sederhana (Vanilla JavaScript)
 * =============================================================================
 * Menampilkan pesan sukses / error di pojok layar tanpa membutuhkan library React.
 * Kode dibuat linear, bersih, dan mudah dibaca oleh pemula.
 * =============================================================================
 */

let toastContainer = null;

/**
 * Memastikan elemen kontainer toast ada di dalam halaman.
 */
function getOrCreateContainer() {
    if (!toastContainer || !document.body.contains(toastContainer)) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

/**
 * Menampilkan notifikasi toast ke layar.
 * @param {string} message - Pesan yang ingin ditampilkan
 * @param {'success'|'error'|'info'} type - Jenis notifikasi ('success', 'error', atau 'info')
 * @param {number} durationMs - Berapa lama notifikasi tampil dalam milidetik (default: 3500ms)
 */
export function showToast(message, type = 'info', durationMs = 3500) {
    const container = getOrCreateContainer();

    // Buat elemen notifikasi baru
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Masukkan ke dalam kontainer
    container.appendChild(toast);

    // Hilangkan otomatis setelah durasi waktu selesai
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, durationMs);
}
