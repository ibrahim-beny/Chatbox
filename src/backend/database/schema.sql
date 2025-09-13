-- Database schema voor MVP-005: Database Implementatie voor Kennisbasis
-- PostgreSQL schema voor chatbox demo

-- Maak database (uitvoeren als superuser)
-- CREATE DATABASE chatbox_demo;

-- Maak extensies aan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenant management tabel
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  industry VARCHAR,
  branding JSONB DEFAULT '{}',
  ai_provider VARCHAR DEFAULT 'openai',
  rate_limit JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Document storage tabel
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  content TEXT,
  type VARCHAR, -- 'pdf', 'faq', 'manual'
  source VARCHAR,
  status VARCHAR DEFAULT 'processing', -- 'processing', 'processed', 'failed'
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Search optimization tabel
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  relevance_score FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes voor performance
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_content ON document_chunks USING gin(to_tsvector('dutch', content));

-- Demo data insertie
INSERT INTO tenants (id, name, industry, branding, ai_provider, rate_limit) VALUES
('demo-tenant', 'TechCorp Solutions', 'Software Development', 
 '{"primaryColor": "#0A84FF", "welcomeMessage": "Welkom! Hoe kan ik je helpen?"}', 
 'openai', '{"requestsPerMinute": 30, "burstLimit": 10}'),
('test-tenant', 'RetailMax', 'E-commerce', 
 '{"primaryColor": "#FF6B6B", "welcomeMessage": "Hallo! Welkom bij RetailMax!"}', 
 'openai', '{"requestsPerMinute": 30, "burstLimit": 10}')
ON CONFLICT (id) DO NOTHING;

-- Demo documenten voor TechCorp Solutions
INSERT INTO documents (tenant_id, title, content, type, source, status, file_size) VALUES
('demo-tenant', 'Product Catalogus 2024', 
 'TechCorp Solutions - Product Catalogus 2024

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
- 99.9% uptime garantie', 
 'pdf', 'product-catalog-2024.pdf', 'processed', 15678),

('demo-tenant', 'Veelgestelde Vragen - TechCorp Solutions',
 'Veelgestelde Vragen - TechCorp Solutions

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
A: Ja, we kunnen helpen met technische SEO optimalisatie en content strategie voor betere zoekresultaten.',
 'faq', 'faq-techcorp-2024.md', 'processed', 12345),

('test-tenant', 'RetailMax - Verkoop Handleiding',
 'RetailMax Verkoop Handleiding 2024

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
Live chat beschikbaar op website',
 'manual', 'verkoop-handleiding-2024.pdf', 'processed', 9876)
ON CONFLICT DO NOTHING;

-- Demo document chunks voor snelle zoekopdrachten
INSERT INTO document_chunks (document_id, content, metadata, relevance_score) 
SELECT 
  d.id,
  chunk_content,
  chunk_metadata,
  chunk_score
FROM documents d,
LATERAL (
  VALUES 
    -- TechCorp chunks
    ('Web Development Services: React/Next.js applicaties, Node.js backend services, Database design en optimalisatie, API development en integratie, Cloud deployment (AWS, Azure, GCP)', '{"page": 1, "section": "Hoofdstuk 1"}', 0.95),
    ('Ondersteuning en Maintenance: 24/7 ondersteuning, Bug fixes binnen 24 uur, Feature requests binnen 1 week, Security updates maandelijks, Performance monitoring, Backup en disaster recovery', '{"page": 2, "section": "Hoofdstuk 2"}', 0.90),
    ('Prijzen en Packages: Starter Package €2,500/maand, Professional Package €5,000/maand, Enterprise Package €10,000/maand met verschillende ondersteuningsniveaus', '{"page": 3, "section": "Hoofdstuk 3"}', 0.88),
    ('Ontwikkeltijd: Eenvoudige website 2-4 weken, complexe web applicatie 3-6 maanden', '{"section": "Ontwikkeltijd"}', 0.85),
    ('Technologieën: React, Next.js, Node.js, TypeScript, PostgreSQL, AWS, Azure', '{"section": "Technologieën"}', 0.82),
    ('Ondersteuning: Verschillende pakketten van basis email support tot 24/7 dedicated support', '{"section": "Ondersteuning"}', 0.80),
    ('Tarieven: €2,500 tot €10,000 per maand afhankelijk van het pakket', '{"section": "Tarieven"}', 0.78),
    ('Uptime garantie: Enterprise klanten 99.9%, andere pakketten 99.5%', '{"section": "Uptime"}', 0.75),
    ('Beveiliging: End-to-end encryptie, security audits, GDPR en ISO 27001 compliance', '{"section": "Beveiliging"}', 0.72),
    -- RetailMax chunks
    ('Product Categorieën: Smartphones en tablets, Laptops en computers, Audio en video apparatuur, Gaming accessoires', '{"page": 1, "section": "Hoofdstuk 1"}', 0.92),
    ('Verkoop Processen: Klant begroeten, Product demonstratie, Prijs bespreken, Betaling en afhandeling, Follow-up en service', '{"page": 2, "section": "Hoofdstuk 2"}', 0.88),
    ('Retourbeleid: 14 dagen retourrecht, Originele verpakking vereist, Geen retourkosten voor defecte producten, Geld terug of omruilen mogelijk', '{"page": 3, "section": "Hoofdstuk 3"}', 0.85),
    ('Klantenservice: Ma-Vr 9:00-18:00, Za 10:00-16:00, Telefoon 0800-RETAILMAX, Email service@retailmax.nl, Live chat beschikbaar', '{"page": 4, "section": "Hoofdstuk 4"}', 0.82)
) AS chunks(chunk_content, chunk_metadata, chunk_score)
WHERE d.title IN ('Product Catalogus 2024', 'Veelgestelde Vragen - TechCorp Solutions', 'RetailMax - Verkoop Handleiding')
ON CONFLICT DO NOTHING;
