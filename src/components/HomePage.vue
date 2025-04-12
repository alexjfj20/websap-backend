<template>
  <div class="home-container">
    <h1>Sistema de Gestión de Menú</h1>
    
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
  name: 'HomePage',
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
