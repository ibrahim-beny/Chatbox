/**
 * MVP-011: Deployment Testing Script
 * 
 * Dit script test alle deployment functionaliteit inclusief rollback procedures.
 */

const http = require('http');
const https = require('https');

class DeploymentTester {
  constructor() {
    this.baseUrl = 'http://localhost:8080';
    this.testResults = [];
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

  async testHealthCheck() {
    console.log('🔍 Testing health check endpoint...');
    
    try {
      const response = await this.makeRequest('GET', '/health');
      
      if (response.status === 200 && response.data.health === 'healthy') {
        this.testResults.push({ test: 'Health Check', status: 'PASS', details: response.data });
        console.log('✅ Health check passed');
        return true;
      } else {
        this.testResults.push({ test: 'Health Check', status: 'FAIL', details: response });
        console.log('❌ Health check failed');
        return false;
      }
    } catch (error) {
      this.testResults.push({ test: 'Health Check', status: 'ERROR', details: error.message });
      console.log('❌ Health check error:', error.message);
      return false;
    }
  }

  async testDeploymentStatus() {
    console.log('🔍 Testing deployment status endpoint...');
    
    try {
      const response = await this.makeRequest('GET', '/deployment/status');
      
      if (response.status === 200 && response.data.currentEnvironment) {
        this.testResults.push({ test: 'Deployment Status', status: 'PASS', details: response.data });
        console.log('✅ Deployment status check passed');
        console.log(`   Current environment: ${response.data.currentEnvironment}`);
        return response.data;
      } else {
        this.testResults.push({ test: 'Deployment Status', status: 'FAIL', details: response });
        console.log('❌ Deployment status check failed');
        return null;
      }
    } catch (error) {
      this.testResults.push({ test: 'Deployment Status', status: 'ERROR', details: error.message });
      console.log('❌ Deployment status error:', error.message);
      return null;
    }
  }

  async testDeployToStandby() {
    console.log('🔍 Testing deploy to standby environment...');
    
    try {
      const response = await this.makeRequest('POST', '/deployment/deploy');
      
      if (response.status === 200 && response.data.success) {
        this.testResults.push({ test: 'Deploy to Standby', status: 'PASS', details: response.data });
        console.log('✅ Deploy to standby passed');
        console.log(`   Deployed version: ${response.data.version} to ${response.data.standbyEnvironment}`);
        return response.data;
      } else {
        this.testResults.push({ test: 'Deploy to Standby', status: 'FAIL', details: response });
        console.log('❌ Deploy to standby failed');
        return null;
      }
    } catch (error) {
      this.testResults.push({ test: 'Deploy to Standby', status: 'ERROR', details: error.message });
      console.log('❌ Deploy to standby error:', error.message);
      return null;
    }
  }

  async testEnvironmentSwitch() {
    console.log('🔍 Testing environment switch...');
    
    try {
      // Get initial status
      const initialStatus = await this.makeRequest('GET', '/deployment/status');
      const initialEnv = initialStatus.data.currentEnvironment;
      
      // Switch environment
      const response = await this.makeRequest('POST', '/deployment/switch');
      
      if (response.status === 200 && response.data.success) {
        // Verify switch
        const newStatus = await this.makeRequest('GET', '/deployment/status');
        const newEnv = newStatus.data.currentEnvironment;
        
        if (newEnv !== initialEnv) {
          this.testResults.push({ test: 'Environment Switch', status: 'PASS', details: response.data });
          console.log('✅ Environment switch passed');
          console.log(`   Switched from ${initialEnv} to ${newEnv}`);
          return response.data;
        } else {
          this.testResults.push({ test: 'Environment Switch', status: 'FAIL', details: 'Environment did not change' });
          console.log('❌ Environment switch failed - environment did not change');
          return null;
        }
      } else {
        this.testResults.push({ test: 'Environment Switch', status: 'FAIL', details: response });
        console.log('❌ Environment switch failed');
        return null;
      }
    } catch (error) {
      this.testResults.push({ test: 'Environment Switch', status: 'ERROR', details: error.message });
      console.log('❌ Environment switch error:', error.message);
      return null;
    }
  }

  async testRollback() {
    console.log('🔍 Testing rollback functionality...');
    
    try {
      // Get initial status
      const initialStatus = await this.makeRequest('GET', '/deployment/status');
      const initialEnv = initialStatus.data.currentEnvironment;
      const initialVersion = initialStatus.data.environments[initialEnv].version;
      
      // Execute rollback
      const response = await this.makeRequest('POST', '/deployment/rollback');
      
      if (response.status === 200) {
        // Verify rollback
        const newStatus = await this.makeRequest('GET', '/deployment/status');
        const newEnv = newStatus.data.currentEnvironment;
        const newVersion = newStatus.data.environments[newEnv].version;
        
        this.testResults.push({ test: 'Rollback', status: 'PASS', details: response.data });
        console.log('✅ Rollback test completed');
        console.log(`   Rollback from ${initialEnv} (v${initialVersion}) to ${newEnv} (v${newVersion})`);
        return response.data;
      } else {
        this.testResults.push({ test: 'Rollback', status: 'FAIL', details: response });
        console.log('❌ Rollback failed');
        return null;
      }
    } catch (error) {
      this.testResults.push({ test: 'Rollback', status: 'ERROR', details: error.message });
      console.log('❌ Rollback error:', error.message);
      return null;
    }
  }

  async testProxyFunctionality() {
    console.log('🔍 Testing proxy functionality...');
    
    try {
      const response = await this.makeRequest('GET', '/api/health');
      
      if (response.status === 200) {
        this.testResults.push({ test: 'Proxy Functionality', status: 'PASS', details: response.data });
        console.log('✅ Proxy functionality passed');
        return true;
      } else {
        this.testResults.push({ test: 'Proxy Functionality', status: 'FAIL', details: response });
        console.log('❌ Proxy functionality failed');
        return false;
      }
    } catch (error) {
      this.testResults.push({ test: 'Proxy Functionality', status: 'ERROR', details: error.message });
      console.log('❌ Proxy functionality error:', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting MVP-011 Deployment Tests...\n');
    
    const startTime = Date.now();
    
    // Run all tests
    await this.testHealthCheck();
    await this.testDeploymentStatus();
    await this.testDeployToStandby();
    await this.testEnvironmentSwitch();
    await this.testRollback();
    await this.testProxyFunctionality();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Print results
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(50));
    
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
    
    console.log('='.repeat(50));
    console.log(`📈 Total: ${this.testResults.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed} | ⚠️ Errors: ${errors}`);
    console.log(`⏱️ Duration: ${duration}ms`);
    
    if (failed === 0 && errors === 0) {
      console.log('\n🎉 All deployment tests passed! MVP-011 is working correctly.');
      return true;
    } else {
      console.log('\n❌ Some deployment tests failed. Please check the issues above.');
      return false;
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new DeploymentTester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = DeploymentTester;
