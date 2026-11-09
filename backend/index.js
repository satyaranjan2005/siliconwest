const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./src/routes/auth');
const clubsRoutes = require('./src/routes/clubs');
const eventsRoutes = require('./src/routes/events');
const registrationsRoutes = require('./src/routes/registrations');
const adminRoutes = require('./src/routes/admin');
const statsRoutes = require('./src/routes/stats');
const usersRoutes = require('./src/routes/users');
const invitationsRoutes = require('./src/routes/invitations');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true, // Allow frontend during development
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Silicon West Event & Club Management API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/invitations', invitationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Upload payload is too large. Please upload smaller images or attachments.',
      message: err.message,
    });
  }
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error occurred.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT,"0.0.0.0", () => {
  console.log(`=======================================================`);
  console.log(`🚀 Silicon West API server running on http://localhost:${PORT}`);
  console.log(`📚 Database connected via PostgreSQL on Docker port 5433`);
  console.log(`=======================================================`);
});
