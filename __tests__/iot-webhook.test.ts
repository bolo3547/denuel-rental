import { validateIoTPayload, generateAccessCode, DeviceType } from '../lib/iot-webhook';

describe('IoT Webhook Module', () => {
  describe('validateIoTPayload', () => {
    it('validates correct IoT payload', () => {
      const validPayload = {
        deviceId: 'device-123',
        deviceType: DeviceType.SMART_LOCK,
        timestamp: new Date().toISOString(),
        event: 'lock',
        data: { accessCode: '123456' },
      };
      
      expect(validateIoTPayload(validPayload)).toBe(true);
    });

    it('rejects invalid payloads', () => {
      expect(validateIoTPayload(null)).toBe(false);
      expect(validateIoTPayload({})).toBe(false);
      expect(validateIoTPayload({ deviceId: 'test' })).toBe(false);
    });

    it('validates device types', () => {
      const payload = {
        deviceId: 'device-123',
        deviceType: 'INVALID_TYPE',
        timestamp: new Date().toISOString(),
        event: 'test',
        data: {},
      };
      
      expect(validateIoTPayload(payload)).toBe(false);
    });
  });

  describe('generateAccessCode', () => {
    it('generates code of correct length', () => {
      const code = generateAccessCode(6);
      expect(code).toHaveLength(6);
      expect(/^\d+$/.test(code)).toBe(true);
    });

    it('generates different codes', () => {
      const code1 = generateAccessCode(6);
      const code2 = generateAccessCode(6);
      // Very unlikely to be the same
      expect(code1).not.toBe(code2);
    });

    it('supports custom lengths', () => {
      expect(generateAccessCode(4)).toHaveLength(4);
      expect(generateAccessCode(8)).toHaveLength(8);
    });
  });

  describe('DeviceType', () => {
    it('has all required device types', () => {
      expect(DeviceType.SMART_LOCK).toBe('SMART_LOCK');
      expect(DeviceType.WATER_SENSOR).toBe('WATER_SENSOR');
      expect(DeviceType.SMOKE_DETECTOR).toBe('SMOKE_DETECTOR');
      expect(DeviceType.SECURITY_CAMERA).toBe('SECURITY_CAMERA');
      expect(DeviceType.POWER_METER).toBe('POWER_METER');
      expect(DeviceType.MOTION_SENSOR).toBe('MOTION_SENSOR');
      expect(DeviceType.TEMPERATURE_SENSOR).toBe('TEMPERATURE_SENSOR');
      expect(DeviceType.DOOR_SENSOR).toBe('DOOR_SENSOR');
      expect(DeviceType.FLOOD_SENSOR).toBe('FLOOD_SENSOR');
      expect(DeviceType.GAS_DETECTOR).toBe('GAS_DETECTOR');
    });
  });
});
