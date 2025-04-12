<template>
  <div v-if="show" class="modal-backdrop">
    <div class="modal-container" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>{{ title }}</h3>
      </div>
      <div class="modal-body">
        {{ message }}
      </div>
      <div class="modal-footer">
        <button 
          @click="confirm" 
          class="confirm-button">
          {{ confirmText }}
        </button>
        <button 
          @click="cancel" 
          class="cancel-button">
          {{ cancelText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfirmDialog',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Confirmar'
    },
    message: {
      type: String,
      required: true
    },
    confirmText: {
      type: String,
      default: 'Sí'
    },
    cancelText: {
      type: String,
      default: 'No'
    }
  },
  emits: ['confirm', 'cancel'],
  methods: {
    confirm() {
      this.$emit('confirm');
    },
    cancel() {
      this.$emit('cancel');
    }
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
  animation: modal-appear 0.3s ease-out;
  overflow: hidden;
}

.modal-header {
  padding: 15px;
  background-color: #4CAF50;
  color: white;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.modal-body {
  padding: 20px;
  font-size: 16px;
  line-height: 1.5;
  color: #333;
}

.modal-footer {
  padding: 15px;
  background-color: #f8f8f8;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.confirm-button, .cancel-button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.confirm-button {
  background-color: #4CAF50;
  color: white;
}

.confirm-button:hover {
  background-color: #388E3C;
}

.cancel-button {
  background-color: #f2f2f2;
  color: #333;
}

.cancel-button:hover {
  background-color: #e0e0e0;
}

@keyframes modal-appear {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
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
