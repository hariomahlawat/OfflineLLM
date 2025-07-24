Write-Host "📦 Setting up OfflineLLM development environment…"

# 1) Python
if (-Not (Test-Path .venv)) {
  Write-Host "🔧 Creating Python venv..."
  python -m venv .venv
}
Write-Host "⚡ Activating venv and installing Python deps..."
. .\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt

# 2) Node
Write-Host "🔧 Installing Node.js deps in ./frontend..."
Push-Location frontend
npm ci
Pop-Location

# 3) HTTPS certs (mkcert)
if (Get-Command mkcert -ErrorAction SilentlyContinue) {
  Write-Host "🔐 Generating local certs with mkcert…"
  New-Item -ItemType Directory -Force certs
  mkcert -install
  mkcert -cert-file certs/localhost.pem -key-file certs/localhost-key.pem localhost 127.0.0.1 ::1
  Write-Host "✅ Certs in frontend\certs\"
} else {
  Write-Host "⚠️  mkcert not found; skipping HTTPS cert generation"
}

Write-Host "🎉 Setup complete! Run '. .\.venv\Scripts\Activate.ps1' and then your usual npm / Docker commands."

