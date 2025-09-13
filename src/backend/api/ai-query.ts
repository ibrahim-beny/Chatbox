import { ChatRequest, ChatResponse } from '../types.js';
import { ProviderFactory } from '../providers/provider-factory.js';
import { ConfigService } from '../config-service.js';
import { RateLimiter } from '../rate-limiter.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class AIQueryHandler {
  private configService: ConfigService;
  private rateLimiters: Map<string, RateLimiter> = new Map();

  constructor() {
    this.configService = new ConfigService();
  }

  async handleRequest(request: Request): Promise<Response> {
    try {
      // Parse request
      const chatRequest: ChatRequest = await request.json();
      const tenantId = request.headers.get('X-Tenant-ID') || chatRequest.tenantId;

      if (!tenantId) {
        return ErrorHandler.createErrorResponse('Missing tenant ID', 'MISSING_TENANT_ID', 400);
      }

      // Get tenant config
      const config = this.configService.getTenantConfig(tenantId);
      if (!config) {
        return ErrorHandler.createErrorResponse('Tenant not found', 'TENANT_NOT_FOUND', 404);
      }

      // Check rate limit
      const rateLimiter = this.getRateLimiter(config);
      if (!rateLimiter.isExemptPath('/ai/query')) {
        const rateLimitCheck = rateLimiter.isAllowed(tenantId);
        if (!rateLimitCheck.allowed) {
          return ErrorHandler.createRateLimitResponse(rateLimitCheck.retryAfter);
        }
      }

      // Validate input
      if (!chatRequest.content || chatRequest.content.trim().length === 0) {
        return ErrorHandler.createErrorResponse('Empty message content', 'EMPTY_CONTENT', 400);
      }

      // Sanitize input (basic XSS prevention)
      const sanitizedContent = this.sanitizeInput(chatRequest.content);

      // Create AI provider
      const provider = ProviderFactory.createProvider(config);

      // Create SSE response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const response of provider.streamResponse({
              ...chatRequest,
              content: sanitizedContent
            })) {
              const sseData = `data: ${JSON.stringify(response)}\n\n`;
              controller.enqueue(new TextEncoder().encode(sseData));
            }
          } catch (error) {
            const errorResponse: ChatResponse = {
              token: '',
              type: 'error',
              confidence: 0
            };
            const sseData = `data: ${JSON.stringify(errorResponse)}\n\n`;
            controller.enqueue(new TextEncoder().encode(sseData));
          } finally {
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: ErrorHandler.getSSEHeaders()
      });

    } catch (error) {
      console.error('AI Query Handler Error:', error);
      return ErrorHandler.createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500);
    }
  }

  private getRateLimiter(config: any): RateLimiter {
    if (!this.rateLimiters.has(config.tenantId)) {
      this.rateLimiters.set(config.tenantId, new RateLimiter(config.rateLimit));
    }
    return this.rateLimiters.get(config.tenantId)!;
  }

  private sanitizeInput(input: string): string {
    // Basic XSS prevention - remove script tags and dangerous HTML
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .trim();
  }


}
