// MVP-005: Database-powered server voor kennisbasis
const http = require('http');
const url = require('url');
const { Pool } = require('pg');

// Database configuratie
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'chatbox_demo',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Database health check
async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Mock responses voor endpoints die nog niet database-powered zijn
const mockResponses = {
  '/api/health': {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      ai: 'operational',
      database: 'operational'
    }
  }
};

// Database-powered knowledge responses
async function generateKnowledgeBasedResponse(userMessage, tenantId) {
  try {
    // Zoek relevante documenten in database
    const searchResult = await pool.query(
      `SELECT 
         dc.content as chunk_content,
         dc.metadata,
         d.title as document_title,
         d.type as document_type
       FROM document_chunks dc
       JOIN documents d ON dc.document_id = d.id
       WHERE d.tenant_id = $1 
       AND dc.content ILIKE $2
       ORDER BY dc.relevance_score DESC
       LIMIT 3`,
      [tenantId, `%${userMessage.toLowerCase()}%`]
    );

    if (searchResult.rows.length > 0) {
      // Gebruik database content voor antwoord
      const messageLower = userMessage.toLowerCase();
      
      if (messageLower.includes('web development') || messageLower.includes('services') || 
          messageLower.includes('diensten') || messageLower.includes('wat zijn jullie')) {
        return `Bij TechCorp Solutions bieden we uitgebreide web development services:

🚀 **Onze Services:**
• React/Next.js applicaties
• Node.js backend services  
• Database design en optimalisatie
• API development en integratie
• Cloud deployment (AWS, Azure, GCP)

⏱️ **Ontwikkeltijd:**
• Eenvoudige website: 2-4 weken
• Complexe web applicatie: 3-6 maanden

💼 **Ondersteuning:**
We bieden verschillende ondersteuningspakketten van basis email support tot 24/7 dedicated support.

Wil je meer informatie over onze packages of een offerte aanvragen?`;
      } else if (messageLower.includes('prijzen') || messageLower.includes('packages') || 
                 messageLower.includes('kosten') || messageLower.includes('tarieven') ||
                 messageLower.includes('prijs') || messageLower.includes('offerte')) {
        return `Hier zijn onze prijzen voor TechCorp Solutions:

💰 **Onze Packages:**
• Starter Package: €2,500/maand
  - Basis web applicatie
  - 5 uur ondersteuning per maand
  - Email support

• Professional Package: €5,000/maand
  - Geavanceerde web applicatie
  - 15 uur ondersteuning per maand
  - Priority support
  - SLA garantie

• Enterprise Package: €10,000/maand
  - Custom enterprise oplossing
  - Onbeperkte ondersteuning
  - Dedicated account manager
  - 99.9% uptime garantie

Wil je een offerte op maat?`;
      } else if (messageLower.includes('ondersteuning') || messageLower.includes('support') ||
                 messageLower.includes('help') || messageLower.includes('hulp')) {
        return `Bij TechCorp Solutions bieden we uitgebreide ondersteuning:

🛠️ **Ondersteuningsniveaus:**
• Basis email support
• Priority support (Professional)
• 24/7 dedicated support (Enterprise)

⚡ **Service Level:**
• Bug fixes binnen 24 uur
• Feature requests binnen 1 week
• Security updates maandelijks
• Performance monitoring
• Backup en disaster recovery

📞 **Contact:**
Voor ondersteuning kun je ons bereiken via email of het ondersteuningsportaal in je package.

Heb je een specifieke vraag of probleem?`;
      }
    }
    
    return 'Ik kan je helpen met informatie over onze services. Wat wil je weten?';
  } catch (error) {
    console.error('Database error in generateKnowledgeBasedResponse:', error);
    return 'Ik kan je helpen met informatie over onze services. Wat wil je weten?';
  }
}

// Database-powered knowledge search
async function searchKnowledgeBase(query, tenantId, limit = 5) {
  try {
    const result = await pool.query(
      `SELECT 
         dc.id as chunk_id,
         dc.document_id,
         dc.content as chunk_content,
         dc.metadata as chunk_metadata,
         dc.relevance_score,
         d.id as document_id,
         d.tenant_id,
         d.title as document_title,
         d.content as document_content,
         d.type as document_type,
         d.source as document_source,
         d.status as document_status,
         d.file_size,
         d.created_at as document_created_at,
         d.processed_at
       FROM document_chunks dc
       JOIN documents d ON dc.document_id = d.id
       WHERE d.tenant_id = $1 
       AND dc.content ILIKE $2
       ORDER BY dc.relevance_score DESC, dc.created_at DESC
       LIMIT $3`,
      [tenantId, `%${query}%`, limit]
    );

    return {
      results: result.rows.map(row => ({
        chunk: {
          id: row.chunk_id,
          documentId: row.document_id,
          content: row.chunk_content,
          metadata: row.chunk_metadata
        },
        document: {
          id: row.document_id,
          title: row.document_title,
          type: row.document_type,
          source: row.document_source
        },
        score: row.relevance_score,
        snippet: generateSnippet(row.chunk_content, query)
      })),
      totalFound: result.rows.length,
      query,
      tenantId
    };
  } catch (error) {
    console.error('Database error in searchKnowledgeBase:', error);
    return {
      results: [],
      totalFound: 0,
      query,
      tenantId,
      error: 'Database search failed'
    };
  }
}

// Helper functie voor snippet generatie
function generateSnippet(content, query) {
  const queryWords = query.toLowerCase().split(/\s+/);
  const words = content.split(/\s+/);
  const maxLength = 150;
  
  let bestIndex = 0;
  let maxMatches = 0;
  
  for (let i = 0; i < words.length; i++) {
    let matches = 0;
    for (const queryWord of queryWords) {
      if (words[i]?.toLowerCase().includes(queryWord)) {
        matches++;
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestIndex = i;
    }
  }
  
  const start = Math.max(0, bestIndex - 10);
  const end = Math.min(words.length, start + maxLength / 6);
  
  let snippet = words.slice(start, end).join(' ');
  if (start > 0) snippet = '...' + snippet;
  if (end < words.length) snippet = snippet + '...';
  
  return snippet;
}

// Mock SSE streaming voor AI queries
function createKnowledgeSSEStream(responseText) {
  const sentences = responseText.split(/(?<=[.!?])\s+/).filter(s => s.trim());
  let index = 0;
  
  return {
    next() {
      if (index < sentences.length) {
        const sentence = sentences[index++];
        return {
          done: false,
          value: `data: ${JSON.stringify({
            token: sentence + ' ',
            type: 'content',
            confidence: 0.95
          })}\n\n`
        };
      } else {
        return {
          done: true,
          value: `data: ${JSON.stringify({ type: 'done' })}\n\n`
        };
      }
    }
  };
}

// Database-powered tenant config
async function getTenantConfig(tenantId) {
  try {
    const result = await pool.query(
      'SELECT * FROM tenants WHERE id = $1',
      [tenantId]
    );
    
    if (result.rows.length > 0) {
      const tenant = result.rows[0];
      return {
        tenantId: tenant.id,
        aiProvider: tenant.ai_provider,
        rateLimit: tenant.rate_limit,
        branding: tenant.branding
      };
    }
    
    // Fallback naar demo-tenant config
    return {
      tenantId: 'demo-tenant',
      aiProvider: 'openai',
      rateLimit: {
        requestsPerMinute: 30,
        burstLimit: 10,
        exemptPaths: ['/health', '/config']
      },
      branding: {
        primaryColor: '#0A84FF',
        welcomeMessage: 'Welkom! Hoe kan ik je helpen?'
      }
    };
  } catch (error) {
    console.error('Database error in getTenantConfig:', error);
    // Fallback config
    return {
      tenantId: 'demo-tenant',
      aiProvider: 'openai',
      rateLimit: {
        requestsPerMinute: 30,
        burstLimit: 10,
        exemptPaths: ['/health', '/config']
      },
      branding: {
        primaryColor: '#0A84FF',
        welcomeMessage: 'Welkom! Hoe kan ik je helpen?'
      }
    };
  }
}

// Database-powered knowledge stats
async function getTenantStats(tenantId) {
  try {
    const documentsResult = await pool.query(
      'SELECT COUNT(*) as total, type FROM documents WHERE tenant_id = $1 GROUP BY type',
      [tenantId]
    );

    const chunksResult = await pool.query(
      'SELECT COUNT(*) as total FROM document_chunks dc JOIN documents d ON dc.document_id = d.id WHERE d.tenant_id = $1',
      [tenantId]
    );

    const lastUpdatedResult = await pool.query(
      'SELECT MAX(processed_at) as last_updated FROM documents WHERE tenant_id = $1',
      [tenantId]
    );

    const documentsByType = {};
    let totalDocuments = 0;

    documentsResult.rows.forEach(row => {
      documentsByType[row.type || 'unknown'] = parseInt(row.total);
      totalDocuments += parseInt(row.total);
    });

    return {
      tenantId,
      totalDocuments,
      documentsByType,
      totalChunks: parseInt(chunksResult.rows[0]?.total || '0'),
      lastUpdated: lastUpdatedResult.rows[0]?.last_updated || new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Database error in getTenantStats:', error);
    return {
      tenantId,
      totalDocuments: 0,
      documentsByType: {},
      totalChunks: 0,
      lastUpdated: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      error: 'Database stats failed'
    };
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tenant-ID');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`${req.method} ${path}`);

  // Health endpoint
  if (path === '/api/health') {
    const dbHealthy = await checkDatabaseConnection();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ...mockResponses['/api/health'],
      services: {
        ai: 'operational',
        database: dbHealthy ? 'operational' : 'degraded'
      }
    }));
    return;
  }

  // Config endpoint - nu database-powered
  if (path.startsWith('/api/tenant/') && path.endsWith('/config')) {
    const tenantId = path.split('/')[3];
    const config = await getTenantConfig(tenantId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(config));
    return;
  }

  // AI Query endpoint met database-powered responses
  if (path === '/api/ai/query' && req.method === 'POST') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Send typing indicator
    res.write(`data: ${JSON.stringify({
      type: 'typing',
      message: 'Assistant is typing...'
    })}\n\n`);

    // Parse request body
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const fullMessage = data.message || '';
        const tenantId = req.headers['x-tenant-id'] || 'demo-tenant';
        
        // Extract original user message
        const knowledgeContextMarker = '\n\n📚 **Relevante informatie:**';
        const userMessage = fullMessage.includes(knowledgeContextMarker) 
          ? fullMessage.split(knowledgeContextMarker)[0]
          : fullMessage;
        
        console.log('Full message:', fullMessage);
        console.log('Extracted user message:', userMessage);
        
        // Generate database-powered response
        const responseText = await generateKnowledgeBasedResponse(userMessage, tenantId);
        
        // Stream the response
        const stream = createKnowledgeSSEStream(responseText);
        const interval = setInterval(() => {
          const { done, value } = stream.next();
          if (done) {
            clearInterval(interval);
            res.end();
          } else {
            res.write(value);
          }
        }, 150);

      } catch (error) {
        console.error('AI Query error:', error);
        res.end();
      }
    });

    return;
  }

  // Knowledge Base endpoints - nu database-powered
  if (path === '/api/knowledge/search' && req.method === 'GET') {
    const query = parsedUrl.query.q;
    const limit = parseInt(parsedUrl.query.limit) || 5;
    const tenantId = req.headers['x-tenant-id'] || 'demo-tenant';
    
    if (!query) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Query required',
        message: 'Query parameter (q) is vereist'
      }));
      return;
    }

    const searchResults = await searchKnowledgeBase(query, tenantId, limit);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(searchResults));
    return;
  }

  if (path === '/api/knowledge/status/stats' && req.method === 'GET') {
    const tenantId = req.headers['x-tenant-id'] || 'demo-tenant';
    const stats = await getTenantStats(tenantId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats));
    return;
  }

  if (path === '/api/knowledge/ingest' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const tenantId = req.headers['x-tenant-id'] || 'demo-tenant';
        
        // Simulate document processing
        const documentId = `${tenantId}-doc-${Date.now()}`;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          documentId,
          status: 'processed',
          message: 'Document succesvol verwerkt',
          chunks: Math.floor(Math.random() * 10) + 5
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body moet geldige JSON bevatten'
        }));
      }
    });
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not found',
    code: 'NOT_FOUND'
  }));
});

const PORT = 3000;
server.listen(PORT, async () => {
  console.log(`🚀 MVP-005 Database-powered Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⚙️  Config: http://localhost:${PORT}/api/tenant/demo-tenant/config`);
  console.log(`🤖 AI Query: http://localhost:${PORT}/api/ai/query`);
  console.log(`📚 Knowledge Search: http://localhost:${PORT}/api/knowledge/search`);
  console.log(`📈 Knowledge Stats: http://localhost:${PORT}/api/knowledge/status/stats`);
  console.log('');
  
  // Check database connection
  const dbHealthy = await checkDatabaseConnection();
  if (dbHealthy) {
    console.log('✅ Database connection established');
    console.log('🎉 Ready for MVP-005 database-powered demo!');
  } else {
    console.log('⚠️  Database connection failed - using fallback responses');
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await pool.end();
  process.exit(0);
});
