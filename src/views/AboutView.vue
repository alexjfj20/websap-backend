<template>
  <div class="about-container">
    <h1>Acerca de WebSAP</h1>
    <div class="about-content">
      <section class="about-section">
        <h2>Nuestra Misión</h2>
        <p>
          WebSAP es una aplicación diseñada para facilitar la gestión de menús y pedidos para pequeños y medianos restaurantes. 
          Nuestro objetivo es proporcionar una herramienta sencilla pero potente que permita a los negocios de alimentos 
          administrar su carta, controlar ventas y conectar con sus clientes de manera efectiva.
        </p>
      </section>
      
      <section class="about-section">
        <h2>Características Principales</h2>
        <ul class="feature-list">
          <li>🍽️ Gestión completa del menú con imágenes y descripciones</li>
          <li>📊 Control de inventario y estadísticas de ventas</li>
          <li>💸 Opciones de pago personalizables (QR, Nequi)</li>
          <li>🌐 Compartir menús digitales mediante enlaces o WhatsApp</li>
          <li>📱 Experiencia adaptada para dispositivos móviles</li>
          <li>📁 Almacenamiento local seguro de todos tus datos</li>
        </ul>
      </section>
      
      <section class="about-section">
        <h2>Contacto</h2>
        <p>
          Si tienes preguntas, sugerencias o necesitas soporte técnico, no dudes en contactarnos:
        </p>
        <div class="contact-info">
          <p>📧 Email: soporte@websap.com</p>
          <p>📞 Teléfono: +1 234 567 8900</p>
        </div>
      </section>
      
      <div class="back-link">
        <router-link to="/">&larr; Volver al Inicio</router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AboutView'
}
</script>

<style scoped>
.about-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}

h1 {
  color: #4CAF50;
  text-align: center;
  margin-bottom: 40px;
}

.about-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 30px;
}

.about-section {
  margin-bottom: 30px;
}

h2 {
  color: #333;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

p {
  line-height: 1.6;
  color: #555;
}

.feature-list {
  list-style: none;
  padding-left: 0;
}

.feature-list li {
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.feature-list li:last-child {
  border-bottom: none;
}

.contact-info {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 10px;
}

.contact-info p {
  margin: 8px 0;
}

.back-link {
  margin-top: 30px;
  text-align: center;
}

.back-link a {
  color: #4CAF50;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.3s;
}

.back-link a:hover {
  color: #367c39;
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
