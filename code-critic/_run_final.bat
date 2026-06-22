@echo off
cd /d C:\Users\jacks\OneDrive\Desktop\agnt-evo\code-critic
"C:\Program Files\Python312\python.exe" -X utf8 _train_final.py > _python_log.txt 2>&1
echo EXIT %ERRORLEVEL% > _batch_exit.txt
