<template>
  <div>
    <!-- Alert Dialog -->
    <div v-if="dialogState.show" class="dialog-overlay">
      <div class="dialog-container">
        <div class="dialog-header">
          <h3>{{ dialogState.title }}</h3>
        </div>
        <div class="dialog-content">
          <p>{{ dialogState.message }}</p>
        </div>
        <div class="dialog-footer">
          <button 
            v-if="dialogState.showCancel" 
            @click="handleCancel" 
            class="dialog-button cancel-button"
          >
            {{ dialogState.cancelText }}
          </button>
          <button 
            @click="handleConfirm" 
            class="dialog-button confirm-button"
          >
            {{ dialogState.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { dialogState, handleConfirm, handleCancel } from '../services/dialogService';

export default {
  name: 'DialogContainer',
  setup() {
    return {
      dialogState,
      handleConfirm,
      handleCancel
    };
  }
};
</script>

<style>
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
</style>
