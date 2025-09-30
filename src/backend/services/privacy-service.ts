import { DatabaseService } from './database-service';
import crypto from 'crypto';

export interface PrivacySettings {
    dataRetention: number;
    piiRedaction: boolean;
    encryptionEnabled: boolean;
    auditLogging: boolean;
    consentRequired: boolean;
}

export interface EncryptedData {
    encrypted: boolean;
    encryptionAlgorithm: string;
    encryptedData: string;
    keyId?: string;
    timestamp: Date;
}

export class PrivacyService {
    private db: DatabaseService;
    private encryptionKey: string;

    constructor() {
        this.db = new DatabaseService();
        this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    }

    /**
     * Redact PII from text
     */
    async redactPII(text: string): Promise<string> {
        let redactedText = text;

        // Name patterns (Dutch names)
        redactedText = redactedText.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME_REDACTED]');

        // Email pattern
        redactedText = redactedText.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');

        // Phone pattern (Dutch)
        redactedText = redactedText.replace(/\b(06|0031|\\+31)[-\s]?[0-9]{8,9}\b/g, '[PHONE_REDACTED]');

        // IBAN pattern
        redactedText = redactedText.replace(/\b[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}\b/g, '[IBAN_REDACTED]');

        // Address pattern (Dutch)
        redactedText = redactedText.replace(/\b[A-Za-z]+straat\s+\d+[A-Za-z]?,\s*\d{4}[A-Z]{2}\s+[A-Za-z]+\b/g, '[ADDRESS_REDACTED]');

        // BSN pattern (Dutch social security number)
        redactedText = redactedText.replace(/\b\d{9}\b/g, '[BSN_REDACTED]');

        return redactedText;
    }

    /**
     * Filter PII from object
     */
    async filterPII(data: any): Promise<any> {
        const filteredData = { ...data };

        // Filter common PII fields
        const piiFields = ['name', 'email', 'phone', 'iban', 'address', 'bsn', 'postcode', 'city'];

        for (const field of piiFields) {
            if (filteredData[field]) {
                filteredData[field] = `[${field.toUpperCase()}_REDACTED]`;
            }
        }

        // Recursively filter nested objects
        for (const key in filteredData) {
            if (typeof filteredData[key] === 'object' && filteredData[key] !== null) {
                filteredData[key] = await this.filterPII(filteredData[key]);
            }
        }

        return filteredData;
    }

    /**
     * Encrypt data at rest
     */
    async encryptData(data: any): Promise<EncryptedData> {
        const timestamp = new Date();
        const algorithm = 'aes-256-gcm';
        
        // Generate random IV
        const iv = crypto.randomBytes(16);
        
        // Create cipher
        const cipher = crypto.createCipher(algorithm, this.encryptionKey);
        
        // Encrypt data
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // Get auth tag
        const authTag = cipher.getAuthTag();

        return {
            encrypted: true,
            encryptionAlgorithm: algorithm,
            encryptedData: encrypted,
            keyId: 'default-key',
            timestamp
        };
    }

    /**
     * Decrypt data
     */
    async decryptData(encryptedData: EncryptedData): Promise<any> {
        if (!encryptedData.encrypted) {
            return encryptedData.encryptedData;
        }

        const algorithm = encryptedData.encryptionAlgorithm;
        const decipher = crypto.createDecipher(algorithm, this.encryptionKey);
        
        let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }

    /**
     * Set privacy settings for tenant
     */
    async setPrivacySettings(tenantId: string, settings: PrivacySettings): Promise<void> {
        await this.db.query(`
            INSERT OR REPLACE INTO privacy_settings (
                tenant_id, data_retention, pii_redaction, encryption_enabled, 
                audit_logging, consent_required, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            tenantId,
            settings.dataRetention,
            settings.piiRedaction,
            settings.encryptionEnabled,
            settings.auditLogging,
            settings.consentRequired,
            new Date().toISOString()
        ]);
    }

    /**
     * Get privacy settings for tenant
     */
    async getPrivacySettings(tenantId: string): Promise<PrivacySettings> {
        const [row] = await this.db.query(`
            SELECT * FROM privacy_settings WHERE tenant_id = ?
        `, [tenantId]);

        if (!row) {
            // Return default settings
            return {
                dataRetention: 30,
                piiRedaction: true,
                encryptionEnabled: true,
                auditLogging: true,
                consentRequired: true
            };
        }

        return {
            dataRetention: row.data_retention,
            piiRedaction: row.pii_redaction,
            encryptionEnabled: row.encryption_enabled,
            auditLogging: row.audit_logging,
            consentRequired: row.consent_required
        };
    }

    /**
     * Check if data contains PII
     */
    async containsPII(data: any): Promise<boolean> {
        const dataString = JSON.stringify(data);
        
        // Check for common PII patterns
        const piiPatterns = [
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
            /\b(06|0031|\\+31)[-\s]?[0-9]{8,9}\b/, // Phone
            /\b[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}\b/, // IBAN
            /\b[A-Z][a-z]+ [A-Z][a-z]+\b/, // Name
            /\b\d{4}[A-Z]{2}\b/ // Postcode
        ];

        return piiPatterns.some(pattern => pattern.test(dataString));
    }

    /**
     * Log privacy action
     */
    async logPrivacyAction(action: string, userId: string, details?: any): Promise<void> {
        await this.db.query(`
            INSERT INTO privacy_audit_log (
                action_id, action, user_id, details, timestamp
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            crypto.randomUUID(),
            action,
            userId,
            JSON.stringify(details || {}),
            new Date().toISOString()
        ]);
    }

    /**
     * Get privacy audit log
     */
    async getPrivacyAuditLog(userId?: string, limit: number = 100): Promise<any[]> {
        let query = 'SELECT * FROM privacy_audit_log';
        let params: any[] = [];

        if (userId) {
            query += ' WHERE user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY timestamp DESC LIMIT ?';
        params.push(limit);

        const rows = await this.db.query(query, params);

        return rows.map(row => ({
            actionId: row.action_id,
            action: row.action,
            userId: row.user_id,
            details: row.details ? JSON.parse(row.details) : {},
            timestamp: new Date(row.timestamp)
        }));
    }

    /**
     * Validate privacy compliance
     */
    async validatePrivacyCompliance(tenantId: string): Promise<{
        compliant: boolean;
        issues: string[];
        score: number;
    }> {
        const settings = await this.getPrivacySettings(tenantId);
        const issues: string[] = [];
        let score = 100;

        // Check data retention
        if (settings.dataRetention > 180) {
            issues.push('Data retention exceeds 180 days for handover emails');
            score -= 20;
        }

        // Check PII redaction
        if (!settings.piiRedaction) {
            issues.push('PII redaction is disabled');
            score -= 30;
        }

        // Check encryption
        if (!settings.encryptionEnabled) {
            issues.push('Data encryption is disabled');
            score -= 25;
        }

        // Check audit logging
        if (!settings.auditLogging) {
            issues.push('Audit logging is disabled');
            score -= 15;
        }

        // Check consent
        if (!settings.consentRequired) {
            issues.push('Consent is not required');
            score -= 10;
        }

        return {
            compliant: issues.length === 0,
            issues,
            score: Math.max(0, score)
        };
    }
}
