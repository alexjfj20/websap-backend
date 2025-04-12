// Crear un simple Event Bus para Vue 3
import { reactive } from 'vue';

class EventBus {
  constructor() {
    this.events = reactive({});
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (!this.events[event]) return;
    
    if (callback) {
      const index = this.events[event].indexOf(callback);
      if (index > -1) {
        this.events[event].splice(index, 1);
      }
    } else {
      this.events[event] = [];
    }
  }

  emit(event, payload) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      callback(payload);
    });
  }
}

export default new EventBus();