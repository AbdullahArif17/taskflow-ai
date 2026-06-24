$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Python = Join-Path $ProjectRoot ".venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
  Write-Error "Missing virtualenv. Run: python -m venv .venv; .\.venv\Scripts\python.exe -m pip install -r requirements.txt"
}

& $Python -m uvicorn main:app --port 8010
