import { ConfigService } from '../config-service.js';

export class ConfigHandler {
  private configService: ConfigService;

  constructor() {
    this.configService = new ConfigService();
  }

  async handleRequest(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const tenantId = url.pathname.split('/').pop();

      if (!tenantId) {
        return new Response(JSON.stringify({
          error: 'Missing tenant ID',
          code: 'MISSING_TENANT_ID'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      const config = this.configService.getTenantConfig(tenantId);
      if (!config) {
        return new Response(JSON.stringify({
          error: 'Tenant not found',
          code: 'TENANT_NOT_FOUND'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      return new Response(JSON.stringify(config), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // 5 minutes cache
          'ETag': `"${tenantId}-${Date.now()}"`,
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      console.error('Config Handler Error:', error);
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
