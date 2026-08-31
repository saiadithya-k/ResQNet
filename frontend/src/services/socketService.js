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

    socket = io({
      autoConnect: true,
      reconnection: true
    });

    socket.on('connect', () => {
      console.log('📡 Connected to ResQNet Real-Time Engine (Socket.IO ID:', socket.id, ')');
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

    socket.on('responder:location_updated', (responder) => {
      const responderStore = useResponderStore();
      responderStore.updateResponderLocation(responder);
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

    return socket;
  }

  function getSocket() {
    return socket;
  }

  return {
    connect,
    getSocket
  };
}
