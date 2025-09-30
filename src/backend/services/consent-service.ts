import { DatabaseService } from './database-service';
import { v4 as uuidv4 } from 'uuid';

export interface ConsentRequest {
    sessionId: string;
    tenantId: string;
    timestamp: Date;
    consentType?: string;
}

export interface ConsentRecord {
    consentId: string;
    userId: string;
    consentType: string;
    consentGiven: boolean;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
    tenantId: string;
}

export interface ConsentWithdrawal {
    success: boolean;
    consentWithdrawn: boolean;
    dataDeleted: boolean;
    deletedDataTypes: string[];
    timestamp: Date;
}

export interface AuditTrailEntry {
    action: string;
    userId: string;
    timestamp: Date;
    details?: any;
}

export class ConsentService {
    private db: DatabaseService;

    constructor() {
        this.db = new DatabaseService();
    }

    /**
     * Request consent from user
     */
    async requestConsent(session: ConsentRequest): Promise<ConsentRecord> {
        const consentId = uuidv4();
        const userId = session.sessionId; // For MVP, use sessionId as userId

        const consentRecord: ConsentRecord = {
            consentId,
            userId,
            consentType: session.consentType || 'privacy_policy',
            consentGiven: false,
            timestamp: session.timestamp,
            tenantId: session.tenantId
        };

        // Store consent request
        await this.db.query(`
            INSERT INTO consent_records (
                consent_id, user_id, consent_type, consent_given, 
                timestamp, tenant_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            consentRecord.consentId,
            consentRecord.userId,
            consentRecord.consentType,
            consentRecord.consentGiven,
            consentRecord.timestamp.toISOString(),
            consentRecord.tenantId,
            new Date().toISOString()
        ]);

        // Log consent request
        await this.logConsentAction('consent_requested', userId, {
            consentId,
            consentType: consentRecord.consentType,
            tenantId: session.tenantId
        });

        return consentRecord;
    }

    /**
     * Give consent
     */
    async giveConsent(userId: string, consentType: string, ipAddress?: string, userAgent?: string): Promise<ConsentRecord> {
        const consentId = uuidv4();
        const timestamp = new Date();

        const consentRecord: ConsentRecord = {
            consentId,
            userId,
            consentType,
            consentGiven: true,
            timestamp,
            ipAddress,
            userAgent,
            tenantId: 'default' // For MVP
        };

        // Store consent
        await this.db.query(`
            INSERT INTO consent_records (
                consent_id, user_id, consent_type, consent_given, 
                timestamp, ip_address, user_agent, tenant_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            consentRecord.consentId,
            consentRecord.userId,
            consentRecord.consentType,
            consentRecord.consentGiven,
            consentRecord.timestamp.toISOString(),
            consentRecord.ipAddress,
            consentRecord.userAgent,
            consentRecord.tenantId,
            new Date().toISOString()
        ]);

        // Log consent given
        await this.logConsentAction('consent_given', userId, {
            consentId,
            consentType,
            ipAddress,
            userAgent
        });

        return consentRecord;
    }

    /**
     * Withdraw consent
     */
    async withdrawConsent(userId: string): Promise<ConsentWithdrawal> {
        const timestamp = new Date();
        const deletedDataTypes: string[] = [];

        // Mark consent as withdrawn
        await this.db.query(`
            UPDATE consent_records 
            SET consent_given = false, withdrawn_at = ?
            WHERE user_id = ? AND consent_given = true
        `, [timestamp.toISOString(), userId]);

        // Delete personal data
        await this.db.query(`
            DELETE FROM gdpr_processing_logs WHERE user_id = ?
        `, [userId]);
        deletedDataTypes.push('personal_data');

        // Delete conversation logs
        await this.db.query(`
            DELETE FROM conversation_logs WHERE conversation_id LIKE ?
        `, [`%${userId}%`]);
        deletedDataTypes.push('conversation_logs');

        // Log consent withdrawal
        await this.logConsentAction('consent_withdrawn', userId, {
            deletedDataTypes,
            timestamp
        });

        return {
            success: true,
            consentWithdrawn: true,
            dataDeleted: true,
            deletedDataTypes,
            timestamp
        };
    }

    /**
     * Check if user has given consent
     */
    async hasConsent(userId: string, consentType: string): Promise<boolean> {
        const [row] = await this.db.query(`
            SELECT consent_given FROM consent_records 
            WHERE user_id = ? AND consent_type = ? AND consent_given = true
            ORDER BY timestamp DESC LIMIT 1
        `, [userId, consentType]);

        return !!row;
    }

    /**
     * Get consent status for user
     */
    async getConsentStatus(userId: string): Promise<{
        hasConsent: boolean;
        consentTypes: string[];
        lastConsentDate?: Date;
        consentRecords: ConsentRecord[];
    }> {
        const rows = await this.db.query(`
            SELECT * FROM consent_records 
            WHERE user_id = ? 
            ORDER BY timestamp DESC
        `, [userId]);

        const consentRecords: ConsentRecord[] = rows.map(row => ({
            consentId: row.consent_id,
            userId: row.user_id,
            consentType: row.consent_type,
            consentGiven: row.consent_given,
            timestamp: new Date(row.timestamp),
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
            tenantId: row.tenant_id
        }));

        const activeConsents = consentRecords.filter(record => record.consentGiven);
        const consentTypes = [...new Set(activeConsents.map(record => record.consentType))];
        const lastConsentDate = activeConsents.length > 0 ? activeConsents[0].timestamp : undefined;

        return {
            hasConsent: activeConsents.length > 0,
            consentTypes,
            lastConsentDate,
            consentRecords
        };
    }

    /**
     * Get audit trail for user
     */
    async getAuditTrail(userId: string): Promise<AuditTrailEntry[]> {
        const rows = await this.db.query(`
            SELECT * FROM consent_audit_trail 
            WHERE user_id = ? 
            ORDER BY timestamp DESC
        `, [userId]);

        return rows.map(row => ({
            action: row.action,
            userId: row.user_id,
            timestamp: new Date(row.timestamp),
            details: row.details ? JSON.parse(row.details) : {}
        }));
    }

    /**
     * Log consent action for audit trail
     */
    private async logConsentAction(action: string, userId: string, details?: any): Promise<void> {
        await this.db.query(`
            INSERT INTO consent_audit_trail (
                action_id, action, user_id, details, timestamp
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            uuidv4(),
            action,
            userId,
            JSON.stringify(details || {}),
            new Date().toISOString()
        ]);
    }

    /**
     * Get consent statistics
     */
    async getConsentStatistics(tenantId?: string): Promise<{
        totalConsents: number;
        activeConsents: number;
        withdrawnConsents: number;
        consentRate: number;
        consentTypes: Record<string, number>;
    }> {
        let query = 'SELECT * FROM consent_records';
        let params: any[] = [];

        if (tenantId) {
            query += ' WHERE tenant_id = ?';
            params.push(tenantId);
        }

        const rows = await this.db.query(query, params);

        const totalConsents = rows.length;
        const activeConsents = rows.filter(row => row.consent_given).length;
        const withdrawnConsents = totalConsents - activeConsents;
        const consentRate = totalConsents > 0 ? (activeConsents / totalConsents) * 100 : 0;

        const consentTypes: Record<string, number> = {};
        rows.forEach(row => {
            const type = row.consent_type;
            consentTypes[type] = (consentTypes[type] || 0) + 1;
        });

        return {
            totalConsents,
            activeConsents,
            withdrawnConsents,
            consentRate,
            consentTypes
        };
    }

    /**
     * Cleanup old consent records
     */
    async cleanupOldConsentRecords(daysOld: number = 365): Promise<{ deletedCount: number }> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const [result] = await this.db.query(`
            DELETE FROM consent_records 
            WHERE timestamp < ? AND consent_given = false
        `, [cutoffDate.toISOString()]);

        return { deletedCount: result.changes || 0 };
    }

    /**
     * Validate consent compliance
     */
    async validateConsentCompliance(tenantId: string): Promise<{
        compliant: boolean;
        issues: string[];
        score: number;
    }> {
        const stats = await this.getConsentStatistics(tenantId);
        const issues: string[] = [];
        let score = 100;

        // Check consent rate
        if (stats.consentRate < 80) {
            issues.push('Consent rate is below 80%');
            score -= 20;
        }

        // Check for required consent types
        const requiredTypes = ['privacy_policy', 'data_processing'];
        const missingTypes = requiredTypes.filter(type => !stats.consentTypes[type]);
        
        if (missingTypes.length > 0) {
            issues.push(`Missing required consent types: ${missingTypes.join(', ')}`);
            score -= 30;
        }

        // Check for high withdrawal rate
        const withdrawalRate = stats.totalConsents > 0 ? (stats.withdrawnConsents / stats.totalConsents) * 100 : 0;
        if (withdrawalRate > 20) {
            issues.push('High consent withdrawal rate');
            score -= 15;
        }

        return {
            compliant: issues.length === 0,
            issues,
            score: Math.max(0, score)
        };
    }
}
