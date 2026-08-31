import { defineStore } from 'pinia';
import api from '../services/api';

export const useResponderStore = defineStore('responders', {
  state: () => ({
    responders: [],
    selectedResponder: null,
    loading: false
  }),
  getters: {
    availableUnits: (state) => state.responders.filter(r => r.status === 'AVAILABLE'),
    communityResponders: (state) => state.responders.filter(r => r.isCommunity)
  },
  actions: {
    selectResponder(responder) {
      this.selectedResponder = responder;
    },
    async fetchResponders() {
      try {
        const res = await api.get('/responders');
        this.responders = res.data.data;
      } catch (err) {
        console.error('Failed to load responders', err);
      }
    },
    async dispatch(incidentId, responderId) {
      try {
        const res = await api.post('/dispatch', { incidentId, responderId });
        await this.fetchResponders();
        return res.data;
      } catch (err) {
        console.error('Dispatch failed', err);
        throw err;
      }
    },
    updateResponderLocation(responder) {
      const idx = this.responders.findIndex(r => r.id === responder.id);
      if (idx !== -1) {
        this.responders[idx] = responder;
      }
    }
  }
});
