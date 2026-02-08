import { validatePushSubscription, PUSH_TEMPLATES } from '../lib/push-notifications';

describe('Push Notifications Module', () => {
  describe('validatePushSubscription', () => {
    it('validates correct subscription format', () => {
      const validSubscription = {
        endpoint: 'https://push.example.com/abc123',
        keys: {
          p256dh: 'test-key',
          auth: 'test-auth',
        },
      };
      
      expect(validatePushSubscription(validSubscription)).toBe(true);
    });

    it('rejects invalid subscriptions', () => {
      expect(validatePushSubscription(null)).toBe(false);
      expect(validatePushSubscription(undefined)).toBe(false);
      expect(validatePushSubscription({})).toBe(false);
      expect(validatePushSubscription({ endpoint: 'test' })).toBe(false);
    });
  });

  describe('PUSH_TEMPLATES', () => {
    it('has all required templates', () => {
      expect(PUSH_TEMPLATES.MESSAGE).toBeDefined();
      expect(PUSH_TEMPLATES.BOOKING_CONFIRMED).toBeDefined();
      expect(PUSH_TEMPLATES.PRICE_DROP).toBeDefined();
      expect(PUSH_TEMPLATES.DRIVER_ASSIGNED).toBeDefined();
    });

    it('generates message notification correctly', () => {
      const notification = PUSH_TEMPLATES.MESSAGE('John', 'Hello there');
      expect(notification.title).toContain('John');
      expect(notification.body).toBe('Hello there');
    });

    it('generates price drop notification correctly', () => {
      const notification = PUSH_TEMPLATES.PRICE_DROP('Test Property', 5000, 4500);
      expect(notification.title).toContain('Price Drop');
      expect(notification.body).toContain('5000');
      expect(notification.body).toContain('4500');
    });
  });
});
