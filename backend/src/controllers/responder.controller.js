const mockState = require('../services/mockData');

exports.getAllResponders = (req, res) => {
  const { status, type, isCommunity } = req.query;
  let list = [...mockState.responders];
  if (status) list = list.filter(r => r.status === status);
  if (type) list = list.filter(r => r.type === type);
  if (isCommunity !== undefined) list = list.filter(r => String(r.isCommunity) === String(isCommunity));
  res.json({ success: true, count: list.length, data: list });
};

exports.updateLocation = (req, res) => {
  const { id } = req.params;
  const { latitude, longitude, status } = req.body;
  const responder = mockState.responders.find(r => r.id === id);
  if (!responder) return res.status(404).json({ success: false, message: 'Responder not found' });

  if (latitude) responder.latitude = latitude;
  if (longitude) responder.longitude = longitude;
  if (status) responder.status = status;

  const io = req.app.get('io');
  if (io) io.emit('responder:location_updated', responder);

  res.json({ success: true, data: responder });
};
