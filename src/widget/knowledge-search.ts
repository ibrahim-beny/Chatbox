/**
 * Knowledge Search Service - MVP-004
 * 
 * Handles knowledge base search and retrieval for chat responses.
 */

export interface KnowledgeSearchResult {
  chunk: {
    id: string;
    documentId: string;
    content: string;
    metadata: {
      page?: number;
      section?: string;
      relevanceScore?: number;
    };
  };
  document: {
    id: string;
    title: string;
    type: 'pdf' | 'faq' | 'manual';
    source: string;
  };
  score: number;
  snippet: string;
}

export interface KnowledgeSearchResponse {
  results: KnowledgeSearchResult[];
  totalFound: number;
  query: string;
  tenantId: string;
}

export class KnowledgeSearchService {
  private backendUrl: string;
  private tenantId: string;

  constructor(backendUrl: string, tenantId: string) {
    this.backendUrl = backendUrl;
    this.tenantId = tenantId;
  }

  /**
   * Search knowledge base for relevant information
   */
  async search(query: string, limit: number = 3): Promise<KnowledgeSearchResult[]> {
    try {
      const url = new URL(`${this.backendUrl}/api/knowledge/search`);
      url.searchParams.set('q', query);
      url.searchParams.set('limit', limit.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-Tenant-ID': this.tenantId,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn('Knowledge search failed:', response.status, response.statusText);
        return [];
      }

      const data: KnowledgeSearchResponse = await response.json();
      return data.results || [];

    } catch (error) {
      console.warn('Knowledge search error:', error);
      return [];
    }
  }

  /**
   * Format knowledge results for display in chat
   */
  formatKnowledgeResults(results: KnowledgeSearchResult[]): string {
    if (results.length === 0) {
      return '';
    }

    let formatted = '\n\n📚 **Relevante informatie:**\n';
    
    results.forEach((result, index) => {
      const source = this.getSourceDisplayName(result.document);
      formatted += `\n${index + 1}. ${result.snippet}\n   *Bron: ${source}*\n`;
    });

    return formatted;
  }

  /**
   * Get display name for document source
   */
  private getSourceDisplayName(document: KnowledgeSearchResult['document']): string {
    switch (document.type) {
      case 'pdf':
        return `📄 ${document.title}`;
      case 'faq':
        return `❓ ${document.title}`;
      case 'manual':
        return `📖 ${document.title}`;
      default:
        return document.title;
    }
  }

  /**
   * Extract key terms from user query for better search
   */
  extractKeyTerms(query: string): string[] {
    // Simple keyword extraction - remove common words
    const stopWords = ['hoe', 'wat', 'waar', 'wanneer', 'waarom', 'wie', 'kan', 'kun', 'kunnen', 'is', 'zijn', 'hebben', 'heeft', 'heb', 'ben', 'bent', 'wordt', 'worden', 'zal', 'zullen', 'moet', 'moeten', 'mag', 'mogen', 'wil', 'willen', 'de', 'het', 'een', 'van', 'in', 'op', 'voor', 'met', 'aan', 'door', 'over', 'onder', 'tussen', 'na', 'voor', 'tijdens', 'om', 'te', 'en', 'of', 'maar', 'dus', 'omdat', 'als', 'dan', 'ook', 'nog', 'al', 'wel', 'niet', 'geen', 'alle', 'alleen', 'allemaal', 'alles', 'iemand', 'niemand', 'iets', 'niets', 'ergens', 'nergens', 'altijd', 'nooit', 'soms', 'vaak', 'meestal', 'zelden', 'weinig', 'veel', 'meer', 'meest', 'minst', 'beter', 'best', 'slechter', 'slechtst'];
    
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 5); // Max 5 key terms
  }

  /**
   * Check if query might benefit from knowledge search
   */
  shouldSearchKnowledge(query: string): boolean {
    const keyTerms = this.extractKeyTerms(query);
    
    // Search if we have meaningful terms
    if (keyTerms.length === 0) return false;
    
    // Don't search for simple greetings
    const greetings = ['hallo', 'hi', 'hey', 'goedemorgen', 'goedemiddag', 'goedenavond', 'bedankt', 'dankje', 'dankjewel'];
    if (greetings.some(greeting => query.toLowerCase().includes(greeting)) && keyTerms.length <= 1) {
      return false;
    }
    
    return true;
  }
}
