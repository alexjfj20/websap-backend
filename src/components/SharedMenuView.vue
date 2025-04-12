<template>
  <div class="shared-menu-container">
    <!-- INFORMACIÓN DEL NEGOCIO -->
    <div class="business-header">
      <img v-if="businessInfo.logo" :src="businessInfo.logo" alt="Business Logo" class="business-logo">
      <div class="business-info">
        <h1>{{ businessInfo.name || 'Menú del Restaurante' }}</h1>
        <p class="business-description">{{ businessInfo.description }}</p>
      </div>
    </div>
    
    <!-- BOTÓN MOSTRAR/OCULTAR INFORMACIÓN ADICIONAL -->
    <button @click="toggleBusinessInfo" class="toggle-button">
      {{ showBusinessInfo ? 'Ocultar información adicional' : 'Mostrar información adicional' }}
    </button>
    
    <!-- INFORMACIÓN ADICIONAL (MOSTRAR/OCULTAR) -->
    <div v-if="showBusinessInfo" class="additional-info">
      <h3>Información Adicional</h3>
      <div class="info-grid">
        <div v-if="businessInfo.address" class="info-item">
          <span class="info-label">Dirección:</span>
          <span>{{ businessInfo.address }}</span>
        </div>
        <div v-if="businessInfo.contact" class="info-item">
          <span class="info-label">Contacto:</span>
          <span>{{ businessInfo.contact }}</span>
        </div>
        <div v-if="businessInfo.email" class="info-item">
          <span class="info-label">Email:</span>
          <span>{{ businessInfo.email }}</span>
        </div>
        <div v-if="businessInfo.hours" class="info-item">
          <span class="info-label">Horario:</span>
          <span>{{ businessInfo.hours }}</span>
        </div>
      </div>
    </div>

    <!-- MENÚ -->
    <h2>Menú</h2>
    <div v-if="loading" class="loading-indicator">
      <div class="spinner"></div>
      <p>Cargando menú...</p>
    </div>
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="loadMenu" class="retry-button">Intentar nuevamente</button>
    </div>
    <div v-else-if="menuItems.length === 0" class="empty-menu">
      <p>No hay platos disponibles en este menú.</p>
    </div>
    <div v-else class="menu-items">
      <div v-for="item in menuItems" :key="item.id" class="menu-item">
        <div class="item-image-container">
          <img v-if="item.image" :src="item.image" alt="Imagen del plato" class="item-image">
          <div v-else class="item-image-placeholder">
            <span class="no-image-icon">🍽️</span>
            <span>Sin imagen</span>
          </div>
        </div>
        <div class="item-details">
          <h3>{{ item.name }}</h3>
          <p class="item-description">{{ item.description }}</p>
          <div class="item-price-actions">
            <p class="item-price">${{ formatPrice(item.price) }}</p>
            <div class="quantity-controls">
              <button @click="decreaseQuantity(item)" class="quantity-btn">−</button>
              <span class="quantity">{{ item.quantity }}</span>
              <button @click="increaseQuantity(item)" class="quantity-btn">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Después de la sección de platos especiales -->
    <ReservaForm />

    <!-- TU PEDIDO (ANTERIORMENTE "ORDER SUMMARY") -->
    <div class="order-summary">
      <h2>Tu Pedido</h2>
      <div v-if="hasItemsInOrder" class="order-items">
        <div v-for="item in orderItems" :key="item.id" class="order-item">
          <div class="order-item-details">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-quantity">x{{ item.quantity }}</span>
          </div>
          <span class="item-total">${{ formatPrice(item.price * item.quantity) }}</span>
        </div>
        <div class="order-total">
          <span>Total:</span>
          <span class="total-price">${{ formatPrice(total) }}</span>
        </div>
      </div>
      <p v-else class="empty-order">No has agregado ningún producto a tu pedido</p>
      
      <!-- FORMULARIO DE CONTACTO -->
      <div class="contact-form">
        <h3>Datos de Contacto</h3>
        <form @submit.prevent="sendOrder">
          <div class="form-group">
            <label for="customer-name">Nombre</label>
            <input id="customer-name" v-model="customerInfo.name" type="text" required placeholder="Tu nombre completo">
          </div>
          <div class="form-group">
            <label for="customer-phone">Teléfono</label>
            <input id="customer-phone" v-model="customerInfo.phone" type="tel" required placeholder="Tu número de contacto">
          </div>
          <div class="form-group">
            <label for="customer-address">Dirección</label>
            <input id="customer-address" v-model="customerInfo.address" type="text" required placeholder="Tu dirección de entrega">
          </div>
          <div class="form-group">
            <label for="customer-notes">Notas adicionales</label>
            <textarea id="customer-notes" v-model="customerInfo.notes" placeholder="Instrucciones especiales, alergias, etc."></textarea>
          </div>
          <button type="submit" class="send-order-button" :disabled="!hasItemsInOrder">
            Enviar Pedido por WhatsApp
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { getMenu } from '../services/menuService';
import { formatOrderMessage } from '../utils/messageFormatter';
import { getBusinessInfo } from '../services/storageService';
import { confirm } from '../services/dialogService';
import ReservaForm from '../components/reservas/ReservaForm.vue';

export default {
  name: 'SharedMenuView',
  data() {
    return {
      menuItems: [],
      businessInfo: {},
      showBusinessInfo: false,
      customerInfo: {
        name: '',
        phone: '',
        address: '',
        notes: ''
      },
      loading: true,
      error: null,
      debug: {} // Para almacenar información de depuración
    };
  },
  mounted() {
    console.log("SharedMenuView montado, ID del menú:", this.$route.params.menuId);
    this.loadMenu();
    this.loadBusinessInfo();
  },
  computed: {
    orderItems() {
      return this.menuItems.filter(item => item.quantity > 0);
    },
    hasItemsInOrder() {
      return this.orderItems.length > 0;
    },
    total() {
      return this.menuItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    }
  },
  methods: {
    formatPrice(price) {
      // Asegurarse que price es un número
      if (isNaN(Number(price))) return '0,00';
      
      // Convertir a número, fijar 2 decimales y convertir a string
      const fixed = Number(price).toFixed(2);
      
      // Separar parte entera y decimal
      const [intPart, decPart] = fixed.split('.');
      
      // Formatear parte entera con puntos como separadores de miles
      const formattedIntPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      
      // Unir con coma como separador decimal
      return `${formattedIntPart},${decPart}`;
    },
    async loadMenu() {
      try {
        this.loading = true;
        this.error = null;
        const menuId = this.$route.params.menuId;
        console.log("Cargando menú con ID:", menuId);
        
        const menuData = await getMenu(menuId);
        
        if (menuData && Array.isArray(menuData) && menuData.length > 0) {
          console.log("Menú cargado exitosamente:", menuData.length, "elementos");
          
          // Log para depuración
          const itemsWithImages = menuData.filter(item => Boolean(item.image)).length;
          console.log(`Elementos con imágenes: ${itemsWithImages} de ${menuData.length}`);
          
          // Mostrar información de los primeros 3 elementos con más detalle para depuración
          menuData.slice(0, 3).forEach((item, idx) => {
            console.log(`Item ${idx}: nombre=${item.name}, tiene imagen=${Boolean(item.image)}, id=${item.id}`);
            if (item.image) {
              console.log(`  Longitud de la imagen: ${item.image.length} caracteres`);
              console.log(`  Inicio de la imagen: ${item.image.substring(0, 30)}...`);
            }
          });
          
          this.menuItems = menuData.map(item => ({ 
            ...item, 
            quantity: 0, 
            id: item.id || ('item_' + Math.random().toString(36).substring(2, 10))
          }));
          
          // Verificación final
          const finalItemsWithImages = this.menuItems.filter(item => Boolean(item.image)).length;
          console.log(`Elementos con imágenes después del procesamiento: ${finalItemsWithImages} de ${this.menuItems.length}`);
        } else {
          console.error("Menú no encontrado o vacío:", menuData);
          this.error = "No se encontró el menú solicitado o está vacío";
        }
      } catch (error) {
        console.error('Error al cargar el menú:', error);
        this.error = "Error al cargar el menú: " + (error.message || 'Error desconocido');
      } finally {
        this.loading = false;
      }
    },
    async loadBusinessInfo() {
      try {
        const info = await getBusinessInfo();
        if (info && Object.keys(info).length > 0) {
          this.businessInfo = info;
        } else {
          console.log('No se encontró información de negocio en IndexedDB');
        }
      } catch (error) {
        console.error('Error al cargar información del negocio:', error);
      }
    },
    toggleBusinessInfo() {
      this.showBusinessInfo = !this.showBusinessInfo;
    },
    increaseQuantity(item) {
      item.quantity++;
    },
    decreaseQuantity(item) {
      if (item.quantity > 0) {
        item.quantity--;
      }
    },
    async sendOrder() {
      if (!this.hasItemsInOrder) {
        // Usar alerta regular para mensajes informativos
        alert('Por favor, agrega al menos un producto a tu pedido.');
        return;
      }
      
      // Solicitar confirmación antes de enviar
      const confirmed = await confirm('¿Deseas enviar este pedido por WhatsApp?', {
        title: 'Enviar Pedido',
        confirmText: 'Enviar',
        cancelText: 'Cancelar'
      });
      
      if (!confirmed) return;
      
      // Verificar que formatOrderMessage existe antes de usarla
      if (typeof formatOrderMessage !== 'function') {
        console.error('formatOrderMessage no es una función', formatOrderMessage);
        alert('Error: No se puede procesar el pedido debido a un problema técnico.');
        return;
      }
      
      // Usar el servicio de formateo de mensajes
      const message = formatOrderMessage({
        customer: this.customerInfo,
        businessName: this.businessInfo.name,
        orderItems: this.orderItems,
        total: this.total,
        notes: this.customerInfo.notes
      });
      
      // Enviar pedido por WhatsApp
      let phoneNumber = '';
      if (this.businessInfo.contact) {
        // Limpiar número de teléfono
        phoneNumber = this.businessInfo.contact.replace(/\D/g, '');
      }
      
      const whatsappUrl = phoneNumber 
        ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');
    }
  },
  components: {
    ReservaForm
  }
};
</script>

<style scoped>
.shared-menu-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.business-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.business-logo {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 50%;
  margin-right: 20px;
}

.business-info {
  flex: 1;
}

h1 {
  margin: 0 0 10px 0;
  color: #333;
}

.business-description {
  margin: 0;
  color: #666;
}

.toggle-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 20px;
  transition: background-color 0.3s;
}

.toggle-button:hover {
  background-color: #388E3C;
}

.additional-info {
  background-color: #f8f8f8;
  border-left: 4px solid #4CAF50;
  padding: 15px;
  margin-bottom: 30px;
  border-radius: 4px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

h2 {
  margin-top: 30px;
  margin-bottom: 20px;
  color: #333;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 10px;
}

.menu-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.menu-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.menu-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.item-image-container {
  height: 180px;
  overflow: hidden;
  background-color: #f0f0f0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.menu-item:hover .item-image {
  transform: scale(1.05);
}

.item-image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  color: #999;
  font-style: italic;
  background-color: #f8f8f8;
}

.no-image-icon {
  font-size: 48px;
  margin-bottom: 10px;
  opacity: 0.5;
}

.item-details {
  padding: 15px;
}

.item-details h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #333;
}

.item-description {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.item-price-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-price {
  font-weight: bold;
  color: #4CAF50;
  font-size: 18px;
  margin: 0;
}

.quantity-controls {
  display: flex;
  align-items: center;
}

.quantity-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background-color: #f0f0f0;
  color: #333;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.quantity-btn:hover {
  background-color: #e0e0e0;
}

.quantity {
  margin: 0 10px;
  width: 20px;
  text-align: center;
}

/* Estilos para Tu Pedido (antes Order Summary) */
.order-summary {
  background-color: #f8f8f8;
  border-radius: 8px;
  padding: 20px;
  margin-top: 30px;
}

.order-items {
  margin-bottom: 20px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ddd;
}

.order-item-details {
  display: flex;
  align-items: center;
}

.item-name {
  font-weight: bold;
  margin-right: 10px;
}

.item-quantity {
  color: #666;
}

.item-total {
  font-weight: bold;
  color: #4CAF50;
}

.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #ddd;
  font-weight: bold;
}

.total-price {
  font-size: 20px;
  color: #4CAF50;
}

.empty-order {
  text-align: center;
  color: #666;
  padding: 20px 0;
}

/* Formulario de contacto */
.contact-form {
  margin-top: 30px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.form-group textarea {
  height: 100px;
  resize: vertical;
}

.send-order-button {
  background-color: #25D366;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
  width: 100%;
  margin-top: 10px;
}

.send-order-button:hover {
  background-color: #128C7E;
}

.send-order-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .business-header {
    flex-direction: column;
    text-align: center;
  }
  
  .business-logo {
    margin-right: 0;
    margin-bottom: 15px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .menu-items {
    grid-template-columns: 1fr;
  }
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background-color: #f8f8f8;
  border-radius: 8px;
  margin-bottom: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(76, 175, 80, 0.3);
  border-radius: 50%;
  border-top-color: #4CAF50;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  padding: 20px;
  background-color: #ffebee;
  border-left: 4px solid #f44336;
  border-radius: 4px;
  margin-bottom: 20px;
}

.retry-button {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  font-weight: bold;
}

.retry-button:hover {
  background-color: #d32f2f;
}

.empty-menu {
  padding: 40px;
  text-align: center;
  background-color: #f8f8f8;
  border-radius: 8px;
  margin-bottom: 20px;
  color: #666;
  font-style: italic;
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
