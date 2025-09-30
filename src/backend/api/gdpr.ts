import { Request, Response } from 'express';
import { GDPRService } from '../services/gdpr-service';
import { PrivacyService } from '../services/privacy-service';
import { ConsentService } from '../services/consent-service';

const gdprService = new GDPRService();
const privacyService = new PrivacyService();
const consentService = new ConsentService();

/**
 * Process personal data according to GDPR
 */
export const processPersonalData = async (req: Request, res: Response) => {
    try {
        const { personalData } = req.body;
        const tenantId = req.headers['x-tenant-id'] as string;
        
        if (!personalData) {
            return res.status(400).json({ 
                success: false, 
                error: 'Personal data required' 
            });
        }

        const processedData = await gdprService.processPersonalData(personalData);
        
        res.json({
            success: true,
            processedData
        });
    } catch (error) {
        console.error('Error processing personal data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process personal data'
        });
    }
};

/**
 * Handle DSAR request
 */
export const handleDSARRequest = async (req: Request, res: Response) => {
    try {
        const { userId, requestType, email, reason } = req.body;
        const tenantId = req.headers['x-tenant-id'] as string;
        
        if (!userId || !requestType || !email) {
            return res.status(400).json({ 
                success: false, 
                error: 'User ID, request type, and email required' 
            });
        }

        if (!['export', 'deletion'].includes(requestType)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Request type must be "export" or "deletion"' 
            });
        }

        const dsarRequest = {
            userId,
            requestType,
            email,
            reason,
            timestamp: new Date()
        };

        const dsarResponse = await gdprService.handleDSARRequest(dsarRequest);
        
        res.json({
            success: true,
            dsarResponse
        });
    } catch (error) {
        console.error('Error handling DSAR request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to handle DSAR request'
        });
    }
};

/**
 * Apply data retention policies
 */
export const applyRetentionPolicy = async (req: Request, res: Response) => {
    try {
        const result = await gdprService.applyRetentionPolicy();
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('Error applying retention policy:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to apply retention policy'
        });
    }
};

/**
 * Get audit trail
 */
export const getAuditTrail = async (req: Request, res: Response) => {
    try {
        const { userId } = req.query;
        const tenantId = req.headers['x-tenant-id'] as string;
        
        const auditTrail = await gdprService.getAuditTrail(userId as string);
        
        res.json({
            success: true,
            auditTrail,
            count: auditTrail.length
        });
    } catch (error) {
        console.error('Error getting audit trail:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get audit trail'
        });
    }
};

/**
 * Redact PII from text
 */
export const redactPII = async (req: Request, res: Response) => {
    try {
        const { text } = req.body;
        const tenantId = req.headers['x-tenant-id'] as string;
        
        if (!text) {
            return res.status(400).json({ 
                success: false, 
                error: 'Text required' 
            });
        }

        const redactedText = await privacyService.redactPII(text);
        
        res.json({
            success: true,
            originalText: text,
            redactedText,
            piiDetected: text !== redactedText
        });
    } catch (error) {
        console.error('Error redacting PII:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to redact PII'
        });
    }
};

/**
 * Filter PII from data
 */
export const filterPII = async (req: Request, res: Response) => {
    try {
        const { data } = req.body;
        const tenantId = req.headers['x-tenant-id'] as string;
        
        if (!data) {
            return res.status(400).json({ 
                success: false, 
                error: 'Data required' 
            });
        }

        const filteredData = await privacyService.filterPII(data);
        const containsPII = await privacyService.containsPII(data);
        
        res.json({
            success: true,
            originalData: data,
            filteredData,
            containsPII
        });
    } catch (error) {
        console.error('Error filtering PII:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to filter PII'
        });
    }
};

/**
 * Encrypt data
 */
export const encryptData = async (req: Request, res: Response) => {
    try {
        const { data } = req.body;
        const tenantId = req.headers['x-tenant-id'] as string;
        
        if (!data) {
            return res.status(400).json({ 
                success: false, 
                error: 'Data required' 
            });
        }

        const encryptedData = await privacyService.encryptData(data);
        
        res.json({
            success: true,
            encryptedData
        });
    } catch (error) {
        console.error('Error encrypting data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to encrypt data'
        });
    }
};

/**
 * Get privacy settings
 */
export const getPrivacySettings = async (req: Request, res: Response) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID required' 
            });
        }

        const settings = await privacyService.getPrivacySettings(tenantId);
        
        res.json({
            success: true,
            settings
        });
    } catch (error) {
        console.error('Error getting privacy settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get privacy settings'
        });
    }
};

/**
 * Set privacy settings
 */
export const setPrivacySettings = async (req: Request, res: Response) => {
    try {
        const { settings } = req.body;
        const tenantId = req.headers['x-tenant-id'] as string;
        
        if (!tenantId || !settings) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID and settings required' 
            });
        }

        await privacyService.setPrivacySettings(tenantId, settings);
        
        res.json({
            success: true,
            message: 'Privacy settings updated'
        });
    } catch (error) {
        console.error('Error setting privacy settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to set privacy settings'
        });
    }
};

/**
 * Validate privacy compliance
 */
export const validatePrivacyCompliance = async (req: Request, res: Response) => {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        
        if (!tenantId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Tenant ID required' 
            });
        }

        const compliance = await privacyService.validatePrivacyCompliance(tenantId);
        
        res.json({
            success: true,
            compliance
        });
    } catch (error) {
        console.error('Error validating privacy compliance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate privacy compliance'
        });
    }
};
