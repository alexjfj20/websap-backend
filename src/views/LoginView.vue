<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">Iniciar Sesión</h1>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Correo electrónico</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required 
            placeholder="Ingresa tu correo" 
          />
        </div>
        
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            placeholder="Ingresa tu contraseña" 
          />
        </div>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <button type="submit" :disabled="isLoading" class="login-button">
          {{ isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
        </button>
      </form>
      
      <div class="login-options">
        <router-link to="/register">¿No tienes cuenta? Regístrate</router-link>
        <a href="#" @click.prevent="handleForgotPassword">¿Olvidaste tu contraseña?</a>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { login } from '@/services/authService';
import { alert } from '../services/dialogService';

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const email = ref('');
    const password = ref('');
    const isLoading = ref(false);
    const errorMessage = ref('');

    const handleLogin = async () => {
      // Limpiar mensajes de error previos
      errorMessage.value = '';
      isLoading.value = true;
      
      try {
        // Limpiar completamente cualquier sesión anterior
        localStorage.clear(); // Limpia todo el localStorage
        sessionStorage.clear(); // Limpia todo el sessionStorage
        
        // Intentar iniciar sesión
        console.log('Intentando login con:', email.value);
        const result = await login(email.value, password.value);
        
        console.log('Login exitoso:', result);
        
        // Establecer el estado de autenticación
        localStorage.setItem('isLoggedIn', 'true');
        
        // Redirigir según el rol del usuario
        if (result.user.roles && result.user.roles.includes('Superadministrador')) {
          // Redirigir a vista de SuperAdmin
          router.push('/superadmin');
        } else if (result.user.roles && result.user.roles.includes('Administrador')) {
          // Redirigir a vista de Admin
          router.push('/admin');
        } else {
          // Redirigir a vista de Empleado para cualquier otro rol
          router.push('/employee');
        }
      } catch (error) {
        console.error('Error de login:', error);
        errorMessage.value = error.message || 'Error al iniciar sesión';
      } finally {
        isLoading.value = false;
      }
    };

    const handleForgotPassword = async () => {
      await alert('Función de recuperación de contraseña no implementada en esta versión de demostración.');
    };

    return {
      email,
      password,
      isLoading,
      errorMessage,
      handleLogin,
      handleForgotPassword
    };
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 100px);
  padding: 20px;
  background-color: #f5f5f5;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 25px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  color: #4CAF50;
  margin-bottom: 25px;
  font-size: 28px;
}

.login-form {
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

.form-group input {
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
  background-color: #f0f8ff;
}

.form-group input:focus {
  border-color: #4CAF50;
  outline: none;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.login-button {
  padding: 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-button:hover:not(:disabled) {
  background-color: #45a049;
}

.login-button:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-options {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.login-options a {
  color: #4CAF50;
  text-decoration: none;
  font-size: 14px;
}

.login-options a:hover {
  text-decoration: underline;
}

.credentials-info {
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 15px;
  font-size: 14px;
}

.credentials-info p {
  margin-top: 0;
  margin-bottom: 8px;
}

.credentials-info ul {
  margin: 0;
  padding-left: 20px;
}

.credentials-info li {
  margin-bottom: 5px;
}

.error-message {
  color: #d32f2f;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-align: center;
}

@media (max-width: 480px) {
  .login-card {
    padding: 20px;
  }
  
  .login-title {
    font-size: 24px;
  }
  
  .form-group input {
    padding: 10px;
  }
}

.login-form button[type="submit"] {
  padding: 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 100%;
}

.login-form button[type="submit"]:hover:not(:disabled) {
  background-color: #45a049;
}

.login-form button[type="submit"]:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}
</style>
