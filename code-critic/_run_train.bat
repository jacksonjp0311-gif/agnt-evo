@echo off
cd /d C:\Users\jacks\OneDrive\Desktop\agnt-evo\code-critic
echo START %TIME% > _train_v3_log.txt
python -X utf8 train_v3.py >> _train_v3_log.txt 2>&1
echo EXIT %ERRORLEVEL% %TIME% >> _train_v3_log.txt
