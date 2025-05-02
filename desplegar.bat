@echo off
echo ===================================================
echo        DESPLIEGUE DE WEBSAP EN PRODUCCION
echo ===================================================
echo.

echo [1/5] Compilando frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
  echo ERROR: Error al compilar el frontend
  exit /b %errorlevel%
)

echo [2/5] Copiando archivo .htaccess...
copy ..\\.htaccess dist\\.htaccess
if %errorlevel% neq 0 (
  echo ADVERTENCIA: Error al copiar .htaccess
  echo Creando archivo .htaccess basico...
  echo ^<IfModule mod_rewrite.c^> > dist\\.htaccess
  echo   RewriteEngine On >> dist\\.htaccess
  echo   RewriteBase /websap/ >> dist\\.htaccess
  echo   RewriteRule ^index\\.html$ - [L] >> dist\\.htaccess
  echo   RewriteCond %{REQUEST_FILENAME} !-f >> dist\\.htaccess
  echo   RewriteCond %{REQUEST_FILENAME} !-d >> dist\\.htaccess
  echo   RewriteRule . /websap/index.html [L] >> dist\\.htaccess
  echo ^</IfModule^> >> dist\\.htaccess
)

echo [3/5] Preparando archivos para produccion...
cd ..

echo [4/5] Verificando configuracion...
if not exist ".env" (
  echo ADVERTENCIA: No se encuentra el archivo .env
  echo Creando archivo .env con configuracion de ejemplo...
  echo NODE_ENV=production > .env
  echo PORT=10000 >> .env
  echo DB_HOST=allseo.xyz >> .env
  echo DB_USER=xpprgktm_websap_user >> .env
  echo DB_PASS=!qfLD@C9{*$c >> .env
  echo DB_NAME=xpprgktm_websap >> .env
  echo CORS_ORIGIN=https://allseo.xyz >> .env
)

echo [5/5] Creando archivo README con instrucciones...
echo # WebSAP - Instrucciones de despliegue > README_DESPLIEGUE.md
echo. >> README_DESPLIEGUE.md
echo ## Frontend >> README_DESPLIEGUE.md
echo. >> README_DESPLIEGUE.md
echo 1. Sube todos los archivos de la carpeta `frontend/dist` al directorio `/websap/` en tu servidor web. >> README_DESPLIEGUE.md
echo 2. Asegurate de que el archivo `.htaccess` se haya subido correctamente. >> README_DESPLIEGUE.md
echo. >> README_DESPLIEGUE.md
echo ## Backend >> README_DESPLIEGUE.md
echo. >> README_DESPLIEGUE.md
echo El backend ya esta desplegado en Render.com en la URL: >> README_DESPLIEGUE.md
echo https://websap-backend.onrender.com >> README_DESPLIEGUE.md
echo. >> README_DESPLIEGUE.md
echo ### Credenciales de base de datos >> README_DESPLIEGUE.md
echo. >> README_DESPLIEGUE.md
echo Host: allseo.xyz >> README_DESPLIEGUE.md
echo Usuario: xpprgktm_websap_user >> README_DESPLIEGUE.md
echo Password: !qfLD@C9{*$c >> README_DESPLIEGUE.md
echo Base de datos: xpprgktm_websap >> README_DESPLIEGUE.md
echo. >> README_DESPLIEGUE.md
echo ### Credenciales de la aplicacion >> README_DESPLIEGUE.md
echo. >> README_DESPLIEGUE.md
echo Usuario: admin >> README_DESPLIEGUE.md
echo Password: admin123 >> README_DESPLIEGUE.md
echo. >> README_DESPLIEGUE.md
echo ## Estructura de archivos >> README_DESPLIEGUE.md
echo. >> README_DESPLIEGUE.md
echo - `frontend/dist/`: Archivos compilados del frontend >> README_DESPLIEGUE.md
echo - `src/`: Codigo fuente del backend >> README_DESPLIEGUE.md
echo - `server.js`: Archivo principal del servidor >> README_DESPLIEGUE.md
echo - `.env`: Configuracion de variables de entorno >> README_DESPLIEGUE.md
echo. >> README_DESPLIEGUE.md

echo.
echo ===================================================
echo        DESPLIEGUE COMPLETADO CON EXITO
echo ===================================================
echo.
echo Los archivos para subir al servidor estan en:
echo   frontend/dist/
echo.
echo Para completar el despliegue:
echo 1. Sube todos los archivos de "frontend/dist" a:
echo    https://allseo.xyz/websap/
echo.
echo 2. Asegurate que el archivo ".htaccess" este incluido
echo    (este archivo puede estar oculto en Windows)
echo.
echo 3. El backend ya esta desplegado en:
echo    https://websap-backend.onrender.com
echo.
echo Las credenciales de acceso son:
echo   Usuario: admin
echo   Contraseña: admin123
echo.
echo Para más detalles, consulta el archivo README_DESPLIEGUE.md
echo.
pause