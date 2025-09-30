interface CaptchaChallenge {
  id: string;
  question: string;
  answer: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
}

interface CaptchaResult {
  success: boolean;
  challengeId?: string;
  question?: string;
  error?: string;
}

export class CaptchaService {
  private challenges: Map<string, CaptchaChallenge> = new Map();
  private readonly CHALLENGE_EXPIRY = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_ATTEMPTS = 3;

  // Simple math challenges
  private generateMathChallenge(): { question: string; answer: string } {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1: number, num2: number, answer: number;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 50) + 25;
        num2 = Math.floor(Math.random() * 25) + 1;
        answer = num1 - num2;
        break;
      case '*':
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 * num2;
        break;
      default:
        num1 = 1;
        num2 = 1;
        answer = 2;
    }
    
    return {
      question: `Wat is ${num1} ${operation} ${num2}?`,
      answer: answer.toString()
    };
  }

  // Simple word challenges
  private generateWordChallenge(): { question: string; answer: string } {
    const words = [
      { question: 'Wat is de hoofdstad van Nederland?', answer: 'amsterdam' },
      { question: 'Hoeveel dagen heeft een week?', answer: '7' },
      { question: 'Welke kleur krijg je als je rood en blauw mengt?', answer: 'paars' },
      { question: 'Wat is 2 + 2?', answer: '4' },
      { question: 'Welk dier zegt "miauw"?', answer: 'kat' },
      { question: 'Hoeveel maanden heeft een jaar?', answer: '12' },
      { question: 'Welke planeet staat het dichtst bij de zon?', answer: 'mercurius' },
      { question: 'Wat is de grootste oceaan?', answer: 'stille oceaan' }
    ];
    
    const randomWord = words[Math.floor(Math.random() * words.length)];
    return randomWord;
  }

  generateChallenge(): CaptchaResult {
    try {
      const challengeId = this.generateChallengeId();
      const challengeType = Math.random() < 0.7 ? 'math' : 'word';
      
      let question: string, answer: string;
      
      if (challengeType === 'math') {
        const mathChallenge = this.generateMathChallenge();
        question = mathChallenge.question;
        answer = mathChallenge.answer;
      } else {
        const wordChallenge = this.generateWordChallenge();
        question = wordChallenge.question;
        answer = wordChallenge.answer;
      }
      
      const challenge: CaptchaChallenge = {
        id: challengeId,
        question,
        answer: answer.toLowerCase().trim(),
        expiresAt: Date.now() + this.CHALLENGE_EXPIRY,
        attempts: 0,
        maxAttempts: this.MAX_ATTEMPTS
      };
      
      this.challenges.set(challengeId, challenge);
      
      // Clean up expired challenges
      this.cleanupExpiredChallenges();
      
      return {
        success: true,
        challengeId,
        question
      };
    } catch (error) {
      console.error('Error generating captcha challenge:', error);
      return {
        success: false,
        error: 'Failed to generate challenge'
      };
    }
  }

  verifyChallenge(challengeId: string, userAnswer: string): CaptchaResult {
    try {
      const challenge = this.challenges.get(challengeId);
      
      if (!challenge) {
        return {
          success: false,
          error: 'Challenge not found or expired'
        };
      }
      
      if (Date.now() > challenge.expiresAt) {
        this.challenges.delete(challengeId);
        return {
          success: false,
          error: 'Challenge expired'
        };
      }
      
      challenge.attempts++;
      
      const normalizedAnswer = userAnswer.toLowerCase().trim();
      const isCorrect = normalizedAnswer === challenge.answer;
      
      if (isCorrect) {
        this.challenges.delete(challengeId);
        return { success: true };
      }
      
      if (challenge.attempts >= challenge.maxAttempts) {
        this.challenges.delete(challengeId);
        return {
          success: false,
          error: 'Maximum attempts exceeded'
        };
      }
      
      return {
        success: false,
        error: `Incorrect answer. ${challenge.maxAttempts - challenge.attempts} attempts remaining.`
      };
    } catch (error) {
      console.error('Error verifying captcha challenge:', error);
      return {
        success: false,
        error: 'Failed to verify challenge'
      };
    }
  }

  private generateChallengeId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private cleanupExpiredChallenges(): void {
    const now = Date.now();
    for (const [id, challenge] of this.challenges.entries()) {
      if (now > challenge.expiresAt) {
        this.challenges.delete(id);
      }
    }
  }

  // Get challenge statistics
  getStats(): {
    activeChallenges: number;
    totalGenerated: number;
    successRate: number;
  } {
    this.cleanupExpiredChallenges();
    
    return {
      activeChallenges: this.challenges.size,
      totalGenerated: 0, // Would need to track this separately
      successRate: 0 // Would need to track this separately
    };
  }

  // Reset all challenges (for testing)
  reset(): void {
    this.challenges.clear();
  }
}
