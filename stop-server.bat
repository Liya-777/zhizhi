@echo off
echo Stopping ZhiZhi RAG Backend...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr "0.0.0.0:8000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1 && echo Stopped. || echo Failed to stop.
)
if errorlevel 1 echo No backend process found on port 8000.
pause
