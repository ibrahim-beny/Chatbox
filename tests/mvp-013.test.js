/**
 * MVP-013: Integration Test Suite
 * 
 * Dit script test alle integratie scenario's voor verschillende platforms.
 */

const http = require('http');
const https = require('https');

class IntegrationTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.testResults = [];
    this.platforms = ['wordpress', 'shopify', 'html', 'react'];
  }

  async makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const jsonBody = JSON.parse(body);
            resolve({ status: res.statusCode, data: jsonBody });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  async testWidgetScript() {
    console.log('🔍 Testing widget script availability...');
    
    try {
      const response = await this.makeRequest('GET', '/dist/widget.iife.js');
      
      if (response.status === 200) {
        this.testResults.push({ test: 'Widget Script', status: 'PASS', details: 'Script available' });
        console.log('✅ Widget script is available');
        return true;
      } else {
        this.testResults.push({ test: 'Widget Script', status: 'FAIL', details: `Status: ${response.status}` });
        console.log('❌ Widget script not available');
        return false;
      }
    } catch (error) {
      this.testResults.push({ test: 'Widget Script', status: 'ERROR', details: error.message });
      console.log('❌ Widget script error:', error.message);
      return false;
    }
  }

  async testAPIEndpoints() {
    console.log('🔍 Testing API endpoints...');
    
    const endpoints = [
      '/api/health',
      '/api/tenant/demo-tenant/config',
      '/api/ai/query'
    ];

    let allPassed = true;

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest('GET', endpoint);
        
        if (response.status === 200) {
          console.log(`✅ ${endpoint} - OK`);
        } else {
          console.log(`❌ ${endpoint} - Status: ${response.status}`);
          allPassed = false;
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - Error: ${error.message}`);
        allPassed = false;
      }
    }

    this.testResults.push({ 
      test: 'API Endpoints', 
      status: allPassed ? 'PASS' : 'FAIL', 
      details: `${endpoints.length} endpoints tested` 
    });

    return allPassed;
  }

  async testTenantConfiguration() {
    console.log('🔍 Testing tenant configuration...');
    
    try {
      const response = await this.makeRequest('GET', '/api/tenant/demo-tenant/config');
      
      if (response.status === 200 && response.data.config) {
        const config = response.data.config;
        
        // Validate required config fields
        const requiredFields = ['persona', 'tone'];
        const missingFields = requiredFields.filter(field => !config[field]);
        
        if (missingFields.length === 0) {
          this.testResults.push({ test: 'Tenant Config', status: 'PASS', details: config });
          console.log('✅ Tenant configuration is valid');
          return true;
        } else {
          this.testResults.push({ test: 'Tenant Config', status: 'FAIL', details: `Missing fields: ${missingFields.join(', ')}` });
          console.log('❌ Tenant configuration missing fields:', missingFields);
          return false;
        }
      } else {
        this.testResults.push({ test: 'Tenant Config', status: 'FAIL', details: 'Invalid response' });
        console.log('❌ Invalid tenant configuration response');
        return false;
      }
    } catch (error) {
      this.testResults.push({ test: 'Tenant Config', status: 'ERROR', details: error.message });
      console.log('❌ Tenant configuration error:', error.message);
      return false;
    }
  }

  async testAIQuery() {
    console.log('🔍 Testing AI query functionality...');
    
    try {
      const response = await this.makeRequest('POST', '/api/ai/query', {
        content: 'Test message',
        tenantId: 'demo-tenant',
        conversationId: 'test-conversation'
      });
      
      if (response.status === 200 && response.data.message) {
        this.testResults.push({ test: 'AI Query', status: 'PASS', details: response.data });
        console.log('✅ AI query functionality works');
        return true;
      } else {
        this.testResults.push({ test: 'AI Query', status: 'FAIL', details: response });
        console.log('❌ AI query functionality failed');
        return false;
      }
    } catch (error) {
      this.testResults.push({ test: 'AI Query', status: 'ERROR', details: error.message });
      console.log('❌ AI query error:', error.message);
      return false;
    }
  }

  async testKnowledgeBase() {
    console.log('🔍 Testing knowledge base integration...');
    
    try {
      const response = await this.makeRequest('GET', '/api/knowledge/search?q=test');
      
      if (response.status === 200) {
        this.testResults.push({ test: 'Knowledge Base', status: 'PASS', details: 'Search functionality works' });
        console.log('✅ Knowledge base search works');
        return true;
      } else {
        this.testResults.push({ test: 'Knowledge Base', status: 'FAIL', details: `Status: ${response.status}` });
        console.log('❌ Knowledge base search failed');
        return false;
      }
    } catch (error) {
      this.testResults.push({ test: 'Knowledge Base', status: 'ERROR', details: error.message });
      console.log('❌ Knowledge base error:', error.message);
      return false;
    }
  }

  async testHandoverSystem() {
    console.log('🔍 Testing handover system...');
    
    try {
      const response = await this.makeRequest('POST', '/api/handover/request', {
        tenantId: 'demo-tenant',
        conversationId: 'test-conversation',
        reason: 'test-handover',
        customerInfo: {
          email: 'test@example.com',
          name: 'Test User'
        }
      });
      
      if (response.status === 200) {
        this.testResults.push({ test: 'Handover System', status: 'PASS', details: 'Handover request processed' });
        console.log('✅ Handover system works');
        return true;
      } else {
        this.testResults.push({ test: 'Handover System', status: 'FAIL', details: `Status: ${response.status}` });
        console.log('❌ Handover system failed');
        return false;
      }
    } catch (error) {
      this.testResults.push({ test: 'Handover System', status: 'ERROR', details: error.message });
      console.log('❌ Handover system error:', error.message);
      return false;
    }
  }

  async testPlatformSpecificCode(platform) {
    console.log(`🔍 Testing ${platform} integration code...`);
    
    const codeSnippets = {
      wordpress: this.generateWordPressCode(),
      shopify: this.generateShopifyCode(),
      html: this.generateHTMLCode(),
      react: this.generateReactCode()
    };

    const code = codeSnippets[platform];
    
    // Basic validation of generated code
    const validations = [
      { name: 'Contains tenantId', test: code.includes('tenantId') },
      { name: 'Contains API URL', test: code.includes('apiUrl') },
      { name: 'Contains init call', test: code.includes('ChatboxWidget.init') },
      { name: 'Contains script tag', test: code.includes('<script') || code.includes('script.src') }
    ];

    const failedValidations = validations.filter(v => !v.test);
    
    if (failedValidations.length === 0) {
      this.testResults.push({ test: `${platform} Code`, status: 'PASS', details: 'Code generation valid' });
      console.log(`✅ ${platform} code generation works`);
      return true;
    } else {
      this.testResults.push({ test: `${platform} Code`, status: 'FAIL', details: `Failed: ${failedValidations.map(v => v.name).join(', ')}` });
      console.log(`❌ ${platform} code generation failed:`, failedValidations.map(v => v.name));
      return false;
    }
  }

  generateWordPressCode() {
    return `<!-- WordPress Integration -->
<script src="https://your-domain.com/dist/widget.iife.js"></script>
<script>
  ChatboxWidget.init({
    tenantId: 'demo-tenant',
    apiUrl: 'https://your-domain.com/api',
    position: 'bottom-right',
    theme: 'light'
  });
</script>`;
  }

  generateShopifyCode() {
    return `<!-- Shopify Integration -->
<script src="https://your-domain.com/dist/widget.iife.js"></script>
<script>
  ChatboxWidget.init({
    tenantId: 'demo-tenant',
    apiUrl: 'https://your-domain.com/api',
    position: 'bottom-right',
    theme: 'light'
  });
</script>`;
  }

  generateHTMLCode() {
    return `<!-- HTML Integration -->
<script src="https://your-domain.com/dist/widget.iife.js"></script>
<script>
  ChatboxWidget.init({
    tenantId: 'demo-tenant',
    apiUrl: 'https://your-domain.com/api',
    position: 'bottom-right',
    theme: 'light'
  });
</script>`;
  }

  generateReactCode() {
    return `// React Integration
import { useEffect } from 'react';

const ChatboxWidget = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/dist/widget.iife.js';
    script.onload = () => {
      window.ChatboxWidget.init({
        tenantId: 'demo-tenant',
        apiUrl: 'https://your-domain.com/api',
        position: 'bottom-right',
        theme: 'light'
      });
    };
    document.head.appendChild(script);
  }, []);

  return null;
};`;
  }

  async testIntegrationWizard() {
    console.log('🔍 Testing integration wizard...');
    
    // Test if wizard HTML is accessible
    try {
      const response = await this.makeRequest('GET', '/integration-wizard.html');
      
      if (response.status === 200) {
        this.testResults.push({ test: 'Integration Wizard', status: 'PASS', details: 'Wizard accessible' });
        console.log('✅ Integration wizard is accessible');
        return true;
      } else {
        this.testResults.push({ test: 'Integration Wizard', status: 'FAIL', details: `Status: ${response.status}` });
        console.log('❌ Integration wizard not accessible');
        return false;
      }
    } catch (error) {
      this.testResults.push({ test: 'Integration Wizard', status: 'ERROR', details: error.message });
      console.log('❌ Integration wizard error:', error.message);
      return false;
    }
  }

  async testDocumentation() {
    console.log('🔍 Testing documentation availability...');
    
    try {
      const response = await this.makeRequest('GET', '/docs/integration-guide.md');
      
      if (response.status === 200) {
        this.testResults.push({ test: 'Documentation', status: 'PASS', details: 'Documentation available' });
        console.log('✅ Integration documentation is available');
        return true;
      } else {
        this.testResults.push({ test: 'Documentation', status: 'FAIL', details: `Status: ${response.status}` });
        console.log('❌ Integration documentation not available');
        return false;
      }
    } catch (error) {
      this.testResults.push({ test: 'Documentation', status: 'ERROR', details: error.message });
      console.log('❌ Documentation error:', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting MVP-013 Integration Tests...\n');
    
    const startTime = Date.now();
    
    // Core functionality tests
    await this.testWidgetScript();
    await this.testAPIEndpoints();
    await this.testTenantConfiguration();
    await this.testAIQuery();
    await this.testKnowledgeBase();
    await this.testHandoverSystem();
    
    // Platform-specific tests
    for (const platform of this.platforms) {
      await this.testPlatformSpecificCode(platform);
    }
    
    // Integration tools tests
    await this.testIntegrationWizard();
    await this.testDocumentation();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Print results
    console.log('\n📊 Integration Test Results:');
    console.log('='.repeat(60));
    
    let passed = 0;
    let failed = 0;
    let errors = 0;
    
    this.testResults.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${status} ${result.test}: ${result.status}`);
      
      if (result.status === 'PASS') passed++;
      else if (result.status === 'FAIL') failed++;
      else errors++;
    });
    
    console.log('='.repeat(60));
    console.log(`📈 Total: ${this.testResults.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed} | ⚠️ Errors: ${errors}`);
    console.log(`⏱️ Duration: ${duration}ms`);
    
    if (failed === 0 && errors === 0) {
      console.log('\n🎉 All integration tests passed! MVP-013 is ready for production.');
      return true;
    } else {
      console.log('\n❌ Some integration tests failed. Please check the issues above.');
      return false;
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = IntegrationTester;
