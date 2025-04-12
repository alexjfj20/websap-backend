import { createApp, h, reactive } from 'vue';

// Estado global del diálogo usando reactive para asegurar reactividad
export const dialogState = reactive({
  show: false,
  title: 'Mensaje',
  message: '',
  confirmText: 'Aceptar',
  cancelText: 'Cancelar',
  showCancel: false,
  resolvePromise: null
});

// Componente de modal para confirmaciones
const ModalComponent = {
  props: {
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
      default: 'Aceptar'
    },
    cancelText: {
      type: String,
      default: 'Cancelar'
    },
    showCancel: {
      type: Boolean,
      default: true
    }
  },
  emits: ['confirm', 'cancel'],
  template: `
    <div class="dialog-overlay" v-if="dialogState.show">
      <div class="dialog-container">
        <div class="dialog-header">
          <h3>{{ dialogState.title }}</h3>
        </div>
        <div class="dialog-content">
          <p>{{ dialogState.message }}</p>
        </div>
        <div class="dialog-footer">
          <button v-if="dialogState.showCancel" @click="handleCancel" class="dialog-button cancel-button">{{ dialogState.cancelText }}</button>
          <button @click="handleConfirm" class="dialog-button confirm-button">{{ dialogState.confirmText }}</button>
        </div>
      </div>
    </div>
  `,
  mounted() {
    // Agregar estilo inline si no está en el DOM
    const style = document.createElement('style');
    style.innerHTML = `
      .dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }
      .dialog-container {
        background-color: #fff;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        overflow: hidden;
        animation: dialogFadeIn 0.3s;
      }
      .dialog-header {
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
      }
      .dialog-header h3 {
        margin: 0;
        color: #333;
      }
      .dialog-content {
        padding: 20px;
      }
      .dialog-footer {
        padding: 15px 20px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        border-top: 1px solid #eee;
      }
      .dialog-button {
        padding: 10px 20px;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }
      .confirm-button {
        background-color: #4CAF50;
        color: white;
      }
      .confirm-button:hover {
        background-color: #45a049;
      }
      .cancel-button {
        background-color: #f1f1f1;
        color: #333;
      }
      .cancel-button:hover {
        background-color: #e1e1e1;
      }
      @keyframes dialogFadeIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  },
  methods: {
    handleConfirm() {
      if (dialogState.resolvePromise) {
        dialogState.resolvePromise(true);
        dialogState.resolvePromise = null;
      }
      dialogState.show = false;
    },
    handleCancel() {
      if (dialogState.resolvePromise) {
        dialogState.resolvePromise(false);
        dialogState.resolvePromise = null;
      }
      dialogState.show = false;
    }
  }
};

/**
 * Muestra un diálogo de confirmación
 * @param {String} message Mensaje a mostrar
 * @param {Object} options Opciones adicionales (title, confirmText, cancelText)
 * @returns {Promise<Boolean>} Promesa que se resuelve con true si se confirma, false si se cancela
 */
export function confirm(message, options = {}) {
  return new Promise((resolve) => {
    dialogState.show = true;
    dialogState.message = message;
    dialogState.title = options.title || 'Confirmar';
    dialogState.confirmText = options.confirmText || 'Aceptar';
    dialogState.cancelText = options.cancelText || 'Cancelar';
    dialogState.showCancel = true;
    dialogState.resolvePromise = resolve;
  });
}

/**
 * Muestra un mensaje de alerta
 * @param {String} message Mensaje a mostrar
 * @param {Object} options Opciones adicionales (title, confirmText)
 * @returns {Promise<void>} Promesa que se resuelve cuando se cierra la alerta
 */
export function alert(message, options = {}) {
  return new Promise((resolve) => {
    dialogState.show = true;
    dialogState.message = message;
    dialogState.title = options.title || 'Mensaje';
    dialogState.confirmText = options.confirmText || 'Aceptar';
    dialogState.showCancel = false;
    dialogState.resolvePromise = resolve;
  });
}

/**
 * Maneja el evento de confirmación del diálogo
 */
export function handleConfirm() {
  if (dialogState.resolvePromise) {
    dialogState.resolvePromise(true);
    dialogState.resolvePromise = null;
  }
  dialogState.show = false;
}

/**
 * Maneja el evento de cancelación del diálogo
 */
export function handleCancel() {
  if (dialogState.resolvePromise) {
    dialogState.resolvePromise(false);
    dialogState.resolvePromise = null;
  }
  dialogState.show = false;
}

// Exportar un objeto por defecto para compatibilidad con importaciones anteriores
export default {
  state: dialogState,
  confirm,
  alert,
  handleConfirm,
  handleCancel
};
