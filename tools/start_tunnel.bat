@echo off
echo ===================================================
echo   DocuGraph AI - Khoi tao Cloudflare Public Tunnel
echo ===================================================
echo Dang ket noi Backend cong 8000 ra Internet...
"d:\HocTap\N4\DA_NEN_TANG\DocuGraph-Learning Support & Document Summary Assistant\tools\cloudflared.exe" tunnel --url http://127.0.0.1:8000
