/**
 * Knowledge Status API Handler - MVP-004
 * 
 * Handles document processing status and tenant statistics.
 */

import { IncomingMessage, ServerResponse } from 'http';
import { knowledgeStore } from '../services/knowledge-store';
import { ErrorHandler } from '../utils/error-handler';

export class KnowledgeStatusHandler {
  private errorHandler: ErrorHandler;

  constructor() {
    this.errorHandler = new ErrorHandler();
  }

  async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      // Valideer tenant ID
      const tenantId = this.extractTenantId(req);
      if (!tenantId) {
        this.errorHandler.sendError(res, 400, 'Bad Request', 'Tenant ID is vereist in X-Tenant-ID header');
        return;
      }

      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const pathParts = url.pathname.split('/').filter(part => part.length > 0);

      if (req.method === 'GET') {
        if (pathParts.length === 4 && pathParts[3] === 'stats') {
          // GET /api/knowledge/status/stats
          await this.handleStatsRequest(res, tenantId);
        } else if (pathParts.length === 5 && pathParts[3] === 'document') {
          // GET /api/knowledge/status/document/{documentId}
          const documentId = pathParts[4];
          await this.handleDocumentStatusRequest(res, documentId, tenantId);
        } else {
          this.errorHandler.sendError(res, 404, 'Not Found', 'Endpoint niet gevonden');
        }
      } else {
        this.errorHandler.sendError(res, 405, 'Method Not Allowed', 'Alleen GET requests zijn toegestaan');
      }

    } catch (error) {
      console.error('Knowledge status error:', error);
      this.errorHandler.sendError(res, 500, 'Internal Server Error', 'Er is een fout opgetreden');
    }
  }

  private async handleStatsRequest(res: ServerResponse, tenantId: string): Promise<void> {
    const stats = knowledgeStore.getTenantStats(tenantId);
    
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Tenant-ID'
    });
    
    res.end(JSON.stringify({
      tenantId,
      ...stats,
      timestamp: new Date().toISOString()
    }));
  }

  private async handleDocumentStatusRequest(
    res: ServerResponse, 
    documentId: string, 
    tenantId: string
  ): Promise<void> {
    // Valideer tenant toegang
    if (!knowledgeStore.validateTenantAccess(documentId, tenantId)) {
      this.errorHandler.sendError(res, 403, 'Forbidden', 'Geen toegang tot dit document');
      return;
    }

    const status = knowledgeStore.getDocumentStatus(documentId);
    
    if (!status) {
      this.errorHandler.sendError(res, 404, 'Not Found', 'Document niet gevonden');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Tenant-ID'
    });
    
    res.end(JSON.stringify({
      ...status,
      timestamp: new Date().toISOString()
    }));
  }

  private extractTenantId(req: IncomingMessage): string | null {
    const tenantId = req.headers['x-tenant-id'] as string;
    return tenantId || null;
  }
}

export const knowledgeStatusHandler = new KnowledgeStatusHandler();
