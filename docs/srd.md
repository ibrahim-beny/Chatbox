# Solution Requirements (SRD)

### FR-001 — AI-chat in het Nederlands

- Begrijpt en beantwoordt vragen in natuurlijk Nederlands.
- Ondersteunt small-talk (“Hallo”, “Dank je”).
- Context behouden binnen een sessie (30 min inactiviteit → reset).
- **Acceptatie:** *Given* gebruiker stelt vraag, *When* AI antwoordt, *Then* respons is coherent, NL en ≤3s.

---

### FR-002 — Menselijke handover via e-mail

- Bij lage confidence of fallback moet gebruiker kunnen kiezen voor e-mail-escalatie.
- Validatie e-mailadres.
- Bericht queued en maximaal 2x retry bij send-failure.
- UI-statusmelding “Verzonden” of “Mislukt, probeer later opnieuw”.

---

### FR-003 — Integratie via embed script

- Eén regel script (`<script src=...></script>`) om te integreren.
- Laden via CDN, SRI-hash verplicht.
- Installatiehandleiding + voorbeelden (WordPress, Shopify, custom).

---

### FR-004 — Branding & kennisbasis centraal beheerd

- Leverancier beheert kleuren, logo, welkomsttekst en kennisbasis.
- Config opgehaald via `GET /tenant/:id/config` (JSON).
- Versiebeheer kennisbasis: validatie (schema: vraag, antwoord, tags) en rollback mogelijk.

---

### FR-005 — GDPR-compliant dataretentie

- Dataretentie per categorie:
    - Chatinhoud MVP: niet opslaan.
    - Handover-mails: max. 180 dagen.
    - Logs (ID, status): 30 dagen.
- Gebruiker kan DSAR (inzage, wissen, export) aanvragen.

---

### FR-006 — Logging & monitoring

- Elk gesprek krijgt ID, status (AI/handover), timestamp.
- Telemetry (AI-afhandelingsratio, P50/P95 latency) anoniem en opt-in.

---

### FR-007 — Multi-tenant architectuur

- Tenant-isolatie: branding, kennisbasis, data strikt gescheiden.
- Tenant-provisioning via key/token.
- Rate-limits per tenant.

---

### FR-008 — Onderhoudsarme oplossing

- Updates door leverancier zonder klantactie.
- Backward compatibility in script API.

---

### FR-009 — Mobiele ondersteuning

- Responsive design (drawer > fullscreen op mobile).
- Touch-gestures ondersteund.
- Fabriekstest op iOS Safari, Android Chrome, tablets.

---

### FR-010 — Foutafhandeling & degraded mode

- Timeout >3s → melding “Het duurt iets langer, probeer opnieuw”.
- Bij AI failure → fallback naar FAQ-snelkoppelingen.

---

### FR-011 — Deployment & rollback

- Semver-versies, immutable CDN paths.
- Rollback ≤30 min.
- Feature flags voor risicovolle wijzigingen.

---

### FR-012 — Consent & privacy-UI

- Bij handover expliciete toestemming: *“Wil je dat dit bericht inclusief transcript verstuurd wordt?”*.
- Link naar privacyverklaring.

---

### FR-013 — PII-redactie

- Detectie en masking van e-mail, telefoon, IBAN in logs en handover.

---

### FR-014 — Abuse & rate limiting

- Max 5 berichten/10s per user; daarna captcha.
- Protectie tegen spam-handovers.

---

### FR-015 — Observability hooks

- Event-emitter (`onMessage`, `onHandover`, `onError`).
- Integratie mogelijk met extern monitoring-systeem.

---

## 3. Niet-functionele Requirements (NFR)

### NFR-001 — Performance

- Latency-budget:
    - UI-render ≤100ms.
    - AI-response P50 ≤2s, P95 ≤3s.
- Bundlegrootte ≤80kB gzipped (CI check).

---

### NFR-002 — Security

- HTTPS-only.
- Inputvalidatie (XSS, injection).
- CSP, SRI, HSTS, referrer-policy.
- Dependency scanning + SBOM per release.

---

### NFR-003 — Privacy & GDPR

- Privacy by design: dataminimalisatie, retentiebeleid.
- DPIA verplicht.
- Privacy-preserving telemetry (geen PII).

---

### NFR-004 — Accessibility

- WCAG 2.1 AA.
- TAB-navigatie, aria-labels, contrast ≥4.5:1.
- A11y-tests geautomatiseerd (axe-core).

---

### NFR-005 — Schaalbaarheid

- Ondersteunt ≥10 gelijktijdige tenants in MVP.
- Geen cross-tenant leakage (contract-tests).

---

### NFR-006 — Betrouwbaarheid

- Uptime ≥99,5%.
- MTTR ≤30 minuten.
- Health-check endpoints en synthetics.

---

### NFR-007 — Onderhoudbaarheid

- Modulaire code, documentatie verplicht.
- CI/CD pipeline incl. tests, lint, bundlegrootte-check.

---

### NFR-008 — Deployment & rollback

- Rollback binnen 30 min.
- Geautomatiseerd rollback playbook.

---

### NFR-009 — Compatibility

- Ondersteuning laatste 2 major browserversies (Chrome, Edge, Firefox, Safari).
- iOS/Android WebView support.