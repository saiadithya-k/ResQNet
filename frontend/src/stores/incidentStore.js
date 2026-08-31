import { defineStore } from 'pinia';
import api from '../services/api';

export const useIncidentStore = defineStore('incidents', {
  state: () => ({
    incidents: [],
    selectedIncident: null,
    loading: false,
    filterStatus: '',
    filterSeverity: ''
  }),
  getters: {
    criticalIncidents: (state) => state.incidents.filter(i => i.severity === 'CRITICAL'),
    activeIncidentsCount: (state) => state.incidents.filter(i => i.status !== 'RESOLVED').length
  },
  actions: {
    async fetchIncidents() {
      this.loading = true;
      try {
        const res = await api.get('/incidents');
        this.incidents = res.data.data;
        if (!this.selectedIncident && this.incidents.length > 0) {
          this.selectedIncident = this.incidents[0];
        }
      } catch (err) {
        console.error('Failed to load incidents', err);
      } finally {
        this.loading = false;
      }
    },
    selectIncident(incident) {
      this.selectedIncident = incident;
    },
    async updateStatus(id, status, note) {
      try {
        const res = await api.patch(`/incidents/${id}/status`, { status, note });
        const updated = res.data.data;
        const idx = this.incidents.findIndex(i => i.id === id);
        if (idx !== -1) {
          this.incidents[idx] = updated;
          if (this.selectedIncident?.id === id) {
            this.selectedIncident = updated;
          }
        }
        return updated;
      } catch (err) {
        console.error('Failed to update incident status', err);
        throw err;
      }
    },
    addOrUpdateIncident(incident) {
      const idx = this.incidents.findIndex(i => i.id === incident.id);
      if (idx !== -1) {
        this.incidents[idx] = incident;
      } else {
        this.incidents.unshift(incident);
      }
      if (this.selectedIncident?.id === incident.id) {
        this.selectedIncident = incident;
      }
    }
  }
});
