@echo off
REM Script para actualizar el repositorio de GitHub

REM Navegamos al directorio del proyecto
cd "f:\Driver google\VUE.JS-2\VUE-JS\websap"

REM Añadimos todos los cambios
git add .

REM Pedimos al usuario que introduzca un mensaje para el commit
set /p commit_msg="Introduce el mensaje del commit: "

REM Realizamos el commit con el mensaje proporcionado
git commit -m "%commit_msg%"

REM Subimos los cambios a GitHub
git push

echo Cambios subidos correctamente a GitHub
pause