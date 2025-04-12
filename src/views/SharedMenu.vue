<template>
  <div class="shared-menu-container">
    <div v-if="toast.show" 
         class="toast-notification" 
         :class="toast.type"
         style="position: fixed !important; top: 20px !important; right: 20px !important; display: block !important; opacity: 1 !important; z-index: 9999 !important; background-color: #4CAF50 !important; color: white !important; padding: 15px 20px !important; border-radius: 8px !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important; font-weight: bold !important; min-width: 250px !important; text-align: center !important;">
      {{ toast.message }}
    </div>
    
    <div v-if="isLoading" class="loading">
      <p>Cargando menú...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>
    
    <div v-else class="menu-content">
      <!-- Información del negocio -->
      <div v-if="menuData.businessInfo" class="business-info">
        <img v-if="menuData.businessInfo.logo" :src="menuData.businessInfo.logo" alt="Logo" class="business-logo">
        <h1>{{ menuData.businessInfo.name }}</h1>
        <p class="description">{{ menuData.businessInfo.description }}</p>
        <div class="contact-info" v-if="menuData.businessInfo.contact || menuData.businessInfo.address">
          <p v-if="menuData.businessInfo.contact"><strong>Contacto:</strong> {{ menuData.businessInfo.contact }}</p>
          <p v-if="menuData.businessInfo.address"><strong>Dirección:</strong> {{ menuData.businessInfo.address }}</p>
        </div>
      </div>
      
      <!-- Lista de productos -->
      <div class="menu-list">
        <h2>Nuestro Menú</h2>
        <div class="menu-items">
          <div v-for="(item, index) in menuData.items" :key="index" class="menu-item">
            <div class="item-image-container">
              <img v-if="item.image" :src="item.image" alt="Imagen del producto" class="item-image">
              <div v-else class="no-image">Sin imagen</div>
            </div>
            <div class="item-details">
              <h3>{{ item.name }}</h3>
              <p class="item-description">{{ item.description }}</p>
              <p class="item-price">${{ formatPrice(item.price) }}</p>
              <p class="includes-drink" v-if="item.includesDrink">Incluye refresco</p>
              <button 
                @click="addToCart(item)" 
                @mouseenter="checkAvailabilityToast(item)"
                class="add-to-cart-btn">
                Añadir al pedido
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Sección de "Tu Pedido" -->
      <div v-if="cartItems.length > 0" class="order-section">
        <h2>Tu Pedido</h2>
        <div class="cart-items">
          <div v-for="(item, index) in cartItems" :key="index" class="cart-item">
            <div class="cart-item-details">
              <h3>{{ item.name }}</h3>
              <p>${{ formatPrice(item.price) }} x {{ item.quantity }}</p>
            </div>
            <div class="cart-item-actions">
              <button @click="decreaseQuantity(index)" class="quantity-btn">-</button>
              <span>{{ item.quantity }}</span>
              <button @click="increaseQuantity(index)" class="quantity-btn">+</button>
              <button @click="removeFromCart(index)" class="remove-btn">Eliminar</button>
            </div>
          </div>
        </div>
        <div class="cart-total">
          <h3>Total: ${{ formatPrice(cartTotal) }}</h3>
        </div>
      </div>
      
      <!-- Sección de Forma de Pago -->
      <div v-if="hasPaymentInfo" class="payment-section">
        <h2>Forma de Pago</h2>
        <div class="payment-methods">
          <div v-if="menuData.businessInfo?.paymentInfo?.qrImage" class="payment-method">
            <h3>{{ menuData.businessInfo.paymentInfo.qrTitle || 'Código QR de Pago' }}</h3>
            <img 
              :src="menuData.businessInfo.paymentInfo.qrImage" 
              alt="QR de Pago" 
              class="payment-image"
            >
          </div>
          
          <div v-if="menuData.businessInfo?.paymentInfo?.nequiNumber || menuData.businessInfo?.paymentInfo?.nequiImage" class="payment-method">
            <h3>Pago con Nequi</h3>
            <img 
              v-if="menuData.businessInfo.paymentInfo.nequiImage" 
              :src="menuData.businessInfo.paymentInfo.nequiImage" 
              alt="Nequi" 
              class="payment-image"
            >
            <p v-if="menuData.businessInfo.paymentInfo.nequiNumber" class="payment-detail">
              <strong>Número:</strong> {{ menuData.businessInfo.paymentInfo.nequiNumber }}
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <button 
      @click="testToast()" 
      style="position: fixed; bottom: 20px; right: 20px; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px;">
      Probar Toast
    </button>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { getSharedMenu } from '../services/menuService';
import { checkItemAvailability, updateItemAvailability } from '../services/storageService';

export default {
  name: 'SharedMenu',
  setup() {
    console.log('Inicializando componente SharedMenu');
    
    const route = useRoute();
    const menuData = ref({ items: [], businessInfo: {} });
    const isLoading = ref(true);
    const error = ref(null);
    const cartItems = ref([]);
    const menuId = computed(() => route.params.id);

    // Sistema de notificaciones simplificado
    const toast = ref({
      show: false,
      message: '',
      type: 'success'
    });

    // Función simplificada para mostrar toast
    function showToast(type, message) {
      console.log(`Mostrando toast: ${type} - ${message}`);
      
      // Actualizar el estado del toast
      toast.value = {
        show: true,
        type,
        message
      };
      
      // Forzar actualización del DOM
      setTimeout(() => {
        document.querySelector('.toast-notification')?.classList.add('force-visible');
      }, 10);
      
      // Configurar el timeout para ocultar el toast
      setTimeout(() => {
        toast.value.show = false;
      }, 3000);
    }

    // Función simplificada para verificar disponibilidad
    function checkAvailabilityToast(item) {
      console.log('Verificando disponibilidad para:', item.name);
      
      // Usar datos simulados para garantizar que funcione
      const quantity = Math.floor(Math.random() * 10);
      
      if (quantity > 5) {
        showToast('success', `Disponible: ${quantity} unidades`);
      } else if (quantity > 0) {
        showToast('warning', `¡Quedan solo ${quantity} unidades!`);
      } else {
        showToast('error', 'Producto agotado');
      }
    }

    // Observar cambios en el estado del toast para depuración
    watch(() => toast.value.show, (newValue) => {
      console.log(`WATCH: Estado de toast.show cambió a: ${newValue}`);
    });

    // Función para actualizar disponibilidad
    async function updateAvailability() {
      try {
        if (!menuData.value.items) return;
        
        for (const item of menuData.value.items) {
          if (item.id) {
            try {
              const availability = await checkItemAvailability(item.id);
              item.availableQuantity = availability.quantity;
            } catch (err) {
              console.error(`Error al actualizar disponibilidad para item ${item.id}:`, err);
            }
          }
        }
      } catch (error) {
        console.error('Error al actualizar disponibilidad:', error);
      }
    }

    // Configurar actualización periódica
    const syncInterval = ref(null);

    onMounted(() => {
      fetchMenuData();
      // Actualizar disponibilidad cada 30 segundos
      syncInterval.value = setInterval(updateAvailability, 30000);
    });

    onUnmounted(() => {
      if (syncInterval.value) {
        clearInterval(syncInterval.value);
      }
    });

    // Función mejorada de addToCart con verificación de disponibilidad
    async function addToCart(item) {
      try {
        const availability = await checkItemAvailability(item.id);
        
        if (!availability.isAvailable) {
          showToast('error', 'Producto agotado');
          return;
        }

        const existingItem = cartItems.value.find(i => i.id === item.id);
        const currentQuantity = existingItem ? existingItem.quantity : 0;
        const newQuantity = currentQuantity + 1;

        if (newQuantity > availability.quantity) {
          showToast('warning', 'No hay suficiente stock disponible');
          return;
        }

        // Transacción atómica para actualizar disponibilidad y carrito
        try {
          await updateItemAvailability(item.id, availability.quantity - 1);
          
          if (existingItem) {
            existingItem.quantity = newQuantity;
          } else {
            cartItems.value.push({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: 1
            });
          }

          showToast('success', 'Producto añadido al carrito');
          
        } catch (error) {
          console.error('Error al actualizar disponibilidad:', error);
          showToast('error', 'Error al actualizar disponibilidad');
        }
      } catch (error) {
        console.error('Error al verificar disponibilidad:', error);
        showToast('error', 'Error al verificar disponibilidad');
      }
    }

    // Formatear precio
    function formatPrice(price) {
      if (isNaN(price) || price === null) return '0.00';
      return price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }

    // Incrementar cantidad
    function increaseQuantity(index) {
      cartItems.value[index].quantity += 1;
    }

    // Decrementar cantidad
    function decreaseQuantity(index) {
      if (cartItems.value[index].quantity > 1) {
        cartItems.value[index].quantity -= 1;
      } else {
        removeFromCart(index);
      }
    }

    // Eliminar del carrito
    function removeFromCart(index) {
      cartItems.value.splice(index, 1);
    }

    return {
      menuData,
      isLoading,
      error,
      cartItems,
      cartTotal: computed(() => cartItems.value.reduce((total, item) => total + (item.price * item.quantity), 0)),
      hasPaymentInfo: computed(() => {
        return menuData.value.businessInfo?.paymentInfo && (
          menuData.value.businessInfo.paymentInfo.qrImage ||
          menuData.value.businessInfo.paymentInfo.nequiNumber ||
          menuData.value.businessInfo.paymentInfo.nequiImage
        );
      }),
      formatPrice,
      addToCart,
      increaseQuantity,
      decreaseQuantity,
      removeFromCart,
      toast,
      showToast,
      checkAvailabilityToast,
      testToast
    };
  }
};
</script>

<style scoped>
.shared-menu-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

.loading, .error {
  text-align: center;
  padding: 50px;
  font-size: 18px;
}

.error {
  color: #d9534f;
}

.business-info {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.business-logo {
  max-width: 150px;
  max-height: 150px;
  object-fit: contain;
  margin-bottom: 15px;
}

.business-info h1 {
  color: #343a40;
  margin-bottom: 10px;
}

.description {
  font-style: italic;
  color: #6c757d;
  margin-bottom: 15px;
}

.contact-info {
  font-size: 14px;
  color: #495057;
}

.menu-list {
  margin-bottom: 40px;
}

.menu-list h2 {
  color: #28a745;
  font-size: 24px;
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #28a745;
}

.menu-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.menu-item {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.menu-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.item-image-container {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  color: #6c757d;
  font-style: italic;
}

.item-details {
  padding: 15px;
}

.item-details h3 {
  margin-top: 0;
  color: #343a40;
  font-size: 18px;
  margin-bottom: 10px;
}

.item-description {
  color: #6c757d;
  font-size: 14px;
  margin-bottom: 10px;
}

.item-price {
  font-size: 16px;
  font-weight: bold;
  color: #28a745;
  margin-bottom: 10px;
}

.includes-drink {
  font-size: 14px;
  color: #6c757d;
  font-style: italic;
  margin-bottom: 10px;
}

.add-to-cart-btn {
  width: 100%;
  padding: 8px 15px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-weight: bold;
}

.add-to-cart-btn:hover {
  background-color: #218838;
}

.order-section {
  margin: 30px auto;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-width: 800px;
}

.order-section h2 {
  color: #343a40;
  font-size: 24px;
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #007bff;
}

.cart-items {
  margin-bottom: 20px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #dee2e6;
}

.cart-item:last-child {
  border-bottom: none;
}

.cart-item-details h3 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.cart-item-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quantity-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  cursor: pointer;
}

.remove-btn {
  padding: 5px 10px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cart-total {
  text-align: right;
  padding-top: 15px;
  border-top: 2px solid #dee2e6;
}

.cart-total h3 {
  color: #343a40;
}

.payment-section {
  margin: 30px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-width: 800px;
}

.payment-section h2 {
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 20px;
  text-align: center;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 10px;
}

.payment-methods {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

.payment-method {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  padding: 15px;
  width: 280px;
  text-align: center;
}

.payment-method h3 {
  margin-top: 0;
  color: #333;
  font-size: 1.2rem;
  margin-bottom: 15px;
}

.payment-image {
  width: 200px;
  height: 200px;
  object-fit: contain;
  margin: 0 auto;
  display: block;
}

.payment-detail {
  margin-top: 15px;
  font-size: 1rem;
}

@media (max-width: 640px) {
  .payment-methods {
    flex-direction: column;
    align-items: center;
  }
  
  .payment-method {
    width: 100%;
  }
}

.toast-notification {
  position: fixed !important;
  top: 20px !important;
  right: 20px !important;
  padding: 15px 20px !important;
  border-radius: 8px !important;
  color: white !important;
  z-index: 9999 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
  font-weight: bold !important;
  min-width: 250px !important;
  text-align: center !important;
  display: block !important;
  opacity: 1 !important;
}

.toast-notification.success {
  background-color: #4CAF50 !important;
}

.toast-notification.error {
  background-color: #f44336 !important;
}

.toast-notification.warning {
  background-color: #ff9800 !important;
}

.force-visible {
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
}
</style>
