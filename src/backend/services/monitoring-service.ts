import { DatabaseService } from './database-service';
import { LoggingService } from './logging-service';

export interface DashboardMetrics {
    totalConversations: number;
    aiLatencyP50: number;
    aiLatencyP95: number;
    handoverRatio: number;
    handoverCount: number;
    errorRate: number;
    lastUpdated: Date;
}

export interface HandoverMetrics {
    handoverCount: number;
    handoverRatio: number;
    reasons: Record<string, number>;
    lastUpdated: Date;
}

export interface AILatencyMetrics {
    p50: number;
    p95: number;
    average: number;
    max: number;
    min: number;
    sampleCount: number;
}

export class MonitoringService {
    private db: DatabaseService;
    private loggingService: LoggingService;

    constructor() {
        this.db = new DatabaseService();
        this.loggingService = new LoggingService();
    }

    /**
     * Record AI response metrics
     */
    async recordAIResponse(data: {
        tenantId: string;
        conversationId: string;
        latencyMs: number;
        confidence: number;
    }): Promise<void> {
        // Log the AI response
        await this.loggingService.logAIResponse({
            tenantId: data.tenantId,
            conversationId: data.conversationId,
            latencyMs: data.latencyMs,
            confidence: data.confidence,
            timestamp: new Date()
        });

        // Store metrics for dashboard
        await this.db.query(`
            INSERT INTO ai_metrics (
                tenant_id, conversation_id, latency_ms, confidence, timestamp
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            data.tenantId,
            data.conversationId,
            data.latencyMs,
            data.confidence,
            new Date().toISOString()
        ]);
    }

    /**
     * Record handover event
     */
    async recordHandover(data: {
        tenantId: string;
        conversationId: string;
        reason: string;
        timestamp?: Date;
    }): Promise<void> {
        const timestamp = data.timestamp || new Date();

        // Log the handover
        await this.loggingService.logConversationStatus({
            tenantId: data.tenantId,
            conversationId: data.conversationId,
            status: 'handover',
            timestamp
        });

        // Store handover metrics
        await this.db.query(`
            INSERT INTO handover_metrics (
                tenant_id, conversation_id, reason, timestamp
            ) VALUES (?, ?, ?, ?)
        `, [
            data.tenantId,
            data.conversationId,
            data.reason,
            timestamp.toISOString()
        ]);
    }

    /**
     * Get dashboard metrics for tenant
     */
    async getDashboardMetrics(tenantId: string): Promise<DashboardMetrics> {
        const [conversationCount] = await this.db.query(`
            SELECT COUNT(DISTINCT conversation_id) as total_conversations
            FROM conversation_logs
            WHERE tenant_id = ?
        `, [tenantId]);

        const [handoverCount] = await this.db.query(`
            SELECT COUNT(*) as handover_count
            FROM handover_metrics
            WHERE tenant_id = ?
        `, [tenantId]);

        const [errorCount] = await this.db.query(`
            SELECT COUNT(*) as error_count
            FROM conversation_logs
            WHERE tenant_id = ? AND event = 'error'
        `, [tenantId]);

        const latencyMetrics = await this.getAILatencyMetrics(tenantId);

        const totalConversations = conversationCount.total_conversations || 0;
        const handoverCountValue = handoverCount.handover_count || 0;
        const errorCountValue = errorCount.error_count || 0;

        return {
            totalConversations,
            aiLatencyP50: latencyMetrics.p50,
            aiLatencyP95: latencyMetrics.p95,
            handoverRatio: totalConversations > 0 ? handoverCountValue / totalConversations : 0,
            handoverCount: handoverCountValue,
            errorRate: totalConversations > 0 ? errorCountValue / totalConversations : 0,
            lastUpdated: new Date()
        };
    }

    /**
     * Get AI latency metrics
     */
    async getAILatencyMetrics(tenantId: string): Promise<AILatencyMetrics> {
        const rows = await this.db.query(`
            SELECT latency_ms
            FROM ai_metrics
            WHERE tenant_id = ?
            ORDER BY latency_ms
        `, [tenantId]);

        if (rows.length === 0) {
            return {
                p50: 0,
                p95: 0,
                average: 0,
                max: 0,
                min: 0,
                sampleCount: 0
            };
        }

        const latencies = rows.map(row => row.latency_ms);
        const sortedLatencies = latencies.sort((a, b) => a - b);

        const p50Index = Math.floor(sortedLatencies.length * 0.5);
        const p95Index = Math.floor(sortedLatencies.length * 0.95);

        return {
            p50: sortedLatencies[p50Index] || 0,
            p95: sortedLatencies[p95Index] || 0,
            average: latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length,
            max: Math.max(...latencies),
            min: Math.min(...latencies),
            sampleCount: latencies.length
        };
    }

    /**
     * Get handover metrics
     */
    async getHandoverMetrics(tenantId: string): Promise<HandoverMetrics> {
        const [handoverCount] = await this.db.query(`
            SELECT COUNT(*) as handover_count
            FROM handover_metrics
            WHERE tenant_id = ?
        `, [tenantId]);

        const [conversationCount] = await this.db.query(`
            SELECT COUNT(DISTINCT conversation_id) as total_conversations
            FROM conversation_logs
            WHERE tenant_id = ?
        `, [tenantId]);

        const reasonRows = await this.db.query(`
            SELECT reason, COUNT(*) as count
            FROM handover_metrics
            WHERE tenant_id = ?
            GROUP BY reason
        `, [tenantId]);

        const reasons: Record<string, number> = {};
        reasonRows.forEach(row => {
            reasons[row.reason] = row.count;
        });

        const totalConversations = conversationCount.total_conversations || 0;
        const handoverCountValue = handoverCount.handover_count || 0;

        return {
            handoverCount: handoverCountValue,
            handoverRatio: totalConversations > 0 ? handoverCountValue / totalConversations : 0,
            reasons,
            lastUpdated: new Date()
        };
    }

    /**
     * Get real-time metrics for monitoring
     */
    async getRealTimeMetrics(tenantId: string): Promise<{
        activeConversations: number;
        lastHourConversations: number;
        averageResponseTime: number;
        errorRate: number;
    }> {
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        const [activeConversations] = await this.db.query(`
            SELECT COUNT(DISTINCT conversation_id) as active_conversations
            FROM conversation_logs
            WHERE tenant_id = ? AND timestamp > ? AND status != 'completed'
        `, [tenantId, oneHourAgo.toISOString()]);

        const [lastHourConversations] = await this.db.query(`
            SELECT COUNT(DISTINCT conversation_id) as last_hour_conversations
            FROM conversation_logs
            WHERE tenant_id = ? AND timestamp > ?
        `, [tenantId, oneHourAgo.toISOString()]);

        const [averageResponseTime] = await this.db.query(`
            SELECT AVG(latency_ms) as avg_response_time
            FROM ai_metrics
            WHERE tenant_id = ? AND timestamp > ?
        `, [tenantId, oneHourAgo.toISOString()]);

        const [errorCount] = await this.db.query(`
            SELECT COUNT(*) as error_count
            FROM conversation_logs
            WHERE tenant_id = ? AND timestamp > ? AND event = 'error'
        `, [tenantId, oneHourAgo.toISOString()]);

        const totalConversations = lastHourConversations.last_hour_conversations || 0;
        const errorCountValue = errorCount.error_count || 0;

        return {
            activeConversations: activeConversations.active_conversations || 0,
            lastHourConversations: totalConversations,
            averageResponseTime: averageResponseTime.avg_response_time || 0,
            errorRate: totalConversations > 0 ? errorCountValue / totalConversations : 0
        };
    }

    /**
     * Cleanup old metrics (retention policy: 30 days)
     */
    async cleanupOldMetrics(): Promise<{ deletedCount: number }> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [aiMetricsResult] = await this.db.query(`
            DELETE FROM ai_metrics
            WHERE timestamp < ?
        `, [thirtyDaysAgo.toISOString()]);

        const [handoverMetricsResult] = await this.db.query(`
            DELETE FROM handover_metrics
            WHERE timestamp < ?
        `, [thirtyDaysAgo.toISOString()]);

        const totalDeleted = (aiMetricsResult.changes || 0) + (handoverMetricsResult.changes || 0);

        return { deletedCount: totalDeleted };
    }
}
