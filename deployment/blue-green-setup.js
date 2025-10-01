/**
 * MVP-011: Blue/Green Deployment Setup
 * 
 * Dit script implementeert een blue/green deployment systeem voor de chatbox widget.
 * Het zorgt voor zero-downtime deployments door traffic tussen twee identieke environments te routeren.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

class BlueGreenDeployment {
  constructor() {
    this.app = express();
    this.currentEnvironment = 'blue'; // 'blue' of 'green'
    this.environments = {
      blue: {
        port: 3000,
        status: 'active',
        version: '1.0.0',
        health: 'healthy'
      },
      green: {
        port: 3001,
        status: 'standby',
        version: '1.0.0',
        health: 'healthy'
      }
    };
    
    this.deploymentHistory = [];
    this.setupRoutes();
  }

  setupRoutes() {
    // Health check endpoint voor load balancer
    this.app.get('/health', (req, res) => {
      const current = this.environments[this.currentEnvironment];
      res.json({
        environment: this.currentEnvironment,
        status: current.status,
        version: current.version,
        health: current.health,
        timestamp: new Date().toISOString()
      });
    });

    // Deployment status endpoint
    this.app.get('/deployment/status', (req, res) => {
      res.json({
        currentEnvironment: this.currentEnvironment,
        environments: this.environments,
        deploymentHistory: this.deploymentHistory.slice(-10), // Laatste 10 deployments
        timestamp: new Date().toISOString()
      });
    });

    // Switch environment endpoint (rollback)
    this.app.post('/deployment/switch', (req, res) => {
      const targetEnvironment = this.currentEnvironment === 'blue' ? 'green' : 'blue';
      const switchResult = this.switchEnvironment(targetEnvironment);
      
      res.json({
        success: switchResult.success,
        message: switchResult.message,
        previousEnvironment: this.currentEnvironment === 'blue' ? 'green' : 'blue',
        currentEnvironment: this.currentEnvironment,
        timestamp: new Date().toISOString()
      });
    });

    // Deploy to standby environment
    this.app.post('/deployment/deploy', (req, res) => {
      const deployResult = this.deployToStandby();
      
      res.json({
        success: deployResult.success,
        message: deployResult.message,
        standbyEnvironment: deployResult.standbyEnvironment,
        version: deployResult.version,
        timestamp: new Date().toISOString()
      });
    });

    // Rollback endpoint
    this.app.post('/deployment/rollback', (req, res) => {
      const rollbackResult = this.rollback();
      
      res.json({
        success: rollbackResult.success,
        message: rollbackResult.message,
        previousVersion: rollbackResult.previousVersion,
        currentVersion: rollbackResult.currentVersion,
        timestamp: new Date().toISOString()
      });
    });

    // Proxy requests to current active environment
    this.app.use('*', (req, res) => {
      this.proxyToActiveEnvironment(req, res);
    });
  }

  switchEnvironment(targetEnvironment) {
    try {
      // Validate target environment health
      const target = this.environments[targetEnvironment];
      if (target.health !== 'healthy') {
        return {
          success: false,
          message: `Cannot switch to ${targetEnvironment}: environment is not healthy`
        };
      }

      // Log the switch
      const switchEvent = {
        type: 'environment_switch',
        from: this.currentEnvironment,
        to: targetEnvironment,
        timestamp: new Date().toISOString(),
        version: target.version
      };

      this.deploymentHistory.push(switchEvent);

      // Update status
      this.environments[this.currentEnvironment].status = 'standby';
      this.environments[targetEnvironment].status = 'active';
      this.currentEnvironment = targetEnvironment;

      console.log(`🔄 Environment switched: ${switchEvent.from} → ${switchEvent.to} (v${target.version})`);

      return {
        success: true,
        message: `Successfully switched to ${targetEnvironment} environment`
      };

    } catch (error) {
      console.error('❌ Environment switch failed:', error);
      return {
        success: false,
        message: `Environment switch failed: ${error.message}`
      };
    }
  }

  deployToStandby() {
    try {
      const standbyEnvironment = this.currentEnvironment === 'blue' ? 'green' : 'blue';
      const newVersion = this.generateNewVersion();

      // Simulate deployment process
      console.log(`🚀 Deploying version ${newVersion} to ${standbyEnvironment} environment...`);
      
      // Update standby environment
      this.environments[standbyEnvironment].version = newVersion;
      this.environments[standbyEnvironment].health = 'healthy';
      this.environments[standbyEnvironment].status = 'standby';

      // Log deployment
      const deploymentEvent = {
        type: 'deployment',
        environment: standbyEnvironment,
        version: newVersion,
        timestamp: new Date().toISOString(),
        status: 'deployed'
      };

      this.deploymentHistory.push(deploymentEvent);

      console.log(`✅ Deployment successful: ${newVersion} to ${standbyEnvironment}`);

      return {
        success: true,
        message: `Successfully deployed version ${newVersion} to ${standbyEnvironment}`,
        standbyEnvironment,
        version: newVersion
      };

    } catch (error) {
      console.error('❌ Deployment failed:', error);
      return {
        success: false,
        message: `Deployment failed: ${error.message}`
      };
    }
  }

  rollback() {
    try {
      // Find previous successful deployment
      const previousDeployment = this.deploymentHistory
        .filter(event => event.type === 'environment_switch' && event.version !== this.environments[this.currentEnvironment].version)
        .slice(-1)[0];

      if (!previousDeployment) {
        return {
          success: false,
          message: 'No previous deployment found for rollback'
        };
      }

      const targetEnvironment = previousDeployment.to === 'blue' ? 'green' : 'blue';
      const rollbackResult = this.switchEnvironment(targetEnvironment);

      if (rollbackResult.success) {
        const rollbackEvent = {
          type: 'rollback',
          from: this.currentEnvironment === 'blue' ? 'green' : 'blue',
          to: this.currentEnvironment,
          previousVersion: this.environments[this.currentEnvironment].version,
          currentVersion: previousDeployment.version,
          timestamp: new Date().toISOString()
        };

        this.deploymentHistory.push(rollbackEvent);

        console.log(`🔄 Rollback successful: ${rollbackEvent.from} → ${rollbackEvent.to} (v${rollbackEvent.currentVersion})`);
      }

      return {
        success: rollbackResult.success,
        message: rollbackResult.success ? 'Rollback completed successfully' : rollbackResult.message,
        previousVersion: this.environments[this.currentEnvironment].version,
        currentVersion: previousDeployment.version
      };

    } catch (error) {
      console.error('❌ Rollback failed:', error);
      return {
        success: false,
        message: `Rollback failed: ${error.message}`
      };
    }
  }

  proxyToActiveEnvironment(req, res) {
    const activeEnvironment = this.environments[this.currentEnvironment];
    const targetUrl = `http://localhost:${activeEnvironment.port}${req.originalUrl}`;

    console.log(`🔄 Proxying ${req.method} ${req.originalUrl} to ${this.currentEnvironment} (${targetUrl})`);

    // Simple proxy implementation
    // In production, use a proper reverse proxy like nginx
    res.json({
      message: `Request proxied to ${this.currentEnvironment} environment`,
      targetUrl,
      environment: this.currentEnvironment,
      version: activeEnvironment.version
    });
  }

  generateNewVersion() {
    const now = new Date();
    const timestamp = now.getTime();
    const patch = Math.floor(timestamp / 1000) % 1000;
    
    // Simulate semantic versioning
    const major = 1;
    const minor = Math.floor(now.getMonth() / 3) + 1;
    
    return `${major}.${minor}.${patch}`;
  }

  start() {
    const port = 8080; // Load balancer port
    
    this.app.listen(port, () => {
      console.log(`🚀 MVP-011: Blue/Green Deployment Load Balancer running on http://localhost:${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`🔄 Deployment status: http://localhost:${port}/deployment/status`);
      console.log(`⚡ Switch environment: POST http://localhost:${port}/deployment/switch`);
      console.log(`🚀 Deploy to standby: POST http://localhost:${port}/deployment/deploy`);
      console.log(`🔄 Rollback: POST http://localhost:${port}/deployment/rollback`);
      console.log(`\n📋 Current Environment: ${this.currentEnvironment.toUpperCase()}`);
      console.log(`📋 Blue Environment: ${this.environments.blue.version} (${this.environments.blue.status})`);
      console.log(`📋 Green Environment: ${this.environments.green.version} (${this.environments.green.status})`);
    });
  }
}

// Start the blue/green deployment system
const deployment = new BlueGreenDeployment();
deployment.start();

module.exports = BlueGreenDeployment;
