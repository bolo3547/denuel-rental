import { detectProvider, collectPayment } from '../lib/mobile-money';

// Mock uuid to avoid ES module issues in Jest
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123',
}));

describe('Mobile Money Module', () => {
  describe('detectProvider', () => {
    it('detects Airtel from phone number', () => {
      expect(detectProvider('0977123456')).toBe('AIRTEL');
      expect(detectProvider('0771234567')).toBe('AIRTEL');
      expect(detectProvider('+260977123456')).toBe('AIRTEL');
      expect(detectProvider('260771234567')).toBe('AIRTEL');
    });

    it('detects MTN from phone number', () => {
      expect(detectProvider('0967123456')).toBe('MTN');
      expect(detectProvider('0761234567')).toBe('MTN');
      expect(detectProvider('+260967123456')).toBe('MTN');
      expect(detectProvider('260761234567')).toBe('MTN');
    });

    it('returns null for unknown providers', () => {
      expect(detectProvider('0951234567')).toBe(null);
      expect(detectProvider('0811234567')).toBe(null);
    });
  });

  describe('collectPayment', () => {
    it('validates amount limits', async () => {
      const result = await collectPayment({
        phone: '0977123456',
        amount: 60000, // Over limit
        reference: 'TEST123',
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid amount');
    });

    it('rejects invalid phone numbers', async () => {
      const result = await collectPayment({
        phone: '0951234567', // Unknown provider
        amount: 100,
        reference: 'TEST123',
      });
      
      expect(result.success).toBe(false);
    });

    it('returns success in dev mode for valid requests', async () => {
      const result = await collectPayment({
        phone: '0977123456',
        amount: 100,
        reference: 'TEST123',
      });
      
      expect(result.success).toBe(true);
      expect(result.provider).toBe('AIRTEL');
      expect(result.transactionId).toBeDefined();
    });
  });
});
