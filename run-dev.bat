@echo off
echo Starting Temanly Development Server...
echo.
cd /d "%~dp0"
echo Current directory: %CD%
echo.
echo Running Vite development server...
node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 8080
pause
