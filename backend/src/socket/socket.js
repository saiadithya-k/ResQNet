const { Server } = require('socket.io');
const logger = require('../utils/logger');

let ioInstance = null;

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  ioInstance = io;

  io.on('connection', (socket) => {
    logger.info(`🔌 Socket client connected: ${socket.id}`);

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
