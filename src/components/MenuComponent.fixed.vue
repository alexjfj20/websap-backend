<template>
  <!-- ... -->
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { saveMenu } from '../services/menuService';
import { formatShareLinkMessage } from '../utils/messageFormatter';
import SalesChartComponent from './SalesChartComponent.vue';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  getMenuItems, 
  saveMenuItems,
  getBusinessInfo, 
  saveBusinessInfo as saveBusinessInfoToDB,
  getSoldItems, 
  saveSoldItems,
  deleteMenuItemFromDB,
  migrateFromLocalStorage,
  compressImage,
  updateItemAvailability
} from '../services/storageService';
import { confirm, alert } from '../services/dialogService';
import { getCurrentUser, hasRole } from '../services/authService';
import { guardarPlato } from '@/services/indexedDBService';

export default {
  name: 'MenuComponent',
  components: {
    SalesChartComponent
  },
  props: {
    viewOnly: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    // Estado para información del negocio
    const businessInfo = ref({
      name: '',
      description: '',
      contact: '',
      address: '',
      logo: ''
    });
    const showBusinessForm = ref(false);

    // Estado para información de pago
    const paymentInfo = ref({
      qrTitle: '',
      qrImage: '',
      nequiNumber: '',
      nequiImage: ''
    });
    const showPaymentForm = ref(false);

    // Estado para platos del menú
    const newItem = ref({
      name: '',
      description: '',
      price: 0,
      includesDrink: false,
      availableQuantity: 0,
      image: '',
      id: null
    });
    const menuItems = ref([]);
    const showMenuForm = ref(false);
    const isEditing = ref(false);
    const editingIndex = ref(-1);

    // Estado para ventas e inventario
    const soldItems = ref([]);
    const searchTerm = ref('');
    const sortBy = ref('');
    const categoryFilter = ref('');
    const selectedChartType = ref('bar');

    // Estado para compartir
    const shareLink = ref('');
    const showCopiedMessage = ref(false);
    
    // Estado para mostrar progreso de migración
    const migrationStatus = ref({
      inProgress: false,
      completed: false,
      message: ''
    });

    // Estado para errores del gráfico
    const chartError = ref(null);
    
    // Primero, añadir el componente Toast
    const toast = ref({
      show: false,
      message: '',
      type: 'success' // success, error, warning
    });

    // Manejar errores del gráfico
    const handleChartError = (error) => {
      console.error("Error en el gráfico:", error);
      chartError.value = error;
    };

    // Estado para mensajes de notificación
    const notification = ref({
      show: false,
      message: '',
      type: 'success', // 'success', 'error'
      timeout: null
    });

    // Estado para platos especiales
    const newSpecialItem = ref({
      name: '',
      description: '',
      price: 0,
      includesDrink: false,
      availableQuantity: 0,
      image: '',
      id: null
    });
    const specialMenuItems = ref([]);
    const showSpecialMenuForm = ref(false);
    const isEditingSpecial = ref(false);
    const editingSpecialIndex = ref(-1);

    // Cargar datos guardados
    onMounted(async () => {
      try {
        migrationStatus.value.inProgress = true;
        migrationStatus.value.message = 'Cargando datos...';
        
        const hasLocalData = localStorage.getItem('businessInfo') || 
                             localStorage.getItem('menuItems') ||
                             localStorage.getItem('soldItems');
          
        if (hasLocalData) {
          migrationStatus.value.message = 'Migrando datos desde localStorage a IndexedDB...';
          
          const migrationResult = await migrateFromLocalStorage();
          
          if (migrationResult) {
            migrationStatus.value.completed = true;
            migrationStatus.value.message = 'Migración completada exitosamente';
            localStorage.removeItem('businessInfo');
            localStorage.removeItem('menuItems');
            localStorage.removeItem('soldItems');
          } else {
            migrationStatus.value.message = 'Error en la migración de datos';
          }
        }

        const dbBusinessInfo = await getBusinessInfo();
        if (dbBusinessInfo && dbBusinessInfo.name) {
          businessInfo.value = dbBusinessInfo;
        }

        const dbMenuItems = await getMenuItems();
        if (dbMenuItems && dbMenuItems.length > 0) {
          // Separar los platos regulares de los especiales
          const regularItems = dbMenuItems.filter(item => !item.isSpecial);
          const specialItems = dbMenuItems.filter(item => item.isSpecial === true);
          
          menuItems.value = regularItems;
          
          if (specialItems.length > 0) {
            specialMenuItems.value = specialItems;
          }
        }

        const dbSoldItems = await getSoldItems();
        if (dbSoldItems && dbSoldItems.length > 0) {
          soldItems.value = dbSoldItems;
        }
        
        setTimeout(() => {
          migrationStatus.value.inProgress = false;
        }, 1500);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        migrationStatus.value.message = 'Error al cargar datos: ' + error.message;
        setTimeout(() => {
          migrationStatus.value.inProgress = false;
        }, 3000);
      }
    });

    // Métodos para información del negocio
    const toggleBusinessForm = () => {
      showBusinessForm.value = !showBusinessForm.value;
    };

    const onLogoChange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const compressedLogo = await compressImage(e.target.result);
          businessInfo.value.logo = compressedLogo;
        };
        reader.readAsDataURL(file);
      }
    };

    const saveBusinessInfo = async () => {
      try {
        if (notification.value.timeout) {
          clearTimeout(notification.value.timeout);
        }
        
        await saveBusinessInfoToDB(businessInfo.value);
        
        notification.value = {
          show: true,
          message: 'Información del negocio guardada con éxito!',
          type: 'success',
          timeout: setTimeout(() => {
            notification.value.show = false;
          }, 3000)
        };
      } catch (error) {
        console.error('Error al guardar información del negocio:', error);
        
        notification.value = {
          show: true,
          message: 'Error al guardar la información. Por favor, intenta nuevamente.',
          type: 'error',
          timeout: setTimeout(() => {
            notification.value.show = false;
          }, 3000)
        };
      }
    };

    const clearBusinessForm = async () => {
      const confirmed = await confirm('¿Estás seguro de querer limpiar el formulario?');
      if (confirmed) {
        businessInfo.value = {
          name: '',
          description: '',
          contact: '',
          address: '',
          logo: ''
        };
      }
    };

    // Métodos para información de pago
    const togglePaymentForm = () => {
      showPaymentForm.value = !showPaymentForm.value;
    };

    const onQRImageChange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const compressedImage = await compressImage(e.target.result);
          paymentInfo.value.qrImage = compressedImage;
        };
        reader.readAsDataURL(file);
      }
    };

    const onNequiImageChange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const compressedImage = await compressImage(e.target.result);
          paymentInfo.value.nequiImage = compressedImage;
        };
        reader.readAsDataURL(file);
      }
    };

    const savePaymentInfo = async () => {
      try {
        if (notification.value.timeout) {
          clearTimeout(notification.value.timeout);
        }
        
        if (!businessInfo.value.paymentInfo) {
          businessInfo.value.paymentInfo = {};
        }
        
        businessInfo.value.paymentInfo.qrTitle = paymentInfo.value.qrTitle;
        businessInfo.value.paymentInfo.qrImage = paymentInfo.value.qrImage;
        businessInfo.value.paymentInfo.nequiNumber = paymentInfo.value.nequiNumber;
        businessInfo.value.paymentInfo.nequiImage = paymentInfo.value.nequiImage;
        
        await saveBusinessInfoToDB(businessInfo.value);
        
        // Sincronizar con el backend
        try {
          // Importar dinámicamente para evitar dependencias circulares
          const { syncBusinessInfoWithBackend } = await import('../services/menuService');
          await syncBusinessInfoWithBackend(businessInfo.value);
          console.log('Información de pago sincronizada con el backend');
        } catch (syncError) {
          console.error('Error al sincronizar con el backend:', syncError);
          // No mostrar error al usuario, solo registrar en consola
        }
        
        notification.value = {
          show: true,
          message: 'Información de pago guardada con éxito!',
          type: 'success',
          timeout: setTimeout(() => {
            notification.value.show = false;
          }, 3000)
        };
      } catch (error) {
        console.error('Error al guardar información de pago:', error);
        
        notification.value = {
          show: true,
          message: 'Error al guardar la información de pago. Por favor, intenta nuevamente.',
          type: 'error',
          timeout: setTimeout(() => {
            notification.value.show = false;
          }, 3000)
        };
      }
    };

    const clearPaymentForm = async () => {
      const confirmed = await confirm('¿Estás seguro de querer limpiar la información de pago?');
      if (confirmed) {
        paymentInfo.value = {
          qrTitle: '',
          qrImage: '',
          nequiNumber: '',
          nequiImage: ''
        };
      }
    };

    // Métodos para platos del menú
    const toggleMenuForm = () => {
      showMenuForm.value = !showMenuForm.value;
      if (!showMenuForm.value) {
        clearMenuForm();
      }
    };

    const onImageChange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const compressedImage = await compressImage(e.target.result);
          newItem.value.image = compressedImage;
        };
        reader.readAsDataURL(file);
      }
    };

    const saveMenuItem = async () => {
      try {
        // Validaciones iniciales
        if (!newItem.value.name || !newItem.value.price) {
          showNotification('El nombre y el precio son obligatorios', 'error');
          return;
        }

        if (newItem.value.availableQuantity < 0) {
          showNotification('La cantidad disponible no puede ser negativa', 'error');
          return;
        }

        // Generar ID si no existe
        if (!newItem.value.id) {
          newItem.value.id = Date.now() + Math.random().toString(36).substring(2, 10);
        }

        try {
          console.log('📝 Datos del plato antes de guardar:', newItem.value);
          
          // Guardar en la base de datos
          const savedPlato = await guardarPlato(newItem.value);
          console.log('✅ Plato guardado correctamente:', savedPlato);
          
          if (isEditing.value) {
            // Actualizar el plato existente en la lista
            const index = menuItems.value.findIndex(item => item.id === savedPlato.id);
            if (index !== -1) {
              menuItems.value[index] = { ...savedPlato };
              showNotification('Plato actualizado exitosamente', 'success');
            }
          } else {
            // Agregar el nuevo plato a la lista
            menuItems.value.push({ ...savedPlato });
            showNotification('Plato creado exitosamente', 'success');
          }

          // Guardar la lista completa
          await saveMenuItems(menuItems.value);
          
          // Limpiar el formulario
          clearMenuForm();
          
        } catch (error) {
          console.error('❌ Error al guardar en la base de datos:', error);
          showNotification(`Error al guardar el plato: ${error.message || 'Intente nuevamente'}`, 'error');
        }
      } catch (error) {
        console.error('❌ Error general en saveMenuItem:', error);
        showNotification(`Error inesperado: ${error.message || 'Intente nuevamente'}`, 'error');
      }
    };

    const clearMenuForm = () => {
      newItem.value = {
        name: '',
        description: '',
        price: 0,
        includesDrink: false,
        availableQuantity: 0,
        image: '',
        id: null
      };
      isEditing.value = false;
      editingIndex.value = -1;
    };

    const editMenuItem = (index) => {
      newItem.value = { ...menuItems.value[index] };
      isEditing.value = true;
      editingIndex.value = index;
      showMenuForm.value = true;
    };

    const deleteMenuItem = async (index) => {
      try {
        const item = menuItems.value[index];
        
        if (!item) {
          console.error('Error: Elemento del menú no encontrado en el índice', index);
          await alert('Error: No se encontró el elemento a eliminar');
          return;
        }
        
        // Confirmar eliminación
        if (!confirm(`¿Estás seguro de que deseas eliminar "${item.name || 'este plato'}" del menú?`)) {
          return;
        }
        
        // Eliminar del backend MySQL directamente
        try {
          console.log(`Eliminando plato con ID: ${item.id} del servidor MySQL`);
          const response = await fetch(`http://localhost:3000/direct-delete?id=${encodeURIComponent(item.id)}`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          
          const result = await response.json();
          console.log('Resultado de la eliminación directa:', result);
          
          if (!result.success) {
            console.error('Error al eliminar plato del servidor:', result.message);
            alert(`Error al eliminar plato: ${result.message}`);
          }
        } catch (serverError) {
          console.error('Error al comunicarse con el servidor:', serverError);
        }
        
        // Eliminar de IndexedDB
        if (item.id) {
          try {
            console.log(`Llamando a deleteMenuItemFromDB para ID: ${item.id}`);
            const deleteResult = await deleteMenuItemFromDB(item.id);
            console.log(`Resultado de la eliminación de IndexedDB: ${deleteResult}`);
          } catch (deleteError) {
            console.error('Error al eliminar item del almacén local:', deleteError);
          }
        }
        
        // Eliminar de la lista local
        menuItems.value.splice(index, 1);
        
        // Mostrar notificación de éxito
        showNotification('Plato eliminado correctamente', 'success');
        
      } catch (error) {
        console.error('Error al eliminar elemento del menú:', error);
        showNotification('Error al eliminar el plato', 'error');
      }
    };

    const sellMenuItem = async (index) => {
      try {
        const item = menuItems.value[index];
        
        // Validar disponibilidad
        if (!item.availableQuantity || item.availableQuantity <= 0) {
          showNotification('Este plato está agotado', 'error');
          return;
        }

        const confirmed = await confirm(
          `¿Desea vender una unidad de "${item.name}"?\nDisponibles: ${item.availableQuantity}`
        );

        if (confirmed) {
          try {
            const newQuantity = item.availableQuantity - 1;
            
            // Actualizar en la base de datos
            await updateItemAvailability(item.id, newQuantity);
            
            // Actualizar en el estado local
            item.availableQuantity = newQuantity;
            
            // Registrar la venta
            const currentDate = new Date().toISOString();
            const soldItem = soldItems.value.find(sold => sold.name === item.name);
            
            if (soldItem) {
              soldItem.quantity += 1;
              soldItem.date = currentDate;
            } else {
              soldItems.value.push({
                name: item.name,
                quantity: 1,
                price: item.price,
                includesDrink: item.includesDrink,
                date: currentDate
              });
            }
            
            // Guardar items vendidos
            await saveSoldItems(soldItems.value);
            
            showNotification(`Se ha vendido una unidad de ${item.name}`, 'success');
            
            if (newQuantity <= 5) {
              showNotification(`¡Atención! Quedan solo ${newQuantity} unidades de ${item.name}`, 'warning');
            }
          } catch (error) {
            console.error('Error al procesar la venta:', error);
            showNotification('Error al procesar la venta. Por favor, intente nuevamente.', 'error');
          }
        }
      } catch (error) {
        console.error('Error al procesar la venta:', error);
        showNotification('Error al procesar la venta. Por favor, intente nuevamente.', 'error');
      }
    };

    // Métodos para platos especiales
    const toggleSpecialMenuForm = () => {
      showSpecialMenuForm.value = !showSpecialMenuForm.value;
      if (!showSpecialMenuForm.value) {
        clearSpecialMenuForm();
      }
    };

    const onSpecialImageChange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const compressedImage = await compressImage(e.target.result);
          newSpecialItem.value.image = compressedImage;
        };
        reader.readAsDataURL(file);
      }
    };

    const saveSpecialMenuItem = async () => {
      try {
        if (!newSpecialItem.value.name || !newSpecialItem.value.price) {
          showNotification('El nombre y el precio son obligatorios', 'error');
          return;
        }
        
        if (!newSpecialItem.value.id) {
          newSpecialItem.value.id = Date.now() + Math.random().toString(36).substring(2, 10);
        }
        
        // Marcar como plato especial
        newSpecialItem.value.isSpecial = true;
        
        try {
          console.log('📝 Datos del plato especial antes de guardar:', newSpecialItem.value);
          
          // Guardar en la base de datos
          const savedPlato = await guardarPlato(newSpecialItem.value);
          console.log('✅ Plato especial guardado correctamente:', savedPlato);
          
          if (isEditingSpecial.value) {
            // Actualizar el plato existente en la lista
            const index = specialMenuItems.value.findIndex(item => item.id === savedPlato.id);
            if (index !== -1) {
              specialMenuItems.value[index] = { ...savedPlato };
              showNotification('Plato especial actualizado exitosamente', 'success');
            }
            isEditingSpecial.value = false;
            editingSpecialIndex.value = -1;
          } else {
            const existingItem = specialMenuItems.value.find(item => 
              item.name.toLowerCase() === savedPlato.name.toLowerCase()
            );
            
            if (existingItem) {
              const confirmed = await confirm(
                `Ya existe un plato especial llamado "${savedPlato.name}". ¿Desea actualizarlo?`,
                { title: 'Actualizar plato especial existente' }
              );
              
              if (confirmed) {
                const index = specialMenuItems.value.findIndex(item => item.id === existingItem.id);
                if (index !== -1) {
                  // Conservar el ID original pero actualizar los demás datos
                  const updatedPlato = {
                    ...savedPlato,
                    id: existingItem.id
                  };
                  
                  // Actualizar en la base de datos
                  await guardarPlato(updatedPlato);
                  
                  // Actualizar en la lista local
                  specialMenuItems.value[index] = { ...updatedPlato };
                  showNotification('Plato especial actualizado exitosamente', 'success');
                }
              } else {
                return;
              }
            } else {
              // Agregar el nuevo plato a la lista
              specialMenuItems.value.push({ ...savedPlato });
              showNotification('Plato especial creado exitosamente', 'success');
            }
          }
          
          // Guardar todos los elementos
          await saveMenuItems([...menuItems.value, ...specialMenuItems.value]);
          
          // Limpiar el formulario
          clearSpecialMenuForm();
        } catch (error) {
          console.error('❌ Error al guardar plato especial:', error);
          showNotification(`Error al guardar el plato especial: ${error.message || 'Intente nuevamente'}`, 'error');
        }
      } catch (error) {
        console.error('❌ Error general en saveSpecialMenuItem:', error);
        showNotification(`Error inesperado: ${error.message || 'Intente nuevamente'}`, 'error');
      }
    };

    const clearSpecialMenuForm = () => {
      newSpecialItem.value = {
        name: '',
        description: '',
        price: 0,
        includesDrink: false,
        availableQuantity: 0,
        image: '',
        id: null
      };
      isEditingSpecial.value = false;
      editingSpecialIndex.value = -1;
    };

    const editSpecialMenuItem = (index) => {
      newSpecialItem.value = { ...specialMenuItems.value[index] };
      isEditingSpecial.value = true;
      editingSpecialIndex.value = index;
      showSpecialMenuForm.value = true;
    };

    const deleteSpecialMenuItem = async (index) => {
      try {
        const item = specialMenuItems.value[index];
        
        if (!item) {
          console.error('Error: Elemento del menú especial no encontrado en el índice', index);
          await alert('Error: No se encontró el elemento a eliminar');
          return;
        }
        
        // Confirmar eliminación
        if (!confirm(`¿Estás seguro de que deseas eliminar "${item.name || 'este plato'}" del menú especial?`)) {
          return;
        }
        
        // Eliminar del backend MySQL directamente
        try {
          console.log(`Eliminando plato con ID: ${item.id} del servidor MySQL`);
          const response = await fetch(`http://localhost:3000/direct-delete?id=${encodeURIComponent(item.id)}`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          
          const result = await response.json();
          console.log('Resultado de la eliminación directa:', result);
          
          if (!result.success) {
            console.error('Error al eliminar plato del servidor:', result.message);
            alert(`Error al eliminar plato: ${result.message}`);
          }
        } catch (serverError) {
          console.error('Error al comunicarse con el servidor:', serverError);
        }
        
        // Eliminar de IndexedDB
        if (item.id) {
          try {
            console.log(`Llamando a deleteMenuItemFromDB para ID: ${item.id}`);
            const deleteResult = await deleteMenuItemFromDB(item.id);
            console.log(`Resultado de la eliminación de IndexedDB: ${deleteResult}`);
          } catch (deleteError) {
            console.error('Error al eliminar item del almacén local:', deleteError);
          }
        }
        
        // Eliminar de la lista local
        specialMenuItems.value.splice(index, 1);
        
        // Mostrar notificación de éxito
        showNotification('Plato eliminado correctamente', 'success');
        
      } catch (error) {
        console.error('Error al eliminar elemento del menú especial:', error);
        showNotification('Error al eliminar el plato', 'error');
      }
    };

    const sellSpecialMenuItem = async (index) => {
      try {
        const item = specialMenuItems.value[index];
        
        // Validar disponibilidad
        if (!item.availableQuantity || item.availableQuantity <= 0) {
          showNotification('Este plato especial está agotado', 'error');
          return;
        }

        const confirmed = await confirm(
          `¿Desea vender una unidad de "${item.name}"?\nDisponibles: ${item.availableQuantity}`
        );

        if (confirmed) {
          try {
            const newQuantity = item.availableQuantity - 1;
            
            // Actualizar en la base de datos
            await updateItemAvailability(item.id, newQuantity);
            
            // Actualizar en el estado local
            item.availableQuantity = newQuantity;
            
            // Registrar la venta
            const currentDate = new Date().toISOString();
            const soldItem = soldItems.value.find(sold => sold.name === item.name);
            
            if (soldItem) {
              soldItem.quantity += 1;
              soldItem.date = currentDate;
            } else {
              soldItems.value.push({
                name: item.name,
                quantity: 1,
                price: item.price,
                includesDrink: item.includesDrink,
                date: currentDate
              });
            }
            
            // Guardar items vendidos
            await saveSoldItems(soldItems.value);
            
            showNotification(`Se ha vendido una unidad de ${item.name}`, 'success');
            
            if (newQuantity <= 5) {
              showNotification(`¡Atención! Quedan solo ${newQuantity} unidades de ${item.name}`, 'warning');
            }
          } catch (error) {
            console.error('Error al procesar la venta:', error);
            showNotification('Error al procesar la venta. Por favor, intente nuevamente.', 'error');
          }
        }
      } catch (error) {
        console.error('Error al procesar la venta:', error);
        showNotification('Error al procesar la venta. Por favor, intente nuevamente.', 'error');
      }
    };

    // Métodos para compartir
    const shareByWhatsApp = async () => {
      try {
        await alert('Procesando imágenes para compartir...');
        
        const totalItems = menuItems.value.length + specialMenuItems.value.length;
        if (totalItems > 30) {
          await alert('El menú tiene demasiados elementos. Por favor, seleccione menos platos para compartir.');
          return;
        }
        
        // Combinar platos regulares y especiales
        const itemsToShare = [
          ...menuItems.value.map(item => ({
            ...item,
            isSpecial: false
          })),
          ...specialMenuItems.value.map(item => ({
            ...item,
            isSpecial: true
          }))
        ];
        
        console.log(`Preparando para compartir ${itemsToShare.length} elementos...`);
        console.log('Items regulares:', menuItems.value.length);
        console.log('Items especiales:', specialMenuItems.value.length);
        
        const menuId = await saveMenu(itemsToShare);
        const url = `${window.location.origin}/menu/${menuId}`;
        shareLink.value = url;
        
        const message = formatShareLinkMessage(url, businessInfo.value.name);
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      } catch (error) {
        console.error('Error al compartir por WhatsApp:', error);
        await alert(`Error al compartir el menú: ${error.message || 'Error desconocido'}. Por favor, intenta reducir el tamaño de las imágenes o eliminar algunos ítems.`);
      }
    };

    const copyLink = async () => {
      try {
        const loadingMessage = 'Procesando imágenes para compartir...';
        showCopiedMessage.value = true;
        
        const totalItems = menuItems.value.length + specialMenuItems.value.length;
        if (totalItems > 30) {
          await alert('El menú tiene demasiados elementos. Por favor, seleccione menos platos para compartir.');
          showCopiedMessage.value = false;
          return;
        }
        
        // Combinar platos regulares y especiales
        const itemsToShare = [
          ...menuItems.value.map(item => ({
            ...item,
            isSpecial: false
          })),
          ...specialMenuItems.value.map(item => ({
            ...item,
            isSpecial: true
          }))
        ];
        
        const menuId = await saveMenu(itemsToShare);
        const url = `${window.location.origin}/menu/${menuId}`;
        shareLink.value = url;
        
        try {
          await navigator.clipboard.writeText(url);
          showCopiedMessage.value = true;
          setTimeout(() => {
            showCopiedMessage.value = false;
          }, 3000);
        } catch (clipboardError) {
          console.error('Error al copiar al portapapeles:', clipboardError);
          await alert('No se pudo copiar automáticamente. Por favor, copia manualmente este enlace: ' + url);
        }
      } catch (error) {
        console.error('Error al generar enlace para compartir:', error);
        showCopiedMessage.value = false;
        await alert(`Error al generar el enlace: ${error.message || 'Error desconocido'}. Por favor, intenta reducir el tamaño de las imágenes o eliminar algunos ítems.`);
      }
    };

    // Computados
    const totalSales = computed(() => {
      return soldItems.value.reduce((total, item) => {
        return total + (item.quantity * item.price);
      }, 0);
    });

    const formatPrice = (price) => {
      if (isNaN(Number(price))) return '0,00';
      const fixed = Number(price).toFixed(2);
      const [intPart, decPart] = fixed.split('.');
      const formattedIntPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return `${formattedIntPart},${decPart}`;
    };
    
    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };

    const filteredSoldItems = computed(() => {
      let items = soldItems.value;
      if (!Array.isArray(items)) {
        console.warn('soldItems no es un array. Devolviendo array vacío.');
        return [];
      }
      if (searchTerm.value) {
        const term = searchTerm.value.toLowerCase().trim();
        
        if (Array.isArray(items)) {
          return items.filter(item => {
            if (item && typeof item === 'object') {
              const name = String(item.name || '').toLowerCase();
              return name.includes(term);
            }
            return false;
          });
        } else {
          console.warn('filterInventoryItems recibió un valor no array:', items);
          return [];
        }
      }
      if (categoryFilter.value) {
        if (categoryFilter.value === 'drinks') {
          items = items.filter(item => Boolean(item && item.includesDrink));
        } else if (categoryFilter.value === 'nodrinks') {
          items = items.filter(item => item && item.includesDrink === false);
        }
      }
      if (sortBy.value) {
        items = [...items];
        switch (sortBy.value) {
          case 'name':
            items.sort((a, b) => {
              if (!a || !a.name) return 1;
              if (!b || !b.name) return -1;
              return a.name.localeCompare(b.name);
            });
            break;
          case 'quantity-desc':
            items.sort((a, b) => {
              const qtyA = (a && typeof a.quantity === 'number') ? a.quantity : 0;
              const qtyB = (b && typeof b.quantity === 'number') ? b.quantity : 0;
              return qtyB - qtyA;
            });
            break;
          case 'quantity-asc':
            items.sort((a, b) => {
              const qtyA = (a && typeof a.quantity === 'number') ? a.quantity : 0;
              const qtyB = (b && typeof b.quantity === 'number') ? b.quantity : 0;
              return qtyA - qtyB;
            });
            break;
          case 'price-desc':
            items.sort((a, b) => {
              const priceA = (a && typeof a.price === 'number') ? a.price : 0;
              const priceB = (b && typeof b.price === 'number') ? b.price : 0;
              return priceB - priceA;
            });
            break;
          case 'price-asc':
            items.sort((a, b) => {
              const priceA = (a && typeof a.price === 'number') ? a.price : 0;
              const priceB = (b && typeof b.price === 'number') ? b.price : 0;
              return priceA - priceB;
            });
            break;
          case 'date-desc':
            items.sort((a, b) => {
              const dateA = a && a.date ? new Date(a.date) : new Date(0);
              const dateB = b && b.date ? new Date(b.date) : new Date(0);
              return dateB - dateA;
            });
            break;
          case 'date-asc':
            items.sort((a, b) => {
              const dateA = a && a.date ? new Date(a.date) : new Date(0);
              const dateB = b && b.date ? new Date(b.date) : new Date(0);
              return dateA - dateB;
            });
            break;
          default:
            break;
        }
      }
      return items;
    });

    const exportToExcel = () => {
      // Crear un array con los datos a exportar
      const data = [
        ['Nombre del Plato', 'Categoría', 'Cantidad Vendida', 'Precio por Unidad', 'Fecha de Venta', 'Subtotal'],
        ...filteredSoldItems.value.map(item => [
          item.name,
          item.includesDrink ? 'Con refresco' : 'Sin refresco',
          item.quantity,
          `$${formatPrice(item.price)}`,
          formatDate(item.date),
          `$${formatPrice(item.quantity * item.price)}`
        ]),
        ['', '', '', '', 'Total', `$${formatPrice(totalSales.value)}`]
      ];

      // Crear un libro de Excel y una hoja de cálculo
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ventas');

      // Generar el archivo Excel y descargarlo
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `ventas_${new Date().toLocaleDateString()}.xlsx`);
    };

    const exportToPDF = () => {
      // Crear un nuevo documento PDF
      const doc = new jsPDF();
      
      // Añadir título
      doc.setFontSize(18);
      doc.text('Reporte de Ventas', 14, 22);
      doc.setFontSize(11);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 32);

      // Crear la tabla con los datos
      const tableData = filteredSoldItems.value.map(item => [
        item.name,
        item.includesDrink ? 'Con refresco' : 'Sin refresco',
        item.quantity,
        `$${formatPrice(item.price)}`,
        formatDate(item.date),
        `$${formatPrice(item.quantity * item.price)}`
      ]);

      // Añadir la tabla
      doc.autoTable({
        head: [['Nombre del Plato', 'Categoría', 'Cantidad Vendida', 'Precio por Unidad', 'Fecha de Venta', 'Subtotal']],
        body: tableData,
        foot: [['', '', '', '', 'Total', `$${formatPrice(totalSales.value)}`]],
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
      });

      // Guardar el PDF de exportación
      doc.save(`ventas_${new Date().toLocaleDateString()}.pdf`);
    };

    const removeDuplicates = (array) => {
      return [...new Set(array)];
    };

    // Función para mostrar notificaciones
    const showNotification = (message, type) => {
      notification.value = {
        show: true,
        message,
        type
      };
      
      setTimeout(() => {
        notification.value.show = false;
      }, 3000); // 3 segundos como acordado
    };

    const checkAvailabilityToast = async (itemId) => {
      try {
        // Buscar el item en ambos menús
        const item = menuItems.value.find(i => i.id === itemId) || 
                    specialMenuItems.value.find(i => i.id === itemId);
        
        if (item) {
          if (item.availableQuantity > 5) {
            showNotification(`Disponible: ${item.availableQuantity} unidades`, 'success');
          } else if (item.availableQuantity > 0) {
            showNotification(`¡Quedan solo ${item.availableQuantity} unidades!`, 'warning');
          } else {
            showNotification('Producto agotado', 'error');
          }
        }
      } catch (error) {
        console.error('Error al verificar disponibilidad:', error);
      }
    };

    // Añadir propiedad isEmployee
    const isEmployee = computed(() => {
      return hasRole('Empleado') && !hasRole('Administrador') && !hasRole('Superadministrador');
    });

    const filterInventoryItems = computed(() => {
      return (items) => {
        if (!items || !Array.isArray(items)) {
          console.warn('filterInventoryItems recibió un valor no array:', items);
          return [];
        }
        if (searchTerm.value) {
          const term = searchTerm.value.toLowerCase().trim();
          
          items = items.filter(item => {
            if (item && typeof item === 'object') {
              const name = String(item.name || '').toLowerCase();
              return name.includes(term);
            }
            return false;
          });
        }
        if (categoryFilter.value) {
          if (categoryFilter.value === 'drinks') {
            items = items.filter(item => item && item.includesDrink === true);
          } else if (categoryFilter.value === 'nodrinks') {
            items = items.filter(item => item && item.includesDrink === false);
          }
        }
        if (sortBy.value) {
          switch (sortBy.value) {
            case 'name':
              items.sort((a, b) => {
                const nameA = (a && a.name) ? a.name.toLowerCase() : '';
                const nameB = (b && b.name) ? b.name.toLowerCase() : '';
                return nameA.localeCompare(nameB);
              });
              break;
            case 'quantity-desc':
              items.sort((a, b) => {
                const qtyA = (a && typeof a.quantity === 'number') ? a.quantity : 0;
                const qtyB = (b && typeof b.quantity === 'number') ? b.quantity : 0;
                return qtyB - qtyA;
              });
              break;
            case 'quantity-asc':
              items.sort((a, b) => {
                const qtyA = (a && typeof a.quantity === 'number') ? a.quantity : 0;
                const qtyB = (b && typeof b.quantity === 'number') ? b.quantity : 0;
                return qtyA - qtyB;
              });
              break;
            case 'price-desc':
              items.sort((a, b) => {
                const priceA = (a && typeof a.price === 'number') ? a.price : 0;
                const priceB = (b && typeof b.price === 'number') ? b.price : 0;
                return priceB - priceA;
              });
              break;
            case 'price-asc':
              items.sort((a, b) => {
                const priceA = (a && typeof a.price === 'number') ? a.price : 0;
                const priceB = (b && typeof b.price === 'number') ? b.price : 0;
                return priceA - priceB;
              });
              break;
            case 'date-desc':
              items.sort((a, b) => {
                const dateA = a && a.date ? new Date(a.date) : new Date(0);
                const dateB = b && b.date ? new Date(b.date) : new Date(0);
                return dateB - dateA;
              });
              break;
            case 'date-asc':
              items.sort((a, b) => {
                const dateA = a && a.date ? new Date(a.date) : new Date(0);
                const dateB = b && b.date ? new Date(b.date) : new Date(0);
                return dateA - dateB;
              });
              break;
            default:
              break;
          }
        }
        return items;
      }
    }

    return {
      businessInfo,
      showBusinessForm,
      toggleBusinessForm,
      onLogoChange,
      saveBusinessInfo,
      clearBusinessForm,
      paymentInfo,
      showPaymentForm,
      togglePaymentForm,
      onQRImageChange,
      onNequiImageChange,
      savePaymentInfo,
      clearPaymentForm,
      newItem,
      menuItems,
      showMenuForm,
      isEditing,
      toggleMenuForm,
      onImageChange,
      saveMenuItem,
      editMenuItem,
      deleteMenuItem,
      sellMenuItem,
      clearMenuForm,
      soldItems,
      totalSales,
      searchTerm,
      sortBy,
      categoryFilter,
      filteredSoldItems,
      formatPrice,
      selectedChartType,
      exportToExcel,
      exportToPDF,
      shareLink,
      showCopiedMessage,
      shareByWhatsApp,
      copyLink,
      migrationStatus,
      removeDuplicates,
      chartError,
      handleChartError,
      notification,
      formatDate,
      newSpecialItem,
      specialMenuItems,
      showSpecialMenuForm,
      isEditingSpecial,
      editingSpecialIndex,
      toggleSpecialMenuForm,
      onSpecialImageChange,
      saveSpecialMenuItem,
      clearSpecialMenuForm,
      editSpecialMenuItem,
      deleteSpecialMenuItem,
      sellSpecialMenuItem,
      toast,
      showNotification,
      checkAvailabilityToast,
      isEmployee,
      filterInventoryItems
    };
  }
};
</script>

<style scoped>
.menu-container {
  padding: 20px;
}

section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
}

h2 {
  color: #333;
  font-size: 24px;
  margin-bottom: 20px;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 10px;
}

.toggle-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  margin-bottom: 20px;
  cursor: pointer;
  font-weight: bold;
}

.toggle-button:hover {
  background-color: #45a049;
}

form {
  display: grid;
  gap: 15px;
}

label {
  font-weight: bold;
}

input, textarea, select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.save-button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  cursor: pointer;
  flex: 1;
}

.save-button:hover {
  background-color: #0056b3;
}

.clear-button {
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  cursor: pointer;
  flex: 1;
}

.clear-button:hover {
  background-color: #c82333;
}

.business-preview {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
}

/* Mejoras a la lista de platos */
.menu-items-list, .menu-special-items-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.menu-item-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}

.menu-item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.menu-item-image-container {
  width: 100%;
  height: 200px;
  position: relative;
  overflow: hidden;
  background-color: #f0f0f0;
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

.no-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-style: italic;
}

.menu-item-details {
  padding: 15px;
  flex-grow: 1;
}

.menu-item-details h3 {
  margin-top: 0;
  color: #333;
  font-size: 18px;
}

.menu-item-actions {
  display: flex;
  gap: 10px;
  padding: 0 15px 15px;
}

.edit-button, .sell-button, .delete-button {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}

.edit-button {
  background-color: #ffc107;
  color: #212529;
}

.edit-button:hover {
  background-color: #e0a800;
}

.sell-button {
  background-color: #28a745;
  color: white;
}

.sell-button:hover {
  background-color: #218838;
}

.delete-button {
  background-color: #dc3545;
  color: white;
}

.delete-button:hover {
  background-color: #c82333;
}

/* Mejoras a la sección de inventario */
.inventory-section {
  margin-bottom: 40px;
}

.inventory-controls {
  margin-bottom: 20px;
  display: grid;
  gap: 15px;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .inventory-controls {
    grid-template-columns: repeat(3, 1fr);
  }
}

.inventory-search-input {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
}

.inventory-filters, 
.inventory-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.inventory-filter {
  flex: 1;
  min-width: 150px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
}

.export-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.export-button.excel {
  background-color: #1D6F42;
  color: white;
}

.export-button.excel:hover {
  background-color: #165235;
}

.export-button.pdf {
  background-color: #F40F02;
  color: white;
}

.export-button.pdf:hover {
  background-color: #C90C02;
}

.action-icon {
  font-size: 18px;
}

.sales-chart-container {
  margin-bottom: 20px;
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-chart-message {
  color: #666;
  font-style: italic;
  text-align: center;
  width: 100%;
  padding: 50px 20px;
}

.sales-chart {
  margin-bottom: 20px;
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.inventory-table {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 15px;
  text-align: left;
}

thead {
  background-color: #4CAF50;
  color: white;
}

thead th {
  font-weight: 600;
}

tbody tr:hover {
  background-color: #f1f1f1;
}

.alternate-row {
  background-color: #f9f9f9;
}

tfoot {
  background-color: #e9e9e9;
  font-weight: bold;
}

tfoot td {
  padding: 12px 15px;
}

.share-buttons {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.whatsapp-button, .copy-button {
  flex: 1;
  padding: 12px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.whatsapp-button {
  background-color: #25D366;
  color: white;
}

.whatsapp-button:hover {
  background-color: #128C7E;
}

.copy-button {
  background-color: #6c757d;
  color: white;
}

.copy-button:hover {
  background-color: #5a6268;
}

.emoji {
  font-size: 1.2em;
  margin-right: 8px;
}

.copied-message {
  color: #28a745;
  margin-top: 10px;
}

.share-link {
  margin-top: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  word-break: break-all;
}

.migration-status {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #ffeb3b;
  color: #333;
  padding: 15px 20px;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  max-width: 300px;
  transition: all 0.3s ease;
}

.migration-status.completed {
  background-color: #4CAF50;
  color: white;
}

.migration-message {
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: #333;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Estilos para notificaciones */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 4px;
  color: white;
  font-weight: bold;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  max-width: 500px;
  animation: slide-in 0.3s ease-out;
}

.notification.success {
  background-color: #4CAF50;
}

.notification.error {
  background-color: #f44336;
}

.notification-close {
  background: transparent;
  border: none;
  color: white;
  font-size: 20px;
  margin-left: 15px;
  cursor: pointer;
  padding: 0 5px;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Estilos del toast */
.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  color: white;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
}

.toast-notification.success {
  background-color: #4CAF50;
}

.toast-notification.error {
  background-color: #f44336;
}

.toast-notification.warning {
  background-color: #ff9800;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-20px); }
}

/* Estilos del tooltip */
.tooltip-container {
  position: relative;
}

.tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 12px;
  background-color: #333;
  color: white;
  border-radius: 6px;
  font-size: 14px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
}

.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #333;
}

.tooltip-visible {
  opacity: 1;
  visibility: visible;
}

.action-button:hover .tooltip {
  opacity: 1;
  visibility: visible;
}

/* Añadir estilos para botones deshabilitados */
.toggle-button:disabled {
  background-color: #cccccc;
  color: #666666;
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
