/**
 * Utilidad para manejar operaciones de portapapeles de forma segura
 */

/**
 * Copia un texto al portapapeles de manera segura
 * @param {string} text - Texto a copiar
 * @returns {Promise<boolean>} - True si se copió correctamente, false en caso contrario
 */
export const copyToClipboard = async (text) => {
  try {
    // Verificar si la API del portapapeles está disponible
    if (!navigator || !navigator.clipboard) {
      // Alternativa manual si la API no está disponible
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Asegurarse de que el textarea no sea visible
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return successful;
    } else {
      // Usar la API estándar del portapapeles
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    console.error("Error al copiar al portapapeles:", error);
    return false;
  }
};