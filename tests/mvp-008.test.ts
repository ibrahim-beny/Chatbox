import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoggingService } from '../src/backend/services/logging-service';
import { MonitoringService } from '../src/backend/services/monitoring-service';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('MVP-008: Logging & Monitoring', () => {
    let loggingService: LoggingService;
    let monitoringService: MonitoringService;

    beforeEach(() => {
        loggingService = new LoggingService();
        monitoringService = new MonitoringService();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Acceptatiecriteria Tests', () => {
        it('should generate unique log ID for each conversation', async () => {
            // Given: een gesprek
            const conversationId = 'test-conversation-123';
            
            // When: chatbox logt
            const logEntry = await loggingService.logConversationStart({
                tenantId: 'demo-tenant',
                conversationId,
                timestamp: new Date()
            });
            
            // Then: bevat log ID, timestamp, status
            expect(logEntry.logId).toBeDefined();
            expect(logEntry.timestamp).toBeDefined();
            expect(logEntry.status).toBe('started');
            expect(logEntry.tenantId).toBe('demo-tenant');
            expect(logEntry.conversationId).toBe(conversationId);
        });

        it('should track conversation status changes', async () => {
            // Given: een gesprek
            const conversationId = 'test-conversation-456';
            
            // When: gesprek verloopt
            await loggingService.logConversationStart({
                tenantId: 'demo-tenant',
                conversationId,
                timestamp: new Date()
            });
            
            await loggingService.logConversationStatus({
                tenantId: 'demo-tenant',
                conversationId,
                status: 'in_progress',
                timestamp: new Date()
            });
            
            await loggingService.logConversationStatus({
                tenantId: 'demo-tenant',
                conversationId,
                status: 'completed',
                timestamp: new Date()
            });
            
            // Then: status updates worden gelogd
            const logs = await loggingService.getConversationLogs(conversationId);
            expect(logs).toHaveLength(3);
            expect(logs[0].status).toBe('started');
            expect(logs[1].status).toBe('in_progress');
            expect(logs[2].status).toBe('completed');
        });

        it('should measure and log AI latency', async () => {
            // Given: AI response
            const startTime = Date.now();
            const endTime = startTime + 1500; // 1.5 seconds
            
            // When: AI response wordt gelogd
            const logEntry = await loggingService.logAIResponse({
                tenantId: 'demo-tenant',
                conversationId: 'test-conversation-789',
                latencyMs: endTime - startTime,
                confidence: 0.85,
                timestamp: new Date()
            });
            
            // Then: latency wordt gemeten en gelogd
            expect(logEntry.latencyMs).toBe(1500);
            expect(logEntry.confidence).toBe(0.85);
            expect(logEntry.event).toBe('ai_response');
        });

        it('should calculate and monitor handover ratio', async () => {
            // Given: monitoring service
            const tenantId = 'demo-tenant';
            
            // When: handover events worden gelogd
            await monitoringService.recordHandover({
                tenantId,
                conversationId: 'conv-1',
                reason: 'low_confidence',
                timestamp: new Date()
            });
            
            await monitoringService.recordHandover({
                tenantId,
                conversationId: 'conv-2',
                reason: 'user_request',
                timestamp: new Date()
            });
            
            // Then: ratio wordt berekend en gemonitord
            const metrics = await monitoringService.getHandoverMetrics(tenantId);
            expect(metrics.handoverCount).toBe(2);
            expect(metrics.handoverRatio).toBeGreaterThan(0);
        });
    });

    describe('NFR-checks Tests', () => {
        it('should filter PII from logs (Privacy)', async () => {
            // Given: log entry with PII
            const logEntry = {
                tenantId: 'demo-tenant',
                conversationId: 'test-conversation',
                message: 'Mijn email is john.doe@example.com en mijn telefoon is 06-12345678',
                timestamp: new Date()
            };
            
            // When: PII filtering is applied
            const filteredLog = await loggingService.logMessage(logEntry);
            
            // Then: PII wordt gefilterd uit logs
            expect(filteredLog.message).not.toContain('john.doe@example.com');
            expect(filteredLog.message).not.toContain('06-12345678');
            expect(filteredLog.message).toContain('[EMAIL_REDACTED]');
            expect(filteredLog.message).toContain('[PHONE_REDACTED]');
        });

        it('should enforce log retention policy (Reliability)', async () => {
            // Given: old log entries
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 35); // 35 days ago
            
            await loggingService.logConversationStart({
                tenantId: 'demo-tenant',
                conversationId: 'old-conversation',
                timestamp: oldDate
            });
            
            // When: cleanup is performed
            const cleanupResult = await loggingService.cleanupOldLogs();
            
            // Then: logs ≤30 dagen worden behouden
            expect(cleanupResult.deletedCount).toBeGreaterThan(0);
            
            const remainingLogs = await loggingService.getConversationLogs('old-conversation');
            expect(remainingLogs).toHaveLength(0);
        });
    });

    describe('Multi-tenant Tests', () => {
        it('should separate logs per tenant', async () => {
            // Given: different tenants
            const tenant1 = 'tenant-1';
            const tenant2 = 'tenant-2';
            const conversationId = 'shared-conversation-id';
            
            // When: logs are created for different tenants
            await loggingService.logConversationStart({
                tenantId: tenant1,
                conversationId,
                timestamp: new Date()
            });
            
            await loggingService.logConversationStart({
                tenantId: tenant2,
                conversationId,
                timestamp: new Date()
            });
            
            // Then: logs are correctly separated per tenant
            const tenant1Logs = await loggingService.getTenantLogs(tenant1);
            const tenant2Logs = await loggingService.getTenantLogs(tenant2);
            
            expect(tenant1Logs).toHaveLength(1);
            expect(tenant2Logs).toHaveLength(1);
            expect(tenant1Logs[0].tenantId).toBe(tenant1);
            expect(tenant2Logs[0].tenantId).toBe(tenant2);
        });
    });

    describe('Dashboard Metrics Tests', () => {
        it('should provide real-time metrics for dashboard', async () => {
            // Given: monitoring service
            const tenantId = 'demo-tenant';
            
            // When: various events are recorded
            await monitoringService.recordAIResponse({
                tenantId,
                conversationId: 'conv-1',
                latencyMs: 1200,
                confidence: 0.9
            });
            
            await monitoringService.recordAIResponse({
                tenantId,
                conversationId: 'conv-2',
                latencyMs: 800,
                confidence: 0.7
            });
            
            await monitoringService.recordHandover({
                tenantId,
                conversationId: 'conv-3',
                reason: 'low_confidence'
            });
            
            // Then: dashboard shows real-time metrics correctly
            const metrics = await monitoringService.getDashboardMetrics(tenantId);
            
            expect(metrics.aiLatencyP50).toBeDefined();
            expect(metrics.aiLatencyP95).toBeDefined();
            expect(metrics.handoverRatio).toBeDefined();
            expect(metrics.totalConversations).toBe(3);
            expect(metrics.handoverCount).toBe(1);
        });
    });

    describe('Error Logging Tests', () => {
        it('should log errors with context', async () => {
            // Given: an error occurs
            const error = new Error('AI service unavailable');
            const context = {
                tenantId: 'demo-tenant',
                conversationId: 'error-conversation',
                endpoint: '/api/ai/query',
                timestamp: new Date()
            };
            
            // When: error is logged
            const errorLog = await loggingService.logError(error, context);
            
            // Then: error is correctly logged with context
            expect(errorLog.error).toBe('AI service unavailable');
            expect(errorLog.tenantId).toBe('demo-tenant');
            expect(errorLog.conversationId).toBe('error-conversation');
            expect(errorLog.endpoint).toBe('/api/ai/query');
            expect(errorLog.timestamp).toBeDefined();
        });
    });

    describe('API Endpoint Tests', () => {
        it('should provide logging API endpoints', async () => {
            // Given: API endpoints
            const baseUrl = 'http://localhost:3000';
            
            // When: API calls are made
            const response = await fetch(`${baseUrl}/api/logging/metrics`, {
                method: 'GET',
                headers: {
                    'X-Tenant-ID': 'demo-tenant'
                }
            });
            
            // Then: API responds correctly
            expect(response.ok).toBe(true);
            
            const data = await response.json();
            expect(data).toHaveProperty('metrics');
            expect(data).toHaveProperty('timestamp');
        });
    });
});
