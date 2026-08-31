@echo off
title Personal Finance Manager - Runner
echo ====================================================
echo        PERSONAL FINANCE MANAGER - STARTUP
echo ====================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Finance Manager - Backend" cmd /k "cd backend && .\venv\Scripts\uvicorn.exe main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "Finance Manager - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ====================================================
echo Application is starting!
echo.
echo   Frontend (UI):       http://localhost:5173
echo   Backend (API Docs):  http://127.0.0.1:8000/docs
echo.
echo Default Login Credentials:
echo   Username: admin
echo   Password: finance2026
echo ====================================================
echo.
pause
