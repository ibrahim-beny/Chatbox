import { WAFService } from '../services/waf-service.js';
import { CaptchaService } from '../services/captcha-service.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class AbuseProtectionHandler {
  private wafService: WAFService;
  private captchaService: CaptchaService;

  constructor() {
    this.wafService = new WAFService();
    this.captchaService = new CaptchaService();
  }

  async handleWAFCheck(request: Request): Promise<Response> {
    try {
      const method = request.method;
      const url = new URL(request.url);
      const path = url.pathname;
      
      // Extract headers
      const headers: Record<string, string> = {};
      for (const [key, value] of request.headers.entries()) {
        headers[key] = value;
      }
      
      // Extract body if present
      let body: string | undefined;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        try {
          body = await request.text();
        } catch (error) {
          // Ignore body parsing errors for WAF check
        }
      }
      
      const wafResult = this.wafService.checkRequest(method, path, headers, body);
      
      if (wafResult.blocked) {
        return ErrorHandler.createErrorResponse(
          wafResult.reason || 'Request blocked by WAF',
          'WAF_BLOCKED',
          403
        );
      }
      
      return new Response(JSON.stringify({
        success: true,
        blocked: false,
        challenge: wafResult.challenge || false,
        reason: wafResult.reason
      }), {
        status: 200,
        headers: ErrorHandler.getCORSHeaders()
      });
      
    } catch (error) {
      console.error('WAF check error:', error);
      return ErrorHandler.createErrorResponse('WAF check failed', 'WAF_ERROR', 500);
    }
  }

  async handleCaptchaGenerate(request: Request): Promise<Response> {
    try {
      const result = this.captchaService.generateChallenge();
      
      if (!result.success) {
        return ErrorHandler.createErrorResponse(
          result.error || 'Failed to generate challenge',
          'CAPTCHA_GENERATION_FAILED',
          500
        );
      }
      
      return new Response(JSON.stringify({
        success: true,
        challengeId: result.challengeId,
        question: result.question
      }), {
        status: 200,
        headers: ErrorHandler.getCORSHeaders()
      });
      
    } catch (error) {
      console.error('Captcha generation error:', error);
      return ErrorHandler.createErrorResponse('Captcha generation failed', 'CAPTCHA_ERROR', 500);
    }
  }

  async handleCaptchaVerify(request: Request): Promise<Response> {
    try {
      const { challengeId, answer } = await request.json();
      
      if (!challengeId || !answer) {
        return ErrorHandler.createErrorResponse(
          'Missing challengeId or answer',
          'MISSING_CAPTCHA_DATA',
          400
        );
      }
      
      const result = this.captchaService.verifyChallenge(challengeId, answer);
      
      if (!result.success) {
        return ErrorHandler.createErrorResponse(
          result.error || 'Captcha verification failed',
          'CAPTCHA_VERIFICATION_FAILED',
          400
        );
      }
      
      return new Response(JSON.stringify({
        success: true,
        verified: true
      }), {
        status: 200,
        headers: ErrorHandler.getCORSHeaders()
      });
      
    } catch (error) {
      console.error('Captcha verification error:', error);
      return ErrorHandler.createErrorResponse('Captcha verification failed', 'CAPTCHA_ERROR', 500);
    }
  }

  async handleAbuseStats(request: Request): Promise<Response> {
    try {
      const wafStats = this.wafService.getStats();
      const captchaStats = this.captchaService.getStats();
      
      return new Response(JSON.stringify({
        success: true,
        waf: wafStats,
        captcha: captchaStats,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: ErrorHandler.getCORSHeaders()
      });
      
    } catch (error) {
      console.error('Abuse stats error:', error);
      return ErrorHandler.createErrorResponse('Failed to get abuse stats', 'STATS_ERROR', 500);
    }
  }

  // Get WAF service instance for use in other handlers
  getWAFService(): WAFService {
    return this.wafService;
  }

  // Get Captcha service instance for use in other handlers
  getCaptchaService(): CaptchaService {
    return this.captchaService;
  }
}
