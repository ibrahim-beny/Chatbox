interface WAFRule {
  id: string;
  name: string;
  pattern: RegExp;
  action: 'block' | 'log' | 'challenge';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface WAFResult {
  blocked: boolean;
  rule?: WAFRule;
  reason?: string;
  challenge?: boolean;
}

export class WAFService {
  private rules: WAFRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules(): void {
    this.rules = [
      // SQL Injection patterns
      {
        id: 'sql-injection-1',
        name: 'SQL Injection - Basic',
        pattern: /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(from|into|where|set|table|database)\b)/i,
        action: 'block',
        severity: 'critical',
        description: 'Basic SQL injection attempt detected'
      },
      {
        id: 'sql-injection-2',
        name: 'SQL Injection - Comments',
        pattern: /(--|\/\*|\*\/|#)/i,
        action: 'block',
        severity: 'high',
        description: 'SQL comment injection attempt'
      },
      {
        id: 'sql-injection-3',
        name: 'SQL Injection - Quotes',
        pattern: /('|"|`).*(\bor\b|\band\b).*('|"|`)/i,
        action: 'block',
        severity: 'high',
        description: 'SQL quote injection attempt'
      },

      // XSS patterns
      {
        id: 'xss-1',
        name: 'XSS - Script Tags',
        pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        action: 'block',
        severity: 'critical',
        description: 'Script tag injection attempt'
      },
      {
        id: 'xss-2',
        name: 'XSS - Event Handlers',
        pattern: /on\w+\s*=/i,
        action: 'block',
        severity: 'high',
        description: 'Event handler injection attempt'
      },
      {
        id: 'xss-3',
        name: 'XSS - JavaScript Protocol',
        pattern: /javascript\s*:/i,
        action: 'block',
        severity: 'high',
        description: 'JavaScript protocol injection attempt'
      },

      // Path traversal
      {
        id: 'path-traversal-1',
        name: 'Path Traversal - Basic',
        pattern: /\.\.\//,
        action: 'block',
        severity: 'high',
        description: 'Path traversal attempt detected'
      },
      {
        id: 'path-traversal-2',
        name: 'Path Traversal - Encoded',
        pattern: /%2e%2e%2f|%2e%2e%5c/i,
        action: 'block',
        severity: 'high',
        description: 'Encoded path traversal attempt'
      },

      // Command injection
      {
        id: 'command-injection-1',
        name: 'Command Injection - Basic',
        pattern: /(\||&|;|\$\(|\`)/,
        action: 'block',
        severity: 'critical',
        description: 'Command injection attempt detected'
      },
      {
        id: 'command-injection-2',
        name: 'Command Injection - System Commands',
        pattern: /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig|ping|curl|wget)\b/i,
        action: 'challenge',
        severity: 'medium',
        description: 'System command detected'
      },

      // File inclusion
      {
        id: 'file-inclusion-1',
        name: 'File Inclusion - Basic',
        pattern: /(include|require|include_once|require_once)\s*\(/i,
        action: 'block',
        severity: 'high',
        description: 'File inclusion attempt detected'
      },

      // LDAP injection
      {
        id: 'ldap-injection-1',
        name: 'LDAP Injection - Basic',
        pattern: /[()=*!&|]/,
        action: 'challenge',
        severity: 'medium',
        description: 'LDAP injection pattern detected'
      },

      // NoSQL injection
      {
        id: 'nosql-injection-1',
        name: 'NoSQL Injection - Basic',
        pattern: /\$where|\$ne|\$gt|\$lt|\$regex/i,
        action: 'block',
        severity: 'high',
        description: 'NoSQL injection attempt detected'
      },

      // SSRF patterns
      {
        id: 'ssrf-1',
        name: 'SSRF - Internal IPs',
        pattern: /(127\.0\.0\.1|localhost|0\.0\.0\.0|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/i,
        action: 'challenge',
        severity: 'medium',
        description: 'Internal IP access attempt'
      },

      // Suspicious patterns
      {
        id: 'suspicious-1',
        name: 'Suspicious - Long Content',
        pattern: /.{10000,}/,
        action: 'challenge',
        severity: 'low',
        description: 'Unusually long content detected'
      },
      {
        id: 'suspicious-2',
        name: 'Suspicious - Binary Data',
        pattern: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/,
        action: 'challenge',
        severity: 'medium',
        description: 'Binary data detected in text field'
      }
    ];
  }

  checkRequest(
    method: string,
    path: string,
    headers: Record<string, string>,
    body?: string
  ): WAFResult {
    const input = `${method} ${path} ${JSON.stringify(headers)} ${body || ''}`.toLowerCase();

    for (const rule of this.rules) {
      if (rule.pattern.test(input)) {
        // Log the attempt
        console.warn(`WAF Rule triggered: ${rule.name} (${rule.severity}) - ${rule.description}`);
        
        if (rule.action === 'block') {
          return {
            blocked: true,
            rule,
            reason: `Blocked by WAF rule: ${rule.name}`
          };
        } else if (rule.action === 'challenge') {
          return {
            blocked: false,
            rule,
            challenge: true,
            reason: `Challenge required by WAF rule: ${rule.name}`
          };
        }
      }
    }

    return { blocked: false };
  }

  // Add custom rule
  addRule(rule: WAFRule): void {
    this.rules.push(rule);
  }

  // Remove rule by ID
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  // Get all rules
  getRules(): WAFRule[] {
    return [...this.rules];
  }

  // Get statistics
  getStats(): {
    totalRules: number;
    criticalRules: number;
    highRules: number;
    mediumRules: number;
    lowRules: number;
  } {
    const stats = {
      totalRules: this.rules.length,
      criticalRules: 0,
      highRules: 0,
      mediumRules: 0,
      lowRules: 0
    };

    for (const rule of this.rules) {
      switch (rule.severity) {
        case 'critical':
          stats.criticalRules++;
          break;
        case 'high':
          stats.highRules++;
          break;
        case 'medium':
          stats.mediumRules++;
          break;
        case 'low':
          stats.lowRules++;
          break;
      }
    }

    return stats;
  }
}
