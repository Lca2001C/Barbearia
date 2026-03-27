@echo off
cd /d "%~dp0"
echo Instalando dependencias (npm.cmd - compativel com PowerShell no Windows)...
call npm.cmd install %*
exit /b %ERRORLEVEL%
