/**
 * Knowledge Search API Handler - MVP-004
 * 
 * Handles knowledge base search and retrieval.
 */

import { IncomingMessage, ServerResponse } from 'http';
import { knowledgeStore, SearchRequest } from '../services/knowledge-store';
import { ErrorHandler } from '../utils/error-handler';

export class KnowledgeSearchHandler {
  private errorHandler: ErrorHandler;

  constructor() {
    this.errorHandler = new ErrorHandler();
  }

  async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      // Alleen GET requests ondersteund
      if (req.method !== 'GET') {
        this.errorHandler.sendError(res, 405, 'Method Not Allowed', 'Alleen GET requests zijn toegestaan');
        return;
      }

      // Valideer tenant ID
      const tenantId = this.extractTenantId(req);
      if (!tenantId) {
        this.errorHandler.sendError(res, 400, 'Bad Request', 'Tenant ID is vereist in X-Tenant-ID header');
        return;
      }

      // Parse query parameters
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const query = url.searchParams.get('q');
      const limit = parseInt(url.searchParams.get('limit') || '5');
      const type = url.searchParams.get('type') as 'pdf' | 'faq' | 'manual' | null;

      // Valideer query
      if (!query || query.trim().length === 0) {
        this.errorHandler.sendError(res, 400, 'Bad Request', 'Query parameter (q) is vereist');
        return;
      }

      if (query.length > 500) {
        this.errorHandler.sendError(res, 400, 'Bad Request', 'Query is te lang (max 500 karakters)');
        return;
      }

      if (limit < 1 || limit > 20) {
        this.errorHandler.sendError(res, 400, 'Bad Request', 'Limit moet tussen 1 en 20 zijn');
        return;
      }

      if (type && !['pdf', 'faq', 'manual'].includes(type)) {
        this.errorHandler.sendError(res, 400, 'Bad Request', 'Type moet pdf, faq of manual zijn');
        return;
      }

      // Maak search request
      const searchRequest: SearchRequest = {
        tenantId,
        query: query.trim(),
        limit,
        type: type || undefined
      };

      // Voer zoekopdracht uit
      const result = await knowledgeStore.searchDocuments(searchRequest);

      // Send response
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Tenant-ID'
      });
      
      res.end(JSON.stringify(result));

    } catch (error) {
      console.error('Knowledge search error:', error);
      this.errorHandler.sendError(res, 500, 'Internal Server Error', 'Er is een fout opgetreden bij het zoeken');
    }
  }

  private extractTenantId(req: IncomingMessage): string | null {
    const tenantId = req.headers['x-tenant-id'] as string;
    return tenantId || null;
  }
}

export const knowledgeSearchHandler = new KnowledgeSearchHandler();
