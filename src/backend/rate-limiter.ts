import { RateLimitConfig } from './types.js';

interface RateLimitEntry {
  count: number;
  burstCount: number;
  resetTime: number;
  burstResetTime: number;
  lastRequestTime: number;
  suspiciousActivity: boolean;
  captchaRequired: boolean;
}

interface BotDetectionMetrics {
  requestPattern: number[];
  userAgent: string;
  ipAddress: string;
  suspiciousScore: number;
  lastSeen: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private botMetrics: Map<string, BotDetectionMetrics> = new Map();
  private config: RateLimitConfig;
  private startTime: number;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.startTime = Date.now();
    
    // Start cleanup interval
    setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  isAllowed(identifier: string, userAgent?: string, ipAddress?: string): { 
    allowed: boolean; 
    retryAfter?: number; 
    captchaRequired?: boolean;
    reason?: string;
  } {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    // Bot detection
    const botScore = this.detectBot(identifier, userAgent, ipAddress);
    if (botScore > 0.8) {
      return { 
        allowed: false, 
        reason: 'Bot detected',
        captchaRequired: true 
      };
    }

    // Initialize or reset entry
    if (!entry || now > entry.resetTime) {
      this.limits.set(identifier, {
        count: 1,
        burstCount: 1,
        resetTime: now + 60000, // 1 minute window
        burstResetTime: now + 10000, // 10 second burst window
        lastRequestTime: now,
        suspiciousActivity: botScore > 0.5,
        captchaRequired: botScore > 0.7
      });
      return { allowed: true };
    }

    // Check burst limit (configurable requests per 10 seconds)
    if (now <= entry.burstResetTime) {
      if (entry.burstCount >= this.config.burstLimit) {
        const retryAfter = Math.ceil((entry.burstResetTime - now) / 1000);
        return { 
          allowed: false, 
          retryAfter,
          reason: 'Burst limit exceeded',
          captchaRequired: entry.suspiciousActivity
        };
      }
      entry.burstCount++;
    } else {
      // Reset burst window
      entry.burstCount = 1;
      entry.burstResetTime = now + 10000;
    }

    // Check rate limit (30 requests per minute)
    if (entry.count >= this.config.requestsPerMinute) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return { 
        allowed: false, 
        retryAfter,
        reason: 'Rate limit exceeded',
        captchaRequired: entry.suspiciousActivity
      };
    }

    // Update entry
    entry.count++;
    entry.lastRequestTime = now;
    
    // Mark as suspicious if requests are too frequent
    const timeSinceLastRequest = now - entry.lastRequestTime;
    if (timeSinceLastRequest < 1000) { // Less than 1 second between requests
      entry.suspiciousActivity = true;
    }

    return { allowed: true };
  }

  private detectBot(identifier: string, userAgent?: string, ipAddress?: string): number {
    const now = Date.now();
    let metrics = this.botMetrics.get(identifier);

    if (!metrics) {
      metrics = {
        requestPattern: [],
        userAgent: userAgent || '',
        ipAddress: ipAddress || '',
        suspiciousScore: 0,
        lastSeen: now
      };
      this.botMetrics.set(identifier, metrics);
    }

    // Update request pattern (last 10 requests)
    metrics.requestPattern.push(now);
    if (metrics.requestPattern.length > 10) {
      metrics.requestPattern.shift();
    }

    let suspiciousScore = 0;

    // Check for bot-like patterns
    if (metrics.requestPattern.length >= 3) {
      const intervals = [];
      for (let i = 1; i < metrics.requestPattern.length; i++) {
        intervals.push(metrics.requestPattern[i] - metrics.requestPattern[i - 1]);
      }

      // Check for regular intervals (bot-like behavior)
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev < 100 && avgInterval < 2000) { // Very regular, fast requests
        suspiciousScore += 0.4;
      }

      // Check for too fast requests
      if (avgInterval < 500) { // Less than 500ms between requests
        suspiciousScore += 0.3;
      }
    }

    // Check user agent
    if (!userAgent || userAgent.length < 10) {
      suspiciousScore += 0.2;
    }

    // Check for common bot user agents
    const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget'];
    if (userAgent && botPatterns.some(pattern => userAgent.toLowerCase().includes(pattern))) {
      suspiciousScore += 0.3;
    }

    // Check for missing or suspicious headers
    if (!userAgent) {
      suspiciousScore += 0.1;
    }

    metrics.suspiciousScore = Math.min(suspiciousScore, 1.0);
    metrics.lastSeen = now;

    return metrics.suspiciousScore;
  }

  isExemptPath(path: string): boolean {
    return this.config.exemptPaths.some(exemptPath => 
      path.startsWith(exemptPath)
    );
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    
    // Clean up rate limit entries
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }

    // Clean up bot metrics (keep for 1 hour)
    for (const [key, metrics] of this.botMetrics.entries()) {
      if (now - metrics.lastSeen > 3600000) { // 1 hour
        this.botMetrics.delete(key);
      }
    }
  }

  // Get abuse statistics
  getAbuseStats(): {
    totalRequests: number;
    blockedRequests: number;
    suspiciousUsers: number;
    captchaRequired: number;
  } {
    let totalRequests = 0;
    let blockedRequests = 0;
    let suspiciousUsers = 0;
    let captchaRequired = 0;

    for (const entry of this.limits.values()) {
      totalRequests += entry.count;
      if (entry.suspiciousActivity) {
        suspiciousUsers++;
      }
      if (entry.captchaRequired) {
        captchaRequired++;
      }
    }

    return {
      totalRequests,
      blockedRequests,
      suspiciousUsers,
      captchaRequired
    };
  }

  // Reset user's rate limit (for testing or manual intervention)
  resetUser(identifier: string): void {
    this.limits.delete(identifier);
    this.botMetrics.delete(identifier);
  }
}
