/**
 * MVP-007: Human Handover Service
 * 
 * Beheert handover naar menselijke agents via e-mail met Resend
 */

import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '../../lib/email.js';

export interface HandoverRequest {
  tenantId: string;
  conversationId: string;
  userMessage: string;
  confidence: number;
  triggerReason: 'low_confidence' | 'keyword_match' | 'frustration_detected';
  persona?: string;
  tone?: string;
  transcript?: string[];
  isOffHours?: boolean;
}

export interface HandoverResponse {
  success: boolean;
  handoverToken?: string;
  handoverStatus: 'queued' | 'sent' | 'failed';
  emailSent?: boolean;
  confirmationMessage?: string;
  queuePosition?: number;
  estimatedResponseTime?: string;
  isOffHours?: boolean;
  triggerReason?: string;
  matchedKeyword?: string;
  frustrationScore?: number;
  retryCount?: number;
  error?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  tenantId: string;
}

export interface HandoverToken {
  token: string;
  tenantId: string;
  conversationId: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

// Tenant-specifieke email templates
export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  'demo-tenant': {
    id: 'bitbreez-handover-template',
    name: 'BitBreez Handover Template',
    subject: 'Handover Request - BitBreez',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2E7D32; color: white; padding: 20px; text-align: center;">
          <h1>BitBreez</h1>
          <h2>Handover Request</h2>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p><strong>Tenant:</strong> {{tenantId}}</p>
          <p><strong>Persona:</strong> {{persona}} ({{tone}})</p>
          <p><strong>Conversation ID:</strong> {{conversationId}}</p>
          <p><strong>Trigger Reason:</strong> {{triggerReason}}</p>
          <p><strong>Confidence Score:</strong> {{confidence}}</p>
          <hr>
          <h3>User Message:</h3>
          <p style="background-color: white; padding: 15px; border-left: 4px solid #2E7D32;">{{userMessage}}</p>
          <h3>Conversation Transcript:</h3>
          <div style="background-color: white; padding: 15px;">
            {{transcript}}
          </div>
          <hr>
          <p><strong>Handover Token:</strong> {{handoverToken}}</p>
          <p><strong>Request Time:</strong> {{timestamp}}</p>
        </div>
        <div style="background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
          BitBreez - AI-Powered Chatbox Solutions
        </div>
      </div>
    `,
    textContent: `
BitBreez - Handover Request

Tenant: {{tenantId}}
Persona: {{persona}} ({{tone}})
Conversation ID: {{conversationId}}
Trigger Reason: {{triggerReason}}
Confidence Score: {{confidence}}

User Message:
{{userMessage}}

Conversation Transcript:
{{transcript}}

Handover Token: {{handoverToken}}
Request Time: {{timestamp}}

BitBreez - AI-Powered Chatbox Solutions
    `,
    tenantId: 'demo-tenant'
  },
  'test-tenant': {
    id: 'bitbreez-handover-template',
    name: 'BitBreez Handover Template',
    subject: 'Handover Request - BitBreez',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2E7D32; color: white; padding: 20px; text-align: center;">
          <h1>BitBreez</h1>
          <h2>Handover Request</h2>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p><strong>Tenant:</strong> {{tenantId}}</p>
          <p><strong>Persona:</strong> {{persona}} ({{tone}})</p>
          <p><strong>Conversation ID:</strong> {{conversationId}}</p>
          <p><strong>Trigger Reason:</strong> {{triggerReason}}</p>
          <p><strong>Confidence Score:</strong> {{confidence}}</p>
          <hr>
          <h3>User Message:</h3>
          <p style="background-color: white; padding: 15px; border-left: 4px solid #2E7D32;">{{userMessage}}</p>
          <h3>Conversation Transcript:</h3>
          <div style="background-color: white; padding: 15px;">
            {{transcript}}
          </div>
          <hr>
          <p><strong>Handover Token:</strong> {{handoverToken}}</p>
          <p><strong>Request Time:</strong> {{timestamp}}</p>
        </div>
        <div style="background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
          BitBreez - AI-Powered Chatbox Solutions
        </div>
      </div>
    `,
    textContent: `
BitBreez - Handover Request

Tenant: {{tenantId}}
Persona: {{persona}} ({{tone}})
Conversation ID: {{conversationId}}
Trigger Reason: {{triggerReason}}
Confidence Score: {{confidence}}

User Message:
{{userMessage}}

Conversation Transcript:
{{transcript}}

Handover Token: {{handoverToken}}
Request Time: {{timestamp}}

BitBreez - AI-Powered Chatbox Solutions
    `,
    tenantId: 'test-tenant'
  }
};

// Handover trigger keywords
export const HANDOVER_KEYWORDS = [
  'mens', 'mensen', 'agent', 'agents', 'klantenservice', 'customer service',
  'bellen', 'telefoon', 'bel', 'spreek', 'spreekt', 'human', 'humans',
  'collega', 'collega\'s', 'medewerker', 'medewerkers', 'persoon', 'personen'
];

// Frustration detection patterns
export const FRUSTRATION_PATTERNS = [
  /(dit|het) werkt niet/i,
  /(ik ben|ben) gefrustreerd/i,
  /(dit is|is) belachelijk/i,
  /waarom werkt (dit|het) niet/i,
  /(ik geef|geef) het op/i,
  /(dit is|is) frustrerend/i,
  /(ik word|word) gek van/i,
  /(dit helpt|helpt) niet/i
];

// Token storage (in production, use Redis or database)
const tokenStorage: Map<string, HandoverToken> = new Map();

// Resend configuration
const RESEND_CONFIG = {
  apiKey: process.env.RESEND_API_KEY || 're_e8dLfswg_9VXTCgYzmDfX9jgN4wdChGyP',
  fromEmail: 'handover@updates.jouwdomein.com',
  retryAttempts: 2,
  retryDelay: 1000 // 1 second base delay
};

// Log Resend configuration status
console.log('📧 Resend Configuration:');
console.log(`  API Key: ${RESEND_CONFIG.apiKey === 're_e8dLfswg_9VXTCgYzmDfX9jgN4wdChGyP' ? '❌ Not configured (using default)' : '✅ Configured'}`);
console.log(`  From Email: ${RESEND_CONFIG.fromEmail}`);
console.log(`  Mode: ${RESEND_CONFIG.apiKey === 're_e8dLfswg_9VXTCgYzmDfX9jgN4wdChGyP' ? 'Development (Default)' : 'Production (Real Resend)'}`);

export class HandoverService {
  private static instance: HandoverService;
  private tokenStorage: Map<string, HandoverToken> = new Map();

  static getInstance(): HandoverService {
    if (!this.instance) {
      this.instance = new HandoverService();
    }
    return this.instance;
  }

  constructor() {
    // Initialize token storage
    this.tokenStorage = tokenStorage;
  }

  async processHandoverRequest(request: HandoverRequest): Promise<HandoverResponse> {
    try {
      // Check if handover should be triggered
      const shouldTrigger = this.shouldTriggerHandover(request);
      
      if (!shouldTrigger.trigger) {
        return {
          success: false,
          handoverStatus: 'failed',
          error: 'Handover not triggered'
        };
      }

      // Generate handover token
      const handoverToken = this.generateHandoverToken(request.tenantId, request.conversationId);

      // Check if off-hours
      const isOffHours = this.isOffHours();
      const queuePosition = isOffHours ? this.getQueuePosition() : undefined;
      const estimatedResponseTime = isOffHours ? this.getEstimatedResponseTime() : 'Binnen 1 uur';

      // Send email
      const emailResult = await this.sendHandoverEmail(request, handoverToken);

      // Log handover event
      await this.logHandoverEvent(request, handoverToken, 'handover_requested');

      return {
        success: true,
        handoverToken,
        handoverStatus: emailResult.success ? 'sent' : 'queued',
        emailSent: emailResult.success,
        confirmationMessage: this.getConfirmationMessage(request, isOffHours),
        queuePosition,
        estimatedResponseTime,
        isOffHours,
        triggerReason: shouldTrigger.reason,
        matchedKeyword: shouldTrigger.matchedKeyword,
        frustrationScore: shouldTrigger.frustrationScore,
        retryCount: emailResult.retryCount
      };

    } catch (error) {
      console.error('Handover processing error:', error);
      return {
        success: false,
        handoverStatus: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private shouldTriggerHandover(request: HandoverRequest): {
    trigger: boolean;
    reason: string;
    matchedKeyword?: string;
    frustrationScore?: number;
  } {
    // Check confidence threshold
    if (request.confidence < 0.7) {
      return { trigger: true, reason: 'low_confidence' };
    }

    // Check for handover keywords
    const matchedKeyword = this.checkHandoverKeywords(request.userMessage);
    if (matchedKeyword) {
      return { trigger: true, reason: 'keyword_match', matchedKeyword };
    }

    // Check for frustration signals
    const frustrationScore = this.detectFrustration(request.userMessage);
    if (frustrationScore > 0.7) {
      return { trigger: true, reason: 'frustration_detected', frustrationScore };
    }

    return { trigger: false, reason: 'none' };
  }

  private checkHandoverKeywords(message: string): string | null {
    const lowerMessage = message.toLowerCase();
    for (const keyword of HANDOVER_KEYWORDS) {
      if (lowerMessage.includes(keyword)) {
        return keyword;
      }
    }
    return null;
  }

  private detectFrustration(message: string): number {
    let frustrationScore = 0;
    for (const pattern of FRUSTRATION_PATTERNS) {
      if (pattern.test(message)) {
        frustrationScore += 0.2;
      }
    }
    return Math.min(frustrationScore, 1.0);
  }

  private generateHandoverToken(tenantId: string, conversationId: string): string {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    this.tokenStorage.set(token, {
      token,
      tenantId,
      conversationId,
      createdAt: new Date(),
      expiresAt,
      used: false
    });

    return token;
  }

  private async sendHandoverEmail(request: HandoverRequest, token: string): Promise<{
    success: boolean;
    retryCount: number;
  }> {
    const template = EMAIL_TEMPLATES[request.tenantId] || EMAIL_TEMPLATES['demo-tenant'];
    
    // Replace template variables
    const htmlContent = this.replaceTemplateVariables(template.htmlContent, request, token);

    // Send email with retry mechanism
    let retryCount = 0;
    const maxRetries = RESEND_CONFIG.retryAttempts;

    while (retryCount <= maxRetries) {
      try {
        const recipientEmail = this.getRecipientEmail(request.tenantId);
        
        const result = await sendEmail({
          to: recipientEmail,
          subject: template.subject,
          html: htmlContent
        });

        console.log('✅ Handover email sent to:', recipientEmail);
        console.log('📧 Resend Response:', result);
        
        return { success: true, retryCount };
      } catch (error) {
        console.error(`Email send attempt ${retryCount + 1} failed:`, error);
      }

      retryCount++;
      if (retryCount <= maxRetries) {
        // Exponential backoff
        const delay = RESEND_CONFIG.retryDelay * Math.pow(2, retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return { success: false, retryCount };
  }



  private getRecipientEmail(tenantId: string): string {
    const emailMap: Record<string, string> = {
      'demo-tenant': process.env.HANDOVER_EMAIL || 'jouw-email@hotmail.com',
      'test-tenant': process.env.HANDOVER_EMAIL || 'jouw-email@hotmail.com'
    };
    
    const recipientEmail = emailMap[tenantId] || process.env.HANDOVER_EMAIL || 'jouw-email@hotmail.com';
    
    // Log recipient email for debugging
    console.log(`Handover email recipient for tenant ${tenantId}: ${recipientEmail}`);
    
    return recipientEmail;
  }

  private getConfirmationMessage(_request: HandoverRequest, isOffHours: boolean): string {
    if (isOffHours) {
      return 'Bedankt voor je bericht. We zijn momenteel buiten kantooruren, maar je vraag is toegevoegd aan onze wachtrij. Je ontvangt binnen 2-4 uur een reactie.';
    }
    return 'Je vraag is doorgestuurd naar een menselijke collega. Je ontvangt binnen 1 uur een reactie via e-mail.';
  }

  private isOffHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Off-hours: weekends or outside 9-17 on weekdays
    return day === 0 || day === 6 || hour < 9 || hour >= 17;
  }

  private getQueuePosition(): number {
    // Mock queue position
    return Math.floor(Math.random() * 10) + 1;
  }

  private getEstimatedResponseTime(): string {
    const hours = Math.floor(Math.random() * 3) + 2; // 2-4 hours
    return `${hours} uur`;
  }

  private replaceTemplateVariables(template: string, request: HandoverRequest, token: string): string {
    return template
      .replace(/\{\{tenantId\}\}/g, request.tenantId)
      .replace(/\{\{persona\}\}/g, request.persona || 'unknown')
      .replace(/\{\{tone\}\}/g, request.tone || 'unknown')
      .replace(/\{\{conversationId\}\}/g, request.conversationId)
      .replace(/\{\{triggerReason\}\}/g, request.triggerReason)
      .replace(/\{\{confidence\}\}/g, request.confidence.toString())
      .replace(/\{\{userMessage\}\}/g, request.userMessage)
      .replace(/\{\{transcript\}\}/g, request.transcript?.join('\n') || 'No transcript available')
      .replace(/\{\{handoverToken\}\}/g, token)
      .replace(/\{\{timestamp\}\}/g, new Date().toISOString());
  }

  private async logHandoverEvent(request: HandoverRequest, token: string, status: string): Promise<void> {
    // Log handover event for observability
    const logEntry = {
      tenantId: request.tenantId,
      conversationId: request.conversationId,
      status,
      timestamp: new Date().toISOString(),
      triggerReason: request.triggerReason,
      confidence: request.confidence,
      handoverToken: token
    };

    console.log('Handover Event Logged:', logEntry);
    
    // In production, this would be sent to logging service
    // await loggingService.log('handover_event', logEntry);
  }

  // Token validation
  validateToken(token: string): { valid: boolean; token?: HandoverToken; error?: string } {
    const storedToken = this.tokenStorage.get(token);
    
    if (!storedToken) {
      return { valid: false, error: 'Token not found' };
    }

    if (storedToken.used) {
      return { valid: false, error: 'Token already used' };
    }

    if (new Date() > storedToken.expiresAt) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, token: storedToken };
  }

  // Mark token as used
  markTokenUsed(token: string): boolean {
    const storedToken = this.tokenStorage.get(token);
    if (storedToken) {
      storedToken.used = true;
      return true;
    }
    return false;
  }

  // Get handover statistics
  getHandoverStats(_tenantId?: string): {
    totalHandovers: number;
    successRate: number;
    averageResponseTime: string;
    offHoursHandovers: number;
  } {
    // Mock statistics
    return {
      totalHandovers: Math.floor(Math.random() * 100) + 50,
      successRate: 0.85 + Math.random() * 0.1, // 85-95%
      averageResponseTime: '1.5 uur',
      offHoursHandovers: Math.floor(Math.random() * 20) + 10
    };
  }
}
