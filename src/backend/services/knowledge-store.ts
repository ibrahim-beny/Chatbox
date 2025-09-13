/**
 * Knowledge Store Service - MVP-004
 * 
 * Beheert kennisbasis documenten en retrieval met tenant isolation.
 * Gebruikt demo data voor testing en kan later uitgebreid worden met echte database.
 */

import { 
  KnowledgeDocument, 
  KnowledgeChunk, 
  SearchResult, 
  ALL_DEMO_CONTENT,
  searchKnowledgeBase 
} from '../demo-data/knowledge-base';

export interface IngestRequest {
  tenantId: string;
  title: string;
  content: string;
  type: 'pdf' | 'faq' | 'manual';
  source: string;
}

export interface IngestResponse {
  documentId: string;
  status: 'processing' | 'processed' | 'failed';
  message: string;
  chunks?: number;
}

export interface SearchRequest {
  tenantId: string;
  query: string;
  limit?: number;
  type?: 'pdf' | 'faq' | 'manual';
}

export interface SearchResponse {
  results: SearchResult[];
  totalFound: number;
  query: string;
  tenantId: string;
}

export interface DocumentStatus {
  documentId: string;
  status: 'processing' | 'processed' | 'failed';
  progress?: number;
  message?: string;
}

export class KnowledgeStoreService {
  private documents: Map<string, KnowledgeDocument> = new Map();
  private tenantDocuments: Map<string, Set<string>> = new Map();
  private processingQueue: Map<string, DocumentStatus> = new Map();

  constructor() {
    this.initializeDemoData();
  }

  /**
   * Initialiseer demo data voor testing
   */
  private initializeDemoData(): void {
    for (const doc of ALL_DEMO_CONTENT) {
      this.documents.set(doc.id, doc);
      
      if (!this.tenantDocuments.has(doc.tenantId)) {
        this.tenantDocuments.set(doc.tenantId, new Set());
      }
      this.tenantDocuments.get(doc.tenantId)!.add(doc.id);
    }
  }

  /**
   * Ingest een nieuw document
   */
  async ingestDocument(request: IngestRequest): Promise<IngestResponse> {
    const documentId = this.generateDocumentId(request.tenantId);
    
    // Simuleer processing status
    this.processingQueue.set(documentId, {
      documentId,
      status: 'processing',
      progress: 0,
      message: 'Document wordt verwerkt...'
    });

    try {
      // Simuleer processing tijd
      await this.simulateProcessing(documentId);
      
      // Maak document aan
      const document: KnowledgeDocument = {
        id: documentId,
        tenantId: request.tenantId,
        title: request.title,
        content: request.content,
        type: request.type,
        source: request.source,
        createdAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        status: 'processed',
        chunks: this.createChunks(documentId, request.content)
      };

      // Sla document op
      this.documents.set(documentId, document);
      
      if (!this.tenantDocuments.has(request.tenantId)) {
        this.tenantDocuments.set(request.tenantId, new Set());
      }
      this.tenantDocuments.get(request.tenantId)!.add(documentId);

      // Update processing status
      this.processingQueue.set(documentId, {
        documentId,
        status: 'processed',
        progress: 100,
        message: 'Document succesvol verwerkt'
      });

      return {
        documentId,
        status: 'processed',
        message: 'Document succesvol verwerkt',
        chunks: document.chunks.length
      };

    } catch (error) {
      this.processingQueue.set(documentId, {
        documentId,
        status: 'failed',
        message: `Verwerking mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`
      });

      return {
        documentId,
        status: 'failed',
        message: `Verwerking mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}`
      };
    }
  }

  /**
   * Zoek in kennisbasis
   */
  async searchDocuments(request: SearchRequest): Promise<SearchResponse> {
    const { tenantId, query, limit = 5, type } = request;

    // Valideer tenant
    if (!this.tenantDocuments.has(tenantId)) {
      return {
        results: [],
        totalFound: 0,
        query,
        tenantId
      };
    }

    // Gebruik demo search functie
    const results = searchKnowledgeBase(query, tenantId, limit);

    // Filter op type indien opgegeven
    const filteredResults = type 
      ? results.filter(result => result.document.type === type)
      : results;

    return {
      results: filteredResults,
      totalFound: filteredResults.length,
      query,
      tenantId
    };
  }

  /**
   * Haal document status op
   */
  getDocumentStatus(documentId: string): DocumentStatus | null {
    return this.processingQueue.get(documentId) || null;
  }

  /**
   * Haal alle documenten voor een tenant op
   */
  getTenantDocuments(tenantId: string): KnowledgeDocument[] {
    const documentIds = this.tenantDocuments.get(tenantId);
    if (!documentIds) return [];

    return Array.from(documentIds)
      .map(id => this.documents.get(id))
      .filter((doc): doc is KnowledgeDocument => doc !== undefined);
  }

  /**
   * Verwijder een document
   */
  async deleteDocument(documentId: string, tenantId: string): Promise<boolean> {
    const document = this.documents.get(documentId);
    if (!document || document.tenantId !== tenantId) {
      return false;
    }

    this.documents.delete(documentId);
    this.tenantDocuments.get(tenantId)?.delete(documentId);
    this.processingQueue.delete(documentId);

    return true;
  }

  /**
   * Valideer tenant toegang tot document
   */
  validateTenantAccess(documentId: string, tenantId: string): boolean {
    const document = this.documents.get(documentId);
    return document?.tenantId === tenantId;
  }

  /**
   * Genereer unieke document ID
   */
  private generateDocumentId(tenantId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${tenantId}-doc-${timestamp}-${random}`;
  }

  /**
   * Maak chunks van document content
   */
  private createChunks(documentId: string, content: string): KnowledgeChunk[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const chunks: KnowledgeChunk[] = [];

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (sentence.length > 20) { // Alleen zinvolle chunks
        chunks.push({
          id: `${documentId}-chunk-${i}`,
          documentId,
          content: sentence,
          metadata: {
            section: `Chunk ${i + 1}`,
            relevanceScore: 1.0
          }
        });
      }
    }

    return chunks;
  }

  /**
   * Simuleer document processing
   */
  private async simulateProcessing(documentId: string): Promise<void> {
    const steps = [
      { progress: 20, message: 'Document wordt geüpload...' },
      { progress: 40, message: 'Content wordt geanalyseerd...' },
      { progress: 60, message: 'Tekst wordt geëxtraheerd...' },
      { progress: 80, message: 'Chunks worden gemaakt...' },
      { progress: 100, message: 'Document is klaar!' }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms per stap
      
      this.processingQueue.set(documentId, {
        documentId,
        status: 'processing',
        progress: step.progress,
        message: step.message
      });
    }
  }

  /**
   * Haal statistieken op voor een tenant
   */
  getTenantStats(tenantId: string): {
    totalDocuments: number;
    documentsByType: Record<string, number>;
    totalChunks: number;
    lastUpdated: string | null;
  } {
    const documents = this.getTenantDocuments(tenantId);
    
    const documentsByType = documents.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalChunks = documents.reduce((sum, doc) => sum + doc.chunks.length, 0);
    
    const lastUpdated = documents.length > 0 
      ? documents.sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime())[0].processedAt
      : null;

    return {
      totalDocuments: documents.length,
      documentsByType,
      totalChunks,
      lastUpdated
    };
  }
}

// Singleton instance
export const knowledgeStore = new KnowledgeStoreService();
