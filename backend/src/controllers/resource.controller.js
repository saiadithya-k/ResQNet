const resourceService = require('../services/hospital/resource.service');
const mockState = require('../services/mockData');

/**
 * List all emergency resources across all hospitals/districts
 * GET /api/resources
 */
exports.getResources = async (req, res, next) => {
  try {
    const list = await resourceService.getAllResources(req.query);
    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transfers (mock/operational)
 * GET /api/resources/transfers
 */
exports.getTransfers = (req, res) => {
  res.json({ success: true, count: mockState.resourceTransfers.length, data: mockState.resourceTransfers });
};

/**
 * Request transfer (mock/operational)
 * POST /api/resources/transfers
 */
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
