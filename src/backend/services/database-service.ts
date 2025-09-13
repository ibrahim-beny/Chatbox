/**
 * Database service voor MVP-005
 * Handelt alle database operaties af voor kennisbasis
 */

import { pool } from '../database/config';

export interface Tenant {
  id: string;
  name: string;
  industry?: string;
  branding: any;
  ai_provider: string;
  rate_limit: any;
  created_at: Date;
  updated_at: Date;
}

export interface Document {
  id: string;
  tenant_id: string;
  title: string;
  content?: string;
  type?: string;
  source?: string;
  status: string;
  file_size?: number;
  created_at: Date;
  processed_at?: Date;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  metadata: any;
  relevance_score: number;
  created_at: Date;
}

export interface SearchResult {
  chunk: DocumentChunk;
  document: Document;
  score: number;
  snippet: string;
}

export class DatabaseService {
  
  // Tenant operaties
  async getTenant(tenantId: string): Promise<Tenant | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM tenants WHERE id = $1',
        [tenantId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting tenant:', error);
      throw error;
    }
  }

  async getAllTenants(): Promise<Tenant[]> {
    try {
      const result = await pool.query('SELECT * FROM tenants ORDER BY created_at');
      return result.rows;
    } catch (error) {
      console.error('Error getting all tenants:', error);
      throw error;
    }
  }

  // Document operaties
  async getDocumentsByTenant(tenantId: string): Promise<Document[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM documents WHERE tenant_id = $1 ORDER BY created_at',
        [tenantId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting documents by tenant:', error);
      throw error;
    }
  }

  async getDocumentById(documentId: string): Promise<Document | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM documents WHERE id = $1',
        [documentId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting document by ID:', error);
      throw error;
    }
  }

  async createDocument(document: Omit<Document, 'id' | 'created_at'>): Promise<Document> {
    try {
      const result = await pool.query(
        `INSERT INTO documents (tenant_id, title, content, type, source, status, file_size, processed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          document.tenant_id,
          document.title,
          document.content,
          document.type,
          document.source,
          document.status,
          document.file_size,
          document.processed_at
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  async updateDocumentStatus(documentId: string, status: string): Promise<void> {
    try {
      await pool.query(
        'UPDATE documents SET status = $1, processed_at = NOW() WHERE id = $2',
        [status, documentId]
      );
    } catch (error) {
      console.error('Error updating document status:', error);
      throw error;
    }
  }

  // Search operaties
  async searchDocuments(query: string, tenantId: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      const result = await pool.query(
        `SELECT 
           dc.id as chunk_id,
           dc.document_id,
           dc.content as chunk_content,
           dc.metadata as chunk_metadata,
           dc.relevance_score,
           dc.created_at as chunk_created_at,
           d.id as document_id,
           d.tenant_id,
           d.title as document_title,
           d.content as document_content,
           d.type as document_type,
           d.source as document_source,
           d.status as document_status,
           d.file_size,
           d.created_at as document_created_at,
           d.processed_at
         FROM document_chunks dc
         JOIN documents d ON dc.document_id = d.id
         WHERE d.tenant_id = $1 
         AND dc.content ILIKE $2
         ORDER BY dc.relevance_score DESC, dc.created_at DESC
         LIMIT $3`,
        [tenantId, `%${query}%`, limit]
      );

      return result.rows.map(row => ({
        chunk: {
          id: row.chunk_id,
          document_id: row.document_id,
          content: row.chunk_content,
          metadata: row.chunk_metadata,
          relevance_score: row.relevance_score,
          created_at: row.chunk_created_at
        },
        document: {
          id: row.document_id,
          tenant_id: row.tenant_id,
          title: row.document_title,
          content: row.document_content,
          type: row.document_type,
          source: row.document_source,
          status: row.document_status,
          file_size: row.file_size,
          created_at: row.document_created_at,
          processed_at: row.processed_at
        },
        score: row.relevance_score,
        snippet: this.generateSnippet(row.chunk_content, query)
      }));
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  // Document chunks operaties
  async createDocumentChunks(documentId: string, chunks: Array<{content: string, metadata: any, relevance_score: number}>): Promise<void> {
    try {
      for (const chunk of chunks) {
        await pool.query(
          `INSERT INTO document_chunks (document_id, content, metadata, relevance_score)
           VALUES ($1, $2, $3, $4)`,
          [documentId, chunk.content, chunk.metadata, chunk.relevance_score]
        );
      }
    } catch (error) {
      console.error('Error creating document chunks:', error);
      throw error;
    }
  }

  async getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM document_chunks WHERE document_id = $1 ORDER BY relevance_score DESC',
        [documentId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting document chunks:', error);
      throw error;
    }
  }

  // Statistics operaties
  async getTenantStats(tenantId: string): Promise<{
    totalDocuments: number;
    documentsByType: Record<string, number>;
    totalChunks: number;
    lastUpdated: Date;
  }> {
    try {
      const documentsResult = await pool.query(
        'SELECT COUNT(*) as total, type FROM documents WHERE tenant_id = $1 GROUP BY type',
        [tenantId]
      );

      const chunksResult = await pool.query(
        'SELECT COUNT(*) as total FROM document_chunks dc JOIN documents d ON dc.document_id = d.id WHERE d.tenant_id = $1',
        [tenantId]
      );

      const lastUpdatedResult = await pool.query(
        'SELECT MAX(processed_at) as last_updated FROM documents WHERE tenant_id = $1',
        [tenantId]
      );

      const documentsByType: Record<string, number> = {};
      let totalDocuments = 0;

      documentsResult.rows.forEach(row => {
        documentsByType[row.type || 'unknown'] = parseInt(row.total);
        totalDocuments += parseInt(row.total);
      });

      return {
        totalDocuments,
        documentsByType,
        totalChunks: parseInt(chunksResult.rows[0]?.total || '0'),
        lastUpdated: lastUpdatedResult.rows[0]?.last_updated || new Date()
      };
    } catch (error) {
      console.error('Error getting tenant stats:', error);
      throw error;
    }
  }

  // Helper functies
  private generateSnippet(content: string, query: string): string {
    const queryWords = query.toLowerCase().split(/\s+/);
    const words = content.split(/\s+/);
    const maxLength = 150;
    
    // Find the best position to start the snippet
    let bestIndex = 0;
    let maxMatches = 0;
    
    for (let i = 0; i < words.length; i++) {
      let matches = 0;
      for (const queryWord of queryWords) {
        if (words[i]?.toLowerCase().includes(queryWord)) {
          matches++;
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestIndex = i;
      }
    }
    
    // Generate snippet around the best position
    const start = Math.max(0, bestIndex - 10);
    const end = Math.min(words.length, start + maxLength / 6);
    
    let snippet = words.slice(start, end).join(' ');
    if (start > 0) snippet = '...' + snippet;
    if (end < words.length) snippet = snippet + '...';
    
    return snippet;
  }
}

// Singleton instance
export const databaseService = new DatabaseService();
