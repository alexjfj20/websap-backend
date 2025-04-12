<template>
  <div class="plato-form">
    <h3>{{ isEditing ? 'Editar Plato' : 'Crear Nuevo Plato' }}</h3>
    
    <form @submit.prevent="handleSubmit" class="form">
      <div class="form-group">
        <label for="name">Nombre del Plato *</label>
        <input 
          type="text" 
          id="name" 
          v-model="form.name" 
          required
          class="form-control"
        />
        <div v-if="errors.name" class="error-text">{{ errors.name }}</div>
      </div>
      
      <div class="form-group">
        <label for="description">Descripción</label>
        <textarea 
          id="description" 
          v-model="form.description"
          class="form-control"
        ></textarea>
      </div>
      
      <div class="form-group">
        <label for="price">Precio *</label>
        <input 
          type="number" 
          id="price" 
          v-model.number="form.price" 
          min="0" 
          step="0.01" 
          required
          class="form-control"
        />
        <div v-if="errors.price" class="error-text">{{ errors.price }}</div>
      </div>
      
      <div class="form-group">
        <label for="category">Categoría</label>
        <select
          id="category"
          v-model="form.category"
          class="form-control"
        >
          <option value="">Seleccionar categoría</option>
          <option value="Entradas">Entradas</option>
          <option value="Platos Principales">Platos Principales</option>
          <option value="Postres">Postres</option>
          <option value="Bebidas">Bebidas</option>
        </select>
      </div>
      
      <div class="form-group">
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            v-model="form.is_available"
          />
          <span>Disponible</span>
        </label>
      </div>
      
      <div class="form-group">
        <label for="image_url">URL de Imagen</label>
        <input 
          type="text" 
          id="image_url" 
          v-model="form.image_url"
          class="form-control"
          placeholder="http://ejemplo.com/imagen.jpg"
        />
      </div>
      
      <div class="actions">
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar') }}
        </button>
        <button type="button" @click="resetForm" class="btn btn-secondary" :disabled="isSubmitting">
          Cancelar
        </button>
      </div>
    </form>
    
    <div v-if="success" class="success-message">
      {{ success }}
    </div>
    
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { createPlato } from '@/services/indexedDBService';

export default {
  name: 'PlatoForm',
  
  props: {
    editPlato: {
      type: Object,
      default: null
    }
  },
  
  emits: ['plato-saved', 'plato-updated', 'cancel'],
  
  setup(props, { emit }) {
    // Estado del formulario
    const form = reactive({
      name: '',
      description: '',
      price: 0,
      category: '',
      is_available: true,
      image_url: ''
    });
    
    // Estados para validación y UI
    const errors = reactive({
      name: '',
      price: ''
    });
    const isSubmitting = ref(false);
    const errorMessage = ref('');
    const success = ref('');
    
    // Determinar si estamos editando o creando
    const isEditing = computed(() => !!props.editPlato);
    
    // Inicializar el formulario con datos si estamos editando
    onMounted(() => {
      if (props.editPlato) {
        Object.assign(form, props.editPlato);
      }
    });
    
    // Validar el formulario
    const validateForm = () => {
      let isValid = true;
      
      // Validar nombre
      if (!form.name.trim()) {
        errors.name = 'El nombre del plato es obligatorio';
        isValid = false;
      } else {
        errors.name = '';
      }
      
      // Validar precio
      if (form.price === null || form.price === undefined || isNaN(form.price)) {
        errors.price = 'El precio debe ser un número válido';
        isValid = false;
      } else if (form.price < 0) {
        errors.price = 'El precio no puede ser negativo';
        isValid = false;
      } else {
        errors.price = '';
      }
      
      return isValid;
    };
    
    // Manejar el envío del formulario
    const handleSubmit = async () => {
      console.log('Enviando formulario', form);
      
      // Reiniciar mensajes
      success.value = '';
      errorMessage.value = '';
      
      // Validar formulario
      if (!validateForm()) {
        console.log('Formulario inválido', errors);
        return;
      }
      
      isSubmitting.value = true;
      
      try {
        if (isEditing.value) {
          // Lógica para edición (a implementar)
          // Por ahora solo emitimos el evento
          emit('plato-updated', form);
          success.value = 'Plato actualizado correctamente';
        } else {
          // Crear nuevo plato usando la función createPlato
          console.log('Llamando a createPlato con:', form);
          const savedPlato = await createPlato({
            ...form,
            price: Number(form.price) // Asegurar que price es un número
          });
          
          console.log('Plato guardado exitosamente:', savedPlato);
          success.value = 'Plato guardado correctamente';
          
          // Emitir evento con el plato guardado
          emit('plato-saved', savedPlato);
          
          // Resetear el formulario
          resetForm();
        }
      } catch (error) {
        console.error('Error al guardar el plato:', error);
        errorMessage.value = `Error al guardar el plato: ${error.message || 'Error desconocido'}`;
      } finally {
        isSubmitting.value = false;
      }
    };
    
    // Resetear el formulario
    const resetForm = () => {
      // Si estamos editando, mantener los valores originales
      if (isEditing.value && props.editPlato) {
        Object.assign(form, props.editPlato);
      } else {
        // Si estamos creando, limpiar todos los campos
        form.name = '';
        form.description = '';
        form.price = 0;
        form.category = '';
        form.is_available = true;
        form.image_url = '';
      }
      
      // Limpiar errores
      errors.name = '';
      errors.price = '';
      
      // Limpiar mensajes
      errorMessage.value = '';
      success.value = '';
      
      // Emitir evento de cancelación
      emit('cancel');
    };
    
    return {
      form,
      errors,
      isSubmitting,
      errorMessage,
      success,
      isEditing,
      handleSubmit,
      resetForm
    };
  }
};
</script>

<style scoped>
.plato-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-control {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #388E3C;
}

.btn-secondary {
  background-color: #9E9E9E;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #757575;
}

.error-text {
  color: #F44336;
  font-size: 14px;
  margin-top: 4px;
}

.success-message {
  margin-top: 20px;
  padding: 10px;
  border-radius: 4px;
  background-color: #E8F5E9;
  color: #2E7D32;
  border: 1px solid #81C784;
}

.error-message {
  margin-top: 20px;
  padding: 10px;
  border-radius: 4px;
  background-color: #FFEBEE;
  color: #C62828;
  border: 1px solid #EF9A9A;
}
</style>
