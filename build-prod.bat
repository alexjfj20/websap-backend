@echo off
REM Script para compilar la aplicación Vue para producción

echo ===== CONSTRUYENDO APLICACION PARA PRODUCCION =====

REM Limpiar directorio de distribución anterior si existe
if exist dist rmdir /s /q dist
echo * Directorio dist limpiado

REM Establecer NODE_ENV a production para asegurar URLs correctas
set NODE_ENV=production

REM Ejecutar el comando de compilación
echo * Compilando aplicación...
call npm run build

echo * Compilación completada

REM Verificar si la compilación fue exitosa
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: La compilación falló con código de error %ERRORLEVEL%
  exit /b %ERRORLEVEL%
)

echo ===== COMPILACION EXITOSA =====
echo La aplicación está lista en el directorio 'dist'
echo Ahora puedes subir los archivos a tu servidor web

pause