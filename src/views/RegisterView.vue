<template>
  <div class="register-container">
    <div class="register-card">
      <h1>Crear Cuenta</h1>
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="name">Nombre Completo</label>
          <input 
            type="text" 
            id="name" 
            v-model="name" 
            required
            placeholder="Tu nombre completo"
          >
        </div>
        
        <div class="form-group">
          <label for="email">Correo Electrónico</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required
            placeholder="usuario@ejemplo.com"
          >
        </div>
        
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required
            placeholder="Crea una contraseña segura"
          >
        </div>
        
        <div class="form-group">
          <label for="confirm-password">Confirmar Contraseña</label>
          <input 
            type="password" 
            id="confirm-password" 
            v-model="confirmPassword" 
            required
            placeholder="Repite tu contraseña"
          >
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <button type="submit" class="register-button" :disabled="isLoading">
          {{ isLoading ? 'Procesando...' : 'Registrarse' }}
        </button>
      </form>
      
      <div class="register-footer">
        <p>¿Ya tienes una cuenta? <router-link to="/login">Inicia sesión</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'RegisterView',
  setup() {
    const router = useRouter();
    const name = ref('');
    const email = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const error = ref('');
    const isLoading = ref(false);
    
    const handleRegister = async () => {
      try {
        error.value = '';
        
        // Validaciones básicas
        if (password.value !== confirmPassword.value) {
          error.value = 'Las contraseñas no coinciden.';
          return;
        }
        
        if (password.value.length < 6) {
          error.value = 'La contraseña debe tener al menos 6 caracteres.';
          return;
        }
        
        isLoading.value = true;
        
        // Simulación de registro (reemplazar con lógica real)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Registro exitoso simulado
        alert('Registro exitoso. Por favor inicia sesión.');
        router.push('/login');
        
      } catch (err) {
        console.error('Error al registrar usuario:', err);
        error.value = 'Error al procesar el registro. Por favor, inténtalo de nuevo.';
      } finally {
        isLoading.value = false;
      }
    };
    
    return {
      name,
      email,
      password,
      confirmPassword,
      error,
      isLoading,
      handleRegister
    };
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.register-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  padding: 30px;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
}

input:focus {
  border-color: #28a745;
  outline: none;
}

.register-button {
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.register-button:hover:not([disabled]) {
  background-color: #218838;
}

.register-button[disabled] {
  background-color: #86d998;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  text-align: center;
  padding: 5px;
  background-color: rgba(220, 53, 69, 0.1);
  border-radius: 4px;
}

.register-footer {
  margin-top: 20px;
  text-align: center;
}

.register-footer p {
  margin-bottom: 10px;
  color: #555;
}

a {
  color: #28a745;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* garantizar una buena experiencia en dispositivos móviles */
@media (max-width: 480px) {
  .payment-options {
    flex-direction: column;
    gap: 8px;
  }
  
  .payment-option {
    width: 100%;
  }
}
</style>
