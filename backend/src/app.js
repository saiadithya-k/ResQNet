const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const errorMiddleware = require('./middleware/error.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const citizenRoutes = require('./routes/citizen.routes');
const incidentRoutes = require('./routes/incident.routes');
const aiRoutes = require('./routes/ai.routes');
const responderRoutes = require('./routes/responder.routes');
const communityRoutes = require('./routes/community.routes');
const hospitalRoutes = require('./routes/hospital.routes');
const resourceRoutes = require('./routes/resource.routes');
const transferRoutes = require('./routes/transfer.routes');
const reconciliationRoutes = require('./routes/reconciliation.routes');
const dispatchRoutes = require('./routes/dispatch.routes');
const routeRoutes = require('./routes/route.routes');
const survivorRoutes = require('./routes/survivor.routes');
const disasterRoutes = require('./routes/disaster.routes');
const predictionRoutes = require('./routes/prediction.routes');
const alertRoutes = require('./routes/alert.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const evidenceRoutes = require('./routes/evidence.routes');
const auditRoutes = require('./routes/audit.routes');

const app = express();

// Security & Parsing Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'ResQNet Emergency Platform',
    timestamp: new Date().toISOString()
  });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/citizens', citizenRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/responders', responderRoutes);
app.use('/api/community-responders', communityRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/resource-transfers', transferRoutes);
app.use('/api/reconciliation', reconciliationRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/survivors', survivorRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/audit', auditRoutes);

// Error Handling Middleware
app.use(errorMiddleware);

module.exports = app;
