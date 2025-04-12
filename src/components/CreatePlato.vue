<template>
  <div class="create-plato-container">
    <h2>Crear Nuevo Plato</h2>
    <form @submit.prevent="handleSubmit" class="plato-form">
      <div class="form-group">
        <label for="name">Nombre del Plato</label>
        <input 
          type="text" 
          id="name" 
          v-model="name" 
          required 
          placeholder="Nombre del plato" 
        />
      </div>
      
      <div class="form-group">
        <label for="description">Descripción</label>
        <textarea 
          id="description" 
          v-model="description" 
          placeholder="Descripción del plato"
          rows="3"
        ></textarea>
      </div>
      
      <div class="form-group">
        <label for="price">Precio</label>
        <input 
          type="number" 
          id="price" 
          v-model="price" 
          required 
          step="0.01" 
          min="0"
          placeholder="Precio" 
        />
      </div>
      
      <div class="form-group">
        <label for="category">Categoría</label>
        <select id="category" v-model="category">
          <option value="entrante">Entrante</option>
          <option value="principal">Plato Principal</option>
          <option value="postre">Postre</option>
          <option value="bebida">Bebida</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="image_url">Imagen del Plato</label>
        <input 
          type="text" 
          id="image_url" 
          v-model="image_url" 
          placeholder="URL de la imagen" 
        />
      </div>
      
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      
      <div class="connection-status" :class="{ 'online': isOnline, 'offline': !isOnline }">
        Estado: {{ isOnline ? 'Conectado (guardando en servidor)' : 'Desconectado (guardando localmente)' }}
      </div>
      
      <button type="submit" :disabled="isLoading" class="submit-button">
        {{ isLoading ? 'Guardando...' : 'Guardar Plato' }}
      </button>
    </form>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { createPlato } from '../services/platoService';
import { isOnline as checkOnlineStatus } from '../services/syncService';

export default {
  name: 'CreatePlato',
  setup() {
    // Estado del formulario
    const name = ref('');
    const description = ref('');
    const price = ref(0);
    const category = ref('principal');
    const image_url = ref('');
    const isLoading = ref(false);
    const errorMessage = ref('');
    const successMessage = ref('');
    const isOnline = ref(false);
    
    // Verificar estado de conexión inicial y configurar monitoreo
    onMounted(async () => {
      isOnline.value = await checkOnlineStatus();
      
      // Monitorear cambios en la conexión
      window.addEventListener('online', async () => {
        console.log('Conexión recuperada');
        isOnline.value = await checkOnlineStatus();
      });
      
      window.addEventListener('offline', () => {
        console.log('Conexión perdida');
        isOnline.value = false;
      });
      
      // Actualizar estado de conexión periódicamente
      setInterval(async () => {
        isOnline.value = await checkOnlineStatus();
      }, 5000); // Mantiene el mismo intervalo de 5 segundos
    });
    
    // Manejar envío del formulario
    const handleSubmit = async () => {
      // Limpiar mensajes
      errorMessage.value = '';
      successMessage.value = '';
      isLoading.value = true;
      
      try {
        // Validar campos obligatorios
        if (!name.value || price.value <= 0) {
          throw new Error('Nombre y precio son campos obligatorios');
        }
        
        // Crear objeto con datos del plato
        const platoData = {
          name: name.value,
          description: description.value,
          price: parseFloat(price.value),
          category: category.value,
          image_url: image_url.value,
          is_available: true
        };
        
        console.log('Enviando datos del plato:', platoData);
        
        // Guardar plato (el servicio decide si se guarda en servidor o IndexedDB)
        const result = await createPlato(platoData);
        
        console.log('Plato guardado:', result);
        
        // Mostrar mensaje de éxito
        if (isOnline.value) {
          successMessage.value = 'Plato guardado correctamente en el servidor';
        } else {
          successMessage.value = 'Plato guardado localmente. Se sincronizará cuando haya conexión a Internet';
        }
        
        // Limpiar formulario
        name.value = '';
        description.value = '';
        price.value = 0;
        category.value = 'principal';
        image_url.value = '';
        
        // Ocultar mensaje de éxito después de 3 segundos (mantiene el tiempo original)
        setTimeout(() => {
          successMessage.value = '';
        }, 3000);
      } catch (error) {
        console.error('Error al guardar plato:', error);
        errorMessage.value = error.message || 'Error al guardar el plato';
      } finally {
        isLoading.value = false;
      }
    };
    
    return {
      name,
      description,
      price,
      category,
      image_url,
      isLoading,
      errorMessage,
      successMessage,
      isOnline,
      handleSubmit
    };
  }
}
</script>

<style scoped>
.create-plato-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.plato-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.error-message {
  color: #d32f2f;
  font-size: 0.9rem;
}

.success-message {
  color: #388e3c;
  font-size: 0.9rem;
}

.connection-status {
  font-size: 0.9rem;
  padding: 8px;
  border-radius: 4px;
  text-align: center;
}

.connection-status.online {
  background-color: #e8f5e9;
  color: #388e3c;
}

.connection-status.offline {
  background-color: #ffebee;
  color: #d32f2f;
}

.submit-button {
  padding: 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.submit-button:hover:not(:disabled) {
  background-color: #45a049;
}

.submit-button:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}
</style>