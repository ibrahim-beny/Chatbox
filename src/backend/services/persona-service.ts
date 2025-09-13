/**
 * MVP-006: Persona & Tone-of-Voice Service
 * 
 * Beheert tenant-specifieke personas en veilige content filtering
 */

export interface PersonaConfig {
  id: string;
  name: string;
  tone: 'professioneel-technisch' | 'vriendelijk-klantgericht' | 'casual-vriendelijk';
  personality: string[];
  safetyPolicies: string[];
  promptTemplate: string;
  templateVersion: string;
  welcomeMessage: string;
  refusalMessage: string;
}

export interface PersonaResponse {
  response: string;
  persona: string;
  tone: string;
  templateVersion?: string;
  promptTemplate?: string;
  safetyFilter?: boolean;
  redirectTo?: string;
}

export interface SafetyCheckResult {
  isSafe: boolean;
  filteredContent?: string;
  reason?: string;
  redirectTo?: string;
}

// Tenant-specifieke persona configuraties
export const PERSONA_CONFIGS: Record<string, PersonaConfig> = {
  'demo-tenant': {
    id: 'techcorp',
    name: 'TechCorp Solutions AI Assistant',
    tone: 'professioneel-technisch',
    personality: [
      'Professioneel en technisch onderlegd',
      'Focus op web development en software oplossingen',
      'Direct en efficiënt in communicatie',
      'Expertise in moderne technologieën'
    ],
    safetyPolicies: [
      'Geen illegale activiteiten',
      'Geen hacking of malware',
      'Geen spam of phishing',
      'Geen persoonlijke informatie delen'
    ],
    promptTemplate: 'techcorp-professional-v1.2',
    templateVersion: 'v1.2',
    welcomeMessage: 'Hallo! Ik ben de AI-assistent van TechCorp Solutions. Hoe kan ik je helpen met onze web development diensten?',
    refusalMessage: 'Ik kan je niet helpen met deze vraag. Bij TechCorp Solutions helpen we graag met legitieme web development projecten. Wil je meer weten over onze diensten?'
  },
  'test-tenant': {
    id: 'retailmax',
    name: 'RetailMax Customer Service AI',
    tone: 'vriendelijk-klantgericht',
    personality: [
      'Vriendelijk en behulpzaam',
      'Focus op klanttevredenheid en service',
      'Geduldig en ondersteunend',
      'Expertise in elektronica en retail'
    ],
    safetyPolicies: [
      'Geen illegale activiteiten',
      'Geen hacking of malware',
      'Geen spam of phishing',
      'Geen persoonlijke informatie delen'
    ],
    promptTemplate: 'retailmax-friendly-v1.1',
    templateVersion: 'v1.1',
    welcomeMessage: 'Hallo! Welkom bij RetailMax. Ik help je graag met vragen over onze producten en services.',
    refusalMessage: 'Ik kan je niet helpen met deze vraag. Bij RetailMax staan we voor kwaliteit en service. Hoe kan ik je anders helpen?'
  }
};

// Veilige content filtering
export class SafetyFilter {
  private static readonly DANGEROUS_PATTERNS = [
    /hack/i,
    /virus/i,
    /malware/i,
    /phishing/i,
    /spam/i,
    /illegale/i,
    /crimineel/i,
    /stelen/i,
    /fraude/i,
    /bedrog/i
  ];

  private static readonly REDIRECT_PATTERNS = [
    { pattern: /hack|virus|malware/i, redirectTo: 'legitimate-services' },
    { pattern: /spam|phishing/i, redirectTo: 'marketing-services' },
    { pattern: /illegale|crimineel/i, redirectTo: 'legal-services' }
  ];

  static checkContent(content: string): SafetyCheckResult {
    const lowerContent = content.toLowerCase();

    // Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(lowerContent)) {
        // Find appropriate redirect
        for (const redirectPattern of this.REDIRECT_PATTERNS) {
          if (redirectPattern.pattern.test(lowerContent)) {
            return {
              isSafe: false,
              filteredContent: this.sanitizeContent(content),
              reason: 'Inappropriate content detected',
              redirectTo: redirectPattern.redirectTo
            };
          }
        }

        return {
          isSafe: false,
          filteredContent: this.sanitizeContent(content),
          reason: 'Inappropriate content detected'
        };
      }
    }

    return { isSafe: true };
  }

  private static sanitizeContent(content: string): string {
    // Replace dangerous words with safe alternatives
    return content
      .replace(/hack/gi, 'legitimate development')
      .replace(/virus/gi, 'security solution')
      .replace(/malware/gi, 'security software')
      .replace(/spam/gi, 'marketing')
      .replace(/phishing/gi, 'email security')
      .replace(/illegale/gi, 'legitimate')
      .replace(/crimineel/gi, 'legal');
  }
}

// Persona service voor tenant-specifieke responses
export class PersonaService {
  private static instance: PersonaService;
  private personaCache: Map<string, PersonaConfig> = new Map();

  static getInstance(): PersonaService {
    if (!this.instance) {
      this.instance = new PersonaService();
    }
    return this.instance;
  }

  constructor() {
    // Initialize persona cache
    Object.entries(PERSONA_CONFIGS).forEach(([tenantId, config]) => {
      this.personaCache.set(tenantId, config);
    });
  }

  getPersonaConfig(tenantId: string): PersonaConfig | null {
    return this.personaCache.get(tenantId) || null;
  }

  async generatePersonaResponse(
    tenantId: string,
    userMessage: string,
    _conversationHistory: string[] = []
  ): Promise<PersonaResponse> {
    const personaConfig = this.getPersonaConfig(tenantId);
    
    if (!personaConfig) {
      throw new Error(`No persona config found for tenant: ${tenantId}`);
    }

    // Safety check
    const safetyCheck = SafetyFilter.checkContent(userMessage);
    
    if (!safetyCheck.isSafe) {
      return {
        response: personaConfig.refusalMessage,
        persona: personaConfig.id,
        tone: personaConfig.tone,
        templateVersion: personaConfig.templateVersion,
        promptTemplate: personaConfig.promptTemplate,
        safetyFilter: true,
        redirectTo: safetyCheck.redirectTo
      };
    }

    // Generate contextual response based on persona
    const contextualResponse = this.generateContextualResponse(
      personaConfig,
      userMessage,
      _conversationHistory
    );

    return {
      response: contextualResponse,
      persona: personaConfig.id,
      tone: personaConfig.tone,
      templateVersion: personaConfig.templateVersion,
      promptTemplate: personaConfig.promptTemplate
    };
  }

  private generateContextualResponse(
    personaConfig: PersonaConfig,
    userMessage: string,
    _conversationHistory: string[]
  ): string {
    const lowerMessage = userMessage.toLowerCase();
    
    // Greeting responses
    if (this.isGreeting(lowerMessage)) {
      return personaConfig.welcomeMessage;
    }

    // Service-related questions
    if (this.isServiceQuestion(lowerMessage)) {
      return this.generateServiceResponse(personaConfig);
    }

    // Pricing questions
    if (this.isPricingQuestion(lowerMessage)) {
      return this.generatePricingResponse(personaConfig);
    }

    // Support questions
    if (this.isSupportQuestion(lowerMessage)) {
      return this.generateSupportResponse(personaConfig);
    }

    // Default response based on persona
    return this.generateDefaultResponse(personaConfig, userMessage);
  }

  private isGreeting(message: string): boolean {
    const greetings = ['hallo', 'hi', 'hey', 'goedemorgen', 'goedemiddag', 'goedenavond'];
    return greetings.some(greeting => message.includes(greeting));
  }

  private isServiceQuestion(message: string): boolean {
    const serviceKeywords = ['diensten', 'services', 'wat doen', 'wat bieden', 'aanbod'];
    return serviceKeywords.some(keyword => message.includes(keyword));
  }

  private isPricingQuestion(message: string): boolean {
    const pricingKeywords = ['prijs', 'kosten', 'tarief', 'prijzen', 'hoeveel'];
    return pricingKeywords.some(keyword => message.includes(keyword));
  }

  private isSupportQuestion(message: string): boolean {
    const supportKeywords = ['ondersteuning', 'support', 'hulp', 'probleem', 'issue'];
    return supportKeywords.some(keyword => message.includes(keyword));
  }

  private generateServiceResponse(personaConfig: PersonaConfig): string {
    if (personaConfig.id === 'techcorp') {
      return 'TechCorp Solutions biedt professionele web development diensten, inclusief React/Next.js applicaties, Node.js backend services, database design en cloud deployment. We zijn gespecialiseerd in moderne technologieën en schaalbare oplossingen.';
    } else if (personaConfig.id === 'retailmax') {
      return 'RetailMax is uw betrouwbare partner voor elektronica en consumentengoederen. We bieden een breed assortiment smartphones, laptops, audio/video apparatuur en gaming accessoires met uitstekende klantenservice.';
    }
    return 'We bieden verschillende diensten om aan uw behoeften te voldoen.';
  }

  private generatePricingResponse(personaConfig: PersonaConfig): string {
    if (personaConfig.id === 'techcorp') {
      return 'Onze tarieven variëren van €2,500 tot €10,000 per maand afhankelijk van het pakket. Het Starter Package begint bij €2,500, Professional bij €5,000 en Enterprise bij €10,000. Neem contact op voor een offerte op maat.';
    } else if (personaConfig.id === 'retailmax') {
      return 'Onze prijzen zijn competitief en variëren per productcategorie. We bieden regelmatig kortingen en speciale aanbiedingen. Bekijk onze website voor actuele prijzen of vraag naar een persoonlijke offerte.';
    }
    return 'Neem contact op voor informatie over onze tarieven.';
  }

  private generateSupportResponse(personaConfig: PersonaConfig): string {
    if (personaConfig.id === 'techcorp') {
      return 'We bieden 24/7 ondersteuning voor alle onze producten. Bug fixes worden binnen 24 uur opgelost, feature requests binnen 1 week behandeld. Enterprise klanten krijgen dedicated support met 99.9% uptime garantie.';
    } else if (personaConfig.id === 'retailmax') {
      return 'Onze klantenservice is beschikbaar van maandag tot vrijdag 9:00-18:00 en zaterdag 10:00-16:00. Bel 0800-RETAILMAX of mail naar service@retailmax.nl. We bieden ook live chat op onze website.';
    }
    return 'Onze klantenservice helpt je graag verder.';
  }

  private generateDefaultResponse(personaConfig: PersonaConfig, _userMessage: string): string {
    if (personaConfig.id === 'techcorp') {
      return `TechCorp Solutions: ${personaConfig.personality[0]}. Hoe kan ik je helpen met web development of software oplossingen?`;
    } else if (personaConfig.id === 'retailmax') {
      return `RetailMax: ${personaConfig.personality[0]}. Wat kan ik voor je betekenen op het gebied van elektronica en consumentengoederen?`;
    }
    return 'Hoe kan ik je helpen?';
  }

  // Validate persona consistency across conversation
  validatePersonaConsistency(tenantId: string, responses: PersonaResponse[]): boolean {
    const personaConfig = this.getPersonaConfig(tenantId);
    if (!personaConfig) return false;

    return responses.every(response => 
      response.persona === personaConfig.id && 
      response.tone === personaConfig.tone
    );
  }

  // Get persona statistics
  getPersonaStats(tenantId: string): {
    persona: string;
    tone: string;
    templateVersion: string;
    safetyPolicies: string[];
  } | null {
    const personaConfig = this.getPersonaConfig(tenantId);
    if (!personaConfig) return null;

    return {
      persona: personaConfig.id,
      tone: personaConfig.tone,
      templateVersion: personaConfig.templateVersion,
      safetyPolicies: personaConfig.safetyPolicies
    };
  }
}
