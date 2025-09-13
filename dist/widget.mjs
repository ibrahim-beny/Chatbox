var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class SSEClient {
  constructor(config) {
    __publicField(this, "config");
    __publicField(this, "eventSource", null);
    __publicField(this, "retryCount", 0);
    __publicField(this, "isConnected", false);
    this.config = config;
  }
  async connect(conversationId, message, onEvent, onError) {
    try {
      this.isConnected = true;
      this.retryCount = 0;
      onEvent({
        type: "typing",
        message: "Assistant is typing..."
      });
      const url = `${this.config.baseUrl}/api/ai/query`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": this.config.tenantId
        },
        body: JSON.stringify({
          tenantId: this.config.tenantId,
          conversationId,
          message
        })
      });
      if (!response.ok) {
        if (response.status === 429) {
          const errorData = await response.json();
          throw new Error(`Rate limit exceeded. Retry after ${errorData.retryAfter} seconds.`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      await this.handleSSEStream(response, onEvent);
    } catch (error) {
      this.isConnected = false;
      if (this.retryCount < this.config.maxRetries) {
        await this.retryWithBackoff(conversationId, message, onEvent, onError);
      } else {
        onError?.(error);
      }
    }
  }
  async handleSSEStream(response, onEvent) {
    if (!response.body) {
      throw new Error("No response body");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              onEvent(data);
            } catch (e) {
              console.warn("Invalid SSE data:", line.slice(6));
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  async retryWithBackoff(conversationId, message, onEvent, onError) {
    this.retryCount++;
    const delay = this.calculateRetryDelay();
    onEvent({
      type: "typing",
      message: `Retrying... (${this.retryCount}/${this.config.maxRetries})`
    });
    await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      await this.connect(conversationId, message, onEvent, onError);
    } catch (error) {
      if (this.retryCount >= this.config.maxRetries) {
        onError?.(error);
      }
    }
  }
  calculateRetryDelay() {
    const delay = Math.min(
      this.config.baseDelay * Math.pow(2, this.retryCount - 1),
      this.config.maxDelay
    );
    return this.config.jitter ? delay + Math.random() * 1e3 : delay;
  }
  disconnect() {
    this.isConnected = false;
    this.eventSource?.close();
    this.eventSource = null;
  }
  isConnecting() {
    return this.isConnected;
  }
}
class TypingIndicator {
  constructor() {
    __publicField(this, "element");
    __publicField(this, "isVisible", false);
    this.element = this.createElement();
  }
  createElement() {
    const element = document.createElement("div");
    element.className = "chatbox-typing-indicator";
    element.setAttribute("aria-live", "polite");
    element.setAttribute("aria-label", "Assistant is typing");
    element.setAttribute("role", "status");
    element.style.display = "none";
    element.innerHTML = `
      <div class="typing-content">
        <span class="typing-text">Assistant is typing</span>
        <div class="typing-dots" aria-hidden="true">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    `;
    return element;
  }
  show(message = "Assistant is typing") {
    if (this.isVisible) return;
    this.isVisible = true;
    this.element.style.display = "flex";
    const textElement = this.element.querySelector(".typing-text");
    if (textElement) {
      textElement.textContent = message;
    }
    this.startAnimation();
  }
  hide() {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.element.style.display = "none";
    this.stopAnimation();
  }
  startAnimation() {
    const dots = this.element.querySelectorAll(".dot");
    dots.forEach((dot, index) => {
      dot.style.animation = `typing-dot 1.4s infinite ease-in-out ${index * 0.16}s`;
    });
  }
  stopAnimation() {
    const dots = this.element.querySelectorAll(".dot");
    dots.forEach((dot) => {
      dot.style.animation = "none";
    });
  }
  getElement() {
    return this.element;
  }
  isShowing() {
    return this.isVisible;
  }
}
class StreamingMessage {
  constructor() {
    __publicField(this, "element");
    __publicField(this, "contentElement");
    __publicField(this, "cursorElement");
    __publicField(this, "currentText", "");
    __publicField(this, "isStreaming", false);
    this.element = this.createElement();
    this.contentElement = this.element.querySelector(".chatbox-message-content");
    this.cursorElement = this.element.querySelector(".streaming-cursor");
  }
  createElement() {
    const element = document.createElement("div");
    element.className = "chatbox-message chatbox-message-assistant chatbox-streaming-message";
    element.setAttribute("role", "listitem");
    element.innerHTML = `
      <div class="chatbox-message-content"></div>
      <div class="streaming-cursor">|</div>
      <div class="chatbox-message-timestamp"></div>
    `;
    return element;
  }
  startStreaming() {
    this.isStreaming = true;
    this.currentText = "";
    this.contentElement.textContent = "";
    this.cursorElement.style.display = "inline";
    this.startCursorAnimation();
  }
  updateText(newText) {
    if (!this.isStreaming) return;
    this.currentText = newText;
    this.contentElement.textContent = newText;
  }
  finishStreaming() {
    this.isStreaming = false;
    this.cursorElement.style.display = "none";
    this.stopCursorAnimation();
    this.updateTimestamp();
  }
  startCursorAnimation() {
    this.cursorElement.style.animation = "streaming-cursor 1s infinite";
  }
  stopCursorAnimation() {
    this.cursorElement.style.animation = "none";
  }
  updateTimestamp() {
    const timestampElement = this.element.querySelector(".chatbox-message-timestamp");
    if (timestampElement) {
      timestampElement.textContent = (/* @__PURE__ */ new Date()).toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  }
  getElement() {
    return this.element;
  }
  getCurrentText() {
    return this.currentText;
  }
  isCurrentlyStreaming() {
    return this.isStreaming;
  }
}
class KnowledgeSearchService {
  constructor(backendUrl, tenantId) {
    __publicField(this, "backendUrl");
    __publicField(this, "tenantId");
    this.backendUrl = backendUrl;
    this.tenantId = tenantId;
  }
  /**
   * Search knowledge base for relevant information
   */
  async search(query, limit = 3) {
    try {
      const url = new URL(`${this.backendUrl}/api/knowledge/search`);
      url.searchParams.set("q", query);
      url.searchParams.set("limit", limit.toString());
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "X-Tenant-ID": this.tenantId,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        console.warn("Knowledge search failed:", response.status, response.statusText);
        return [];
      }
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.warn("Knowledge search error:", error);
      return [];
    }
  }
  /**
   * Format knowledge results for display in chat
   */
  formatKnowledgeResults(results) {
    if (results.length === 0) {
      return "";
    }
    let formatted = "\n\n📚 **Relevante informatie:**\n";
    results.forEach((result, index) => {
      const source = this.getSourceDisplayName(result.document);
      formatted += `
${index + 1}. ${result.snippet}
   *Bron: ${source}*
`;
    });
    return formatted;
  }
  /**
   * Get display name for document source
   */
  getSourceDisplayName(document2) {
    switch (document2.type) {
      case "pdf":
        return `📄 ${document2.title}`;
      case "faq":
        return `❓ ${document2.title}`;
      case "manual":
        return `📖 ${document2.title}`;
      default:
        return document2.title;
    }
  }
  /**
   * Extract key terms from user query for better search
   */
  extractKeyTerms(query) {
    const stopWords = ["hoe", "wat", "waar", "wanneer", "waarom", "wie", "kan", "kun", "kunnen", "is", "zijn", "hebben", "heeft", "heb", "ben", "bent", "wordt", "worden", "zal", "zullen", "moet", "moeten", "mag", "mogen", "wil", "willen", "de", "het", "een", "van", "in", "op", "voor", "met", "aan", "door", "over", "onder", "tussen", "na", "voor", "tijdens", "om", "te", "en", "of", "maar", "dus", "omdat", "als", "dan", "ook", "nog", "al", "wel", "niet", "geen", "alle", "alleen", "allemaal", "alles", "iemand", "niemand", "iets", "niets", "ergens", "nergens", "altijd", "nooit", "soms", "vaak", "meestal", "zelden", "weinig", "veel", "meer", "meest", "minst", "beter", "best", "slechter", "slechtst"];
    return query.toLowerCase().split(/\s+/).filter((word) => word.length > 2 && !stopWords.includes(word)).slice(0, 5);
  }
  /**
   * Check if query might benefit from knowledge search
   */
  shouldSearchKnowledge(query) {
    const keyTerms = this.extractKeyTerms(query);
    if (keyTerms.length === 0) return false;
    const greetings = ["hallo", "hi", "hey", "goedemorgen", "goedemiddag", "goedenavond", "bedankt", "dankje", "dankjewel"];
    if (greetings.some((greeting) => query.toLowerCase().includes(greeting)) && keyTerms.length <= 1) {
      return false;
    }
    return true;
  }
}
const _ChatboxWidget = class _ChatboxWidget {
  constructor() {
    __publicField(this, "config");
    __publicField(this, "isInitialized", false);
    __publicField(this, "container", null);
    __publicField(this, "fab", null);
    __publicField(this, "drawer", null);
    __publicField(this, "sseClient", null);
    __publicField(this, "typingIndicator", null);
    __publicField(this, "streamingMessage", null);
    __publicField(this, "knowledgeSearch", null);
    this.config = {
      tenantId: "default-tenant",
      primaryColor: "#0A84FF",
      welcomeMessage: "Welkom! Hoe kan ik je helpen?",
      backendUrl: "http://localhost:3000"
    };
  }
  /**
   * Initialize the chatbox widget
   * @param options - Configuration options
   * @returns boolean - Success status
   */
  init(options) {
    try {
      if (this.isInitialized) {
        console.log("Widget already initialized, destroying and reinitializing...");
        this.destroy();
      }
      if (!this.isDomainAuthorized()) {
        console.warn("Domain not authorized for this tenant");
        return false;
      }
      this.validateAndMergeOptions(options);
      this.createUI();
      this.isInitialized = true;
      console.log("Widget initialized with config:", this.config);
      return true;
    } catch (error) {
      console.error("Failed to initialize chatbox:", error);
      return false;
    }
  }
  /**
   * Check if current domain is authorized for the tenant
   */
  isDomainAuthorized() {
    const currentDomain = window.location.hostname;
    const currentProtocol = window.location.protocol;
    if (currentProtocol === "file:") {
      return true;
    }
    return _ChatboxWidget.AUTHORIZED_DOMAINS.includes(currentDomain);
  }
  /**
   * Validate and merge options with safe defaults
   */
  validateAndMergeOptions(options) {
    if (!options.tenantId || typeof options.tenantId !== "string") {
      console.warn("Invalid options, falling back to defaults");
      return;
    }
    this.config.tenantId = options.tenantId;
    if (options.primaryColor && this.isValidColor(options.primaryColor)) {
      this.config.primaryColor = options.primaryColor;
    }
    if (options.welcomeMessage && typeof options.welcomeMessage === "string") {
      this.config.welcomeMessage = options.welcomeMessage;
    }
    if (options.backendUrl && typeof options.backendUrl === "string") {
      this.config.backendUrl = options.backendUrl;
    }
  }
  /**
   * Validate color format
   */
  isValidColor(color) {
    const s = new Option().style;
    s.color = color;
    return s.color !== "";
  }
  /**
   * Create the UI elements (FAB and Drawer)
   */
  createUI() {
    this.container = document.createElement("div");
    this.container.id = "chatbox-widget";
    this.container.className = "chatbox-widget";
    this.fab = this.createFAB();
    this.drawer = this.createDrawer();
    this.container.appendChild(this.fab);
    this.container.appendChild(this.drawer);
    document.body.appendChild(this.container);
    this.addEventListeners();
    this.initializeSSEComponents();
    this.addStyles();
  }
  /**
   * Create the Floating Action Button
   */
  createFAB() {
    const fab = document.createElement("button");
    fab.className = "chatbox-fab";
    fab.setAttribute("aria-label", "Open chat");
    fab.setAttribute("role", "button");
    fab.setAttribute("tabindex", "0");
    const icon = document.createElement("span");
    icon.className = "chatbox-fab-icon";
    icon.textContent = "💬";
    fab.appendChild(icon);
    return fab;
  }
  /**
   * Initialize SSE components
   */
  initializeSSEComponents() {
    const sseConfig = {
      baseUrl: this.config.backendUrl || "http://localhost:3000",
      tenantId: this.config.tenantId,
      maxRetries: 2,
      baseDelay: 1e3,
      maxDelay: 5e3,
      jitter: true
    };
    this.sseClient = new SSEClient(sseConfig);
    this.typingIndicator = new TypingIndicator();
    this.knowledgeSearch = new KnowledgeSearchService(
      this.config.backendUrl || "http://localhost:3000",
      this.config.tenantId
    );
    const messagesContainer = this.drawer?.querySelector(".chatbox-messages");
    if (messagesContainer && this.typingIndicator) {
      messagesContainer.appendChild(this.typingIndicator.getElement());
    }
  }
  /**
   * Create the chat drawer
   */
  createDrawer() {
    const drawer = document.createElement("div");
    drawer.className = "chatbox-drawer";
    drawer.setAttribute("aria-hidden", "true");
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-label", "Chat window");
    const header = document.createElement("div");
    header.className = "chatbox-drawer-header";
    const title = document.createElement("h3");
    title.textContent = "Chat";
    title.className = "chatbox-drawer-title";
    const closeButton = document.createElement("button");
    closeButton.className = "chatbox-drawer-close";
    closeButton.setAttribute("aria-label", "Close chat");
    closeButton.textContent = "×";
    header.appendChild(title);
    header.appendChild(closeButton);
    const messagesContainer = document.createElement("div");
    messagesContainer.className = "chatbox-messages";
    messagesContainer.setAttribute("role", "log");
    messagesContainer.setAttribute("aria-live", "polite");
    const welcomeMessage = this.createMessage("assistant", this.config.welcomeMessage || "Welkom! Hoe kan ik je helpen?");
    messagesContainer.appendChild(welcomeMessage);
    const inputArea = this.createChatInput();
    drawer.appendChild(header);
    drawer.appendChild(messagesContainer);
    drawer.appendChild(inputArea);
    return drawer;
  }
  /**
   * Add event listeners
   */
  addEventListeners() {
    if (!this.fab || !this.drawer) return;
    this.fab.addEventListener("click", () => {
      this.openDrawer();
    });
    this.fab.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.openDrawer();
      }
    });
    const closeButton = this.drawer.querySelector(".chatbox-drawer-close");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        this.closeDrawer();
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isDrawerOpen()) {
        this.closeDrawer();
      }
    });
    this.addChatInputListeners();
  }
  /**
   * Add chat input event listeners
   */
  addChatInputListeners() {
    const textarea = this.drawer?.querySelector(".chatbox-input");
    const sendButton = this.drawer?.querySelector(".chatbox-send-button");
    const messagesContainer = this.drawer?.querySelector(".chatbox-messages");
    if (!textarea || !sendButton || !messagesContainer) return;
    textarea.addEventListener("input", () => {
      this.autoResizeTextarea(textarea);
      sendButton.disabled = !textarea.value.trim();
    });
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    sendButton.addEventListener("click", () => {
      this.sendMessage();
    });
    textarea.addEventListener("focus", () => {
      textarea.setAttribute("aria-expanded", "true");
    });
    textarea.addEventListener("blur", () => {
      textarea.setAttribute("aria-expanded", "false");
    });
  }
  /**
   * Open the chat drawer
   */
  openDrawer() {
    if (!this.drawer || !this.fab) return;
    this.drawer.setAttribute("aria-hidden", "false");
    this.drawer.classList.add("chatbox-drawer-open");
    this.fab.classList.add("chatbox-fab-active");
    const closeButton = this.drawer.querySelector(".chatbox-drawer-close");
    if (closeButton) {
      closeButton.focus();
    }
  }
  /**
   * Close the chat drawer
   */
  closeDrawer() {
    if (!this.drawer || !this.fab) return;
    this.drawer.setAttribute("aria-hidden", "true");
    this.drawer.classList.remove("chatbox-drawer-open");
    this.fab.classList.remove("chatbox-fab-active");
    if (this.fab) {
      this.fab.focus();
    }
  }
  /**
   * Check if drawer is open
   */
  isDrawerOpen() {
    return this.drawer?.classList.contains("chatbox-drawer-open") || false;
  }
  /**
   * Create a chat message element
   */
  createMessage(sender, text) {
    const message = document.createElement("div");
    message.className = `chatbox-message chatbox-message-${sender}`;
    message.setAttribute("role", "listitem");
    const content = document.createElement("div");
    content.className = "chatbox-message-content";
    content.textContent = text;
    const timestamp = document.createElement("div");
    timestamp.className = "chatbox-message-timestamp";
    timestamp.textContent = (/* @__PURE__ */ new Date()).toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit"
    });
    message.appendChild(content);
    message.appendChild(timestamp);
    return message;
  }
  /**
   * Create the chat input area
   */
  createChatInput() {
    const inputArea = document.createElement("div");
    inputArea.className = "chatbox-input-area";
    const inputContainer = document.createElement("div");
    inputContainer.className = "chatbox-input-container";
    const textarea = document.createElement("textarea");
    textarea.className = "chatbox-input";
    textarea.setAttribute("placeholder", "Type je bericht...");
    textarea.setAttribute("aria-label", "Chat bericht");
    textarea.setAttribute("rows", "1");
    textarea.setAttribute("maxlength", "1000");
    const sendButton = document.createElement("button");
    sendButton.className = "chatbox-send-button";
    sendButton.setAttribute("aria-label", "Verstuur bericht");
    sendButton.innerHTML = "📤";
    sendButton.disabled = true;
    inputContainer.appendChild(textarea);
    inputContainer.appendChild(sendButton);
    inputArea.appendChild(inputContainer);
    return inputArea;
  }
  /**
   * Auto-resize textarea based on content
   */
  autoResizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }
  /**
   * Send a message
   */
  async sendMessage() {
    const textarea = this.drawer?.querySelector(".chatbox-input");
    const sendButton = this.drawer?.querySelector(".chatbox-send-button");
    const messagesContainer = this.drawer?.querySelector(".chatbox-messages");
    if (!textarea || !sendButton || !messagesContainer || !this.sseClient) return;
    const message = textarea.value.trim();
    if (!message) return;
    const userMessage = this.createMessage("user", message);
    messagesContainer.appendChild(userMessage);
    textarea.value = "";
    textarea.style.height = "auto";
    sendButton.disabled = true;
    this.scrollToBottom(messagesContainer);
    let knowledgeContext = "";
    if (this.knowledgeSearch && this.knowledgeSearch.shouldSearchKnowledge(message)) {
      try {
        const knowledgeResults = await this.knowledgeSearch.search(message, 3);
        if (knowledgeResults.length > 0) {
          knowledgeContext = this.knowledgeSearch.formatKnowledgeResults(knowledgeResults);
        }
      } catch (error) {
        console.warn("Knowledge search failed:", error);
      }
    }
    this.streamingMessage = new StreamingMessage();
    messagesContainer.appendChild(this.streamingMessage.getElement());
    this.streamingMessage.startStreaming();
    const conversationId = `c-${Date.now()}`;
    const enhancedMessage = knowledgeContext ? `${message}${knowledgeContext}` : message;
    this.sseClient.connect(
      conversationId,
      enhancedMessage,
      (event) => this.handleSSEEvent(event),
      (error) => this.handleSSEError(error)
    );
    textarea.focus();
  }
  /**
   * Handle SSE events
   */
  handleSSEEvent(event) {
    const messagesContainer = this.drawer?.querySelector(".chatbox-messages");
    if (!messagesContainer) return;
    switch (event.type) {
      case "typing":
        if (this.typingIndicator) {
          this.typingIndicator.show(event.message || "Assistant is typing...");
        }
        break;
      case "content":
        if (this.streamingMessage) {
          this.streamingMessage.updateText(event.token || "");
          this.scrollToBottom(messagesContainer);
        }
        break;
      case "done":
        if (this.typingIndicator) {
          this.typingIndicator.hide();
        }
        if (this.streamingMessage) {
          this.streamingMessage.finishStreaming();
          this.scrollToBottom(messagesContainer);
        }
        this.enableInput();
        break;
      case "error":
        this.handleSSEError(new Error(event.message || "Unknown error"));
        break;
    }
  }
  /**
   * Handle SSE errors
   */
  handleSSEError(error) {
    console.error("SSE Error:", error);
    if (this.typingIndicator) {
      this.typingIndicator.hide();
    }
    const messagesContainer = this.drawer?.querySelector(".chatbox-messages");
    if (messagesContainer) {
      const errorMessage = this.createMessage("assistant", `Sorry, er is een fout opgetreden: ${error.message}`);
      messagesContainer.appendChild(errorMessage);
      this.scrollToBottom(messagesContainer);
    }
    this.enableInput();
  }
  /**
   * Enable input after message processing
   */
  enableInput() {
    const textarea = this.drawer?.querySelector(".chatbox-input");
    const sendButton = this.drawer?.querySelector(".chatbox-send-button");
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
  scrollToBottom(container) {
    container.scrollTop = container.scrollHeight;
  }
  /**
   * Add CSS styles
   */
  addStyles() {
    if (document.getElementById("chatbox-styles")) return;
    const style = document.createElement("style");
    style.id = "chatbox-styles";
    style.textContent = this.getCSS();
    document.head.appendChild(style);
  }
  /**
   * Get CSS styles
   */
  getCSS() {
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
  getConfig() {
    return { ...this.config };
  }
  /**
   * Check if widget is initialized
   */
  isReady() {
    return this.isInitialized;
  }
  /**
   * Destroy the widget
   */
  destroy() {
    if (this.sseClient) {
      this.sseClient.disconnect();
      this.sseClient = null;
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.isInitialized = false;
  }
};
__publicField(_ChatboxWidget, "AUTHORIZED_DOMAINS", [
  "localhost",
  "127.0.0.1",
  "test-site.com",
  "demo-site.com",
  "file"
]);
let ChatboxWidget = _ChatboxWidget;
window.Chatbox = {
  init: (options) => {
    const widget = new ChatboxWidget();
    return widget.init(options);
  }
};
window.ChatboxWidget = ChatboxWidget;
export {
  ChatboxWidget,
  ChatboxWidget as default
};
