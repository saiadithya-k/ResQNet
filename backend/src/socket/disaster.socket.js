module.exports = (io, socket) => {
  socket.on('disaster:activate', (data) => {
    io.emit('disaster:activated', data);
  });
  socket.on('disaster:update', (data) => {
    io.emit('disaster:updated', data);
  });
  socket.on('alert:broadcast', (data) => {
    io.emit('alert:created', data);
  });
};
