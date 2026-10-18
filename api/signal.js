// Vercel Serverless Function for POST /api/signal and GET /api/signal
// Allows external Python analysis scripts, Pine Script webhooks, or automated traders to push signals

// Global memory cache in warm serverless instances
let globalSignals = [];

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      
      const signalRecord = {
        id: 'sig_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        symbol: body.symbol || 'BTCUSD',
        action: (body.action || 'HOLD').toUpperCase(),
        price: Number(body.price) || 0,
        tp1: Number(body.tp1) || 0,
        tp2: Number(body.tp2) || 0,
        sl: Number(body.sl) || 0,
        confidence: Number(body.confidence) || 0,
        timestamp: body.timestamp || new Date().toISOString(),
        indicators: body.indicators || {},
        source: body.source || 'python_script',
      };

      globalSignals.unshift(signalRecord);
      if (globalSignals.length > 100) globalSignals.pop();

      return res.status(200).json({
        success: true,
        message: 'Signal accepted successfully',
        signal: signalRecord,
      });
    } catch (err) {
      return res.status(400).json({ error: 'Failed to process signal: ' + err.message });
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      latest: globalSignals[0] || null,
      signals: globalSignals,
      count: globalSignals.length,
      serverTime: new Date().toISOString(),
    });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
