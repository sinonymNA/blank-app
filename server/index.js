require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/queue', require('./routes/queue'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/platforms', require('./routes/platforms'));
app.use('/api/generate', require('./routes/generate'));
app.use('/api/webhooks', require('./routes/webhooks'));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize database
    const { initializeDB } = require('./db/supabase');
    await initializeDB();

    app.listen(PORT, () => {
      console.log(`✓ Ampere server running on port ${PORT}`);

      // Start cron jobs
      if (process.env.NODE_ENV !== 'test') {
        const { startCrons } = require('./crons');
        startCrons();
      }
    });
  } catch (error) {
    console.error('✗ Server startup failed:', error.message);
    process.exit(1);
  }
}

startServer();
module.exports = app;
