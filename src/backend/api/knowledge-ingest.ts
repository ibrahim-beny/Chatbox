/**
 * Knowledge Ingest API Handler - MVP-004
 * 
 * Handles document upload and processing for the knowledge base.
 */

import { IncomingMessage, ServerResponse } from 'http';
import { knowledgeStore, IngestRequest } from '../services/knowledge-store';
import { ErrorHandler } from '../utils/error-handler';

export class KnowledgeIngestHandler {
  private errorHandler: ErrorHandler;

  constructor() {
    this.errorHandler = new ErrorHandler();
  }

  async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      // Alleen POST requests ondersteund
      if (req.method !== 'POST') {
        this.errorHandler.sendError(res, 405, 'Method Not Allowed', 'Alleen POST requests zijn toegestaan');
        return;
      }

      // Parse request body
      const body = await this.parseRequestBody(req);
      
      // Valideer tenant ID
      const tenantId = this.extractTenantId(req);
      if (!tenantId) {
        this.errorHandler.sendError(res, 400, 'Bad Request', 'Tenant ID is vereist in X-Tenant-ID header');
        return;
      }

      // Valideer request data
      const validation = this.validateIngestRequest(body);
      if (!validation.valid) {
        this.errorHandler.sendError(res, 400, 'Bad Request', validation.error || 'Invalid request');
        return;
      }

      // Maak ingest request
      const ingestRequest: IngestRequest = {
        tenantId,
        title: body.title,
        content: body.content,
        type: body.type,
        source: body.source || 'unknown'
      };

      // Process document
      const result = await knowledgeStore.ingestDocument(ingestRequest);

      // Send response
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Tenant-ID'
      });
      
      res.end(JSON.stringify(result));

    } catch (error) {
      console.error('Knowledge ingest error:', error);
      this.errorHandler.sendError(res, 500, 'Internal Server Error', 'Er is een fout opgetreden bij het verwerken van het document');
    }
  }

  private async parseRequestBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (error) {
          reject(new Error('Invalid JSON in request body'));
        }
      });
      
      req.on('error', (error) => {
        reject(error);
      });
    });
  }

  private extractTenantId(req: IncomingMessage): string | null {
    const tenantId = req.headers['x-tenant-id'] as string;
    return tenantId || null;
  }

  private validateIngestRequest(body: any): { valid: boolean; error?: string } {
    if (!body) {
      return { valid: false, error: 'Request body is vereist' };
    }

    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return { valid: false, error: 'Title is vereist en moet een niet-lege string zijn' };
    }

    if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
      return { valid: false, error: 'Content is vereist en moet een niet-lege string zijn' };
    }

    if (!body.type || !['pdf', 'faq', 'manual'].includes(body.type)) {
      return { valid: false, error: 'Type moet pdf, faq of manual zijn' };
    }

    if (body.content.length > 1000000) { // 1MB limit
      return { valid: false, error: 'Content is te groot (max 1MB)' };
    }

    return { valid: true };
  }
}

export const knowledgeIngestHandler = new KnowledgeIngestHandler();
