import { ChatboxServer } from './server.js';

export class TestServer {
  private server: ChatboxServer;

  constructor() {
    this.server = new ChatboxServer();
  }

  async start(port: number = 3001): Promise<void> {
    // For testing, we'll use a simple HTTP server simulation
    // In a real implementation, this would start an actual HTTP server
    console.log(`Test server would start on port ${port}`);
  }

  async handleRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const request = new Request(`http://localhost:3001${url}`, {
      method: 'GET',
      ...options
    });

    return await this.server.handleRequest(request);
  }

  async stop(): Promise<void> {
    console.log('Test server stopped');
  }
}
