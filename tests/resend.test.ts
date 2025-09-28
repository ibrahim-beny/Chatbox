import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmail } from '../lib/email.js';

// Mock Resend
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn()
    }
  }))
}));

describe('Resend Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send email successfully', async () => {
    const mockSend = vi.fn().mockResolvedValue({ id: 'test-email-id' });
    const { Resend } = await import('resend');
    const mockResend = new Resend('test-key');
    mockResend.emails.send = mockSend;

    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test HTML</p>'
    });

    expect(mockSend).toHaveBeenCalledWith({
      from: 'handover@updates.jouwdomein.com',
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test HTML</p>'
    });
    expect(result).toEqual({ id: 'test-email-id' });
  });

  it('should handle email sending errors', async () => {
    const mockSend = vi.fn().mockRejectedValue(new Error('Send failed'));
    const { Resend } = await import('resend');
    const mockResend = new Resend('test-key');
    mockResend.emails.send = mockSend;

    await expect(sendEmail({
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test HTML</p>'
    })).rejects.toThrow('Send failed');
  });
});

describe('Handover Endpoint', () => {
  it('should return 200 for valid request', async () => {
    const response = await fetch('http://localhost:3000/handover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenantId: 'test-tenant',
        conversationId: 'test-conversation',
        userEmail: 'test@example.com',
        transcriptHtml: '<p>Test transcript</p>'
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.status).toBe('sent');
  });

  it('should return 400 for invalid email', async () => {
    const response = await fetch('http://localhost:3000/handover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenantId: 'test-tenant',
        conversationId: 'test-conversation',
        userEmail: 'invalid-email',
        transcriptHtml: '<p>Test transcript</p>'
      })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.error).toBe('invalid_email');
  });

  it('should return 502 for send failure', async () => {
    // Mock sendEmail to throw error
    vi.doMock('../lib/email.js', () => ({
      sendEmail: vi.fn().mockRejectedValue(new Error('Send failed'))
    }));

    const response = await fetch('http://localhost:3000/handover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenantId: 'test-tenant',
        conversationId: 'test-conversation',
        userEmail: 'test@example.com',
        transcriptHtml: '<p>Test transcript</p>'
      })
    });

    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.ok).toBe(false);
    expect(data.error).toBe('send_failed');
  });
});
