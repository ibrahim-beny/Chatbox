import { AIQueryHandler } from './api/ai-query.js';
import { ConfigHandler } from './api/config.js';
import { HealthHandler } from './api/health.js';
import { PersonaConfigHandler } from './api/persona-config.js';

export class ChatboxServer {
  private aiQueryHandler: AIQueryHandler;
  private configHandler: ConfigHandler;
  private healthHandler: HealthHandler;
  private personaConfigHandler: PersonaConfigHandler;

  constructor() {
    this.aiQueryHandler = new AIQueryHandler();
    this.configHandler = new ConfigHandler();
    this.healthHandler = new HealthHandler();
    this.personaConfigHandler = new PersonaConfigHandler();
  }

  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    try {
      // Route requests
      if (path === '/health' || path === '/healthz') {
        return await this.healthHandler.handleRequest();
      }

      if (path.startsWith('/tenant/') && path.endsWith('/config')) {
        return await this.configHandler.handleRequest(request);
      }

      if (path.startsWith('/tenant/') && path.includes('/persona/')) {
        return await this.personaConfigHandler.handleRequest(request);
      }

      if (path === '/ai/query') {
        if (request.method !== 'POST') {
          return new Response(JSON.stringify({
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED'
          }), {
            status: 405,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
        return await this.aiQueryHandler.handleRequest(request);
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({
        error: 'Not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      console.error('Server Error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
}
