# Solución al error de acceso denegado a la base de datos

El error que estás viendo es porque tu usuario de MySQL `xpprgktm_websap_user` no tiene permiso para conectarse desde el servidor de Render (ec2-34-213-214-55.us-west-2.compute.amazonaws.com).

## Opción 1: Otorgar permisos remotos a través de cPanel

1. **Accede a tu cPanel** de allseo.xyz
2. Busca la sección **Bases de datos** y haz clic en **MySQL Databases**
3. Desplázate hacia abajo hasta la sección **MySQL Users** (Usuarios MySQL)
4. Encuentra el usuario `xpprgktm_websap_user` y haz clic en **Modificar privilegios** o **Permisos**
5. Añade `%` o la IP específica de Render (`ec2-34-213-214-55.us-west-2.compute.amazonaws.com`) como host permitido

## Opción 2: Ejecutar script SQL en phpMyAdmin

1. **Accede a tu cPanel**
2. Abre **phpMyAdmin**
3. Selecciona la pestaña **SQL**
4. Copia y pega el contenido del archivo `grant_remote_access.sql`
5. Haz clic en **Ejecutar**

## Opción 3: Solicitar ayuda al soporte del hosting

Si las opciones anteriores no funcionan, contacta al soporte técnico de tu hosting y pídeles que:
- Permitan el acceso remoto al usuario `xpprgktm_websap_user` desde cualquier host (`%`)
- O específicamente desde la IP de Render (`ec2-34-213-214-55.us-west-2.compute.amazonaws.com`)

## Verificación

Después de aplicar alguna de estas soluciones, vuelve a desplegar tu aplicación en Render para verificar si el error se ha solucionado.

Si sigues teniendo problemas, considera usar una base de datos en la nube como MongoDB Atlas, AWS RDS, o similares, que están diseñadas para permitir conexiones remotas de forma segura.