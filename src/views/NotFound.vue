<template>
  <div class="not-found">
    <h1>404</h1>
    <h2>Página no encontrada</h2>
    <p>Lo sentimos, la página que estás buscando no existe.</p>
    <router-link to="/" class="home-link">Volver al inicio</router-link>
  </div>
</template>

<style scoped>
.not-found {
  text-align: center;
  padding: 5rem 1rem;
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  font-size: 6rem;
  color: #e74c3c;
  margin-bottom: 1rem;
}

h2 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

p {
  margin-bottom: 2rem;
  color: #666;
}

.home-link {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.home-link:hover {
  background-color: #2980b9;
}
</style> 