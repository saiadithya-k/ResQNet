import { defineStore } from 'pinia';
import api from '../services/api';

export const useHospitalStore = defineStore('hospitals', {
  state: () => ({
    hospitals: [],
    loading: false
  }),
  actions: {
    async fetchHospitals() {
      try {
        const res = await api.get('/hospitals');
        this.hospitals = res.data.data;
      } catch (err) {
        console.error('Failed to load hospitals', err);
      }
    },
    updateHospital(hospital) {
      const idx = this.hospitals.findIndex(h => h.id === hospital.id);
      if (idx !== -1) this.hospitals[idx] = hospital;
    }
  }
});
