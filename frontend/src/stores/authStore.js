import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => {
    let savedUser = null;
    try {
      savedUser = JSON.parse(localStorage.getItem('resqnet_user'));
    } catch (e) {}

    const savedToken = localStorage.getItem('token');

    return {
      user: savedUser,
      token: savedToken,
      isAuthenticated: !!savedToken && !!savedUser
    };
  },
  actions: {
    setUser(user, token) {
      this.user = user;
      this.token = token;
      this.isAuthenticated = true;
      localStorage.setItem('token', token);
      localStorage.setItem('resqnet_user', JSON.stringify(user));
    },
    logout() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('resqnet_user');
    }
  }
});
