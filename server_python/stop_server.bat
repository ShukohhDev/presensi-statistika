@echo off
echo ==============================================================
echo Menghentikan Server Python Presensi MK Statistika
echo ==============================================================
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo Menghentikan proses dengan PID: %%a
    taskkill /F /PID %%a 2>nul
)
echo Server Python berhasil dihentikan.
pause

