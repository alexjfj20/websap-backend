<template>
  <div class="admin-tabs">
    <div 
      v-for="tab in tabs" 
      :key="tab.id" 
      class="admin-tab" 
      :class="{ active: modelValue === tab.id }"
      @click="$emit('update:modelValue', tab.id)"
    >
      <span class="tab-icon">{{ tab.icon }}</span>
      {{ tab.label }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'SuperAdminTabs',
  props: {
    modelValue: {
      type: String,
      required: true
    },
    tabs: {
      type: Array,
      required: true,
      default: () => []
    }
  },
  emits: ['update:modelValue']
}
</script>

<style scoped>
.admin-tabs {
  display: flex;
  background-color: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.admin-tab {
  padding: 15px 20px;
  cursor: pointer;
  font-weight: 600;
  flex: 1;
  text-align: center;
  transition: all 0.3s;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.admin-tab:hover {
  background-color: #e9ecef;
}

.admin-tab.active {
  background-color: #28a745;
  color: white;
}

.tab-icon {
  font-size: 1.2em;
}

@media (max-width: 768px) {
  .admin-tabs {
    flex-direction: column;
  }
  
  .admin-tab {
    padding: 12px;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .admin-tab:last-child {
    border-bottom: none;
  }
}
</style>
