import { VercelRequest, VercelResponse } from '@vercel/node';
import { ConfigHandler } from '../../../src/backend/api/config.js';

const handler = async (req: VercelRequest, res: VercelResponse) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    });
    return;
  }

  try {
    const configHandler = new ConfigHandler();
    
    // Convert Vercel request to standard Request
    const request = new Request(`http://localhost/tenant/${req.query.tenantId}/config`, {
      method: 'GET'
    });

    const response = await configHandler.handleRequest(request);
    const data = await response.json();
    
    // Copy response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(response.status).json(data);

  } catch (error) {
    console.error('Config API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

export default handler;
