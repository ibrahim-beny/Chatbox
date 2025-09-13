import { TenantConfig } from './types.js';

export class ConfigService {
  private configs: Map<string, TenantConfig> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
  }

  private initializeDefaultConfigs(): void {
    // Default tenant configs
    this.configs.set('demo-tenant', {
      tenantId: 'demo-tenant',
      aiProvider: 'mock',
      rateLimit: {
        requestsPerMinute: 30,
        burstLimit: 10,
        exemptPaths: ['/health', '/config']
      },
      branding: {
        primaryColor: '#0A84FF',
        welcomeMessage: 'Welkom! Hoe kan ik je helpen?'
      }
    });

    this.configs.set('test-tenant', {
      tenantId: 'test-tenant',
      aiProvider: 'mock',
      rateLimit: {
        requestsPerMinute: 30,
        burstLimit: 10,
        exemptPaths: ['/health', '/config']
      },
      branding: {
        primaryColor: '#FF6B6B',
        welcomeMessage: 'Hallo! Ik ben je AI-assistent.'
      }
    });
  }

  getTenantConfig(tenantId: string): TenantConfig | null {
    return this.configs.get(tenantId) || null;
  }

  setTenantConfig(tenantId: string, config: TenantConfig): void {
    this.configs.set(tenantId, config);
  }

  getAllTenants(): string[] {
    return Array.from(this.configs.keys());
  }
}
