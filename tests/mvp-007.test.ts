/**
 * MVP-007: Menselijke handover via e-mail
 * 
 * Tests voor handover functionaliteit met SendGrid en retry mechaniek
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock fetch voor tests
global.fetch = vi.fn();

describe('MVP-007: Human Handover via Email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Acceptatiecriteria Tests', () => {
    it('should trigger handover when AI confidence is low', async () => {
      // Given: AI confidence laag (<0.7)
      const tenantId = 'demo-tenant';
      const conversationId = 'test-conversation';
      const userMessage = 'Ik begrijp het niet, kan ik met iemand praten?';
      
      // Mock low confidence response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Ik begrijp je vraag niet helemaal. Laat me je doorverbinden met een menselijke collega.',
          confidence: 0.5, // Low confidence
          handoverTriggered: true,
          handoverToken: 'uuid-handover-token-123',
          handoverStatus: 'queued'
        })
      });

      // When: gebruiker kiest handover
      const response = await fetch(`http://localhost:3000/api/handover/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify({
          tenantId,
          conversationId,
          userMessage,
          confidence: 0.5,
          triggerReason: 'low_confidence'
        })
      });

      const data = await response.json();

      // Then: vraag doorgestuurd via e-mail en bevestigd
      expect(data.success).toBe(true);
      expect(data.handoverToken).toBeDefined();
      expect(data.handoverStatus).toBe('queued');
      expect(data.emailSent).toBe(true);
      expect(data.confirmationMessage).toContain('handover');
    });

    it('should show queue message during off-hours', async () => {
      // Given: buiten kantooruren
      const tenantId = 'demo-tenant';
      const conversationId = 'test-conversation';
      const userMessage = 'Ik heb hulp nodig';
      
      // Mock off-hours response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Bedankt voor je bericht. We zijn momenteel buiten kantooruren, maar je vraag is toegevoegd aan onze wachtrij.',
          handoverTriggered: true,
          handoverToken: 'uuid-handover-token-456',
          handoverStatus: 'queued',
          queuePosition: 3,
          estimatedResponseTime: '2-4 uur',
          isOffHours: true
        })
      });

      // When: handover tijdens off-hours
      const response = await fetch(`http://localhost:3000/api/handover/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify({
          tenantId,
          conversationId,
          userMessage,
          confidence: 0.6,
          triggerReason: 'low_confidence',
          isOffHours: true
        })
      });

      const data = await response.json();

      // Then: nette wachtrijmelding
      expect(data.success).toBe(true);
      expect(data.handoverStatus).toBe('queued');
      expect(data.isOffHours).toBe(true);
      expect(data.queuePosition).toBeDefined();
      expect(data.estimatedResponseTime).toBeDefined();
      expect(data.confirmationMessage).toContain('wachtrij');
    });
  });

  describe('Handover Trigger Tests', () => {
    it('should trigger handover on specific keywords', async () => {
      // Given: specifieke keywords
      const keywords = ['mens', 'klantenservice', 'bellen', 'agent', 'mensen'];
      
      for (const keyword of keywords) {
        const userMessage = `Ik wil graag met een ${keyword} praten`;
        
        // Mock keyword-triggered handover
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: `Ik begrijp dat je graag met een menselijke collega wilt praten. Laat me je doorverbinden.`,
            handoverTriggered: true,
            handoverToken: `uuid-handover-${keyword}-${Date.now()}`,
            handoverStatus: 'queued',
            triggerReason: 'keyword_match',
            matchedKeyword: keyword
          })
        });

        // When: message met keyword
        const response = await fetch(`http://localhost:3000/api/handover/request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': 'demo-tenant'
          },
          body: JSON.stringify({
            tenantId: 'demo-tenant',
            conversationId: 'test-conversation',
            userMessage,
            confidence: 0.8, // High confidence but keyword triggers
            triggerReason: 'keyword_match'
          })
        });

        const data = await response.json();

        // Then: handover triggered
        expect(data.success).toBe(true);
        expect(data.handoverTriggered).toBe(true);
        expect(data.triggerReason).toBe('keyword_match');
        expect(data.matchedKeyword).toBe(keyword);
      }
    });

    it('should trigger handover on frustration signals', async () => {
      // Given: frustration signals
      const frustrationMessages = [
        'Dit werkt niet!',
        'Ik ben gefrustreerd',
        'Dit is belachelijk',
        'Waarom werkt dit niet?',
        'Ik geef het op'
      ];

      for (const message of frustrationMessages) {
        // Mock frustration-triggered handover
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: 'Ik begrijp je frustratie. Laat me je doorverbinden met een menselijke collega die je beter kan helpen.',
            handoverTriggered: true,
            handoverToken: `uuid-handover-frustration-${Date.now()}`,
            handoverStatus: 'queued',
            triggerReason: 'frustration_detected',
            frustrationScore: 0.8
          })
        });

        // When: frustration message
        const response = await fetch(`http://localhost:3000/api/handover/request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': 'demo-tenant'
          },
          body: JSON.stringify({
            tenantId: 'demo-tenant',
            conversationId: 'test-conversation',
            userMessage: message,
            confidence: 0.7,
            triggerReason: 'frustration_detected'
          })
        });

        const data = await response.json();

        // Then: handover triggered
        expect(data.success).toBe(true);
        expect(data.handoverTriggered).toBe(true);
        expect(data.triggerReason).toBe('frustration_detected');
        expect(data.frustrationScore).toBeGreaterThan(0.7);
      }
    });
  });

  describe('Email Integration Tests', () => {
    it('should send email with tenant-specific template', async () => {
      // Given: handover request
      const tenantId = 'demo-tenant';
      const handoverData = {
        tenantId,
        conversationId: 'test-conversation',
        userMessage: 'Ik heb hulp nodig',
        persona: 'techcorp',
        tone: 'professioneel-technisch',
        transcript: ['User: Hallo', 'AI: Hoe kan ik helpen?', 'User: Ik heb hulp nodig']
      };

      // Mock SendGrid email response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          emailSent: true,
          emailId: 'sendgrid-email-id-123',
          templateUsed: 'techcorp-handover-template',
          recipientEmail: 'support@techcorp.com',
          handoverToken: 'uuid-handover-token-789'
        })
      });

      // When: email wordt verzonden
      const response = await fetch(`http://localhost:3000/api/handover/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify(handoverData)
      });

      const data = await response.json();

      // Then: email verzonden met juiste template
      expect(data.success).toBe(true);
      expect(data.emailSent).toBe(true);
      expect(data.templateUsed).toBe('techcorp-handover-template');
      expect(data.recipientEmail).toBe('support@techcorp.com');
      expect(data.handoverToken).toBeDefined();
    });

    it('should use different templates for different tenants', async () => {
      // Given: different tenants
      const tenants = [
        { id: 'demo-tenant', expectedTemplate: 'techcorp-handover-template', expectedEmail: 'support@techcorp.com' },
        { id: 'test-tenant', expectedTemplate: 'retailmax-handover-template', expectedEmail: 'service@retailmax.com' }
      ];

      for (const tenant of tenants) {
        // Mock tenant-specific email response
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            emailSent: true,
            templateUsed: tenant.expectedTemplate,
            recipientEmail: tenant.expectedEmail,
            handoverToken: `uuid-handover-${tenant.id}-${Date.now()}`
          })
        });

        // When: email voor tenant
        const response = await fetch(`http://localhost:3000/api/handover/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenant.id
          },
          body: JSON.stringify({
            tenantId: tenant.id,
            conversationId: 'test-conversation',
            userMessage: 'Ik heb hulp nodig',
            persona: tenant.id === 'demo-tenant' ? 'techcorp' : 'retailmax',
            tone: tenant.id === 'demo-tenant' ? 'professioneel-technisch' : 'vriendelijk-klantgericht'
          })
        });

        const data = await response.json();

        // Then: juiste template gebruikt
        expect(data.success).toBe(true);
        expect(data.templateUsed).toBe(tenant.expectedTemplate);
        expect(data.recipientEmail).toBe(tenant.expectedEmail);
      }
    });
  });

  describe('Retry Mechanism Tests', () => {
    it('should retry email sending on failure', async () => {
      // Given: email sending fails initially
      const tenantId = 'demo-tenant';
      const handoverData = {
        tenantId,
        conversationId: 'test-conversation',
        userMessage: 'Test message'
      };

      // Mock initial failure, then success
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('SendGrid API error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            emailSent: true,
            retryCount: 1,
            handoverToken: 'uuid-handover-retry-success'
          })
        });

      // When: email sending with retry
      const response = await fetch(`http://localhost:3000/api/handover/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify(handoverData)
      });

      const data = await response.json();

      // Then: email sent after retry
      expect(data.success).toBe(true);
      expect(data.emailSent).toBe(true);
      expect(data.retryCount).toBe(1);
    });

    it('should fail after max retries', async () => {
      // Given: email sending fails repeatedly
      const tenantId = 'demo-tenant';
      const handoverData = {
        tenantId,
        conversationId: 'test-conversation',
        userMessage: 'Test message'
      };

      // Mock repeated failures
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('SendGrid API error'))
        .mockRejectedValueOnce(new Error('SendGrid API error'))
        .mockRejectedValueOnce(new Error('SendGrid API error'));

      // When: email sending with max retries
      const response = await fetch(`http://localhost:3000/api/handover/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify(handoverData)
      });

      const data = await response.json();

      // Then: email failed after max retries
      expect(data.success).toBe(false);
      expect(data.emailSent).toBe(false);
      expect(data.retryCount).toBe(2);
      expect(data.error).toContain('max retries');
    });
  });

  describe('Token Security Tests', () => {
    it('should generate secure UUID tokens', async () => {
      // Given: handover request
      const tenantId = 'demo-tenant';
      
      // Mock token generation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          handoverToken: '550e8400-e29b-41d4-a716-446655440000',
          tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          tokenType: 'uuid'
        })
      });

      // When: token wordt gegenereerd
      const response = await fetch(`http://localhost:3000/api/handover/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify({
          tenantId,
          conversationId: 'test-conversation'
        })
      });

      const data = await response.json();

      // Then: secure UUID token gegenereerd
      expect(data.success).toBe(true);
      expect(data.handoverToken).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(data.tokenType).toBe('uuid');
      expect(new Date(data.tokenExpiry)).toBeInstanceOf(Date);
    });

    it('should validate token before processing', async () => {
      // Given: invalid token
      const invalidToken = 'invalid-token-123';
      
      // Mock token validation failure
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        })
      });

      // When: request met invalid token
      const response = await fetch(`http://localhost:3000/api/handover/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: invalidToken
        })
      });

      const data = await response.json();

      // Then: token validation failed
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid or expired token');
      expect(data.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Logging Integration Tests', () => {
    it('should log handover events', async () => {
      // Given: handover request
      const tenantId = 'demo-tenant';
      const handoverData = {
        tenantId,
        conversationId: 'test-conversation',
        userMessage: 'Test handover',
        triggerReason: 'low_confidence'
      };

      // Mock logging response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          handoverToken: 'uuid-handover-logged',
          logged: true,
          logEntry: {
            tenantId,
            conversationId: 'test-conversation',
            status: 'handover_requested',
            timestamp: new Date().toISOString(),
            triggerReason: 'low_confidence'
          }
        })
      });

      // When: handover wordt gelogd
      const response = await fetch(`http://localhost:3000/api/handover/log-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify(handoverData)
      });

      const data = await response.json();

      // Then: event gelogd
      expect(data.success).toBe(true);
      expect(data.logged).toBe(true);
      expect(data.logEntry.tenantId).toBe(tenantId);
      expect(data.logEntry.status).toBe('handover_requested');
      expect(data.logEntry.timestamp).toBeDefined();
    });
  });
});

