<template>
  <div class="users-container">
    <h2 class="section-title">Gestión de Usuarios</h2>
    
    <!-- Controles de búsqueda y filtros -->
    <div class="users-controls">
      <div class="search-container">
        <input 
          v-model="searchTerm" 
          placeholder="Buscar usuario..." 
          class="search-input"
          @input="handleSearchInput"
        />
      </div>
      
      <div class="filters">
        <select v-model="roleFilter" @change="fetchUsers" class="filter-select">
          <option value="">Todos los roles</option>
          <option 
            v-for="role in roles" 
            :key="role.id" 
            :value="role.nombre"
          >
            {{ role.nombre }}
          </option>
        </select>
        
        <select v-model="statusFilter" @change="fetchUsers" class="filter-select">
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>
      
      <div class="actions">
        <button @click="showCreateForm" class="create-user-btn">
          <span class="btn-icon">➕</span> Nuevo Usuario
        </button>
      </div>
    </div>
    
    <!-- Tabla de usuarios -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando usuarios...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchUsers" class="retry-btn">Reintentar</button>
    </div>
    
    <div v-else-if="users.length === 0" class="empty-state">
      <div class="empty-icon">👥</div>
      <p class="empty-title">No se encontraron usuarios</p>
      <p class="empty-description">No hay usuarios que coincidan con los criterios de búsqueda</p>
      <button @click="resetFilters" class="reset-filters-btn">Limpiar filtros</button>
    </div>
    
    <div v-else class="users-table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Fecha de registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" :class="{'inactive-user': user.estado === 'inactivo'}">
            <td>{{ user.nombre }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.telefono || '-' }}</td>
            <td>
              <div class="roles-list">
                <span 
                  v-for="(role, index) in user.roles" 
                  :key="index" 
                  class="role-badge"
                  :class="{'admin-role': role === 'Administrador', 'superadmin-role': role === 'Superadministrador'}"
                >
                  {{ role }}
                </span>
              </div>
            </td>
            <td>
              <span 
                class="status-badge" 
                :class="user.estado === 'activo' ? 'active-status' : 'inactive-status'"
              >
                {{ user.estado === 'activo' ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>{{ formatDate(user.fecha_creacion) }}</td>
            <td>
              <div class="action-buttons">
                <button @click="editUser(user)" class="edit-btn" title="Editar">
                  <span class="btn-icon">✏️</span>
                </button>
                <button 
                  v-if="user.estado === 'activo'" 
                  @click="deactivateUser(user)" 
                  class="deactivate-btn" 
                  title="Desactivar"
                >
                  <span class="btn-icon">🔴</span>
                </button>
                <button 
                  v-else 
                  @click="activateUser(user)" 
                  class="activate-btn" 
                  title="Activar"
                >
                  <span class="btn-icon">🟢</span>
                </button>
                <button @click="deleteUser(user)" class="delete-btn" title="Eliminar">
                  <span class="btn-icon">❌</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Form Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario' }}</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <!-- Mensaje de error -->
          <div v-if="error" class="alert alert-danger mb-3">
            {{ error }}
          </div>
          
          <form @submit.prevent="saveUser" class="user-form">
            <div class="form-group">
              <label for="nombre">Nombre completo</label>
              <input
                type="text"
                id="nombre"
                v-model="formData.nombre"
                required
                placeholder="Ej: Juan Pérez"
              >
            </div>
            
            <div class="form-group">
              <label for="email">Correo electrónico</label>
              <input
                type="email"
                id="email"
                v-model="formData.email"
                required
                placeholder="ejemplo@correo.com"
                :disabled="isEditing"
              >
            </div>
            
            <div class="form-group">
              <label for="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                v-model="formData.telefono"
                placeholder="Ej: 3001234567"
              >
            </div>
            
            <div class="form-group">
              <label for="password">Contraseña {{ isEditing ? '(dejar en blanco para mantener actual)' : '' }}</label>
              <input
                type="password"
                id="password"
                v-model="formData.password"
                :required="!isEditing"
                placeholder="Contraseña segura"
                autocomplete="new-password"
              >
            </div>
            
            <div class="form-group">
              <label>Roles</label>
              <div class="roles-checkboxes">
                <div 
                  v-for="role in availableRoles" 
                  :key="role.id" 
                  class="role-checkbox"
                >
                  <input 
                    type="checkbox" 
                    :id="'role-' + role.id" 
                    :value="role.nombre" 
                    v-model="formData.roles"
                  >
                  <label :for="'role-' + role.id">{{ role.nombre }}</label>
                </div>
              </div>
            </div>
            
            <div v-if="isEditing" class="form-group">
              <label for="estado">Estado</label>
              <select id="estado" v-model="formData.estado">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            
            <div class="form-buttons">
              <button type="button" @click="closeModal" class="cancel-btn">Cancelar</button>
              <button type="submit" class="save-btn">{{ isEditing ? 'Actualizar' : 'Crear' }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Importamos el servicio que creamos para los datos de administración
import adminService from '@/services/adminDashboardService';
import { ref, computed, onMounted } from 'vue';
import { getCurrentUser, hasRole } from '@/services/authService';
import { alert, confirm } from '@/services/dialogService';

export default {
  name: 'AdminUsers',
  emits: ['user-created'], // Declarar los eventos que emite el componente
  setup(props, { emit }) { // Obtener emit desde el contexto
    const allUsers = ref([]); // Almacena todos los usuarios sin filtrar
    const users = ref([]); // Usuarios filtrados para mostrar
    const roles = ref([]);
    const loading = ref(true);
    const error = ref(null);
    
    // Filtros
    const searchTerm = ref('');
    const roleFilter = ref('');
    const statusFilter = ref('');
    
    // Formulario
    const showModal = ref(false);
    const isEditing = ref(false);
    const formData = ref({
      id: null,
      nombre: '',
      email: '',
      telefono: '',
      password: '',
      roles: [],
      estado: 'activo'
    });
    
    // Obtener referencias a las funciones del servicio admin
    const { 
      getUsers, 
      getRoles, 
      createUser, 
      updateUser, 
      cambiarEstadoUsuario, 
      deleteUser: removeUser 
    } = adminService;
    
    // Búsqueda con debounce
    let searchTimeout = null;
    
    // Obtener si el usuario actual es Administrador (no Superadministrador)
    const isOnlyAdmin = computed(() => {
      return hasRole('Administrador') && !hasRole('Superadministrador');
    });

    // Obtener si el usuario actual es Superadministrador
    const isSuperAdmin = computed(() => {
      return hasRole('Superadministrador');
    });

    // Filtrar roles disponibles según el rol del usuario actual
    const availableRoles = computed(() => {
      if (isOnlyAdmin.value) {
        // Si es solo Administrador, mostrar solo el rol de Empleado
        return roles.value.filter(role => role.nombre === 'Empleado');
      }
      // Si es Superadministrador, mostrar todos los roles
      return roles.value;
    });

    // Filtrar usuarios según el rol del usuario actual
    const filteredUsers = computed(() => {
      // Obtener el usuario actual
      const currentUser = getCurrentUser();
      
      // Filtrar usuarios
      return allUsers.value.filter(user => {
        // Si el usuario actual es el mismo que estamos revisando, siempre mostrarlo
        if (currentUser && user.email === currentUser.email) {
          return true;
        }
        
        // Ocultar el Super Administrador (superadmin@example.com) solo si el usuario actual NO es Superadministrador
        if (user.email === 'superadmin@example.com' && !isSuperAdmin.value) {
          return false;
        }
        
        // Si es solo Administrador, ocultar usuarios con rol de Superadministrador
        if (isOnlyAdmin.value) {
          if (user.roles && Array.isArray(user.roles) && user.roles.includes('Superadministrador')) {
            return false;
          }
        }
        
        // Los usuarios ya vienen filtrados desde el backend según quién los creó
        // Esta función solo aplica filtros adicionales de UI
        
        // Aplicar filtros adicionales
        if (roleFilter.value && (!user.roles || !user.roles.includes(roleFilter.value))) {
          return false;
        }
        
        if (statusFilter.value && user.estado !== statusFilter.value) {
          return false;
        }
        
        if (searchTerm.value && searchTerm.value.length >= 2) {
          const term = searchTerm.value.toLowerCase();
          const matchesName = user.nombre && user.nombre.toLowerCase().includes(term);
          const matchesEmail = user.email && user.email.toLowerCase().includes(term);
          
          return matchesName || matchesEmail;
        }
        
        return true;
      });
    });
    
    onMounted(async () => {
      try {
        console.log("AdminUsers componente montado - inicializando...");
        // Inicializar la lista de usuarios vacía
        allUsers.value = [];
        users.value = [];
        // Cargar datos
        await Promise.all([
          fetchUsers(),
          fetchRoles()
        ]);
        console.log("Inicialización completa, usuarios cargados:", users.value.length);
      } catch (initError) {
        console.error("Error durante la inicialización:", initError);
        error.value = `Error durante la inicialización: ${initError.message}`;
      }
    });
    
    // Obtener usuarios con filtros aplicados
    const fetchUsers = async () => {
      try {
        loading.value = true;
        error.value = '';
        
        // Limpiar la lista de usuarios actual para evitar datos residuales
        allUsers.value = [];
        users.value = [];
        
        try {
          console.log('Obteniendo usuarios con filtros:', {
            searchTerm: searchTerm.value,
            role: roleFilter.value,
            status: statusFilter.value
          });
          
          const response = await getUsers({
            searchTerm: searchTerm.value,
            role: roleFilter.value,
            status: statusFilter.value
          });
          
          if (response && response.success) {
            console.log(`Recibidos ${response.data.length} usuarios de la API`);
            
            // Guardar usuarios en la lista local
            allUsers.value = response.data;
            
            // Aplicar filtro para ocultar superadministradores y superadmin@example.com
            users.value = filteredUsers.value;
            return; // Salir de la función si todo fue exitoso
          }
          
          // Si llegamos aquí, hubo algún problema con la respuesta
          console.warn("Respuesta no exitosa de la API o formato incorrecto:", response);
          throw new Error(response?.message || 'Error al cargar usuarios');
          
        } catch (apiError) {
          console.error("Error al llamar a la API:", apiError);
          throw apiError; // Propagar el error para que se maneje en el bloque catch externo
        }
        
      } catch (err) {
        console.error('Error general al cargar usuarios:', err);
        error.value = `Error al cargar usuarios: ${err.message || 'Error desconocido'}`;
        // Inicializar arrays vacíos para evitar errores
        allUsers.value = [];
        users.value = [];
      } finally {
        loading.value = false;
      }
    };
    
    // Obtener roles disponibles
    const fetchRoles = async () => {
      try {
        try {
          const response = await getRoles();
          
          if (response && response.success) {
            roles.value = Array.isArray(response.data) ? response.data : [];
            return; // Salir si todo fue exitoso
          }
          
          // Si llegamos aquí, hubo algún problema con la respuesta
          console.warn("Respuesta no exitosa de la API de roles:", response);
          throw new Error(response?.message || 'Error al cargar roles');
          
        } catch (apiError) {
          console.error("Error al llamar a la API de roles:", apiError);
          
          // Usar roles básicos cuando la API falla para mantener la funcionalidad
          roles.value = [
            { id: 1, nombre: 'Superadministrador', descripcion: 'Control total del sistema' },
            { id: 2, nombre: 'Administrador', descripcion: 'Gestión de usuarios y configuración' },
            { id: 3, nombre: 'Empleado', descripcion: 'Operaciones básicas' }
          ];
          
          console.log("Usando roles básicos para mantener la funcionalidad:", roles.value.length);
        }
      } catch (err) {
        console.error('Error general al cargar roles:', err);
        // Inicializar con roles básicos para evitar errores
        roles.value = [
          { id: 1, nombre: 'Superadministrador' },
          { id: 2, nombre: 'Administrador' },
          { id: 3, nombre: 'Empleado' }
        ];
      }
    };
    
    // Manejar cambios en el campo de búsqueda con debounce
    const handleSearchInput = () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        // Si la búsqueda está vacía o tiene al menos 2 caracteres, realizar la búsqueda
        if (searchTerm.value === '' || searchTerm.value.length >= 2) {
          fetchUsers();
        }
      }, 300);
    };
    
    // Resetear filtros
    const resetFilters = () => {
      searchTerm.value = '';
      roleFilter.value = '';
      statusFilter.value = '';
      fetchUsers();
    };
    
    // Mostrar formulario de creación
    const showCreateForm = () => {
      isEditing.value = false;
      formData.value = {
        id: null,
        nombre: '',
        email: '',
        telefono: '',
        password: '',
        roles: ['Empleado'], // Rol por defecto
        estado: 'activo'
      };
      showModal.value = true;
    };
    
    // Editar usuario
    const editUser = (user) => {
      // No permitir editar usuarios superadministradores si el usuario actual es solo administrador
      if (isOnlyAdmin.value && user.roles && Array.isArray(user.roles) && user.roles.includes('Superadministrador')) {
        alert('No tienes permisos para editar usuarios con rol de Superadministrador');
        return;
      }

      isEditing.value = true;
      formData.value = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono || '',
        password: '', // Dejamos vacío para mantener la contraseña actual
        roles: [...user.roles],
        estado: user.estado
      };
      showModal.value = true;
    };
    
    // Guardar usuario (crear o actualizar)
    const saveUser = async () => {
      try {
        loading.value = true;
        error.value = ''; // Limpiar errores previos
        
        // Validar que al menos se seleccionó un rol
        if (!formData.value.roles.length) {
          await alert('Debe seleccionar al menos un rol para el usuario');
          loading.value = false;
          return;
        }

        // Validar que un Administrador no asigne roles superiores
        if (isOnlyAdmin.value) {
          // Filtrar los roles para mantener solo el de Empleado
          formData.value.roles = formData.value.roles.filter(role => role === 'Empleado');
          
          // Si después del filtro no queda ningún rol, añadimos Empleado
          if (formData.value.roles.length === 0) {
            formData.value.roles = ['Empleado'];
          }
        }
        
        if (isEditing.value) {
          // Filtrar para enviar solo los campos necesarios
          const userData = {
            nombre: formData.value.nombre,
            telefono: formData.value.telefono,
            roles: formData.value.roles,
            estado: formData.value.estado
          };
          
          // Si se proporciona una contraseña, incluirla
          if (formData.value.password) {
            userData.password = formData.value.password;
          }
          
          const response = await updateUser(formData.value.id, userData);
          
          if (response && response.success) {
            await alert(response.message || 'Usuario actualizado exitosamente');
            
            // Actualizar el usuario en la lista local
            const index = allUsers.value.findIndex(u => u.id === formData.value.id);
            if (index !== -1) {
              allUsers.value[index] = { ...allUsers.value[index], ...userData };
              // Refrescar la lista de usuarios filtrados
              users.value = filteredUsers.value;
            } else {
              // Si no se encuentra el usuario, refrescar toda la lista
              await fetchUsers();
            }
          } else {
            throw new Error(response?.message || 'Error al actualizar usuario');
          }
        } else {
          // Crear nuevo usuario
          const userData = {
            nombre: formData.value.nombre,
            email: formData.value.email,
            password: formData.value.password,
            telefono: formData.value.telefono,
            roles: formData.value.roles,
            fecha_creacion: new Date().toISOString() // Añadir fecha de creación
          };
          
          try {
            console.log("Llamando a createUser con:", userData);
            const response = await createUser(userData);
            
            if (response && response.success) {
              await alert(response.message || 'Usuario creado exitosamente');
              showModal.value = false; // Cerrar el modal después de crear exitosamente
              
              // Añadir directamente el usuario creado a la lista local
              if (response.data) {
                // Asegurarse de que el usuario tenga fecha de creación
                const newUser = {
                  ...response.data,
                  fecha_creacion: response.data.fecha_creacion || new Date().toISOString()
                };
                allUsers.value = [newUser, ...allUsers.value];
                // Refrescar la lista de usuarios filtrados
                users.value = filteredUsers.value;
              } else {
                // Si no tenemos los datos del usuario creado, refrescar toda la lista
                await fetchUsers();
              }
              
              // Emitir evento para refrescar estadísticas en el dashboard
              emit('user-created');
            } else {
              throw new Error(response?.message || 'Error al crear usuario');
            }
          } catch (createError) {
            console.error('Error al crear usuario:', createError);
            error.value = createError.message || 'Error al crear usuario';
            // No cerrar el modal para permitir corregir el error
          }
        }
      } catch (err) {
        console.error('Error al guardar el usuario:', err);
        error.value = err.message || 'Error al guardar el usuario';
      } finally {
        loading.value = false;
      }
    };
    
    // Activar usuario
    const activateUser = async (user) => {
      // No permitir activar usuarios superadministradores si el usuario actual es solo administrador
      if (isOnlyAdmin.value && user.roles && Array.isArray(user.roles) && user.roles.includes('Superadministrador')) {
        alert('No tienes permisos para modificar usuarios con rol de Superadministrador');
        return;
      }

      try {
        const confirmed = await confirm(
          `¿Estás seguro de que deseas activar el usuario ${user.nombre}?`,
          { 
            title: 'Confirmar activación',
            confirmText: 'Activar',
            cancelText: 'Cancelar' 
          }
        );
        
        if (confirmed) {
          loading.value = true;
          
          console.log(`Activando usuario con ID: ${user.id}`);
          const response = await cambiarEstadoUsuario(user.id, 'activo');
          
          if (response && response.success) {
            await alert(response.message || 'Usuario activado exitosamente');
            
            // Actualizar estado del usuario localmente en la lista
            const index = allUsers.value.findIndex(u => u.id === user.id);
            if (index !== -1) {
              allUsers.value[index].estado = 'activo';
              // Refrescar la lista de usuarios filtrados
              users.value = filteredUsers.value;
            }
          } else {
            throw new Error(response?.message || 'Error al activar usuario');
          }
        }
      } catch (err) {
        console.error('Error al activar usuario:', err);
        await alert(`Error al activar usuario: ${err.message || 'Error desconocido'}`);
      } finally {
        loading.value = false;
      }
    };
    
    // Desactivar usuario
    const deactivateUser = async (user) => {
      // No permitir desactivar usuarios superadministradores si el usuario actual es solo administrador
      if (isOnlyAdmin.value && user.roles && Array.isArray(user.roles) && user.roles.includes('Superadministrador')) {
        alert('No tienes permisos para modificar usuarios con rol de Superadministrador');
        return;
      }

      try {
        const confirmed = await confirm(
          `¿Estás seguro de que deseas desactivar el usuario ${user.nombre}? No podrá acceder al sistema mientras esté inactivo.`,
          { title: 'Confirmar desactivación' }
        );
        
        if (confirmed) {
          loading.value = true;
          
          console.log(`Desactivando usuario con ID: ${user.id}`);
          const response = await cambiarEstadoUsuario(user.id, 'inactivo');
          
          if (response && response.success) {
            await alert(response.message || 'Usuario desactivado exitosamente');
            
            // Actualizar estado del usuario localmente en la lista
            const index = allUsers.value.findIndex(u => u.id === user.id);
            if (index !== -1) {
              allUsers.value[index].estado = 'inactivo';
              // Refrescar la lista de usuarios filtrados
              users.value = filteredUsers.value;
            }
          } else {
            throw new Error(response?.message || 'Error al desactivar usuario');
          }
        }
      } catch (err) {
        console.error('Error al desactivar usuario:', err);
        await alert(`Error al desactivar usuario: ${err.message || 'Error desconocido'}`);
      } finally {
        loading.value = false;
      }
    };
    
    // Eliminar usuario
    const deleteUser = async (user) => {
      // No permitir eliminar usuarios superadministradores si el usuario actual es solo administrador
      if (isOnlyAdmin.value && user.roles && Array.isArray(user.roles) && user.roles.includes('Superadministrador')) {
        alert('No tienes permisos para eliminar usuarios con rol de Superadministrador');
        return;
      }

      try {
        const confirmed = await confirm(
          `¿Estás seguro de que deseas eliminar permanentemente el usuario ${user.nombre}? Esta acción no se puede deshacer.`,
          { 
            title: 'Confirmar eliminación',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar' 
          }
        );
        
        if (confirmed) {
          loading.value = true;
          
          console.log(`Eliminando usuario con ID: ${user.id}`);
          const response = await removeUser(user.id);
          
          if (response && response.success) {
            await alert(response.message || 'Usuario eliminado exitosamente');
            
            // Eliminar usuario de la lista local
            allUsers.value = allUsers.value.filter(u => u.id !== user.id);
            // Refrescar la lista de usuarios filtrados
            users.value = filteredUsers.value;
          } else {
            throw new Error(response?.message || 'Error al eliminar usuario');
          }
        }
      } catch (err) {
        console.error('Error al eliminar usuario:', err);
        await alert(`Error al eliminar usuario: ${err.message || 'Error desconocido'}`);
      } finally {
        loading.value = false;
      }
    };
    
    // Cerrar modal
    const closeModal = () => {
      showModal.value = false;
    };
    
    // Formatear fecha
    const formatDate = (dateStr) => {
      // Si no hay fecha, usar la fecha actual en lugar de mostrar N/A
      if (!dateStr) {
        dateStr = new Date().toISOString();
      }
      
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        
        return new Intl.DateTimeFormat('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date);
      } catch (e) {
        return 'Fecha inválida';
      }
    };
    
    return {
      users,
      roles,
      loading,
      error,
      searchTerm,
      roleFilter,
      statusFilter,
      showModal,
      isEditing,
      formData,
      fetchUsers,
      handleSearchInput,
      resetFilters,
      showCreateForm,
      editUser,
      saveUser,
      activateUser,
      deactivateUser,
      deleteUser,
      closeModal,
      formatDate,
      availableRoles,
      isOnlyAdmin,
      filteredUsers
    };
  }
}
</script>

<style scoped>
.users-container {
  padding: 0;
}

.section-title {
  font-size: 24px;
  margin-bottom: 30px;
  color: #333;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 10px;
}

/* Controles y filtros */
.users-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 30px;
}

.search-container {
  flex-grow: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.filters {
  display: flex;
  gap: 10px;
}

.filter-select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.actions {
  margin-left: auto;
}

.create-user-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.3s;
}

.create-user-btn:hover {
  background-color: #45a049;
}

.btn-icon {
  font-size: 16px;
}

/* Estados de carga y error */
.loading-container, .error-container, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin: 20px 0;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #4CAF50;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #f44336;
  font-weight: bold;
  margin-bottom: 15px;
}

.retry-btn {
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  cursor: pointer;
  font-weight: bold;
}

.retry-btn:hover {
  background-color: #0b7dda;
}

.empty-icon {
  font-size: 48px;
  color: #ccc;
  margin-bottom: 10px;
}

.empty-title {
  font-size: 20px;
  color: #666;
  margin-bottom: 10px;
}

.empty-description {
  color: #888;
  margin-bottom: 20px;
}

.reset-filters-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  cursor: pointer;
  font-weight: bold;
}

.reset-filters-btn:hover {
  background-color: #45a049;
}

/* Tabla de usuarios */
.users-table-container {
  overflow-x: auto;
  margin-top: 20px;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.users-table th, .users-table td {
  padding: 15px;
  text-align: left;
}

.users-table th {
  background-color: #4CAF50;
  color: white;
  font-weight: normal;
}

.users-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.users-table tr:hover {
  background-color: #f1f1f1;
}

.inactive-user {
  opacity: 0.7;
  background-color: #f5f5f5 !important;
}

/* Badges */
.roles-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.role-badge {
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 12px;
  background-color: #e0e0e0;
  color: #333;
}

.admin-role {
  background-color: #2196F3;
  color: white;
}

.superadmin-role {
  background-color: #673AB7;
  color: white;
}

.status-badge {
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 12px;
}

.active-status {
  background-color: #4CAF50;
  color: white;
}

.inactive-status {
  background-color: #f44336;
  color: white;
}

/* Botones de acción */
.action-buttons {
  display: flex;
  gap: 5px;
}

.edit-btn, .activate-btn, .deactivate-btn, .delete-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.edit-btn {
  background-color: #2196F3;
  color: white;
}

.edit-btn:hover {
  background-color: #0b7dda;
}

.activate-btn {
  background-color: #4CAF50;
  color: white;
}

.activate-btn:hover {
  background-color: #45a049;
}

.deactivate-btn {
  background-color: #FF9800;
  color: white;
}

.deactivate-btn:hover {
  background-color: #e68a00;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.delete-btn:hover {
  background-color: #d32f2f;
}

/* Modal */
.modal-overlay {
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

.modal-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalFadeIn 0.3s;
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #666;
}

.modal-body {
  padding: 20px;
}

/* Formulario */
.user-form {
  display: grid;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  color: #666;
  font-weight: 600;
}

.form-group input, .form-group select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus, .form-group select:focus {
  outline: none;
  border-color: #4CAF50;
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.roles-checkboxes {
  display: grid;
  gap: 10px;
}

.role-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-checkbox input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.form-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.cancel-btn, .save-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  flex: 1;
}

.cancel-btn {
  background-color: #f1f1f1;
  color: #333;
}

.cancel-btn:hover {
  background-color: #e1e1e1;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
}

.save-btn:hover {
  background-color: #45a049;
}

@media (max-width: 768px) {
  .users-controls {
    flex-direction: column;
  }
  
  .actions {
    margin-left: 0;
    width: 100%;
  }
  
  .create-user-btn {
    width: 100%;
  }
}
</style>
