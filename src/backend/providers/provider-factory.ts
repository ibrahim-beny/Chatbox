import { AIProvider, TenantConfig } from '../types.js';
import { MockAIProvider } from './mock-provider.js';
import { OpenAIProvider } from './openai-provider.js';

export class ProviderFactory {
  static createProvider(config: TenantConfig): AIProvider {
    // Check if mock should be used
    if (process.env.USE_MOCK_LLM === 'true' || !process.env.OPENAI_API_KEY) {
      return new MockAIProvider();
    }

    // Use OpenAI provider if API key is available
    if (config.aiProvider === 'openai' && process.env.OPENAI_API_KEY) {
      return new OpenAIProvider(process.env.OPENAI_API_KEY);
    }

    // Fallback to mock
    return new MockAIProvider();
  }
}
