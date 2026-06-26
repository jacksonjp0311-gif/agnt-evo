@echo off
cd /d C:\Users\jacks\OneDrive\Desktop\agnt-evo
git add _publish/agnt-chat-toolbar-plugin/agnt-plugin/chat-actions-strip/chat-actions-strip.js
git add plugins/installed/chat-actions-strip/chat-actions-strip.js
git add backend/plugins/dev/chat-actions-strip/chat-actions-strip.js
git commit -m "Fix chat-actions-strip: handle AGNT args wrapper in execute params"
git push origin main
echo Done!
