/**
 * =============================================================================
 * calendar.js - Kalender Akademik Perkuliahan (Vanilla JavaScript)
 * =============================================================================
 */

import { api } from '../utils/api.js';

export async function renderCalendarPage(container, navigate) {
    const now = new Date();
    let currentMonth = now.getMonth();
    let currentYear = now.getFullYear();

    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div>
                    <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin: 0 0 4px;">
                        Kalender Perkuliahan
                    </h1>
                    <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin: 0;">
                        Jadwal rutin perkuliahan Statistika setiap hari Kamis (13:00 - 15:30 WIB).
                    </p>
                </div>

                <div style="display: flex; align-items: center; gap: 8px;">
                    <button type="button" id="cal-prev-btn" style="padding: 6px 12px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-card); cursor: pointer; color: var(--color-text); font-weight: 700;">&lt;</button>
                    <span id="cal-month-title" style="font-weight: 700; font-size: 0.95rem; min-width: 140px; text-align: center; color: var(--color-text);"></span>
                    <button type="button" id="cal-next-btn" style="padding: 6px 12px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-card); cursor: pointer; color: var(--color-text); font-weight: 700;">&gt;</button>
                </div>
            </div>

            <div class="card" style="padding: 24px; border-radius: 10px; background: var(--color-bg-card, #ffffff); border: 1px solid var(--color-border, #edebe9);">
                <div style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 0.75rem; font-weight: 700; color: var(--color-text-secondary); margin-bottom: 12px; text-transform: uppercase;">
                    <div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>
                </div>
                <div id="calendar-days-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;"></div>
            </div>
        </div>
    `;

    const renderGrid = () => {
        container.querySelector('#cal-month-title').textContent = `${monthNames[currentMonth]} ${currentYear}`;
        const grid = container.querySelector('#calendar-days-grid');
        grid.innerHTML = '';

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.style.height = '64px';
            grid.appendChild(emptyCell);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(currentYear, currentMonth, day);
            const isThursday = dateObj.getDay() === 4; // Kamis
            const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();

            const cell = document.createElement('div');
            cell.style.cssText = `
                height: 64px;
                padding: 6px;
                border-radius: 6px;
                border: 1px solid ${isToday ? 'var(--color-primary)' : 'var(--color-border)'};
                background: ${isThursday ? 'rgba(16, 124, 65, 0.08)' : 'var(--color-bg-card)'};
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                font-size: 0.8rem;
            `;

            cell.innerHTML = `
                <div style="font-weight: ${isToday ? '700' : '500'}; color: ${isToday ? 'var(--color-primary)' : 'var(--color-text)'};">
                    ${day}
                </div>
                ${isThursday ? `
                    <div style="font-size: 0.65rem; font-weight: 700; color: var(--color-primary); background: rgba(16, 124, 65, 0.15); border-radius: 3px; padding: 1px 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        Statistika
                    </div>
                ` : ''}
            `;

            grid.appendChild(cell);
        }
    };

    renderGrid();

    container.querySelector('#cal-prev-btn')?.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderGrid();
    });

    container.querySelector('#cal-next-btn')?.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderGrid();
    });
}
