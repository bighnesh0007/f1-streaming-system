# F1 Streaming System — Start All Services In Separate Terminals
# usage: .\start_all_services.ps1

Write-Host "Starting F1 Streaming Application Services..." -ForegroundColor Cyan

# 1. Backend
Write-Host "Lunching Backend (3001)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'F1 Backend'; cd backend; npm run dev"

# 2. Frontend
Write-Host "Lunching Frontend (3000)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'F1 Frontend'; cd frontend; npm run dev"

# 3. Producer
Write-Host "Lunching Producer..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'F1 Producer'; cd producer; python main.py"

# 4. Consumer
Write-Host "Lunching Consumer..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'F1 Consumer'; cd consumer; python main.py"

Write-Host "`nAll 4 services have been launched in separate windows!" -ForegroundColor Green
Write-Host "Check the new terminal windows for logs."
