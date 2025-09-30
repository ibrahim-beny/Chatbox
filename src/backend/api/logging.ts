import { Request, Response } from 'express';
import { LoggingService } from '../services/logging-service';
import { MonitoringService } from '../services/monitoring-service';

const loggingService = new LoggingService();
const monitoringService = new MonitoringService();

/**
 * Get logging metrics for tenant
 */
export const getLoggingMetrics = async (req: Request, res: Response) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID required' 
            });
        }

        const metrics = await loggingService.getLogMetrics(tenantId);
        
        res.json({
            success: true,
            metrics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting logging metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get logging metrics'
        });
    }
};

/**
 * Get conversation logs
 */
export const getConversationLogs = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const tenantId = req.headers['x-tenant-id'] as string;
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID required' 
            });
        }

        const logs = await loggingService.getConversationLogs(conversationId);
        
        // Filter logs by tenant for security
        const tenantLogs = logs.filter(log => log.tenantId === tenantId);
        
        res.json({
            success: true,
            logs: tenantLogs,
            count: tenantLogs.length
        });
    } catch (error) {
        console.error('Error getting conversation logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get conversation logs'
        });
    }
};

/**
 * Get tenant logs
 */
export const getTenantLogs = async (req: Request, res: Response) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        const limit = parseInt(req.query.limit as string) || 100;
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID required' 
            });
        }

        const logs = await loggingService.getTenantLogs(tenantId, limit);
        
        res.json({
            success: true,
            logs,
            count: logs.length,
            limit
        });
    } catch (error) {
        console.error('Error getting tenant logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get tenant logs'
        });
    }
};

/**
 * Log conversation start
 */
export const logConversationStart = async (req: Request, res: Response) => {
    try {
        const { tenantId, conversationId } = req.body;
        
        if (!tenantId || !conversationId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID and conversation ID required' 
            });
        }

        const logEntry = await loggingService.logConversationStart({
            tenantId,
            conversationId,
            timestamp: new Date()
        });
        
        res.json({
            success: true,
            logEntry
        });
    } catch (error) {
        console.error('Error logging conversation start:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to log conversation start'
        });
    }
};

/**
 * Log AI response
 */
export const logAIResponse = async (req: Request, res: Response) => {
    try {
        const { tenantId, conversationId, latencyMs, confidence } = req.body;
        
        if (!tenantId || !conversationId || latencyMs === undefined || confidence === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: 'All fields required: tenantId, conversationId, latencyMs, confidence' 
            });
        }

        const logEntry = await loggingService.logAIResponse({
            tenantId,
            conversationId,
            latencyMs,
            confidence,
            timestamp: new Date()
        });
        
        res.json({
            success: true,
            logEntry
        });
    } catch (error) {
        console.error('Error logging AI response:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to log AI response'
        });
    }
};

/**
 * Log error
 */
export const logError = async (req: Request, res: Response) => {
    try {
        const { tenantId, conversationId, error, endpoint } = req.body;
        
        if (!tenantId || !conversationId || !error) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID, conversation ID, and error required' 
            });
        }

        const errorObj = new Error(error);
        const logEntry = await loggingService.logError(errorObj, {
            tenantId,
            conversationId,
            endpoint,
            timestamp: new Date()
        });
        
        res.json({
            success: true,
            logEntry
        });
    } catch (error) {
        console.error('Error logging error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to log error'
        });
    }
};

/**
 * Cleanup old logs
 */
export const cleanupOldLogs = async (req: Request, res: Response) => {
    try {
        const result = await loggingService.cleanupOldLogs();
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('Error cleaning up old logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cleanup old logs'
        });
    }
};
