<template>
  <div class="shared-menu-container" :id="menuId">
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Cargando menú...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>
    
    <div v-else class="menu-content">
      <!-- Información del negocio -->
      <div v-if="menuData?.businessInfo" class="business-info">
        <img v-if="menuData.businessInfo.logo && isValidImage(menuData.businessInfo.logo)" :src="fixImageFormat(menuData.businessInfo.logo)" alt="Logo" class="business-logo">
        <h1>{{ menuData.businessInfo.name }}</h1>
        <p class="description">{{ menuData.businessInfo.description }}</p>
        <div class="contact-info" v-if="menuData.businessInfo.contact || menuData.businessInfo.address">
          <p v-if="menuData.businessInfo.contact"><strong>Contacto:</strong> {{ menuData.businessInfo.contact }}</p>
          <p v-if="menuData.businessInfo.address"><strong>Dirección:</strong> {{ menuData.businessInfo.address }}</p>
        </div>
      </div>
      
      <!-- Lista de productos -->
      <div>
        <!-- Platos regulares -->
        <div class="menu-list">
          <h2>Nuestro Menú</h2>
          <div class="menu-items">
            <div v-for="(item, index) in regularItems" :key="index" class="menu-item">
              <div class="item-image-container">
                <img v-if="item.image && isValidImage(item.image)" :src="fixImageFormat(item.image)" alt="Imagen del producto" class="item-image">
                <img v-else src="https://via.placeholder.com/150?text=Sin+Imagen" alt="Sin imagen disponible" class="item-image">
              </div>
              <div class="item-details">
                <h3>{{ item.name }}</h3>
                <p class="item-description">{{ item.description }}</p>
                <p class="item-price">${{ formatPrice(item.price) }}</p>
                <p class="includes-drink" v-if="item.includesDrink">Incluye refresco</p>
                <button 
                  @click="addToCart(item)" 
                  class="add-to-cart-btn"
                  :disabled="!item.realAvailability || item.realAvailability <= 0"
                  :class="{ 'disabled-btn': !item.realAvailability || item.realAvailability <= 0 }"
                >
                  <span v-if="!item.realAvailability || item.realAvailability <= 0" class="btn-icon">❌</span>
                  <span v-else class="btn-icon">🛒</span>
                  {{ !item.realAvailability || item.realAvailability <= 0 ? 'No disponible' : 'Añadir al pedido' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Platos especiales (solo se muestra si hay platos especiales) -->
        <div v-if="specialItems.length > 0" class="menu-list special-menu-list">
          <h2>Platos Especiales</h2>
          <div class="menu-items">
            <div v-for="(item, index) in specialItems" :key="index" class="menu-item special-item">
              <div class="item-image-container">
                <img v-if="item.image && isValidImage(item.image)" :src="fixImageFormat(item.image)" alt="Imagen del producto" class="item-image">
                <img v-else src="https://via.placeholder.com/150?text=Sin+Imagen" alt="Sin imagen disponible" class="item-image">
              </div>
              <div class="item-details">
                <h3>{{ item.name }}</h3>
                <p class="item-description">{{ item.description }}</p>
                <p class="item-price">${{ formatPrice(item.price) }}</p>
                <p class="includes-drink" v-if="item.includesDrink">Incluye refresco</p>
                <button 
                  @click="addToCart(item)" 
                  class="add-to-cart-btn special-button"
                  :disabled="!item.realAvailability || item.realAvailability <= 0"
                  :class="{ 'disabled-btn': !item.realAvailability || item.realAvailability <= 0 }"
                >
                  <span v-if="!item.realAvailability || item.realAvailability <= 0" class="btn-icon">❌</span>
                  <span v-else class="btn-icon">🛒</span>
                  {{ !item.realAvailability || item.realAvailability <= 0 ? 'No disponible' : 'Añadir al pedido' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Sección de "Tu Pedido" - Siempre visible aunque vacía -->
        <div class="order-section" ref="orderSection">
          <h2>Tu Pedido</h2>
          
          <div v-if="cartItems.length === 0" class="empty-cart">
            <p>Tu pedido está vacío</p>
            <p class="empty-cart-message">Añade productos del menú para comenzar tu pedido</p>
          </div>
          
          <div v-else class="cart-items">
            <div v-for="(item, index) in cartItems" :key="index" class="cart-item">
              <div class="cart-item-details">
                <h3>{{ item.name }}</h3>
                <p>${{ formatPrice(item.price) }} x {{ item.quantity }}</p>
              </div>
              <div class="cart-item-actions">
                <button @click="decreaseQuantity(index)" class="quantity-btn">-</button>
                <span class="quantity-display">{{ item.quantity }}</span>
                <button @click="increaseQuantity(index)" class="quantity-btn">+</button>
                <button @click="removeFromCart(index)" class="remove-btn">
                  <span class="btn-icon">🗑️</span>
                </button>
              </div>
            </div>
            
            <div class="cart-total">
              <h3>Total: ${{ formatPrice(cartTotal) }}</h3>
              
              <!-- Formulario de datos del cliente -->
              <div class="customer-form">
                <h4>Datos del Cliente</h4>
                <div class="form-row">
                  <input type="text" v-model="customerInfo.name" placeholder="Nombres completos" class="form-input">
                </div>
                <div class="form-row">
                  <input type="tel" v-model="customerInfo.phone" placeholder="Teléfono" class="form-input">
                </div>
                <div class="form-row">
                  <input type="email" v-model="customerInfo.email" placeholder="Correo electrónico" class="form-input">
                </div>
                <div class="form-row">
                  <input type="text" v-model="customerInfo.address" placeholder="Dirección de entrega" class="form-input">
                </div>
                
                <!-- Lista horizontal de métodos de pago -->
                <div class="payment-methods-selection">
                  <h4>Forma de Pago</h4>
                  <div class="payment-options">
                    <label class="payment-option">
                      <input type="radio" v-model="selectedPaymentMethod" value="qr" name="paymentMethod">
                      <span class="payment-option-text">QR</span>
                    </label>
                    <label class="payment-option">
                      <input type="radio" v-model="selectedPaymentMethod" value="nequi" name="paymentMethod">
                      <span class="payment-option-text">Nequi</span>
                    </label>
                    <label class="payment-option">
                      <input type="radio" v-model="selectedPaymentMethod" value="cash" name="paymentMethod">
                      <span class="payment-option-text">Contra entrega</span>
                    </label>
                  </div>
                </div>
                
                <!-- Campo de mensaje adicional -->
                <div class="form-row">
                  <textarea v-model="additionalMessage" placeholder="Mensaje o instrucciones adicionales" class="form-textarea"></textarea>
                </div>
              </div>
              
              <div class="order-actions">
                <button @click="completeOrder" class="complete-order-btn">
                  <span class="btn-icon">📱</span> Enviar por WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Botón flotante para ver pedido (visible cuando hay items y se hace scroll) -->
        <div v-if="cartItems.length > 0" class="floating-cart-button" @click="scrollToOrder">
          <span class="cart-items-count">{{ totalItems }}</span>
          <span>Ver Pedido</span>
        </div>
        
        <!-- Nueva sección: Forma de Pago -->
        <div v-if="hasPaymentInfo" class="payment-section">
          <h2>Forma de Pago</h2>
          <div class="payment-methods">
            <div v-if="menuData?.businessInfo?.paymentInfo?.qrImage" class="payment-method">
              <h3>{{ menuData?.businessInfo?.paymentInfo?.qrTitle || 'Código QR de Pago' }}</h3>
              <img 
                v-if="menuData?.businessInfo?.paymentInfo?.qrImage && isValidImage(menuData?.businessInfo?.paymentInfo?.qrImage)" 
                :src="fixImageFormat(menuData?.businessInfo?.paymentInfo?.qrImage)" 
                alt="QR de Pago" 
                class="payment-image"
              >
            </div>
            
            <div v-if="menuData?.businessInfo?.paymentInfo?.nequiNumber || menuData?.businessInfo?.paymentInfo?.nequiImage" class="payment-method">
              <h3>Pago con Nequi</h3>
              <img 
                v-if="menuData?.businessInfo?.paymentInfo?.nequiImage && isValidImage(menuData?.businessInfo?.paymentInfo?.nequiImage)" 
                :src="fixImageFormat(menuData?.businessInfo?.paymentInfo?.nequiImage)" 
                alt="Nequi" 
                class="payment-image"
              >
              <p v-if="menuData?.businessInfo?.paymentInfo?.nequiNumber" class="payment-detail">
                <strong>Número:</strong> {{ menuData?.businessInfo?.paymentInfo?.nequiNumber }}
              </p>
            </div>
            
            <div v-if="menuData?.businessInfo?.paymentInfo?.bankInfo" class="payment-method">
              <h3>Pago Bancario</h3>
              <p class="payment-detail">
                <strong>Información Bancaria:</strong> {{ menuData?.businessInfo?.paymentInfo?.bankInfo }}
              </p>
            </div>
            
            <div v-if="menuData?.businessInfo?.paymentInfo?.otherPaymentMethods" class="payment-method">
              <h3>Otras Formas de Pago</h3>
              <p class="payment-detail">
                <strong>Métodos Adicionales:</strong> {{ menuData?.businessInfo?.paymentInfo?.otherPaymentMethods }}
              </p>
            </div>
          </div>
        </div>
        
        <!-- Añadir el componente ReservaForm en una sección visible -->
        <div class="reserva-section container mt-5">
          <h3 class="text-center mb-4">¿Quieres hacer una reserva?</h3>
          <ReservaForm />
        </div>
        
        <!-- Sistema de notificaciones toast -->
        <div v-if="toast.visible" 
             class="toast-notification" 
             :class="toast.type">
          {{ toast.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { getSharedMenu } from '../services/menuService';
import { saveReservation } from '../services/reservaService'; // Importamos el servicio de reservas
import { getMenuItems, updateItemAvailability } from '../services/storageService'; // Importar funciones necesarias
import ReservaForm from '../components/reservas/ReservaForm.vue';
import eventBus from '../utils/eventBus';
import { 
  fetchBusinessInfoFromBackend, 
  startBusinessInfoSyncInterval, 
  stopBusinessInfoSyncInterval 
} from '../services/businessInfoService';

export default {
  name: 'SharedMenuView',
  components: {
    ReservaForm,
  },
  props: {
    // Añade id como prop si lo necesitas
    id: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const route = useRoute();
    const menuId = computed(() => props.id || route.params.id);
    const menuData = ref({
      items: [],
      businessInfo: {
        name: 'Restaurante WebSAP',
        description: 'Deliciosa comida para todos los gustos',
        contact: 'info@websap.com',
        address: 'Calle Principal #123',
        logo: null,
        paymentInfo: {
          qrImage: null,
          qrTitle: 'Escanea para pagar',
          nequiNumber: null,
          nequiImage: null,
          bankInfo: 'Banco XYZ - Cuenta 123456789',
          otherPaymentMethods: 'Aceptamos efectivo y tarjetas'
        }
      }
    });
    const isLoading = ref(true);
    const error = ref(null);
    const cartItems = ref([]);
    const orderRef = ref(null);
    const isProcessingOrder = ref(false);
    const lastBusinessInfoUpdate = ref(null);
    
    console.log("SharedMenuView montado, ID del menú:", route.params.id);

    // Sistema de notificaciones toast
    const toast = ref({
      visible: false,
      message: '',
      type: 'success', // 'success', 'warning', 'error'
      timeoutId: null
    });

    // Cargar menú cuando el componente se monte
    onMounted(() => {
      loadMenu();
      
      // Suscribirse al evento de actualización de información del negocio
      eventBus.on('business-info-updated', handleBusinessInfoUpdate);
      
      // Iniciar la sincronización periódica con parámetro true para desactivarla en vista compartida
      startBusinessInfoSyncInterval(true);
    });
    
    // Al desmontar el componente, cancelar suscripciones y detener intervalos
    onUnmounted(() => {
      eventBus.off('business-info-updated', handleBusinessInfoUpdate);
      stopBusinessInfoSyncInterval();
      
      // Limpiar timeout del toast si existe
      if (toast.value.timeoutId) {
        clearTimeout(toast.value.timeoutId);
      }
    });
    
    // Manejar la actualización de información del negocio
    const handleBusinessInfoUpdate = (updatedInfo) => {
      console.log('Nueva información del negocio recibida en SharedMenuView:', updatedInfo);
      
      if (!updatedInfo) return;
      
      // Actualizar la información del negocio en menuData
      menuData.value.businessInfo = {
        ...updatedInfo
      };
      
      lastBusinessInfoUpdate.value = Date.now();
      
      // Mostrar notificación sutil
      showToast('Información del negocio actualizada', 'info');
    };

    // Cargar el menú desde la API
    async function loadMenu() {
      try {
        isLoading.value = true;
        error.value = null; // Resetear error al inicio
        console.log("Cargando menú con ID:", route.params.id);
        
        if (!route.params.id) {
          error.value = 'ID de menú no especificado';
          isLoading.value = false;
          return;
        }
        
        // Intenta cargar desde localStorage primero (por si hay un carrito guardado)
        const savedCart = localStorage.getItem(`cart_${route.params.id}`);
        if (savedCart) {
          try {
            cartItems.value = JSON.parse(savedCart);
            console.log("Carrito recuperado de localStorage:", cartItems.value);
          } catch (e) {
            console.error("Error al parsear carrito de localStorage:", e);
          }
        }
        
        try {
          // Cargar el menú y los items
          const data = await getSharedMenu(route.params.id);
          
          if (data && data.items) {
            // Asignar los items al menuData
            menuData.value.items = data.items;
            
            // Intentar cargar la información del negocio desde el backend
            try {
              const businessInfo = await fetchBusinessInfoFromBackend();
              if (businessInfo) {
                menuData.value.businessInfo = businessInfo;
                lastBusinessInfoUpdate.value = Date.now();
                console.log("Información del negocio cargada del backend:", businessInfo);
              }
            } catch (businessInfoError) {
              console.warn("No se pudo cargar información del negocio desde backend:", businessInfoError);
              // Mantener la información que vino con el menú si existe
              if (data.businessInfo) {
                menuData.value.businessInfo = data.businessInfo;
              }
            }
            
            console.log("Menú cargado con éxito:", menuData.value);
            
            // Inicializar disponibilidad para cada ítem
            menuData.value.items.forEach(item => {
              // Si la disponibilidad es explícitamente 0, mantenerla así
              // Si es undefined o null, usar 0 en lugar de un valor predeterminado de 10
              item.availableQuantity = item.availableQuantity !== undefined ? 
                Number(item.availableQuantity) : 0;
              item.realAvailability = item.availableQuantity;
            });
            
            // Actualizar disponibilidad real considerando el carrito
            updateAvailabilityInMenu();
            
            // Guardar en localStorage como respaldo
            try {
              localStorage.setItem(`menu_${route.params.id}`, JSON.stringify(menuData.value));
            } catch (saveError) {
              console.warn('No se pudo guardar el menú en localStorage:', saveError);
            }
          } else {
            throw new Error('Datos de menú no válidos');
          }
        } catch (apiError) {
          console.error("Error al cargar el menú desde la API:", apiError);
          
          // Intentar recuperar desde localStorage como respaldo
          try {
            const cachedMenu = localStorage.getItem(`menu_${route.params.id}`);
            if (cachedMenu) {
              menuData.value = JSON.parse(cachedMenu);
              console.log("Menú recuperado desde localStorage:", menuData.value);
              
              if (menuData.value && menuData.value.items) {
                // Inicializar disponibilidad para cada ítem
                menuData.value.items.forEach(item => {
                  item.availableQuantity = item.availableQuantity !== undefined ? 
                    Number(item.availableQuantity) : 0;
                  item.realAvailability = item.availableQuantity;
                });
                
                // Actualizar disponibilidad real considerando el carrito
                updateAvailabilityInMenu();
                
                // Mostrar notificación de que se está usando datos en caché
                showToast('Usando datos almacenados localmente. Algunas funciones pueden estar limitadas.', 'warning');
              } else {
                throw new Error('Datos de menú en caché no válidos');
              }
            } else {
              throw new Error('No se encontró el menú en caché');
            }
          } catch (cacheError) {
            console.error("Error al recuperar menú desde caché:", cacheError);
            error.value = 'No se encontró el menú solicitado. Por favor, verifica el enlace o intenta más tarde.';
          }
        }
      } catch (e) {
        console.error("Error general al cargar el menú:", e);
        error.value = e.message || 'Error al cargar el menú';
      } finally {
        isLoading.value = false;
      }
    }

    // Verificar si hay información de pago
    const hasPaymentInfo = computed(() => {
      const paymentInfo = menuData.value?.businessInfo?.paymentInfo;
      
      if (!paymentInfo) return false;
      
      // Verificar si hay al menos un campo de información de pago con datos
      return !!(
        (paymentInfo.qrImage && isValidImage(paymentInfo.qrImage)) || 
        paymentInfo.qrTitle || 
        paymentInfo.nequiNumber || 
        (paymentInfo.nequiImage && isValidImage(paymentInfo.nequiImage)) || 
        paymentInfo.bankInfo || 
        paymentInfo.otherPaymentMethods
      );
    });
    
    // Contador total de items
    const totalItems = computed(() => {
      return cartItems.value.reduce((total, item) => total + item.quantity, 0);
    });

    // Total del carrito
    const cartTotal = computed(() => {
      return cartItems.value.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    });

    // Formatear precio
    function formatPrice(price) {
      if (isNaN(Number(price))) return '0,00';
      
      // Convertir a número y formatear con 2 decimales fijos
      const numero = Number(price).toFixed(2);
      
      // Separar parte entera y decimal
      const [parteEntera, parteDecimal] = numero.split('.');
      
      // Formatear parte entera con puntos como separadores de miles
      const parteEnteraFormateada = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      
      // Unir con coma como separador decimal
      return `${parteEnteraFormateada},${parteDecimal}`;
    }

    // Agregar al carrito con verificación de disponibilidad
    async function addToCart(item) {
      // Verificación directa antes de hacer la comprobación completa
      if (Number(item.availableQuantity) <= 0) {
        showToast(`Lo sentimos, "${item.name}" no está disponible actualmente. Intente más tarde por favor.`, 'error');
        return;
      }
      
      const isAvailable = await checkAvailability(item);
      if (!isAvailable) return;
      
      const existingItem = cartItems.value.find(i => {
        // Asegurar que ambos items tienen ID y compararlos, o comparar por nombre si no hay ID
        if (item.id && i.id) {
          return i.id === item.id;
        }
        return i.name === item.name;
      });
      
      if (existingItem) {
        existingItem.quantity++;
      } else {
        cartItems.value.push({
          id: item.id || Date.now().toString(),
          name: item.name,
          price: item.price,
          quantity: 1,
          availableQuantity: item.availableQuantity || 0 // Usar 0 como valor por defecto
        });
      }
      
      // Guardar carrito en localStorage
      saveCartToLocalStorage();
      
      // Actualizar la disponibilidad en tiempo real
      updateAvailabilityInMenu();
      
      // Mostrar notificación de éxito
      showToast(`${item.name} añadido al carrito`, 'success');
    }
    
    // Mostrar notificaciones toast
    function showToast(message, type = 'success', duration = 5000) { // Aumentar a 5 segundos
      console.log(`[Toast] Mostrando notificación: ${message} (${type})`);
      
      // Si ya hay un toast visible, limpiamos su timeout
      if (toast.value.timeoutId) {
        clearTimeout(toast.value.timeoutId);
      }
      
      // Configurar el nuevo toast
      toast.value.message = message;
      toast.value.type = type;
      toast.value.visible = true;
      
      // Debug: verificar que el estado del toast cambió
      console.log(`[Toast] Estado: visible=${toast.value.visible}, message=${toast.value.message}`);
      
      // Configurar timeout para ocultar después de la duración
      toast.value.timeoutId = setTimeout(() => {
        console.log(`[Toast] Ocultando notificación después de ${duration}ms`);
        toast.value.visible = false;
      }, duration);
    }

    // Guardar carrito en localStorage
    function saveCartToLocalStorage() {
      try {
        localStorage.setItem(`cart_${route.params.id}`, JSON.stringify(cartItems.value));
      } catch (e) {
        console.error("Error al guardar carrito en localStorage:", e);
      }
    }

    // Incrementar cantidad
    function increaseQuantity(index) {
      const item = cartItems.value[index];
      
      // Buscar el ítem en el menú
      const menuItem = menuData.value.items?.find(i => i.id === item.id);
      if (menuItem) {
        // Verificar disponibilidad
        const availableQuantity = menuItem.availableQuantity || 0;
        if (item.quantity >= availableQuantity) {
          showToast(`No hay más unidades disponibles de "${item.name}"`, 'warning');
          return;
        }
      }
      
      // Incrementar cantidad
      item.quantity++;
      
      // Guardar carrito y actualizar disponibilidad
      saveCartToLocalStorage();
      updateAvailabilityInMenu();
    }

    // Reemplazar la función decreaseQuantity (líneas 409-416)
    function decreaseQuantity(index) {
      if (cartItems.value[index].quantity > 1) {
        cartItems.value[index].quantity--;
        saveCartToLocalStorage();
        updateAvailabilityInMenu(); // Actualizar disponibilidad
      } else {
        removeFromCart(index);
      }
    }

    // Reemplazar la función removeFromCart (líneas 419-422)
    function removeFromCart(index) {
      cartItems.value.splice(index, 1);
      saveCartToLocalStorage();
      updateAvailabilityInMenu(); // Actualizar disponibilidad
    }
    
    // Completar pedido con actualización de inventario
    async function completeOrder() {
      try {
        // Validaciones básicas
        if (cartItems.value.length === 0) {
          showToast('No hay ítems en el pedido', 'error');
          return;
        }
        
        if (!customerInfo.value.name || !customerInfo.value.phone) {
          showToast('Por favor complete su nombre y teléfono', 'error');
          return;
        }
      
        // Indicar que está procesando
        isProcessingOrder.value = true;
        
        // Actualizar inventario - Usar el carrito correcto
        await updateInventory();
        
        // Compartir en WhatsApp
        openWhatsAppShare();
        
        showToast('¡Pedido completado! Gracias por tu compra.', 'success');
        
        // Limpiar carrito y datos del cliente después de completar
        setTimeout(() => {
          // Limpiar carrito
          cartItems.value = [];
          
          // Limpiar localStorage
          localStorage.removeItem(`cart_${route.params.id}`);
          
          // Limpiar datos del cliente
          customerInfo.value = {
            name: '',
            phone: '',
            email: '',
            address: ''
          };
          additionalMessage.value = '';
          isProcessingOrder.value = false;
        }, 2000);
      } catch (error) {
        console.error('Error al completar el pedido:', error);
        showToast('Error al procesar el pedido', 'error');
        isProcessingOrder.value = false;
      }
    }
    
    // Compartir pedido por WhatsApp sin actualizar inventario
function shareOrderByWhatsApp() {
  // Validaciones básicas
  if (cartItems.value.length === 0) {
    showToast('No hay ítems en el pedido', 'error');
    return;
  }

  if (!customerInfo.value.name || !customerInfo.value.phone) {
    showToast('Por favor complete su nombre y teléfono', 'error');
    return;
  }

  // Compartir directamente en WhatsApp sin actualizar inventario
  openWhatsAppShare();

  showToast('Pedido compartido por WhatsApp', 'success');
}

function openWhatsAppShare() {
  // Construir mensaje de pedido para WhatsApp
  let whatsappMessage = `🛒 *Pedido de ${customerInfo.value.name}*\n\n`;
  whatsappMessage += `📦 *Productos:*\n`;

  cartItems.value.forEach(item => {
    const subtotal = (item.price * item.quantity).toFixed(2);
    whatsappMessage += `🍽️ ${item.quantity}x ${item.name} = $${formatPrice(subtotal)}\n`;
  });

  whatsappMessage += `\n💵 *Total:* $${formatPrice(cartTotal.value)}\n`;

  if (customerInfo.value.phone) {
    whatsappMessage += `📞 *Teléfono:* ${customerInfo.value.phone}\n`;
  }

  if (customerInfo.value.email) {
    whatsappMessage += `✉️ *Email:* ${customerInfo.value.email}\n`;
  }

  if (customerInfo.value.address) {
    whatsappMessage += `📍 *Dirección:* ${customerInfo.value.address}\n`;
  }

  if (additionalMessage.value) {
    whatsappMessage += `📝 *Notas adicionales:*\n${additionalMessage.value}\n`;
  }

  // Añadir método de pago seleccionado
  const formaPago = selectedPaymentMethod.value === 'qr' ? 'Código QR' :
                    selectedPaymentMethod.value === 'nequi' ? 'Nequi' :
                    'Contra entrega';

  whatsappMessage += `\n💳 *Forma de pago:* ${formaPago}`;

  // Codificar y generar la URL de WhatsApp
  const encodedMessage = encodeURIComponent(whatsappMessage);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;

  // Abrir WhatsApp en una nueva ventana
  window.open(whatsappUrl, '_blank');
}

    // Desplazarse a la sección del pedido
    function scrollToOrder() {
      const orderSection = document.querySelector('.order-section');
      if (orderSection) {
        orderSection.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // Verificar disponibilidad de inventario
    async function checkAvailability(item) {
      // Obtener la disponibilidad base (valor original del inventario)
      // Importante: asegurarse que sea un número
      const baseAvailability = Number(item.availableQuantity) || 0;
      
      // Verificación directa: si no hay stock, mostrar mensaje de error
      if (baseAvailability <= 0) {
        showToast(`Lo sentimos, "${item.name}" no está disponible actualmente. Intente más tarde por favor.`, 'error');
        return false;
      }
      
      // Obtener la cantidad actual en el carrito
      const cartItem = cartItems.value.find(i => i.id === item.id);
      const cartQuantity = cartItem ? cartItem.quantity : 0;
      
      // Calcular disponibilidad real
      const realAvailability = baseAvailability - cartQuantity;
      
      // Verificar la disponibilidad considerando lo que ya está en el carrito
      if (realAvailability <= 0) {
        showToast(`No hay más unidades disponibles de "${item.name}"`, 'warning');
        return false;
      } else if (realAvailability <= 5) {
        showToast(`¡Solo quedan ${realAvailability} unidades de "${item.name}"!`, 'warning');
      }
      
      return true;
    }

    // Actualizar inventario al completar pedido
    async function updateInventory() {
      try {
        // Validaciones iniciales
        if (!cartItems.value || cartItems.value.length === 0) {
          console.warn('Intentando actualizar inventario con carrito vacío');
          return;
        }
        
        console.log(`Iniciando actualización de inventario para ${cartItems.value.length} productos...`);
        
        // Obtener los elementos actuales del menú para actualizar cantidades
        const currentMenu = await getMenuItems();
        if (!currentMenu || !Array.isArray(currentMenu)) {
          console.error('No se pudo obtener el menú actual');
          return false;
        }
        
        // Crear una copia profunda del carrito para procesar (evitar modificaciones durante el procesamiento)
        const itemsToProcess = JSON.parse(JSON.stringify(cartItems.value));
        const updateResults = [];
        let hasErrors = false;
        
        // Importar función para guardar elementos vendidos
        const { getSoldItems, saveSoldItems } = await import('../services/storageService');
        
        // Obtener la lista actual de elementos vendidos
        let soldItemsList = [];
        try {
          soldItemsList = await getSoldItems() || [];
          if (!Array.isArray(soldItemsList)) {
            soldItemsList = [];
          }
          console.log('Lista de elementos vendidos obtenida:', soldItemsList.length);
        } catch (soldItemsError) {
          console.warn('Error al obtener elementos vendidos:', soldItemsError);
          soldItemsList = [];
        }
        
        // Procesar cada elemento del carrito de forma secuencial para evitar condiciones de carrera
        for (let i = 0; i < itemsToProcess.length; i++) {
          const cartItem = itemsToProcess[i];
          console.log(`Procesando item ${i+1}/${itemsToProcess.length}: ${cartItem.name} (ID: ${cartItem.id})`);
          
          try {
            // Buscar el ítem correspondiente en el menú actual
            const menuItem = currentMenu.find(item => item.id === cartItem.id);
            
            if (!menuItem) {
              console.warn(`Elemento no encontrado en el menú: ${cartItem.name} (ID: ${cartItem.id})`);
              updateResults.push({
                name: cartItem.name,
                success: false,
                error: 'Elemento no encontrado en el menú'
              });
              continue;
            }
            
            // Garantizar que estamos trabajando con números enteros válidos
            const currentQuantity = parseInt(Number(menuItem.availableQuantity || 0), 10);
            const soldQuantity = parseInt(Number(cartItem.quantity || 0), 10);
            
            if (isNaN(currentQuantity) || isNaN(soldQuantity)) {
              const error = `Cantidades inválidas para ${cartItem.name}: disponible=${menuItem.availableQuantity}, vendido=${cartItem.quantity}`;
              console.error(error);
              updateResults.push({
                name: cartItem.name,
                success: false,
                error: error
              });
              hasErrors = true;
              continue;
            }
            
            // Calcular nueva cantidad exacta como entero
            const newQuantity = Math.max(0, currentQuantity - soldQuantity);
            
            console.log(`Actualizando ${cartItem.name}: ${currentQuantity} - ${soldQuantity} = ${newQuantity} (currentQuantity tipo: ${typeof currentQuantity}, soldQuantity tipo: ${typeof soldQuantity})`);
            
            // Actualizar disponibilidad usando la función mejorada - forzar como número entero
            const updateSuccess = await updateItemAvailability(menuItem.id, newQuantity);
            
            // Registrar resultado detallado
            updateResults.push({
              name: cartItem.name,
              oldQuantity: currentQuantity,
              soldQuantity: soldQuantity,
              newQuantity: newQuantity,
              success: updateSuccess,
              error: updateSuccess ? null : 'Error al actualizar disponibilidad'
            });
            
            if (!updateSuccess) {
              hasErrors = true;
            } else {
              // Registrar en la lista de platos vendidos si la actualización fue exitosa
              const currentDate = new Date().toISOString();
              const existingSoldItem = soldItemsList.find(item => item.name === cartItem.name);
              
              if (existingSoldItem) {
                existingSoldItem.quantity += soldQuantity;
                existingSoldItem.date = currentDate;
              } else {
                soldItemsList.push({
                  name: cartItem.name,
                  quantity: soldQuantity,
                  price: cartItem.price,
                  includesDrink: menuItem.includesDrink || false,
                  date: currentDate
                });
              }
              console.log(`Elemento registrado en lista de vendidos: ${cartItem.name} x${soldQuantity}`);
            }
          } catch (itemError) {
            console.error(`Error procesando ${cartItem.name}:`, itemError);
            updateResults.push({
              name: cartItem.name,
              success: false,
              error: itemError.message || 'Error desconocido'
            });
            hasErrors = true;
          }
        }
        
        // Guardar la lista actualizada de elementos vendidos
        try {
          await saveSoldItems(soldItemsList);
          console.log(`Lista de elementos vendidos actualizada con ${soldItemsList.length} elementos`);
        } catch (saveError) {
          console.error('Error al guardar elementos vendidos:', saveError);
        }
        
        // Mostrar resumen de la operación
        const successCount = updateResults.filter(r => r.success).length;
        console.log(`Actualización de inventario completada. Éxitos: ${successCount}/${itemsToProcess.length}`);
        
        // Registrar detalles completos de la actualización
        console.log('Detalles de actualización de inventario:', updateResults);
        
        if (hasErrors) {
          const failedItems = updateResults.filter(r => !r.success).map(r => r.name).join(', ');
          console.warn(`Algunos productos no se pudieron actualizar: ${failedItems}`);
        }
        
        return successCount > 0;
      } catch (error) {
        console.error('Error general al actualizar inventario:', error);
        return false;
      }
    }

    // Añadir después de la función checkAvailability (línea 585)
    // Función para actualizar la disponibilidad en tiempo real
    function updateAvailabilityInMenu() {
      if (!menuData.value?.items) return;
      
      // Actualizar la disponibilidad de todos los ítems
      menuData.value.items.forEach(menuItem => {
        // Encontrar si este ítem está en el carrito
        const cartItem = cartItems.value.find(i => i.id === menuItem.id);
        const cartQuantity = cartItem ? cartItem.quantity : 0;
        
        // Asegurarse de que availableQuantity sea un número exacto, no undefined o null
        const baseAvailability = Number(menuItem.availableQuantity) || 0;
        
        // Calcular disponibilidad real
        menuItem.realAvailability = baseAvailability - cartQuantity;
        
        console.log(`Disponibilidad actualizada para ${menuItem.name}: ${menuItem.realAvailability} unidades (base: ${baseAvailability}, carrito: ${cartQuantity})`);
      });
    }

    // Verificar si una cadena de imagen es válida
    function isValidImage(imageString) {
      if (!imageString) return false;
      
      // Verificar si es una URL
      if (imageString.startsWith('http://') || imageString.startsWith('https://')) {
        return true;
      }
      
      // Verificar si es una imagen en base64
      if (imageString.startsWith('data:image/')) {
        return true;
      }
      
      return false;
    }
    
    // Corregir formato de imagen si es necesario
    function fixImageFormat(imageString) {
      if (!imageString) return '';
      
      // Si ya es una URL o base64 válido, devolverlo tal cual
      if (isValidImage(imageString)) {
        return imageString;
      }
      
      // Intentar convertir a base64 si no tiene el prefijo correcto
      if (imageString.includes('/9j/') && !imageString.startsWith('data:image/')) {
        return `data:image/jpeg;base64,${imageString}`;
      }
      
      // Si no se puede arreglar, devolver una imagen por defecto
      return '';
    }

    // Datos del cliente
    const customerInfo = ref({
      name: '',
      phone: '',
      email: '',
      address: ''
    });

    // Método de pago seleccionado
    const selectedPaymentMethod = ref('cash'); // Por defecto contra entrega

    // Mensaje adicional
    const additionalMessage = ref('');

    // Filtrar items regulares y especiales
    const regularItems = computed(() => {
      if (!menuData.value || !menuData.value.items) return [];
      const filtered = menuData.value.items.filter(item => !item.isSpecial);
      console.log('Platos regulares:', filtered.length, filtered.map(i => i.name));
      return filtered;
    });

    const specialItems = computed(() => {
      if (!menuData.value || !menuData.value.items) return [];
      const filtered = menuData.value.items.filter(item => item.isSpecial === true);
      console.log('Platos especiales:', filtered.length, filtered.map(i => i.name));
      return filtered;
    });

    // Estado para el formulario de reserva
    const showReservationForm = ref(false);
    const isProcessingReservation = ref(false);
    const reservationSuccess = ref(false);
    const reservationError = ref(null);
    
    const reservationData = ref({
      fullName: '',
      mobilePhone: '',
      landlinePhone: '',
      address: '',
      email: '',
      orderDate: getCurrentDate(), // Set the initial value here
      reservationDate: '',
      reservationTime: '',
      peopleCount: 1,
      additionalNotes: ''
    });
    
    // Función para obtener la fecha actual en formato YYYY-MM-DD
    function getCurrentDate() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Función para enviar la reserva
    async function submitReservation() {
      isProcessingReservation.value = true;
      reservationSuccess.value = false;
      reservationError.value = null;
      
      try {
        // Utilizamos el servicio de reservas para guardar los datos
        const result = await saveReservation(reservationData.value);
        
        if (result.success) {
          // Reserva guardada correctamente
          reservationSuccess.value = true;
          showToast('¡Reserva enviada con éxito! Recibirá un correo de confirmación en breve.', 'success');
          
          // Enviar correo de confirmación (simulado)
          console.log('Enviando correo de confirmación a:', reservationData.value.email);
          
          // Limpiar el formulario y ocultarlo después de un tiempo
          setTimeout(() => {
            resetReservationForm();
            showReservationForm.value = false;
          }, 3000);
        } else {
          // Error al guardar la reserva
          throw new Error(result.error || 'Error al procesar la reserva');
        }
      } catch (error) {
        console.error('Error al enviar la reserva:', error);
        reservationError.value = 'Ocurrió un error al procesar su reserva. Por favor, intente nuevamente.';
        showToast('Error al procesar la reserva. Por favor, intente nuevamente.', 'error');
      } finally {
        isProcessingReservation.value = false;
      }
    }
    
    // Función para cancelar la reserva
    function cancelReservation() {
      resetReservationForm();
      showReservationForm.value = false;
    }
    
    // Función para reiniciar el formulario
    function resetReservationForm() {
      reservationData.value.fullName = '';
      reservationData.value.mobilePhone = '';
      reservationData.value.landlinePhone = '';
      reservationData.value.address = '';
      reservationData.value.email = '';
      reservationData.value.orderDate = getCurrentDate();
      reservationData.value.reservationDate = '';
      reservationData.value.reservationTime = '';
      reservationData.value.peopleCount = 1;
      reservationData.value.additionalNotes = '';
      reservationSuccess.value = false;
      reservationError.value = null;
    }

    // Refrescar información del negocio manualmente
    async function refreshBusinessInfo() {
      try {
        const businessInfo = await fetchBusinessInfoFromBackend(true);
        if (businessInfo) {
          menuData.value.businessInfo = businessInfo;
          lastBusinessInfoUpdate.value = Date.now();
          showToast('Información del negocio actualizada', 'success');
        }
      } catch (error) {
        console.error('Error al refrescar información del negocio:', error);
        showToast('Error al actualizar información del negocio', 'error');
      }
    }

    return {
      menuId,
      isLoading,
      error,
      menuData,
      regularItems,
      specialItems,
      cartItems,
      cartTotal,
      totalItems,
      customerInfo,
      selectedPaymentMethod,
      additionalMessage,
      addToCart,
      removeFromCart,
      increaseQuantity,
      decreaseQuantity,
      formatPrice,
      completeOrder,
      shareOrderByWhatsApp,
      scrollToOrder,
      isValidImage,
      fixImageFormat,
      hasPaymentInfo,
      // Reservas
      showReservationForm,
      reservationData,
      isProcessingReservation,
      reservationSuccess,
      reservationError,
      submitReservation,
      cancelReservation,
      getCurrentDate,
      // Añadir el objeto toast para que esté disponible en la plantilla
      toast,
      // Función para refrescar información del negocio
      refreshBusinessInfo,
      // Última actualización de la información del negocio
      lastBusinessInfoUpdate
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
  max-width: 100%;
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px 15px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: bold;
}

.add-to-cart-btn:hover {
  background-color: #218838;
  transform: translateY(-2px);
}

.quantity-display {
  min-width: 30px;
  text-align: center;
  font-weight: bold;
}

/* Estilos para acciones de pedido */
.order-actions {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 15px;
  gap: 10px;
}

.complete-order-btn,
.whatsapp-order-btn {
  border: none;
  padding: 12px 20px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 8px;
  height: 48px;
  font-size: 17px;
  width: 100%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.complete-order-btn {
  background-color: #218838;
  color: white;
  margin: 0;
  border: 2px solid #1e7e34;
}

.complete-order-btn:hover {
  background-color: #1e7e34;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.whatsapp-order-btn {
  height: 48px;
  font-size: 17px;
  width: 100%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.complete-order-btn {
  background-color: #218838;
  color: white;
  margin: 0;
  border: 2px solid #1e7e34;
}

.complete-order-btn:hover {
  background-color: #1e7e34;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.whatsapp-order-btn {
  background-color: #128C7E;
  color: white;
  margin: 0;
  border: 2px solid #075E54;
}

.whatsapp-order-btn:hover {
  background-color: #075E54;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.btn-icon {
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

/* Estilos para la sección de "Tu Pedido" */
.order-section {
  margin: 30px auto;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-width: 800px;
  border: 2px solid #28a745;
  position: relative;
}

.order-section::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 10px solid #28a745;
}

.order-section h2 {
  color: #343a40;
  font-size: 24px;
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #28a745;
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
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
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
  border: 1px solid #28a745;
  color: #28a745;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-btn:hover {
  background-color: #28a745;
  color: white;
}

.remove-btn {
  padding: 5px 10px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.remove-btn:hover {
  background-color: #c82333;
}

.cart-total {
  text-align: right;
  padding-top: 15px;
  border-top: 2px solid #28a745;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.cart-total h3 {
  color: #343a40;
  margin: 0;
}

/* Estilos para el formulario de datos del cliente */
.customer-form {
  width: 100%;
  margin-top: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.customer-form h4 {
  color: #343a40;
  margin-top: 0;
  margin-bottom: 15px;
  text-align: center;
  font-size: 16px;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 8px;
}

.form-row {
  margin-bottom: 12px;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus, .form-textarea:focus {
  border-color: #28a745;
  outline: none;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

/* Estilos para las opciones de pago */
.payment-methods-selection {
  width: 100%;
  margin: 15px 0;
}

.payment-methods-selection h4 {
  color: #343a40;
  margin-top: 10px;
  margin-bottom: 15px;
  text-align: center;
  font-size: 16px;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 8px;
}

.payment-options {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.payment-option {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 15px;
  background-color: #f0f0f0;
  border-radius: 4px;
  transition: all 0.2s;
  flex: 1;
  min-width: 100px;
  justify-content: center;
  border: 2px solid transparent;
}

.payment-option:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.payment-option input[type="radio"] {
  margin-right: 8px;
  accent-color: #28a745;
}

.payment-option input[type="radio"]:checked + .payment-option-text {
  font-weight: bold;
  color: #28a745;
}

.payment-option-text {
  font-size: 14px;
  font-weight: 500;
}

/* Estilo para opción seleccionada */
.payment-option input[type="radio"]:checked ~ .payment-option {
  border-color: #28a745;
  background-color: rgba(40, 167, 69, 0.1);
}

/* Botón flotante para ver pedido */
.floating-cart-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #28a745;
  color: white;
  border-radius: 50px;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  cursor: pointer;
  transition: all 0.3s;
  z-index: 98; /* Mantener por debajo del toast (9999) */
  font-weight: bold;
}

/* Sistema de notificaciones toast */
.toast-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 15px 25px;
  border-radius: 4px;
  color: white;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: slideIn 0.3s ease-out forwards;
}

@keyframes slideIn {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.toast-notification.success {
  background-color: #28a745;
}

.toast-notification.error {
  background-color: #dc3545;
}

.toast-notification.info {
  background-color: #17a2b8;
}

.toast-notification.warning {
  background-color: #ffc107;
  color: #212529;
}

/* Estilos para la sección de formas de pago */
.payment-section {
  margin: 30px 0;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.payment-section h2 {
  color: #343a40;
  font-size: 24px;
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #28a745;
}

.payment-methods {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

.payment-method {
  flex: 1;
  min-width: 200px;
  max-width: 300px;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  text-align: center;
}

.payment-method h3 {
  margin-top: 0;
  color: #343a40;
  font-size: 18px;
  margin-bottom: 10px;
}

.payment-image {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  margin: 0 auto;
  display: block;
}

/* Específicamente reducir el tamaño de la imagen de Nequi */
.payment-method img[alt="Nequi"] {
  max-height: 150px;
  width: auto;
}

.payment-detail {
  margin-top: 10px;
  font-size: 14px;
  color: #6c757d;
}
</style>
