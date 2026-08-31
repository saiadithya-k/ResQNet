module.exports = (io, socket) => {
  socket.on('resource:request', (data) => {
    io.emit('resource:requested', data);
  });
  socket.on('resource:approve', (data) => {
    io.emit('resource:approved', data);
  });
  socket.on('resource:dispatch', (data) => {
    io.emit('resource:dispatched', data);
  });
};
