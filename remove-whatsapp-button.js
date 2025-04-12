const fs = require('fs');
const path = require('path');

// Ruta al archivo
const filePath = path.join(__dirname, 'src', 'views', 'SharedMenuView.vue');

// Leer el archivo
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error al leer el archivo:', err);
    return;
  }

  // Eliminar el botón de WhatsApp
  const buttonRegex = /<button\s+@click="shareOrderByWhatsApp"\s+class="whatsapp-order-btn">\s*<span\s+class="btn-icon">📱<\/span>\s*Enviar\s+por\s+WhatsApp\s*<\/button>/g;
  const modifiedContent = data.replace(buttonRegex, '');

  // Escribir el archivo modificado
  fs.writeFile(filePath, modifiedContent, 'utf8', (err) => {
    if (err) {
      console.error('Error al escribir el archivo:', err);
      return;
    }
    console.log('El botón de WhatsApp ha sido eliminado correctamente.');
  });
});
