module.exports = (io, socket) => {
  socket.on('incident:create', (incident) => {
    io.emit('incident:created', incident);
  });
  socket.on('incident:assign', (data) => {
    io.emit('incident:assigned', data);
  });
  socket.on('incident:priority', (data) => {
    io.emit('incident:priority_changed', data);
  });
};
