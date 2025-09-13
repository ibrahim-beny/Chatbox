import { describe, it, expect } from 'vitest';
import { MockAIProvider } from '../src/backend/providers/mock-provider.js';
import { RateLimiter } from '../src/backend/rate-limiter.js';

describe('Performance Tests', () => {
  it('should meet TTFB requirement: ≤1.2s', async () => {
    const provider = new MockAIProvider();
    const request = {
      tenantId: 'test-tenant',
      conversationId: 'c-123',
      content: 'Performance test'
    };

    const startTime = Date.now();
    for await (const response of provider.streamResponse(request)) {
      if (response.type === 'done') break;
    }
    const endTime = Date.now();

    const responseTime = endTime - startTime;
    expect(responseTime).toBeLessThanOrEqual(1200);
  });

  it('should handle concurrent requests efficiently', async () => {
    const provider = new MockAIProvider();
    const requests = Array.from({ length: 10 }, (_, i) => ({
      tenantId: 'test-tenant',
      conversationId: `c-${i}`,
      content: `Concurrent test ${i}`
    }));

    const startTime = Date.now();
    const promises = requests.map(request => 
      provider.streamResponse(request).next()
    );
    
    await Promise.all(promises);
    const endTime = Date.now();

    const avgResponseTime = (endTime - startTime) / requests.length;
    expect(avgResponseTime).toBeLessThanOrEqual(1200);
  });

  it('should maintain rate limiting performance', () => {
    const config = {
      requestsPerMinute: 1000,
      burstLimit: 100,
      exemptPaths: []
    };
    const rateLimiter = new RateLimiter(config);

    const startTime = Date.now();
    for (let i = 0; i < 1000; i++) {
      rateLimiter.isAllowed('test-tenant');
    }
    const endTime = Date.now();

    const avgTimePerCheck = (endTime - startTime) / 1000;
    expect(avgTimePerCheck).toBeLessThanOrEqual(1); // <1ms per check
  });
});
