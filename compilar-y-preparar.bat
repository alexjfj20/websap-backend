@echo off
echo ==============================================
echo   Compilando y preparando archivos para BanaHosting
echo ==============================================
echo.

:: Paso 1: Compilar el proyecto Vue
echo [1/5] Compilando la aplicacion Vue.js...
call npm run build
if %errorlevel% neq 0 (
  echo.
  echo ❌ ERROR: La compilacion ha fallado.
  echo Por favor, verifica que todas las dependencias esten instaladas.
  pause
  exit /b 1
)

:: Paso 2: Copiar .htaccess a dist
echo.
echo [2/5] Copiando el archivo .htaccess a la carpeta dist...
if exist dist\. (
  copy .htaccess dist\ >nul
) else (
  echo ❌ ERROR: La carpeta dist no existe. La compilación puede haber fallado.
  pause
  exit /b 1
)

:: Paso 3: Crear carpeta de despliegue y copiar archivos
echo.
echo [3/5] Creando carpeta de despliegue...
if exist "despliegue" rmdir /s /q "despliegue"
mkdir "despliegue"
xcopy dist\*.* despliegue\ /e /i /h >nul

:: Paso 4: Comprimir la carpeta despliegue a .zip
echo.
echo [4/5] Comprimiendo archivos en despliegue.zip...
if exist "despliegue.zip" del "despliegue.zip"
powershell Compress-Archive -Path despliegue\* -DestinationPath despliegue.zip

if %errorlevel% neq 0 (
  echo ❌ ERROR: No se pudo crear el archivo ZIP.
  pause
  exit /b 1
)

:: Paso 5: Mensaje final
echo.
echo [5/5] ✅ Preparacion completada!
echo.
echo 📂 Archivos listos en la carpeta "despliegue"
echo 📦 Archivo comprimido creado: "despliegue.zip"
echo 🚀 Puedes subir el ZIP o el contenido de la carpeta al hosting.
echo.

pause
