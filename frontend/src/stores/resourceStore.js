import { defineStore } from 'pinia';
import api from '../services/api';

export const useResourceStore = defineStore('resources', {
  state: () => ({
    resources: [],
    transfers: []
  }),
  actions: {
    async fetchResources() {
      try {
        const res = await api.get('/resources');
        this.resources = res.data.data;
        const transRes = await api.get('/resources/transfers');
        this.transfers = transRes.data.data;
      } catch (err) {
        console.error('Failed to load resources', err);
      }
    },
    async requestTransfer(payload) {
      const res = await api.post('/resources/transfers', payload);
      this.transfers.unshift(res.data.data);
      return res.data;
    }
  }
});
