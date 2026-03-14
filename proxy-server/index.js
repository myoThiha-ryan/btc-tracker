const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 4000;
const PROXY_SECRET = process.env.PROXY_SECRET;
const BINANCE_TARGET = process.env.BINANCE_TESTNET === 'true'
  ? 'https://testnet.binance.vision'
  : 'https://api.binance.com';

if (!PROXY_SECRET) {
  console.error('ERROR: PROXY_SECRET env var is required');
  process.exit(1);
}

// Validate every incoming request has the correct shared secret
app.use((req, res, next) => {
  if (req.headers['x-proxy-secret'] !== PROXY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Strip the secret before forwarding to Binance
  delete req.headers['x-proxy-secret'];
  next();
});

// Forward everything to Binance
app.use('/', createProxyMiddleware({
  target: BINANCE_TARGET,
  changeOrigin: true,
  secure: true,
  on: {
    error: (err, req, res) => {
      console.error('[proxy] Error:', err.message);
      res.status(502).json({ error: 'Proxy error', detail: err.message });
    },
  },
}));

app.listen(PORT, () => {
  console.log(`BTC Tracker proxy running on port ${PORT}`);
  console.log(`Forwarding to: ${BINANCE_TARGET}`);
});
