import { VercelRequest, VercelResponse } from '@vercel/node';
import { AIQueryHandler } from '../../src/backend/api/ai-query.js';

const handler = async (req: VercelRequest, res: VercelResponse) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tenant-ID');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    });
    return;
  }

  try {
    const aiHandler = new AIQueryHandler();
    
    // Convert Vercel request to standard Request
    const request = new Request('http://localhost/api/ai/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': req.headers['x-tenant-id'] as string || ''
      },
      body: JSON.stringify(req.body)
    });

    const response = await aiHandler.handleRequest(request);
    
    // Copy response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Stream the response
    if (response.body) {
      const reader = response.body.getReader();
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } catch (error) {
          console.error('Streaming error:', error);
          res.end();
        }
      };
      pump();
    } else {
      res.status(response.status).end();
    }

  } catch (error) {
    console.error('AI Query API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

export default handler;
