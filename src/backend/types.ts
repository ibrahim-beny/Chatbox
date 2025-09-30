// Types for MVP-003A: AI Orchestrator & SSE Backend

export interface ChatRequest {
  tenantId: string;
  conversationId: string;
  content: string;
  personaContext?: {
    persona: string;
    tone: string;
    templateVersion: string;
  };
}

export interface ChatResponse {
  token: string;
  type: 'content' | 'done' | 'error' | 'persona';
  confidence?: number;
  latency?: number;
  persona?: string;
  tone?: string;
  templateVersion?: string;
  promptTemplate?: string;
  safetyFilter?: boolean;
  redirectTo?: string;
}

export interface AIProvider {
  streamResponse(request: ChatRequest): AsyncGenerator<ChatResponse>;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  burstLimit: number;
  exemptPaths: string[];
}

export interface TenantConfig {
  tenantId: string;
  aiProvider: 'openai' | 'mock';
  rateLimit: RateLimitConfig;
  branding?: {
    primaryColor?: string;
    welcomeMessage?: string;
  };
}

export interface SSEEvent {
  data: string;
  type?: string;
  id?: string;
}

export interface ErrorResponse {
  error: string;
  code: string;
  retryAfter?: number;
  captchaRequired?: boolean;
}
