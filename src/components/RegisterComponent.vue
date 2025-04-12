<template>
  <div class="auth-container">
    <div class="auth-form-card">
      <h2 class="auth-title">Crear Cuenta</h2>
      
      <!-- Mensaje de error -->
      <div v-if="registerError" class="error-message">
        {{ registerError }}
      </div>
      
      <form @submit.prevent="register" class="auth-form">
        <div class="form-group">
          <label for="register-name">Nombre:</label>
          <input 
            type="text" 
            id="register-name" 
            v-model="registerForm.name" 
            class="auth-input"
            required
            placeholder="Ingresa tu nombre completo"
          >
        </div>
        <div class="form-group">
          <label for="register-email">Email:</label>
          <input 
            type="email" 
            id="register-email" 
            v-model="registerForm.email"
            class="auth-input" 
            required
            placeholder="Ingresa tu correo electrónico"
          >
        </div>
        <div class="form-group">
          <label for="register-password">Contraseña:</label>
          <input 
            type="password" 
            id="register-password" 
            v-model="registerForm.password" 
            class="auth-input"
            required
            placeholder="Crea una contraseña segura"
          >
        </div>
        <button type="submit" class="auth-button">Registrarse</button>
      </form>
      <div class="auth-links">
        <p>¿Ya tienes una cuenta? <router-link to="/login" class="auth-link">Iniciar sesión</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getUsersFromDB, saveUserToDB } from '../services/userService';

export default {
  name: 'RegisterComponent',
  setup() {
    const registerForm = ref({
      name: '',
      email: '',
      password: ''
    });
    
    const users = ref([]);
    const registerError = ref('');
    const router = useRouter();
    
    onMounted(async () => {
      try {
        const usersFromDB = await getUsersFromDB();
        users.value = usersFromDB || [];
        console.log(`Cargados ${users.value.length} usuarios de IndexedDB`);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        users.value = [];
        registerError.value = 'Error al cargar usuarios: ' + error.message;
      }
    });
    
    const register = async () => {
      try {
        registerError.value = '';
        
        // Asegurarse de que users es un array antes de usar some
        if (!Array.isArray(users.value)) {
          users.value = [];
        }
        
        // Verificar si el email ya existe
        if (users.value.some(user => user.email === registerForm.value.email)) {
          registerError.value = 'Este correo electrónico ya está registrado. Por favor, use otro.';
          return;
        }
        
        console.log("Iniciando registro de usuario...");
        
        // Crear un objeto simple del usuario para evitar problemas de serialización
        const newUser = {
          id: String(Date.now()), // Convertir a string para evitar problemas
          name: String(registerForm.value.name),
          email: String(registerForm.value.email),
          password: String(registerForm.value.password)
        };
        
        console.log("Guardando usuario en la base de datos:", newUser.email);
        
        // Guardar el nuevo usuario
        const result = await saveUserToDB(newUser);
        
        if (result) {
          console.log("Usuario guardado exitosamente");
          // Actualizar la lista local solo después de confirmar que se guardó exitosamente
          users.value.push(newUser);
          
          alert('Registro exitoso. Por favor, inicie sesión.');
          router.push('/login');
        } else {
          registerError.value = 'Error al guardar usuario: resultado no válido';
        }
      } catch (error) {
        console.error('Error durante el registro:', error);
        registerError.value = `Error al registrar usuario: ${error.message || 'Error desconocido'}`;
      }
    };
    
    return {
      registerForm,
      users,
      register,
      registerError
    };
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
}

.auth-form-card {
  width: 100%;
  max-width: 450px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.auth-title {
  text-align: center;
  color: #4CAF50;
  font-size: 28px;
  margin-bottom: 30px;
  font-weight: 600;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.auth-input {
  padding: 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.auth-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.auth-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 14px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: 10px;
}

.auth-button:hover {
  background-color: #388E3C;
}

.auth-links {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.auth-link {
  color: #4CAF50;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.auth-link:hover {
  color: #388E3C;
  text-decoration: underline;
}

.error-message {
  background-color: #ffebee;
  color: #b71c1c;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
}

@media (max-width: 500px) {
  .auth-form-card {
    padding: 20px;
  }
  
  .auth-title {
    font-size: 24px;
  }
}
</style>
