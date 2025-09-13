/**
 * Demo data voor kennisbasis - MVP-004
 * 
 * Deze data dient als placeholder voor testing en demo doeleinden.
 * In productie wordt deze vervangen door echte tenant-specifieke content.
 */

export interface KnowledgeDocument {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  type: 'pdf' | 'faq' | 'manual';
  source: string;
  createdAt: string;
  processedAt: string;
  status: 'processed' | 'processing' | 'failed';
  chunks: KnowledgeChunk[];
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  content: string;
  metadata: {
    page?: number;
    section?: string;
    relevanceScore?: number;
  };
}

export interface SearchResult {
  chunk: KnowledgeChunk;
  document: KnowledgeDocument;
  score: number;
  snippet: string;
}

// Demo tenant configuraties
export const DEMO_TENANTS = {
  'demo-tenant': {
    name: 'TechCorp Solutions',
    industry: 'Software Development',
    description: 'Een innovatieve software ontwikkelaar gespecialiseerd in web applicaties'
  },
  'test-tenant': {
    name: 'RetailMax',
    industry: 'E-commerce',
    description: 'Online retail platform voor consumentenelektronica'
  }
};

// Demo PDF content voor TechCorp Solutions
export const DEMO_PDF_CONTENT: KnowledgeDocument[] = [
  {
    id: 'pdf-001',
    tenantId: 'demo-tenant',
    title: 'Product Catalogus 2024',
    content: `TechCorp Solutions - Product Catalogus 2024

Hoofdstuk 1: Web Development Services
Onze web development diensten omvatten:
- React/Next.js applicaties
- Node.js backend services
- Database design en optimalisatie
- API development en integratie
- Cloud deployment (AWS, Azure, GCP)

Hoofdstuk 2: Ondersteuning en Maintenance
We bieden 24/7 ondersteuning voor alle onze producten:
- Bug fixes binnen 24 uur
- Feature requests binnen 1 week
- Security updates maandelijks
- Performance monitoring
- Backup en disaster recovery

Hoofdstuk 3: Prijzen en Packages
Starter Package: €2,500/maand
- Basis web applicatie
- 5 uur ondersteuning per maand
- Email support

Professional Package: €5,000/maand
- Geavanceerde web applicatie
- 15 uur ondersteuning per maand
- Priority support
- SLA garantie

Enterprise Package: €10,000/maand
- Custom enterprise oplossing
- Onbeperkte ondersteuning
- Dedicated account manager
- 99.9% uptime garantie`,
    type: 'pdf',
    source: 'product-catalog-2024.pdf',
    createdAt: '2024-01-15T10:00:00Z',
    processedAt: '2024-01-15T10:05:00Z',
    status: 'processed',
    chunks: [
      {
        id: 'chunk-001',
        documentId: 'pdf-001',
        content: 'Web Development Services: React/Next.js applicaties, Node.js backend services, Database design en optimalisatie, API development en integratie, Cloud deployment (AWS, Azure, GCP)',
        metadata: { page: 1, section: 'Hoofdstuk 1' }
      },
      {
        id: 'chunk-002',
        documentId: 'pdf-001',
        content: 'Ondersteuning en Maintenance: 24/7 ondersteuning, Bug fixes binnen 24 uur, Feature requests binnen 1 week, Security updates maandelijks, Performance monitoring, Backup en disaster recovery',
        metadata: { page: 2, section: 'Hoofdstuk 2' }
      },
      {
        id: 'chunk-003',
        documentId: 'pdf-001',
        content: 'Prijzen en Packages: Starter Package €2,500/maand, Professional Package €5,000/maand, Enterprise Package €10,000/maand met verschillende ondersteuningsniveaus',
        metadata: { page: 3, section: 'Hoofdstuk 3' }
      }
    ]
  },
  {
    id: 'pdf-002',
    tenantId: 'demo-tenant',
    title: 'API Documentatie v2.1',
    content: `TechCorp Solutions - API Documentatie v2.1

Authenticatie
Alle API calls vereisen een API key in de Authorization header:
Authorization: Bearer YOUR_API_KEY

Endpoints
GET /api/v2/users
Haalt alle gebruikers op voor de huidige tenant.

POST /api/v2/users
Maakt een nieuwe gebruiker aan.
Body: { "name": "string", "email": "string", "role": "admin|user" }

PUT /api/v2/users/{id}
Update een bestaande gebruiker.

DELETE /api/v2/users/{id}
Verwijdert een gebruiker.

Rate Limiting
- 1000 requests per uur per API key
- 429 status code bij overschrijding
- Retry-After header bevat wachttijd

Error Handling
Alle errors volgen dit formaat:
{
  "error": "string",
  "message": "string",
  "code": "number",
  "timestamp": "ISO string"
}`,
    type: 'pdf',
    source: 'api-documentation-v2.1.pdf',
    createdAt: '2024-01-20T14:30:00Z',
    processedAt: '2024-01-20T14:35:00Z',
    status: 'processed',
    chunks: [
      {
        id: 'chunk-004',
        documentId: 'pdf-002',
        content: 'Authenticatie: Alle API calls vereisen een API key in de Authorization header met Bearer token',
        metadata: { page: 1, section: 'Authenticatie' }
      },
      {
        id: 'chunk-005',
        documentId: 'pdf-002',
        content: 'User Endpoints: GET /api/v2/users haalt gebruikers op, POST /api/v2/users maakt nieuwe gebruiker aan, PUT en DELETE voor updates en verwijdering',
        metadata: { page: 2, section: 'Endpoints' }
      },
      {
        id: 'chunk-006',
        documentId: 'pdf-002',
        content: 'Rate Limiting: 1000 requests per uur per API key, 429 status code bij overschrijding, Retry-After header bevat wachttijd',
        metadata: { page: 3, section: 'Rate Limiting' }
      }
    ]
  }
];

// Demo FAQ content voor TechCorp Solutions
export const DEMO_FAQ_CONTENT: KnowledgeDocument[] = [
  {
    id: 'faq-001',
    tenantId: 'demo-tenant',
    title: 'Veelgestelde Vragen - TechCorp Solutions',
    content: `Veelgestelde Vragen - TechCorp Solutions

Q: Hoe lang duurt het om een web applicatie te ontwikkelen?
A: Dit hangt af van de complexiteit. Een eenvoudige website duurt 2-4 weken, een complexe web applicatie kan 3-6 maanden duren.

Q: Welke technologieën gebruiken jullie?
A: We gebruiken moderne technologieën zoals React, Next.js, Node.js, TypeScript, PostgreSQL, en cloud platforms zoals AWS en Azure.

Q: Bieden jullie ondersteuning na de oplevering?
A: Ja, we bieden verschillende ondersteuningspakketten van basis email support tot 24/7 dedicated support.

Q: Wat zijn jullie tarieven?
A: Onze tarieven variëren van €2,500 tot €10,000 per maand afhankelijk van het pakket. Neem contact op voor een offerte op maat.

Q: Kunnen jullie bestaande systemen integreren?
A: Ja, we hebben ervaring met het integreren van bestaande CRM, ERP en andere bedrijfssystemen.

Q: Wat is jullie uptime garantie?
A: Voor Enterprise klanten garanderen we 99.9% uptime. Voor andere pakketten is dit 99.5%.

Q: Hoe beveiligen jullie onze data?
A: We gebruiken end-to-end encryptie, regelmatige security audits, en voldoen aan GDPR en ISO 27001 standaarden.

Q: Kunnen jullie helpen met SEO?
A: Ja, we kunnen helpen met technische SEO optimalisatie en content strategie voor betere zoekresultaten.`,
    type: 'faq',
    source: 'faq-techcorp-2024.md',
    createdAt: '2024-01-10T09:00:00Z',
    processedAt: '2024-01-10T09:02:00Z',
    status: 'processed',
    chunks: [
      {
        id: 'chunk-007',
        documentId: 'faq-001',
        content: 'Ontwikkeltijd: Eenvoudige website 2-4 weken, complexe web applicatie 3-6 maanden',
        metadata: { section: 'Ontwikkeltijd' }
      },
      {
        id: 'chunk-008',
        documentId: 'faq-001',
        content: 'Technologieën: React, Next.js, Node.js, TypeScript, PostgreSQL, AWS, Azure',
        metadata: { section: 'Technologieën' }
      },
      {
        id: 'chunk-009',
        documentId: 'faq-001',
        content: 'Ondersteuning: Verschillende pakketten van basis email support tot 24/7 dedicated support',
        metadata: { section: 'Ondersteuning' }
      },
      {
        id: 'chunk-010',
        documentId: 'faq-001',
        content: 'Tarieven: €2,500 tot €10,000 per maand afhankelijk van het pakket',
        metadata: { section: 'Tarieven' }
      },
      {
        id: 'chunk-011',
        documentId: 'faq-001',
        content: 'Uptime garantie: Enterprise klanten 99.9%, andere pakketten 99.5%',
        metadata: { section: 'Uptime' }
      },
      {
        id: 'chunk-012',
        documentId: 'faq-001',
        content: 'Beveiliging: End-to-end encryptie, security audits, GDPR en ISO 27001 compliance',
        metadata: { section: 'Beveiliging' }
      }
    ]
  }
];

// Demo content voor RetailMax (test-tenant)
export const DEMO_RETAIL_CONTENT: KnowledgeDocument[] = [
  {
    id: 'retail-001',
    tenantId: 'test-tenant',
    title: 'RetailMax - Verkoop Handleiding',
    content: `RetailMax Verkoop Handleiding 2024

Hoofdstuk 1: Product Categorieën
Elektronica:
- Smartphones en tablets
- Laptops en computers
- Audio en video apparatuur
- Gaming accessoires

Hoofdstuk 2: Verkoop Processen
1. Klant begroeten en behoeften inventariseren
2. Product demonstratie
3. Prijs bespreken en kortingen
4. Betaling en afhandeling
5. Follow-up en service

Hoofdstuk 3: Retourbeleid
- 14 dagen retourrecht
- Originele verpakking vereist
- Geen retourkosten voor defecte producten
- Geld terug of omruilen mogelijk

Hoofdstuk 4: Klantenservice
Openingstijden: Ma-Vr 9:00-18:00, Za 10:00-16:00
Telefoon: 0800-RETAILMAX
Email: service@retailmax.nl
Live chat beschikbaar op website`,
    type: 'manual',
    source: 'verkoop-handleiding-2024.pdf',
    createdAt: '2024-01-12T11:00:00Z',
    processedAt: '2024-01-12T11:03:00Z',
    status: 'processed',
    chunks: [
      {
        id: 'chunk-013',
        documentId: 'retail-001',
        content: 'Product Categorieën: Smartphones en tablets, Laptops en computers, Audio en video apparatuur, Gaming accessoires',
        metadata: { page: 1, section: 'Hoofdstuk 1' }
      },
      {
        id: 'chunk-014',
        documentId: 'retail-001',
        content: 'Verkoop Processen: Klant begroeten, Product demonstratie, Prijs bespreken, Betaling en afhandeling, Follow-up en service',
        metadata: { page: 2, section: 'Hoofdstuk 2' }
      },
      {
        id: 'chunk-015',
        documentId: 'retail-001',
        content: 'Retourbeleid: 14 dagen retourrecht, Originele verpakking vereist, Geen retourkosten voor defecte producten, Geld terug of omruilen mogelijk',
        metadata: { page: 3, section: 'Hoofdstuk 3' }
      },
      {
        id: 'chunk-016',
        documentId: 'retail-001',
        content: 'Klantenservice: Ma-Vr 9:00-18:00, Za 10:00-16:00, Telefoon 0800-RETAILMAX, Email service@retailmax.nl, Live chat beschikbaar',
        metadata: { page: 4, section: 'Hoofdstuk 4' }
      }
    ]
  }
];

// Alle demo content gecombineerd
export const ALL_DEMO_CONTENT: KnowledgeDocument[] = [
  ...DEMO_PDF_CONTENT,
  ...DEMO_FAQ_CONTENT,
  ...DEMO_RETAIL_CONTENT
];

// Simpele text search functie voor demo doeleinden
export function searchKnowledgeBase(
  query: string, 
  tenantId: string, 
  limit: number = 5
): SearchResult[] {
  const tenantContent = ALL_DEMO_CONTENT.filter(doc => doc.tenantId === tenantId);
  const results: SearchResult[] = [];

  for (const document of tenantContent) {
    for (const chunk of document.chunks) {
      const score = calculateRelevanceScore(query.toLowerCase(), chunk.content.toLowerCase());
      if (score > 0.1) { // Minimum relevance threshold
        results.push({
          chunk,
          document,
          score,
          snippet: generateSnippet(chunk.content, query)
        });
      }
    }
  }

  // Sort by relevance score and limit results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function calculateRelevanceScore(query: string, content: string): number {
  const queryWords = query.split(/\s+/).filter(word => word.length > 2);
  let score = 0;
  
  for (const word of queryWords) {
    if (content.includes(word)) {
      score += 1;
      // Bonus for exact phrase matches
      if (content.includes(query)) {
        score += 2;
      }
    }
  }
  
  return score / queryWords.length;
}

function generateSnippet(content: string, query: string): string {
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
  const end = Math.min(words.length, start + maxLength / 6); // Approximate word count
  
  let snippet = words.slice(start, end).join(' ');
  if (start > 0) snippet = '...' + snippet;
  if (end < words.length) snippet = snippet + '...';
  
  return snippet;
}
