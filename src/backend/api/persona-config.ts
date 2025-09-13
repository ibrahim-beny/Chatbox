/**
 * MVP-006: Persona Configuration API
 * 
 * Endpoint voor persona configuratie en statistieken
 */

import { PersonaService } from '../services/persona-service.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class PersonaConfigHandler {
  private personaService: PersonaService;

  constructor() {
    this.personaService = PersonaService.getInstance();
  }

  async handleRequest(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const tenantId = request.headers.get('X-Tenant-ID');

      if (!tenantId) {
        return ErrorHandler.createErrorResponse('Missing tenant ID', 'MISSING_TENANT_ID', 400);
      }

      const path = url.pathname;
      const method = request.method;

      // Route to appropriate handler
      if (method === 'GET' && path.endsWith('/persona/config')) {
        return this.getPersonaConfig(tenantId);
      } else if (method === 'GET' && path.endsWith('/persona/stats')) {
        return this.getPersonaStats(tenantId);
      } else if (method === 'POST' && path.endsWith('/persona/validate')) {
        return this.validatePersonaConsistency(request, tenantId);
      } else {
        return ErrorHandler.createErrorResponse('Endpoint not found', 'NOT_FOUND', 404);
      }

    } catch (error) {
      console.error('Persona Config Handler Error:', error);
      return ErrorHandler.createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
  }

  private async getPersonaConfig(tenantId: string): Promise<Response> {
    try {
      const personaConfig = this.personaService.getPersonaConfig(tenantId);
      
      if (!personaConfig) {
        return ErrorHandler.createErrorResponse('Persona config not found', 'PERSONA_NOT_FOUND', 404);
      }

      return new Response(JSON.stringify({
        success: true,
        data: {
          id: personaConfig.id,
          name: personaConfig.name,
          tone: personaConfig.tone,
          personality: personaConfig.personality,
          safetyPolicies: personaConfig.safetyPolicies,
          promptTemplate: personaConfig.promptTemplate,
          templateVersion: personaConfig.templateVersion,
          welcomeMessage: personaConfig.welcomeMessage,
          refusalMessage: personaConfig.refusalMessage
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID'
        }
      });

    } catch (error) {
      console.error('Get Persona Config Error:', error);
      return ErrorHandler.createErrorResponse('Failed to get persona config', 'CONFIG_ERROR', 500);
    }
  }

  private async getPersonaStats(tenantId: string): Promise<Response> {
    try {
      const stats = this.personaService.getPersonaStats(tenantId);
      
      if (!stats) {
        return ErrorHandler.createErrorResponse('Persona stats not found', 'STATS_NOT_FOUND', 404);
      }

      return new Response(JSON.stringify({
        success: true,
        data: {
          persona: stats.persona,
          tone: stats.tone,
          templateVersion: stats.templateVersion,
          safetyPolicies: stats.safetyPolicies,
          activePolicies: stats.safetyPolicies.length,
          lastUpdated: new Date().toISOString()
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID'
        }
      });

    } catch (error) {
      console.error('Get Persona Stats Error:', error);
      return ErrorHandler.createErrorResponse('Failed to get persona stats', 'STATS_ERROR', 500);
    }
  }

  private async validatePersonaConsistency(request: Request, tenantId: string): Promise<Response> {
    try {
      const body = await request.json();
      const { responses } = body;

      if (!responses || !Array.isArray(responses)) {
        return ErrorHandler.createErrorResponse('Invalid request body', 'INVALID_BODY', 400);
      }

      const isValid = this.personaService.validatePersonaConsistency(tenantId, responses);

      return new Response(JSON.stringify({
        success: true,
        data: {
          isValid,
          tenantId,
          responseCount: responses.length,
          validationTimestamp: new Date().toISOString()
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID'
        }
      });

    } catch (error) {
      console.error('Validate Persona Consistency Error:', error);
      return ErrorHandler.createErrorResponse('Failed to validate persona consistency', 'VALIDATION_ERROR', 500);
    }
  }
}
