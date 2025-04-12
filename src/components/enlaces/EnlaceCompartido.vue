// Método mejorado para copiar al portapapeles
copyLink() {
  try {
    // Verificar si la API del portapapeles está disponible
    if (!navigator || !navigator.clipboard) {
      // Alternativa manual si la API no está disponible
      const textArea = document.createElement("textarea");
      textArea.value = this.sharableLink;
      
      // Asegurarse de que el textarea no sea visible
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        this.$toast ? this.$toast.success("Enlace copiado al portapapeles") : 
          alert("Enlace copiado al portapapeles");
      } else {
        throw new Error("No se pudo copiar al portapapeles");
      }
    } else {
      // Usar la API estándar del portapapeles
      navigator.clipboard.writeText(this.sharableLink)
        .then(() => {
          this.$toast ? this.$toast.success("Enlace copiado al portapapeles") : 
            alert("Enlace copiado al portapapeles");
        })
        .catch(error => {
          console.error("Error al copiar al portapapeles:", error);
          this.$toast ? this.$toast.error("Error al copiar enlace: " + error.message) : 
            alert("Error al copiar enlace: " + error.message);
        });
    }
  } catch (error) {
    console.error("Error al copiar al portapapeles:", error);
    this.$toast ? this.$toast.error("Error al copiar enlace: " + error.message) : 
      alert("Error al copiar enlace: " + error.message);
  }
},