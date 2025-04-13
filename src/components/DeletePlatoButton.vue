// src/components/DeletePlatoButton.vue

<template>
  <button 
    @click="confirmDelete" 
    class="delete-button"
    :disabled="isDeleting"
  >
    {{ isDeleting ? 'Eliminando...' : 'Eliminar' }}
  </button>
</template>

<script>
import { ref } from 'vue';
import apiConfig from '../config/apiConfig';

export default {
  name: 'DeletePlatoButton',
  
  props: {
    platoId: {
      type: String,
      required: true
    },
    platoName: {
      type: String,
      default: 'este plato'
    }
  },
  
  emits: ['deleted', 'error'],
  
  setup(props, { emit }) {
    const isDeleting = ref(false);
    
    const confirmDelete = async () => {
      if (confirm(`¿Estás seguro de que deseas eliminar ${props.platoName}?`)) {
        await deletePlato();
      }
    };
    
    const deletePlato = async () => {
      isDeleting.value = true;
      
      try {
        console.log(`Iniciando eliminación directa del plato ID: ${props.platoId}`);
        
        // Usar fetch con la API centralizada
        const response = await fetch(`${apiConfig.API_URL}/sync/platos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: props.platoId,
            operation: 'delete'
          })
        });
        
        console.log(`Respuesta del servidor: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Respuesta del servidor:', data);
          
          // Notificar que el plato fue eliminado
          emit('deleted', props.platoId);
          
          // Mostrar mensaje de éxito
          alert(`El plato "${props.platoName}" ha sido eliminado correctamente.`);
        } else {
          // Si hay un error, intentar eliminar directamente con el script
          console.error(`Error al eliminar plato: ${response.status}`);
          const errorText = await response.text();
          console.error('Detalles del error:', errorText);
          
          // Notificar el error
          emit('error', {
            id: props.platoId,
            status: response.status,
            message: errorText
          });
          
          // Sugerir usar el script directo
          alert(`Error al eliminar el plato. Por favor, utiliza el script directo:\n\nnode delete-plato.js ${props.platoId}`);
        }
      } catch (error) {
        console.error('Error al eliminar plato:', error);
        
        // Notificar el error
        emit('error', {
          id: props.platoId,
          message: error.message
        });
        
        // Sugerir usar el script directo
        alert(`Error al eliminar el plato: ${error.message}\n\nPor favor, utiliza el script directo:\n\nnode delete-plato.js ${props.platoId}`);
      } finally {
        isDeleting.value = false;
      }
    };
    
    return {
      isDeleting,
      confirmDelete
    };
  }
};
</script>

<style scoped>
.delete-button {
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.delete-button:hover {
  background-color: #c82333;
}

.delete-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
</style>
