```vue
// src/components/DirectDeleteButton.vue

<template>
  <div class="direct-delete-container">
    <button 
      @click="showConfirmation = true" 
      class="direct-delete-button"
      :disabled="isDeleting"
    >
      {{ isDeleting ? 'Eliminando...' : 'Eliminar Directamente' }}
    </button>
    
    <div v-if="showConfirmation" class="confirmation-dialog">
      <div class="confirmation-content">
        <h3>Confirmar Eliminación</h3>
        <p>¿Estás seguro de que deseas eliminar el plato <strong>{{ platoName }}</strong>?</p>
        <p>Esta acción eliminará el plato directamente de la base de datos MySQL y no se puede deshacer.</p>
        
        <div class="confirmation-actions">
          <button @click="showConfirmation = false" class="cancel-button">Cancelar</button>
          <button @click="executeDelete" class="confirm-button" :disabled="isDeleting">
            {{ isDeleting ? 'Eliminando...' : 'Confirmar Eliminación' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import apiConfig from '../config/apiConfig';

export default {
  name: 'DirectDeleteButton',
  
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
    const showConfirmation = ref(false);
    const deleteStatus = ref('');
    
    const executeDelete = async () => {
      isDeleting.value = true;
      deleteStatus.value = 'Iniciando eliminación...';
      
      try {
        // Usar la URL de apiConfig
        const response = await fetch(`${apiConfig.API_DOMAIN}/direct-delete?id=${encodeURIComponent(props.platoId)}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log(`Respuesta del servidor: Status ${response.status}`);
        
        if (response.ok) {
          const result = await response.json();
          console.log('Respuesta completa:', result);
          
          if (result.success) {
            deleteStatus.value = 'Plato eliminado con éxito';
            emit('deleted', props.platoId);
            showConfirmation.value = false;
            
            // También eliminar de IndexedDB para mantener todo sincronizado
            try {
              const db = await window.indexedDB.open('websap', 3);
              db.onsuccess = function(event) {
                const database = event.target.result;
                const transaction = database.transaction(['platos'], 'readwrite');
                const store = transaction.objectStore('platos');
                store.delete(props.platoId);
                
                transaction.oncomplete = function() {
                  console.log(`Plato ${props.platoId} también eliminado de IndexedDB`);
                };
              };
            } catch (localDbError) {
              console.warn('No se pudo eliminar de IndexedDB, pero se eliminó de MySQL:', localDbError);
            }
            
            alert(`El plato "${props.platoName}" ha sido eliminado correctamente de la base de datos MySQL.`);
          } else {
            deleteStatus.value = `Error: ${result.message}`;
            emit('error', { id: props.platoId, message: result.message });
            alert(`Error al eliminar el plato: ${result.message}`);
          }
        } else {
          const errorText = await response.text();
          deleteStatus.value = `Error: ${response.status} - ${errorText}`;
          emit('error', { id: props.platoId, status: response.status, message: errorText });
          alert(`Error al eliminar el plato. Status: ${response.status}\n${errorText}`);
        }
      } catch (error) {
        deleteStatus.value = `Error: ${error.message}`;
        emit('error', { id: props.platoId, message: error.message });
        alert(`Error al eliminar el plato: ${error.message}`);
      } finally {
        isDeleting.value = false;
      }
    };
    
    return {
      isDeleting,
      showConfirmation,
      deleteStatus,
      executeDelete
    };
  }
};
</script>

<style scoped>
.direct-delete-button {
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
  margin-top: 10px;
  width: 100%;
}

.direct-delete-button:hover {
  background-color: #c82333;
}

.direct-delete-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.confirmation-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirmation-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.confirmation-content h3 {
  margin-top: 0;
  color: #dc3545;
}

.confirmation-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 10px;
}

.cancel-button {
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
}

.confirm-button {
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: bold;
}

.confirm-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
</style>
```
