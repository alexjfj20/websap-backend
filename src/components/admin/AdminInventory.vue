<template>
  <div class="inventory-container">
    <h2 class="section-title">Gestión de Inventario</h2>
    
    <!-- Controles de filtrado y búsqueda -->
    <div class="inventory-controls">
      <div class="search-container">
        <input 
          v-model="searchTerm" 
          placeholder="Buscar producto..." 
          class="search-input"
          @input="handleSearchInput"
        />
      </div>
      
      <div class="filters">
        <select v-model="stockFilter" @change="applyFilters" class="filter-select">
          <option value="all">Todos los productos</option>
          <option value="low">Stock bajo</option>
          <option value="out">Sin stock</option>
        </select>
        
        <select v-model="categoryFilter" @change="applyFilters" class="filter-select">
          <option value="">Todas las categorías</option>
          <option value="con_refresco">Con refresco</option>
          <option value="sin_refresco">Sin refresco</option>
        </select>
      </div>
      
      <div class="actions">
        <button @click="refreshInventory" class="refresh-btn">
          <span class="btn-icon">🔄</span> Actualizar
        </button>
      </div>
    </div>
    
    <!-- Estados de carga y error -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando inventario...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="loadInventory" class="retry-btn">Reintentar</button>
    </div>
    
    <div v-else-if="filteredProducts.length === 0" class="empty-state">
      <div class="empty-icon">📦</div>
      <p>No se encontraron productos</p>
      <p class="empty-desc">Intenta cambiar los filtros de búsqueda o agrega nuevos productos al inventario</p>
    </div>
    
    <!-- Tabla de inventario -->
    <div v-else class="inventory-table-container">
      <table class="inventory-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Stock Actual</th>
            <th>Estado</th>
            <th>Última Actualización</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in filteredProducts" :key="product.id" :class="getRowClass(product)">
            <td>{{ product.name }}</td>
            <td>{{ product.includesDrink ? 'Con refresco' : 'Sin refresco' }}</td>
            <td>{{ product.availableQuantity }}</td>
            <td>
              <span :class="getStatusClass(product)">
                {{ getStatusText(product) }}
              </span>
            </td>
            <td>{{ formatDate(product.lastUpdated) }}</td>
            <td class="actions-cell">
              <button @click="openUpdateStockModal(product)" class="update-btn" title="Actualizar stock">
                📝
              </button>
              <button @click="openHistoryModal(product)" class="history-btn" title="Ver historial">
                📋
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Modal para actualizar stock -->
    <div v-if="showUpdateModal" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Actualizar Stock</h3>
          <button @click="closeUpdateModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p><strong>Producto:</strong> {{ selectedProduct?.name }}</p>
          <p><strong>Stock actual:</strong> {{ selectedProduct?.availableQuantity || 0 }}</p>
          
          <div class="form-group">
            <label for="newStock">Nuevo stock:</label>
            <input 
              type="number" 
              id="newStock" 
              v-model="updateStockForm.newQuantity" 
              min="0" 
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="reason">Motivo del ajuste:</label>
            <textarea 
              id="reason" 
              v-model="updateStockForm.reason" 
              class="form-textarea" 
              placeholder="Explique el motivo del ajuste de inventario"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeUpdateModal" class="cancel-btn">Cancelar</button>
          <button @click="updateStock" class="save-btn" :disabled="updateStockForm.isUpdating">
            <span v-if="updateStockForm.isUpdating">Actualizando...</span>
            <span v-else>Guardar Cambios</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Modal para ver historial -->
    <div v-if="showHistoryModal" class="modal-overlay">
      <div class="modal-container history-modal">
        <div class="modal-header">
          <h3>Historial de {{ selectedProduct?.name }}</h3>
          <button @click="closeHistoryModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="productHistory.length === 0" class="empty-history">
            <p>No hay registros de movimientos para este producto.</p>
          </div>
          <div v-else class="history-list">
            <div v-for="(record, index) in productHistory" :key="index" class="history-item">
              <div class="history-date">{{ formatDate(record.date) }}</div>
              <div class="history-details">
                <span class="history-type" :class="record.type">
                  {{ record.type === 'increase' ? 'Incremento' : record.type === 'decrease' ? 'Reducción' : 'Ajuste' }}
                </span>
                <span class="history-quantity">
                  {{ record.type === 'increase' ? '+' : '' }}{{ record.change }}
                </span>
                <span class="history-stock">
                  Stock resultante: {{ record.newQuantity }}
                </span>
              </div>
              <div class="history-reason">
                {{ record.reason || 'Sin motivo especificado' }}
              </div>
              <div class="history-user">
                Por: {{ record.userName || 'Sistema' }}
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeHistoryModal" class="cancel-btn">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { getMenuItems, updateItemStock } from '../../services/adminService';
import { alert, confirm } from '../../services/dialogService';
import { getCurrentUser } from '../../services/authService';

export default {
  name: 'AdminInventory',
  setup() {
    // Estados
    const products = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const searchTerm = ref('');
    const stockFilter = ref('all');
    const categoryFilter = ref('');
    
    // Estados para modales
    const showUpdateModal = ref(false);
    const showHistoryModal = ref(false);
    const selectedProduct = ref(null);
    const productHistory = ref([]);
    
    // Formulario para actualizar stock
    const updateStockForm = ref({
      newQuantity: 0,
      reason: '',
      isUpdating: false
    });
    
    // Cargar productos al montar el componente
    onMounted(() => {
      loadInventory();
    });
    
    // Cargar inventario de productos
    const loadInventory = async () => {
      try {
        loading.value = true;
        error.value = null;
        
        const response = await getMenuItems();
        
        if (response.success) {
          // Asegurar que cada producto tiene propiedades relacionadas con el inventario
          products.value = response.data.map(item => ({
            ...item,
            availableQuantity: item.availableQuantity || 0,
            lastUpdated: item.lastUpdated || new Date().toISOString(),
            stockHistory: item.stockHistory || []
          }));
          
          console.log('Inventario cargado:', products.value);
        } else {
          throw new Error(response.message || 'Error al cargar el inventario');
        }
      } catch (err) {
        console.error('Error al cargar inventario:', err);
        error.value = `Error al cargar inventario: ${err.message || 'Error desconocido'}`;
      } finally {
        loading.value = false;
      }
    };
    
    // Refrescar inventario
    const refreshInventory = () => {
      loadInventory();
    };
    
    // Función para manejar la búsqueda
    const handleSearchInput = () => {
      // La búsqueda se aplica automáticamente a través del computed filteredProducts
    };
    
    // Aplicar filtros
    const applyFilters = () => {
      // Los filtros se aplican automáticamente a través del computed filteredProducts
    };
    
    // Productos filtrados
    const filteredProducts = computed(() => {
      let result = [...products.value];
      
      // Aplicar búsqueda por término
      if (searchTerm.value) {
        const term = searchTerm.value.toLowerCase();
        result = result.filter(product => 
          product.name?.toLowerCase().includes(term)
        );
      }
      
      // Aplicar filtro por estado de stock
      if (stockFilter.value !== 'all') {
        if (stockFilter.value === 'low') {
          result = result.filter(product => 
            product.availableQuantity > 0 && product.availableQuantity <= 5
          );
        } else if (stockFilter.value === 'out') {
          result = result.filter(product => 
            product.availableQuantity === 0
          );
        }
      }
      
      // Aplicar filtro por categoría
      if (categoryFilter.value) {
        if (categoryFilter.value === 'con_refresco') {
          result = result.filter(product => product.includesDrink);
        } else if (categoryFilter.value === 'sin_refresco') {
          result = result.filter(product => !product.includesDrink);
        }
      }
      
      return result;
    });
    
    // Obtener clase para la fila según el estado del stock
    const getRowClass = (product) => {
      if (product.availableQuantity === 0) {
        return 'out-of-stock-row';
      } else if (product.availableQuantity <= 5) {
        return 'low-stock-row';
      }
      return '';
    };
    
    // Obtener clase para el estado
    const getStatusClass = (product) => {
      if (product.availableQuantity === 0) {
        return 'status-badge out-of-stock';
      } else if (product.availableQuantity <= 5) {
        return 'status-badge low-stock';
      }
      return 'status-badge in-stock';
    };
    
    // Obtener texto de estado
    const getStatusText = (product) => {
      if (product.availableQuantity === 0) {
        return 'Sin stock';
      } else if (product.availableQuantity <= 5) {
        return 'Stock bajo';
      }
      return 'Disponible';
    };
    
    // Formatear fecha
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      
      try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(date);
      } catch (err) {
        console.error('Error al formatear fecha:', err);
        return 'Fecha inválida';
      }
    };
    
    // Abrir modal para actualizar stock
    const openUpdateStockModal = (product) => {
      selectedProduct.value = { ...product };
      updateStockForm.value = {
        newQuantity: product.availableQuantity,
        reason: '',
        isUpdating: false
      };
      showUpdateModal.value = true;
    };
    
    // Cerrar modal de actualización
    const closeUpdateModal = () => {
      showUpdateModal.value = false;
      selectedProduct.value = null;
    };
    
    // Actualizar stock
    const updateStock = async () => {
      if (!selectedProduct.value) return;
      
      // Validar datos
      if (isNaN(updateStockForm.value.newQuantity) || updateStockForm.value.newQuantity < 0) {
        await alert('Por favor ingrese una cantidad válida (mayor o igual a 0)');
        return;
      }
      
      if (!updateStockForm.value.reason.trim()) {
        await alert('Por favor ingrese un motivo para el ajuste de inventario');
        return;
      }
      
      try {
        updateStockForm.value.isUpdating = true;
        
        // Determinar el tipo de movimiento
        const currentQuantity = selectedProduct.value.availableQuantity;
        const newQuantity = parseInt(updateStockForm.value.newQuantity);
        const difference = newQuantity - currentQuantity;
        const type = difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'adjustment';
        
        // Crear registro de historial
        const currentUser = getCurrentUser();
        const historyRecord = {
          date: new Date().toISOString(),
          type,
          change: Math.abs(difference),
          previousQuantity: currentQuantity,
          newQuantity,
          reason: updateStockForm.value.reason,
          userId: currentUser?.id,
          userName: currentUser?.nombre || 'Usuario'
        };
        
        // Actualizar en base de datos
        await updateItemStock(
          selectedProduct.value.id, 
          newQuantity, 
          historyRecord
        );
        
        // Actualizar en estado local
        const productIndex = products.value.findIndex(p => p.id === selectedProduct.value.id);
        if (productIndex !== -1) {
          products.value[productIndex].availableQuantity = newQuantity;
          products.value[productIndex].lastUpdated = new Date().toISOString();
          
          // Añadir al historial
          if (!products.value[productIndex].stockHistory) {
            products.value[productIndex].stockHistory = [];
          }
          products.value[productIndex].stockHistory.push(historyRecord);
        }
        
        // Mostrar confirmación
        await alert('Stock actualizado correctamente', { title: 'Actualización Exitosa' });
        
        // Cerrar modal
        closeUpdateModal();
      } catch (err) {
        console.error('Error al actualizar stock:', err);
        await alert(`Error al actualizar stock: ${err.message || 'Error desconocido'}`);
      } finally {
        updateStockForm.value.isUpdating = false;
      }
    };
    
    // Abrir modal de historial
    const openHistoryModal = (product) => {
      selectedProduct.value = { ...product };
      
      // Obtener historial del producto
      productHistory.value = product.stockHistory || [];
      
      showHistoryModal.value = true;
    };
    
    // Cerrar modal de historial
    const closeHistoryModal = () => {
      showHistoryModal.value = false;
      selectedProduct.value = null;
      productHistory.value = [];
    };
    
    return {
      products,
      loading,
      error,
      searchTerm,
      stockFilter,
      categoryFilter,
      filteredProducts,
      showUpdateModal,
      showHistoryModal,
      selectedProduct,
      productHistory,
      updateStockForm,
      loadInventory,
      refreshInventory,
      handleSearchInput,
      applyFilters,
      getRowClass,
      getStatusClass,
      getStatusText,
      formatDate,
      openUpdateStockModal,
      closeUpdateModal,
      updateStock,
      openHistoryModal,
      closeHistoryModal
    };
  }
};
</script>

<style scoped>
.inventory-container {
  padding: 0;
}

.section-title {
  font-size: 24px;
  margin-bottom: 30px;
  color: #333;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 10px;
}

/* Controles y filtros */
.inventory-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 30px;
}

.search-container {
  flex-grow: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.filters {
  display: flex;
  gap: 10px;
}

.filter-select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.actions {
  margin-left: auto;
}

.refresh-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.3s;
}

.refresh-btn:hover {
  background-color: #45a049;
}

.btn-icon {
  font-size: 16px;
}

/* Estados de carga y error */
.loading-container, .error-container, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin: 20px 0;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #4CAF50;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #f44336;
  font-weight: bold;
  margin-bottom: 15px;
}

.retry-btn {
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
  color: #bbb;
}

.empty-desc {
  color: #777;
  font-size: 14px;
  margin-top: 10px;
}

/* Tabla de inventario */
.inventory-table-container {
  overflow-x: auto;
  margin-top: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
}

.inventory-table th,
.inventory-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.inventory-table thead {
  background-color: #4CAF50;
  color: white;
}

.inventory-table tbody tr:hover {
  background-color: #f5f5f5;
}

.inventory-table .actions-cell {
  white-space: nowrap;
  text-align: center;
}

/* Clases para estados de stock */
.out-of-stock-row {
  background-color: #ffebee;
}

.low-stock-row {
  background-color: #fff8e1;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.in-stock {
  background-color: #4CAF50;
  color: white;
}

.low-stock {
  background-color: #FFC107;
  color: #333;
}

.out-of-stock {
  background-color: #F44336;
  color: white;
}

/* Botones de acción */
.update-btn, .history-btn {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: none;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin: 0 2px;
}

.update-btn {
  background-color: #2196F3;
  color: white;
}

.update-btn:hover {
  background-color: #0b7dda;
}

.history-btn {
  background-color: #9E9E9E;
  color: white;
}

.history-btn:hover {
  background-color: #757575;
}

/* Modales */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalFadeIn 0.3s;
}

.history-modal {
  max-width: 700px;
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #777;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Formulario */
.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.form-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  min-height: 100px;
  resize: vertical;
}

/* Botones modal */
.cancel-btn, .save-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  border: none;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.save-btn {
  background-color: #4CAF50;
  color: white;
}

.save-btn:hover {
  background-color: #45a049;
}

.save-btn:disabled {
  background-color: #9E9E9E;
  cursor: not-allowed;
}

/* Historial */
.history-list {
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  position: relative;
}

.history-item:last-child {
  border-bottom: none;
}

.history-date {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.history-details {
  display: flex;
  gap: 10px;
  margin-bottom: 5px;
  align-items: center;
}

.history-type {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.history-type.increase {
  background-color: #4CAF50;
  color: white;
}

.history-type.decrease {
  background-color: #F44336;
  color: white;
}

.history-type.adjustment {
  background-color: #2196F3;
  color: white;
}

.history-quantity {
  font-weight: bold;
}

.history-reason {
  margin-top: 5px;
  font-style: italic;
  color: #555;
}

.history-user {
  margin-top: 5px;
  font-size: 12px;
  color: #777;
  text-align: right;
}

.empty-history {
  padding: 30px;
  text-align: center;
  color: #777;
  font-style: italic;
}

/* Responsive */
@media (max-width: 768px) {
  .inventory-controls {
    flex-direction: column;
  }
  
  .search-container, .filters, .actions {
    width: 100%;
  }
  
  .actions {
    display: flex;
    justify-content: center;
  }
  
  .inventory-table th,
  .inventory-table td {
    padding: 8px;
    font-size: 14px;
  }
}
</style> 