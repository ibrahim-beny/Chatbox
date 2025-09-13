// Streaming Message Component for MVP-003B

export class StreamingMessage {
  private element: HTMLElement;
  private contentElement: HTMLElement;
  private cursorElement: HTMLElement;
  private currentText: string = '';
  private isStreaming: boolean = false;

  constructor() {
    this.element = this.createElement();
    this.contentElement = this.element.querySelector('.chatbox-message-content') as HTMLElement;
    this.cursorElement = this.element.querySelector('.streaming-cursor') as HTMLElement;
  }

  private createElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'chatbox-message chatbox-message-assistant chatbox-streaming-message';
    element.setAttribute('role', 'listitem');

    element.innerHTML = `
      <div class="chatbox-message-content"></div>
      <div class="streaming-cursor">|</div>
      <div class="chatbox-message-timestamp"></div>
    `;

    return element;
  }

  startStreaming(): void {
    this.isStreaming = true;
    this.currentText = '';
    this.contentElement.textContent = '';
    this.cursorElement.style.display = 'inline';
    this.startCursorAnimation();
  }

  updateText(newText: string): void {
    if (!this.isStreaming) return;

    this.currentText = newText;
    this.contentElement.textContent = newText;
  }

  finishStreaming(): void {
    this.isStreaming = false;
    this.cursorElement.style.display = 'none';
    this.stopCursorAnimation();
    this.updateTimestamp();
  }

  private startCursorAnimation(): void {
    this.cursorElement.style.animation = 'streaming-cursor 1s infinite';
  }

  private stopCursorAnimation(): void {
    this.cursorElement.style.animation = 'none';
  }

  private updateTimestamp(): void {
    const timestampElement = this.element.querySelector('.chatbox-message-timestamp') as HTMLElement;
    if (timestampElement) {
      timestampElement.textContent = new Date().toLocaleTimeString('nl-NL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  }

  getElement(): HTMLElement {
    return this.element;
  }

  getCurrentText(): string {
    return this.currentText;
  }

  isCurrentlyStreaming(): boolean {
    return this.isStreaming;
  }
}
