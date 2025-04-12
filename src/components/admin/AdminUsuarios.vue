<template>
  <div class="admin-usuarios">
    <div class="card">
      <div class="card-header">
        <h3>Gestión de Usuarios</h3>
        <div class="actions">
          <button class="btn btn-primary" @click="showCreateModal">
            <i class="fas fa-plus"></i> Nuevo Usuario
          </button>
        </div>
      </div>
      <div class="card-body">
        <div v-if="loading" class="text-center my-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="mt-2">Cargando usuarios...</p>
        </div>
        <div v-else-if="error" class="alert alert-danger">
          {{ error }}
        </div>
        <div v-else>
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Restaurante</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="usuario in usuarios" :key="usuario.id">
                  <td>{{ usuario.nombre }}</td>
                  <td>{{ usuario.email }}</td>
                  <td>{{ usuario.telefono || 'No disponible' }}</td>
                  <td>{{ getRolName(usuario) }}</td>
                  <td>{{ getRestauranteName(usuario) }}</td>
                  <td>
                    <span :class="usuario.activo ? 'badge bg-success' : 'badge bg-danger'">
                      {{ usuario.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>
                    <div class="btn-group">
                      <button class="btn btn-sm btn-info" @click="editUsuario(usuario)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button 
                        class="btn btn-sm" 
                        :class="usuario.activo ? 'btn-warning' : 'btn-success'"
                        @click="toggleStatus(usuario)"
                      >
                        <i :class="usuario.activo ? 'fas fa-ban' : 'fas fa-check'"></i>
                      </button>
                      <button class="btn btn-sm btn-danger" @click="deleteUsuario(usuario)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para crear/editar usuario -->
    <div class="modal" id="usuarioModal">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="usuarioModalLabel">{{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}</h5>
          <button type="button" class="btn-close" @click="closeModal('usuarioModal')"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveUsuario">
            <div class="mb-3">
              <label for="nombre" class="form-label">Nombre</label>
              <input type="text" class="form-control" id="nombre" v-model="currentUsuario.nombre" required>
            </div>
            <div class="mb-3">
              <label for="email" class="form-label">Email</label>
              <input type="email" class="form-control" id="email" v-model="currentUsuario.email" required>
            </div>
            <div class="mb-3">
              <label for="telefono" class="form-label">Teléfono</label>
              <input type="text" class="form-control" id="telefono" v-model="currentUsuario.telefono">
            </div>
            <div class="mb-3">
              <label for="rol" class="form-label">Rol</label>
              <select class="form-select" id="rol" v-model="currentUsuario.rol" required>
                <option value="">Seleccione un rol</option>
                <option v-for="rol in roles" :key="rol.id" :value="rol.nombre">{{ rol.nombre }}</option>
              </select>
            </div>
            <div class="mb-3">
              <label for="restaurante" class="form-label">Restaurante</label>
              <select class="form-select" id="restaurante" v-model="currentUsuario.restaurante_id" required>
                <option value="">Seleccione un restaurante</option>
                <option v-for="restaurante in restaurantes" :key="restaurante.id" :value="restaurante.id">
                  {{ restaurante.nombre }}
                </option>
              </select>
            </div>
            <div class="mb-3" v-if="!isEditing">
              <label for="password" class="form-label">Contraseña</label>
              <input type="password" class="form-control" id="password" v-model="currentUsuario.password" :required="!isEditing">
            </div>
            <div class="mb-3 form-check">
              <input type="checkbox" class="form-check-input" id="activo" v-model="currentUsuario.activo">
              <label class="form-check-label" for="activo">Usuario activo</label>
            </div>
            <div class="d-flex justify-content-end">
              <button type="button" class="btn btn-secondary me-2" @click="closeModal('usuarioModal')">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                {{ isEditing ? 'Actualizar' : 'Crear' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación para eliminar -->
    <div class="modal" id="deleteModal">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="deleteModalLabel">Confirmar eliminación</h5>
          <button type="button" class="btn-close" @click="closeModal('deleteModal')"></button>
        </div>
        <div class="modal-body">
          ¿Está seguro que desea eliminar al usuario <strong>{{ currentUsuario.nombre }}</strong>?
          Esta acción no se puede deshacer.
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal('deleteModal')">Cancelar</button>
          <button type="button" class="btn btn-danger" @click="confirmDelete" :disabled="deleting">
            <span v-if="deleting" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import usuarioService from '@/services/usuarioService';
import rolService from '@/services/rolService';
import restauranteService from '@/services/restauranteService';

export default {
  name: 'AdminUsuarios',
  data() {
    return {
      usuarios: [],
      roles: [],
      restaurantes: [],
      currentUsuario: {
        nombre: '',
        email: '',
        telefono: '',
        rol: '',
        restaurante_id: '',
        password: '',
        activo: true
      },
      isEditing: false,
      loading: true,
      saving: false,
      deleting: false,
      error: null
    };
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      try {
        this.loading = true;
        this.error = null;
        
        // Cargar usuarios
        const usuariosResponse = await usuarioService.getUsuarios();
        this.usuarios = usuariosResponse.data;
        
        // Cargar roles
        const rolesResponse = await rolService.getRoles();
        this.roles = rolesResponse.data;
        
        // Cargar restaurantes
        const restaurantesResponse = await restauranteService.getRestaurantes();
        this.restaurantes = restaurantesResponse.data;
      } catch (error) {
        console.error('Error al cargar datos:', error);
        this.error = 'Error al cargar los datos. Por favor, inténtelo de nuevo.';
      } finally {
        this.loading = false;
      }
    },
    
    showCreateModal() {
      this.isEditing = false;
      this.currentUsuario = {
        nombre: '',
        email: '',
        telefono: '',
        rol: '',
        restaurante_id: '',
        password: '',
        activo: true
      };
      document.getElementById('usuarioModal').style.display = 'block';
    },
    
    editUsuario(usuario) {
      this.isEditing = true;
      this.currentUsuario = { ...usuario };
      document.getElementById('usuarioModal').style.display = 'block';
    },
    
    async saveUsuario() {
      try {
        this.saving = true;
        
        if (this.isEditing) {
          await usuarioService.updateUsuario(this.currentUsuario.id, this.currentUsuario);
          alert('Usuario actualizado correctamente');
        } else {
          await usuarioService.createUsuario(this.currentUsuario);
          alert('Usuario creado correctamente');
        }
        
        await this.loadData();
        document.getElementById('usuarioModal').style.display = 'none';
      } catch (error) {
        console.error('Error al guardar usuario:', error);
        alert('Error al guardar el usuario. Por favor, inténtelo de nuevo.');
      } finally {
        this.saving = false;
      }
    },
    
    deleteUsuario(usuario) {
      this.currentUsuario = { ...usuario };
      document.getElementById('deleteModal').style.display = 'block';
    },
    
    async confirmDelete() {
      try {
        this.deleting = true;
        await usuarioService.deleteUsuario(this.currentUsuario.id);
        alert('Usuario eliminado correctamente');
        await this.loadData();
        document.getElementById('deleteModal').style.display = 'none';
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        alert('Error al eliminar el usuario. Por favor, inténtelo de nuevo.');
      } finally {
        this.deleting = false;
      }
    },
    
    async toggleStatus(usuario) {
      try {
        const updatedUsuario = { ...usuario, activo: !usuario.activo };
        await usuarioService.updateUsuario(usuario.id, updatedUsuario);
        alert(`Usuario ${updatedUsuario.activo ? 'activado' : 'desactivado'} correctamente`);
        await this.loadData();
      } catch (error) {
        console.error('Error al cambiar estado del usuario:', error);
        alert('Error al cambiar el estado del usuario. Por favor, inténtelo de nuevo.');
      }
    },
    
    getRolName(usuario) {
      // Si el usuario tiene un rol asignado, mostrarlo
      if (usuario.rol) {
        return usuario.rol;
      }
      
      // Si no, buscar en la relación usuario_roles
      if (usuario.usuario_roles && usuario.usuario_roles.length > 0) {
        return usuario.usuario_roles[0].rol;
      }
      
      return 'Sin rol';
    },
    
    getRestauranteName(usuario) {
      if (!usuario.restaurante_id) {
        return 'Sin asignar';
      }
      
      const restaurante = this.restaurantes.find(r => r.id === usuario.restaurante_id);
      return restaurante ? restaurante.nombre : 'Desconocido';
    },
    
    closeModal(modalId) {
      document.getElementById(modalId).style.display = 'none';
    }
  }
};
</script>

<style scoped>
.admin-usuarios {
  padding: 20px;
}

.card {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
  padding: 15px 20px;
}

.table th, .table td {
  vertical-align: middle;
}

.btn-group {
  display: flex;
  gap: 5px;
}

.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background-color: #fff;
  margin: 10% auto;
  padding: 20px;
  border-radius: 5px;
  width: 80%;
  max-width: 500px;
}

.btn-close {
  float: right;
  cursor: pointer;
  font-size: 20px;
}
</style>
