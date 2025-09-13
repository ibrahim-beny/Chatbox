// Typing Indicator Component for MVP-003B

export class TypingIndicator {
  private element: HTMLElement;
  private isVisible: boolean = false;

  constructor() {
    this.element = this.createElement();
  }

  private createElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'chatbox-typing-indicator';
    element.setAttribute('aria-live', 'polite');
    element.setAttribute('aria-label', 'Assistant is typing');
    element.setAttribute('role', 'status');
    element.style.display = 'none';

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

  show(message: string = 'Assistant is typing'): void {
    if (this.isVisible) return;

    this.isVisible = true;
    this.element.style.display = 'flex';
    
    const textElement = this.element.querySelector('.typing-text') as HTMLElement;
    if (textElement) {
      textElement.textContent = message;
    }

    this.startAnimation();
  }

  hide(): void {
    if (!this.isVisible) return;

    this.isVisible = false;
    this.element.style.display = 'none';
    this.stopAnimation();
  }

  private startAnimation(): void {
    const dots = this.element.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
      (dot as HTMLElement).style.animation = `typing-dot 1.4s infinite ease-in-out ${index * 0.16}s`;
    });
  }

  private stopAnimation(): void {
    const dots = this.element.querySelectorAll('.dot');
    dots.forEach(dot => {
      (dot as HTMLElement).style.animation = 'none';
    });
  }

  getElement(): HTMLElement {
    return this.element;
  }

  isShowing(): boolean {
    return this.isVisible;
  }
}
