# MVP-011: Rollback Playbook

## 🚨 Emergency Rollback Procedures

### Quick Reference (30-second rollback)

```bash
# 1. Check current environment status
curl http://localhost:8080/deployment/status

# 2. Immediate rollback to previous environment
curl -X POST http://localhost:8080/deployment/rollback

# 3. Verify rollback success
curl http://localhost:8080/health
```

### Detailed Rollback Procedures

#### 1. Automated Rollback (Recommended)
**Trigger:** Health check failures, error rate >5%, response time >3s

```bash
# Health check failure detected
curl -X POST http://localhost:8080/deployment/rollback

# Verify rollback
curl http://localhost:8080/deployment/status | jq '.currentEnvironment'
```

#### 2. Manual Rollback
**Trigger:** Customer complaints, performance issues, critical bugs

```bash
# Step 1: Check deployment history
curl http://localhost:8080/deployment/status | jq '.deploymentHistory[-5:]'

# Step 2: Identify target rollback version
# Find last known good version from deployment history

# Step 3: Execute rollback
curl -X POST http://localhost:8080/deployment/rollback

# Step 4: Verify environment health
curl http://localhost:8080/health | jq '.health'

# Step 5: Test critical functionality
curl -X POST http://localhost:8080/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"content": "test message", "tenantId": "demo-tenant"}'
```

#### 3. Emergency Procedures (< 30 minutes)

**Critical Issues (0-5 minutes):**
1. **Immediate rollback**: `curl -X POST http://localhost:8080/deployment/rollback`
2. **Verify**: Check health endpoint
3. **Monitor**: Watch error rates and response times

**Performance Issues (5-15 minutes):**
1. **Check metrics**: Review deployment status
2. **Identify issue**: Check logs for specific errors
3. **Rollback**: Execute rollback if issue is deployment-related
4. **Validate**: Test core functionality

**Customer Impact (15-30 minutes):**
1. **Assess impact**: Determine scope of issue
2. **Communicate**: Notify stakeholders if needed
3. **Rollback**: Execute rollback procedure
4. **Post-mortem**: Document incident and prevention measures

### Rollback Validation Checklist

- [ ] **Health Check**: `/health` returns `"health": "healthy"`
- [ ] **Environment Switch**: Current environment changed successfully
- [ ] **Version Verification**: Version matches expected rollback version
- [ ] **Core Functionality**: AI query endpoint responds correctly
- [ ] **Performance**: Response times < 3 seconds
- [ ] **Error Rate**: < 1% error rate
- [ ] **Monitoring**: All metrics back to normal levels

### Rollback Scenarios

#### Scenario 1: Database Migration Failure
```bash
# Symptoms: Database connection errors, 500 responses
# Action: Rollback to pre-migration version
curl -X POST http://localhost:8080/deployment/rollback

# Validation: Check database connectivity
curl http://localhost:8080/api/health
```

#### Scenario 2: API Breaking Changes
```bash
# Symptoms: Frontend errors, widget not loading
# Action: Rollback to compatible API version
curl -X POST http://localhost:8080/deployment/rollback

# Validation: Test widget loading
curl http://localhost:8080/dist/widget.iife.js
```

#### Scenario 3: Performance Degradation
```bash
# Symptoms: Slow responses, timeouts
# Action: Rollback to performant version
curl -X POST http://localhost:8080/deployment/rollback

# Validation: Performance test
time curl -X POST http://localhost:8080/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"content": "performance test"}'
```

### Post-Rollback Procedures

1. **Document Incident**
   - Record rollback reason and impact
   - Update deployment history with rollback event
   - Note any customer impact or communications

2. **Investigate Root Cause**
   - Analyze logs from failed deployment
   - Identify what caused the issue
   - Document findings for future prevention

3. **Update Deployment Process**
   - Improve testing procedures if needed
   - Update rollback triggers and thresholds
   - Enhance monitoring and alerting

4. **Communicate Status**
   - Update stakeholders on resolution
   - Share post-mortem findings if significant
   - Plan next deployment with fixes

### Monitoring and Alerting

#### Rollback Triggers
- **Health Check Failures**: 3 consecutive failures
- **Error Rate**: > 5% for 2 minutes
- **Response Time**: > 3 seconds average for 5 minutes
- **Memory Usage**: > 90% for 10 minutes
- **CPU Usage**: > 95% for 5 minutes

#### Alert Channels
- **Critical**: Immediate SMS/Phone call
- **Warning**: Email notification
- **Info**: Slack/Discord notification

#### Metrics to Monitor
- Environment health status
- Request success rate
- Average response time
- Memory and CPU usage
- Database connection pool status
- AI API response times

### Recovery Time Objectives (RTO)

- **Critical Issues**: < 2 minutes
- **Performance Issues**: < 5 minutes
- **Feature Issues**: < 15 minutes
- **Non-Critical Issues**: < 30 minutes

### Communication Templates

#### Rollback Notification
```
🚨 DEPLOYMENT ROLLBACK EXECUTED

Environment: [BLUE/GREEN]
Reason: [Brief description]
Impact: [Customer impact assessment]
ETA for resolution: [Time estimate]
Status: Monitoring recovery
```

#### Post-Rollback Summary
```
✅ ROLLBACK COMPLETED

Environment: [BLUE/GREEN]
Duration: [Time taken]
Customer Impact: [Assessment]
Root Cause: [Brief explanation]
Prevention: [Future measures]
Status: Stable and monitoring
```
