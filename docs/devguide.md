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
    - **Update demo pagina** met test sectie voor voltooide ticket.
    - Voeg log van de 5-stappen cyclus toe aan het ticket.

---

## Definition of Done

Een ticket is pas DONE wanneer:

- Alle tests groen zijn (inclusief nieuwe testcases).
- Code voldoet aan ADA-architectuur en traceability matrix.
- NFR-checks aantoonbaar gehaald zijn.
- Documentatie en changelog bijgewerkt zijn.
- **Demo pagina bijgewerkt** met test sectie voor voltooide ticket.
- Ticketlog de volledige 5-stappen cyclus bevat.

---

## Backlog-updates

Als een ticket volledig klaar is (status DONE):

1. **Update backlog.md**
    - Zoek de ticket in backlog.md.
    - Zet de status van het ticket naar **DONE**.
    - Voeg onder de ticket een sectie **Log** met de samenvatting van de 5-stappen cyclus (tests, implementatie, refactor, checks, docs/demo).
    - Voeg onder de ticket een sectie **Changelog** met de belangrijkste wijzigingen (bulletpoints).

2. **Update demo pagina**
    - Voeg test sectie toe aan `demo/index.html` voor voltooide ticket.
    - Update ticket status in ticket overview naar "Voltooid & Getest".
    - Implementeer JavaScript test functies voor alle acceptatiecriteria.
    - Gebruik consistent format en styling met bestaande test secties.
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

## Demo Pagina Updates

Voor elke voltooide ticket (status DONE) moet de demo pagina (`demo/index.html`) worden bijgewerkt:

### **Verplichte Demo Update Stappen:**

1. **Ticket Status Update**
   - Zet ticket status naar "Voltooid & Getest" in ticket overview
   - Update ticket naam indien nodig (bijv. MVP-005: Database Implementatie)

2. **Test Sectie Toevoegen**
   - Voeg nieuwe test sectie toe na bestaande test secties
   - Gebruik consistent format met andere MVP test secties
   - Include: Wat wordt getest, Test stappen, Test knoppen, Resultaten uitleg

3. **JavaScript Test Functies**
   - Implementeer test functies voor alle acceptatiecriteria
   - Gebruik duidelijke functienamen: `test[TicketName]()`
   - Include error handling en gebruiksvriendelijke feedback
   - Test zowel success als failure scenarios

### **Demo Sectie Template:**

```html
<div class="test-section">
    <h2>🎯 [TICKET-ID]: [TICKET-NAAM] Validatie</h2>
    
    <div class="test-instructions">
        <h4>🎯 Wat wordt er getest?</h4>
        <p><strong>[Korte beschrijving van functionaliteit]</strong></p>
        <p>[Uitgebreidere uitleg van wat de ticket implementeert]</p>
    </div>
    
    <div class="test-example">
        <h4>💡 Belangrijke verbeteringen:</h4>
        <p><strong>[Feature 1]:</strong> [Beschrijving]</p>
        <p><strong>[Feature 2]:</strong> [Beschrijving]</p>
    </div>
    
    <div class="test-instructions">
        <h4>🔧 Test Stappen:</h4>
        <ol>
            <li><strong>Klik "[Test Button 1]"</strong> - [Beschrijving]</li>
            <li><strong>Klik "[Test Button 2]"</strong> - [Beschrijving]</li>
        </ol>
    </div>
    
    <div style="margin: 20px 0;">
        <button onclick="test[FunctionName]()" class="button">[🎯 Test Button]</button>
    </div>
    
    <div id="[ticketId]Result" class="test-result"></div>
    
    <div class="test-example">
        <h4>✅ Wat betekent een geslaagde test?</h4>
        <p><strong>Groen vinkje:</strong> [Success betekenis]</p>
        <p><strong>Rood kruis:</strong> [Failure betekenis]</p>
    </div>
</div>
```

### **JavaScript Test Functie Template:**

```javascript
async function test[TicketName]() {
    const resultDiv = document.getElementById('[ticketId]Result');
    resultDiv.innerHTML = '<p>[🎯] Testing [functionality]...</p>';
    
    try {
        // Test implementation
        const response = await fetch('[endpoint]');
        
        if (!response.ok) {
            throw new Error(`[Error description]: ${response.status}`);
        }
        
        const data = await response.json();
        
        resultDiv.innerHTML = `
            <div class="test-result success">
                <h4>✅ [Test Name] Geslaagd!</h4>
                <p><strong>[Metric 1]:</strong> ${data.metric1}</p>
                <p><strong>[Metric 2]:</strong> ${data.metric2}</p>
                <p><strong>✅ Betekenis:</strong> [Success explanation]</p>
            </div>
        `;
        
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="test-result error">
                <h4>❌ [Test Name] Mislukt</h4>
                <p><strong>Probleem:</strong> ${error.message}</p>
                <p><strong>Oplossing:</strong> [Solution guidance]</p>
                <p><strong>❌ Betekenis:</strong> [Failure explanation]</p>
            </div>
        `;
    }
}
```

### **Regels voor Demo Updates:**

- **Consistentie:** Gebruik altijd hetzelfde format en styling
- **Gebruiksvriendelijkheid:** Duidelijke knoppen en feedback
- **Error Handling:** Altijd error scenarios testen en uitleggen
- **Product Manager Focus:** Tests moeten begrijpelijk zijn zonder technische kennis
- **Completeness:** Test alle acceptatiecriteria van het ticket

---

## Praktische regels

- Gebruik TypeScript voor frontend en backend.
- Gebruik geen nieuwe dependencies zonder security-scan (SBOM).
- Logging minimaal: ID, status (AI/handover), timestamp.
- Rollback moet SemVer + immutability volgen.
- Gebruik mermaid-diagrammen alleen in ADA en documentatie, niet in code.

---