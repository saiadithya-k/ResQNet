import { defineStore } from 'pinia';
import api from '../services/api';

export const useDisasterStore = defineStore('disaster', {
  state: () => ({
    isDisasterMode: false,
    activeDisaster: null,
    zones: [],
    shelters: [],
    roadBlocks: [],
    simulationResults: null,
    loading: false
  }),
  actions: {
    async fetchStatus() {
      try {
        const res = await api.get('/disasters/status');
        this.isDisasterMode = res.data.data.disasterMode;
        this.activeDisaster = res.data.data.activeDisaster;
        this.zones = res.data.data.zones;
        this.shelters = res.data.data.shelters;

        const rbRes = await api.get('/routes/roadblocks');
        this.roadBlocks = rbRes.data.data;
      } catch (err) {
        console.error('Failed to load disaster status', err);
      }
    },
    async toggleDisasterMode(activate, params = {}) {
      try {
        const res = await api.post('/disasters/toggle', { activate, ...params });
        this.isDisasterMode = res.data.data.disasterMode;
        this.activeDisaster = res.data.data.activeDisaster;
      } catch (err) {
        console.error('Failed to toggle disaster mode', err);
      }
    },
    async runSimulation(payload) {
      this.loading = true;
      try {
        const res = await api.post('/disasters/simulate', payload);
        this.simulationResults = res.data.data;
        return this.simulationResults;
      } catch (err) {
        console.error('Failed to run simulation', err);
      } finally {
        this.loading = false;
      }
    }
  }
});
