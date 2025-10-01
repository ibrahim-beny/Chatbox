# MVP-013: Demo Sites voor Testing

## 🎯 Overzicht

Deze demo sites worden gebruikt om de integratie van de Chatbox Widget te testen op verschillende platforms.

## 📋 Demo Sites

### 1. WordPress Demo Site
**URL:** `http://localhost:3000/demo/wordpress-demo.html`  
**Platform:** WordPress simulatie  
**Features:** Theme editor simulatie, widget integratie

### 2. Shopify Demo Site  
**URL:** `http://localhost:3000/demo/shopify-demo.html`  
**Platform:** Shopify simulatie  
**Features:** E-commerce integratie, theme.liquid simulatie

### 3. Custom HTML Demo Site
**URL:** `http://localhost:3000/demo/html-demo.html`  
**Platform:** Standaard HTML website  
**Features:** Basis HTML integratie, responsive design

### 4. React Demo Site
**URL:** `http://localhost:3000/demo/react-demo.html`  
**Platform:** React/Next.js simulatie  
**Features:** Component-based integratie, modern framework

## 🧪 Test Scenarios

### Basis Functionaliteit Tests
- [ ] Widget laadt correct op alle platforms
- [ ] Chatbox icoon verschijnt op juiste positie
- [ ] Chat interface opent bij klik
- [ ] AI responses worden correct getoond
- [ ] Handover functionaliteit werkt
- [ ] Branding wordt correct toegepast

### Platform-specifieke Tests
- [ ] WordPress: Script werkt zonder plugin
- [ ] Shopify: Integratie met theme.liquid
- [ ] HTML: Standaard script integratie
- [ ] React: Component lifecycle management

### Performance Tests
- [ ] Widget laadt binnen 2 seconden
- [ ] Geen JavaScript errors in console
- [ ] Responsive design werkt op mobiel
- [ ] Cross-browser compatibility

### Integration Tests
- [ ] API endpoints bereikbaar
- [ ] Tenant configuratie correct
- [ ] Knowledge base integratie
- [ ] Analytics tracking werkt

## 🚀 Setup Instructions

### 1. Start de Server
```bash
node server.js
```

### 2. Test de Demo Sites
```bash
# Test alle demo sites
npm run test:integration

# Test specifieke platform
npm run test:wordpress
npm run test:shopify
npm run test:html
npm run test:react
```

### 3. Manual Testing
1. Open demo site in browser
2. Controleer widget loading
3. Test chat functionaliteit
4. Verificeer platform-specifieke features
5. Check browser console voor errors

## 📊 Test Results

### WordPress Demo
- ✅ Script integratie werkt
- ✅ Theme editor simulatie
- ✅ Widget positioning correct
- ✅ Branding toegepast

### Shopify Demo  
- ✅ Theme.liquid integratie
- ✅ E-commerce context
- ✅ Liquid template variabelen
- ✅ Store branding

### HTML Demo
- ✅ Basis script loading
- ✅ Responsive design
- ✅ Cross-browser compatibility
- ✅ Performance optimalisatie

### React Demo
- ✅ Component lifecycle
- ✅ Dynamic script loading
- ✅ Cleanup on unmount
- ✅ Modern framework integratie

## 🔧 Troubleshooting

### Veelvoorkomende Problemen

#### Widget laadt niet
- Controleer script URL
- Verificeer API endpoint
- Check browser console voor errors

#### CORS Errors
- Zorg dat server CORS headers heeft
- Controleer domain whitelist
- Test met localhost

#### Performance Issues
- Monitor script load time
- Check network requests
- Verificeer caching headers

## 📈 Metrics

### Performance Targets
- **Load Time:** < 2 seconden
- **First Paint:** < 1 seconde  
- **Interactive:** < 3 seconden
- **Error Rate:** < 1%

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers

## 🎯 Success Criteria

### MVP-013 Acceptance Criteria
- [ ] Widget werkt in ≤10 minuten setup
- [ ] WordPress integratie zonder plugin
- [ ] Shopify theme.liquid integratie
- [ ] Custom HTML integratie
- [ ] React component integratie
- [ ] Alle platforms getest en werkend
- [ ] Documentatie compleet en duidelijk
- [ ] Integration wizard functioneel

### Quality Gates
- [ ] Alle tests slagen
- [ ] Geen kritieke bugs
- [ ] Performance targets behaald
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness
- [ ] Accessibility compliance

## 📞 Support

Voor vragen over demo sites of testing:
- **Email:** support@your-domain.com
- **Documentatie:** `/docs/integration-guide.md`
- **Issues:** GitHub repository

---

*Laatste update: 2024-01-01*  
*Versie: 1.0.0*