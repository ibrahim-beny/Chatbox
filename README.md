# Chatbox Widget

Een AI-aangedreven chatbox widget voor MKB websites, ontwikkeld volgens de specificaties in de projectdocumentatie.

## 🚀 Installatie

### Via CDN (aanbevolen)

```html
<script src="https://cdn.chatbox.com/widget.js" 
        integrity="sha384-[HASH]" 
        crossorigin="anonymous"></script>
```

### Via NPM

```bash
npm install chatbox-widget
```

## 📖 Gebruik

### Basis initialisatie

```javascript
// Initialiseer de chatbox
window.Chatbox.init({
  tenantId: 'your-tenant-id'
});
```

### Geavanceerde configuratie

```javascript
window.Chatbox.init({
  tenantId: 'your-tenant-id',
  primaryColor: '#0A84FF',
  welcomeMessage: 'Welkom! Hoe kan ik je helpen?'
});
```

## 🎯 Functionaliteiten

- **FAB (Floating Action Button)** - Altijd zichtbare chat-knop
- **Drawer UI** - Uitschuifbare chat-interface
- **Domain autorisatie** - Beveiligde toegang per website
- **Responsive design** - Werkt op alle apparaten
- **Toegankelijkheid** - WCAG 2.1 AA compliant
- **Keyboard navigatie** - Volledige toetsenbordondersteuning

## 🔧 API

### ChatboxWidget class

```typescript
interface ChatboxOptions {
  tenantId: string;
  primaryColor?: string;
  welcomeMessage?: string;
}

class ChatboxWidget {
  async init(options: ChatboxOptions): Promise<boolean>;
  getConfig(): ChatboxConfig;
  isReady(): boolean;
  destroy(): void;
}
```

## 🎨 Customisatie

### Kleuren aanpassen

```javascript
window.Chatbox.init({
  tenantId: 'your-tenant-id',
  primaryColor: '#FF6B6B' // Rode accentkleur
});
```

### Welkomstbericht wijzigen

```javascript
window.Chatbox.init({
  tenantId: 'your-tenant-id',
  welcomeMessage: 'Hallo! Ik ben je persoonlijke assistent.'
});
```

## 🔒 Beveiliging

- **Domain autorisatie** - Alleen geautoriseerde websites kunnen de widget laden
- **SRI (Subresource Integrity)** - Verificatie van script-integriteit
- **CSP compatibel** - Werkt met Content Security Policy
- **Geen PII exposure** - Geen gevoelige data in URL parameters

## ♿ Toegankelijkheid

- **WCAG 2.1 AA compliant**
- **Screen reader ondersteuning**
- **Keyboard navigatie**
- **Focus management**
- **ARIA labels**

## 📱 Responsive Design

- **Desktop:** FAB + Drawer layout
- **Mobile:** Fullscreen chat interface
- **Touch gestures** ondersteund
- **Viewport adaptatie**

## 🚦 Browser Ondersteuning

- Chrome (laatste 2 versies)
- Firefox (laatste 2 versies)
- Safari (laatste 2 versies)
- Edge (laatste 2 versies)
- iOS Safari
- Android Chrome

## 📊 Performance

- **Bundlegrootte:** < 80kB (gzipped)
- **Init tijd:** < 500ms (p95)
- **Geen layout shift** tijdens laden
- **Geoptimaliseerde animaties**

## 🧪 Development

### Installeren dependencies

```bash
npm install
```

### Tests uitvoeren

```bash
npm test
```

### Development server

```bash
npm run dev
```

### Build

```bash
npm run build
```

## 📋 MVP-001 Status

**Status:** ✅ DONE

**Implementatie:** Embeddable script & init-flow volledig geïmplementeerd volgens acceptatiecriteria en NFR-checks.

**Changelog:**
- ChatboxWidget klasse geïmplementeerd
- FAB en Drawer UI toegevoegd
- Domain autorisatie geïmplementeerd
- Fallback naar veilige defaults
- Toegankelijkheid en performance geoptimaliseerd
- Tests geschreven en groen

## 📚 Documentatie

- [Business Requirements (BRD)](docs/brd.md)
- [Solution Requirements (SRD)](docs/srd.md)
- [Architecture Design (ADA)](docs/ada.md)
- [Developer Guide](docs/devguide.md)
- [Backlog](docs/backlog.md)

## 📄 Licentie

MIT License - zie [LICENSE](LICENSE) bestand.
