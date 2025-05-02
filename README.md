# WebSAP Backend

Backend para la aplicación WebSAP que gestiona restaurantes.

## Información importante sobre la conexión a la base de datos

Actualmente, existe un problema al conectarse a la base de datos desde Render. El error es:

```
Access denied for user 'xpprgktm_websap_user'@'ec2-34-213-214-55.us-west-2.compute.amazonaws.com'
```

Esto ocurre porque el hosting de MySQL en allseo.xyz no permite conexiones remotas desde servidores fuera de su red.

### Soluciones posibles:

1. **Configurar permisos de MySQL en cPanel:**
   - Ir a cPanel > MySQL Databases
   - Localizar el usuario `xpprgktm_websap_user`
   - Editar los permisos para permitir conexiones desde cualquier host (`%`) o específicamente desde Render

2. **Usar un servicio de base de datos en la nube:**
   - Migrar a una base de datos MySQL alojada en servicios como AWS RDS, Google Cloud SQL, o similares
   - Actualizar las variables de entorno en Render con la nueva información de conexión

3. **Implementar una solución VPN/Túnel:**
   - Configurar un túnel SSH entre Render y allseo.xyz
   - Esto requiere configuración adicional en ambos servidores

## Solución implementada temporalmente

Para evitar interrupciones en el servicio, se ha implementado una **solución temporal** que:

1. Intenta conectar a la base de datos real
2. Si falla, utiliza datos simulados para que la aplicación siga funcionando
3. Las respuestas incluyen un encabezado `X-Data-Source: simulated` cuando se usan datos simulados

## Variables de entorno requeridas

```
NODE_ENV=production
PORT=10000
DB_HOST=allseo.xyz
DB_USER=xpprgktm_websap_user
DB_PASSWORD=tu_contraseña
DB_NAME=xpprgktm_websap
CORS_ORIGIN=https://allseo.xyz
```

## Desarrollo y despliegue

Para actualizar el repositorio:
- Backend: `.\subir-backend-github.bat`
- Frontend: `.\subir-frontend-github.bat`