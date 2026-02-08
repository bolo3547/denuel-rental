import { formatZambianPhone, validateZambianPhone, sendSMS, SMS_TEMPLATES } from '../lib/sms';

describe('SMS Module', () => {
  describe('formatZambianPhone', () => {
    it('formats phone with country code', () => {
      expect(formatZambianPhone('0977123456')).toBe('+260977123456');
      expect(formatZambianPhone('260977123456')).toBe('+260977123456');
      expect(formatZambianPhone('+260977123456')).toBe('+260977123456');
    });

    it('handles different formats', () => {
      expect(formatZambianPhone('977123456')).toBe('+260977123456');
      expect(formatZambianPhone('0 977 123 456')).toBe('+260977123456');
    });
  });

  describe('validateZambianPhone', () => {
    it('validates correct Zambian numbers', () => {
      expect(validateZambianPhone('0977123456')).toBe(true);
      expect(validateZambianPhone('0967123456')).toBe(true);
      expect(validateZambianPhone('0957123456')).toBe(true);
      expect(validateZambianPhone('0771234567')).toBe(true);
      expect(validateZambianPhone('0761234567')).toBe(true);
    });

    it('rejects invalid numbers', () => {
      expect(validateZambianPhone('0811234567')).toBe(false);
      expect(validateZambianPhone('12345')).toBe(false);
      expect(validateZambianPhone('abc')).toBe(false);
    });
  });

  describe('sendSMS', () => {
    it('returns true in dev mode', async () => {
      const result = await sendSMS('0977123456', 'Test message');
      expect(result).toBe(true);
    });

    it('rejects invalid phone numbers', async () => {
      const result = await sendSMS('invalid', 'Test message');
      expect(result).toBe(false);
    });
  });

  describe('SMS_TEMPLATES', () => {
    it('has all required templates', () => {
      expect(SMS_TEMPLATES.OTP).toBeDefined();
      expect(SMS_TEMPLATES.BOOKING_CONFIRMED).toBeDefined();
      expect(SMS_TEMPLATES.PAYMENT_RECEIVED).toBeDefined();
      expect(SMS_TEMPLATES.DRIVER_ASSIGNED).toBeDefined();
    });

    it('generates OTP message correctly', () => {
      const message = SMS_TEMPLATES.OTP('123456', 10);
      expect(message).toContain('123456');
      expect(message).toContain('10 minutes');
    });
  });
});
