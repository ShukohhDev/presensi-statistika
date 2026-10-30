@echo off
cd /d "C:\projek vscode\presensi mk statistika\server_python"
"C:\Users\ACER\AppData\Local\Programs\Python\Python313\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 5000

