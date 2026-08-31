Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "       PERSONAL FINANCE MANAGER - STARTUP" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Backend in separate window
Write-Host "[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$root\backend`"; .\venv\Scripts\uvicorn.exe main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

# 2. Start Frontend in separate window
Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$root\frontend`"; npm run dev"

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Application is starting!" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Frontend (UI):       http://localhost:5173" -ForegroundColor White
Write-Host "  Backend (API Docs):  http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Default Login Credentials:" -ForegroundColor Cyan
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: finance2026" -ForegroundColor White
Write-Host "====================================================" -ForegroundColor Cyan
