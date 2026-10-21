@echo off
title Presensi MK Statistika TI25C
echo ========================================================
echo   Menyalakan Sistem Presensi MK Statistika - TI25C
echo ========================================================
echo.
echo 1. Menjalankan Backend Server (Port 3001)...
start "Backend Server (Port 3001)" cmd /k "cd /d %~dp0server && npm start"

echo 2. Menjalankan Frontend Client (Port 5174)...
start "Frontend Client (Port 5174)" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Website siap diakses di browser:
echo http://localhost:5174
echo.
timeout /t 3 >nul
start http://localhost:5174
