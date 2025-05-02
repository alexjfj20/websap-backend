<template>
  <div class="not-found">
    <div class="container">
      <h1>404</h1>
      <h2>Página no encontrada</h2>
      <p>Lo sentimos, la página que estás buscando no existe o ha sido movida.</p>
      <router-link to="/" class="btn btn-primary">
        Volver al inicio
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundView',
  mounted() {
    document.title = 'Página no encontrada | WebSAP';
  }
}
</script>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
  background-color: #f8f9fa;
}

.container {
  max-width: 500px;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 6rem;
  color: #dc3545;
  margin-bottom: 0;
}

h2 {
  margin-top: 0;
  margin-bottom: 20px;
}

p {
  margin-bottom: 30px;
  color: #6c757d;
}

.btn {
  padding: 10px 20px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #0069d9;
}
</style>