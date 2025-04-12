<template>
  <div class="platos-view">
    <h2>Gestión de Platos</h2>
    
    <div class="actions-container">
      <button @click="showForm = !showForm" class="btn toggle-form-btn">
        {{ showForm ? 'Ocultar Formulario' : 'Crear Nuevo Plato' }}
      </button>
      
      <!-- Componente de respaldo de IndexedDB -->
      <IndexedDBBackup class="backup-component" />
    </div>
    
    <!-- Componente de configuración de sincronización -->
    <SyncSettings class="sync-settings-component" />
    
    <div v-if="showForm" class="form-container">
      <PlatoForm 
        :edit-plato="platoToEdit" 
        @plato-saved="onPlatoSaved" 
        @plato-updated="onPlatoUpdated" 
        @cancel="onFormCancel"
      />
    </div>
    
    <div class="platos-list">
      <h3>Lista de Platos ({{ platos.length }})</h3>
      
      <div v-if="isLoading" class="loading">
        Cargando platos...
      </div>
      
      <div v-else-if="platos.length === 0" class="empty-state">
        No hay platos disponibles. ¡Crea el primero!
      </div>
      
      <div v-else class="platos-grid">
        <div v-for="plato in platos" :key="plato.id" class="plato-card">
          <div class="plato-image" :style="{ backgroundImage: `url(${plato.image_url || '/placeholder-food.jpg'})` }"></div>
          <div class="plato-content">
            <h4>{{ plato.name }}</h4>
            <p class="price">${{ plato.price.toFixed(2) }}</p>
            <p class="category">{{ plato.category || 'Sin categoría' }}</p>
            <p class="description">{{ plato.description || 'Sin descripción' }}</p>
            <div class="availability" :class="{ available: plato.is_available }">
              {{ plato.is_available ? 'Disponible' : 'No disponible' }}
            </div>
          </div>
          <div class="plato-actions">
            <button @click="editPlato(plato)" class="btn btn-edit">Editar</button>
            <DeletePlatoButton 
              :plato-id="plato.id" 
              :plato-name="plato.name"
              @deleted="onPlatoDeleted"
              @error="onDeleteError"
            />
            <DirectDeleteButton
              :plato-id="plato.id"
              :plato-name="plato.name"
              @deleted="onPlatoDeleted"
              @error="onDeleteError"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-container">
      <p>{{ error }}</p>
      <button @click="loadPlatos" class="btn retry-btn">Reintentar</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import PlatoForm from '@/components/PlatoForm.vue';
import DeletePlatoButton from '@/components/DeletePlatoButton.vue';
import DirectDeleteButton from '@/components/DirectDeleteButton.vue';
import IndexedDBBackup from '@/components/utils/IndexedDBBackup.vue';
import SyncSettings from '@/components/utils/SyncSettings.vue';
import { getAllPlatos } from '@/services/indexedDBService';

export default {
  name: 'PlatosView',
  
  components: {
    PlatoForm,
    DeletePlatoButton,
    DirectDeleteButton,
    IndexedDBBackup,
    SyncSettings
  },
  
  setup() {
    const platos = ref([]);
    const isLoading = ref(true);
    const error = ref('');
    const showForm = ref(false);
    const platoToEdit = ref(null);
    
    // Cargar todos los platos al montar el componente
    onMounted(() => {
      loadPlatos();
    });
    
    // Función para cargar platos
    const loadPlatos = async () => {
      isLoading.value = true;
      error.value = '';
      
      try {
        const result = await getAllPlatos();
        platos.value = result;
        console.log('Platos cargados:', platos.value);
      } catch (err) {
        console.error('Error al cargar platos:', err);
        error.value = `Error al cargar platos: ${err.message || 'Error desconocido'}`;
      } finally {
        isLoading.value = false;
      }
    };
    
    // Manejadores de eventos del formulario
    const onPlatoSaved = (savedPlato) => {
      console.log('Plato guardado en la vista:', savedPlato);
      platos.value.push(savedPlato);
      showForm.value = false;
    };
    
    const onPlatoUpdated = (updatedPlato) => {
      console.log('Plato actualizado en la vista:', updatedPlato);
      
      const index = platos.value.findIndex(p => p.id === updatedPlato.id);
      if (index !== -1) {
        platos.value[index] = { ...updatedPlato };
      }
      
      platoToEdit.value = null;
      showForm.value = false;
    };
    
    const onFormCancel = () => {
      platoToEdit.value = null;
      showForm.value = false;
    };
    
    // Funciones para editar y eliminar platos
    const editPlato = (plato) => {
      platoToEdit.value = { ...plato };
      showForm.value = true;
    };
    
    const onPlatoDeleted = (id) => {
      platos.value = platos.value.filter(plato => plato.id !== id);
    };
    
    const onDeleteError = (err) => {
      console.error('Error al eliminar plato:', err);
      error.value = `Error al eliminar plato: ${err.message || 'Error desconocido'}`;
    };
    
    return {
      platos,
      isLoading,
      error,
      showForm,
      platoToEdit,
      loadPlatos,
      onPlatoSaved,
      onPlatoUpdated,
      onFormCancel,
      editPlato,
      onPlatoDeleted,
      onDeleteError
    };
  }
};
</script>

<style scoped>
.platos-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.actions-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.toggle-form-btn {
  margin-bottom: 20px;
  background-color: #2196F3;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.backup-component {
  margin-left: 20px;
}

.sync-settings-component {
  margin-bottom: 20px;
}

.form-container {
  margin-bottom: 30px;
}

.platos-list {
  margin-top: 30px;
}

.loading, .empty-state {
  padding: 20px;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.platos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.plato-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: white;
  display: flex;
  flex-direction: column;
}

.plato-image {
  height: 200px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #f5f5f5;
}

.plato-content {
  padding: 15px;
  flex-grow: 1;
}

.plato-content h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 18px;
}

.price {
  font-weight: bold;
  font-size: 16px;
  color: #4CAF50;
  margin: 5px 0;
}

.category {
  font-size: 14px;
  color: #757575;
  margin: 5px 0;
}

.description {
  font-size: 14px;
  margin: 10px 0;
  color: #333;
}

.availability {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  background-color: #FFEBEE;
  color: #D32F2F;
}

.availability.available {
  background-color: #E8F5E9;
  color: #2E7D32;
}

.plato-actions {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-edit {
  background-color: #2196F3;
  color: white;
}

.error-container {
  margin-top: 20px;
  padding: 15px;
  background-color: #FFEBEE;
  border-radius: 4px;
  color: #C62828;
}

.retry-btn {
  margin-top: 10px;
  background-color: #9E9E9E;
  color: white;
}
</style>
