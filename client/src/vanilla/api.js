/**
 * =============================================================================
 * api.js - Adapter Pemanggilan API Backend (Vanilla JavaScript)
 * =============================================================================
 * Menghubungkan tampilan antarmuka ke backend Python / Cloudflare Worker.
 * Berisi fungsi REST API untuk login, presensi, rekapitulasi, dan manajemen data.
 * =============================================================================
 */

export * from '../utils/api.js';
export { api, API_URL, formatStudentName, sortStudentsByName } from '../utils/api.js';
