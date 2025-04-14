// src/syncBusinessInfo.js

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Importar la función getBusinessInfo del servicio de almacenamiento
import { getBusinessInfo } from './services/storageService';

// Importar configuración (para entorno Node.js)
const apiConfig = require('./config/apiConfig').default;

// URL base de la API
const API_URL = apiConfig ? apiConfig.API_URL : 'http://localhost:3000/api';

// Función para obtener el token de autenticación
async function getAuthToken() {
  try {
    // Credenciales de administrador
    const credentials = {
      email: 'admin@example.com',
      password: 'admin123'
    };
    
    // Iniciar sesión para obtener el token
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    
    if (response.data && response.data.token) {
      return response.data.token;
    } else {
      throw new Error('No se pudo obtener el token de autenticación');
    }
  } catch (error) {
    console.error('Error al obtener el token de autenticación:', error.message);
    throw error;
  }
}

// Función para ejecutar la migración
async function runMigration(token) {
  try {
    const response = await axios.get(`${API_URL}/restaurantes/migrate/add-informacion-pago`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Resultado de la migración:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al ejecutar la migración:', error.message);
    throw error;
  }
}

// Función para obtener la información del negocio
async function getBusinessInfo() {
  try {
    // Información predeterminada del negocio
    return {
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
    };
  } catch (error) {
    console.error('Error al obtener información del negocio:', error.message);
    throw error;
  }
}

// Función para obtener el usuario actual
async function getCurrentUser(token) {
  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data.user;
  } catch (error) {
    console.error('Error al obtener el usuario actual:', error.message);
    throw error;
  }
}

// Función para actualizar la información del restaurante
async function updateRestaurante(token, restauranteId, data) {
  try {
    const response = await axios.put(`${API_URL}/restaurantes/${restauranteId}`, data, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Restaurante actualizado:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar el restaurante:', error.message);
    throw error;
  }
}

// Función principal
async function main() {
  try {
    console.log('Iniciando sincronización de información del negocio...');
    
    // Obtener el token de autenticación
    const token = await getAuthToken();
    console.log('Token de autenticación obtenido');
    
    // Ejecutar la migración
    await runMigration(token);
    console.log('Migración ejecutada');
    
    // Obtener el usuario actual
    const user = await getCurrentUser(token);
    console.log('Usuario actual:', user);
    
    if (!user.restaurante_id) {
      console.error('El usuario no tiene un restaurante asignado');
      return;
    }
    
    // Obtener la información del negocio
    const businessInfo = await getBusinessInfo();
    console.log('Información del negocio obtenida:', businessInfo);
    
    // Preparar los datos para actualizar el restaurante
    const restauranteData = {
      nombre: businessInfo.name,
      descripcion: businessInfo.description,
      direccion: businessInfo.address,
      telefono: businessInfo.contact,
      logo: businessInfo.logo,
      informacion_pago: JSON.stringify(businessInfo.paymentInfo)
    };
    
    // Actualizar el restaurante
    await updateRestaurante(token, user.restaurante_id, restauranteData);
    console.log('Información del negocio sincronizada con éxito');
  } catch (error) {
    console.error('Error en el proceso de sincronización:', error.message);
  }
}

// Ejecutar la función principal
main();
