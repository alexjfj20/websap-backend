// src/services/imageService.js

/**
 * Servicio para el manejo y optimización de imágenes
 */

/**
 * Comprime una imagen en formato base64 para reducir su tamaño
 * @param {string} base64Image - Imagen en formato base64
 * @param {number} maxWidth - Ancho máximo de la imagen comprimida
 * @param {number} quality - Calidad de la imagen (0-1)
 * @returns {Promise<string>} - Imagen comprimida en formato base64
 */
export const compressImage = (base64Image, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    try {
      // Verificar que la imagen sea válida
      if (!base64Image || typeof base64Image !== 'string') {
        console.warn('La imagen no es válida para compresión');
        resolve(base64Image);
        return;
      }

      // Crear una imagen para cargar el base64
      const img = new Image();
      img.onload = () => {
        // Crear un canvas para la compresión
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Redimensionar si es necesario
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        // Establecer dimensiones del canvas
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar la imagen en el canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a base64 con la calidad especificada
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // Verificar si realmente se redujo el tamaño
        if (compressedBase64.length < base64Image.length) {
          console.log(`Imagen comprimida: ${Math.round(compressedBase64.length / 1024)}KB (original: ${Math.round(base64Image.length / 1024)}KB)`);
          resolve(compressedBase64);
        } else {
          console.log('La compresión no redujo el tamaño, manteniendo original');
          resolve(base64Image);
        }
      };
      
      img.onerror = () => {
        console.warn('Error al cargar la imagen para compresión');
        resolve(base64Image); // Devolver la original en caso de error
      };
      
      // Asegurarse de que la imagen tenga el formato correcto
      if (!base64Image.startsWith('data:image')) {
        img.src = 'data:image/jpeg;base64,' + base64Image;
      } else {
        img.src = base64Image;
      }
    } catch (error) {
      console.error('Error en la compresión de imagen:', error);
      resolve(base64Image); // Devolver la original en caso de error
    }
  });
};

/**
 * Verifica si una imagen es demasiado grande y la comprime si es necesario
 * @param {string} base64Image - Imagen en formato base64
 * @param {number} maxSizeKB - Tamaño máximo en KB
 * @returns {Promise<string>} - Imagen optimizada en formato base64
 */
export const optimizeImageForSync = async (base64Image, maxSizeKB = 500) => {
  try {
    if (!base64Image || typeof base64Image !== 'string') {
      return base64Image;
    }
    
    // Calcular tamaño aproximado en KB
    const sizeKB = Math.round(base64Image.length / 1024);
    
    if (sizeKB <= maxSizeKB) {
      // La imagen ya es lo suficientemente pequeña
      return base64Image;
    }
    
    console.log(`Optimizando imagen de ${sizeKB}KB (máximo: ${maxSizeKB}KB)`);
    
    // Calcular calidad basada en cuánto necesitamos comprimir
    let quality = 0.7;
    if (sizeKB > maxSizeKB * 3) {
      quality = 0.5; // Más compresión para imágenes muy grandes
    } else if (sizeKB > maxSizeKB * 2) {
      quality = 0.6; // Compresión media
    }
    
    // Comprimir la imagen
    let compressedImage = await compressImage(base64Image, 800, quality);
    
    // Si sigue siendo demasiado grande, intentar con más compresión
    if (compressedImage.length / 1024 > maxSizeKB) {
      compressedImage = await compressImage(compressedImage, 600, 0.5);
    }
    
    // Si aún es demasiado grande, hacer un último intento
    if (compressedImage.length / 1024 > maxSizeKB) {
      compressedImage = await compressImage(compressedImage, 400, 0.4);
    }
    
    return compressedImage;
  } catch (error) {
    console.error('Error al optimizar imagen:', error);
    return base64Image; // Devolver la original en caso de error
  }
};
