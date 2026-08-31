import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: {
      id: 'usr-admin-1',
      name: 'Command Chief Sarah Miller',
      email: 'admin@resqnet.org',
      role: 'ADMIN'
    },
    token: localStorage.getItem('token') || 'demo-token',
    isAuthenticated: true
  }),
  actions: {
    setUser(user, token) {
      this.user = user;
      this.token = token;
      this.isAuthenticated = true;
      localStorage.setItem('token', token);
    },
    logout() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      localStorage.removeItem('token');
    }
  }
});
