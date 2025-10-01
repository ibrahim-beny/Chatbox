/**
 * MVP-011: Green Environment Server
 * 
 * Dit is de green environment instantie van de chatbox server voor blue/green deployment.
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Environment identifier
const ENVIRONMENT = 'GREEN';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    environment: ENVIRONMENT,
    status: 'healthy',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// API endpoints (simplified for demo)
app.get('/api/health', (req, res) => {
  res.json({
    environment: ENVIRONMENT,
    status: 'healthy',
    version: '1.1.0',
    endpoints: {
      ai: '/api/ai/query',
      config: '/api/tenant/demo-tenant/config',
      knowledge: '/api/knowledge/search'
    }
  });
});

// Mock AI endpoint
app.post('/api/ai/query', (req, res) => {
  const { content } = req.body;
  
  res.json({
    environment: ENVIRONMENT,
    message: `Green environment response to: "${content}"`,
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    features: ['enhanced-ai', 'new-ui']
  });
});

// Mock config endpoint
app.get('/api/tenant/:tenantId/config', (req, res) => {
  res.json({
    environment: ENVIRONMENT,
    tenantId: req.params.tenantId,
    config: {
      persona: 'techcorp',
      tone: 'professional',
      version: '1.1.0',
      features: ['enhanced-persona', 'advanced-branding']
    }
  });
});

// Mock knowledge search
app.get('/api/knowledge/search', (req, res) => {
  res.json({
    environment: ENVIRONMENT,
    query: req.query.q || '',
    results: [
      {
        title: 'Green Environment Knowledge',
        content: 'This is an enhanced response from the green environment with new features',
        source: 'green-demo',
        features: ['enhanced-search', 'ai-powered-ranking']
      }
    ]
  });
});

// Serve demo pages
app.get('/demo/*', (req, res) => {
  const filePath = path.join(__dirname, '..', req.path);
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({
        environment: ENVIRONMENT,
        error: 'Demo page not found',
        path: req.path
      });
    }
  });
});

// Serve widget
app.get('/dist/widget.iife.js', (req, res) => {
  const filePath = path.join(__dirname, '..', 'dist', 'widget.iife.js');
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({
        environment: ENVIRONMENT,
        error: 'Widget not found'
      });
    }
  });
});

// Catch-all for other routes
app.get('*', (req, res) => {
  res.json({
    environment: ENVIRONMENT,
    message: 'Green environment server',
    path: req.path,
    version: '1.1.0'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MVP-011: Green Environment Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎭 Environment: ${ENVIRONMENT}`);
  console.log(`📋 Version: 1.1.0`);
});

module.exports = app;
