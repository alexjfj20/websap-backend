@echo off
REM Script para compilar la aplicación para producción y subirla a GitHub
echo ====================================================
echo    COMPILACIÓN Y DESPLIEGUE A GITHUB - WEBSAP
echo ====================================================

REM Navegamos al directorio del proyecto
cd "f:\Driver google\VUE.JS-2\VUE-JS\websap"

REM Aseguramos que estamos en la rama correcta (normalmente main o master)
echo Verificando rama de git...
git branch
echo.

set /p confirm_branch="¿Es esta la rama correcta para producción? (S/N): "
if /i "%confirm_branch%"=="N" (
    echo Operación cancelada. Por favor, cambia a la rama correcta con 'git checkout [rama]'.
    pause
    exit /b 1
)

REM Comprobar si hay cambios sin confirmar
echo Verificando cambios pendientes...
git status
echo.

REM Compilar la aplicación para producción
echo Compilando aplicación para producción...
call npm run build

REM Verificar si la compilación fue exitosa
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: La compilación ha fallado con código %ERRORLEVEL%.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Compilación completada correctamente.
echo La aplicación está lista en la carpeta 'dist'.
echo.

REM Añadir todos los cambios a git
git add .

REM Pedir mensaje para el commit
set /p commit_msg="Introduce el mensaje para el commit de producción: "

REM Realizar el commit
echo Creando commit con mensaje: "%commit_msg%"
git commit -m "Build: %commit_msg%"

REM Subir los cambios a GitHub
echo Subiendo cambios a GitHub...
git push

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudieron subir los cambios a GitHub.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ====================================================
echo ¡Compilación y despliegue completados con éxito!
echo Los cambios han sido subidos a GitHub.
echo ====================================================
pause
