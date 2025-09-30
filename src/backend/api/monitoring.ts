import { Request, Response } from 'express';
import { MonitoringService } from '../services/monitoring-service';

const monitoringService = new MonitoringService();

/**
 * Get dashboard metrics
 */
export const getDashboardMetrics = async (req: Request, res: Response) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID required' 
            });
        }

        const metrics = await monitoringService.getDashboardMetrics(tenantId);
        
        res.json({
            success: true,
            metrics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting dashboard metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get dashboard metrics'
        });
    }
};

/**
 * Get AI latency metrics
 */
export const getAILatencyMetrics = async (req: Request, res: Response) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID required' 
            });
        }

        const metrics = await monitoringService.getAILatencyMetrics(tenantId);
        
        res.json({
            success: true,
            metrics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting AI latency metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get AI latency metrics'
        });
    }
};

/**
 * Get handover metrics
 */
export const getHandoverMetrics = async (req: Request, res: Response) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID required' 
            });
        }

        const metrics = await monitoringService.getHandoverMetrics(tenantId);
        
        res.json({
            success: true,
            metrics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting handover metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get handover metrics'
        });
    }
};

/**
 * Get real-time metrics
 */
export const getRealTimeMetrics = async (req: Request, res: Response) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID required' 
            });
        }

        const metrics = await monitoringService.getRealTimeMetrics(tenantId);
        
        res.json({
            success: true,
            metrics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting real-time metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get real-time metrics'
        });
    }
};

/**
 * Record AI response
 */
export const recordAIResponse = async (req: Request, res: Response) => {
    try {
        const { tenantId, conversationId, latencyMs, confidence } = req.body;
        
        if (!tenantId || !conversationId || latencyMs === undefined || confidence === undefined) {
            return res.status(400).json({ 
                success: false, 
                error: 'All fields required: tenantId, conversationId, latencyMs, confidence' 
            });
        }

        await monitoringService.recordAIResponse({
            tenantId,
            conversationId,
            latencyMs,
            confidence
        });
        
        res.json({
            success: true,
            message: 'AI response recorded'
        });
    } catch (error) {
        console.error('Error recording AI response:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to record AI response'
        });
    }
};

/**
 * Record handover
 */
export const recordHandover = async (req: Request, res: Response) => {
    try {
        const { tenantId, conversationId, reason } = req.body;
        
        if (!tenantId || !conversationId || !reason) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID, conversation ID, and reason required' 
            });
        }

        await monitoringService.recordHandover({
            tenantId,
            conversationId,
            reason
        });
        
        res.json({
            success: true,
            message: 'Handover recorded'
        });
    } catch (error) {
        console.error('Error recording handover:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to record handover'
        });
    }
};

/**
 * Cleanup old metrics
 */
export const cleanupOldMetrics = async (req: Request, res: Response) => {
    try {
        const result = await monitoringService.cleanupOldMetrics();
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('Error cleaning up old metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cleanup old metrics'
        });
    }
};
