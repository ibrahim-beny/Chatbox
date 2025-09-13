import { AIProvider, ChatRequest, ChatResponse } from '../types.js';

export class MockAIProvider implements AIProvider {
  private responses = [
    'Hallo! Ik ben je AI-assistent. Hoe kan ik je helpen?',
    'Dat is een interessante vraag. Laat me daar even over nadenken...',
    'Ik begrijp je vraag. Hier is wat ik kan vertellen:',
    'Bedankt voor je vraag. Ik kan je helpen met informatie over ons bedrijf.',
    'Goed dat je vraagt! Hier is het antwoord dat je zoekt:',
    'Ik zie dat je hulp nodig hebt. Laat me je daarbij helpen.',
    'Dat is een veelgestelde vraag. Hier is het antwoord:',
    'Ik kan je zeker helpen met die vraag. Hier is wat je moet weten:'
  ];

  // private errorScenarios = [
  //   'network_error',
  //   'rate_limit',
  //   'timeout',
  //   'invalid_request'
  // ];

  async *streamResponse(_request: ChatRequest): AsyncGenerator<ChatResponse> {
    // Simulate 200-600ms latency (reduced for testing)
    const latency = Math.random() * 200 + 100;
    await new Promise(resolve => setTimeout(resolve, latency));

    // Simulate error scenarios (10% chance)
    if (Math.random() < 0.1) {
      // const errorType = this.errorScenarios[Math.floor(Math.random() * this.errorScenarios.length)];
      yield {
        token: '',
        type: 'error',
        confidence: 0
      };
      return;
    }

    // Get random response
    const response = this.responses[Math.floor(Math.random() * this.responses.length)];
    
    // Stream tokens with realistic timing
    const tokens = response.split(' ');
    let currentText = '';

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      currentText += (i > 0 ? ' ' : '') + token;
      
      // Simulate token streaming delay (reduced for testing)
      await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 30));
      
      yield {
        token: currentText,
        type: 'content',
        confidence: 0.85 + Math.random() * 0.15,
        latency: latency + (i * 75)
      };
    }

    // Final done event
    yield {
      token: '',
      type: 'done',
      confidence: 0.9,
      latency: latency + (tokens.length * 75)
    };
  }
}
