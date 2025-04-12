// Función mejorada para adaptación de datos
export const adaptPlatoData = (formData) => {
  console.log('Adaptando datos del formulario:', formData);
  
  // Para el formulario de la imagen que compartiste (cochinita pibil)
  if (typeof formData === 'object') {
    // Primera verificación: si tiene plato_especial o refresco
    if ('plato_especial' in formData || 'refresco' in formData) {
      return {
        name: formData.plato_especial || formData.nombre || 'Sin nombre',
        description: formData.descripcion || '',
        price: parseFloat(formData.precio) || 0,
        category: 'principal', // Valor por defecto
        image_url: formData.imagen || '',
        is_available: true
      };
    }
    
    // Segunda verificación: si el formulario usa nombres en español
    if (formData.nombre && !formData.name) {
      return {
        name: formData.nombre,
        description: formData.descripcion || '',
        price: parseFloat(formData.precio) || 0,
        category: formData.categoria || 'principal',
        image_url: formData.imagen || '',
        is_available: true
      };
    }
  }
  
  // Verificar si los campos obligatorios existen
  if (!formData.name) {
    console.warn('⚠️ El objeto formData no tiene un campo name válido:', formData);
    // Podemos crear un nombre por defecto para evitar errores
    formData.name = 'Plato sin nombre';
  }
  
  if (!formData.price || isNaN(parseFloat(formData.price))) {
    console.warn('⚠️ El objeto formData no tiene un precio válido:', formData);
    formData.price = 0;
  }
  
  // Si ya tiene el formato correcto o no es un objeto reconocible
  return formData;
}; 