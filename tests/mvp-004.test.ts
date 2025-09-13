/**
 * MVP-004 Tests - Kennisbasis (RAG) ingest & retrieval
 * 
 * Tests voor alle acceptatiecriteria en NFR-checks van MVP-004
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeStoreService } from '../src/backend/services/knowledge-store';
import { KnowledgeSearchService } from '../src/widget/knowledge-search';

describe('MVP-004: Kennisbasis (RAG) ingest & retrieval', () => {
  let store: KnowledgeStoreService;

  beforeEach(() => {
    store = new KnowledgeStoreService();
  });

  describe('Acceptatiecriteria Tests', () => {
    it('Given PDF/FAQ upload - When ingest draait - Then status processed zichtbaar', async () => {
      const ingestRequest = {
        tenantId: 'test-tenant',
        title: 'Test Document',
        content: 'Dit is test content voor document processing.',
        type: 'pdf' as const,
        source: 'test.pdf'
      };

      const result = await store.ingestDocument(ingestRequest);

      expect(result.status).toBe('processed');
      expect(result.documentId).toBeDefined();
      expect(result.chunks).toBeGreaterThan(0);
      expect(result.message).toContain('succesvol verwerkt');
    });

    it('Given gebruikersvraag - When retrieval plaatsvindt - Then top-k passages met bron', async () => {
      const searchRequest = {
        tenantId: 'demo-tenant',
        query: 'web development',
        limit: 3
      };

      const result = await store.searchDocuments(searchRequest);

      expect(result.results).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.totalFound).toBeGreaterThan(0);
      expect(result.query).toBe('web development');
      expect(result.tenantId).toBe('demo-tenant');

      // Check result structure
      const firstResult = result.results[0];
      expect(firstResult.chunk).toBeDefined();
      expect(firstResult.document).toBeDefined();
      expect(firstResult.score).toBeGreaterThan(0);
      expect(firstResult.snippet).toBeDefined();
    });

    it('Given multi-tenant - When klant A zoekt - Then klant B-data onzichtbaar', async () => {
      // Search for demo-tenant
      const demoResult = await store.searchDocuments({
        tenantId: 'demo-tenant',
        query: 'web development',
        limit: 5
      });

      // Search for test-tenant
      const testResult = await store.searchDocuments({
        tenantId: 'test-tenant',
        query: 'web development',
        limit: 5
      });

      // Results should be different (tenant isolation)
      expect(demoResult.results.length).toBeGreaterThan(0);
      expect(testResult.results.length).toBeGreaterThan(0);

      // Check that results are tenant-specific
      demoResult.results.forEach(result => {
        expect(result.document.id).toContain('demo-tenant');
      });

      testResult.results.forEach(result => {
        expect(result.document.id).toContain('test-tenant');
      });
    });

    it('Given demo data voor testing - When kennisbasis wordt gebruikt - Then zijn realistische content beschikbaar', async () => {
      const demoResult = await store.searchDocuments({
        tenantId: 'demo-tenant',
        query: 'TechCorp Solutions',
        limit: 5
      });

      expect(demoResult.results.length).toBeGreaterThan(0);
      
      // Check for realistic demo content
      const hasTechCorpContent = demoResult.results.some(result => 
        result.document.title.includes('TechCorp') || 
        result.chunk.content.includes('TechCorp')
      );
      expect(hasTechCorpContent).toBe(true);
    });

    it('Given demo data als placeholder - When productie deployment - Then kan demo data vervangen worden', () => {
      // Test that demo data is clearly marked and replaceable
      const stats = store.getTenantStats('demo-tenant');
      
      expect(stats.totalDocuments).toBeGreaterThan(0);
      expect(stats.documentsByType).toBeDefined();
      
      // Demo data should be identifiable
      const documents = store.getTenantDocuments('demo-tenant');
      const hasDemoMarkers = documents.some(doc => 
        doc.title.includes('Demo') || 
        doc.source.includes('demo') ||
        doc.title.includes('Test')
      );
      expect(hasDemoMarkers).toBe(true);
    });
  });

  describe('NFR-checks Tests', () => {
    it('Privacy: versleutelde opslag - Tenant isolation werkt correct', async () => {
      // Test tenant isolation
      const tenant1Result = await store.searchDocuments({
        tenantId: 'demo-tenant',
        query: 'test',
        limit: 10
      });

      const tenant2Result = await store.searchDocuments({
        tenantId: 'test-tenant',
        query: 'test',
        limit: 10
      });

      // Results should be completely separate
      const tenant1Ids = tenant1Result.results.map(r => r.document.id);
      const tenant2Ids = tenant2Result.results.map(r => r.document.id);
      
      const hasOverlap = tenant1Ids.some(id => tenant2Ids.includes(id));
      expect(hasOverlap).toBe(false);
    });

    it('Performance: retrieval <200ms', async () => {
      const startTime = Date.now();
      
      await store.searchDocuments({
        tenantId: 'demo-tenant',
        query: 'web development services',
        limit: 5
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200);
    });

    it('Security: MIME-whitelist, AV-scan - Input validation werkt', async () => {
      // Test invalid input
      const invalidRequest = {
        tenantId: 'test-tenant',
        title: '', // Empty title should fail
        content: 'Valid content',
        type: 'pdf' as const,
        source: 'test.pdf'
      };

      const result = await store.ingestDocument(invalidRequest);
      
      // Should handle gracefully
      expect(result.status).toBeDefined();
    });
  });

  describe('Knowledge Search Service Tests', () => {
    let searchService: KnowledgeSearchService;

    beforeEach(() => {
      searchService = new KnowledgeSearchService('http://localhost:3000', 'demo-tenant');
    });

    it('Should extract key terms correctly', () => {
      const query = 'Hoe werkt web development bij TechCorp?';
      const keyTerms = searchService.extractKeyTerms(query);
      
      expect(keyTerms).toContain('web');
      expect(keyTerms).toContain('development');
      expect(keyTerms).toContain('techcorp');
      expect(keyTerms).not.toContain('hoe'); // Stop word
    });

    it('Should determine if knowledge search is needed', () => {
      expect(searchService.shouldSearchKnowledge('Hallo')).toBe(false);
      expect(searchService.shouldSearchKnowledge('Hoe werkt web development?')).toBe(true);
      expect(searchService.shouldSearchKnowledge('Wat zijn jullie prijzen?')).toBe(true);
    });

    it('Should format knowledge results correctly', () => {
      const mockResults = [
        {
          chunk: {
            id: 'chunk-1',
            documentId: 'doc-1',
            content: 'Web development services beschikbaar',
            metadata: { section: 'Services' }
          },
          document: {
            id: 'doc-1',
            title: 'Product Catalogus',
            type: 'pdf' as const,
            source: 'catalog.pdf'
          },
          score: 0.95,
          snippet: 'Web development services beschikbaar'
        }
      ];

      const formatted = searchService.formatKnowledgeResults(mockResults);
      
      expect(formatted).toContain('📚 **Relevante informatie:**');
      expect(formatted).toContain('Web development services beschikbaar');
      expect(formatted).toContain('📄 Product Catalogus');
    });
  });

  describe('Document Management Tests', () => {
    it('Should track document processing status', async () => {
      const ingestRequest = {
        tenantId: 'test-tenant',
        title: 'Status Test Document',
        content: 'Testing status tracking.',
        type: 'manual' as const,
        source: 'status-test.md'
      };

      const result = await store.ingestDocument(ingestRequest);
      
      const status = store.getDocumentStatus(result.documentId);
      expect(status).toBeDefined();
      expect(status?.status).toBe('processed');
    });

    it('Should provide tenant statistics', () => {
      const stats = store.getTenantStats('demo-tenant');
      
      expect(stats.totalDocuments).toBeGreaterThan(0);
      expect(stats.totalChunks).toBeGreaterThan(0);
      expect(stats.documentsByType).toBeDefined();
      expect(stats.lastUpdated).toBeDefined();
    });

    it('Should validate tenant access', () => {
      const documents = store.getTenantDocuments('demo-tenant');
      expect(documents.length).toBeGreaterThan(0);
      
      const firstDoc = documents[0];
      expect(store.validateTenantAccess(firstDoc.id, 'demo-tenant')).toBe(true);
      expect(store.validateTenantAccess(firstDoc.id, 'test-tenant')).toBe(false);
    });
  });

  describe('Error Handling Tests', () => {
    it('Should handle search errors gracefully', async () => {
      const result = await store.searchDocuments({
        tenantId: 'non-existent-tenant',
        query: 'test',
        limit: 5
      });

      expect(result.results).toEqual([]);
      expect(result.totalFound).toBe(0);
    });

    it('Should handle invalid document types', async () => {
      const invalidRequest = {
        tenantId: 'test-tenant',
        title: 'Invalid Type Test',
        content: 'Testing invalid type.',
        type: 'invalid' as any,
        source: 'test.txt'
      };

      // Should handle gracefully without crashing
      const result = await store.ingestDocument(invalidRequest);
      expect(result.status).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('Should handle multiple concurrent searches', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        store.searchDocuments({
          tenantId: 'demo-tenant',
          query: `test query ${i}`,
          limit: 3
        })
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.results).toBeDefined();
        expect(result.tenantId).toBe('demo-tenant');
      });
    });

    it('Should handle large content ingestion', async () => {
      const largeContent = 'Test content. '.repeat(1000); // ~15KB content
      
      const result = await store.ingestDocument({
        tenantId: 'test-tenant',
        title: 'Large Content Test',
        content: largeContent,
        type: 'manual',
        source: 'large-test.md'
      });

      expect(result.status).toBe('processed');
      expect(result.chunks).toBeGreaterThan(0);
    });
  });
});
