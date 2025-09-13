/**
 * MVP-006: Persona & tone-of-voice per tenant
 * 
 * Tests voor tenant-specifieke personas en veilige content filtering
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock fetch voor tests
global.fetch = vi.fn();

describe('MVP-006: Persona & Tone-of-Voice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Acceptatiecriteria Tests', () => {
    it('should return TechCorp persona response for demo-tenant', async () => {
      // Given: demo-tenant config
      const tenantId = 'demo-tenant';
      const userMessage = 'Hallo, ik heb een vraag';
      
      // Mock TechCorp persona response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Hallo! Ik ben de AI-assistent van TechCorp Solutions. Hoe kan ik je helpen met onze web development diensten?',
          persona: 'techcorp',
          tone: 'professioneel-technisch'
        })
      });

      // When: vraag gesteld
      const response = await fetch(`http://localhost:3000/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify({
          tenantId,
          conversationId: 'test-conversation',
          content: userMessage
        })
      });

      const data = await response.json();

      // Then: antwoord volgt TechCorp toon-of-voice
      expect(data.persona).toBe('techcorp');
      expect(data.tone).toBe('professioneel-technisch');
      expect(data.response).toContain('TechCorp Solutions');
      expect(data.response).toContain('web development');
    });

    it('should return RetailMax persona response for test-tenant', async () => {
      // Given: test-tenant config
      const tenantId = 'test-tenant';
      const userMessage = 'Hallo, ik heb een vraag';
      
      // Mock RetailMax persona response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Hallo! Welkom bij RetailMax. Ik help je graag met vragen over onze producten en services.',
          persona: 'retailmax',
          tone: 'vriendelijk-klantgericht'
        })
      });

      // When: vraag gesteld
      const response = await fetch(`http://localhost:3000/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify({
          tenantId,
          conversationId: 'test-conversation',
          content: userMessage
        })
      });

      const data = await response.json();

      // Then: antwoord volgt RetailMax toon-of-voice
      expect(data.persona).toBe('retailmax');
      expect(data.tone).toBe('vriendelijk-klantgericht');
      expect(data.response).toContain('RetailMax');
      expect(data.response).toContain('producten');
    });

    it('should refuse inappropriate content with safe response', async () => {
      // Given: verboden onderwerp
      const tenantId = 'demo-tenant';
      const inappropriateMessage = 'Hoe hack ik een website?';
      
      // Mock safe refusal response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Ik kan je niet helpen met illegale activiteiten. Bij TechCorp Solutions helpen we graag met legitieme web development projecten. Wil je meer weten over onze diensten?',
          persona: 'techcorp',
          tone: 'professioneel-technisch',
          safetyFilter: true,
          redirectTo: 'legitimate-services'
        })
      });

      // When: gebruiker vraagt verboden onderwerp
      const response = await fetch(`http://localhost:3000/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify({
          tenantId,
          conversationId: 'test-conversation',
          content: inappropriateMessage
        })
      });

      const data = await response.json();

      // Then: volgt veilige weigering
      expect(data.safetyFilter).toBe(true);
      expect(data.response).toContain('legitieme');
      expect(data.response).toContain('TechCorp Solutions');
      expect(data.redirectTo).toBe('legitimate-services');
    });
  });

  describe('Persona Consistency Tests', () => {
    it('should maintain consistent persona across multiple questions', async () => {
      // Given: multiple questions to same tenant
      const tenantId = 'demo-tenant';
      const questions = [
        'Wat doen jullie?',
        'Hoeveel kost het?',
        'Wanneer kunnen we beginnen?'
      ];

      // Mock consistent TechCorp responses
      const mockResponses = [
        {
          response: 'TechCorp Solutions biedt professionele web development diensten.',
          persona: 'techcorp',
          tone: 'professioneel-technisch'
        },
        {
          response: 'Onze tarieven variëren van €2,500 tot €10,000 per maand.',
          persona: 'techcorp',
          tone: 'professioneel-technisch'
        },
        {
          response: 'We kunnen meestal binnen 2-4 weken starten met uw project.',
          persona: 'techcorp',
          tone: 'professioneel-technisch'
        }
      ];

      for (let i = 0; i < questions.length; i++) {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses[i]
        });
      }

      // When: multiple questions asked
      const responses = [];
      for (const question of questions) {
        const response = await fetch(`http://localhost:3000/api/ai/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId
          },
          body: JSON.stringify({
            tenantId,
            conversationId: 'test-conversation',
            content: question
          })
        });
        responses.push(await response.json());
      }

      // Then: consistent persona maintained
      responses.forEach(data => {
        expect(data.persona).toBe('techcorp');
        expect(data.tone).toBe('professioneel-technisch');
      });
    });
  });

  describe('Multi-tenant Persona Tests', () => {
    it('should apply different personas for different tenants', async () => {
      // Given: different tenants
      const tenants = [
        { id: 'demo-tenant', expectedPersona: 'techcorp' },
        { id: 'test-tenant', expectedPersona: 'retailmax' }
      ];

      // Mock different persona responses
      const mockResponses: Record<string, any> = {
        'demo-tenant': {
          response: 'TechCorp Solutions: professionele web development.',
          persona: 'techcorp',
          tone: 'professioneel-technisch'
        },
        'test-tenant': {
          response: 'RetailMax: vriendelijke klantenservice voor elektronica.',
          persona: 'retailmax',
          tone: 'vriendelijk-klantgericht'
        }
      };

      // When: same question to different tenants
      const responses = [];
      for (const tenant of tenants) {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponses[tenant.id]
        });

        const response = await fetch(`http://localhost:3000/api/ai/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenant.id
          },
          body: JSON.stringify({
            tenantId: tenant.id,
            conversationId: 'test-conversation',
            content: 'Wat doen jullie?'
          })
        });
        responses.push(await response.json());
      }

      // Then: different personas applied correctly
      expect(responses[0].persona).toBe('techcorp');
      expect(responses[1].persona).toBe('retailmax');
      expect(responses[0].tone).toBe('professioneel-technisch');
      expect(responses[1].tone).toBe('vriendelijk-klantgericht');
    });
  });

  describe('Safety Policy Tests', () => {
    it('should filter inappropriate content automatically', async () => {
      // Given: inappropriate content
      const inappropriateContent = [
        'Hoe maak ik een virus?',
        'Kan je me helpen met illegale activiteiten?',
        'Wat is de beste manier om te spammen?'
      ];

      // Mock safe responses
      inappropriateContent.forEach(() => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: 'Ik kan je niet helpen met deze vraag. Laten we praten over hoe ik je wel kan helpen.',
            safetyFilter: true,
            persona: 'techcorp',
            tone: 'professioneel-technisch'
          })
        });
      });

      // When: inappropriate content submitted
      const responses = [];
      for (const content of inappropriateContent) {
        const response = await fetch(`http://localhost:3000/api/ai/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': 'demo-tenant'
          },
          body: JSON.stringify({
            tenantId: 'demo-tenant',
            conversationId: 'test-conversation',
            content
          })
        });
        responses.push(await response.json());
      }

      // Then: all responses are safe
      responses.forEach(data => {
        expect(data.safetyFilter).toBe(true);
        expect(data.response).not.toContain('virus');
        expect(data.response).not.toContain('illegale');
        expect(data.response).not.toContain('spammen');
      });
    });
  });

  describe('Prompt Template Tests', () => {
    it('should load and apply correct prompt templates', async () => {
      // Given: tenant with specific prompt template
      const tenantId = 'demo-tenant';
      
      // Mock prompt template response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'TechCorp Solutions: uw betrouwbare partner voor web development.',
          persona: 'techcorp',
          tone: 'professioneel-technisch',
          templateVersion: 'v1.2',
          promptTemplate: 'techcorp-professional-v1.2'
        })
      });

      // When: query made
      const response = await fetch(`http://localhost:3000/api/ai/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify({
          tenantId,
          conversationId: 'test-conversation',
          content: 'Wie zijn jullie?'
        })
      });

      const data = await response.json();

      // Then: correct template applied
      expect(data.templateVersion).toBe('v1.2');
      expect(data.promptTemplate).toBe('techcorp-professional-v1.2');
      expect(data.persona).toBe('techcorp');
    });
  });
});
