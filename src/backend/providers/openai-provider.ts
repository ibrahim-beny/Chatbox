import { AIProvider, ChatRequest, ChatResponse } from '../types.js';

interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

interface OpenAIMetrics {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  errorCount: number;
}

export class OpenAIProvider implements AIProvider {
  private config: OpenAIConfig;
  private metrics: OpenAIMetrics;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.config = {
      apiKey,
      model,
      maxTokens: 1000,
      temperature: 0.7,
      timeout: 30000 // 30 seconds
    };
    
    this.metrics = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageLatency: 0,
      errorCount: 0
    };
  }

  async *streamResponse(request: ChatRequest): AsyncGenerator<ChatResponse> {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    try {
      // Build system message with persona context if available
      let systemMessage = 'Je bent een behulpzame Nederlandse AI-assistent. Geef korte, duidelijke antwoorden in het Nederlands.';
      
      if (request.personaContext) {
        systemMessage = `Je bent een AI-assistent voor ${request.personaContext.persona}. 
        Toon: ${request.personaContext.tone}.
        Antwoord altijd in het Nederlands en wees behulpzaam.`;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: systemMessage
            },
            {
              role: 'user',
              content: request.content
            }
          ],
          stream: true,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let totalTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Update metrics
              const latency = Date.now() - startTime;
              this.metrics.averageLatency = (this.metrics.averageLatency + latency) / 2;
              this.metrics.totalTokens += totalTokens;
              
              // Calculate cost (approximate for gpt-4o-mini)
              const cost = (totalTokens / 1000) * 0.00015; // $0.15 per 1M tokens
              this.metrics.totalCost += cost;
              
              yield {
                token: '',
                type: 'done',
                confidence: 0.9,
                latency
              };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              const usage = parsed.usage;
              
              if (usage) {
                totalTokens = usage.total_tokens || 0;
              }
              
              if (content) {
                yield {
                  token: content,
                  type: 'content',
                  confidence: 0.85
                };
              }
            } catch (e) {
              // Skip invalid JSON
              continue;
            }
          }
        }
      }
    } catch (error) {
      this.metrics.errorCount++;
      console.error('OpenAI Provider Error:', error);
      
      yield {
        token: '',
        type: 'error',
        confidence: 0
      };
    }
  }

  // Get metrics for monitoring
  getMetrics(): OpenAIMetrics {
    return { ...this.metrics };
  }

  // Reset metrics
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageLatency: 0,
      errorCount: 0
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<OpenAIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
