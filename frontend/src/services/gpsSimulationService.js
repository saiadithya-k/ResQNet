import api from './api';
import { useResponderStore } from '../stores/responderStore';

class GpsSimulationService {
  constructor() {
    this.timer = null;
    this.currentIndex = 0;
    this.status = 'IDLE'; // IDLE | RUNNING | PAUSED | COMPLETED
    this.responderId = 'RESP-01'; // Ambulance A12

    // High-resolution tactical road corridor waypoints: Base -> Incident #1042
    this.waypoints = [
      { lat: 13.0780, lng: 80.2650, eta: 5 },
      { lat: 13.0786, lng: 80.2656, eta: 5 },
      { lat: 13.0792, lng: 80.2662, eta: 4 },
      { lat: 13.0798, lng: 80.2668, eta: 4 },
      { lat: 13.0804, lng: 80.2675, eta: 3 },
      { lat: 13.0810, lng: 80.2682, eta: 3 },
      { lat: 13.0815, lng: 80.2689, eta: 2 },
      { lat: 13.0819, lng: 80.2695, eta: 2 },
      { lat: 13.0823, lng: 80.2701, eta: 1 },
      { lat: 13.0827, lng: 80.2707, eta: 0 } // Arrived at Harbour Road Collapse
    ];

    this.listeners = new Set();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    const currentPoint = this.waypoints[this.currentIndex] || this.waypoints[0];
    const data = {
      status: this.status,
      index: this.currentIndex,
      totalSteps: this.waypoints.length,
      currentPoint,
      progress: Math.round((this.currentIndex / (this.waypoints.length - 1)) * 100),
      etaMinutes: currentPoint.eta
    };
    this.listeners.forEach(cb => cb(data));
  }

  async step() {
    if (this.status !== 'RUNNING') return;

    if (this.currentIndex < this.waypoints.length - 1) {
      this.currentIndex++;
      const wp = this.waypoints[this.currentIndex];

      // Update store and backend via API
      try {
        const responderStore = useResponderStore();
        const responder = responderStore.responders.find(r => r.id === this.responderId);

        if (responder) {
          responder.latitude = wp.lat;
          responder.longitude = wp.lng;
          responder.etaMinutes = wp.eta;
          responder.status = 'EN_ROUTE';
        }

        await api.patch(`/responders/${this.responderId}/location`, {
          latitude: wp.lat,
          longitude: wp.lng,
          status: 'EN_ROUTE',
          etaMinutes: wp.eta
        });
      } catch (err) {
        console.warn('GPS simulation location update skipped', err.message);
      }

      this.notify();
    } else {
      // Arrived at destination
      this.stopTimer();
      this.status = 'COMPLETED';
      this.notify();
    }
  }

  start() {
    if (this.status === 'RUNNING') return;
    this.stopTimer();
    this.status = 'RUNNING';
    this.notify();

    // Move every 900ms
    this.timer = setInterval(() => this.step(), 900);
  }

  pause() {
    if (this.status !== 'RUNNING') return;
    this.stopTimer();
    this.status = 'PAUSED';
    this.notify();
  }

  resume() {
    if (this.status !== 'PAUSED') return;
    this.start();
  }

  async reset() {
    this.stopTimer();
    this.currentIndex = 0;
    this.status = 'IDLE';

    const startPoint = this.waypoints[0];

    try {
      const responderStore = useResponderStore();
      const responder = responderStore.responders.find(r => r.id === this.responderId);
      if (responder) {
        responder.latitude = startPoint.lat;
        responder.longitude = startPoint.lng;
        responder.etaMinutes = startPoint.eta;
        responder.status = 'AVAILABLE';
      }

      await api.patch(`/responders/${this.responderId}/location`, {
        latitude: startPoint.lat,
        longitude: startPoint.lng,
        status: 'AVAILABLE',
        etaMinutes: startPoint.eta
      });
    } catch (err) {
      console.warn('GPS reset location update skipped', err.message);
    }

    this.notify();
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  destroy() {
    this.stopTimer();
    this.listeners.clear();
  }
}

export const gpsSimulator = new GpsSimulationService();
