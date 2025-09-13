// MVP-006 Server with Persona Service
import { ChatboxServer } from './src/backend/server.js';

const server = new ChatboxServer();

// Simple HTTP server simulation for MVP-006
const http = require('http');
const url = require('url');

const PORT = 3000;

const httpServer = http.createServer(async (req, res) => {
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tenant-ID');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Parse request
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    
    // Collect request body for POST requests
    let body = '';
    if (req.method === 'POST') {
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          // Create Request object
          const request = new Request(`http://localhost:${PORT}${req.url}`, {
            method: req.method,
            headers: {
              'Content-Type': req.headers['content-type'] || 'application/json',
              'X-Tenant-ID': req.headers['x-tenant-id'] || ''
            },
            body: body || undefined
          });

          // Handle request with ChatboxServer
          const response = await server.handleRequest(request);
          
          // Set response headers
          res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
          
          // Handle streaming response (SSE)
          if (response.headers.get('content-type')?.includes('text/event-stream')) {
            const reader = response.body?.getReader();
            if (reader) {
              const decoder = new TextDecoder();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(decoder.decode(value));
              }
            }
          } else {
            // Handle regular response
            const responseText = await response.text();
            res.write(responseText);
          }
          
          res.end();
        } catch (error) {
          console.error('Request handling error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }));
          res.end();
        }
      });
    } else {
      // Handle GET requests
      try {
        const request = new Request(`http://localhost:${PORT}${req.url}`, {
          method: req.method,
          headers: {
            'X-Tenant-ID': req.headers['x-tenant-id'] || ''
          }
        });

        const response = await server.handleRequest(request);
        
        res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
        const responseText = await response.text();
        res.write(responseText);
        res.end();
      } catch (error) {
        console.error('Request handling error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.write(JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }));
        res.end();
      }
    }
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }));
    res.end();
  }
});

httpServer.listen(PORT, () => {
  console.log(`🚀 MVP-006 Server with Persona Service running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⚙️  Config: http://localhost:${PORT}/api/tenant/demo-tenant/config`);
  console.log(`🤖 AI Query: http://localhost:${PORT}/api/ai/query`);
  console.log(`🎭 Persona Config: http://localhost:${PORT}/api/tenant/demo-tenant/persona/config`);
  console.log(`📈 Persona Stats: http://localhost:${PORT}/api/tenant/demo-tenant/persona/stats`);
  console.log(`Ready for MVP-006 persona testing! 🎉`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down MVP-006 server...');
  httpServer.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
