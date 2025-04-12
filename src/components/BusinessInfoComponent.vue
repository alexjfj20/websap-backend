<template>
  <div>
    <h2>Business Information</h2>
    
    <!-- Botón para mostrar/ocultar información adicional -->
    <button @click="toggleAdditionalInfo" class="toggle-button">
      {{ showAdditionalInfo ? 'Ocultar información adicional' : 'Mostrar información adicional' }}
    </button>
    
    <form @submit.prevent="saveBusinessInfo">
      <div>
        <label for="business-name">Restaurant Name:</label>
        <input type="text" id="business-name" v-model="businessInfo.name" required>
      </div>
      <div>
        <label for="business-logo">Logo:</label>
        <input type="file" id="business-logo" @change="onLogoChange">
        <img v-if="businessInfo.logo" :src="businessInfo.logo" alt="Business Logo" style="max-width: 100px;">
      </div>
      <div>
        <label for="business-contact">Contact:</label>
        <input type="text" id="business-contact" v-model="businessInfo.contact">
      </div>
      <div>
        <label for="business-description">Description:</label>
        <textarea id="business-description" v-model="businessInfo.description"></textarea>
      </div>
      
      <!-- Información adicional que se puede mostrar/ocultar -->
      <div v-if="showAdditionalInfo" class="additional-info">
        <h3>Información Adicional</h3>
        <div>
          <label for="business-address">Address:</label>
          <input type="text" id="business-address" v-model="businessInfo.address">
        </div>
        <div>
          <label for="business-email">Email:</label>
          <input type="email" id="business-email" v-model="businessInfo.email">
        </div>
        <div>
          <label for="primary-color">Primary Color:</label>
          <input type="color" id="primary-color" v-model="businessInfo.primaryColor">
        </div>
        <div>
          <label for="secondary-color">Secondary Color:</label>
          <input type="color" id="secondary-color" v-model="businessInfo.secondaryColor">
        </div>
        <div>
          <label for="business-hours">Horario de Atención:</label>
          <input type="text" id="business-hours" v-model="businessInfo.hours" 
                 placeholder="Ej: Lun-Vie: 9am-5pm, Sáb-Dom: 10am-3pm">
        </div>
        <div>
          <label for="business-specialty">Especialidad:</label>
          <input type="text" id="business-specialty" v-model="businessInfo.specialty">
        </div>
        <div>
          <label for="business-delivery">¿Ofrece delivery?</label>
          <select id="business-delivery" v-model="businessInfo.delivery">
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>
      
      <button type="submit">Save Information</button>
    </form>

    <h3>Preview</h3>
    <div style="border: 1px solid #ccc; padding: 10px;">
      <img v-if="businessInfo.logo" :src="businessInfo.logo" alt="Business Logo" style="max-width: 100px;">
      <h2>{{ businessInfo.name }}</h2>
      <p>{{ businessInfo.description }}</p>
      <p>Contact: {{ businessInfo.contact }}</p>
      
      <!-- Vista previa de información adicional cuando está visible -->
      <div v-show="showAdditionalInfo" class="preview-additional-info">
        <h4>Información Adicional</h4>
        <p v-if="businessInfo.address">Dirección: {{ businessInfo.address }}</p>
        <p v-if="businessInfo.email">Email: {{ businessInfo.email }}</p>
        <p v-if="businessInfo.hours">Horario: {{ businessInfo.hours }}</p>
        <p v-if="businessInfo.specialty">Especialidad: {{ businessInfo.specialty }}</p>
        <p v-if="businessInfo.delivery">Delivery: {{ businessInfo.delivery === 'si' ? 'Disponible' : 'No disponible' }}</p>
        
        <div class="color-sample" 
             :style="{backgroundColor: businessInfo.primaryColor, color: businessInfo.secondaryColor}">
          Muestra de colores (Fondo primario, Texto secundario)
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { confirm } from '../services/dialogService';

export default {
  name: 'BusinessInfoComponent',
  data() {
    return {
      businessInfo: JSON.parse(localStorage.getItem('businessInfo')) || {
        name: '',
        logo: '',
        contact: '',
        description: '',
        address: '',
        email: '',
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
        hours: '',
        specialty: '',
        delivery: 'no'
      },
      showAdditionalInfo: false
    };
  },
  methods: {
    onLogoChange(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.businessInfo.logo = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },
    async saveBusinessInfo() {
      localStorage.setItem('businessInfo', JSON.stringify(this.businessInfo));
      alert('Business information saved!');
    },
    toggleAdditionalInfo() {
      this.showAdditionalInfo = !this.showAdditionalInfo;
    }
  }
};
</script>

<style scoped>
form div {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, textarea, select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

button[type="submit"] {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button[type="submit"]:hover {
  background-color: #0056b3;
}

.toggle-button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 20px;
  font-weight: bold;
}

.toggle-button:hover {
  background-color: #45a049;
}

.additional-info {
  background-color: #f9f9f9;
  border-left: 4px solid #4CAF50;
  padding: 15px;
  margin: 20px 0;
  border-radius: 4px;
}

.preview-additional-info {
  margin-top: 15px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.color-sample {
  padding: 15px;
  margin-top: 10px;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
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
