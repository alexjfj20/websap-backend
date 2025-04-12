<template>
  <div class="auth-container">
    <div class="auth-form-card">
      <h2 class="auth-title">Iniciar Sesión</h2>
      
      <div v-if="loginError" class="error-message">
        {{ loginError }}
      </div>
      
      <form @submit.prevent="login" class="auth-form">
        <div class="form-group">
          <label for="login-email">Email:</label>
          <input 
            type="email" 
            id="login-email" 
            v-model="loginForm.email" 
            class="auth-input"
            required
            placeholder="Ingresa tu correo electrónico"
          >
        </div>
        <div class="form-group">
          <label for="login-password">Contraseña:</label>
          <input 
            type="password" 
            id="login-password" 
            v-model="loginForm.password" 
            class="auth-input"
            required
            placeholder="Ingresa tu contraseña"
          >
        </div>
        <button type="submit" class="auth-button">Ingresar</button>
      </form>
      <div class="auth-links">
        <p>¿No tienes cuenta? <router-link to="/register" class="auth-link">Registrarse</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getUsersFromDB } from '../services/userService';

export default {
  name: 'LoginComponent',
  setup() {
    const loginForm = ref({
      email: '',
      password: ''
    });
    
    const users = ref([]);
    const router = useRouter();
    const loginError = ref('');
    
    onMounted(async () => {
      try {
        const usersFromDB = await getUsersFromDB();
        users.value = usersFromDB || [];
        console.log(`Cargados ${users.value.length} usuarios desde IndexedDB`);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        users.value = [];
        loginError.value = 'Error al cargar usuarios. Por favor, intente más tarde.';
      }
    });
    
    const login = async () => {
      loginError.value = '';
      
      // Asegurarse de que users es un array antes de usar find
      if (!Array.isArray(users.value)) {
        users.value = [];
      }
      
      if (users.value.length === 0) {
        loginError.value = 'No hay usuarios registrados. Por favor, regístrese primero.';
        setTimeout(() => {
          router.push('/register');
        }, 2000);
        return;
      }
      
      const user = users.value.find(user => 
        user.email === loginForm.value.email && 
        user.password === loginForm.value.password
      );
      
      if (user) {
        // Redirigir a la página del menú
        router.push('/menu');
      } else {
        loginError.value = 'Credenciales inválidas. Por favor, intente nuevamente.';
      }
    };
    
    return {
      loginForm,
      users,
      login,
      loginError
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

@media (max-width: 500px) {
  .auth-form-card {
    padding: 20px;
  }
  
  .auth-title {
    font-size: 24px;
  }
}

.error-message {
  background-color: #ffebee;
  color: #b71c1c;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .payment-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .payment-option, .payment-method {
    width: 100%;
    max-width: 400px; /* Evita que sean demasiado anchos en pantallas grandes */
  }
}

@media (max-width: 480px) {
  .payment-container {
    gap: 8px; /* Menos espacio en pantallas más pequeñas */
  }

  .payment-option, .payment-method {
    max-width: 100%; /* Se ajusta completamente al ancho del móvil */
  }
}
</style>
