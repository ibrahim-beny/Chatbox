import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GDPRService } from '../src/backend/services/gdpr-service';
import { PrivacyService } from '../src/backend/services/privacy-service';
import { ConsentService } from '../src/backend/services/consent-service';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('MVP-009: GDPR Dataverwerking & Privacy Controls', () => {
    let gdprService: GDPRService;
    let privacyService: PrivacyService;
    let consentService: ConsentService;

    beforeEach(() => {
        gdprService = new GDPRService();
        privacyService = new PrivacyService();
        consentService = new ConsentService();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Acceptatiecriteria Tests', () => {
        it('should process personal data according to GDPR', async () => {
            // Given: persoonsgegevens
            const personalData = {
                name: 'Jan Jansen',
                email: 'jan.jansen@example.com',
                phone: '06-12345678',
                iban: 'NL91ABNA0417164300'
            };
            
            // When: data verwerkt
            const processedData = await gdprService.processPersonalData(personalData);
            
            // Then: altijd volgens GDPR
            expect(processedData.consentGiven).toBe(true);
            expect(processedData.dataMinimized).toBe(true);
            expect(processedData.encrypted).toBe(true);
            expect(processedData.retentionPeriod).toBeDefined();
            expect(processedData.processingPurpose).toBeDefined();
        });

        it('should handle DSAR export request', async () => {
            // Given: inzageverzoek
            const dsarRequest = {
                userId: 'user-123',
                requestType: 'export',
                email: 'user@example.com',
                timestamp: new Date()
            };
            
            // When: user vraagt DSAR
            const dsarResponse = await gdprService.handleDSARRequest(dsarRequest);
            
            // Then: export of verwijdering
            expect(dsarResponse.success).toBe(true);
            expect(dsarResponse.requestId).toBeDefined();
            expect(dsarResponse.dataExport).toBeDefined();
            expect(dsarResponse.exportFormat).toBe('JSON');
            expect(dsarResponse.expiryDate).toBeDefined();
        });

        it('should handle DSAR deletion request', async () => {
            // Given: verwijderingsverzoek
            const dsarRequest = {
                userId: 'user-123',
                requestType: 'deletion',
                email: 'user@example.com',
                timestamp: new Date()
            };
            
            // When: user vraagt DSAR
            const dsarResponse = await gdprService.handleDSARRequest(dsarRequest);
            
            // Then: export of verwijdering
            expect(dsarResponse.success).toBe(true);
            expect(dsarResponse.requestId).toBeDefined();
            expect(dsarResponse.deletionConfirmed).toBe(true);
            expect(dsarResponse.deletedDataTypes).toContain('personal_data');
            expect(dsarResponse.deletedDataTypes).toContain('conversation_logs');
        });
    });

    describe('Privacy Controls Tests', () => {
        it('should request and store privacy consent', async () => {
            // Given: eerste bezoek
            const userSession = {
                sessionId: 'session-123',
                tenantId: 'demo-tenant',
                timestamp: new Date()
            };
            
            // When: privacy consent wordt gevraagd
            const consent = await consentService.requestConsent(userSession);
            
            // Then: consent wordt opgeslagen
            expect(consent.consentId).toBeDefined();
            expect(consent.consentGiven).toBe(false);
            expect(consent.consentType).toBe('privacy_policy');
            expect(consent.tenantId).toBe('demo-tenant');
            expect(consent.timestamp).toBeDefined();
        });

        it('should redact PII from logs', async () => {
            // Given: message with PII
            const message = 'Mijn naam is Jan Jansen, mijn email is jan.jansen@example.com en mijn telefoon is 06-12345678';
            
            // When: PII redactie wordt toegepast
            const redactedMessage = await privacyService.redactPII(message);
            
            // Then: PII wordt automatisch geredacteerd
            expect(redactedMessage).not.toContain('Jan Jansen');
            expect(redactedMessage).not.toContain('jan.jansen@example.com');
            expect(redactedMessage).not.toContain('06-12345678');
            expect(redactedMessage).toContain('[NAME_REDACTED]');
            expect(redactedMessage).toContain('[EMAIL_REDACTED]');
            expect(redactedMessage).toContain('[PHONE_REDACTED]');
        });

        it('should apply data retention policies', async () => {
            // Given: old data
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 200); // 200 days ago
            
            const oldHandoverEmail = {
                id: 'email-123',
                timestamp: oldDate,
                dataType: 'handover_email'
            };
            
            // When: retention policy wordt toegepast
            const retentionResult = await gdprService.applyRetentionPolicy();
            
            // Then: handover e-mails worden verwijderd na 180 dagen
            expect(retentionResult.deletedHandoverEmails).toBeGreaterThan(0);
            expect(retentionResult.deletedLogs).toBeGreaterThan(0);
            expect(retentionResult.retentionPolicy).toBe('180_days_handover_emails');
        });

        it('should encrypt data at rest and in transit', async () => {
            // Given: sensitive data
            const sensitiveData = {
                personalInfo: 'Jan Jansen',
                email: 'jan@example.com',
                conversationData: 'Sensitive conversation content'
            };
            
            // When: data wordt opgeslagen
            const encryptedData = await privacyService.encryptData(sensitiveData);
            
            // Then: data is versleuteld
            expect(encryptedData.encrypted).toBe(true);
            expect(encryptedData.encryptionAlgorithm).toBe('AES-256-GCM');
            expect(encryptedData.encryptedData).not.toContain('Jan Jansen');
            expect(encryptedData.encryptedData).not.toContain('jan@example.com');
        });
    });

    describe('Consent Management Tests', () => {
        it('should handle consent withdrawal', async () => {
            // Given: user with consent
            const userId = 'user-123';
            const consent = await consentService.giveConsent(userId, 'privacy_policy');
            
            // When: consent wordt ingetrokken
            const withdrawalResult = await consentService.withdrawConsent(userId);
            
            // Then: data wordt onmiddellijk verwijderd
            expect(withdrawalResult.success).toBe(true);
            expect(withdrawalResult.consentWithdrawn).toBe(true);
            expect(withdrawalResult.dataDeleted).toBe(true);
            expect(withdrawalResult.deletedDataTypes).toContain('personal_data');
        });

        it('should maintain consent audit trail', async () => {
            // Given: consent actions
            const userId = 'user-123';
            
            // When: consent wordt gegeven en ingetrokken
            await consentService.giveConsent(userId, 'privacy_policy');
            await consentService.withdrawConsent(userId);
            
            // Then: audit trail is compleet
            const auditTrail = await consentService.getAuditTrail(userId);
            expect(auditTrail).toHaveLength(2);
            expect(auditTrail[0].action).toBe('consent_given');
            expect(auditTrail[1].action).toBe('consent_withdrawn');
            expect(auditTrail[0].timestamp).toBeDefined();
            expect(auditTrail[1].timestamp).toBeDefined();
        });
    });

    describe('Multi-tenant Privacy Tests', () => {
        it('should isolate privacy settings per tenant', async () => {
            // Given: different tenants
            const tenant1 = 'tenant-1';
            const tenant2 = 'tenant-2';
            const userId = 'user-123';
            
            // When: privacy settings are configured
            await privacyService.setPrivacySettings(tenant1, { dataRetention: 30, piiRedaction: true });
            await privacyService.setPrivacySettings(tenant2, { dataRetention: 60, piiRedaction: false });
            
            // Then: privacy settings zijn geïsoleerd
            const settings1 = await privacyService.getPrivacySettings(tenant1);
            const settings2 = await privacyService.getPrivacySettings(tenant2);
            
            expect(settings1.dataRetention).toBe(30);
            expect(settings1.piiRedaction).toBe(true);
            expect(settings2.dataRetention).toBe(60);
            expect(settings2.piiRedaction).toBe(false);
        });
    });

    describe('Compliance Tests', () => {
        it('should maintain complete audit trail for compliance', async () => {
            // Given: privacy actions
            const actions = [
                { action: 'data_processed', userId: 'user-1', timestamp: new Date() },
                { action: 'consent_given', userId: 'user-2', timestamp: new Date() },
                { action: 'dsar_request', userId: 'user-3', timestamp: new Date() }
            ];
            
            // When: actions are logged
            for (const action of actions) {
                await gdprService.logPrivacyAction(action);
            }
            
            // Then: audit trail is compleet voor compliance
            const auditTrail = await gdprService.getAuditTrail();
            expect(auditTrail).toHaveLength(3);
            expect(auditTrail[0].action).toBe('data_processed');
            expect(auditTrail[1].action).toBe('consent_given');
            expect(auditTrail[2].action).toBe('dsar_request');
        });

        it('should prevent data leaks through PII filtering', async () => {
            // Given: data with PII
            const dataWithPII = {
                name: 'Jan Jansen',
                email: 'jan.jansen@example.com',
                phone: '06-12345678',
                iban: 'NL91ABNA0417164300',
                address: 'Hoofdstraat 123, 1234AB Amsterdam'
            };
            
            // When: data wordt gefilterd
            const filteredData = await privacyService.filterPII(dataWithPII);
            
            // Then: geen datalekken door automatische PII filtering
            expect(filteredData.name).toBe('[NAME_REDACTED]');
            expect(filteredData.email).toBe('[EMAIL_REDACTED]');
            expect(filteredData.phone).toBe('[PHONE_REDACTED]');
            expect(filteredData.iban).toBe('[IBAN_REDACTED]');
            expect(filteredData.address).toBe('[ADDRESS_REDACTED]');
        });
    });

    describe('API Endpoint Tests', () => {
        it('should provide GDPR API endpoints', async () => {
            // Given: API endpoints
            const baseUrl = 'http://localhost:3000';
            
            // When: API calls are made
            const response = await fetch(`${baseUrl}/api/gdpr/consent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-ID': 'demo-tenant'
                },
                body: JSON.stringify({
                    userId: 'test-user',
                    consentType: 'privacy_policy',
                    consentGiven: true
                })
            });
            
            // Then: API responds correctly
            expect(response.ok).toBe(true);
            
            const data = await response.json();
            expect(data).toHaveProperty('success');
            expect(data).toHaveProperty('consentId');
        });
    });
});
