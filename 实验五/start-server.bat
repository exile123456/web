@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   Lab5 - Vue.js Basics  ^|  http://localhost:5173
echo ============================================
timeout /t 1 >nul
start "" http://localhost:5173/index.html
node server.js
pause
