@echo off
cd /d C:\Users\jacks\OneDrive\Desktop\agnt-evo\code-critic
echo START %TIME% > _train_5ep_log.txt
python -X utf8 _train_only.py >> _train_5ep_log.txt 2>&1
echo EXIT %ERRORLEVEL% %TIME% >> _train_5ep_log.txt
