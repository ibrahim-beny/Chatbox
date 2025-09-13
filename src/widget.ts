import { SSEClient, SSEClientConfig } from './widget/sse-client.js';
import { TypingIndicator } from './widget/typing-indicator.js';
import { StreamingMessage } from './widget/streaming-message.js';
import { KnowledgeSearchService } from './widget/knowledge-search.js';

export interface ChatboxConfig {
  tenantId: string;
  primaryColor?: string;
  welcomeMessage?: string;
  backendUrl?: string;
}

export interface ChatboxOptions {
  tenantId: string;
  primaryColor?: string;
  welcomeMessage?: string;
  backendUrl?: string;
}

export class ChatboxWidget {
  private static readonly AUTHORIZED_DOMAINS = [
    'localhost',
    '127.0.0.1',
    'test-site.com',
    'demo-site.com',
    'file'
  ];

  private config: ChatboxConfig;
  private isInitialized: boolean = false;
  private container: HTMLElement | null = null;
  private fab: HTMLElement | null = null;
  private drawer: HTMLElement | null = null;
  private sseClient: SSEClient | null = null;
  private typingIndicator: TypingIndicator | null = null;
  private streamingMessage: StreamingMessage | null = null;
  private knowledgeSearch: KnowledgeSearchService | null = null;

  constructor() {
    this.config = {
      tenantId: 'default-tenant',
      primaryColor: '#0A84FF',
      welcomeMessage: 'Welkom! Hoe kan ik je helpen?',
      backendUrl: 'http://localhost:3000'
    };
  }

  /**
   * Initialize the chatbox widget
   * @param options - Configuration options
   * @returns boolean - Success status
   */
  init(options: ChatboxOptions): boolean {
    try {
      // Check if already initialized
      if (this.isInitialized) {
        console.log('Widget already initialized, destroying and reinitializing...');
        this.destroy();
      }

      // Validate domain authorization
      if (!this.isDomainAuthorized()) {
        console.warn('Domain not authorized for this tenant');
        return false;
      }

      // Validate and merge options
      this.validateAndMergeOptions(options);

      // Create UI elements
      this.createUI();

      // Mark as initialized
      this.isInitialized = true;

      console.log('Widget initialized with config:', this.config);

      return true;
    } catch (error) {
      console.error('Failed to initialize chatbox:', error);
      return false;
    }
  }

  /**
   * Check if current domain is authorized for the tenant
   */
  private isDomainAuthorized(): boolean {
    const currentDomain = window.location.hostname;
    const currentProtocol = window.location.protocol;
    
    // Allow file:// protocol for development/testing
    if (currentProtocol === 'file:') {
      return true;
    }
    
    // Check against authorized domains
    return ChatboxWidget.AUTHORIZED_DOMAINS.includes(currentDomain);
  }

  /**
   * Validate and merge options with safe defaults
   */
  private validateAndMergeOptions(options: ChatboxOptions): void {
    if (!options.tenantId || typeof options.tenantId !== 'string') {
      console.warn('Invalid options, falling back to defaults');
      return;
    }

    // Update config with valid options
    this.config.tenantId = options.tenantId;
    
    // Validate and set primaryColor if provided
    if (options.primaryColor && this.isValidColor(options.primaryColor)) {
      this.config.primaryColor = options.primaryColor;
    }

    // Validate and set welcomeMessage if provided
    if (options.welcomeMessage && typeof options.welcomeMessage === 'string') {
      this.config.welcomeMessage = options.welcomeMessage;
    }

    // Validate and set backendUrl if provided
    if (options.backendUrl && typeof options.backendUrl === 'string') {
      this.config.backendUrl = options.backendUrl;
    }
  }

  /**
   * Validate color format
   */
  private isValidColor(color: string): boolean {
    const s = new Option().style;
    s.color = color;
    return s.color !== '';
  }

  /**
   * Create the UI elements (FAB and Drawer)
   */
  private createUI(): void {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'chatbox-widget';
    this.container.className = 'chatbox-widget';
    
    // Create FAB (Floating Action Button)
    this.fab = this.createFAB();
    
    // Create Drawer
    this.drawer = this.createDrawer();
    
    // Append to container
    this.container.appendChild(this.fab);
    this.container.appendChild(this.drawer);
    
    // Append to body
    document.body.appendChild(this.container);
    
    // Add event listeners
    this.addEventListeners();
    
    // Initialize SSE components
    this.initializeSSEComponents();
    
    // Add styles
    this.addStyles();
  }

  /**
   * Create the Floating Action Button
   */
  private createFAB(): HTMLElement {
    const fab = document.createElement('button');
    fab.className = 'chatbox-fab';
    fab.setAttribute('aria-label', 'Open chat');
    fab.setAttribute('role', 'button');
    fab.setAttribute('tabindex', '0');
    
    const icon = document.createElement('span');
    icon.className = 'chatbox-fab-icon';
    icon.textContent = '💬';
    
    fab.appendChild(icon);
    return fab;
  }

  /**
   * Initialize SSE components
   */
  private initializeSSEComponents(): void {
    // Create SSE client
    const sseConfig: SSEClientConfig = {
      baseUrl: this.config.backendUrl || 'http://localhost:3000',
      tenantId: this.config.tenantId,
      maxRetries: 2,
      baseDelay: 1000,
      maxDelay: 5000,
      jitter: true
    };
    this.sseClient = new SSEClient(sseConfig);

    // Create typing indicator
    this.typingIndicator = new TypingIndicator();
    
    // Create knowledge search service - MVP-004
    this.knowledgeSearch = new KnowledgeSearchService(
      this.config.backendUrl || 'http://localhost:3000',
      this.config.tenantId
    );
    
    // Add typing indicator to messages container
    const messagesContainer = this.drawer?.querySelector('.chatbox-messages');
    if (messagesContainer && this.typingIndicator) {
      messagesContainer.appendChild(this.typingIndicator.getElement());
    }
  }

  /**
   * Create the chat drawer
   */
  private createDrawer(): HTMLElement {
    const drawer = document.createElement('div');
    drawer.className = 'chatbox-drawer';
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Chat window');
    
    const header = document.createElement('div');
    header.className = 'chatbox-drawer-header';
    
    const title = document.createElement('h3');
    title.textContent = 'Chat';
    title.className = 'chatbox-drawer-title';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'chatbox-drawer-close';
    closeButton.setAttribute('aria-label', 'Close chat');
    closeButton.textContent = '×';
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    // Chat messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'chatbox-messages';
    messagesContainer.setAttribute('role', 'log');
    messagesContainer.setAttribute('aria-live', 'polite');
    
    // Welcome message
    const welcomeMessage = this.createMessage('assistant', this.config.welcomeMessage || 'Welkom! Hoe kan ik je helpen?');
    messagesContainer.appendChild(welcomeMessage);
    
    // Chat input area
    const inputArea = this.createChatInput();
    
    drawer.appendChild(header);
    drawer.appendChild(messagesContainer);
    drawer.appendChild(inputArea);
    
    return drawer;
  }

  /**
   * Add event listeners
   */
  private addEventListeners(): void {
    if (!this.fab || !this.drawer) return;

    // FAB click to open drawer
    this.fab.addEventListener('click', () => {
      this.openDrawer();
    });

    // FAB keyboard support
    this.fab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.openDrawer();
      }
    });

    // Close button
    const closeButton = this.drawer.querySelector('.chatbox-drawer-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.closeDrawer();
      });
    }

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isDrawerOpen()) {
        this.closeDrawer();
      }
    });

    // Chat input events
    this.addChatInputListeners();
  }

  /**
   * Add chat input event listeners
   */
  private addChatInputListeners(): void {
    const textarea = this.drawer?.querySelector('.chatbox-input') as HTMLTextAreaElement;
    const sendButton = this.drawer?.querySelector('.chatbox-send-button') as HTMLButtonElement;
    const messagesContainer = this.drawer?.querySelector('.chatbox-messages') as HTMLElement;

    if (!textarea || !sendButton || !messagesContainer) return;

    // Auto-resize textarea
    textarea.addEventListener('input', () => {
      this.autoResizeTextarea(textarea);
      sendButton.disabled = !textarea.value.trim();
    });

    // Send message on Enter (Shift+Enter for new line)
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Send button click
    sendButton.addEventListener('click', () => {
      this.sendMessage();
    });

    // Focus management
    textarea.addEventListener('focus', () => {
      textarea.setAttribute('aria-expanded', 'true');
    });

    textarea.addEventListener('blur', () => {
      textarea.setAttribute('aria-expanded', 'false');
    });
  }

  /**
   * Open the chat drawer
   */
  private openDrawer(): void {
    if (!this.drawer || !this.fab) return;
    
    this.drawer.setAttribute('aria-hidden', 'false');
    this.drawer.classList.add('chatbox-drawer-open');
    this.fab.classList.add('chatbox-fab-active');
    
    // Focus management
    const closeButton = this.drawer.querySelector('.chatbox-drawer-close') as HTMLElement;
    if (closeButton) {
      closeButton.focus();
    }
  }

  /**
   * Close the chat drawer
   */
  private closeDrawer(): void {
    if (!this.drawer || !this.fab) return;
    
    this.drawer.setAttribute('aria-hidden', 'true');
    this.drawer.classList.remove('chatbox-drawer-open');
    this.fab.classList.remove('chatbox-fab-active');
    
    // Restore focus to FAB
    if (this.fab) {
      this.fab.focus();
    }
  }

  /**
   * Check if drawer is open
   */
  private isDrawerOpen(): boolean {
    return this.drawer?.classList.contains('chatbox-drawer-open') || false;
  }

  /**
   * Create a chat message element
   */
  private createMessage(sender: 'user' | 'assistant', text: string): HTMLElement {
    const message = document.createElement('div');
    message.className = `chatbox-message chatbox-message-${sender}`;
    message.setAttribute('role', 'listitem');
    
    const content = document.createElement('div');
    content.className = 'chatbox-message-content';
    content.textContent = text;
    
    const timestamp = document.createElement('div');
    timestamp.className = 'chatbox-message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    message.appendChild(content);
    message.appendChild(timestamp);
    
    return message;
  }

  /**
   * Create the chat input area
   */
  private createChatInput(): HTMLElement {
    const inputArea = document.createElement('div');
    inputArea.className = 'chatbox-input-area';
    
    const inputContainer = document.createElement('div');
    inputContainer.className = 'chatbox-input-container';
    
    const textarea = document.createElement('textarea');
    textarea.className = 'chatbox-input';
    textarea.setAttribute('placeholder', 'Type je bericht...');
    textarea.setAttribute('aria-label', 'Chat bericht');
    textarea.setAttribute('rows', '1');
    textarea.setAttribute('maxlength', '1000');
    
    const sendButton = document.createElement('button');
    sendButton.className = 'chatbox-send-button';
    sendButton.setAttribute('aria-label', 'Verstuur bericht');
    sendButton.innerHTML = '📤';
    sendButton.disabled = true;
    
    inputContainer.appendChild(textarea);
    inputContainer.appendChild(sendButton);
    inputArea.appendChild(inputContainer);
    
    return inputArea;
  }

  /**
   * Auto-resize textarea based on content
   */
  private autoResizeTextarea(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  /**
   * Send a message
   */
  private async sendMessage(): Promise<void> {
    const textarea = this.drawer?.querySelector('.chatbox-input') as HTMLTextAreaElement;
    const sendButton = this.drawer?.querySelector('.chatbox-send-button') as HTMLButtonElement;
    const messagesContainer = this.drawer?.querySelector('.chatbox-messages') as HTMLElement;

    if (!textarea || !sendButton || !messagesContainer || !this.sseClient) return;

    const message = textarea.value.trim();
    if (!message) return;

    // Add user message
    const userMessage = this.createMessage('user', message);
    messagesContainer.appendChild(userMessage);

    // Clear input and reset
    textarea.value = '';
    textarea.style.height = 'auto';
    sendButton.disabled = true;

    // Scroll to bottom
    this.scrollToBottom(messagesContainer);

    // Search knowledge base if relevant - MVP-004
    let knowledgeContext = '';
    if (this.knowledgeSearch && this.knowledgeSearch.shouldSearchKnowledge(message)) {
      try {
        const knowledgeResults = await this.knowledgeSearch.search(message, 3);
        if (knowledgeResults.length > 0) {
          knowledgeContext = this.knowledgeSearch.formatKnowledgeResults(knowledgeResults);
        }
      } catch (error) {
        console.warn('Knowledge search failed:', error);
      }
    }

    // Create streaming message
    this.streamingMessage = new StreamingMessage();
    messagesContainer.appendChild(this.streamingMessage.getElement());
    this.streamingMessage.startStreaming();

    // Connect to SSE and stream response with knowledge context
    const conversationId = `c-${Date.now()}`;
    const enhancedMessage = knowledgeContext ? `${message}${knowledgeContext}` : message;
    
    this.sseClient.connect(
      conversationId,
      enhancedMessage,
      (event) => this.handleSSEEvent(event),
      (error) => this.handleSSEError(error)
    );

    // Focus back to input
    textarea.focus();
  }

  /**
   * Handle SSE events
   */
  private handleSSEEvent(event: any): void {
    const messagesContainer = this.drawer?.querySelector('.chatbox-messages') as HTMLElement;
    if (!messagesContainer) return;

    switch (event.type) {
      case 'persona':
        // Handle persona metadata - MVP-006
        this.handlePersonaEvent(event);
        break;

      case 'typing':
        if (this.typingIndicator) {
          this.typingIndicator.show(event.message || 'Assistant is typing...');
        }
        break;

      case 'content':
        if (this.streamingMessage) {
          this.streamingMessage.updateText(event.token || '');
          this.scrollToBottom(messagesContainer);
        }
        break;

      case 'done':
        if (this.typingIndicator) {
          this.typingIndicator.hide();
        }
        if (this.streamingMessage) {
          this.streamingMessage.finishStreaming();
          this.scrollToBottom(messagesContainer);
        }
        this.enableInput();
        break;

      case 'error':
        this.handleSSEError(new Error(event.message || 'Unknown error'));
        break;
    }
  }

  /**
   * Handle persona events - MVP-006
   */
  private handlePersonaEvent(event: any): void {
    // Store persona information for potential use
    if (event.persona) {
      console.log(`Persona: ${event.persona} (${event.tone})`);
      
      // Update welcome message based on persona if needed
      if (event.templateVersion) {
        console.log(`Template version: ${event.templateVersion}`);
      }
      
      // Handle safety filter
      if (event.safetyFilter) {
        console.log('Safety filter activated');
        if (event.redirectTo) {
          console.log(`Redirect to: ${event.redirectTo}`);
        }
      }
    }
  }

  /**
   * Handle SSE errors
   */
  private handleSSEError(error: Error): void {
    console.error('SSE Error:', error);
    
    // Hide typing indicator
    if (this.typingIndicator) {
      this.typingIndicator.hide();
    }

    // Show error message
    const messagesContainer = this.drawer?.querySelector('.chatbox-messages') as HTMLElement;
    if (messagesContainer) {
      const errorMessage = this.createMessage('assistant', `Sorry, er is een fout opgetreden: ${error.message}`);
      messagesContainer.appendChild(errorMessage);
      this.scrollToBottom(messagesContainer);
    }

    this.enableInput();
  }

  /**
   * Enable input after message processing
   */
  private enableInput(): void {
    const textarea = this.drawer?.querySelector('.chatbox-input') as HTMLTextAreaElement;
    const sendButton = this.drawer?.querySelector('.chatbox-send-button') as HTMLButtonElement;
    
    if (textarea) {
      textarea.disabled = false;
      textarea.focus();
    }
    if (sendButton) {
      sendButton.disabled = false;
    }
  }

  /**
   * Scroll messages container to bottom
   */
  private scrollToBottom(container: HTMLElement): void {
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Add CSS styles
   */
  private addStyles(): void {
    if (document.getElementById('chatbox-styles')) return;

    const style = document.createElement('style');
    style.id = 'chatbox-styles';
    style.textContent = this.getCSS();
    document.head.appendChild(style);
  }

  /**
   * Get CSS styles
   */
  private getCSS(): string {
    return `
      .chatbox-widget {
        position: fixed;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .chatbox-fab {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${this.config.primaryColor};
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
      }

      .chatbox-fab:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }

      .chatbox-fab:focus {
        outline: 2px solid ${this.config.primaryColor};
        outline-offset: 2px;
      }

      .chatbox-fab-icon {
        pointer-events: none;
      }

      .chatbox-drawer {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        transform: translateY(100%) scale(0.8);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .chatbox-drawer-open {
        transform: translateY(0) scale(1);
        opacity: 1;
      }

      .chatbox-drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
      }

      .chatbox-drawer-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }

      .chatbox-drawer-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
        padding: 4px;
        border-radius: 4px;
        transition: color 0.2s ease;
      }

      .chatbox-drawer-close:hover {
        color: #374151;
      }

      .chatbox-drawer-close:focus {
        outline: 2px solid ${this.config.primaryColor};
        outline-offset: 2px;
      }

             .chatbox-messages {
         flex: 1;
         padding: 20px;
         overflow-y: auto;
         display: flex;
         flex-direction: column;
         gap: 12px;
         max-height: 400px;
       }

       .chatbox-message {
         display: flex;
         flex-direction: column;
         max-width: 80%;
         padding: 12px 16px;
         border-radius: 18px;
         position: relative;
       }

       .chatbox-message-user {
         align-self: flex-end;
         background-color: ${this.config.primaryColor};
         color: white;
         border-bottom-right-radius: 4px;
       }

       .chatbox-message-assistant {
         align-self: flex-start;
         background-color: #f3f4f6;
         color: #374151;
         border-bottom-left-radius: 4px;
       }

       .chatbox-message-content {
         font-size: 14px;
         line-height: 1.4;
         word-wrap: break-word;
       }

       .chatbox-message-timestamp {
         font-size: 11px;
         opacity: 0.7;
         margin-top: 4px;
         text-align: right;
       }

       .chatbox-message-user .chatbox-message-timestamp {
         text-align: right;
       }

       .chatbox-message-assistant .chatbox-message-timestamp {
         text-align: left;
       }

       .chatbox-input-area {
         padding: 16px 20px;
         border-top: 1px solid #e5e7eb;
         background: white;
       }

       .chatbox-input-container {
         display: flex;
         align-items: flex-end;
         gap: 8px;
         background: #f9fafb;
         border: 1px solid #d1d5db;
         border-radius: 24px;
         padding: 8px 12px;
         transition: border-color 0.2s ease;
       }

       .chatbox-input-container:focus-within {
         border-color: ${this.config.primaryColor};
         box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.1);
       }

       .chatbox-input {
         flex: 1;
         border: none;
         background: transparent;
         resize: none;
         outline: none;
         font-size: 14px;
         line-height: 1.4;
         max-height: 120px;
         min-height: 20px;
         font-family: inherit;
       }

       .chatbox-input::placeholder {
         color: #9ca3af;
       }

       .chatbox-send-button {
         background: ${this.config.primaryColor};
         color: white;
         border: none;
         border-radius: 50%;
         width: 32px;
         height: 32px;
         display: flex;
         align-items: center;
         justify-content: center;
         cursor: pointer;
         transition: all 0.2s ease;
         font-size: 14px;
         flex-shrink: 0;
       }

       .chatbox-send-button:hover:not(:disabled) {
         transform: scale(1.05);
         background: ${this.config.primaryColor}dd;
       }

       .chatbox-send-button:disabled {
         background: #d1d5db;
         cursor: not-allowed;
         transform: none;
       }

       .chatbox-send-button:focus {
         outline: 2px solid ${this.config.primaryColor};
         outline-offset: 2px;
       }

       .chatbox-typing-indicator {
         display: none;
         align-items: center;
         padding: 12px 16px;
         background-color: #f3f4f6;
         border-radius: 18px;
         border-bottom-left-radius: 4px;
         max-width: 80%;
         margin-bottom: 12px;
       }

       .typing-content {
         display: flex;
         align-items: center;
         gap: 8px;
       }

       .typing-text {
         font-size: 14px;
         color: #6b7280;
         font-style: italic;
       }

       .typing-dots {
         display: flex;
         gap: 4px;
       }

       .typing-dots .dot {
         width: 6px;
         height: 6px;
         background-color: #9ca3af;
         border-radius: 50%;
         animation: typing-dot 1.4s infinite ease-in-out;
       }

       @keyframes typing-dot {
         0%, 80%, 100% {
           transform: scale(0.8);
           opacity: 0.5;
         }
         40% {
           transform: scale(1);
           opacity: 1;
         }
       }

       .chatbox-streaming-message {
         position: relative;
       }

       .streaming-cursor {
         display: inline;
         color: ${this.config.primaryColor};
         font-weight: bold;
         animation: streaming-cursor 1s infinite;
       }

       @keyframes streaming-cursor {
         0%, 50% {
           opacity: 1;
         }
         51%, 100% {
           opacity: 0;
         }
       }

             @media (max-width: 768px) {
         .chatbox-drawer {
           width: calc(100vw - 40px);
           height: calc(100vh - 120px);
           bottom: 90px;
           right: 20px;
           left: 20px;
         }

         .chatbox-messages {
           max-height: calc(100vh - 200px);
           padding: 16px;
         }

         .chatbox-message {
           max-width: 90%;
         }

         .chatbox-input-area {
           padding: 12px 16px;
         }

         .chatbox-input-container {
           padding: 6px 10px;
         }
       }
    `;
  }

  /**
   * Get current configuration
   */
  getConfig(): ChatboxConfig {
    return { ...this.config };
  }

  /**
   * Check if widget is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Destroy the widget
   */
  destroy(): void {
    // Disconnect SSE client
    if (this.sseClient) {
      this.sseClient.disconnect();
      this.sseClient = null;
    }

    // Remove container
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    
    this.isInitialized = false;
  }
}

// Global initialization function
declare global {
  interface Window {
    Chatbox: {
      init: (options: ChatboxOptions) => boolean;
    };
    ChatboxWidget: typeof ChatboxWidget;
  }
}

// Expose global Chatbox object
window.Chatbox = {
  init: (options: ChatboxOptions) => {
    const widget = new ChatboxWidget();
    return widget.init(options);
  }
};

// Expose ChatboxWidget class globally
window.ChatboxWidget = ChatboxWidget;

export default ChatboxWidget;
