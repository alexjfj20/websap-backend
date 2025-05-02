// Script de diagnóstico para la carga de la aplicación
// Debe incluirse en el index.html justo antes del cierre de la etiqueta </body>

(function() {
  console.log('Script de diagnóstico WebSAP iniciado');

  // Variables para rastreo
  const loadTimes = {};
  const errors = [];
  const warnings = [];
  let startTime = performance.now();

  // Verificar recursos clave
  const resourcesToCheck = [
    'js/app.js',
    'js/chunk-vendors.js',
    'css/app.css'
  ];

  // Función para verificar si un archivo existe
  function checkResource(url) {
    return new Promise((resolve, reject) => {
      fetch(url)
        .then(response => {
          if (response.ok) {
            console.log(`✅ Recurso encontrado: ${url}`);
            resolve(true);
          } else {
            console.error(`❌ Recurso no encontrado: ${url} (${response.status})`);
            errors.push(`Recurso no encontrado: ${url} (${response.status})`);
            resolve(false);
          }
        })
        .catch(error => {
          console.error(`❌ Error al verificar recurso ${url}:`, error);
          errors.push(`Error al verificar recurso ${url}: ${error.message}`);
          resolve(false);
        });
    });
  }

  // Verificar si Vue se cargó correctamente
  function checkVue() {
    if (window.Vue) {
      console.log('✅ Vue.js cargado correctamente');
      return true;
    } else {
      console.error('❌ Vue.js no se ha cargado');
      errors.push('Vue.js no se ha cargado');
      return false;
    }
  }

  // Verificar si el componente raíz se montó
  function checkAppMount() {
    const appElement = document.getElementById('app');
    if (!appElement) {
      console.error('❌ Elemento #app no encontrado en el DOM');
      errors.push('Elemento #app no encontrado en el DOM');
      return false;
    }

    if (appElement.children.length <= 1) {
      console.warn('⚠️ La aplicación posiblemente no se ha montado (pocos elementos hijos)');
      warnings.push('La aplicación posiblemente no se ha montado (pocos elementos hijos)');
      return false;
    }

    console.log('✅ La aplicación parece estar montada correctamente');
    return true;
  }

  // Verificar si hay errores de JavaScript
  function setupErrorListener() {
    window.addEventListener('error', function(event) {
      console.error('❌ Error de JavaScript:', event.message);
      errors.push(`Error de JavaScript: ${event.message} en ${event.filename}:${event.lineno}`);
    });

    window.addEventListener('unhandledrejection', function(event) {
      console.error('❌ Promesa rechazada sin manejar:', event.reason);
      errors.push(`Promesa rechazada sin manejar: ${event.reason}`);
    });
  }

  // Mostrar resultados de diagnóstico
  function showResults() {
    const loadTime = performance.now() - startTime;
    console.log(`Diagnóstico completado en ${loadTime.toFixed(2)}ms`);
    
    if (errors.length > 0) {
      console.error('❌ ERRORES ENCONTRADOS:', errors.length);
      errors.forEach((error, i) => console.error(`${i + 1}. ${error}`));
      
      // Mostrar mensaje al usuario
      const errorDiv = document.createElement('div');
      errorDiv.style.position = 'fixed';
      errorDiv.style.bottom = '10px';
      errorDiv.style.right = '10px';
      errorDiv.style.backgroundColor = '#ffebee';
      errorDiv.style.border = '1px solid #f44336';
      errorDiv.style.padding = '10px';
      errorDiv.style.borderRadius = '5px';
      errorDiv.style.zIndex = '9999';
      
      errorDiv.innerHTML = `
        <h3 style="margin-top: 0; color: #d32f2f;">Problemas detectados (${errors.length})</h3>
        <p>Se han encontrado problemas que pueden afectar el funcionamiento de la aplicación.</p>
        <ul style="color: #d32f2f; text-align: left;">
          ${errors.map(error => `<li>${error}</li>`).join('')}
        </ul>
        <p>Por favor, contacte al administrador o revise la consola para más detalles.</p>
        <button onclick="this.parentNode.style.display='none'" style="background: #d32f2f; color: white; border: none; padding: 5px 10px; cursor: pointer;">Cerrar</button>
      `;
      
      document.body.appendChild(errorDiv);
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️ ADVERTENCIAS:', warnings.length);
      warnings.forEach((warning, i) => console.warn(`${i + 1}. ${warning}`));
    }
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ No se encontraron problemas');
    }
  }

  // Ejecutar diagnóstico cuando la página se cargue
  window.addEventListener('load', async function() {
    console.log('Página cargada, ejecutando diagnóstico...');
    
    // Verificar recursos
    const checks = await Promise.all(resourcesToCheck.map(checkResource));
    
    // Verificar Vue y montaje después de un breve retraso
    setTimeout(() => {
      checkVue();
      checkAppMount();
      showResults();
    }, 1000);
  });

  // Configurar captura de errores
  setupErrorListener();
})();