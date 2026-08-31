require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { initSocket } = require('./src/socket/socket');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO with unified events
const io = initSocket(server);
app.set('io', io);

server.listen(PORT, () => {
  logger.info(`🚨 ResQNet Emergency Intelligence Server running on port ${PORT}`);
  logger.info(`📡 Socket.IO Real-Time Engine active`);
});
