import { VercelRequest, VercelResponse } from '@vercel/node';
import { HealthHandler } from '../src/backend/api/health.js';

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
    const healthHandler = new HealthHandler();
    const response = await healthHandler.handleRequest();
    const data = await response.json();
    
    res.status(200).json(data);

  } catch (error) {
    console.error('Health API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

export default handler;
