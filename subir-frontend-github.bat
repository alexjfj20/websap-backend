@echo off
REM Script para subir el frontend a GitHub
echo ====================================================
echo    DESPLIEGUE A GITHUB - WEBSAP FRONTEND
echo ====================================================

REM Pedir la ubicación del proyecto frontend
set /p frontend_path="Introduce la ruta completa del proyecto frontend (ejemplo: c:\proyectos\websap-frontend): "

REM Verificar si existe la ruta
if not exist "%frontend_path%" (
    echo ERROR: La ruta proporcionada no existe.
    pause
    exit /b 1
)

REM Navegamos al directorio del proyecto frontend
cd /d "%frontend_path%"

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

REM Añadir todos los cambios a git
git add .

REM Pedir mensaje para el commit
set /p commit_msg="Introduce el mensaje para el commit: "

REM Realizar el commit
echo Creando commit con mensaje: "%commit_msg%"
git commit -m "%commit_msg%"

REM Subir los cambios a GitHub
echo Subiendo cambios a GitHub...

REM Verificar si la rama tiene upstream configurado
git rev-parse --abbrev-ref --symbolic-full-name @{upstream} >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo La rama actual no tiene una rama de seguimiento configurada.
    echo Configurando rama de seguimiento y subiendo cambios...
    
    REM Preguntar el nombre de la rama remota
    set /p branch_name="Nombre de la rama (normalmente 'main' o 'master'): "
    git push --set-upstream origin %branch_name%
) else (
    git push
)

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: No se pudieron subir los cambios a GitHub.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ====================================================
echo ¡Despliegue del frontend completado con éxito!
echo Los cambios han sido subidos a GitHub.
echo ====================================================
pause