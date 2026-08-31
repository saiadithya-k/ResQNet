const mockState = require('../services/mockData');

exports.getResources = (req, res) => {
  res.json({ success: true, count: mockState.resources.length, data: mockState.resources });
};

exports.getTransfers = (req, res) => {
  res.json({ success: true, count: mockState.resourceTransfers.length, data: mockState.resourceTransfers });
};

exports.requestTransfer = (req, res) => {
  const { resourceName, fromDistrict, toDistrict, quantity } = req.body;
  const newTransfer = {
    id: `TRANS-${Date.now().toString().slice(-4)}`,
    resourceName: resourceName || 'Emergency Units',
    fromDistrict: fromDistrict || 'District B',
    toDistrict: toDistrict || 'Central Zone',
    quantity: quantity || 2,
    status: 'IN_TRANSIT',
    etaMinutes: 10,
    requestedAt: new Date().toLocaleTimeString().slice(0, 5),
    approvedAt: new Date().toLocaleTimeString().slice(0, 5)
  };
  mockState.resourceTransfers.unshift(newTransfer);

  const io = req.app.get('io');
  if (io) io.emit('resource:requested', newTransfer);

  res.status(201).json({ success: true, data: newTransfer });
};
