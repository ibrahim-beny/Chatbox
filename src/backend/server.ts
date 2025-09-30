import { AIQueryHandler } from './api/ai-query.js';
import { ConfigHandler } from './api/config.js';
import { HealthHandler } from './api/health.js';
import { PersonaConfigHandler } from './api/persona-config.js';
import { HandoverHandler } from './api/handover.js';
import { LoggingHandler } from './api/logging.js';
import { MonitoringHandler } from './api/monitoring.js';
import { AbuseProtectionHandler } from './api/abuse-protection.js';
import { OpenAIMonitoringHandler } from './api/openai-monitoring.js';

export class ChatboxServer {
  private aiQueryHandler: AIQueryHandler;
  private configHandler: ConfigHandler;
  private healthHandler: HealthHandler;
  private personaConfigHandler: PersonaConfigHandler;
  private handoverHandler: HandoverHandler;
  private loggingHandler: LoggingHandler;
  private monitoringHandler: MonitoringHandler;
  private abuseProtectionHandler: AbuseProtectionHandler;
  private openaiMonitoringHandler: OpenAIMonitoringHandler;

  constructor() {
    this.aiQueryHandler = new AIQueryHandler();
    this.configHandler = new ConfigHandler();
    this.healthHandler = new HealthHandler();
    this.personaConfigHandler = new PersonaConfigHandler();
    this.handoverHandler = new HandoverHandler();
    this.loggingHandler = new LoggingHandler();
    this.monitoringHandler = new MonitoringHandler();
    this.abuseProtectionHandler = new AbuseProtectionHandler();
    this.openaiMonitoringHandler = new OpenAIMonitoringHandler();
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

      if (path.startsWith('/handover/')) {
        return await this.handoverHandler.handleRequest(request);
      }

      if (path.startsWith('/logging/')) {
        return await this.loggingHandler.handleRequest(request);
      }

      if (path.startsWith('/monitoring/')) {
        return await this.monitoringHandler.handleRequest(request);
      }

      if (path.startsWith('/abuse/')) {
        if (path === '/abuse/waf-check') {
          return await this.abuseProtectionHandler.handleWAFCheck(request);
        }
        if (path === '/abuse/captcha/generate') {
          return await this.abuseProtectionHandler.handleCaptchaGenerate(request);
        }
        if (path === '/abuse/captcha/verify') {
          return await this.abuseProtectionHandler.handleCaptchaVerify(request);
        }
        if (path === '/abuse/stats') {
          return await this.abuseProtectionHandler.handleAbuseStats(request);
        }
      }

      if (path.startsWith('/openai/')) {
        if (path === '/openai/metrics') {
          return await this.openaiMonitoringHandler.handleMetricsRequest();
        }
        if (path === '/openai/reset-metrics') {
          return await this.openaiMonitoringHandler.handleResetMetricsRequest();
        }
        if (path === '/openai/config') {
          return await this.openaiMonitoringHandler.handleConfigRequest(request);
        }
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
