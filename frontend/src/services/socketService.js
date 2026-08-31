import { io } from 'socket.io-client';
import { useIncidentStore } from '../stores/incidentStore';
import { useResponderStore } from '../stores/responderStore';
import { useDisasterStore } from '../stores/disasterStore';
import { useHospitalStore } from '../stores/hospitalStore';
import { useNotificationStore } from '../stores/notificationStore';

let socket = null;

export function useSocketService() {
  function connect() {
    if (socket) return socket;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || undefined;

    socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true
    });

    socket.on('connect', () => {
      console.log(' Connected to ResQNet Real-Time Engine (Socket.IO ID:', socket.id, ')');
    });

    socket.on('incident:created', (incident) => {
      const incidentStore = useIncidentStore();
      const notificationStore = useNotificationStore();
      incidentStore.addOrUpdateIncident(incident);
      notificationStore.addNotification({
        title: `🚨 NEW INCIDENT: ${incident.title}`,
        message: `Severity: ${incident.severity} | Priority: ${incident.priorityScore}`,
        type: 'INCIDENT'
      });
    });

    socket.on('incident:updated', (incident) => {
      const incidentStore = useIncidentStore();
      incidentStore.addOrUpdateIncident(incident);
    });

    socket.on('incident:assigned', (data) => {
      const incidentStore = useIncidentStore();
      const responderStore = useResponderStore();
      const notificationStore = useNotificationStore();
      if (data.incident) {
        incidentStore.addOrUpdateIncident(data.incident);
      }
      if (data.responder) {
        responderStore.updateResponder(data.responder);
      }
      notificationStore.addNotification({
        title: `⚡ UNIT DISPATCHED: ${data.responder?.name || 'Tactical Unit'}`,
        message: `Assigned to ${data.incident?.title || ('Incident #' + (data.incident?.id || ''))}`,
        type: 'DISPATCH'
      });
    });

    socket.on('incident:priority_changed', (data) => {
      const incidentStore = useIncidentStore();
      if (data && data.incidentId) {
        const inc = incidentStore.incidents.find(i => i.id === data.incidentId);
        if (inc) {
          inc.priorityScore = data.priorityScore || data.score || inc.priorityScore;
          if (data.severity) inc.severity = data.severity;
        }
      }
    });

    socket.on('responder:location_updated', (responder) => {
      const responderStore = useResponderStore();
      responderStore.updateResponderLocation(responder);
    });

    socket.on('responder:status_changed', (data) => {
      const responderStore = useResponderStore();
      if (data.responder) {
        responderStore.updateResponder(data.responder);
      } else if (data.responderId) {
        const r = responderStore.responders.find(u => u.id === data.responderId);
        if (r) {
          r.status = data.status || r.status;
        }
      }
    });

    socket.on('hospital:capacity_updated', (hospital) => {
      const hospitalStore = useHospitalStore();
      hospitalStore.updateHospital(hospital);
    });

    socket.on('disaster:activated', (data) => {
      const disasterStore = useDisasterStore();
      const notificationStore = useNotificationStore();
      disasterStore.isDisasterMode = data.active;
      disasterStore.activeDisaster = data.disaster;
      notificationStore.addNotification({
        title: data.active ? '🚨 DISASTER MODE ACTIVATED' : 'Disaster Stand-Down',
        message: data.disaster?.type || 'Operational State Changed',
        type: 'ALERT'
      });
    });

    socket.on('disaster:updated', (data) => {
      const disasterStore = useDisasterStore();
      if (data.disasterMode !== undefined) disasterStore.isDisasterMode = data.disasterMode;
      if (data.activeDisaster !== undefined) disasterStore.activeDisaster = data.activeDisaster;
    });

    socket.on('alert:created', (alert) => {
      const notificationStore = useNotificationStore();
      notificationStore.addNotification({
        title: alert.title || '🚨 EMERGENCY ALERT',
        message: alert.message || alert.description || 'Emergency notification broadcasted',
        type: 'ALERT'
      });
    });

    return socket;
  }

  function getSocket() {
    return socket;
  }

  function on(event, handler) {
    if (!socket) connect();
    if (socket) socket.on(event, handler);
  }

  function off(event, handler) {
    if (socket) socket.off(event, handler);
  }

  return {
    connect,
    getSocket,
    on,
    off
  };
}

export const socketService = useSocketService();
export default socketService;
