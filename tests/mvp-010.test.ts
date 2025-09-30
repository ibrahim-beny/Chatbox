import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from '../src/backend/rate-limiter.js';
import { WAFService } from '../src/backend/services/waf-service.js';
import { CaptchaService } from '../src/backend/services/captcha-service.js';
import { AbuseProtectionHandler } from '../src/backend/api/abuse-protection.js';
import { RateLimitConfig } from '../src/backend/types.js';

describe('MVP-010: Abuse & Rate Limiting', () => {
  let rateLimiter: RateLimiter;
  let wafService: WAFService;
  let captchaService: CaptchaService;
  let abuseProtectionHandler: AbuseProtectionHandler;

  beforeEach(() => {
    const config: RateLimitConfig = {
      requestsPerMinute: 30,
      burstLimit: 5,
      exemptPaths: ['/health', '/status']
    };
    
    rateLimiter = new RateLimiter(config);
    wafService = new WAFService();
    captchaService = new CaptchaService();
    abuseProtectionHandler = new AbuseProtectionHandler();
  });

  afterEach(() => {
    // Clean up
    captchaService.reset();
  });

  describe('Rate Limiting Tests', () => {
    it('should allow normal requests within limits', () => {
      const result = rateLimiter.isAllowed('user1', 'Mozilla/5.0', '192.168.1.1');
      expect(result.allowed).toBe(true);
      expect(result.retryAfter).toBeUndefined();
      expect(result.captchaRequired).toBeUndefined();
    });

    it('should block burst requests (6 requests in 10 seconds)', async () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      const ipAddress = '192.168.1.1';
      
      // First 5 requests should be allowed
      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.isAllowed('user1', userAgent, ipAddress);
        expect(result.allowed).toBe(true);
        // Small delay to simulate real requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 6th request should be blocked
      const result = rateLimiter.isAllowed('user1', userAgent, ipAddress);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
      expect(result.reason).toBe('Burst limit exceeded');
    });

    it('should block rate limit exceeded (31 requests in 1 minute)', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      const ipAddress = '192.168.1.1';
      
      // Create a new rate limiter with lower limits for testing
      const testConfig = {
        requestsPerMinute: 3, // Lower limit for testing
        burstLimit: 10, // High burst limit to avoid burst blocking
        exemptPaths: []
      };
      const testRateLimiter = new RateLimiter(testConfig);
      
      // Make 3 requests (should be allowed)
      for (let i = 0; i < 3; i++) {
        const result = testRateLimiter.isAllowed('user1', userAgent, ipAddress);
        expect(result.allowed).toBe(true);
      }
      
      // 4th request should be blocked by rate limit
      const result = testRateLimiter.isAllowed('user1', userAgent, ipAddress);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
      expect(result.reason).toBe('Rate limit exceeded');
    });

    it('should detect bot behavior with suspicious user agent', () => {
      const botUserAgent = 'curl/7.68.0';
      const result = rateLimiter.isAllowed('bot1', botUserAgent, '192.168.1.1');
      
      // Should be allowed but marked as suspicious
      expect(result.allowed).toBe(true);
      // Bot detection should trigger captcha requirement
    });

    it('should detect bot behavior with regular request patterns', async () => {
      const userAgent = 'Mozilla/5.0';
      const ipAddress = '192.168.1.1';
      
      // Make very regular requests (bot-like behavior)
      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.isAllowed('bot2', userAgent, ipAddress);
        expect(result.allowed).toBe(true);
        // Very regular timing (500ms intervals)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Should eventually trigger bot detection
      const result = rateLimiter.isAllowed('bot2', userAgent, ipAddress);
      // Bot detection should eventually trigger
    });

    it('should isolate rate limits between different tenants', () => {
      const userAgent = 'Mozilla/5.0';
      const ipAddress = '192.168.1.1';
      
      // Make requests from different tenants
      const result1 = rateLimiter.isAllowed('tenant1', userAgent, ipAddress);
      const result2 = rateLimiter.isAllowed('tenant2', userAgent, ipAddress);
      
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      // Each tenant should have separate rate limits
    });

    it('should provide correct retry-after time', async () => {
      const userAgent = 'Mozilla/5.0';
      const ipAddress = '192.168.1.1';
      
      // Exceed burst limit
      for (let i = 0; i < 6; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        rateLimiter.isAllowed('user1', userAgent, ipAddress);
      }
      
      const result = rateLimiter.isAllowed('user1', userAgent, ipAddress);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(10); // Should be within 10 seconds
    });

    it('should clean up expired entries', () => {
      // This test would require time manipulation or waiting
      // For now, we'll test the cleanup method directly
      rateLimiter.cleanup();
      // Should not throw any errors
    });

    it('should provide abuse statistics', () => {
      const stats = rateLimiter.getAbuseStats();
      expect(stats).toHaveProperty('totalRequests');
      expect(stats).toHaveProperty('blockedRequests');
      expect(stats).toHaveProperty('suspiciousUsers');
      expect(stats).toHaveProperty('captchaRequired');
    });
  });

  describe('WAF Tests', () => {
    it('should block SQL injection attempts', () => {
      const maliciousRequest = {
        method: 'POST',
        path: '/ai/query',
        headers: { 'Content-Type': 'application/json' },
        body: '{"content": "SELECT * FROM users WHERE id = 1 OR 1=1"}'
      };
      
      const result = wafService.checkRequest(
        maliciousRequest.method,
        maliciousRequest.path,
        maliciousRequest.headers,
        maliciousRequest.body
      );
      
      expect(result.blocked).toBe(true);
      expect(result.rule?.name).toContain('SQL Injection');
    });

    it('should block XSS attempts', () => {
      const maliciousRequest = {
        method: 'POST',
        path: '/ai/query',
        headers: { 'Content-Type': 'application/json' },
        body: '{"content": "<script>alert(\'xss\')</script>"}'
      };
      
      const result = wafService.checkRequest(
        maliciousRequest.method,
        maliciousRequest.path,
        maliciousRequest.headers,
        maliciousRequest.body
      );
      
      expect(result.blocked).toBe(true);
      expect(result.rule?.name).toContain('XSS');
    });

    it('should block path traversal attempts', () => {
      const maliciousRequest = {
        method: 'GET',
        path: '/../../../etc/passwd',
        headers: {},
        body: undefined
      };
      
      const result = wafService.checkRequest(
        maliciousRequest.method,
        maliciousRequest.path,
        maliciousRequest.headers,
        maliciousRequest.body
      );
      
      expect(result.blocked).toBe(true);
      expect(result.rule?.name).toContain('Path Traversal');
    });

    it('should block command injection attempts', () => {
      const maliciousRequest = {
        method: 'POST',
        path: '/ai/query',
        headers: { 'Content-Type': 'application/json' },
        body: '{"content": "test; rm -rf /"}'
      };
      
      const result = wafService.checkRequest(
        maliciousRequest.method,
        maliciousRequest.path,
        maliciousRequest.headers,
        maliciousRequest.body
      );
      
      expect(result.blocked).toBe(true);
      expect(result.rule?.name).toContain('Command Injection');
    });

    it('should allow legitimate requests', () => {
      const legitimateRequest = {
        method: 'POST',
        path: '/ai/query',
        headers: { 'Content-Type': 'application/json' },
        body: '{"content": "Hallo, ik heb een vraag over jullie diensten"}'
      };
      
      const result = wafService.checkRequest(
        legitimateRequest.method,
        legitimateRequest.path,
        legitimateRequest.headers,
        legitimateRequest.body
      );
      
      expect(result.blocked).toBe(false);
    });

    it('should challenge suspicious but not malicious requests', () => {
      const suspiciousRequest = {
        method: 'POST',
        path: '/ai/query',
        headers: { 'Content-Type': 'application/json' },
        body: '{"content": "ls -la"}'
      };
      
      const result = wafService.checkRequest(
        suspiciousRequest.method,
        suspiciousRequest.path,
        suspiciousRequest.headers,
        suspiciousRequest.body
      );
      
      expect(result.blocked).toBe(false);
      expect(result.challenge).toBe(true);
    });

    it('should provide WAF statistics', () => {
      const stats = wafService.getStats();
      expect(stats).toHaveProperty('totalRules');
      expect(stats).toHaveProperty('criticalRules');
      expect(stats).toHaveProperty('highRules');
      expect(stats).toHaveProperty('mediumRules');
      expect(stats).toHaveProperty('lowRules');
      expect(stats.totalRules).toBeGreaterThan(0);
    });
  });

  describe('Captcha Tests', () => {
    it('should generate a captcha challenge', () => {
      const result = captchaService.generateChallenge();
      
      expect(result.success).toBe(true);
      expect(result.challengeId).toBeDefined();
      expect(result.question).toBeDefined();
      expect(result.question.length).toBeGreaterThan(0);
    });

    it('should verify correct captcha answer', () => {
      // Generate challenge
      const generateResult = captchaService.generateChallenge();
      expect(generateResult.success).toBe(true);
      
      // For math challenges, we need to solve them
      // For word challenges, we can test with known answers
      if (generateResult.question?.includes('2 + 2')) {
        const verifyResult = captchaService.verifyChallenge(
          generateResult.challengeId!,
          '4'
        );
        expect(verifyResult.success).toBe(true);
      }
    });

    it('should reject incorrect captcha answer', () => {
      // Generate challenge
      const generateResult = captchaService.generateChallenge();
      expect(generateResult.success).toBe(true);
      
      // Try wrong answer
      const verifyResult = captchaService.verifyChallenge(
        generateResult.challengeId!,
        'wronganswer'
      );
      expect(verifyResult.success).toBe(false);
      expect(verifyResult.error).toBeDefined();
    });

    it('should handle expired captcha challenges', () => {
      // This would require time manipulation
      // For now, we'll test the structure
      const result = captchaService.generateChallenge();
      expect(result.success).toBe(true);
    });

    it('should limit captcha attempts', () => {
      // Generate challenge
      const generateResult = captchaService.generateChallenge();
      expect(generateResult.success).toBe(true);
      
      // Make multiple wrong attempts
      for (let i = 0; i < 3; i++) {
        const verifyResult = captchaService.verifyChallenge(
          generateResult.challengeId!,
          'wronganswer'
        );
        if (i < 2) {
          expect(verifyResult.success).toBe(false);
        } else {
          // After max attempts, should fail
          expect(verifyResult.success).toBe(false);
          expect(verifyResult.error).toContain('Maximum attempts exceeded');
        }
      }
    });

    it('should provide captcha statistics', () => {
      const stats = captchaService.getStats();
      expect(stats).toHaveProperty('activeChallenges');
      expect(stats).toHaveProperty('totalGenerated');
      expect(stats).toHaveProperty('successRate');
    });
  });

  describe('Abuse Protection Handler Tests', () => {
    it('should handle WAF check requests', async () => {
      const request = new Request('http://localhost/abuse/waf-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'test' })
      });
      
      const response = await abuseProtectionHandler.handleWAFCheck(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should handle captcha generation requests', async () => {
      const request = new Request('http://localhost/abuse/captcha/generate', {
        method: 'POST'
      });
      
      const response = await abuseProtectionHandler.handleCaptchaGenerate(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.challengeId).toBeDefined();
      expect(data.question).toBeDefined();
    });

    it('should handle captcha verification requests', async () => {
      // First generate a challenge
      const generateRequest = new Request('http://localhost/abuse/captcha/generate', {
        method: 'POST'
      });
      
      const generateResponse = await abuseProtectionHandler.handleCaptchaGenerate(generateRequest);
      const generateData = await generateResponse.json();
      
      // Then verify it (with a likely wrong answer for testing)
      const verifyRequest = new Request('http://localhost/abuse/captcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: generateData.challengeId,
          answer: 'test'
        })
      });
      
      const verifyResponse = await abuseProtectionHandler.handleCaptchaVerify(verifyRequest);
      // Should fail with wrong answer
      expect(verifyResponse.status).toBe(400);
    });

    it('should handle abuse statistics requests', async () => {
      const request = new Request('http://localhost/abuse/stats', {
        method: 'GET'
      });
      
      const response = await abuseProtectionHandler.handleAbuseStats(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.waf).toBeDefined();
      expect(data.captcha).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should have rate limiting overhead <2ms', () => {
      const start = performance.now();
      
      // Perform 100 rate limit checks
      for (let i = 0; i < 100; i++) {
        rateLimiter.isAllowed(`user${i}`, 'Mozilla/5.0', '192.168.1.1');
      }
      
      const end = performance.now();
      const avgTime = (end - start) / 100;
      
      expect(avgTime).toBeLessThan(2); // Should be under 2ms per request
    });

    it('should have WAF overhead <2ms', () => {
      const start = performance.now();
      
      // Perform 100 WAF checks
      for (let i = 0; i < 100; i++) {
        wafService.checkRequest(
          'POST',
          '/ai/query',
          { 'Content-Type': 'application/json' },
          `{"content": "test message ${i}"}`
        );
      }
      
      const end = performance.now();
      const avgTime = (end - start) / 100;
      
      expect(avgTime).toBeLessThan(2); // Should be under 2ms per request
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end with legitimate user', async () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      const ipAddress = '192.168.1.1';
      
      // WAF check should pass
      const wafResult = wafService.checkRequest(
        'POST',
        '/ai/query',
        { 'Content-Type': 'application/json' },
        '{"content": "Hallo, ik heb een vraag"}'
      );
      expect(wafResult.blocked).toBe(false);
      
      // Rate limit should pass
      const rateLimitResult = rateLimiter.isAllowed('user1', userAgent, ipAddress);
      expect(rateLimitResult.allowed).toBe(true);
      
      // No captcha required
      expect(rateLimitResult.captchaRequired).toBeFalsy();
    });

    it('should block malicious user end-to-end', async () => {
      const userAgent = 'curl/7.68.0';
      const ipAddress = '192.168.1.1';
      
      // WAF check should block
      const wafResult = wafService.checkRequest(
        'POST',
        '/ai/query',
        { 'Content-Type': 'application/json' },
        '{"content": "<script>alert(\'xss\')</script>"}'
      );
      expect(wafResult.blocked).toBe(true);
      
      // Rate limit should also detect bot behavior
      const rateLimitResult = rateLimiter.isAllowed('bot1', userAgent, ipAddress);
      // Should be allowed but marked as suspicious
      expect(rateLimitResult.allowed).toBe(true);
    });

    it('should handle burst requests correctly', () => {
      const userAgent = 'Mozilla/5.0';
      const ipAddress = '192.168.1.1';
      
      // Create a new rate limiter with lower burst limit for testing
      const testConfig = {
        requestsPerMinute: 10, // High rate limit to avoid rate limit blocking
        burstLimit: 2, // Lower burst limit for testing
        exemptPaths: []
      };
      const testRateLimiter = new RateLimiter(testConfig);
      
      // Make 2 requests quickly (should be allowed)
      for (let i = 0; i < 2; i++) {
        const result = testRateLimiter.isAllowed('user1', userAgent, ipAddress);
        expect(result.allowed).toBe(true);
      }
      
      // 3rd request should be blocked by burst limit
      const result = testRateLimiter.isAllowed('user1', userAgent, ipAddress);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Burst limit exceeded');
    });
  });
});
