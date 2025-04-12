<template>
  <div class="chart-container">
    <div v-if="loading" class="loading-message">
      Cargando gráfico...
    </div>
    <template v-else>
      <!-- Cambiar data por chartData -->
      <Bar 
        v-if="chartType === 'bar' && isDataReady" 
        :chartData="safeChartData" 
        :options="chartOptions" 
      />
      <Line 
        v-else-if="chartType === 'line' && isDataReady" 
        :chartData="safeChartData" 
        :options="chartOptions" 
      />
      <div v-else class="no-data-message">
        No hay suficientes datos para mostrar el gráfico
      </div>
    </template>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import { Bar, Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement);

// Objeto de datos por defecto para el gráfico (siempre válido)
const DEFAULT_CHART_DATA = {
  labels: [],
  datasets: [{
    label: 'Sin datos',
    data: [],
    backgroundColor: ['rgba(200, 200, 200, 0.5)'],
    borderColor: 'rgba(200, 200, 200, 1)',
    borderWidth: 1
  }]
};

export default defineComponent({
  name: 'SalesChartComponent',
  components: { Bar, Line },
  props: {
    chartType: {
      type: String,
      default: 'bar',
      validator: (value) => ['bar', 'line'].includes(value)
    },
    items: {
      type: Array,
      required: true,
      default: () => []
    }
  },
  setup(props) {
    const loading = ref(true);
    // Usar un objeto ref separado para manejo interno
    const internalChartData = ref({...DEFAULT_CHART_DATA});

    // Proporciona un computado que siempre retorna un objeto válido
    const safeChartData = computed(() => {
      try {
        // Verificar si el chartData interno es válido
        if (internalChartData.value && 
            internalChartData.value.datasets && 
            Array.isArray(internalChartData.value.datasets) &&
            internalChartData.value.datasets.length > 0) {
          return internalChartData.value;
        }
        // Si no es válido, devolver los datos por defecto
        return {...DEFAULT_CHART_DATA};
      } catch (error) {
        console.error("Error en safeChartData:", error);
        // En caso de error, devolver datos por defecto
        return {...DEFAULT_CHART_DATA};
      }
    });

    // Flag para confirmar si los datos están listos para renderizar
    const isDataReady = computed(() => {
      try {
        return safeChartData.value &&
               safeChartData.value.datasets &&
               Array.isArray(safeChartData.value.datasets) &&
               safeChartData.value.datasets.length > 0 &&
               !loading.value;
      } catch (error) {
        console.error("Error en isDataReady:", error);
        return false;
      }
    });

    // Función para procesar y actualizar los datos del gráfico de forma segura
    const updateChartData = () => {
      loading.value = true;
      
      try {
        // Default fallback data (used in case of errors or empty data)
        let processedData = {...DEFAULT_CHART_DATA};
        
        // Si hay items válidos, procesarlos
        if (Array.isArray(props.items) && props.items.length > 0) {
          // Extraer datos de forma segura
          const labels = props.items.map(item => (item && item.name) ? item.name : 'Sin nombre');
          const data = props.items.map(item => (item && typeof item.quantity === 'number') ? item.quantity : 0);
          
          // Generar colores de forma segura
          const backgroundColor = props.items.map(() => {
            const r = Math.floor(Math.random() * 155) + 100;
            const g = Math.floor(Math.random() * 155) + 100;
            const b = Math.floor(Math.random() * 155) + 100;
            return `rgba(${r}, ${g}, ${b}, 0.6)`;
          });
          
          // Crear el objeto de datos procesado
          processedData = {
            labels,
            datasets: [
              {
                label: 'Cantidad vendida',
                data,
                backgroundColor,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
              }
            ]
          };
        }
        
        // Actualizar los datos internos
        internalChartData.value = processedData;
      } catch (error) {
        console.error('Error al actualizar datos del gráfico:', error);
        // En caso de error, usar datos por defecto
        internalChartData.value = {...DEFAULT_CHART_DATA};
      } finally {
        // Siempre completar la carga
        loading.value = false;
      }
    };

    // Observar cambios en props.items con validación rigurosa
    watch(() => props.items, (newItems) => {
      if (!Array.isArray(newItems)) {
        console.warn('SalesChartComponent: props.items no es un array válido:', newItems);
        internalChartData.value = {...DEFAULT_CHART_DATA};
        loading.value = false;
        return;
      }
      
      // Actualizar solo si hay items y son un array
      updateChartData();
    }, { deep: true, immediate: true });

    // Observar cambios en props.chartType
    watch(() => props.chartType, () => {
      // No recargar datos, solo asegurarse que loading es false
      loading.value = false;
    });

    // Al montar el componente
    onMounted(() => {
      console.log("SalesChartComponent montado");
      
      // Es importante hacerlo con un pequeño retraso para garantizar que el DOM está listo
      // Usar un retraso más largo para asegurar que todo esté cargado
      setTimeout(() => {
        try {
          console.log("Actualizando datos del gráfico después del timeout");
          updateChartData();
        } catch (error) {
          console.error("Error en updateChartData desde onMounted:", error);
          // Asegurar que loading es false incluso si hay error
          loading.value = false;
        }
      }, 100); // Aumentar el tiempo de espera
    });

    // Opciones para el gráfico
    const chartOptions = computed(() => {
      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Cantidad'
            },
            ticks: {
              precision: 0
            }
          },
          x: {
            title: {
              display: true,
              text: 'Productos'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: props.chartType === 'bar' ? 'Productos más vendidos' : 'Tendencia de ventas'
          }
        }
      };
    });

    // Exponer valores necesarios al template
    return {
      loading,
      safeChartData,
      chartOptions,
      isDataReady
    };
  }
});
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
  margin: 20px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.loading-message, .no-data-message {
  color: #666;
  font-style: italic;
  text-align: center;
  padding: 40px 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.loading-message {
  background-color: #f0f8ff;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
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
