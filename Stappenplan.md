# Stappenplan

# Plan van Aanpak — Van idee tot product (ticket-gedreven met Cursor)

## 1. Initiatiefase

**Doel:** Idee concreet maken en randvoorwaarden bepalen.

**Activiteiten:**

- Beschrijf het probleem, doelgroep en gewenste waarde.
- Bepaal KPI’s en succescriteria.
- Stel randvoorwaarden en non-goals vast.

**Output:**

- `ONE-PAGER.md` (probleem, doelgroep, waarde, KPI’s, scope, non-goals, elevator pitch).

---

## 2. Requirementsfase

**Doel:** Wat moet er zakelijk en technisch bereikt worden?

**Activiteiten:**

- Opstellen van **Business Requirements (BRD.md)**
    - Genummerde BR-###, met rationale en prioriteit.
- Opstellen van **Solution Requirements (SRD.md)**
    - Functionele eisen (FR-###)
    - Niet-functionele eisen (NFR-###)
    - Oplossingsrichtingen die de architectuur sturen (zoals integraties, security-eisen, data-eisen).

**Output:**

- `BRD.md`
- `SRD.md`

---

## 3. Architectuurfase

- Prompt
    
    # Prompt — ADA genereren
    
    ## Rol
    
    Neem de rol aan van **Senior Solution Architect** die schrijft voor twee doelgroepen:
    
    1. **Cursor / developers** — concreet, uitvoerbaar, integraal.
    2. **Niet-technische opdrachtgever** — begrijpelijke uitleg en rationale per keuze.
    
    ## Context & Bronnen
    
    De ADA wordt opgesteld op basis van de volgende documenten (aanwezig in het project):
    
    - [**ONE-PAGER.md**](http://one-pager.md/) (probleem, doelgroep, waarde, scope, non-goals)
    - [**BRD.md**](http://brd.md/) (business requirements met KPI’s en prioriteit)
    - [**SRD.md**](http://srd.md/) (functionele & niet-functionele requirements)
    - [**MATRIX.md**](http://matrix.md/) (traceability BR ↔ FR/NFR)
    
    ## Opdracht
    
    Schrijf één samenhangend **Architectural Design & Decisions (ADA)** document in het **Nederlands**, als platte tekst (Markdown, `ADA.md`).
    
    ### Stijl
    
    - **Verhalend**, maar gestructureerd en uitvoerbaar.
    - **Elke belangrijke keuze** krijgt een korte toelichting en rationale (waarom gekozen, welke trade-offs, hoe dit bijdraagt aan BR/NFR).
    - Verwijs impliciet naar BR/SR (niet als lange lijst, maar als kader).
    - Voeg **minstens twee Mermaid-diagrammen** toe:
        - Contextdiagram (externen, gebruiker, website, widget, AI, handover, config).
        - Componentdiagram (frontend widget, backend services, orchestrator, handover, logging, security).
    - Gebruik fenced codeblokken met ```mermaid.
    
    ### Structuur
    
    De ADA moet exact de volgende hoofdstukken bevatten:
    
    1. **Executive Summary**
        - Probleem, gewenste waarde, kernoplossing, belangrijkste kwaliteitsattributen, en reden waarom dit ontwerp past.
    2. **Doelen, Scope & Randvoorwaarden**
        - Doelen, in-scope, non-goals, kritieke randvoorwaarden.
    3. **Kwaliteitsattributen & Impact**
        - Per NFR de implicaties op ontwerp/techniek.
    4. **Architectuuroverzicht**
        - Contextdiagram (Mermaid).
        - Beschrijving van interacties en hoofdscenario’s (happy path, fallback, degraded).
        - Sequence diagram voor de happy path (SSE).
    5. **Logische Architectuur & Componenten**
        - Componentdiagram (Mermaid).
        - Beschrijving frontend (widget) en backend services.
    6. **Gegevens & Configuratie**
        - Tenant-config, kennisbasis, retentiebeleid.
    7. **Integratie & Interfaces**
        - API-contracten (config, ai query, handover).
        - Event hooks in de browser.
    8. **Beveiliging & Privacy**
        - Transport, headers, inputvalidatie, rate-limiting, consent, PII-masking.
    9. **Observability**
        - Logs, metrics, dashboards, alerts.
    10. **Deployment, CI/CD & Rollback**
    - Services, immutability, SemVer, rollback-plan.
    - CI-gates (bundle size, latency, a11y, SBOM).
    1. **Risico’s & Trade-offs**
    - Top-5 risico’s en mitigaties.
    - Minstens 2 expliciete trade-offs.
    1. **Alternatieven overwogen**
    - 2–3 realistische alternatieven, met reden van afwijzing.
    
    ### Extra regels
    
    - Schrijf bondig, concreet en uitvoerbaar.
    - Elke sectie eindigt (waar zinvol) met **“waarom dit belangrijk is”** bullets.
    - Vermijd hype/jargon; leg termen kort uit bij eerste gebruik.
    - Alleen code in `mermaid`, JSON of TypeScript voorbeelden (geen implementatiecode).
    - Output alleen de ADA-tekst, geen meta-uitleg.
    - Als input ontbreekt: noteer aannames onder “Alternatieven overwogen” of verwerk in de tekst, en ga door.
    
    ## Verwachte Output
    
    Een volledig [**ADA.md**](http://ada.md/) document (zoals hierboven beschreven), dat direct in de projectdocumentatie kan worden opgenomen en door Cursor gebruikt kan worden om tickets/code van af te leiden.
    

**Doel:** Hoog-over ontwerp en richtlijnen bepalen **op basis van SRD**.

**Principes:**

- **Herleidbaarheid:** Elke architectuurkeuze verwijst naar relevante FR/NFR.

**Activiteiten:**

- Front-end architectuur
- Back-end architectuur
- Contextdiagram (gebruik mermaid).
- Componenten en verantwoordelijkheden.
- Datastromen en API-contracten.
- Belangrijkste ontwerpkeuzes (trade-offs).
- Hoofdstructuur van datamodellen en entiteiten.
- Logboek van beslissingen en wijzigingen bijhouden.

**Output:**

- `ADA.md` (Architecture & Decisions Archive: levendig document met Project Start Architectuur + beslissingen + updates, met SRD-referenties per keuze)

---

## 4. Backlogfase

**Doel:** Werkpakketten opdelen in tickets.

**Activiteiten:**

- Requirements vertalen naar 8–15 tickets voor MVP.
- Elk ticket bevat (met toelichting):
    - **ID:** Geef de ticket een ID, dus een bepaalde nummer. Dus elke ticket moet een eigen ID hebben.
    - **Titel:** Korte, resultaatgerichte omschrijving (imperatief). Zo blijft het scanbaar in tools als Notion.
    - **Context (link BR/SRD/ADA):** Waarom dit belangrijk is en welke besluiten/kaders gelden. Helpt Cursor om juiste aannames te doen.
    - **Acceptatiecriteria (Given/When/Then):** Concreet toetsbare voorwaarden; vormt basis voor tests en demo.
    - **NFR-checks (perf, a11y, privacy, security):** Welke kwaliteitseisen hier raken en hoe je ze aantoont (meting, lint, test). Belangrijk omdat kwaliteit vaak onzichtbaar is maar wél risico’s en kosten bepaalt.

Voorbeeld:

> 🎫 Ticket NET-001 — Basismodule bruto-naar-netto berekening
> 
> 
> **ID**
> 
> NET-001
> 
> **Titel**
> 
> Implementeer berekeningsfunctie voor bruto-naar-netto salaris (2025-regels)
> 
> **Context (link BR/SRD/ADA)**
> 
> - **BR-001:** Gebruiker moet snel netto salaris kunnen berekenen op basis van een bruto salaris.
> - **FR-001:** Applicatie moet belastingregels van 2025 toepassen (loonbelasting, premies, heffingskortingen).
> - **NFR-001:** Berekening moet volledig client-side gebeuren i.v.m. privacy.
> - **ADA-01:** Besluit om alle berekeningen in de browser uit te voeren (geen backend).
> 
> **Acceptatiecriteria (Given/When/Then)**
> 
> - *Given* een gebruiker voert bruto €4.000 in per maand
> - *When* de berekening wordt uitgevoerd
> - *Then* toont het systeem het juiste netto maandloon (afgerond op hele euro’s) volgens belastingregels 2025
> - *Given* een gebruiker voert een ongeldige waarde in (bijv. letters, leeg veld)
> - *When* de berekening wordt gestart
> - *Then* verschijnt een foutmelding: *“Vul een geldig bedrag in”*
> 
> **NFR-checks**
> 
> - **Performance:** Berekening <100ms uitvoeren.
> - **Accessibility (a11y):** Foutmeldingen moeten zichtbaar én leesbaar zijn voor screenreaders.
> - **Privacy:** Geen gegevens naar een server sturen, alles client-side.
> - **Security:** Input valideren zodat alleen numerieke waarden worden verwerkt.

**Output:**

- Tickets in Notion of ander tool (TODO/BEZIG/REVIEW/DONE).

---

## 5. Developer Guide

**Doel:** Cursor duidelijke workflow geven.

**Activiteiten:**

- Vaste 5-stappen cyclus vastleggen:
    1. Tests schrijven (laten falen)
    2. Implementatie
    3. Self-review/refactor
    4. NFR-checks
    5. Docs & demo
- Regels voor logging en DoD vastleggen.

**Output:**

- `DEVELOPER_GUIDE.md`

---

## 6. Ticketgedreven Buildfase

**Doel:** Stapsgewijs het product bouwen met Cursor.

**Activiteiten per ticket:**

1. Ticket naar **BEZIG** schuiven in Notion.
2. Ticketbeschrijving copy-pasten in Cursor.
3. Cursor voert workflow uit (5 stappen) en genereert log.
4. Log copy-pasten terug in het ticket.

**Output per ticket:**

- Code + tests + docs
- Log (in ticket)
- Changelog update

---

## 7. Integratie & Review

**Doel:** Kwaliteit en samenhang borgen.

**Activiteiten:**

- CI runnen (lint, tests, bundle size).

---

## ⚖️ Rollen

- **Jij** = regisseur (beslist wat er gebouwd wordt, prioriteit).
- **ChatGPT** = sparringspartner (requirements, PSA, backlog, ticket-schrijven).
- **Cursor** = developer (uitvoeren tickets in 5 stappen + logs).

---

# ✅ Checklist per project

1. onepager.md
2. brd.md
3. srd.md
4. ada.md
5. devguide.md