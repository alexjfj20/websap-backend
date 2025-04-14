const fetch = require('node-fetch');

(async () => {
  const serverUrl = 'http://localhost:3000/api/ping'; // Cambia esto si el servidor está en otro puerto o URL

  try {
    console.log(`Intentando conectar con el servidor en: ${serverUrl}`);
    const response = await fetch(serverUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (response.ok) {
      console.log('Conexión exitosa con el servidor. Respuesta:', await response.text());
    } else {
      console.error('El servidor respondió con un error. Código de estado:', response.status);
    }
  } catch (error) {
    console.error('Error al intentar conectar con el servidor:', error.message);
  }
})();
