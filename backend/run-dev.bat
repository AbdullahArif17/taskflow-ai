@echo off
setlocal
set "PROJECT_ROOT=%~dp0"
set "PYTHON=%PROJECT_ROOT%.venv\Scripts\python.exe"

if not exist "%PYTHON%" (
  echo Missing virtualenv. Run:
  echo python -m venv .venv
  echo .\.venv\Scripts\python.exe -m pip install -r requirements.txt
  exit /b 1
)

"%PYTHON%" -m uvicorn main:app --port 8010
