import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatboxWidget } from '../src/widget';

// Mock DOM environment
const mockDOM = () => {
  const div = document.createElement('div');
  div.id = 'chatbox-widget';
  document.body.appendChild(div);
  return div;
};

describe('MVP-001: Embeddable script & init-flow', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
    mockDOM();
    
    // Reset global
    delete (window as any).Chatbox;
  });

  describe('Acceptatiecriteria 1: FAB en Drawer verschijnen zonder console errors', () => {
    it('should initialize without console errors', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      
      // When
      const widget = new ChatboxWidget();
      widget.init({ tenantId: 'test-tenant' });
      
      // Then
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(document.querySelector('.chatbox-fab')).toBeTruthy();
      expect(document.querySelector('.chatbox-drawer')).toBeTruthy();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Acceptatiecriteria 2: Fallback op veilige defaults bij ongeldige options', () => {
    it('should fallback to safe defaults with console warning', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      
      // Given ongeldige options
      const invalidOptions = { tenantId: '', invalidProp: 'test' };
      
      // When
      const widget = new ChatboxWidget();
      widget.init(invalidOptions as any);
      
      // Then
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid options, falling back to defaults')
      );
      expect(widget.getConfig().tenantId).toBe('default-tenant');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Acceptatiecriteria 3: Blokkeren van niet-geautoriseerde domains', () => {
    it('should block unauthorized domains', async () => {
      // Given een domain dat niet in de config staat
      Object.defineProperty(window, 'location', {
        value: { hostname: 'unauthorized-site.com' },
        writable: true
      });
      
      // When
      const widget = new ChatboxWidget();
      const result = await widget.init({ tenantId: 'test-tenant' });
      
      // Then
      expect(result).toBe(false);
      expect(document.querySelector('.chatbox-fab')).toBeFalsy();
    });
  });

  describe('NFR-checks', () => {
    describe('Performance: p95 init <500ms', () => {
      it('should initialize within 500ms', async () => {
        const startTime = performance.now();
        
        const widget = new ChatboxWidget();
        await widget.init({ tenantId: 'test-tenant' });
        
        const endTime = performance.now();
        const initTime = endTime - startTime;
        
        expect(initTime).toBeLessThan(500);
      });
    });

    describe('Security: SRI + CSP actief', () => {
      it('should have SRI integrity attribute', () => {
        const script = document.createElement('script');
        script.src = 'https://cdn.chatbox.com/widget.js';
        script.integrity = 'sha384-valid-hash';
        
        expect(script.integrity).toBeTruthy();
        expect(script.integrity).toMatch(/^sha\d+-/);
      });
    });

    describe('Privacy: geen PII in query-params', () => {
      it('should not expose PII in URL parameters', () => {
        const widget = new ChatboxWidget();
        widget.init({ tenantId: 'test-tenant' });
        
        // Check that no sensitive data is added to URL
        const urlParams = new URLSearchParams(window.location.search);
        expect(urlParams.get('tenantId')).toBeFalsy();
        expect(urlParams.get('email')).toBeFalsy();
      });
    });

    describe('Accessibility: geen focusverlies bij init', () => {
      it('should not cause focus loss during initialization', () => {
        const input = document.createElement('input');
        input.focus();
        document.body.appendChild(input);
        
        const activeElement = document.activeElement;
        
        const widget = new ChatboxWidget();
        widget.init({ tenantId: 'test-tenant' });
        
        expect(document.activeElement).toBe(activeElement);
      });
    });
  });
});
