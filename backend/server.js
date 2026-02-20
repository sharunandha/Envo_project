require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dataRoutes = require('./routes/dataRoutes');
const riskRoutes = require('./routes/riskRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware — allow any localhost port for development
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Rate limiting — higher limit to support 50+ dam data loads
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 500,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    mode: 'LIVE DATA',
    dataSources: [
      'Open-Meteo Weather Forecast API',
      'Open-Meteo Land-Surface Soil Moisture',
      'Open-Meteo GloFAS River Discharge',
      'NASA POWER Satellite Precipitation',
      'USGS Earthquake Hazards Program',
    ],
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/data', dataRoutes);
app.use('/api/risk', riskRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const { damLocations } = require('./utils/damLocations');

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Mode: LIVE DATA (all values from real APIs)`);
  console.log(`🏗️  Monitoring ${damLocations.length} dams across India`);
  console.log(`📊 Data sources: Open-Meteo, GloFAS, NASA POWER, USGS`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Allow up to 2 minutes for responses (50+ dams × 6 APIs each on first load)
server.timeout = 120000;
