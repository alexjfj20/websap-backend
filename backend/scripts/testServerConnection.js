const fetch = require('node-fetch');

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout

(async () => {
  const menuId = 'mp5ikae2iwfm1sk9'; // Ejemplo de ID de menú público
  const serverUrl = `https://websap-backend.onrender.com/api/platos/menu/${menuId}`; // Endpoint para obtener el menú público

  try {
    console.log(`Intentando conectar con el servidor en: ${serverUrl}`);
    const response = await fetch(serverUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout); // Limpiar el timeout si la solicitud se completa

    if (response.ok) {
      console.log('Conexión exitosa con el servidor. Respuesta:', await response.text());
    } else {
      console.error('El servidor respondió con un error. Código de estado:', response.status);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('La solicitud fue abortada debido a un timeout.');
    } else {
      console.error('Error al intentar conectar con el servidor:', error.message);
    }
  }
})();
