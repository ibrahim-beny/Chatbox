import { ErrorResponse } from '../types.js';
import { ServerResponse } from 'http';

export class ErrorHandler {
  static createErrorResponse(message: string, code: string, status: number): Response {
    const errorResponse: ErrorResponse = {
      error: message,
      code: code
    };

    return new Response(JSON.stringify(errorResponse), {
      status,
      headers: this.getCORSHeaders()
    });
  }

  static createRateLimitResponse(
    retryAfter?: number, 
    reason?: string, 
    captchaRequired?: boolean
  ): Response {
    const errorResponse: ErrorResponse = {
      error: reason || 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter,
      captchaRequired
    };

    const headers = this.getCORSHeaders();
    if (retryAfter) {
      headers['Retry-After'] = retryAfter.toString();
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 429,
      headers
    });
  }

  static getCORSHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    };
  }

  static getSSEHeaders(): Record<string, string> {
    return {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID'
    };
  }

  // Node.js HTTP server error handler
  sendError(res: ServerResponse, status: number, title: string, message: string): void {
    const errorResponse: ErrorResponse = {
      error: title,
      code: message
    };

    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID'
    });
    
    res.end(JSON.stringify(errorResponse));
  }
}
