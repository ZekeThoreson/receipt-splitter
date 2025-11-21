// server.cjs

// 1. Load environment variables
require('dotenv').config();

// 2. Normalize / trim Veryfi credentials
const clientId = process.env.VERYFI_CLIENT_ID?.trim();
const username = process.env.VERYFI_USERNAME?.trim();
const apiKey   = process.env.VERYFI_API_KEY?.trim();

// Debug print to confirm server has them
if (import.meta.env.DEV) {
  console.log('Server env check:', {
    clientIdPreview: clientId ? clientId.slice(0, 4) + '...' : null,
    username,
    apiKeySet: !!apiKey,
  });
}

// 3. Import dependencies (DO NOT DUPLICATE these)
const express = require('express');
const cors = require('cors');

// 4. Setup express
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
}));

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// server.cjs (keep the env + imports from before)

// Make sure this is ABOVE your routes:
app.use(express.json({ limit: '15mb' })); // allow big base64 strings

app.post('/api/veryfi', async (req, res) => {
  try {
    if (import.meta.env.DEV) {
      console.log('Received /api/veryfi request with body keys:', Object.keys(req.body));
    }

    const { file_data } = req.body;

    if (!file_data) {
      console.error('No file_data provided');
      return res.status(400).json({ error: 'No file_data provided' });
    }

    if (!clientId || !username || !apiKey) {
      console.error('Veryfi credentials missing on server');
      return res.status(500).json({ error: 'Veryfi credentials not configured on server' });
    }
    if (import.meta.env.DEV) {
      console.log('Sending to Veryfi with:', {
        clientIdPreview: clientId.slice(0, 4) + '...',
        username,
        fileDataPreview: file_data.slice(0, 30) + '...', // just to confirm it's there
      });
    }
    
    const payload = {
      file_data,          // can be raw base64 or data: URI; Veryfi accepts both
      file_name: 'receipt.jpg',
    };

    const veryfiResponse = await fetch('https://api.veryfi.com/api/v8/partner/documents', {
      method: 'POST',
      headers: {
        'CLIENT-ID': clientId,
        'AUTHORIZATION': `apikey ${username}:${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await veryfiResponse.json().catch(() => ({}));

    if (!veryfiResponse.ok) {
      console.error('Veryfi error:', veryfiResponse.status, data);
      return res.status(veryfiResponse.status).json(data);
    }

    return res.json(data);

  } catch (err) {
    console.error('Server Veryfi proxy error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// 6. Start the server
const PORT = 5174;
if (import.meta.env.DEV) {
  app.listen(PORT, () => {
    console.log(`Veryfi proxy server listening on http://localhost:${PORT}`);
  });
}
