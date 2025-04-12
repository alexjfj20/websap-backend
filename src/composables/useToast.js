import { reactive } from 'vue';

export function useToast() {
  const toast = reactive({
    visible: false,
    message: '',
    type: 'info', // 'info', 'success', 'error', 'warning'
  });

  const showToast = (message, type = 'info', duration = 5000) => {
    toast.message = message;
    toast.type = type;
    toast.visible = true;
    
    setTimeout(() => {
      toast.visible = false;
    }, duration);
  };

  return {
    toast,
    showToast
  };
} 