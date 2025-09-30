import { OpenAIProvider } from '../providers/openai-provider.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class OpenAIMonitoringHandler {
  private openaiProvider: OpenAIProvider | null = null;

  constructor() {
    // Initialize OpenAI provider if API key is available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      this.openaiProvider = new OpenAIProvider(process.env.OPENAI_API_KEY);
    }
  }

  async handleMetricsRequest(): Promise<Response> {
    try {
      if (!this.openaiProvider) {
        return ErrorHandler.createErrorResponse(
          'OpenAI provider not initialized',
          'OPENAI_NOT_CONFIGURED',
          503
        );
      }

      const metrics = this.openaiProvider.getMetrics();
      
      return new Response(JSON.stringify({
        success: true,
        provider: 'openai',
        metrics: {
          ...metrics,
          averageLatencyMs: Math.round(metrics.averageLatency),
          totalCostUSD: Math.round(metrics.totalCost * 100) / 100,
          errorRate: metrics.totalRequests > 0 ? (metrics.errorCount / metrics.totalRequests) * 100 : 0
        },
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: ErrorHandler.getCORSHeaders()
      });
      
    } catch (error) {
      console.error('OpenAI monitoring error:', error);
      return ErrorHandler.createErrorResponse('Failed to get OpenAI metrics', 'MONITORING_ERROR', 500);
    }
  }

  async handleResetMetricsRequest(): Promise<Response> {
    try {
      if (!this.openaiProvider) {
        return ErrorHandler.createErrorResponse(
          'OpenAI provider not initialized',
          'OPENAI_NOT_CONFIGURED',
          503
        );
      }

      this.openaiProvider.resetMetrics();
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Metrics reset successfully',
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: ErrorHandler.getCORSHeaders()
      });
      
    } catch (error) {
      console.error('OpenAI reset metrics error:', error);
      return ErrorHandler.createErrorResponse('Failed to reset metrics', 'RESET_ERROR', 500);
    }
  }

  async handleConfigRequest(request: Request): Promise<Response> {
    try {
      if (!this.openaiProvider) {
        return ErrorHandler.createErrorResponse(
          'OpenAI provider not initialized',
          'OPENAI_NOT_CONFIGURED',
          503
        );
      }

      const { maxTokens, temperature, model } = await request.json();
      
      this.openaiProvider.updateConfig({
        maxTokens: maxTokens || 1000,
        temperature: temperature || 0.7,
        model: model || 'gpt-4o-mini'
      });
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Configuration updated successfully',
        config: {
          maxTokens: maxTokens || 1000,
          temperature: temperature || 0.7,
          model: model || 'gpt-4o-mini'
        },
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: ErrorHandler.getCORSHeaders()
      });
      
    } catch (error) {
      console.error('OpenAI config update error:', error);
      return ErrorHandler.createErrorResponse('Failed to update configuration', 'CONFIG_ERROR', 500);
    }
  }

  // Get OpenAI provider instance
  getOpenAIProvider(): OpenAIProvider | null {
    return this.openaiProvider;
  }
}
