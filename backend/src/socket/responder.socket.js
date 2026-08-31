module.exports = (io, socket) => {
  socket.on('responder:status', (data) => {
    io.emit('responder:status_changed', data);
  });
  socket.on('responder:fatigue', (data) => {
    io.emit('responder:fatigue_alert', data);
  });
};
