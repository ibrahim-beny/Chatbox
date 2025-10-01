# 🚀 Chatbox Widget - Installatie & Integratiegids

## 📋 Overzicht

Deze gids helpt je om de Chatbox Widget in minder dan 10 minuten te integreren op jouw website. De widget werkt op alle platforms: WordPress, Shopify, custom HTML sites, en meer.

**⏱️ Geschatte tijd:** 5-10 minuten  
**🎯 Doel:** Widget live op je website met AI-chat functionaliteit

---

## 🎯 Snelle Start (5 minuten)

### Stap 1: Script toevoegen
Voeg dit script toe aan de `<head>` sectie van je website:

```html
<script src="https://your-domain.com/dist/widget.iife.js"></script>
<script>
  ChatboxWidget.init({
    tenantId: 'your-tenant-id',
    apiUrl: 'https://your-domain.com/api',
    position: 'bottom-right',
    theme: 'light'
  });
</script>
```

### Stap 2: Testen
1. Open je website
2. Klik op de chatbox icoon (rechtsonder)
3. Stel een test vraag
4. ✅ Widget werkt!

---

## 🛠️ Platform-specifieke Integraties

### WordPress (Zonder Plugin)

#### Methode 1: Theme Editor
1. Ga naar **Appearance → Theme Editor**
2. Selecteer `header.php`
3. Voeg het script toe vóór `</head>`:

```html
<!-- Chatbox Widget -->
<script src="https://your-domain.com/dist/widget.iife.js"></script>
<script>
  ChatboxWidget.init({
    tenantId: 'your-tenant-id',
    apiUrl: 'https://your-domain.com/api',
    position: 'bottom-right',
    theme: 'light',
    branding: {
      primaryColor: '#007cba',
      logo: 'https://your-site.com/logo.png'
    }
  });
</script>
```

#### Methode 2: Custom HTML Widget
1. Ga naar **Appearance → Widgets**
2. Voeg een **Custom HTML** widget toe
3. Plak het script in de widget
4. Zet widget op gewenste positie

#### Methode 3: functions.php
Voeg toe aan je `functions.php`:

```php
function add_chatbox_widget() {
    ?>
    <script src="https://your-domain.com/dist/widget.iife.js"></script>
    <script>
      ChatboxWidget.init({
        tenantId: 'your-tenant-id',
        apiUrl: 'https://your-domain.com/api',
        position: 'bottom-right',
        theme: 'light'
      });
    </script>
    <?php
}
add_action('wp_head', 'add_chatbox_widget');
```

### Shopify

#### Methode 1: Theme.liquid
1. Ga naar **Online Store → Themes**
2. Klik **Actions → Edit code**
3. Open `theme.liquid`
4. Voeg script toe vóór `</head>`:

```html
<!-- Chatbox Widget -->
<script src="https://your-domain.com/dist/widget.iife.js"></script>
<script>
  ChatboxWidget.init({
    tenantId: 'your-tenant-id',
    apiUrl: 'https://your-domain.com/api',
    position: 'bottom-right',
    theme: 'light',
    branding: {
      primaryColor: '{{ settings.color_primary }}',
      logo: '{{ 'logo.png' | asset_url }}'
    }
  });
</script>
```

#### Methode 2: Shopify Script Tag API
Voor developers:

```javascript
// Via Shopify Admin API
const scriptTag = {
  script_tag: {
    event: 'onload',
    src: 'https://your-domain.com/dist/widget.iife.js'
  }
};
```

### Custom HTML Sites

#### Basis HTML Template
```html
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mijn Website</title>
    
    <!-- Chatbox Widget -->
    <script src="https://your-domain.com/dist/widget.iife.js"></script>
    <script>
      ChatboxWidget.init({
        tenantId: 'your-tenant-id',
        apiUrl: 'https://your-domain.com/api',
        position: 'bottom-right',
        theme: 'light'
      });
    </script>
</head>
<body>
    <!-- Je website content -->
</body>
</html>
```

### React/Next.js

#### React Component
```jsx
import { useEffect } from 'react';

const ChatboxWidget = ({ tenantId, apiUrl }) => {
  useEffect(() => {
    // Load script dynamically
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/dist/widget.iife.js';
    script.onload = () => {
      window.ChatboxWidget.init({
        tenantId,
        apiUrl,
        position: 'bottom-right',
        theme: 'light'
      });
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (window.ChatboxWidget) {
        window.ChatboxWidget.destroy();
      }
    };
  }, [tenantId, apiUrl]);

  return null;
};

export default ChatboxWidget;
```

#### Next.js Integration
```jsx
// pages/_app.js
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <script src="https://your-domain.com/dist/widget.iife.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              ChatboxWidget.init({
                tenantId: 'your-tenant-id',
                apiUrl: 'https://your-domain.com/api',
                position: 'bottom-right',
                theme: 'light'
              });
            `,
          }}
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
```

---

## ⚙️ Configuratie Opties

### Basis Configuratie
```javascript
ChatboxWidget.init({
  // Verplicht
  tenantId: 'your-tenant-id',        // Jouw tenant ID
  apiUrl: 'https://your-domain.com/api', // API endpoint
  
  // Optioneel
  position: 'bottom-right',         // 'bottom-right', 'bottom-left'
  theme: 'light',                   // 'light', 'dark', 'auto'
  language: 'nl',                   // 'nl', 'en', 'de', 'fr'
  
  // Branding
  branding: {
    primaryColor: '#007cba',        // Hoofdkleur
    secondaryColor: '#f0f0f0',      // Achtergrondkleur
    logo: 'https://your-site.com/logo.png', // Logo URL
    companyName: 'Jouw Bedrijf'     // Bedrijfsnaam
  },
  
  // Functionaliteit
  features: {
    handover: true,                 // Menselijke handover
    knowledgeBase: true,            // Kennisbasis
    analytics: true,                // Analytics tracking
    gdpr: true                      // GDPR compliance
  },
  
  // Callbacks
  onReady: () => console.log('Widget loaded'),
  onMessage: (message) => console.log('New message:', message),
  onHandover: () => console.log('Handover requested')
});
```

### Geavanceerde Configuratie
```javascript
ChatboxWidget.init({
  tenantId: 'your-tenant-id',
  apiUrl: 'https://your-domain.com/api',
  
  // Custom styling
  customCSS: `
    .chatbox-widget {
      border-radius: 20px !important;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;
    }
  `,
  
  // Conditional loading
  showOnPages: ['/contact', '/support'], // Alleen op specifieke pagina's
  hideOnPages: ['/checkout'],            // Verberg op specifieke pagina's
  
  // Time-based display
  showHours: {
    start: '09:00',
    end: '17:00',
    timezone: 'Europe/Amsterdam'
  },
  
  // A/B Testing
  experiment: {
    variant: 'A', // 'A' of 'B'
    weight: 0.5   // 50% kans op variant A
  }
});
```

---

## 🧪 Testing & Validatie

### Test Checklist
- [ ] Widget laadt correct op alle pagina's
- [ ] Chatbox icoon verschijnt op juiste positie
- [ ] Chat interface opent bij klik
- [ ] AI responses worden correct getoond
- [ ] Handover functionaliteit werkt
- [ ] Branding wordt correct toegepast
- [ ] Responsive design werkt op mobiel
- [ ] Geen JavaScript errors in console

### Browser Testing
Test op minimaal:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Performance Testing
```javascript
// Performance monitoring
ChatboxWidget.init({
  tenantId: 'your-tenant-id',
  apiUrl: 'https://your-domain.com/api',
  
  onReady: () => {
    // Measure load time
    const loadTime = performance.now();
    console.log(`Widget loaded in ${loadTime}ms`);
    
    // Send to analytics
    if (window.gtag) {
      gtag('event', 'chatbox_loaded', {
        load_time: loadTime
      });
    }
  }
});
```

---

## 🔧 Troubleshooting

### Veelvoorkomende Problemen

#### Widget laadt niet
**Oorzaak:** Script niet correct geladen  
**Oplossing:**
```html
<!-- Controleer of script correct is geladen -->
<script>
  if (typeof ChatboxWidget === 'undefined') {
    console.error('ChatboxWidget script not loaded');
    // Fallback: load from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.your-domain.com/widget.iife.js';
    document.head.appendChild(script);
  }
</script>
```

#### CORS Errors
**Oorzaak:** Cross-origin requests geblokkeerd  
**Oplossing:** Zorg dat API server CORS headers heeft:
```javascript
// Server-side CORS configuratie
app.use(cors({
  origin: ['https://your-site.com', 'https://www.your-site.com'],
  credentials: true
}));
```

#### Widget niet zichtbaar
**Oorzaak:** CSS conflicten of z-index problemen  
**Oplossing:**
```css
/* Force widget visibility */
.chatbox-widget {
  z-index: 999999 !important;
  position: fixed !important;
}
```

#### AI responses niet werkend
**Oorzaak:** API endpoint niet bereikbaar  
**Oplossing:**
```javascript
// Test API connectivity
fetch('https://your-domain.com/api/health')
  .then(response => response.json())
  .then(data => console.log('API Status:', data))
  .catch(error => console.error('API Error:', error));
```

### Debug Mode
Activeer debug mode voor uitgebreide logging:

```javascript
ChatboxWidget.init({
  tenantId: 'your-tenant-id',
  apiUrl: 'https://your-domain.com/api',
  debug: true, // Activeer debug mode
  
  onError: (error) => {
    console.error('Chatbox Error:', error);
    // Send error to monitoring service
  }
});
```

---

## 📊 Analytics & Monitoring

### Google Analytics Integration
```javascript
ChatboxWidget.init({
  tenantId: 'your-tenant-id',
  apiUrl: 'https://your-domain.com/api',
  
  onMessage: (message) => {
    // Track chat interactions
    if (window.gtag) {
      gtag('event', 'chat_message', {
        event_category: 'engagement',
        event_label: message.type
      });
    }
  },
  
  onHandover: () => {
    // Track handover requests
    if (window.gtag) {
      gtag('event', 'chat_handover', {
        event_category: 'conversion'
      });
    }
  }
});
```

### Custom Analytics
```javascript
// Custom analytics tracking
const trackChatboxEvent = (event, data) => {
  // Send to your analytics service
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href
    })
  });
};

ChatboxWidget.init({
  tenantId: 'your-tenant-id',
  apiUrl: 'https://your-domain.com/api',
  
  onReady: () => trackChatboxEvent('widget_loaded'),
  onMessage: (msg) => trackChatboxEvent('message_sent', { type: msg.type }),
  onHandover: () => trackChatboxEvent('handover_requested')
});
```

---

## 🚀 Productie Deployment

### Pre-deployment Checklist
- [ ] Alle configuratie opties getest
- [ ] Performance geoptimaliseerd
- [ ] Error handling geïmplementeerd
- [ ] Analytics tracking actief
- [ ] GDPR compliance gecontroleerd
- [ ] Cross-browser compatibility getest
- [ ] Mobile responsiveness gevalideerd

### Monitoring Setup
```javascript
// Production monitoring
ChatboxWidget.init({
  tenantId: 'your-tenant-id',
  apiUrl: 'https://your-domain.com/api',
  
  // Error reporting
  onError: (error) => {
    // Send to error monitoring service (Sentry, LogRocket, etc.)
    if (window.Sentry) {
      Sentry.captureException(error);
    }
  },
  
  // Performance monitoring
  onReady: () => {
    const loadTime = performance.now();
    if (loadTime > 3000) { // > 3 seconds
      console.warn('Slow widget load time:', loadTime);
    }
  }
});
```

---

## 📞 Support & Hulp

### Contact Informatie
- **Email:** support@your-domain.com
- **Documentatie:** https://docs.your-domain.com
- **Status Page:** https://status.your-domain.com

### Community
- **GitHub:** https://github.com/your-org/chatbox-widget
- **Discord:** https://discord.gg/your-server
- **Stack Overflow:** Tag: `chatbox-widget`

### Enterprise Support
Voor enterprise klanten:
- Dedicated support channel
- SLA garanties
- Custom integrations
- Priority feature requests

---

## 📝 Changelog

### v1.0.0 (2024-01-01)
- Initial release
- WordPress, Shopify, custom HTML support
- Basic AI chat functionality
- Handover system

### v1.1.0 (2024-01-15)
- React/Next.js support
- Advanced configuration options
- Performance improvements
- Enhanced error handling

---

*Laatste update: 2024-01-01*  
*Versie: 1.1.0*
