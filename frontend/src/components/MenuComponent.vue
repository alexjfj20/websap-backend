<!-- Este es un archivo de referencia para solucionar el error en MenuComponent.vue -->
<template>
  <div class="menu-component">
    <!-- Contenido del componente -->
  </div>
</template>

<script>
export default {
  name: 'MenuComponent',
  data() {
    return {
      // Datos del componente
    };
  },
  methods: {
    // Método que falta y causa el error
    saveMenuItems(items) {
      try {
        console.log('Guardando elementos del menú:', items);
        return this.axios.post('/api/menu/save', { items })
          .then(response => {
            console.log('Menú guardado con éxito', response);
            return response.data;
          });
      } catch (error) {
        console.error('Error al guardar elementos del menú:', error);
        throw error;
      }
    },
    
    // Corregir el método que estaba usando saveMenuItems
    handleSave() {
      try {
        // Usar this.saveMenuItems en lugar de solo saveMenuItems
        this.saveMenuItems(this.menuItems)
          .then(() => {
            this.$notify({
              title: 'Éxito',
              text: 'Menú guardado correctamente',
              type: 'success'
            });
          })
          .catch(error => {
            console.error('❌ Error al guardar en la base de datos:', error);
            this.$notify({
              title: 'Error',
              text: 'No se pudo guardar el menú',
              type: 'error'
            });
          });
      } catch (error) {
        console.error('Error al manejar el guardado:', error);
      }
    }
  }
};
</script>

<style scoped>
/* Estilos del componente */
</style>