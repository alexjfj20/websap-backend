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
    },
    
    // Método para guardar un plato
    async guardarPlato() {
      try {
        // Validación de datos
        if (!this.nuevoPlato.nombre || !this.nuevoPlato.precio) {
          this.$notify({
            title: 'Error',
            text: 'El nombre y precio son obligatorios',
            type: 'error'
          });
          return;
        }

        // Añadir el plato a la lista (convertimos precio a número)
        const plato = {
          ...this.nuevoPlato,
          precio: parseFloat(this.nuevoPlato.precio),
          id: Date.now() // Generamos un ID temporal
        };
        
        this.platos.push(plato);
        
        // Guardar en la base de datos
        this.saveMenuItems(this.platos)
          .then(response => {
            console.log('✅ Plato guardado correctamente:', response);
            this.$notify({
              title: 'Éxito',
              text: 'Plato guardado correctamente',
              type: 'success'
            });
          })
          .catch(error => {
            console.error('❌ Error al guardar en la base de datos:', error);
          });
          
        // Reiniciar formulario
        this.nuevoPlato = {
          nombre: '',
          descripcion: '',
          precio: '',
          categoria: ''
        };
        
        // Cerrar modal
        this.showModal = false;
      } catch (error) {
        console.error('Error al guardar plato:', error);
        this.$notify({
          title: 'Error',
          text: 'No se pudo guardar el plato',
          type: 'error'
        });
      }
    }
  }
};
</script>

<style scoped>
/* Estilos del componente */
</style>