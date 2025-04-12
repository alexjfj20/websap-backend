<template>
  <div class="reservas-view">
    <div class="container py-4">
      <div class="row">
        <div class="col-12">
          <h1 class="mb-4">Reservas</h1>
          
          <div class="card">
            <div class="card-body">
              <div v-if="loading" class="text-center my-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando reservas...</p>
              </div>
              <div v-else-if="error" class="alert alert-danger">
                {{ error }}
              </div>
              <div v-else>
                <div class="mb-4">
                  <h4>Filtros</h4>
                  <div class="row g-3">
                    <div class="col-md-3">
                      <label for="fechaDesde" class="form-label">Fecha desde</label>
                      <input type="date" class="form-control" id="fechaDesde" v-model="filtros.fechaDesde">
                    </div>
                    <div class="col-md-3">
                      <label for="fechaHasta" class="form-label">Fecha hasta</label>
                      <input type="date" class="form-control" id="fechaHasta" v-model="filtros.fechaHasta">
                    </div>
                    <div class="col-md-3">
                      <label for="estado" class="form-label">Estado</label>
                      <select class="form-select" id="estado" v-model="filtros.estado">
                        <option value="">Todos</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </div>
                    <div class="col-md-3">
                      <label for="restaurante" class="form-label">Restaurante</label>
                      <select class="form-select" id="restaurante" v-model="filtros.restauranteId">
                        <option value="">Todos</option>
                        <option v-for="restaurante in restaurantes" :key="restaurante.id" :value="restaurante.id">
                          {{ restaurante.nombre }}
                        </option>
                      </select>
                    </div>
                    <div class="col-12">
                      <button class="btn btn-primary" @click="aplicarFiltros">
                        <i class="fas fa-filter"></i> Aplicar Filtros
                      </button>
                      <button class="btn btn-secondary ms-2" @click="limpiarFiltros">
                        <i class="fas fa-times"></i> Limpiar Filtros
                      </button>
                    </div>
                  </div>
                </div>
                
                <div class="table-responsive">
                  <table class="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Personas</th>
                        <th>Restaurante</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="reserva in reservas" :key="reserva.id">
                        <td>{{ reserva.id }}</td>
                        <td>
                          <div>{{ reserva.nombre }}</div>
                          <small class="text-muted">{{ reserva.telefono }}</small>
                          <small class="text-muted d-block">{{ reserva.email || 'Sin email' }}</small>
                        </td>
                        <td>{{ formatDate(reserva.fecha) }}</td>
                        <td>{{ formatTime(reserva.hora) }}</td>
                        <td>{{ reserva.personas }}</td>
                        <td>{{ getRestauranteName(reserva.restaurante_id) }}</td>
                        <td>
                          <span :class="getEstadoClass(reserva.estado)">
                            {{ reserva.estado }}
                          </span>
                        </td>
                        <td>
                          <div class="btn-group">
                            <button class="btn btn-sm btn-info" @click="verDetalles(reserva)">
                              <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-success" @click="confirmarReserva(reserva)" v-if="reserva.estado === 'pendiente'">
                              <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" @click="cancelarReserva(reserva)" v-if="reserva.estado !== 'cancelada'">
                              <i class="fas fa-times"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div v-if="reservas.length === 0" class="text-center py-5">
                  <p>No se encontraron reservas con los filtros aplicados.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal de detalles de reserva -->
    <div class="modal" id="detallesModal">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="detallesModalLabel">Detalles de la Reserva</h5>
          <button type="button" class="btn-close" @click="closeModal('detallesModal')"></button>
        </div>
        <div class="modal-body" v-if="reservaSeleccionada">
          <div class="row mb-3">
            <div class="col-md-6">
              <strong>Cliente:</strong> {{ reservaSeleccionada.nombre }}
            </div>
            <div class="col-md-6">
              <strong>Teléfono:</strong> {{ reservaSeleccionada.telefono }}
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <strong>Email:</strong> {{ reservaSeleccionada.email || 'No proporcionado' }}
            </div>
            <div class="col-md-6">
              <strong>Personas:</strong> {{ reservaSeleccionada.personas }}
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <strong>Fecha:</strong> {{ formatDate(reservaSeleccionada.fecha) }}
            </div>
            <div class="col-md-6">
              <strong>Hora:</strong> {{ formatTime(reservaSeleccionada.hora) }}
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <strong>Estado:</strong> 
              <span :class="getEstadoClass(reservaSeleccionada.estado)">
                {{ reservaSeleccionada.estado }}
              </span>
            </div>
            <div class="col-md-6">
              <strong>Origen:</strong> {{ reservaSeleccionada.origen || 'Web' }}
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-12">
              <strong>Restaurante:</strong> {{ getRestauranteName(reservaSeleccionada.restaurante_id) }}
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-12">
              <strong>Notas:</strong>
              <p class="mt-2">{{ reservaSeleccionada.notas || 'Sin notas adicionales' }}</p>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-12">
              <strong>Creada el:</strong> {{ formatDateTime(reservaSeleccionada.creado_en) }}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal('detallesModal')">Cerrar</button>
          <button 
            type="button" 
            class="btn btn-success" 
            v-if="reservaSeleccionada && reservaSeleccionada.estado === 'pendiente'"
            @click="confirmarReservaModal"
          >
            Confirmar Reserva
          </button>
          <button 
            type="button" 
            class="btn btn-danger" 
            v-if="reservaSeleccionada && reservaSeleccionada.estado !== 'cancelada'"
            @click="cancelarReservaModal"
          >
            Cancelar Reserva
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import reservaService from '@/services/reservaService';
import restauranteService from '@/services/restauranteService';

export default {
  name: 'ReservasView',
  data() {
    return {
      reservas: [],
      restaurantes: [],
      loading: true,
      error: null,
      reservaSeleccionada: null,
      detallesModal: null,
      filtros: {
        fechaDesde: '',
        fechaHasta: '',
        estado: '',
        restauranteId: ''
      }
    };
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      try {
        this.loading = true;
        this.error = null;
        
        // Cargar restaurantes
        const restaurantesResponse = await restauranteService.getRestaurantes();
        this.restaurantes = restaurantesResponse.data;
        
        // Cargar reservas
        await this.cargarReservas();
      } catch (error) {
        console.error('Error al cargar datos:', error);
        this.error = 'Error al cargar los datos. Por favor, inténtelo de nuevo.';
      } finally {
        this.loading = false;
      }
    },
    
    async cargarReservas() {
      try {
        const params = {};
        
        if (this.filtros.fechaDesde) {
          params.fechaDesde = this.filtros.fechaDesde;
        }
        
        if (this.filtros.fechaHasta) {
          params.fechaHasta = this.filtros.fechaHasta;
        }
        
        if (this.filtros.estado) {
          params.estado = this.filtros.estado;
        }
        
        if (this.filtros.restauranteId) {
          params.restauranteId = this.filtros.restauranteId;
        }
        
        const response = await reservaService.getReservas(params);
        this.reservas = response.data;
      } catch (error) {
        console.error('Error al cargar reservas:', error);
        this.error = 'Error al cargar las reservas. Por favor, inténtelo de nuevo.';
      }
    },
    
    verDetalles(reserva) {
      this.reservaSeleccionada = { ...reserva };
      document.getElementById('detallesModal').style.display = 'block';
    },
    
    async confirmarReserva(reserva) {
      try {
        await reservaService.actualizarEstado(reserva.id, 'confirmada');
        alert('Reserva confirmada correctamente');
        await this.cargarReservas();
      } catch (error) {
        console.error('Error al confirmar reserva:', error);
        alert('Error al confirmar la reserva. Por favor, inténtelo de nuevo.');
      }
    },
    
    async cancelarReserva(reserva) {
      try {
        await reservaService.actualizarEstado(reserva.id, 'cancelada');
        alert('Reserva cancelada correctamente');
        await this.cargarReservas();
      } catch (error) {
        console.error('Error al cancelar reserva:', error);
        alert('Error al cancelar la reserva. Por favor, inténtelo de nuevo.');
      }
    },
    
    async confirmarReservaModal() {
      await this.confirmarReserva(this.reservaSeleccionada);
      document.getElementById('detallesModal').style.display = 'none';
    },
    
    async cancelarReservaModal() {
      await this.cancelarReserva(this.reservaSeleccionada);
      document.getElementById('detallesModal').style.display = 'none';
    },
    
    aplicarFiltros() {
      this.cargarReservas();
    },
    
    limpiarFiltros() {
      this.filtros = {
        fechaDesde: '',
        fechaHasta: '',
        estado: '',
        restauranteId: ''
      };
      this.cargarReservas();
    },
    
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    },
    
    formatTime(timeString) {
      if (!timeString) return 'N/A';
      return timeString.substring(0, 5);
    },
    
    formatDateTime(dateTimeString) {
      if (!dateTimeString) return 'N/A';
      const date = new Date(dateTimeString);
      return date.toLocaleString();
    },
    
    getEstadoClass(estado) {
      switch (estado) {
        case 'pendiente':
          return 'badge bg-warning';
        case 'confirmada':
          return 'badge bg-success';
        case 'cancelada':
          return 'badge bg-danger';
        default:
          return 'badge bg-secondary';
      }
    },
    
    getRestauranteName(restauranteId) {
      if (!restauranteId) {
        return 'Sin asignar';
      }
      
      const restaurante = this.restaurantes.find(r => r.id === restauranteId);
      return restaurante ? restaurante.nombre : 'Desconocido';
    },
    
    closeModal(modalId) {
      document.getElementById(modalId).style.display = 'none';
    }
  }
};
</script>

<style scoped>
.reservas-view {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.card {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.table th, .table td {
  vertical-align: middle;
}

.btn-group {
  display: flex;
  gap: 5px;
}

.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background-color: #fff;
  margin: 10% auto;
  padding: 20px;
  border-radius: 5px;
  width: 80%;
  max-width: 500px;
}

.btn-close {
  float: right;
  cursor: pointer;
  font-size: 20px;
}
</style>
