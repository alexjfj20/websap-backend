<template>
  <div class="home-container">
    <h1>Sistema de Gestión de Menú</h1>
    
    <div class="auth-options">
      <router-link to="/login" class="auth-button login">Iniciar Sesión</router-link>
      <router-link to="/register" class="auth-button register">Registrarse</router-link>
    </div>
    
    <div class="login-info">
      <p>Para probar la aplicación, puedes usar estas credenciales:</p>
      <ul>
        <li><strong>Email:</strong> superadmin@example.com | <strong>Contraseña:</strong>SuperAdmin2023</li>
        <li><strong>Email:</strong> admin@example.com      | <strong>Contraseña:</strong>Admin2023</li>
        <li><strong>Email:</strong> empleado@example.com   | <strong>Contraseña:</strong>Empleado2023</li>
      </ul>
    </div>
    
    <div class="menu-options">
      <div class="option-card" @click="goToMenu">
        <h2>Gestionar Menú</h2>
        <p>Configura tu menú, precios y formas de pago</p>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';

export default {
  name: 'HomeView',
  setup() {
    const router = useRouter();
    
    const goToMenu = () => {
      router.push('/menu');
    };
    
    return {
      goToMenu
    };
  }
}
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
}

h1 {
  margin-bottom: 40px;
  color: #4CAF50;
}

.auth-options {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
}

.auth-button {
  padding: 12px 30px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s;
}

.auth-button.login {
  background-color: #007bff;
  color: white;
}

.auth-button.login:hover {
  background-color: #0056b3;
}

.auth-button.register {
  background-color: #28a745;
  color: white;
}

.auth-button.register:hover {
  background-color: #218838;
}

.menu-options {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
}

.option-card {
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  width: 300px;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.option-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

h2 {
  margin-bottom: 15px;
  color: #333;
}

p {
  color: #666;
  line-height: 1.5;
}

/* Estilos para la información de inicio de sesión */
.login-info {
  margin: 20px auto;
  padding: 15px;
  background-color: #f0f7ff;
  border-radius: 8px;
  border-left: 4px solid #007bff;
  max-width: 600px;
  text-align: left;
}

.login-info p {
  margin-bottom: 10px;
  color: #333;
}

.login-info ul {
  list-style-type: none;
  padding: 0;
}

.login-info li {
  padding: 5px 0;
  font-size: 14px;
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
