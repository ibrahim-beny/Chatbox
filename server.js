// Simple Node.js server for MVP-003A backend + MVP-004 knowledge base
require('dotenv').config();
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { sendEmail } = require('./lib/email.js');

// Email helper functions
async function sendHandoverEmail(to, subject, html, tenantId = 'unknown') {
  try {
    const result = await sendEmail({ to, subject, html });
    console.log('✅ Handover email sent to:', to);
    console.log('📧 Resend Response:', result);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Handover email failed:', error);
    return { success: false, error: error.message };
  }
}

async function sendTestEmail(to, tenantId = 'unknown') {
  const subject = 'BitBreez Handover Test Email';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #2E7D32; color: white; padding: 20px; text-align: center;">
        <h1>BitBreez</h1>
        <h2>Handover Test Email</h2>
      </div>
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p><strong>Test Status:</strong> ✅ Resend integratie werkt!</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Tenant:</strong> ${tenantId}</p>
        <p>Deze email bevestigt dat het BitBreez handover systeem correct is geconfigureerd en echte emails kan verzenden.</p>
      </div>
      <div style="background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
        BitBreez - AI-Powered Chatbox Solutions
      </div>
    </div>
  `;
  
  return await sendHandoverEmail(to, subject, html, tenantId);
}

// MVP-007: Handover configurations
const handoverConfigs = {
  'demo-tenant': {
    recipientEmail: process.env.HANDOVER_EMAIL || 'jouw-email@hotmail.com',
    template: 'bitbreez-handover-template',
    businessHours: { start: 9, end: 17 },
    responseTime: '1 uur'
  },
  'test-tenant': {
    recipientEmail: process.env.HANDOVER_EMAIL || 'jouw-email@hotmail.com',
    template: 'bitbreez-handover-template',
    businessHours: { start: 9, end: 17 },
    responseTime: '1 uur'
  }
};

// MVP-006: Persona configurations
const personaConfigs = {
  'demo-tenant': {
    id: 'techcorp',
    name: 'TechCorp Solutions AI Assistant',
    tone: 'professioneel-technisch',
    personality: [
      'Professioneel en technisch onderlegd',
      'Focus op web development en software oplossingen',
      'Direct en efficiënt in communicatie',
      'Expertise in moderne technologieën'
    ],
    safetyPolicies: [
      'Geen illegale activiteiten',
      'Geen hacking of malware',
      'Geen spam of phishing',
      'Geen persoonlijke informatie delen'
    ],
    promptTemplate: 'techcorp-professional-v1.2',
    templateVersion: 'v1.2',
    welcomeMessage: 'Hallo! Ik ben de AI-assistent van TechCorp Solutions. Hoe kan ik je helpen met onze web development diensten?',
    refusalMessage: 'Ik kan je niet helpen met deze vraag. Bij TechCorp Solutions helpen we graag met legitieme web development projecten. Wil je meer weten over onze diensten?'
  },
  'test-tenant': {
    id: 'retailmax',
    name: 'RetailMax Customer Service AI',
    tone: 'vriendelijk-klantgericht',
    personality: [
      'Vriendelijk en behulpzaam',
      'Focus op klanttevredenheid en service',
      'Geduldig en ondersteunend',
      'Expertise in elektronica en retail'
    ],
    safetyPolicies: [
      'Geen illegale activiteiten',
      'Geen hacking of malware',
      'Geen spam of phishing',
      'Geen persoonlijke informatie delen'
    ],
    promptTemplate: 'retailmax-friendly-v1.1',
    templateVersion: 'v1.1',
    welcomeMessage: 'Hallo! Welkom bij RetailMax. Ik help je graag met vragen over onze producten en services.',
    refusalMessage: 'Ik kan je niet helpen met deze vraag. Bij RetailMax staan we voor kwaliteit en service. Hoe kan ik je anders helpen?'
  }
};

// Safety filter patterns
const dangerousPatterns = [
  /hack/i, /virus/i, /malware/i, /phishing/i, /spam/i,
  /illegale/i, /crimineel/i, /stelen/i, /fraude/i, /bedrog/i
];

// Mock data for testing
const mockResponses = {
  '/api/health': {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      ai: 'operational',
      database: 'operational',
      persona: 'operational'
    }
  },
  '/api/tenant/demo-tenant/config': {
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
  }
};

// Mock SSE streaming for AI queries
function createSSEStream() {
  const tokens = [
    'Hallo',
    'Hallo hoe',
    'Hallo hoe gaat',
    'Hallo hoe gaat het?',
    'Ik ben een AI-assistent',
    'Ik ben een AI-assistent en',
    'Ik ben een AI-assistent en ik',
    'Ik ben een AI-assistent en ik kan',
    'Ik ben een AI-assistent en ik kan je',
    'Ik ben een AI-assistent en ik kan je helpen!'
  ];

  let index = 0;
  
  return {
    next() {
      if (index < tokens.length) {
        const token = tokens[index++];
        return {
          done: false,
          value: `data: ${JSON.stringify({
            token: token,
            type: 'content',
            confidence: 0.9
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

// Knowledge-based SSE streaming - MVP-004
function createKnowledgeSSEStream(responseText) {
  // Split by sentences for better streaming experience
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

// Generate knowledge-based responses - MVP-004
function generateKnowledgeBasedResponse(userMessage, tenantId) {
  if (tenantId === 'demo-tenant') {
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
  } else if (tenantId === 'test-tenant') {
    return `Bij RetailMax verkopen we verschillende product categorieën:

📱 **Onze Producten:**
• Smartphones en tablets
• Laptops en computers
• Audio en video apparatuur
• Gaming accessoires

🔄 **Retourbeleid:**
• 14 dagen retourrecht
• Originele verpakking vereist
• Geen retourkosten voor defecte producten
• Geld terug of omruilen mogelijk

📞 **Klantenservice:**
Ma-Vr 9:00-18:00, Za 10:00-16:00
Telefoon: 0800-RETAILMAX
Email: service@retailmax.nl

Kan ik je helpen met een specifiek product?`;
  }
  
  return 'Ik kan je helpen met informatie over onze services. Wat wil je weten?';
}

function generatePricingResponse(tenantId) {
  if (tenantId === 'demo-tenant') {
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
  }
  
  return 'Neem contact met ons op voor prijsinformatie.';
}

function generateSupportResponse(tenantId) {
  if (tenantId === 'demo-tenant') {
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
  
  return 'Ons ondersteuningsteam staat voor je klaar. Hoe kunnen we je helpen?';
}

// Mock search results for knowledge base - MVP-004
function generateMockSearchResults(query, tenantId, limit) {
  const demoResults = {
    'demo-tenant': [
      {
        chunk: {
          id: 'chunk-001',
          documentId: 'pdf-001',
          content: 'Web Development Services: React/Next.js applicaties, Node.js backend services, Database design en optimalisatie, API development en integratie, Cloud deployment (AWS, Azure, GCP)',
          metadata: { page: 1, section: 'Hoofdstuk 1' }
        },
        document: {
          id: 'pdf-001',
          title: 'Product Catalogus 2024',
          type: 'pdf',
          source: 'product-catalog-2024.pdf'
        },
        score: 0.95,
        snippet: 'Web Development Services: React/Next.js applicaties, Node.js backend services...'
      },
      {
        chunk: {
          id: 'chunk-007',
          documentId: 'faq-001',
          content: 'Ontwikkeltijd: Eenvoudige website 2-4 weken, complexe web applicatie 3-6 maanden',
          metadata: { section: 'Ontwikkeltijd' }
        },
        document: {
          id: 'faq-001',
          title: 'Veelgestelde Vragen - TechCorp Solutions',
          type: 'faq',
          source: 'faq-techcorp-2024.md'
        },
        score: 0.88,
        snippet: 'Ontwikkeltijd: Eenvoudige website 2-4 weken, complexe web applicatie 3-6 maanden'
      },
      {
        chunk: {
          id: 'chunk-009',
          documentId: 'faq-001',
          content: 'Ondersteuning: Verschillende pakketten van basis email support tot 24/7 dedicated support',
          metadata: { section: 'Ondersteuning' }
        },
        document: {
          id: 'faq-001',
          title: 'Veelgestelde Vragen - TechCorp Solutions',
          type: 'faq',
          source: 'faq-techcorp-2024.md'
        },
        score: 0.82,
        snippet: 'Ondersteuning: Verschillende pakketten van basis email support tot 24/7 dedicated support'
      }
    ],
    'test-tenant': [
      {
        chunk: {
          id: 'chunk-013',
          documentId: 'retail-001',
          content: 'Product Categorieën: Smartphones en tablets, Laptops en computers, Audio en video apparatuur, Gaming accessoires',
          metadata: { page: 1, section: 'Hoofdstuk 1' }
        },
        document: {
          id: 'retail-001',
          title: 'RetailMax - Verkoop Handleiding',
          type: 'manual',
          source: 'verkoop-handleiding-2024.pdf'
        },
        score: 0.92,
        snippet: 'Product Categorieën: Smartphones en tablets, Laptops en computers...'
      },
      {
        chunk: {
          id: 'chunk-015',
          documentId: 'retail-001',
          content: 'Retourbeleid: 14 dagen retourrecht, Originele verpakking vereist, Geen retourkosten voor defecte producten, Geld terug of omruilen mogelijk',
          metadata: { page: 3, section: 'Hoofdstuk 3' }
        },
        document: {
          id: 'retail-001',
          title: 'RetailMax - Verkoop Handleiding',
          type: 'manual',
          source: 'verkoop-handleiding-2024.pdf'
        },
        score: 0.85,
        snippet: 'Retourbeleid: 14 dagen retourrecht, Originele verpakking vereist...'
      }
    ]
  };

  const tenantResults = demoResults[tenantId] || [];
  
  // Filter results based on query keywords
  const queryLower = query.toLowerCase();
  const filteredResults = tenantResults.filter(result => 
    result.chunk.content.toLowerCase().includes(queryLower) ||
    result.document.title.toLowerCase().includes(queryLower)
  );

  // If no matches, return general results
  if (filteredResults.length === 0) {
    return tenantResults.slice(0, limit);
  }

  return filteredResults.slice(0, limit);
}

const server = http.createServer((req, res) => {
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
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockResponses['/api/health']));
    return;
  }

  // Resend config status endpoint
  if (path === '/api/resend/config') {
    const resendConfig = {
      apiKeyConfigured: !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_e8dLfswg_9VXTCgYzmDfX9jgN4wdChGyP'),
      fromEmail: 'onboarding@resend.dev',
      mode: (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_e8dLfswg_9VXTCgYzmDfX9jgN4wdChGyP') ? 'Production (Real Resend)' : 'Development (Default)',
      timestamp: new Date().toISOString()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(resendConfig));
    return;
  }

  // Config endpoint
  if (path === '/api/tenant/demo-tenant/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockResponses['/api/tenant/demo-tenant/config']));
    return;
  }

  // AI Query endpoint with SSE
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

    // Parse request body to get the user's message
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const fullMessage = data.message || '';
        const tenantId = req.headers['x-tenant-id'] || 'demo-tenant';
        
        // Extract original user message (before knowledge context)
        // The frontend adds knowledge context with "📚 **Relevante informatie:**"
        const knowledgeContextMarker = '\n\n📚 **Relevante informatie:**';
        const userMessage = fullMessage.includes(knowledgeContextMarker) 
          ? fullMessage.split(knowledgeContextMarker)[0]
          : fullMessage;
        
        // Debug logging
        console.log('Full message:', fullMessage);
        console.log('Extracted user message:', userMessage);
        
        // MVP-006: Get persona config
        const personaConfig = personaConfigs[tenantId] || personaConfigs['demo-tenant'];
        
        // MVP-006: Safety filter check
        let safetyFiltered = false;
        let redirectTo = null;
        for (const pattern of dangerousPatterns) {
          if (pattern.test(userMessage)) {
            safetyFiltered = true;
            if (/hack|virus|malware/i.test(userMessage)) {
              redirectTo = 'legitimate-services';
            } else if (/spam|phishing/i.test(userMessage)) {
              redirectTo = 'marketing-services';
            } else if (/illegale|crimineel/i.test(userMessage)) {
              redirectTo = 'legal-services';
            }
            break;
          }
        }
        
        // Send persona metadata first
        res.write(`data: ${JSON.stringify({
          type: 'persona',
          persona: personaConfig.id,
          tone: personaConfig.tone,
          templateVersion: personaConfig.templateVersion,
          promptTemplate: personaConfig.promptTemplate,
          safetyFilter: safetyFiltered,
          redirectTo: redirectTo
        })}\n\n`);
        
        let responseText = '';
        
        if (safetyFiltered) {
          // Send safety refusal response
          responseText = personaConfig.refusalMessage;
        } else {
          // Generate contextual response based on persona
          const messageLower = userMessage.toLowerCase();
          
          if (messageLower.includes('hallo') || messageLower.includes('hi') || messageLower.includes('hey')) {
            responseText = personaConfig.welcomeMessage;
          } else if (messageLower.includes('web development') || messageLower.includes('services') || 
                     messageLower.includes('diensten') || messageLower.includes('wat zijn jullie')) {
            responseText = generateKnowledgeBasedResponse(userMessage, tenantId);
          } else if (messageLower.includes('prijzen') || messageLower.includes('packages') || 
                     messageLower.includes('kosten') || messageLower.includes('tarieven') ||
                     messageLower.includes('prijs') || messageLower.includes('offerte')) {
            responseText = generatePricingResponse(tenantId);
          } else if (messageLower.includes('ondersteuning') || messageLower.includes('support') ||
                     messageLower.includes('help') || messageLower.includes('hulp')) {
            responseText = generateSupportResponse(tenantId);
          } else {
            // Default response based on persona
            if (personaConfig.id === 'techcorp') {
              responseText = `TechCorp Solutions: ${personaConfig.personality[0]}. Hoe kan ik je helpen met web development of software oplossingen?`;
            } else if (personaConfig.id === 'retailmax') {
              responseText = `RetailMax: ${personaConfig.personality[0]}. Wat kan ik voor je betekenen op het gebied van elektronica en consumentengoederen?`;
            } else {
              responseText = 'Ik ben een AI-assistent en ik kan je helpen!';
            }
          }
        }
        
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

  // Handover generate token endpoint (legacy) - MVP-007
  if (path === '/handover/generate-token' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const tenantId = req.headers['x-tenant-id'] || 'demo-tenant';
        
        // Generate mock handover token
        const handoverToken = `handover-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          handoverToken,
          tenantId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid request body',
          code: 'INVALID_BODY'
        }));
      }
    });
    return;
  }

  // Handover generate token endpoint - MVP-007
  if (path === '/api/handover/generate-token' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const tenantId = req.headers['x-tenant-id'] || 'demo-tenant';
        
        // Generate UUID handover token
        const handoverToken = '550e8400-e29b-41d4-a716-446655440000';
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          handoverToken,
          tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          tokenType: 'uuid',
          tenantId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid request body',
          code: 'INVALID_BODY'
        }));
      }
    });
    return;
  }

  // Handover test endpoint (legacy) - MVP-007
  if (path === '/handover/test-email' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const tenantId = req.headers['x-tenant-id'] || 'demo-tenant';
        
        // Real Resend test email
        const testEmail = data.testEmail || 'info@bitbreez.nl';
        
        // Try to send real email via Resend
        let emailSent = false;
        try {
          const result = await sendEmail({
            to: testEmail,
            subject: 'BitBreez Handover Test Email',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #2E7D32; color: white; padding: 20px; text-align: center;">
                  <h1>BitBreez</h1>
                  <h2>Handover Test Email</h2>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                  <p><strong>Test Status:</strong> ✅ Resend integratie werkt!</p>
                  <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                  <p><strong>Tenant:</strong> ${tenantId}</p>
                  <p>Deze email bevestigt dat het BitBreez handover systeem correct is geconfigureerd en echte emails kan verzenden.</p>
                </div>
                <div style="background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
                  BitBreez - AI-Powered Chatbox Solutions
                </div>
              </div>
            `
          });
          
          emailSent = true;
          console.log('✅ Real Resend email sent to:', testEmail);
          console.log('📧 Resend Response:', result);
        } catch (error) {
          console.error('❌ Resend error:', error);
          emailSent = false;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: emailSent,
          testEmail,
          emailSent,
          retryCount: emailSent ? 0 : 1,
          message: emailSent ? 'Test email sent successfully' : 'Test email failed',
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid request body',
          code: 'INVALID_BODY'
        }));
      }
    });
    return;
  }

  // Handover test endpoint - MVP-007
  if (path === '/api/handover/test-email' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const tenantId = req.headers['x-tenant-id'] || 'demo-tenant';
        
        // Real Resend test email
        const testEmail = data.testEmail || 'info@bitbreez.nl';
        
        // Try to send real email via Resend
        let emailSent = false;
        let retryCount = 0;
        try {
          const result = await sendEmail({
            to: testEmail,
            subject: 'BitBreez Handover Test Email',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #2E7D32; color: white; padding: 20px; text-align: center;">
                  <h1>BitBreez</h1>
                  <h2>Handover Test Email</h2>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9;">
                  <p><strong>Test Status:</strong> ✅ Resend integratie werkt!</p>
                  <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                  <p><strong>Tenant:</strong> ${tenantId}</p>
                  <p>Deze email bevestigt dat het BitBreez handover systeem correct is geconfigureerd en echte emails kan verzenden.</p>
                </div>
                <div style="background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
                  BitBreez - AI-Powered Chatbox Solutions
                </div>
              </div>
            `
          });
          
          emailSent = true;
          console.log('✅ Real Resend email sent to:', testEmail);
          console.log('📧 Resend Response:', result);
        } catch (error) {
          console.error('❌ Resend error:', error);
          emailSent = false;
          retryCount = 1;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: emailSent,
          testEmail,
          emailSent,
          retryCount,
          message: emailSent ? 'Test email sent successfully' : 'Test email failed',
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid request body',
          code: 'INVALID_BODY'
        }));
      }
    });
    return;
  }

  // Handover send email endpoint - MVP-007
  if (path === '/api/handover/send-email' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const tenantId = req.headers['x-tenant-id'] || 'demo-tenant';
        const handoverConfig = handoverConfigs[tenantId] || handoverConfigs['demo-tenant'];
        
        // Real Resend email sending
        let emailSent = false;
        let retryCount = 0;
        try {
          const result = await sendEmail({
            to: handoverConfig.recipientEmail,
            subject: `Handover ${tenantId} · ${data.conversationId || 'unknown'}`,
            html: data.transcriptHtml || '<p>(geen transcript)</p>'
          });
          
          emailSent = true;
          console.log('✅ Handover email sent to:', handoverConfig.recipientEmail);
          console.log('📧 Resend Response:', result);
        } catch (error) {
          console.error('❌ Resend error:', error);
          emailSent = false;
          retryCount = 1;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: emailSent,
          emailSent,
          retryCount,
          handoverToken: data.handoverToken || `handover-${Date.now()}`,
          templateUsed: `${tenantId}-handover-template`,
          recipientEmail: handoverConfig.recipientEmail
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid request body',
          code: 'INVALID_BODY'
        }));
      }
    });
    return;
  }

  // Handover validate token endpoint - MVP-007
  if (path === '/api/handover/validate-token' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const token = data.token;
        
        if (!token) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Token required',
            code: 'MISSING_TOKEN'
          }));
          return;
        }
        
        // Mock token validation
        const isValid = token.startsWith('handover-') || token.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        
        if (!isValid) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
          }));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          valid: true,
          token: {
            token,
            tenantId: 'demo-tenant',
            conversationId: 'test-conversation',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            used: false
          }
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid request body',
          code: 'INVALID_BODY'
        }));
      }
    });
    return;
  }

  // Handover log event endpoint - MVP-007
  if (path === '/api/handover/log-event' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const tenantId = req.headers['x-tenant-id'] || 'demo-tenant';
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          handoverToken: data.handoverToken || `handover-${Date.now()}`,
          logged: true,
          logEntry: {
            tenantId,
            conversationId: data.conversationId || 'test-conversation',
            status: 'handover_requested',
            timestamp: new Date().toISOString(),
            triggerReason: data.triggerReason || 'low_confidence'
          }
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid request body',
          code: 'INVALID_BODY'
        }));
      }
    });
    return;
  }

  // Handover endpoint - MVP-007
  if (path === '/handover' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { tenantId, conversationId, userEmail, transcriptHtml } = JSON.parse(body);

        if (!userEmail || !userEmail.includes("@")) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: "invalid_email" }));
          return;
        }

        try {
          await sendEmail({
            to: "ibrahim_benyahya@hotmail.com",
            subject: `Handover ${tenantId} · ${conversationId}`,
            html: transcriptHtml || "<p>(geen transcript)</p>",
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, status: "sent" }));
        } catch (err) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: "send_failed" }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: "invalid_request" }));
      }
    });
    return;
  }

  // Handover endpoints - MVP-007
  if (path === '/api/handover/request' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const tenantId = req.headers['x-tenant-id'] || 'demo-tenant';
        const handoverConfig = handoverConfigs[tenantId] || handoverConfigs['demo-tenant'];
        const personaConfig = personaConfigs[tenantId] || personaConfigs['demo-tenant'];
        
        // Check if handover should be triggered
        const confidence = data.confidence || 0.5;
        const userMessage = data.userMessage || '';
        const triggerReason = data.triggerReason || 'low_confidence';
        
        let handoverTriggered = false;
        let matchedKeyword = null;
        let frustrationScore = 0;
        
        // Check confidence threshold
        if (confidence < 0.7) {
          handoverTriggered = true;
        }
        
        // Check handover keywords
        const handoverKeywords = ['mens', 'mensen', 'agent', 'klantenservice', 'bellen', 'human'];
        for (const keyword of handoverKeywords) {
          if (userMessage.toLowerCase().includes(keyword)) {
            handoverTriggered = true;
            matchedKeyword = keyword;
            break;
          }
        }
        
        // Check frustration patterns
        const frustrationPatterns = [
          /(dit|het) werkt niet/i,
          /(ik ben|ben) gefrustreerd/i,
          /(dit is|is) belachelijk/i,
          /waarom werkt (dit|het) niet/i
        ];
        
        for (const pattern of frustrationPatterns) {
          if (pattern.test(userMessage)) {
            handoverTriggered = true;
            frustrationScore = 0.8;
            break;
          }
        }
        
        if (handoverTriggered) {
          // Generate handover token
          const handoverToken = `handover-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Check if off-hours
          const now = new Date();
          const hour = now.getHours();
          const day = now.getDay();
          const isOffHours = day === 0 || day === 6 || hour < 9 || hour >= 17;
          
          const queuePosition = isOffHours ? Math.floor(Math.random() * 10) + 1 : undefined;
          const estimatedResponseTime = isOffHours ? '2-4 uur' : '1 uur';
          
          // Real Resend email sending
          let emailSent = false;
          try {
            const result = await sendEmail({
              to: handoverConfig.recipientEmail,
              subject: `Handover ${tenantId} · ${data.conversationId || 'unknown'}`,
              html: data.transcriptHtml || '<p>(geen transcript)</p>'
            });
            
            emailSent = true;
            console.log('✅ Handover email sent to:', handoverConfig.recipientEmail);
            console.log('📧 Resend Response:', result);
          } catch (error) {
            console.error('❌ Resend error:', error);
            emailSent = false;
          }
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            handoverToken,
            handoverStatus: emailSent ? 'sent' : 'queued',
            emailSent,
            confirmationMessage: isOffHours 
              ? 'Bedankt voor je bericht. We zijn momenteel buiten kantooruren, maar je vraag is toegevoegd aan onze wachtrij.'
              : 'Je vraag is doorgestuurd naar een menselijke collega. Je ontvangt binnen 1 uur een reactie via e-mail.',
            queuePosition,
            estimatedResponseTime,
            isOffHours,
            triggerReason,
            matchedKeyword,
            frustrationScore,
            handoverTriggered: true,
            persona: personaConfig.id,
            tone: personaConfig.tone
          }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            handoverStatus: 'not_triggered',
            message: 'Handover not triggered'
          }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid request body',
          code: 'INVALID_BODY'
        }));
      }
    });
    return;
  }

  // Knowledge Base endpoints - MVP-004
  if (path === '/api/knowledge/ingest' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
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
          chunks: Math.floor(Math.random() * 10) + 5 // Random chunk count
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

    // Mock search results based on query
    const mockResults = generateMockSearchResults(query, tenantId, limit);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      results: mockResults,
      totalFound: mockResults.length,
      query,
      tenantId
    }));
    return;
  }

  if (path === '/api/knowledge/status/stats' && req.method === 'GET') {
    const tenantId = req.headers['x-tenant-id'] || 'demo-tenant';
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      tenantId,
      totalDocuments: 3,
      documentsByType: {
        pdf: 2,
        faq: 1
      },
      totalChunks: 15,
      lastUpdated: new Date().toISOString(),
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Serve static files (demo pages and widget)
  if (path.startsWith('/demo/') || path === '/demo' || path.startsWith('/dist/')) {
    const filePath = path === '/demo' ? '/demo/index.html' : path;
    const fullPath = require('path').join(__dirname, filePath);
    
    // Check if file exists
    if (fs.existsSync(fullPath)) {
      const ext = require('path').extname(fullPath);
      const contentType = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json'
      }[ext] || 'text/plain';
      
      const content = fs.readFileSync(fullPath, 'utf8');
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      return;
    }
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not found',
    code: 'NOT_FOUND'
  }));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 MVP-003A + MVP-004 + MVP-006 + MVP-007 Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⚙️  Config: http://localhost:${PORT}/api/tenant/demo-tenant/config`);
  console.log(`🤖 AI Query: http://localhost:${PORT}/api/ai/query`);
  console.log(`🎭 Persona: MVP-006 persona system active`);
  console.log(`📧 Handover: http://localhost:${PORT}/api/handover/request`);
  console.log(`📚 Knowledge Ingest: http://localhost:${PORT}/api/knowledge/ingest`);
  console.log(`🔍 Knowledge Search: http://localhost:${PORT}/api/knowledge/search`);
  console.log(`📈 Knowledge Stats: http://localhost:${PORT}/api/knowledge/status/stats`);
  console.log('');
  console.log('Ready for MVP-003B + MVP-004 + MVP-006 + MVP-007 frontend integration! 🎉');
});
