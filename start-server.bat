@echo off
setlocal
cd /d "%~dp0"
set "PYTHONPATH=%~dp0backend"
echo Starting ZhiZhi RAG Backend...
if exist "%~dp0backend\.venv\Scripts\python.exe" (
    start "" /b "%~dp0backend\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --app-dir "%~dp0backend" --workers 1 >"%TEMP%\rag-backend.log" 2>"%TEMP%\rag-backend.log.err"
) else (
    start "" /b py -3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --app-dir "%~dp0backend" --workers 1 >"%TEMP%\rag-backend.log" 2>"%TEMP%\rag-backend.log.err"
)
timeout /t 3 /nobreak >nul
echo Backend started! Visit http://localhost:8000/
pause
