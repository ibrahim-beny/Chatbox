# Developer Guide

## Doel

Deze Developer Guide geeft Cursor vaste instructies hoe tickets opgepakt, uitgevoerd en afgerond moeten worden binnen dit project. Alle keuzes en checks zijn afgeleid uit de projectdocumentatie: onepager.md, brd.md, srd.md, matrix.md, ada.md en stappenplan.md.

Het doel is een consistente, kwalitatieve en herleidbare build-cyclus, waarbij de backlog altijd up-to-date blijft.

---

## Kernregels

1. Cursor volgt altijd de 5-stappen workflow (tests → implementatie → refactor → NFR-checks → documentatie/demo).
2. Een ticket is pas DONE wanneer de Definition of Done is gehaald.
3. Cursor moet bij afronding altijd backlog.md bijwerken met status, log en changelog.
4. Cursor raadpleegt matrix.md om te weten welke SR gekoppeld is aan een BR.

---

## Workflow per ticket

1. **Tests schrijven (laten falen)**
    - Schrijf minimaal één test op basis van de acceptatiecriteria van het ticket.
    - Zorg dat de test initieel faalt.
    - Testen moeten herleidbaar zijn naar BR/SR.
2. **Implementatie**
    - Schrijf de code zodat alle tests slagen.
    - Houd je aan de architectuurkeuzes uit ada.md (frontend widget, backend services, SSE, multi-tenant, GDPR).
    - Code moet schoon, modulair en onderhoudbaar zijn.
3. **Self-review en refactor**
    - Verbeter codekwaliteit en leesbaarheid.
    - Minimaliseer duplicatie en gebruik duidelijke naamgeving.
    - Controleer of de implementatie aansluit op ADA-besluiten en traceability matrix.
4. **NFR-checks**
    - Performance: latency ≤3s, UI-render ≤100ms, bundlegrootte ≤80kB gzipped.
    - Security: HTTPS-only, inputvalidatie, security headers (CSP, HSTS, SRI).
    - Privacy: geen PII in logs, retentiebeleid toepassen.
    - Accessibility: WCAG 2.1 AA, TAB-navigatie, aria-labels.
    - Schaalbaarheid en betrouwbaarheid: multi-tenant isolatie, rollback ≤30 min.
5. **Documentatie en demo**
    - Update README of inline docstrings.
    - Update changelog.
    - Voeg korte demo-beschrijving toe (Given/When/Then).
    - Voeg log van de 5-stappen cyclus toe aan het ticket.

---

## Definition of Done

Een ticket is pas DONE wanneer:

- Alle tests groen zijn (inclusief nieuwe testcases).
- Code voldoet aan ADA-architectuur en traceability matrix.
- NFR-checks aantoonbaar gehaald zijn.
- Documentatie en changelog bijgewerkt zijn.
- Ticketlog de volledige 5-stappen cyclus bevat.

---

## Backlog-updates

Als een ticket volledig klaar is (status DONE):

1. **Update backlog.md**
    - Zoek de ticket in backlog.md.
    - Zet de status van het ticket naar **DONE**.
    - Voeg onder de ticket een sectie **Log** met de samenvatting van de 5-stappen cyclus (tests, implementatie, refactor, checks, docs/demo).
    - Voeg onder de ticket een sectie **Changelog** met de belangrijkste wijzigingen (bulletpoints).
2. **Voorbeeld update in backlog.md**

Ticket NET-001 — Basismodule bruto-naar-netto berekening

Status: DONE

Log:

- Test geschreven en initieel gefaald.
- Implementatie afgerond, tests groen.
- Code gerefactord en opgeschoond.
- NFR-checks doorstaan (performance <100ms, privacy: client-side).
- Documentatie en changelog bijgewerkt.

Changelog:

- Nieuwe functie toegevoegd voor bruto-naar-netto berekening (2025 regels).
- Validatie toegevoegd voor numerieke input.
- Foutmeldingen toegankelijk gemaakt voor screenreaders.
1. **Regels**
- Cursor mag een ticket pas op DONE zetten als alle criteria uit de Definition of Done zijn gehaald.
- Elke update moet herleidbaar zijn naar BR en SR.
- Changelog moet altijd kort en feitelijk zijn (geen meta-tekst).

---

## Praktische regels

- Gebruik TypeScript voor frontend en backend.
- Gebruik geen nieuwe dependencies zonder security-scan (SBOM).
- Logging minimaal: ID, status (AI/handover), timestamp.
- Rollback moet SemVer + immutability volgen.
- Gebruik mermaid-diagrammen alleen in ADA en documentatie, niet in code.

---