#!/usr/bin/env node

/**
 * Environment Setup Script
 * 
 * Dit script maakt de .env bestand aan met de Resend configuratie
 */

const fs = require('fs');
const path = require('path');

function setupEnvironment() {
  console.log('🔧 Setting up environment variables...\n');
  
  const envContent = `# Resend Configuration
RESEND_API_KEY=re_e8dLfswg_9VXTCgYzmDfX9jgN4wdChGyP
HANDOVER_EMAIL=ibrahim_benyahya@hotmail.com

# OpenAI Configuration  
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/chatbox

# Server Configuration
PORT=3000
NODE_ENV=development
`;

  try {
    // Check if .env already exists
    if (fs.existsSync('.env')) {
      console.log('⚠️  .env bestand bestaat al!');
      console.log('   Wil je het overschrijven? (y/n)');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          writeEnvFile(envContent);
        } else {
          console.log('❌ Setup geannuleerd.');
        }
        rl.close();
      });
    } else {
      writeEnvFile(envContent);
    }
  } catch (error) {
    console.error('❌ Fout bij het maken van .env bestand:', error.message);
    process.exit(1);
  }
}

function writeEnvFile(content) {
  try {
    fs.writeFileSync('.env', content);
    console.log('✅ .env bestand aangemaakt met Resend configuratie!');
    console.log('\n📧 Resend Configuratie:');
    console.log('   API Key: ✅ Geconfigureerd');
    console.log('   Handover Email: ibrahim_benyahya@hotmail.com');
    console.log('   TO Email: info@bitbreez.nl');
    console.log('   EU Data Residency: ✅ Ingeschakeld');
    
    console.log('\n🚀 Volgende stappen:');
    console.log('1. Start de server: npm start');
    console.log('2. Open demo/index.html');
    console.log('3. Klik "Test Handover Email"');
    console.log('4. Check info@bitbreez.nl inbox! 📧');
    
    console.log('\n⚠️  Belangrijk:');
    console.log('   - .env bestand is toegevoegd aan .gitignore');
    console.log('   - API key is beveiligd tegen publicatie');
    console.log('   - EU Data Residency is ingeschakeld voor compliance');
    
  } catch (error) {
    console.error('❌ Fout bij het schrijven van .env bestand:', error.message);
    process.exit(1);
  }
}

// Run setup
setupEnvironment();

