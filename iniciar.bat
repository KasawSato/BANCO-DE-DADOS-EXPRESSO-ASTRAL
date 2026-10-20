@echo off
cd /d "%~dp0"
if not exist node_modules call npm install
if not exist .env copy .env.example .env >nul
echo.
echo Servidor local: http://localhost:5173
echo Para amigos: abra tunel.bat em outra janela.
echo.
call npm run dev
pause
