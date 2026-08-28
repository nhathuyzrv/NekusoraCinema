@echo off

start "Celery Worker" cmd /k "call .venv\Scripts\activate && celery -A nekusoraapis worker -l info -P solo"
start "Celery Beat" cmd /k "call .venv\Scripts\activate && celery -A nekusoraapis beat -l info"
start "Ngrok Tunnel" cmd /k "ngrok http 8000"

echo SERVICES ARE RUNNING...
echo Press any key to terminate

pause > nul

echo TERMINATING SERVICES...
taskkill /FI "WINDOWTITLE eq Celery Worker*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq Celery Beat*" /F /T > nul 2>&1
taskkill /FI "WINDOWTITLE eq Ngrok Tunnel*" /F /T > nul 2>&1