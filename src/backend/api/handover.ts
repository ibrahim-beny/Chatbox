/**
 * MVP-007: Handover API Endpoints
 * 
 * API endpoints voor handover functionaliteit
 */

import { HandoverService } from '../services/handover-service.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class HandoverHandler {
  private handoverService: HandoverService;

  constructor() {
    this.handoverService = HandoverService.getInstance();
  }

  async handleRequest(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;
      const tenantId = request.headers.get('X-Tenant-ID');

      if (!tenantId) {
        return ErrorHandler.createErrorResponse('Missing tenant ID', 'MISSING_TENANT_ID', 400);
      }

      // Route to appropriate handler
      if (method === 'POST' && path.endsWith('/handover/request')) {
        return await this.handleHandoverRequest(request, tenantId);
      } else if (method === 'POST' && path.endsWith('/handover/send-email')) {
        return await this.handleSendEmail(request, tenantId);
      } else if (method === 'POST' && path.endsWith('/handover/generate-token')) {
        return await this.handleGenerateToken(request, tenantId);
      } else if (method === 'POST' && path.endsWith('/handover/validate-token')) {
        return await this.handleValidateToken(request);
      } else if (method === 'POST' && path.endsWith('/handover/log-event')) {
        return await this.handleLogEvent(request, tenantId);
      } else if (method === 'POST' && path.endsWith('/handover/test-email')) {
        return await this.handleTestEmail(request, tenantId);
      } else {
        return ErrorHandler.createErrorResponse('Endpoint not found', 'NOT_FOUND', 404);
      }

    } catch (error) {
      console.error('Handover Handler Error:', error);
      return ErrorHandler.createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
  }

  private async handleHandoverRequest(request: Request, tenantId: string): Promise<Response> {
    try {
      const body = await request.json();
      const handoverRequest = {
        tenantId,
        conversationId: body.conversationId || `c-${Date.now()}`,
        userMessage: body.userMessage || '',
        confidence: body.confidence || 0.5,
        triggerReason: body.triggerReason || 'low_confidence',
        persona: body.persona,
        tone: body.tone,
        transcript: body.transcript || [],
        isOffHours: body.isOffHours
      };

      const result = await this.handoverService.processHandoverRequest(handoverRequest);

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID'
        }
      });

    } catch (error) {
      console.error('Handover Request Error:', error);
      return ErrorHandler.createErrorResponse('Failed to process handover request', 'HANDOVER_ERROR', 500);
    }
  }

  private async handleSendEmail(request: Request, tenantId: string): Promise<Response> {
    try {
      const body = await request.json();
      
      // This would typically be called internally, but we expose it for testing
      const handoverRequest = {
        tenantId,
        conversationId: body.conversationId || `c-${Date.now()}`,
        userMessage: body.userMessage || '',
        confidence: body.confidence || 0.5,
        triggerReason: body.triggerReason || 'low_confidence',
        persona: body.persona,
        tone: body.tone,
        transcript: body.transcript || []
      };

      const token = body.handoverToken || 'test-token';
      const emailResult = await this.handoverService['sendHandoverEmail'](handoverRequest, token);

      return new Response(JSON.stringify({
        success: emailResult.success,
        emailSent: emailResult.success,
        retryCount: emailResult.retryCount,
        handoverToken: token
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID'
        }
      });

    } catch (error) {
      console.error('Send Email Error:', error);
      return ErrorHandler.createErrorResponse('Failed to send email', 'EMAIL_ERROR', 500);
    }
  }

  private async handleGenerateToken(request: Request, tenantId: string): Promise<Response> {
    try {
      const body = await request.json();
      const conversationId = body.conversationId || `c-${Date.now()}`;
      
      const token = this.handoverService['generateHandoverToken'](tenantId, conversationId);
      const tokenData = this.handoverService['validateToken'](token);

      return new Response(JSON.stringify({
        success: true,
        handoverToken: token,
        tokenExpiry: tokenData.token?.expiresAt.toISOString(),
        tokenType: 'uuid'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID'
        }
      });

    } catch (error) {
      console.error('Generate Token Error:', error);
      return ErrorHandler.createErrorResponse('Failed to generate token', 'TOKEN_ERROR', 500);
    }
  }

  private async handleValidateToken(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      const token = body.token;

      if (!token) {
        return ErrorHandler.createErrorResponse('Token required', 'MISSING_TOKEN', 400);
      }

      const validation = this.handoverService.validateToken(token);

      if (!validation.valid) {
        return new Response(JSON.stringify({
          success: false,
          error: validation.error,
          code: 'INVALID_TOKEN'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID'
          }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        valid: true,
        token: validation.token
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID'
        }
      });

    } catch (error) {
      console.error('Validate Token Error:', error);
      return ErrorHandler.createErrorResponse('Failed to validate token', 'VALIDATION_ERROR', 500);
    }
  }

  private async handleLogEvent(request: Request, tenantId: string): Promise<Response> {
    try {
      const body = await request.json();
      
      const handoverRequest = {
        tenantId,
        conversationId: body.conversationId || `c-${Date.now()}`,
        userMessage: body.userMessage || '',
        confidence: body.confidence || 0.5,
        triggerReason: body.triggerReason || 'low_confidence'
      };

      const token = body.handoverToken || 'test-token';
      await this.handoverService['logHandoverEvent'](handoverRequest, token, 'handover_requested');

      return new Response(JSON.stringify({
        success: true,
        handoverToken: token,
        logged: true,
        logEntry: {
          tenantId,
          conversationId: handoverRequest.conversationId,
          status: 'handover_requested',
          timestamp: new Date().toISOString(),
          triggerReason: handoverRequest.triggerReason
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
      console.error('Log Event Error:', error);
      return ErrorHandler.createErrorResponse('Failed to log event', 'LOG_ERROR', 500);
    }
  }

  private async handleTestEmail(request: Request, tenantId: string): Promise<Response> {
    try {
      const body = await request.json();
      const testEmail = body.testEmail || 'test@example.com';
      
      // Create test handover request
      const testRequest = {
        tenantId,
        conversationId: 'test-conversation',
        userMessage: 'Test handover email - dit is een test',
        confidence: 0.5,
        triggerReason: 'keyword_match' as const,
        transcript: ['User: Test message', 'Assistant: Test response']
      };

      const token = this.handoverService['generateHandoverToken'](tenantId, 'test-conversation');
      const emailResult = await this.handoverService['sendHandoverEmail'](testRequest, token);

      return new Response(JSON.stringify({
        success: emailResult.success,
        testEmail,
        emailSent: emailResult.success,
        retryCount: emailResult.retryCount,
        message: emailResult.success ? 'Test email sent successfully' : 'Test email failed'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID'
        }
      });

    } catch (error) {
      console.error('Test Email Error:', error);
      return ErrorHandler.createErrorResponse('Failed to send test email', 'TEST_EMAIL_ERROR', 500);
    }
  }
}

