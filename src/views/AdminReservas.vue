// Método mejorado para copiar al portapapeles
import { copyToClipboard } from '@/utils/clipboardUtils';

async copyLink(link) {
  const success = await copyToClipboard(link);
  
  if (success) {
    this.$toast ? this.$toast.success("Enlace copiado al portapapeles") : 
      alert("Enlace copiado al portapapeles");
  } else {
    this.$toast ? this.$toast.error("No se pudo copiar el enlace") : 
      alert("No se pudo copiar el enlace");
  }
},