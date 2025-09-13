# Chatbox Backend - MVP-003A

## Overzicht

De Chatbox Backend implementeert de AI Orchestrator & SSE Backend volgens MVP-003A specificaties. Het systeem ondersteunt zowel OpenAI als Mock providers voor AI responses via Server-Sent Events (SSE).

## Architectuur

### Provider Pattern
- **MockAIProvider**: Simuleert AI responses voor development/testing
- **OpenAIProvider**: Echte OpenAI GPT-4o-mini integratie
- **ProviderFactory**: Automatische provider selectie op basis van environment

### Rate Limiting
- 30 requests/min per tenant
- Burst limit: 10 requests
- Exempt paths: `/health`, `/config`
- Retry-After headers bij 429 responses

### Multi-tenant Support
- Tenant isolatie via X-Tenant-ID header
- Per-tenant configuratie
- Geïsoleerde rate limiting per tenant

## API Endpoints

### POST /api/ai/query
Streamt AI responses via SSE.

**Request:**
```json
{
  "tenantId": "demo-tenant",
  "conversationId": "c-123",
  "content": "Hallo, hoe gaat het?"
}
```

**Response (SSE):**
```
data: {"token": "Hallo", "type": "content", "confidence": 0.9}
data: {"token": "Hallo hoe", "type": "content", "confidence": 0.9}
data: {"token": "", "type": "done", "confidence": 0.9}
```

### GET /api/tenant/{tenantId}/config
Haalt tenant configuratie op.

**Response:**
```json
{
  "tenantId": "demo-tenant",
  "aiProvider": "mock",
  "rateLimit": {
    "requestsPerMinute": 30,
    "burstLimit": 10,
    "exemptPaths": ["/health", "/config"]
  },
  "branding": {
    "primaryColor": "#0A84FF",
    "welcomeMessage": "Welkom! Hoe kan ik je helpen?"
  }
}
```

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T17:04:00.000Z",
  "version": "1.0.0",
  "services": {
    "ai": "operational",
    "config": "operational",
    "rateLimit": "operational"
  },
  "environment": {
    "mockMode": true,
    "hasOpenAIKey": false
  }
}
```

## Environment Variables

- `USE_MOCK_LLM=true`: Forceer mock provider
- `OPENAI_API_KEY`: OpenAI API key voor echte provider

## Deployment

### Development
```bash
npm run dev
```

### Production (Vercel)
```bash
vercel deploy
```

### Docker (Optional)
```bash
docker build -t chatbox-backend .
docker run -p 3000:3000 chatbox-backend
```

## Testing

```bash
# Run all tests
npm test

# Run specific test suite
npx vitest run tests/mvp-003a-simple.test.ts

# Run performance tests
npx vitest run tests/performance.test.ts
```

## Security Features

- Input sanitization (XSS prevention)
- Rate limiting per tenant
- CORS headers
- Error handling zonder informatie leakage
- Tenant isolation

## Performance Metrics

- TTFB: ≤1.2s (achieved)
- Concurrent requests: Supported
- Rate limiting: <1ms per check
- Memory usage: Optimized for serverless
