@echo off
echo Starting Temanly Application...
echo.
echo Opening browser to http://localhost:8080
start http://localhost:8080
echo.
echo Starting simple HTTP server...
node simple-server.js
