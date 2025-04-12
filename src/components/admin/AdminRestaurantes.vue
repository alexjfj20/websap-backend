<template>
  <div class="admin-restaurantes">
    <h1>Gestión de Restaurantes</h1>
    
    <!-- Mensaje de carga o error -->
    <div v-if="loading" class="alert alert-info">
      Cargando restaurantes...
    </div>
    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <!-- Botón para crear nuevo restaurante -->
    <div class="mb-3">
      <button class="btn btn-primary" @click="showCreateModal = true">
        <i class="fas fa-plus"></i> Nuevo Restaurante
      </button>
    </div>
    
    <!-- Lista de restaurantes -->
    <div class="card mb-4" v-for="restaurante in restaurantes" :key="restaurante.id">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">{{ restaurante.nombre }}</h5>
        <div>
          <button class="btn btn-sm btn-outline-primary me-2" @click="editRestaurante(restaurante)">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn btn-sm btn-outline-info me-2" @click="regenerateLink(restaurante)">
            <i class="fas fa-sync"></i> Regenerar Enlace
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <p><strong>Dirección:</strong> {{ restaurante.direccion || 'No especificada' }}</p>
            <p><strong>Teléfono:</strong> {{ restaurante.telefono || 'No especificado' }}</p>
            <p><strong>Descripción:</strong> {{ restaurante.descripcion || 'Sin descripción' }}</p>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <strong>Enlace compartido:</strong>
              <div class="input-group">
                <input 
                  type="text" 
                  class="form-control" 
                  readonly 
                  :value="getMenuUrl(restaurante.enlace_compartido)"
                />
                <button 
                  class="btn btn-outline-secondary" 
                  type="button"
                  @click="copyToClipboard(getMenuUrl(restaurante.enlace_compartido))"
                >
                  <i class="fas fa-copy"></i>
                </button>
                <button 
                  class="btn btn-outline-success" 
                  type="button"
                  @click="shareViaWhatsApp(restaurante.enlace_compartido)"
                >
                  <i class="fab fa-whatsapp"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Mensaje si no hay restaurantes -->
    <div v-if="restaurantes.length === 0 && !loading" class="alert alert-warning">
      No tienes restaurantes registrados. Crea uno nuevo para comenzar.
    </div>
    
    <!-- Modal para crear/editar restaurante -->
    <div class="modal fade" :class="{ 'show d-block': showCreateModal || showEditModal }" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingRestaurante ? 'Editar' : 'Nuevo' }} Restaurante</h5>
            <button type="button" class="btn-close" @click="closeModals"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveRestaurante">
              <div class="mb-3">
                <label for="nombre" class="form-label">Nombre *</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="nombre" 
                  v-model="formData.nombre" 
                  required
                />
              </div>
              <div class="mb-3">
                <label for="direccion" class="form-label">Dirección</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="direccion" 
                  v-model="formData.direccion"
                />
              </div>
              <div class="mb-3">
                <label for="telefono" class="form-label">Teléfono</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="telefono" 
                  v-model="formData.telefono"
                />
              </div>
              <div class="mb-3">
                <label for="descripcion" class="form-label">Descripción</label>
                <textarea 
                  class="form-control" 
                  id="descripcion" 
                  v-model="formData.descripcion"
                  rows="3"
                ></textarea>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="closeModals">Cancelar</button>
                <button type="submit" class="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Overlay para modales -->
    <div class="modal-backdrop fade show" v-if="showCreateModal || showEditModal"></div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { getRestaurantes, createRestaurante, updateRestaurante, regenerateLink as regenerateLinkService } from '../../services/restauranteService';

export default {
  name: 'AdminRestaurantes',
  setup() {
    const restaurantes = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const showCreateModal = ref(false);
    const showEditModal = ref(false);
    const editingRestaurante = ref(null);
    const formData = ref({
      nombre: '',
      direccion: '',
      telefono: '',
      descripcion: ''
    });
    
    // Cargar restaurantes al montar el componente
    const loadRestaurantes = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const response = await getRestaurantes();
        
        if (response.success) {
          restaurantes.value = response.restaurantes;
        } else {
          error.value = response.error || 'Error al cargar restaurantes';
        }
      } catch (err) {
        console.error('Error al cargar restaurantes:', err);
        error.value = 'Error al cargar restaurantes: ' + err.message;
      } finally {
        loading.value = false;
      }
    };
    
    onMounted(loadRestaurantes);
    
    // Editar restaurante
    const editRestaurante = (restaurante) => {
      editingRestaurante.value = restaurante;
      formData.value = {
        nombre: restaurante.nombre,
        direccion: restaurante.direccion || '',
        telefono: restaurante.telefono || '',
        descripcion: restaurante.descripcion || ''
      };
      showEditModal.value = true;
    };
    
    // Guardar restaurante (crear o actualizar)
    const saveRestaurante = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        let response;
        
        if (editingRestaurante.value) {
          // Actualizar restaurante existente
          response = await updateRestaurante(editingRestaurante.value.id, formData.value);
        } else {
          // Crear nuevo restaurante
          response = await createRestaurante(formData.value);
        }
        
        if (response.success) {
          // Recargar la lista de restaurantes
          await loadRestaurantes();
          closeModals();
        } else {
          error.value = response.error || 'Error al guardar restaurante';
        }
      } catch (err) {
        console.error('Error al guardar restaurante:', err);
        error.value = 'Error al guardar restaurante: ' + err.message;
      } finally {
        loading.value = false;
      }
    };
    
    // Regenerar enlace compartido
    const regenerateLink = async (restaurante) => {
      if (!confirm('¿Estás seguro de regenerar el enlace? El enlace anterior dejará de funcionar.')) {
        return;
      }
      
      loading.value = true;
      error.value = null;
      
      try {
        const response = await regenerateLinkService(restaurante.id);
        
        if (response.success) {
          // Actualizar el enlace en la lista local
          const index = restaurantes.value.findIndex(r => r.id === restaurante.id);
          if (index !== -1) {
            restaurantes.value[index].enlace_compartido = response.enlace_compartido;
          }
        } else {
          error.value = response.error || 'Error al regenerar enlace';
        }
      } catch (err) {
        console.error('Error al regenerar enlace:', err);
        error.value = 'Error al regenerar enlace: ' + err.message;
      } finally {
        loading.value = false;
      }
    };
    
    // Obtener URL completa del menú
    const getMenuUrl = (enlaceCompartido) => {
      return `${window.location.origin}/menu/${enlaceCompartido}`;
    };
    
    // Compartir vía WhatsApp
    const shareViaWhatsApp = (enlaceCompartido) => {
      const url = getMenuUrl(enlaceCompartido);
      const message = `¡Hola! Aquí puedes ver nuestro menú: ${url}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    };
    
    // Copiar al portapapeles
    const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text)
        .then(() => {
          alert('Enlace copiado al portapapeles');
        })
        .catch(err => {
          console.error('Error al copiar:', err);
          error.value = 'Error al copiar al portapapeles';
        });
    };
    
    // Cerrar modales
    const closeModals = () => {
      showCreateModal.value = false;
      showEditModal.value = false;
      editingRestaurante.value = null;
      formData.value = {
        nombre: '',
        direccion: '',
        telefono: '',
        descripcion: ''
      };
    };
    
    return {
      restaurantes,
      loading,
      error,
      showCreateModal,
      showEditModal,
      editingRestaurante,
      formData,
      loadRestaurantes,
      editRestaurante,
      saveRestaurante,
      regenerateLink,
      getMenuUrl,
      shareViaWhatsApp,
      copyToClipboard,
      closeModals
    };
  }
};
</script>

<style scoped>
.admin-restaurantes {
  padding: 20px;
}

.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
