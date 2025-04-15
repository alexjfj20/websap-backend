<template>
  <div class="share-menu-container">
    <h2>Compartir Menú</h2>
    <div class="share-options">
      <button @click="shareByWhatsApp" class="share-button whatsapp">
        <span class="emoji">📱</span> Compartir en WhatsApp
      </button>
      <button @click="copyLink" class="share-button copy-link">
        <span class="emoji">📋</span> Copiar Enlace
      </button>
    </div>

    <!-- Mensaje de copiado -->
    <div v-if="showCopiedMessage" class="copied-message">
      ¡Enlace copiado al portapapeles!
    </div>
    
    <!-- Link compartido -->
    <p v-if="publicMenuUrl" class="shared-link">
      Enlace para compartir: <a :href="publicMenuUrl" target="_blank">{{ publicMenuUrl }}</a>
    </p>

    <!-- SECCIÓN: PLATOS ESPECIALES -->
    <section class="menu-section" v-if="specialMenuItems.length > 0">
      <h3>Platos Especiales</h3>
      <div class="menu-items-horizontal">
        <div v-for="(item, index) in specialMenuItems" :key="'special-'+index" class="menu-item-card">
          <div class="menu-item-image-container">
            <img :src="item.image" alt="Item Image" class="menu-item-image">
          </div>
          <div class="menu-item-details">
            <h4 class="menu-item-title">{{ item.name }}</h4>
            <p class="menu-item-description">{{ item.description }}</p>
            <div class="menu-item-footer">
              <span class="menu-item-price">${{ formatPrice(item.price) }}</span>
              <div class="menu-item-actions">
                <button @click="decreaseQuantity(item)" class="quantity-button">-</button>
                <span class="quantity-display">{{ getItemQuantity(item) }}</span>
                <button @click="increaseQuantity(item)" class="quantity-button">+</button>
                <button @click="addToOrder(item)" class="add-to-order-button">Agregar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECCIÓN: NUESTRO MENÚ -->
    <section class="menu-section">
      <h3>Nuestro Menú</h3>
      <div class="menu-items-horizontal">
        <div v-for="(item, index) in allMenuItems" :key="'all-'+index" class="menu-item-card">
          <div class="menu-item-image-container">
            <img :src="item.image" alt="Item Image" class="menu-item-image">
          </div>
          <div class="menu-item-details">
            <h4 class="menu-item-title">{{ item.name }}</h4>
            <p class="menu-item-description">{{ item.description }}</p>
            <div class="menu-item-footer">
              <span class="menu-item-price">${{ formatPrice(item.price) }}</span>
              <div class="menu-item-actions">
                <button @click="decreaseQuantity(item)" class="quantity-button">-</button>
                <span class="quantity-display">{{ getItemQuantity(item) }}</span>
                <button @click="increaseQuantity(item)" class="quantity-button">+</button>
                <button @click="addToOrder(item)" class="add-to-order-button">Agregar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECCIÓN: TU PEDIDO -->
    <section class="order-section">
      <h3>Tu Pedido</h3>
      <div v-if="orderItems.length > 0" class="order-items">
        <div v-for="(item, index) in orderItems" :key="index" class="order-item">
          <div class="order-item-details">
            <h4>{{ item.name }}</h4>
            <div class="order-item-quantity">
              <button @click="decreaseOrderItem(item)" class="quantity-button">-</button>
              <span>{{ item.quantity }}</span>
              <button @click="increaseOrderItem(item)" class="quantity-button">+</button>
            </div>
          </div>
          <div class="order-item-price">${{ formatPrice(item.price * item.quantity) }}</div>
          <button @click="removeOrderItem(index)" class="remove-button">×</button>
        </div>
        
        <div class="order-total">
          <span>Total:</span>
          <span class="total-price">${{ formatPrice(calculateTotal()) }}</span>
        </div>
      </div>
      <div v-else class="empty-order">
        <p>No has agregado ningún plato a tu pedido.</p>
      </div>
    </section>

    <!-- SECCIÓN: DATOS DE CONTACTO -->
    <section class="contact-form-section">
      <h3>Datos de Contacto</h3>
      <form @submit.prevent="submitOrder" class="contact-form">
        <div class="form-group">
          <label for="contact-name">Nombre completo</label>
          <input type="text" id="contact-name" v-model="contactInfo.name" required placeholder="Tu nombre completo">
        </div>
        <div class="form-group">
          <label for="contact-phone">Teléfono</label>
          <input type="tel" id="contact-phone" v-model="contactInfo.phone" required placeholder="Tu número de teléfono">
        </div>
        <div class="form-group">
          <label for="contact-address">Dirección</label>
          <input type="text" id="contact-address" v-model="contactInfo.address" required placeholder="Tu dirección de entrega">
        </div>
        <div class="form-group">
          <label for="contact-email">Email</label>
          <input type="email" id="contact-email" v-model="contactInfo.email" placeholder="Tu email (opcional)">
        </div>
        <div class="form-group">
          <label for="contact-notes">Notas adicionales</label>
          <textarea id="contact-notes" v-model="contactInfo.notes" placeholder="Instrucciones especiales para tu pedido"></textarea>
        </div>
        <button type="submit" class="submit-order-button" :disabled="orderItems.length === 0">
          Enviar Pedido
        </button>
      </form>
    </section>
  </div>
</template>

<script>
import { getMenuItems, getBusinessInfo } from '../services/storageService';
import { confirm } from '../services/dialogService';

export default {
  name: 'ShareMenuComponent',
  data() {
    return {
      menuItems: [],
      specialMenuItems: [],
      orderItems: [],
      contactInfo: {
        name: '',
        phone: '',
        address: '',
        email: '',
        notes: ''
      },
      businessInfo: {},
      restaurantId: '', // ID o slug del restaurante
      showCopiedMessage: false,
      itemQuantities: {},
    };
  },
  computed: {
    allMenuItems() {
      return this.menuItems.filter(item => !item.isSpecial);
    },
    publicMenuUrl() {
      // Usar la URL de origen actual para generar la URL del menú compartido
      // Esto asegura que funcione tanto en desarrollo como en producción
      const origin = window.location.origin;
      return `${origin}/menu/1`;
    }
  },
  mounted() {
    // Cargar los elementos del menú
    this.loadMenuItems();
    
    // Obtener información del negocio
    this.loadBusinessInfo();
    
    // Obtener el ID o slug del restaurante
    this.getRestaurantId();
  },
  methods: {
    // Compartir menú por WhatsApp de forma simplificada
    shareByWhatsApp() {
      try {
        const message = `¡Hola! Aquí puedes ver nuestro menú digital 📋🍽️:\n${this.publicMenuUrl}\n¡Haz tu pedido por aquí mismo!`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      } catch (error) {
        console.error('Error al compartir por WhatsApp:', error);
        alert('Error al compartir el menú. Por favor, intenta de nuevo.');
      }
    },
    
    // Copiar enlace al portapapeles de forma simplificada
    copyLink() {
      try {
        navigator.clipboard.writeText(this.publicMenuUrl)
          .then(() => {
            this.showCopiedMessage = true;
            setTimeout(() => {
              this.showCopiedMessage = false;
            }, 3000);
          })
          .catch(err => {
            console.error('Error al copiar:', err);
            alert('No se pudo copiar el enlace. Por favor, inténtalo de nuevo.');
          });
      } catch (error) {
        console.error('Error al copiar enlace:', error);
        alert('Error al copiar el enlace. Por favor, intenta de nuevo.');
      }
    },
    
    // Obtener el ID o slug del restaurante
    async getRestaurantId() {
      try {
        console.log('Obteniendo ID del restaurante...');
        
        // Obtener el ID del restaurante del usuario actual
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No hay token de autenticación');
          // Usar un ID predeterminado para pruebas si no hay token
          this.restaurantId = 'restaurante-demo';
          console.log('Usando ID predeterminado:', this.restaurantId);
          return;
        }
        
        // Importar apiService dinámicamente para evitar dependencias circulares
        const apiServiceModule = await import('../services/apiService');
        const apiService = apiServiceModule.default;
        apiService.setToken(token);
        
        console.log('Solicitando información del usuario...');
        const userResponse = await apiService.get('/auth/me');
        console.log('Respuesta del usuario:', userResponse);
        
        if (!userResponse || !userResponse.success || !userResponse.user) {
          console.warn('No se pudo obtener información del usuario');
          this.restaurantId = 'restaurante-demo';
          return;
        }
        
        if (!userResponse.user.restaurante_id) {
          console.warn('El usuario no tiene un restaurante asociado');
          
          // Intentar obtener el primer restaurante disponible
          console.log('Intentando obtener lista de restaurantes...');
          const restaurantesResponse = await apiService.get('/restaurantes');
          console.log('Respuesta de restaurantes:', restaurantesResponse);
          
          if (restaurantesResponse && restaurantesResponse.success && 
              restaurantesResponse.restaurantes && restaurantesResponse.restaurantes.length > 0) {
            this.restaurantId = restaurantesResponse.restaurantes[0].id.toString();
            console.log('Usando primer restaurante disponible:', this.restaurantId);
          } else {
            this.restaurantId = '1'; // ID predeterminado como último recurso
            console.log('Usando ID predeterminado 1');
          }
          return;
        }
        
        this.restaurantId = userResponse.user.restaurante_id.toString();
        console.log('ID del restaurante obtenido:', this.restaurantId);
      } catch (error) {
        console.error('Error al obtener ID del restaurante:', error);
        // En caso de error, usar un ID predeterminado
        this.restaurantId = '1';
        console.log('Usando ID predeterminado 1 debido a error');
      }
    },
    
    // Cargar elementos del menú
    async loadMenuItems() {
      try {
        const items = await getMenuItems();
        if (items && items.length) {
          this.menuItems = items.filter(item => !item.isSpecial);
          this.specialMenuItems = items.filter(item => item.isSpecial);
        }
      } catch (error) {
        console.error('Error al cargar elementos del menú:', error);
      }
    },
    
    // Cargar información del negocio
    async loadBusinessInfo() {
      try {
        const info = await getBusinessInfo();
        if (info) {
          this.businessInfo = info;
        }
      } catch (error) {
        console.error('Error al cargar información del negocio:', error);
      }
    },
    getItemQuantity(item) {
      const orderItem = this.orderItems.find(i => i.name === item.name);
      return orderItem ? orderItem.quantity : 0;
    },
    increaseQuantity(item) {
      const orderItem = this.orderItems.find(i => i.name === item.name);
      if (orderItem) {
        orderItem.quantity++;
      }
    },
    decreaseQuantity(item) {
      const orderItem = this.orderItems.find(i => i.name === item.name);
      if (orderItem && orderItem.quantity > 0) {
        orderItem.quantity--;
        if (orderItem.quantity === 0) {
          this.orderItems = this.orderItems.filter(i => i.name !== item.name);
        }
      }
    },
    addToOrder(item) {
      const existingItem = this.orderItems.find(i => i.name === item.name);
      if (existingItem) {
        existingItem.quantity++;
      } else {
        this.orderItems.push({
          ...item,
          quantity: 1
        });
      }
    },
    increaseOrderItem(item) {
      item.quantity++;
    },
    decreaseOrderItem(item) {
      if (item.quantity > 1) {
        item.quantity--;
      } else {
        this.orderItems = this.orderItems.filter(i => i !== item);
      }
    },
    removeOrderItem(index) {
      this.orderItems.splice(index, 1);
    },
    formatPrice(price) {
      if (isNaN(Number(price))) return '0,00';
      
      const fixed = Number(price).toFixed(2);
      
      const [intPart, decPart] = fixed.split('.');
      
      const formattedIntPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      
      return `${formattedIntPart},${decPart}`;
    },
    calculateTotal() {
      return this.orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    async submitOrder() {
      if (this.orderItems.length === 0) {
        alert('Por favor, agrega al menos un plato a tu pedido.');
        return;
      }
      
      const confirmed = await confirm('¿Deseas enviar este pedido por WhatsApp?', {
        title: 'Enviar Pedido',
        confirmText: 'Enviar',
        cancelText: 'Cancelar'
      });
      
      if (!confirmed) return;
      
      const message = `¡Hola! Aquí tienes mi pedido:\n${this.orderItems.map(item => `${item.name} x${item.quantity}`).join('\n')}\nTotal: ${this.formatPrice(this.calculateTotal())}\n${this.contactInfo.notes}`;
      
      let phoneNumber = '';
      
      if (this.businessInfo.contact) {
        phoneNumber = this.businessInfo.contact.replace(/\D/g, '');
      }
      
      const whatsappUrl = phoneNumber 
        ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');
      
      this.contactInfo = {
        name: '',
        phone: '',
        address: '',
        email: '',
        notes: ''
      };
      this.orderItems = [];
    }
  }
};
</script>

<style scoped>
.share-menu-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h2, h3 {
  color: #333;
  margin-bottom: 20px;
}

h2 {
  font-size: 28px;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 10px;
}

h3 {
  font-size: 22px;
  margin-top: 30px;
}

/* Sección de compartir */
.share-options {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
}

.share-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
}

.share-button.whatsapp {
  background-color: #25D366;
  color: white;
}

.share-button.copy-link {
  background-color: #6c757d;
  color: white;
}

.share-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.emoji {
  font-size: 20px;
  margin-right: 10px;
}

.copied-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #28a745;
  color: white;
  padding: 15px 25px;
  border-radius: 5px;
  z-index: 1000;
  animation: fadeInOut 3s ease;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(20px); }
  15% { opacity: 1; transform: translateY(0); }
  85% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(20px); }
}

.shared-link {
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 5px;
  word-break: break-all;
}

/* Sección de menú con diseño horizontal */
.menu-section {
  margin: 40px 0;
}

.menu-items-horizontal {
  display: flex;
  overflow-x: auto;
  gap: 20px;
  padding: 10px 5px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.menu-item-card {
  min-width: 320px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}

.menu-item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

.menu-item-image-container {
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.menu-item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.menu-item-card:hover .menu-item-image {
  transform: scale(1.05);
}

.menu-item-details {
  padding: 15px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.menu-item-title {
  font-size: 18px;
  margin: 0 0 10px 0;
  color: #333;
}

.menu-item-description {
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
  flex: 1;
}

.menu-item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.menu-item-price {
  font-weight: bold;
  font-size: 18px;
  color: #4CAF50;
}

.menu-item-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}

.quantity-button {
  background-color: #f0f0f0;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.quantity-button:hover {
  background-color: #e0e0e0;
}

.quantity-display {
  padding: 0 10px;
  min-width: 20px;
  text-align: center;
}

.add-to-order-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 5px 10px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-left: 5px;
}

.add-to-order-button:hover {
  background-color: #388E3C;
}

/* Sección de pedido */
.order-section {
  margin: 40px 0;
  padding: 25px;
  background-color: #f9f9f9;
  border-radius: 10px;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.order-item-details {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15px;
}

.order-item-details h4 {
  margin: 0;
  font-size: 16px;
}

.order-item-quantity {
  display: flex;
  align-items: center;
  gap: 10px;
}

.order-item-price {
  font-weight: bold;
  color: #4CAF50;
  margin: 0 15px;
}

.remove-button {
  background: none;
  border: none;
  font-size: 22px;
  color: #dc3545;
  cursor: pointer;
  padding: 0 5px;
}

.empty-order {
  text-align: center;
  padding: 20px;
  color: #666;
}

.order-total {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  font-weight: bold;
}

.total-price {
  color: #4CAF50;
  font-size: 18px;
}

/* Sección de formulario de contacto */
.contact-form-section {
  margin: 40px 0;
}

.contact-form {
  display: grid;
  gap: 20px;
}

@media (min-width: 768px) {
  .contact-form {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .contact-form .form-group:nth-child(4),
  .contact-form .form-group:nth-child(5),
  .contact-form button {
    grid-column: span 2;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-weight: bold;
  color: #333;
}

.form-group input,
.form-group textarea {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.submit-order-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 15px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-order-button:hover {
  background-color: #388E3C;
}

.submit-order-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* Responsive design */
@media (max-width: 768px) {
  .share-options {
    flex-direction: column;
  }
  
  .share-button {
    width: 100%;
  }
  
  .menu-items-horizontal {
    padding-bottom: 15px;
  }
  
  .menu-item-card {
    min-width: 280px;
  }
}
</style>
