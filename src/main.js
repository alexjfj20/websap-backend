import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initializeDatabase } from './services/dbInitializer'

// Añadir estilos globales
import './assets/global.css'
// Añadir estilos de tema
import './assets/theme.css'

// Importar utilidades de prueba para WhatsApp
import './utils/whatsappSimulator';
import './utils/testReservations';

// Función para formatear fechas
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        // Formato específico con T y Z: "29T05:00:00.000Z/05/2025"
        if (typeof dateString === 'string' && dateString.includes('T') && dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                const day = parts[0].split('T')[0];
                return `${day}/${parts[1]}/${parts[2]}`;
            }
        }
        
        // Formato ISO: "2025-05-29"
        if (typeof dateString === 'string' && dateString.includes('-')) {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        }
        
        // Intentar parsear como objeto Date
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
        
        // Si no se puede formatear, devolver el string original
        return dateString;
    } catch (error) {
        console.error('Error al formatear fecha:', error);
        return dateString;
    }
}

// Inicializar la base de datos antes de montar la aplicación
async function init() {
    try {
        await initializeDatabase();
        console.log('Base de datos inicializada correctamente');
        
        // Crear y montar la aplicación solo después de que la BD esté lista
        const app = createApp(App);
        
        // Registrar filtro global para formatear fechas
        app.config.globalProperties.$filters = {
            formatDate
        };
        
        app.use(router);
        app.mount('#app');
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
    }
}

init();
