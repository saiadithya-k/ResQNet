const { Server } = require('socket.io');
const logger = require('../utils/logger');
const responderSocket = require('./responder.socket');
const incidentSocket = require('./incident.socket');
const hospitalSocket = require('./hospital.socket');
const resourceSocket = require('./resource.socket');
const disasterSocket = require('./disaster.socket');

let ioInstance = null;

function initSocket(httpServer) {
  const allowedOrigins = (process.env.CLIENT_URL || '*').split(',').map(s => s.trim());

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true
    }
  });

  ioInstance = io;

  io.on('connection', (socket) => {
    logger.info(`🔌 Socket client connected: ${socket.id}`);

    // Register domain socket listeners
    responderSocket(io, socket);
    incidentSocket(io, socket);
    hospitalSocket(io, socket);
    resourceSocket(io, socket);
    disasterSocket(io, socket);

    // Join room based on user role or district
    socket.on('join:room', (roomName) => {
      socket.join(roomName);
      logger.info(`Client ${socket.id} joined room ${roomName}`);
    });

    // Real-time GPS location updates from responders
    socket.on('responder:update_location', (data) => {
      io.emit('responder:location_updated', data);
    });

    // Incident status events
    socket.on('incident:update_status', (data) => {
      io.emit('incident:updated', data);
    });

    // Disaster alerts
    socket.on('disaster:trigger', (data) => {
      io.emit('disaster:activated', data);
    });

    socket.on('disconnect', () => {
      logger.info(`❌ Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  return ioInstance;
}

module.exports = {
  initSocket,
  getIO
};
