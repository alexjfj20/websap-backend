-- Script para otorgar permisos de acceso remoto al usuario de la base de datos
-- Ejecutar este script en phpMyAdmin o en el panel SQL de cPanel

-- Primero, crear el usuario si no existe (normalmente ya existe)
CREATE USER IF NOT EXISTS 'xpprgktm_websap_user'@'%' IDENTIFIED BY '!qfLD@C9{*$c';

-- Otorgar todos los privilegios al usuario para la base de datos websap desde cualquier host
GRANT ALL PRIVILEGES ON xpprgktm_websap.* TO 'xpprgktm_websap_user'@'%';

-- Otorgar permiso específico para el host de Render
-- Opcionalmente puedes usar la IP específica en lugar de '%'
GRANT ALL PRIVILEGES ON xpprgktm_websap.* TO 'xpprgktm_websap_user'@'ec2-34-213-214-55.us-west-2.compute.amazonaws.com';

-- Actualizar privilegios
FLUSH PRIVILEGES;