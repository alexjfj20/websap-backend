<template>
  <div class="usuarios-container">
    <h2>Gestión de Usuarios</h2>
    
    <div class="loading-error" v-if="loading">
      <p>Cargando datos de usuarios...</p>
    </div>
    
    <div class="loading-error" v-if="error">
      <p>{{ errorMessage }}</p>
    </div>
    
    <table v-if="!loading && !error && usuarios.length > 0" class="usuarios-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Email</th>
          <th>Rol</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="usuario in usuarios" :key="usuario.id">
          <td>{{ usuario.id }}</td>
          <td>{{ usuario.nombre }}</td>
          <td>{{ usuario.email }}</td>
          <td>{{ usuario.rol }}</td>
          <td>
            <button @click="editarUsuario(usuario)">Editar</button>
            <button @click="eliminarUsuario(usuario.id)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
    
    <div class="no-data-message" v-if="!loading && !error && usuarios.length === 0">
      <p>No hay usuarios disponibles.</p>
    </div>
    
    <div class="data-source-info">
      <p>Fuente de datos: {{ dataSource }}</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { openDB } from 'idb';

export default {
  name: 'Usuarios',
  setup() {
    const usuarios = ref([]);
    const loading = ref(true);
    const error = ref(false);
    const errorMessage = ref('');
    const dataSource = ref('');
    
    // Datos dummy como último recurso
    const dummyUsuarios = [
      { id: 1, nombre: 'Admin Demo', email: 'admin@ejemplo.com', rol: 'Administrador' },
      { id: 2, nombre: 'Usuario Demo', email: 'usuario@ejemplo.com', rol: 'Usuario' },
      { id: 3, nombre: 'Invitado Demo', email: 'invitado@ejemplo.com', rol: 'Invitado' }
    ];
    
    // Configuración de la base de datos IndexedDB
    const dbPromise = openDB('websap-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('usuarios')) {
          db.createObjectStore('usuarios', { keyPath: 'id' });
        }
      }
    });
    
    // Función para obtener usuarios desde la API
    const fetchUsuariosFromAPI = async () => {
      try {
        const response = await axios.get('https://api.ejemplo.com/usuarios');
        const data = response.data;
        
        // Guardar datos en IndexedDB para uso offline
        const db = await dbPromise;
        const tx = db.transaction('usuarios', 'readwrite');
        data.forEach(usuario => {
          tx.store.put(usuario);
        });
        await tx.done;
        
        dataSource.value = 'API Externa';
        return data;
      } catch (err) {
        console.error('Error al obtener datos desde la API:', err);
        throw err;
      }
    };
    
    // Función para obtener usuarios desde IndexedDB
    const fetchUsuariosFromIndexedDB = async () => {
      try {
        const db = await dbPromise;
        const data = await db.getAll('usuarios');
        
        if (data && data.length > 0) {
          dataSource.value = 'IndexedDB (Almacenamiento Local)';
          return data;
        }
        throw new Error('No hay datos en IndexedDB');
      } catch (err) {
        console.error('Error al obtener datos desde IndexedDB:', err);
        throw err;
      }
    };
    
    // Función para cargar usuarios con estrategia de respaldo
    const loadUsuarios = async () => {
      loading.value = true;
      error.value = false;
      errorMessage.value = '';
      
      try {
        // 1. Primero intentar obtener datos de la API
        usuarios.value = await fetchUsuariosFromAPI();
      } catch (apiError) {
        try {
          // 2. Si falla la API, intentar obtener de IndexedDB
          usuarios.value = await fetchUsuariosFromIndexedDB();
        } catch (idbError) {
          // 3. Si todo falla, usar datos dummy
          usuarios.value = dummyUsuarios;
          dataSource.value = 'Datos de respaldo (Modo offline)';
          console.warn('Usando datos dummy debido a fallos en API e IndexedDB');
        }
      } finally {
        loading.value = false;
      }
    };
    
    const editarUsuario = (usuario) => {
      // Lógica para editar usuario
      console.log('Editando usuario:', usuario);
    };
    
    const eliminarUsuario = (id) => {
      // Lógica para eliminar usuario
      console.log('Eliminando usuario con ID:', id);
    };
    
    onMounted(() => {
      loadUsuarios();
    });
    
    return {
      usuarios,
      loading,
      error,
      errorMessage,
      dataSource,
      editarUsuario,
      eliminarUsuario
    };
  }
}
</script>

<style scoped>
.usuarios-container {
  padding: 20px;
}

.usuarios-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.usuarios-table th, .usuarios-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.usuarios-table th {
  background-color: #f2f2f2;
}

.loading-error {
  margin: 20px 0;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.no-data-message {
  margin: 20px 0;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 4px;
  text-align: center;
}

.data-source-info {
  margin-top: 20px;
  font-size: 0.8em;
  color: #6c757d;
  font-style: italic;
}
</style>