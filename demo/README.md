# Demo Pagina's - Chatbox Widget

Deze directory bevat verschillende demo pagina's voor het testen en demonstreren van de Chatbox Widget functionaliteiten.

## 📁 Bestanden Overzicht

### 🎯 Voor Stakeholders & Product Managers

#### `stakeholder-demo.html` ⭐ **AANBEVOLEN**
**Doel:** Hoofddemo voor niet-technische stakeholders
- **Tabbed interface** met duidelijke navigatie
- **Live demo functionaliteit** - echte chat interface
- **Business value uitleg** - ROI en use cases
- **Visuele elementen** - previews en metrics
- **Stap-voor-stap guides** - geen technische kennis vereist

#### `index.html` 
**Doel:** Uitgebreide technische demo met alle MVP tests
- **Alle MVP validaties** - MVP-001 t/m MVP-007
- **Gedetailleerde tests** - technische diepgang
- **Live demo sectie** - verbeterd met visuele feedback
- **Performance metrics** - response tijden en status

### 🔧 Voor Developers

#### `backend-test.html`
**Doel:** Backend API testing en validatie
- **API endpoint tests** - health, config, AI query
- **SSE streaming tests** - real-time token delivery
- **Rate limiting tests** - 30 req/min validatie
- **Performance metrics** - response tijden

#### `mvp-003b-test.html`
**Doel:** Frontend SSE integratie testing
- **Typing indicator tests** - UI feedback
- **Auto-retry tests** - netwerkonderbreking handling
- **Rate limit handling** - frontend error handling
- **End-to-end tests** - volledige flow validatie

#### `test.html`
**Doel:** Basis widget functionaliteit test
- **Widget initialization** - basis en custom config
- **Script loading** - CDN en local loading
- **Console logging** - debug informatie

### 🎛️ Admin Interface

#### `admin.html`
**Doel:** Database en kennisbasis beheer
- **Document management** - upload en zoeken
- **Multi-tenant support** - verschillende tenants
- **Real-time stats** - documenten en chunks
- **Database status** - health monitoring

## 🚀 Hoe te Gebruiken

### Voor Product Managers

1. **Start met `stakeholder-demo.html`**
   - Klik op "Live Demo" tab
   - Start de live demo
   - Test verschillende vragen
   - Bekijk business value tab voor ROI

2. **Gebruik `index.html` voor validatie**
   - Scroll naar specifieke MVP secties
   - Klik test knoppen
   - Controleer groen/rood status

### Voor Developers

1. **Backend Testing**
   - Start backend: `node server.js`
   - Open `backend-test.html`
   - Test alle endpoints

2. **Frontend Testing**
   - Open `mvp-003b-test.html`
   - Test SSE integratie
   - Controleer error handling

3. **Admin Interface**
   - Open `admin.html`
   - Upload test documenten
   - Test zoekfunctionaliteit

## 🔧 Setup Vereisten

### Backend Server
```bash
# Start de backend server
node server.js
# of
node server-sqlite.js
```

### Widget Script
Zorg dat `../dist/widget.iife.js` beschikbaar is.

### Environment
- Backend draait op `http://localhost:3000`
- Widget script geladen vanuit `../dist/`

## 📊 Test Scenarios

### Basis Functionaliteit
- [ ] Widget laadt correct
- [ ] Chat interface opent
- [ ] AI antwoordt op vragen
- [ ] Kennisbasis retrieval werkt

### Geavanceerde Features
- [ ] Human handover werkt
- [ ] Multi-tenant personas verschillend
- [ ] Custom branding werkt
- [ ] Performance < 200ms

### Error Handling
- [ ] Rate limiting werkt
- [ ] Netwerk errors worden afgehandeld
- [ ] Ongeldige configuratie wordt afgehandeld
- [ ] Backend offline wordt afgehandeld

## 🎯 Demo Tips

### Voor Stakeholders
- **Start met live demo** - laat de widget in actie zien
- **Gebruik echte vragen** - "Wat zijn jullie diensten?"
- **Test handover** - "Ik wil met een mens praten"
- **Toon business value** - ROI en kostenbesparing

### Voor Developers
- **Test alle endpoints** - gebruik backend-test.html
- **Controleer performance** - response tijden
- **Test error scenarios** - rate limiting, offline
- **Valideer MVP's** - gebruik index.html tests

## 🐛 Troubleshooting

### Widget laadt niet
- Controleer of `../dist/widget.iife.js` bestaat
- Ververs de pagina (hard refresh)
- Controleer browser console voor errors

### Backend niet bereikbaar
- Start backend server: `node server.js`
- Controleer of poort 3000 vrij is
- Test health endpoint: `http://localhost:3000/api/health`

### Tests falen
- Controleer backend status
- Controleer tenant configuratie
- Bekijk browser console voor errors

## 📈 Metrics & KPI's

### Performance
- **Widget init:** < 500ms
- **Search response:** < 200ms
- **Bundle size:** < 80kB

### Functionaliteit
- **Uptime:** 99.9%
- **Success rate:** > 95%
- **Error handling:** Graceful degradation

### Business Value
- **Support reduction:** 60-80%
- **Response time:** 24/7 beschikbaar
- **Customer satisfaction:** Verbeterde UX

## 🔄 Updates

### Recente Verbeteringen
- ✅ Live demo functionaliteit toegevoegd
- ✅ Visuele previews en feedback
- ✅ Stap-voor-stap guides
- ✅ Business value uitleg
- ✅ Quick status indicators

### Geplande Verbeteringen
- 📸 Screenshots en GIFs toevoegen
- 🎥 Video demo's
- 📊 Real-time analytics
- 🔔 Notificaties voor status changes

