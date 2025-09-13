// SSE Client for MVP-003B: Frontend SSE Integratie & Backend Connectie

export interface SSEEvent {
  type: 'typing' | 'content' | 'done' | 'error';
  token?: string;
  message?: string;
  confidence?: number;
  latency?: number;
}

export interface SSEClientConfig {
  baseUrl: string;
  tenantId: string;
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
}

export class SSEClient {
  private config: SSEClientConfig;
  private eventSource: EventSource | null = null;
  private retryCount: number = 0;
  private isConnected: boolean = false;

  constructor(config: SSEClientConfig) {
    this.config = config;
  }

  async connect(
    conversationId: string,
    message: string,
    onEvent: (event: SSEEvent) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      this.isConnected = true;
      this.retryCount = 0;

      // Show typing indicator
      onEvent({
        type: 'typing',
        message: 'Assistant is typing...'
      });

      // Create SSE connection
      const url = `${this.config.baseUrl}/api/ai/query`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': this.config.tenantId
        },
        body: JSON.stringify({
          tenantId: this.config.tenantId,
          conversationId: conversationId,
          message: message
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          const errorData = await response.json();
          throw new Error(`Rate limit exceeded. Retry after ${errorData.retryAfter} seconds.`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle SSE stream
      await this.handleSSEStream(response, onEvent);

    } catch (error) {
      this.isConnected = false;
      
      if (this.retryCount < this.config.maxRetries) {
        await this.retryWithBackoff(conversationId, message, onEvent, onError);
      } else {
        onError?.(error as Error);
      }
    }
  }

  private async handleSSEStream(
    response: Response,
    onEvent: (event: SSEEvent) => void
  ): Promise<void> {
    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onEvent(data as SSEEvent);
            } catch (e) {
              // Skip invalid JSON - log for debugging
              console.warn('Invalid SSE data:', line.slice(6));
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private async retryWithBackoff(
    conversationId: string,
    message: string,
    onEvent: (event: SSEEvent) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    this.retryCount++;
    
    const delay = this.calculateRetryDelay();
    
    // Show retry message
    onEvent({
      type: 'typing',
      message: `Retrying... (${this.retryCount}/${this.config.maxRetries})`
    });

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      await this.connect(conversationId, message, onEvent, onError);
    } catch (error) {
      if (this.retryCount >= this.config.maxRetries) {
        onError?.(error as Error);
      }
    }
  }

  private calculateRetryDelay(): number {
    const delay = Math.min(
      this.config.baseDelay * Math.pow(2, this.retryCount - 1),
      this.config.maxDelay
    );
    
    return this.config.jitter 
      ? delay + Math.random() * 1000 
      : delay;
  }

  disconnect(): void {
    this.isConnected = false;
    this.eventSource?.close();
    this.eventSource = null;
  }

  isConnecting(): boolean {
    return this.isConnected;
  }
}
