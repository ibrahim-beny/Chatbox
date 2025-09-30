import { DatabaseService } from './database-service';
import { v4 as uuidv4 } from 'uuid';

export interface LogEntry {
    logId: string;
    tenantId: string;
    conversationId: string;
    event: string;
    status?: string;
    message?: string;
    latencyMs?: number;
    confidence?: number;
    error?: string;
    endpoint?: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

export interface ConversationLog {
    logId: string;
    tenantId: string;
    conversationId: string;
    event: string;
    status: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

export interface LogMetrics {
    totalLogs: number;
    errorCount: number;
    averageLatency: number;
    handoverCount: number;
    lastUpdated: Date;
}

export class LoggingService {
    private db: DatabaseService;

    constructor() {
        this.db = new DatabaseService();
    }

    /**
     * Log conversation start event
     */
    async logConversationStart(data: {
        tenantId: string;
        conversationId: string;
        timestamp: Date;
    }): Promise<LogEntry> {
        const logEntry: LogEntry = {
            logId: uuidv4(),
            tenantId: data.tenantId,
            conversationId: data.conversationId,
            event: 'conversation_start',
            status: 'started',
            timestamp: data.timestamp
        };

        await this.db.query(`
            INSERT INTO conversation_logs (
                log_id, tenant_id, conversation_id, event, status, timestamp, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            logEntry.logId,
            logEntry.tenantId,
            logEntry.conversationId,
            logEntry.event,
            logEntry.status,
            logEntry.timestamp.toISOString(),
            JSON.stringify(logEntry.metadata || {})
        ]);

        return logEntry;
    }

    /**
     * Log conversation status change
     */
    async logConversationStatus(data: {
        tenantId: string;
        conversationId: string;
        status: string;
        timestamp: Date;
    }): Promise<LogEntry> {
        const logEntry: LogEntry = {
            logId: uuidv4(),
            tenantId: data.tenantId,
            conversationId: data.conversationId,
            event: 'status_change',
            status: data.status,
            timestamp: data.timestamp
        };

        await this.db.query(`
            INSERT INTO conversation_logs (
                log_id, tenant_id, conversation_id, event, status, timestamp, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            logEntry.logId,
            logEntry.tenantId,
            logEntry.conversationId,
            logEntry.event,
            logEntry.status,
            logEntry.timestamp.toISOString(),
            JSON.stringify(logEntry.metadata || {})
        ]);

        return logEntry;
    }

    /**
     * Log AI response with latency and confidence
     */
    async logAIResponse(data: {
        tenantId: string;
        conversationId: string;
        latencyMs: number;
        confidence: number;
        timestamp: Date;
    }): Promise<LogEntry> {
        const logEntry: LogEntry = {
            logId: uuidv4(),
            tenantId: data.tenantId,
            conversationId: data.conversationId,
            event: 'ai_response',
            status: 'completed',
            latencyMs: data.latencyMs,
            confidence: data.confidence,
            timestamp: data.timestamp,
            metadata: {
                latencyMs: data.latencyMs,
                confidence: data.confidence
            }
        };

        await this.db.query(`
            INSERT INTO conversation_logs (
                log_id, tenant_id, conversation_id, event, status, latency_ms, confidence, timestamp, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            logEntry.logId,
            logEntry.tenantId,
            logEntry.conversationId,
            logEntry.event,
            logEntry.status,
            logEntry.latencyMs,
            logEntry.confidence,
            logEntry.timestamp.toISOString(),
            JSON.stringify(logEntry.metadata || {})
        ]);

        return logEntry;
    }

    /**
     * Log message with PII filtering
     */
    async logMessage(data: {
        tenantId: string;
        conversationId: string;
        message: string;
        timestamp: Date;
    }): Promise<LogEntry> {
        const filteredMessage = this.filterPII(data.message);
        
        const logEntry: LogEntry = {
            logId: uuidv4(),
            tenantId: data.tenantId,
            conversationId: data.conversationId,
            event: 'message',
            message: filteredMessage,
            timestamp: data.timestamp
        };

        await this.db.query(`
            INSERT INTO conversation_logs (
                log_id, tenant_id, conversation_id, event, message, timestamp, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            logEntry.logId,
            logEntry.tenantId,
            logEntry.conversationId,
            logEntry.event,
            logEntry.message,
            logEntry.timestamp.toISOString(),
            JSON.stringify(logEntry.metadata || {})
        ]);

        return logEntry;
    }

    /**
     * Log error with context
     */
    async logError(error: Error, context: {
        tenantId: string;
        conversationId: string;
        endpoint?: string;
        timestamp: Date;
    }): Promise<LogEntry> {
        const logEntry: LogEntry = {
            logId: uuidv4(),
            tenantId: context.tenantId,
            conversationId: context.conversationId,
            event: 'error',
            status: 'error',
            error: error.message,
            endpoint: context.endpoint,
            timestamp: context.timestamp,
            metadata: {
                error: error.message,
                stack: error.stack,
                endpoint: context.endpoint
            }
        };

        await this.db.query(`
            INSERT INTO conversation_logs (
                log_id, tenant_id, conversation_id, event, status, error, endpoint, timestamp, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            logEntry.logId,
            logEntry.tenantId,
            logEntry.conversationId,
            logEntry.event,
            logEntry.status,
            logEntry.error,
            logEntry.endpoint,
            logEntry.timestamp.toISOString(),
            JSON.stringify(logEntry.metadata || {})
        ]);

        return logEntry;
    }

    /**
     * Get conversation logs
     */
    async getConversationLogs(conversationId: string): Promise<ConversationLog[]> {
        const rows = await this.db.query(`
            SELECT log_id, tenant_id, conversation_id, event, status, timestamp, metadata
            FROM conversation_logs
            WHERE conversation_id = ?
            ORDER BY timestamp ASC
        `, [conversationId]);

        return rows.map(row => ({
            logId: row.log_id,
            tenantId: row.tenant_id,
            conversationId: row.conversation_id,
            event: row.event,
            status: row.status,
            timestamp: new Date(row.timestamp),
            metadata: row.metadata ? JSON.parse(row.metadata) : {}
        }));
    }

    /**
     * Get tenant logs
     */
    async getTenantLogs(tenantId: string, limit: number = 100): Promise<ConversationLog[]> {
        const rows = await this.db.query(`
            SELECT log_id, tenant_id, conversation_id, event, status, timestamp, metadata
            FROM conversation_logs
            WHERE tenant_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        `, [tenantId, limit]);

        return rows.map(row => ({
            logId: row.log_id,
            tenantId: row.tenant_id,
            conversationId: row.conversation_id,
            event: row.event,
            status: row.status,
            timestamp: new Date(row.timestamp),
            metadata: row.metadata ? JSON.parse(row.metadata) : {}
        }));
    }

    /**
     * Get log metrics for tenant
     */
    async getLogMetrics(tenantId: string): Promise<LogMetrics> {
        const [totalResult] = await this.db.query(`
            SELECT COUNT(*) as total_logs
            FROM conversation_logs
            WHERE tenant_id = ?
        `, [tenantId]);

        const [errorResult] = await this.db.query(`
            SELECT COUNT(*) as error_count
            FROM conversation_logs
            WHERE tenant_id = ? AND event = 'error'
        `, [tenantId]);

        const [latencyResult] = await this.db.query(`
            SELECT AVG(latency_ms) as avg_latency
            FROM conversation_logs
            WHERE tenant_id = ? AND latency_ms IS NOT NULL
        `, [tenantId]);

        const [handoverResult] = await this.db.query(`
            SELECT COUNT(*) as handover_count
            FROM conversation_logs
            WHERE tenant_id = ? AND event = 'handover'
        `, [tenantId]);

        return {
            totalLogs: totalResult.total_logs || 0,
            errorCount: errorResult.error_count || 0,
            averageLatency: latencyResult.avg_latency || 0,
            handoverCount: handoverResult.handover_count || 0,
            lastUpdated: new Date()
        };
    }

    /**
     * Cleanup old logs (retention policy: 30 days)
     */
    async cleanupOldLogs(): Promise<{ deletedCount: number }> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await this.db.query(`
            DELETE FROM conversation_logs
            WHERE timestamp < ?
        `, [thirtyDaysAgo.toISOString()]);

        return { deletedCount: result.changes || 0 };
    }

    /**
     * Filter PII from messages
     */
    private filterPII(message: string): string {
        let filtered = message;

        // Email pattern
        filtered = filtered.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');

        // Phone pattern (Dutch)
        filtered = filtered.replace(/\b(06|0031|\\+31)[-\s]?[0-9]{8,9}\b/g, '[PHONE_REDACTED]');

        // IBAN pattern
        filtered = filtered.replace(/\b[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}\b/g, '[IBAN_REDACTED]');

        return filtered;
    }
}
