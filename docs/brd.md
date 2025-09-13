# Business Requirements (BRD)

### BR-001 — Altijd beschikbaar AI-antwoord

- **Omschrijving:** De chatbox moet 24/7 direct antwoorden kunnen geven op klantvragen.
- **Rationale:** MKB’s hebben vaak geen groot supportteam; directe antwoorden voorkomen gemiste leads.
- **KPI-link:** ≥ 60% van gesprekken volledig afgehandeld door AI.
- **Acceptatiecriteria (Given/When/Then):**
    - *Given* een gebruiker stelt een vraag in het Nederlands
    - *When* de AI de vraag verwerkt
    - *Then* geeft de chatbox binnen 3 seconden een inhoudelijk antwoord
    - *And* wordt ≥ 60% van de gesprekken volledig afgehandeld zonder menselijke tussenkomst.

### BR-002 — Menselijke handover via e-mail (MVP)

- **Omschrijving:** Als de AI geen passend antwoord kan geven, moet de chatbox de gebruiker kunnen doorverbinden naar een menselijke medewerker via e-mail. Voor de MVP is de handover beperkt tot e-mail; andere kanalen (WhatsApp, Slack, Teams) vallen buiten scope.
- **Rationale:** Verhoogt betrouwbaarheid en klanttevredenheid; voorkomt frustratie bij complexe vragen. E-mail handover vereenvoudigt de implementatie en beperkt de scope voor de MVP.
- **KPI-link:** ≥ 80% tevredenheidsscore bij eindgebruikers en ≥ 80% succesvolle escalaties naar e-mail.
- **Acceptatiecriteria:**
    - *Given* de AI heeft onvoldoende vertrouwen in een antwoord
    - *When* de gebruiker kiest om doorverbonden te worden
    - *Then* wordt de vraag doorgestuurd naar een medewerker via e-mail
    - *And* ontvangt de gebruiker een bevestiging dat dit is gebeurd
    - *And* ontvangt de medewerker een e-mail met de vraag en context
    - *And* wordt de verzending bevestigd in de chat.

### BR-003 — Eenvoudige integratie via script

- **Omschrijving:** De chatbox moet eenvoudig te integreren zijn op websites (o.a. WordPress, Shopify, custom) via een embed script.
- **Rationale:** Doelgroep (MKB) heeft vaak geen technisch team; plug-and-play integratie is cruciaal.
- **KPI-link:** ≤ 2 uur implementatietijd bij klant.
- **Acceptatiecriteria:**
    - *Given* een klant ontvangt het embed-script en documentatie
    - *When* de klant dit script plaatst op een ondersteunde site
    - *Then* verschijnt de chatbox correct en is deze binnen 5 minuten bruikbaar.

### BR-004 — Branding & kennisbasis centraal beheerd

- **Omschrijving:** Branding (stijl, kleuren, logo) en de kennisbasis (FAQ, bedrijfsinformatie) worden centraal beheerd door de leverancier (niet door de klant).
- **Rationale:** Verlaagt drempel voor MKB-klanten; consistentie en kwaliteit blijven geborgd.
- **KPI-link:** ≤ 1 uur onboarding per klant.
- **Acceptatiecriteria:**
    - *Given* een nieuwe klant wordt toegevoegd
    - *When* de leverancier de branding en kennisbasis configureert
    - *Then* ziet de eindgebruiker direct de juiste stijl en antwoorden.

### BR-005 — GDPR-compliant dataverwerking

- **Omschrijving:** Alle data (gesprekken, contactgegevens) wordt onbeperkt bewaard, maar volledig in lijn met AVG/GDPR.
- **Rationale:** Juridische vereisten; cruciaal vertrouwen van klanten en eindgebruikers.
- **KPI-link:** 0 datalekken, 100% GDPR-audit passed.
- **Acceptatiecriteria:**
    - *Given* er worden persoonsgegevens verwerkt
    - *When* data wordt opgeslagen of verstuurd
    - *Then* gebeurt dit volgens GDPR (doelbinding, dataminimalisatie, encryptie)
    - *And* kan een gebruiker een inzage- of verwijderverzoek indienen.

### BR-006 — Ondersteuning Nederlands (MVP)

- **Omschrijving:** De chatbox moet in de MVP uitsluitend Nederlands ondersteunen; meertaligheid kan in latere iteraties toegevoegd worden.
- **Rationale:** Focus op eerste doelgroep (Nederlandse MKB’s); sneller realiseren van werkende MVP.
- **KPI-link:** ≥ 10 klanten in eerste 3 maanden.
- **Acceptatiecriteria:**
    - *Given* een gebruiker stelt een vraag in het Nederlands
    - *When* de AI antwoord geeft
    - *Then* is het antwoord in correct en natuurlijk Nederlands.

### BR-007 — Basisfunctionaliteit, geen rapportages (MVP)

- **Omschrijving:** In de MVP worden geen geavanceerde rapportages/statistieken geleverd. Alleen basisfunctionaliteit van chatbox met AI + handover.
- **Rationale:** Snelle time-to-market, focus op kernwaarde.
- **KPI-link:** MVP live binnen 3 maanden.
- **Acceptatiecriteria:**
    - *Given* de chatbox draait bij een klant
    - *When* gebruikers de chatbox gebruiken
    - *Then* zijn alleen de AI-chat en handover beschikbaar
    - *And* zijn er geen dashboards of rapportages zichtbaar.



### BR-009 — Responstijd ≤ 3 seconden

- **Omschrijving:** De AI moet een antwoord geven binnen maximaal 3 seconden.
- **Rationale:** Snelheid is essentieel voor gebruikservaring; trage antwoorden verlagen tevredenheid.
- **KPI-link:** < 3 sec gemiddelde responstijd per AI-antwoord.
- **Acceptatiecriteria:**
    - *Given* een gebruiker stelt een vraag
    - *When* de AI een antwoord genereert
    - *Then* verschijnt het antwoord in <3 seconden in ≥95% van de gevallen.

### BR-010 — Schaalbaarheid naar meerdere klanten

- **Omschrijving:** De chatbox moet meerdere klanten tegelijk kunnen bedienen, elk met eigen branding en kennisbasis.
- **Rationale:** SaaS-model vereist multi-tenant architectuur om kosten te delen en schaalbaar te zijn.
- **KPI-link:** 100% uptime bij 10+ gelijktijdige klanten in MVP.
- **Acceptatiecriteria:**
    - *Given* er zijn meerdere klanten met actieve chatboxen
    - *When* eindgebruikers chatten
    - *Then* ziet elke eindgebruiker alleen de branding en antwoorden van zijn eigen tenant
    - *And* vindt er geen datalek plaats tussen tenants.

### BR-011 — Veiligheid en privacy by design

- **Omschrijving:** De chatbox moet gevoelige klantinformatie (e-mailadressen, gesprekken) beveiligen met moderne standaarden (encryptie in rust en transport).
- **Rationale:** Risico op datalekken moet geminimaliseerd worden.
- **KPI-link:** 0 kritieke findings bij security-audit.
- **Acceptatiecriteria:**
    - *Given* de chatbox verwerkt gevoelige data
    - *When* data wordt opgeslagen of verstuurd
    - *Then* is dit versleuteld (TLS in transport, AES in rust)
    - *And* zijn security headers en policies toegepast.

### BR-012 — Logging en monitoring

- **Omschrijving:** De chatbox moet basislogging bieden (tijdstip, gespreks-ID, status AI vs. handover).
- **Rationale:** Voor support, analyse en incidentafhandeling is minimale logging vereist.
- **KPI-link:** 100% gesprekken voorzien van ID en log.
- **Acceptatiecriteria:**
    - *Given* een gesprek start en eindigt
    - *When* de chatbox logt
    - *Then* bevat de log minimaal: gespreks-ID, timestamp en status (AI/handover).

### BR-013 — Onderhoudsarme oplossing

- **Omschrijving:** Het product moet zo ontworpen zijn dat er minimaal onderhoud nodig is bij klanten.
- **Rationale:** Beperkt operationele lasten en supportkosten.
- **KPI-link:** < 1 supportticket per klant per maand.
- **Acceptatiecriteria:**
    - *Given* er wordt een nieuwe versie uitgerold
    - *When* de klant geen aanpassingen doet
    - *Then* blijft de chatbox functioneren zonder regressies of storingen.

### BR-014 — Ondersteuning mobiele apparaten

- **Omschrijving:** De chatbox moet goed functioneren op mobiele browsers en mobiele devices.
- **Rationale:** Groot deel van klantcontact loopt via mobiel; slechte ervaring kost leads.
- **KPI-link:** ≥ 95% gesprekken mobiel succesvol afgerond.
- **Acceptatiecriteria:**
    - *Given* een gebruiker opent de chatbox op mobiel
    - *When* hij een gesprek voert
    - *Then* zijn alle kernfuncties (FAB, invoer, handover) bruikbaar
    - *And* is de UI responsive en gebruiksvriendelijk.

### BR-015 — Rollback-mogelijkheid bij deployment

- **Omschrijving:** Nieuwe versies van de chatbox moeten veilig teruggedraaid kunnen worden bij issues.
- **Rationale:** Minimaliseert risico’s bij livegang en updates.
- **KPI-link:** < 30 min hersteltijd bij mislukte release.
- **Acceptatiecriteria:**
    - *Given* een nieuwe versie veroorzaakt fouten in productie
    - *When* rollback wordt uitgevoerd
    - *Then* is de vorige stabiele versie binnen 30 minuten actief
    - *And* blijven bestaande klantintegraties ongewijzigd bruikbaar.