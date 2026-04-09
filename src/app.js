const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/v1/', limiter);

// Body parsing — raw body needed for Stripe webhooks
app.use('/v1/subscription/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
const authRoutes = require('./routes/auth.routes');
app.use('/v1/auth', authRoutes);
const serverRoutes = require('./routes/server.routes');
app.use('/v1/servers', serverRoutes);
const connectionRoutes = require('./routes/connection.routes');
app.use('/v1/connection', connectionRoutes);
const subscriptionRoutes = require('./routes/subscription.routes');
app.use('/v1/subscription', subscriptionRoutes);

// Error handler
app.use(errorHandler);

module.exports = app;
