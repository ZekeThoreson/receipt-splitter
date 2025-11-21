// api/veryfi.js
// Vercel Serverless Function for Veryfi proxy

export default async function handler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      // 1. Read body and validate
      const { file_data } = req.body || {};
  
      if (!file_data) {
        return res.status(400).json({ error: 'Missing file_data in request body' });
      }
  
      // 2. Read Veryfi credentials from server-side env
      const clientId = process.env.VITE_VERYFI_CLIENT_ID?.trim();
      const username = process.env.VITE_VERYFI_USERNAME?.trim();
      const apiKey   = process.env.VITE_VERYFI_API_KEY?.trim();
  
      if (!clientId || !username || !apiKey) {
        console.error('Veryfi credentials missing on server', {
          hasClientId: !!clientId,
          hasUsername: !!username,
          hasApiKey: !!apiKey,
        });
        return res
          .status(500)
          .json({ error: 'Veryfi credentials not configured on server' });
      }
  
      // 3. Build payload for Veryfi
      const payload = {
        file_data,      // base64 or data URL
        file_name: 'receipt.jpg',
      };
  
      // 4. Call Veryfi API
      const veryfiRes = await fetch(
        'https://api.veryfi.com/api/v8/partner/documents',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ACCEPT: 'application/json',
            'CLIENT-ID': clientId,
            AUTHORIZATION: `apikey ${username}:${apiKey}`,
          },
          body: JSON.stringify(payload),
        }
      );
  
      // 5. Handle Veryfi errors cleanly
      if (!veryfiRes.ok) {
        let errBody = null;
        try {
          errBody = await veryfiRes.json();
        } catch {
          errBody = await veryfiRes.text();
        }
  
        console.error('Veryfi API error:', veryfiRes.status, errBody);
  
        if (veryfiRes.status === 401) {
          return res
            .status(401)
            .json({ status: 'fail', message: 'Not Authorized' });
        }
  
        return res.status(400).json({
          error: 'Veryfi API request failed',
          statusCode: veryfiRes.status,
          details: errBody,
        });
      }
  
      // 6. Success: pass Veryfi JSON straight through
      const data = await veryfiRes.json();
      return res.status(200).json(data);
    } catch (err) {
      console.error('Server Veryfi proxy error:', err);
      return res.status(500).json({
        error: 'Internal server error',
        details: err.message,
      });
    }
  }
  