@echo off
title Server Python Presensi MK Statistika
echo =====================================================================
echo  MENJALANKAN SERVER PYTHON (FASTAPI + PRESENSI MK STATISTIKA)
echo =====================================================================
echo  Status: Menghubungkan ke database...
echo  Alamat API: http://127.0.0.1:5000
echo  Dokumentasi Interaktif: http://127.0.0.1:5000/docs
echo =====================================================================
echo.
cd /d "%~dp0\server_python"
python main.py
pause

