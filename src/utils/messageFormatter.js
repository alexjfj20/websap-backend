/**
 * Formatea un mensaje para compartir por WhatsApp u otros medios
 * @param {string} url - URL del menú compartido
 * @param {string} restaurantName - Nombre del restaurante
 * @returns {string} Mensaje formateado
 */
export function formatShareLinkMessage(url, restaurantName = 'Restaurante') {
  // Usar solo símbolos Unicode específicos que son compatibles
  const message = `*★ ¡Hola! 👋 Mira el menú de ${restaurantName} ★*\n\n` +
                `• 📲 Haz click aquí para ver nuestro menú:\n${url}\n\n` +
                `☆ 🍽 Te invitamos a conocer todas nuestras deliciosas opciones\n\n` +
                `✔ 💳 Aceptamos varios métodos de pago\n` +
                `♫ 🛵 ¡Haz tu pedido ya!`;
  
  return message;
}

/**
 * Formatea un mensaje de pedido para WhatsApp
 * @param {Object} orderData - Datos del pedido
 * @returns {string} - Mensaje formateado
 */
export function formatOrderMessage(orderData) {
  try {
    // Extraer datos con validación para evitar errores
    const { customer, businessName, orderItems, total, notes } = orderData || {};
    const safeName = customer?.name || 'Cliente';
    const safePhone = customer?.phone || '';
    const safeAddress = customer?.address || '';
    const safeBusiness = businessName || 'Restaurante';
    const safeTotal = typeof total === 'number' ? total.toFixed(2) : '0.00';
    const safeNotes = notes || '';
    
    // Verificar que orderItems sea un array
    const safeOrderItems = Array.isArray(orderItems) ? orderItems : [];
    
    // Construir el mensaje
    let message = `🍽️ *NUEVO PEDIDO - ${safeBusiness}* 🍽️\n\n`;
    message += `👤 *Cliente:* ${safeName}\n`;
    message += `📱 *Teléfono:* ${safePhone}\n`;
    message += `📍 *Dirección:* ${safeAddress}\n\n`;
    
    message += `*📋 DETALLE DEL PEDIDO:*\n`;
    
    // Listar cada item
    if (safeOrderItems.length > 0) {
      safeOrderItems.forEach(item => {
        const name = item.name || 'Producto';
        const price = typeof item.price === 'number' ? item.price.toFixed(2) : '0.00';
        const quantity = item.quantity || 1;
        const subtotal = (quantity * parseFloat(price)).toFixed(2);
        
        message += `- ${quantity}x ${name} - $${price} c/u = $${subtotal}\n`;
      });
    } else {
      message += "- No se especificaron productos\n";
    }
    
    message += `\n*💰 TOTAL:* $${safeTotal}\n\n`;
    
    // Agregar notas si existen
    if (safeNotes) {
      message += `*📝 NOTAS:*\n${safeNotes}\n\n`;
    }
    
    message += `¡Gracias por tu pedido! En breve nos pondremos en contacto contigo para confirmar.`;
    
    return message;
  } catch (error) {
    console.error('Error al formatear mensaje de pedido:', error);
    return '❌ Error al procesar el pedido. Por favor, contacta directamente al restaurante.';
  }
}

/**
 * Genera un mensaje de recibido de pedido para el cliente
 * @param {string} businessName - Nombre del negocio
 * @returns {string} - Mensaje formateado
 */
export function formatOrderReceivedMessage(businessName) {
  const safeBusiness = businessName || 'el restaurante';
  
  return `¡Gracias por tu pedido a ${safeBusiness}! Hemos recibido tu solicitud y te contactaremos en breve para confirmar los detalles y tiempo de entrega.`;
}

/**
 * Codifica un mensaje para ser enviado por WhatsApp
 * @param {string} message - Mensaje a codificar
 * @returns {string} Mensaje codificado para WhatsApp
 */
export function encodeWhatsAppMessage(message) {
  return encodeURIComponent(message);
}
