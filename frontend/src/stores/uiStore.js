import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', {
  state: () => ({
    sidebarOpen: true,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false
  }),
  actions: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    setSidebarOpen(open) {
      this.sidebarOpen = open;
    },
    closeSidebarOnMobile() {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        this.sidebarOpen = false;
      }
    }
  }
});
