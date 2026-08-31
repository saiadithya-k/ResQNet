module.exports = (io, socket) => {
  socket.on('hospital:capacity', (data) => {
    io.emit('hospital:capacity_updated', data);
  });
  socket.on('hospital:incoming', (data) => {
    io.emit('hospital:patient_incoming', data);
  });
};
