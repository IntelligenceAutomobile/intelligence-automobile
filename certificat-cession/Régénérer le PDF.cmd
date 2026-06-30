@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  Regeneration du certificat de cession TransakAuto...
echo.
python build_certificat.py
if errorlevel 1 (
  echo.
  echo  ERREUR : verifiez que Python et les dependances sont installes :
  echo     pip install reportlab pymupdf pypdf
  echo.
  pause
  exit /b 1
)
echo.
echo  Termine. Les PDF sont dans le dossier  out\
echo.
pause
