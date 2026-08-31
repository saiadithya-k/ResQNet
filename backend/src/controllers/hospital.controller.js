const mockState = require('../services/mockData');

exports.getAllHospitals = (req, res) => {
  res.json({ success: true, count: mockState.hospitals.length, data: mockState.hospitals });
};

exports.updateCapacity = (req, res) => {
  const hospital = mockState.hospitals.find(h => h.id === req.params.id);
  if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });

  const { availableBeds, availableIcu, availableTrauma, isAccepting } = req.body;
  if (availableBeds !== undefined) hospital.availableBeds = availableBeds;
  if (availableIcu !== undefined) hospital.availableIcu = availableIcu;
  if (availableTrauma !== undefined) hospital.availableTrauma = availableTrauma;
  if (isAccepting !== undefined) hospital.isAccepting = isAccepting;

  const io = req.app.get('io');
  if (io) io.emit('hospital:capacity_updated', hospital);

  res.json({ success: true, data: hospital });
};
