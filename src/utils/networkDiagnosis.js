// networkDiagnosis.js - Utilidad para diagnosticar problemas de red

/**
 * Realiza un diagnóstico completo de la red y conexiones API
 * @returns {Promise<Object>} - Resultados del diagnóstico
 */
export const diagnoseNetworkIssues = async () => {
  console.log('🔍 Iniciando diagnóstico de red...');
  
  const results = {
    internet: false,
    dns: false,
    apis: {
      main: false,
      alternative: false
    },
    cors: false,
    details: {}
  };

  // 1. Verificar conexión a Internet
  results.internet = navigator.onLine;
  console.log(`🌐 Conexión a Internet: ${results.internet ? 'Disponible' : 'No disponible'}`);

  if (!results.internet) {
    console.log('❌ No hay conexión a Internet. No se pueden realizar más pruebas.');
    return results;
  }

  // 2. Verificar resolución DNS
  try {
    results.details.dnsTest = await testDnsResolution();
    results.dns = results.details.dnsTest.success;
  } catch (error) {
    console.error('Error en prueba DNS:', error);
    results.dns = false;
  }

  // 3. Probar APIs
  const apiTestResults = await testAllApis();
  results.apis = apiTestResults;

  // 4. Verificar CORS
  if (apiTestResults.main || apiTestResults.alternative) {
    try {
      results.cors = await testCorsConfiguration();
      console.log(`CORS configuración: ${results.cors ? 'Correcta' : 'Problemas detectados'}`);
    } catch (error) {
      console.error('Error en prueba CORS:', error);
      results.cors = false;
    }
  }

  // Añadir recomendaciones basadas en los resultados
  results.recommendations = getRecommendations(results);

  console.log('📊 Diagnóstico completado:', results);
  return results;
};

/**
 * Verifica si hay resolución DNS para los dominios de la API
 */
const testDnsResolution = async () => {
  console.log('🔍 Verificando resolución DNS...');
    // Prueba de múltiples dominios para verificar DNS
  const domainsToTest = [
    { url: 'https://websap-backend.onrender.com/ping', name: 'API Principal' },
    { url: 'https://allseo.xyz/ping', name: 'Dominio Principal' },
    { url: 'https://google.com', name: 'Referencia Externa' }
  ];

  const results = { success: false, details: [] };

  // Usar Promise.allSettled para probar todos los dominios sin fallar si uno no funciona
  const dnsTests = await Promise.allSettled(
    domainsToTest.map(async domain => {
      try {
        // Usar fetch con timeout para detectar problemas de DNS
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(domain.url, { 
          method: 'HEAD',
          mode: 'no-cors', // Importante para evitar errores CORS en esta prueba
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const domainResult = {
          domain: domain.name,
          url: domain.url,
          resolved: true,
          status: 'DNS OK'
        };
        
        results.details.push(domainResult);
        return domainResult;
      } catch (error) {
        // Determinar si es un error DNS o de otro tipo
        const isDnsError = 
          error.message.includes('net::ERR_NAME_NOT_RESOLVED') || 
          error.message.includes('NS_ERROR_UNKNOWN_HOST');
        
        const domainResult = {
          domain: domain.name,
          url: domain.url,
          resolved: false,
          status: isDnsError ? 'Error DNS' : `Error: ${error.message}`
        };
        
        results.details.push(domainResult);
        return domainResult;
      }
    })
  );

  // Comprobar si al menos Google se resolvió correctamente (prueba general de DNS)
  const googleTest = results.details.find(d => d.domain === 'Referencia Externa');
  if (googleTest && googleTest.resolved) {
    console.log('✅ DNS funcionando (Google resuelto correctamente)');
    results.success = true;
  } else {
    console.error('❌ Problemas generales de DNS detectados');
    results.success = false;
  }

  // Verificar si los dominios de la API se resolvieron
  const apiDomainTest = results.details.find(d => d.domain === 'API Principal');
  if (apiDomainTest && apiDomainTest.resolved) {
    console.log('✅ DNS para API Principal correcto');
  } else {
    console.warn('⚠️ No se pudo resolver el dominio API Principal');
  }

  return results;
};

/**
 * Prueba todas las posibles APIs
 */
const testAllApis = async () => {
  console.log('🔍 Probando todas las APIs disponibles...');
  
  const results = {
    main: false,
    alternative: false,
    local: false,
    working: null,
    details: []
  };

  // Lista de APIs a probar
  const apiEndpoints = [
    { url: 'https://websap-backend.onrender.com/api/test/ping', name: 'API Principal' },
    { url: 'https://allseo.xyz/api/test/ping', name: 'Dominio Principal' },
    { url: 'https://api.websap.app/api/test/ping', name: 'API Alternativa' },
    { url: 'http://localhost:3000/api/test/ping', name: 'Local 3000' },
    { url: 'http://localhost:8080/api/test/ping', name: 'Local 8080' }
  ];

  // Probar cada endpoint
  for (const api of apiEndpoints) {
    try {
      console.log(`🔍 Probando API en: ${api.url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(api.url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
        credentials: 'omit' // No enviar cookies
      });
      
      clearTimeout(timeoutId);
      
      const apiResult = {
        name: api.name,
        url: api.url,
        status: response.status,
        working: response.ok
      };
      
      if (response.ok) {
        console.log(`✅ API ${api.name} funcionando correctamente`);
        
        // Actualizar resultados según el tipo de API
        if (api.name === 'API Principal') {
          results.main = true;
          results.working = api.url;
        } else if (api.name === 'API Alternativa' || api.name === 'Dominio Principal') {
          results.alternative = true;
          if (!results.working) results.working = api.url;
        } else if (api.name.startsWith('Local')) {
          results.local = true;
          if (!results.working) results.working = api.url;
        }
      }
      
      results.details.push(apiResult);
    } catch (error) {
      console.warn(`❌ No se pudo conectar con ${api.name}:`, error);
      
      results.details.push({
        name: api.name,
        url: api.url,
        status: 'error',
        working: false,
        error: error.name === 'AbortError' ? 'Timeout' : error.message
      });
    }
  }

  // Informar del resultado general
  if (results.main || results.alternative || results.local) {
    console.log(`✅ Se encontró al menos una API funcionando: ${results.working}`);
  } else {
    console.error('❌ No se pudo conectar con ninguna API');
  }

  return results;
};

/**
 * Verifica si la configuración CORS está correcta
 */
const testCorsConfiguration = async () => {
  // Usar la API que funciona (si hay alguna)
  const testEndpoint = localStorage.getItem('apiUrl') || 'https://websap-backend.onrender.com';
  
  try {
    const response = await fetch(`${testEndpoint}/api/test/cors`, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    // Verificar si hay headers CORS en la respuesta
    const hasAccessControlHeader = response.headers.get('Access-Control-Allow-Origin');
    
    if (hasAccessControlHeader) {
      console.log('✅ Configuración CORS correcta');
      return true;
    } else {
      console.warn('⚠️ No se detectaron headers CORS en la respuesta');
      return false;
    }
  } catch (error) {
    console.error('❌ Error al verificar configuración CORS:', error);
    return false;
  }
};

/**
 * Genera recomendaciones basadas en los resultados del diagnóstico
 */
const getRecommendations = (results) => {
  const recommendations = [];
  
  if (!results.internet) {
    recommendations.push('Verifica tu conexión a Internet. La aplicación no puede detectar una conexión activa.');
  }
  
  if (!results.dns && results.internet) {
    recommendations.push('Hay problemas con la resolución DNS. Verifica que el dominio websap-backend.onrender.com esté correctamente configurado y propagado.');
  }
  
  if (!results.apis.main && !results.apis.alternative && results.dns) {
    recommendations.push('El servidor API no responde. Verifica que el servidor esté en funcionamiento.');
  }
  
  if (!results.cors && (results.apis.main || results.apis.alternative)) {
    recommendations.push('Hay problemas con la configuración CORS. Asegúrate de que el servidor permita solicitudes desde ' + window.location.origin);
  }
  
  if (recommendations.length === 0 && (results.apis.main || results.apis.alternative)) {
    // Si todo parece estar bien pero aún hay problemas
    recommendations.push('La conexión parece estar configurada correctamente. Si sigues experimentando problemas, verifica:');
    recommendations.push('- Que no haya bloqueos de firewall o proxy');
    recommendations.push('- Que las rutas específicas que estás intentando acceder estén disponibles');
    recommendations.push('- Revisa los logs del servidor para errores internos');
  }
  
  return recommendations;
};

/**
 * Devuelve un informe en formato HTML del diagnóstico
 */
export const generateDiagnosisReport = (results) => {
  let report = `<div class="network-diagnosis">
    <h3>Diagnóstico de Conexión</h3>
    <ul>
      <li class="${results.internet ? 'success' : 'error'}">
        Conexión a Internet: ${results.internet ? '✅ Conectado' : '❌ No conectado'}
      </li>
      <li class="${results.dns ? 'success' : 'error'}">
        Resolución DNS: ${results.dns ? '✅ Correcta' : '❌ Problemas detectados'}
      </li>
      <li class="${results.apis.main || results.apis.alternative ? 'success' : 'error'}">
        Conexión API: ${results.apis.main || results.apis.alternative ? '✅ Disponible' : '❌ No disponible'}
        ${results.apis.working ? `<small>(${results.apis.working})</small>` : ''}
      </li>
      <li class="${results.cors !== false ? 'success' : 'error'}">
        Configuración CORS: ${results.cors ? '✅ Correcta' : '⚠️ Posibles problemas'}
      </li>
    </ul>`;
    
  if (results.recommendations && results.recommendations.length > 0) {
    report += `<div class="recommendations">
      <h4>Recomendaciones:</h4>
      <ul>
        ${results.recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    </div>`;
  }
  
  report += '</div>';
  
  return report;
};

export default {
  diagnoseNetworkIssues,
  generateDiagnosisReport
};