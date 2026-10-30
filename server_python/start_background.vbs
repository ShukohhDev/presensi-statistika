' ==============================================================
' Script Runner Senyap (Background Silent Runner)
' Menjalankan Server Python di latar belakang tanpa jendela CMD
' ==============================================================
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """C:\projek vscode\presensi mk statistika\server_python\jalankan_server_otomatis.bat""", 0, False
