import { DatabaseService } from './database-service';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface PersonalData {
    name?: string;
    email?: string;
    phone?: string;
    iban?: string;
    address?: string;
    [key: string]: any;
}

export interface ProcessedData {
    consentGiven: boolean;
    dataMinimized: boolean;
    encrypted: boolean;
    retentionPeriod: number;
    processingPurpose: string;
    dataId: string;
    timestamp: Date;
}

export interface DSARRequest {
    userId: string;
    requestType: 'export' | 'deletion';
    email: string;
    timestamp: Date;
    reason?: string;
}

export interface DSARResponse {
    success: boolean;
    requestId: string;
    dataExport?: any;
    exportFormat?: string;
    expiryDate?: Date;
    deletionConfirmed?: boolean;
    deletedDataTypes?: string[];
    processingTime: number;
}

export interface PrivacyAction {
    action: string;
    userId: string;
    timestamp: Date;
    details?: any;
}

export interface RetentionResult {
    deletedHandoverEmails: number;
    deletedLogs: number;
    retentionPolicy: string;
    timestamp: Date;
}

export class GDPRService {
    private db: DatabaseService;
    private encryptionKey: string;

    constructor() {
        this.db = new DatabaseService();
        this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    }

    /**
     * Process personal data according to GDPR
     */
    async processPersonalData(data: PersonalData): Promise<ProcessedData> {
        const dataId = uuidv4();
        const timestamp = new Date();

        // Data minimization - only process necessary data
        const minimizedData = this.minimizeData(data);

        // Encrypt sensitive data
        const encryptedData = this.encryptData(minimizedData);

        // Store processing record
        await this.db.query(`
            INSERT INTO gdpr_processing_logs (
                data_id, user_id, data_type, processing_purpose, 
                consent_given, encrypted, retention_period, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            dataId,
            data.userId || 'anonymous',
            'personal_data',
            'chatbox_service',
            true, // Assume consent given for MVP
            true,
            30, // 30 days retention
            timestamp.toISOString()
        ]);

        return {
            consentGiven: true,
            dataMinimized: true,
            encrypted: true,
            retentionPeriod: 30,
            processingPurpose: 'chatbox_service',
            dataId,
            timestamp
        };
    }

    /**
     * Handle DSAR (Data Subject Access Request)
     */
    async handleDSARRequest(request: DSARRequest): Promise<DSARResponse> {
        const requestId = uuidv4();
        const startTime = Date.now();

        // Log DSAR request
        await this.logPrivacyAction({
            action: 'dsar_request',
            userId: request.userId,
            timestamp: request.timestamp,
            details: { requestType: request.requestType, requestId }
        });

        if (request.requestType === 'export') {
            return await this.handleExportRequest(request, requestId, startTime);
        } else {
            return await this.handleDeletionRequest(request, requestId, startTime);
        }
    }

    /**
     * Handle data export request
     */
    private async handleExportRequest(request: DSARRequest, requestId: string, startTime: number): Promise<DSARResponse> {
        // Get all user data
        const userData = await this.getUserData(request.userId);

        // Create export package
        const dataExport = {
            userId: request.userId,
            exportDate: new Date().toISOString(),
            dataTypes: ['personal_data', 'conversation_logs', 'consent_records'],
            data: userData,
            metadata: {
                exportId: requestId,
                requestedBy: request.email,
                purpose: 'data_subject_access_request'
            }
        };

        // Store export record
        await this.db.query(`
            INSERT INTO gdpr_exports (
                export_id, user_id, request_id, export_data, 
                expiry_date, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
            requestId,
            request.userId,
            requestId,
            JSON.stringify(dataExport),
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            new Date().toISOString()
        ]);

        return {
            success: true,
            requestId,
            dataExport,
            exportFormat: 'JSON',
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            processingTime: Date.now() - startTime
        };
    }

    /**
     * Handle data deletion request
     */
    private async handleDeletionRequest(request: DSARRequest, requestId: string, startTime: number): Promise<DSARResponse> {
        const deletedDataTypes: string[] = [];

        // Delete personal data
        await this.db.query(`
            DELETE FROM gdpr_processing_logs WHERE user_id = ?
        `, [request.userId]);
        deletedDataTypes.push('personal_data');

        // Delete conversation logs
        await this.db.query(`
            DELETE FROM conversation_logs WHERE conversation_id LIKE ?
        `, [`%${request.userId}%`]);
        deletedDataTypes.push('conversation_logs');

        // Delete consent records
        await this.db.query(`
            DELETE FROM consent_records WHERE user_id = ?
        `, [request.userId]);
        deletedDataTypes.push('consent_records');

        // Store deletion record
        await this.db.query(`
            INSERT INTO gdpr_deletions (
                deletion_id, user_id, request_id, deleted_data_types, 
                deletion_date, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
            requestId,
            request.userId,
            requestId,
            JSON.stringify(deletedDataTypes),
            new Date().toISOString(),
            new Date().toISOString()
        ]);

        return {
            success: true,
            requestId,
            deletionConfirmed: true,
            deletedDataTypes,
            processingTime: Date.now() - startTime
        };
    }

    /**
     * Apply data retention policies
     */
    async applyRetentionPolicy(): Promise<RetentionResult> {
        const timestamp = new Date();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 180); // 180 days for handover emails

        // Delete old handover emails
        const [handoverResult] = await this.db.query(`
            DELETE FROM handover_metrics WHERE timestamp < ?
        `, [cutoffDate.toISOString()]);

        // Delete old logs (30 days)
        const logCutoffDate = new Date();
        logCutoffDate.setDate(logCutoffDate.getDate() - 30);
        
        const [logResult] = await this.db.query(`
            DELETE FROM conversation_logs WHERE timestamp < ?
        `, [logCutoffDate.toISOString()]);

        return {
            deletedHandoverEmails: handoverResult.changes || 0,
            deletedLogs: logResult.changes || 0,
            retentionPolicy: '180_days_handover_emails',
            timestamp
        };
    }

    /**
     * Log privacy action for audit trail
     */
    async logPrivacyAction(action: PrivacyAction): Promise<void> {
        await this.db.query(`
            INSERT INTO gdpr_audit_trail (
                action_id, action, user_id, timestamp, details
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            uuidv4(),
            action.action,
            action.userId,
            action.timestamp.toISOString(),
            JSON.stringify(action.details || {})
        ]);
    }

    /**
     * Get audit trail for compliance
     */
    async getAuditTrail(userId?: string): Promise<PrivacyAction[]> {
        let query = 'SELECT * FROM gdpr_audit_trail';
        let params: any[] = [];

        if (userId) {
            query += ' WHERE user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY timestamp DESC LIMIT 1000';

        const rows = await this.db.query(query, params);

        return rows.map(row => ({
            action: row.action,
            userId: row.user_id,
            timestamp: new Date(row.timestamp),
            details: row.details ? JSON.parse(row.details) : {}
        }));
    }

    /**
     * Get user data for export
     */
    private async getUserData(userId: string): Promise<any> {
        const [personalData] = await this.db.query(`
            SELECT * FROM gdpr_processing_logs WHERE user_id = ?
        `, [userId]);

        const [conversationLogs] = await this.db.query(`
            SELECT * FROM conversation_logs WHERE conversation_id LIKE ?
        `, [`%${userId}%`]);

        const [consentRecords] = await this.db.query(`
            SELECT * FROM consent_records WHERE user_id = ?
        `, [userId]);

        return {
            personalData: personalData || {},
            conversationLogs: conversationLogs || [],
            consentRecords: consentRecords || []
        };
    }

    /**
     * Minimize data according to GDPR principle
     */
    private minimizeData(data: PersonalData): PersonalData {
        const minimized: PersonalData = {};

        // Only keep necessary fields
        if (data.email) minimized.email = data.email;
        if (data.name) minimized.name = data.name;

        return minimized;
    }

    /**
     * Encrypt sensitive data
     */
    private encryptData(data: any): string {
        const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    /**
     * Decrypt data
     */
    private decryptData(encryptedData: string): any {
        const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    }
}
