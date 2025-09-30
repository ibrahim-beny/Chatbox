import { Request, Response } from 'express';
import { ConsentService } from '../services/consent-service';

const consentService = new ConsentService();

/**
 * Request consent
 */
export const requestConsent = async (req: Request, res: Response) => {
    try {
        const { sessionId, tenantId, consentType } = req.body;
        
        if (!sessionId || !tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Session ID and tenant ID required' 
            });
        }

        const consentRequest = {
            sessionId,
            tenantId,
            timestamp: new Date(),
            consentType
        };

        const consent = await consentService.requestConsent(consentRequest);
        
        res.json({
            success: true,
            consent
        });
    } catch (error) {
        console.error('Error requesting consent:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to request consent'
        });
    }
};

/**
 * Give consent
 */
export const giveConsent = async (req: Request, res: Response) => {
    try {
        const { userId, consentType } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        if (!userId || !consentType) {
            return res.status(400).json({ 
                success: false, 
                error: 'User ID and consent type required' 
            });
        }

        const consent = await consentService.giveConsent(userId, consentType, ipAddress, userAgent);
        
        res.json({
            success: true,
            consent
        });
    } catch (error) {
        console.error('Error giving consent:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to give consent'
        });
    }
};

/**
 * Withdraw consent
 */
export const withdrawConsent = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'User ID required' 
            });
        }

        const withdrawal = await consentService.withdrawConsent(userId);
        
        res.json({
            success: true,
            withdrawal
        });
    } catch (error) {
        console.error('Error withdrawing consent:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to withdraw consent'
        });
    }
};

/**
 * Check consent status
 */
export const getConsentStatus = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'User ID required' 
            });
        }

        const status = await consentService.getConsentStatus(userId);
        
        res.json({
            success: true,
            status
        });
    } catch (error) {
        console.error('Error getting consent status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get consent status'
        });
    }
};

/**
 * Check if user has consent
 */
export const hasConsent = async (req: Request, res: Response) => {
    try {
        const { userId, consentType } = req.query;
        
        if (!userId || !consentType) {
            return res.status(400).json({ 
                success: false, 
                error: 'User ID and consent type required' 
            });
        }

        const hasConsentResult = await consentService.hasConsent(userId as string, consentType as string);
        
        res.json({
            success: true,
            hasConsent: hasConsentResult
        });
    } catch (error) {
        console.error('Error checking consent:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check consent'
        });
    }
};

/**
 * Get consent audit trail
 */
export const getConsentAuditTrail = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'User ID required' 
            });
        }

        const auditTrail = await consentService.getAuditTrail(userId);
        
        res.json({
            success: true,
            auditTrail,
            count: auditTrail.length
        });
    } catch (error) {
        console.error('Error getting consent audit trail:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get consent audit trail'
        });
    }
};

/**
 * Get consent statistics
 */
export const getConsentStatistics = async (req: Request, res: Response) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        
        const statistics = await consentService.getConsentStatistics(tenantId);
        
        res.json({
            success: true,
            statistics
        });
    } catch (error) {
        console.error('Error getting consent statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get consent statistics'
        });
    }
};

/**
 * Validate consent compliance
 */
export const validateConsentCompliance = async (req: Request, res: Response) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID required' 
            });
        }

        const compliance = await consentService.validateConsentCompliance(tenantId);
        
        res.json({
            success: true,
            compliance
        });
    } catch (error) {
        console.error('Error validating consent compliance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate consent compliance'
        });
    }
};

/**
 * Cleanup old consent records
 */
export const cleanupOldConsentRecords = async (req: Request, res: Response) => {
    try {
        const { daysOld } = req.body;
        
        const result = await consentService.cleanupOldConsentRecords(daysOld || 365);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('Error cleaning up old consent records:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cleanup old consent records'
        });
    }
};
