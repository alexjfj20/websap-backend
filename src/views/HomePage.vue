<template>
  <div class="home">
    <h1>Bienvenido a WebSAP</h1>
    <p>Aplicación para gestionar menús de restaurantes</p>
    
    <div class="cta-container">
      <router-link to="/menu" class="cta-button">Ver Menú</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomePage'
}
</script>

<style scoped>
.home {
  padding: 30px 20px;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: #4CAF50;
}

p {
  font-size: 1.2rem;
  margin-bottom: 40px;
  color: #666;
}

.cta-container {
  margin-top: 30px;
}

.cta-button {
  display: inline-block;
  background-color: #4CAF50;
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: bold;
  font-size: 1.1rem;
  transition: background-color 0.3s;
}

.cta-button:hover {
  background-color: #45a049;
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
