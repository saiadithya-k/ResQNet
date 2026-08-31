import { defineStore } from 'pinia';

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    alerts: [
      { id: '1', title: '️ FLASH FLOOD ALERT', message: 'Riverbank South district experiencing sudden surge.', type: 'ALERT', time: '10:10' }
    ]
  }),
  actions: {
    addNotification(item) {
      this.alerts.unshift({ id: Date.now().toString(), time: new Date().toLocaleTimeString().slice(0, 5), ...item });
    }
  }
});
