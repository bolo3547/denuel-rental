/**
 * IoT Device Integration Hub
 * Handles webhooks and events from various IoT devices
 */

import crypto from 'crypto';
import prisma from './prisma';

export enum DeviceType {
  SMART_LOCK = 'SMART_LOCK',
  WATER_SENSOR = 'WATER_SENSOR',
  POWER_METER = 'POWER_METER',
  MOTION_SENSOR = 'MOTION_SENSOR',
  SMOKE_DETECTOR = 'SMOKE_DETECTOR',
  SECURITY_CAMERA = 'SECURITY_CAMERA',
  TEMPERATURE_SENSOR = 'TEMPERATURE_SENSOR',
  DOOR_SENSOR = 'DOOR_SENSOR',
  FLOOD_SENSOR = 'FLOOD_SENSOR',
  GAS_DETECTOR = 'GAS_DETECTOR',
}

export interface IoTPayload {
  deviceId: string;
  deviceType: DeviceType;
  timestamp: string | Date;
  event: string;
  data: any;
  signature?: string;
}

export interface IoTDevice {
  id: string;
  deviceId: string;
  deviceType: DeviceType;
  propertyId: string;
  name: string;
  isActive: boolean;
  lastSeen?: Date;
}

// Secret for webhook signature verification
const IOT_WEBHOOK_SECRET = process.env.IOT_WEBHOOK_SECRET || 'changeme';

/**
 * Validate IoT payload structure
 */
export function validateIoTPayload(payload: any): payload is IoTPayload {
  return !!(
    payload &&
    typeof payload.deviceId === 'string' &&
    typeof payload.deviceType === 'string' &&
    Object.values(DeviceType).includes(payload.deviceType) &&
    (typeof payload.timestamp === 'string' || payload.timestamp instanceof Date) &&
    typeof payload.event === 'string' &&
    payload.data !== undefined
  );
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string = IOT_WEBHOOK_SECRET
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Generate crypto-safe access code for smart locks
 */
export function generateAccessCode(length: number = 6): string {
  const digits = '0123456789';
  let code = '';
  
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += digits[bytes[i] % digits.length];
  }
  
  return code;
}

/**
 * Create temporary access for smart lock
 */
export async function createTemporaryAccess(
  deviceId: string,
  userId: string,
  validFrom: Date,
  validUntil: Date,
  purpose: string = 'Temporary access'
): Promise<{ code: string; id: string } | null> {
  try {
    const accessCode = generateAccessCode(6);
    
    // Check if DeviceAccess table exists
    // @ts-ignore - Table may not exist in schema yet
    if (!prisma.deviceAccess) {
      console.log('📱 [DEV MODE] Temporary access would be created:');
      console.log('  Device:', deviceId);
      console.log('  Code:', accessCode);
      console.log('  Valid:', validFrom, '-', validUntil);
      return { code: accessCode, id: 'dev-' + Date.now() };
    }
    
    // @ts-ignore - Table may not exist in schema yet
    const access = await prisma.deviceAccess.create({
      data: {
        deviceId,
        userId,
        accessCode,
        validFrom,
        validUntil,
        purpose,
        isActive: true,
      },
    });
    
    return { code: accessCode, id: access.id };
  } catch (error) {
    console.error('Error creating temporary access:', error);
    return null;
  }
}

/**
 * Handle smart lock events
 */
async function handleSmartLockEvent(payload: IoTPayload): Promise<void> {
  const { deviceId, event, data } = payload;
  
  switch (event) {
    case 'lock':
    case 'unlock':
      console.log(`Smart lock ${deviceId} ${event}ed by ${data.accessCode || 'unknown'}`);
      
      // Log access event
      // @ts-ignore - Table may not exist in schema yet
      if (prisma.deviceEvent) {
        // @ts-ignore - Table may not exist in schema yet
        await prisma.deviceEvent.create({
          data: {
            deviceId,
            event,
            data,
            timestamp: new Date(payload.timestamp),
          },
        });
      }
      
      // Check if access code is valid
      // @ts-ignore - Table may not exist in schema yet
      if (data.accessCode && prisma.deviceAccess) {
        // @ts-ignore - Table may not exist in schema yet
        const access = await prisma.deviceAccess.findFirst({
          where: {
            deviceId,
            accessCode: data.accessCode,
            isActive: true,
            validFrom: { lte: new Date() },
            validUntil: { gte: new Date() },
          },
        });
        
        if (!access) {
          console.warn(`Invalid or expired access code used: ${data.accessCode}`);
          // Could trigger an alert here
        }
      }
      break;
      
    case 'battery_low':
      console.warn(`Smart lock ${deviceId} has low battery: ${data.level}%`);
      // Could send notification to property owner
      break;
      
    case 'tamper_alert':
      console.error(`ALERT: Smart lock ${deviceId} tamper detected!`);
      // Should trigger immediate notification
      break;
      
    default:
      console.log(`Smart lock ${deviceId} event: ${event}`);
  }
}

/**
 * Handle water sensor events
 */
async function handleWaterSensorEvent(payload: IoTPayload): Promise<void> {
  const { deviceId, event, data } = payload;
  
  if (event === 'leak_detected') {
    console.error(`ALERT: Water leak detected by ${deviceId}!`);
    // Should trigger immediate notification to property owner/manager
    
    // Log critical event
    // @ts-ignore - Table may not exist in schema yet
    if (prisma.deviceEvent) {
      // @ts-ignore - Table may not exist in schema yet
      await prisma.deviceEvent.create({
        data: {
          deviceId,
          event,
          data,
          timestamp: new Date(payload.timestamp),
          severity: 'CRITICAL',
        },
      });
    }
  } else if (event === 'moisture_level') {
    // Regular moisture reading
    console.log(`Water sensor ${deviceId} moisture: ${data.level}%`);
  }
}

/**
 * Handle power meter events
 */
async function handlePowerMeterEvent(payload: IoTPayload): Promise<void> {
  const { deviceId, event, data } = payload;
  
  if (event === 'usage_reading') {
    console.log(`Power meter ${deviceId} usage: ${data.kwh} kWh`);
    
    // Store reading for billing
    // @ts-ignore - Table may not exist in schema yet
    if (prisma.powerReading) {
      // @ts-ignore - Table may not exist in schema yet
      await prisma.powerReading.create({
        data: {
          deviceId,
          reading: data.kwh,
          timestamp: new Date(payload.timestamp),
        },
      });
    }
  } else if (event === 'threshold_exceeded') {
    console.warn(`Power usage threshold exceeded for ${deviceId}: ${data.kwh} kWh`);
  }
}

/**
 * Handle motion sensor events
 */
async function handleMotionSensorEvent(payload: IoTPayload): Promise<void> {
  const { deviceId, event, data } = payload;
  
  if (event === 'motion_detected') {
    console.log(`Motion detected by ${deviceId}`);
    
    // Check if property should be vacant
    // Could cross-reference with booking/occupancy schedule
  }
}

/**
 * Handle smoke detector events
 */
async function handleSmokeDetectorEvent(payload: IoTPayload): Promise<void> {
  const { deviceId, event, data } = payload;
  
  if (event === 'smoke_detected') {
    console.error(`CRITICAL ALERT: Smoke detected by ${deviceId}!`);
    // Should trigger immediate emergency notification
    
    // @ts-ignore - Table may not exist in schema yet
    if (prisma.deviceEvent) {
      // @ts-ignore - Table may not exist in schema yet
      await prisma.deviceEvent.create({
        data: {
          deviceId,
          event,
          data,
          timestamp: new Date(payload.timestamp),
          severity: 'CRITICAL',
        },
      });
    }
  } else if (event === 'battery_low') {
    console.warn(`Smoke detector ${deviceId} has low battery`);
  }
}

/**
 * Handle security camera events
 */
async function handleSecurityCameraEvent(payload: IoTPayload): Promise<void> {
  const { deviceId, event, data } = payload;
  
  switch (event) {
    case 'motion_detected':
      console.log(`Security camera ${deviceId} detected motion`);
      break;
      
    case 'person_detected':
      console.log(`Security camera ${deviceId} detected person`);
      break;
      
    case 'recording_started':
    case 'recording_stopped':
      console.log(`Security camera ${deviceId} ${event}`);
      break;
      
    default:
      console.log(`Security camera ${deviceId} event: ${event}`);
  }
}

/**
 * Handle temperature sensor events
 */
async function handleTemperatureSensorEvent(payload: IoTPayload): Promise<void> {
  const { deviceId, event, data } = payload;
  
  if (event === 'temperature_reading') {
    console.log(`Temperature sensor ${deviceId}: ${data.celsius}°C`);
    
    // Check for extreme temperatures
    if (data.celsius > 40) {
      console.warn(`High temperature alert: ${data.celsius}°C`);
    } else if (data.celsius < 5) {
      console.warn(`Low temperature alert: ${data.celsius}°C`);
    }
  }
}

/**
 * Handle door sensor events
 */
async function handleDoorSensorEvent(payload: IoTPayload): Promise<void> {
  const { deviceId, event, data } = payload;
  
  if (event === 'door_opened' || event === 'door_closed') {
    console.log(`Door sensor ${deviceId}: ${event}`);
  }
}

/**
 * Handle flood sensor events
 */
async function handleFloodSensorEvent(payload: IoTPayload): Promise<void> {
  const { deviceId, event, data } = payload;
  
  if (event === 'flood_detected') {
    console.error(`ALERT: Flood detected by ${deviceId}!`);
    
    // @ts-ignore - Table may not exist in schema yet
    if (prisma.deviceEvent) {
      // @ts-ignore - Table may not exist in schema yet
      await prisma.deviceEvent.create({
        data: {
          deviceId,
          event,
          data,
          timestamp: new Date(payload.timestamp),
          severity: 'CRITICAL',
        },
      });
    }
  }
}

/**
 * Handle gas detector events
 */
async function handleGasDetectorEvent(payload: IoTPayload): Promise<void> {
  const { deviceId, event, data } = payload;
  
  if (event === 'gas_detected') {
    console.error(`CRITICAL ALERT: Gas detected by ${deviceId}!`);
    
    // @ts-ignore - Table may not exist in schema yet
    if (prisma.deviceEvent) {
      // @ts-ignore - Table may not exist in schema yet
      await prisma.deviceEvent.create({
        data: {
          deviceId,
          event,
          data,
          timestamp: new Date(payload.timestamp),
          severity: 'CRITICAL',
        },
      });
    }
  }
}

/**
 * Main event processing function
 * Routes events to appropriate handlers based on device type
 */
export async function processIoTEvent(payload: IoTPayload): Promise<boolean> {
  try {
    // Validate payload
    if (!validateIoTPayload(payload)) {
      console.error('Invalid IoT payload');
      return false;
    }
    
    // Update device last seen
    // @ts-ignore - Table may not exist in schema yet
    if (prisma.ioTDevice) {
      // @ts-ignore - Table may not exist in schema yet
      await prisma.ioTDevice.update({
        where: { deviceId: payload.deviceId },
        data: { lastSeen: new Date(payload.timestamp) },
      }).catch(() => {
        // Device might not exist in DB yet
        console.warn(`IoT device ${payload.deviceId} not found in database`);
      });
    }
    
    // Route to appropriate handler
    switch (payload.deviceType) {
      case DeviceType.SMART_LOCK:
        await handleSmartLockEvent(payload);
        break;
      case DeviceType.WATER_SENSOR:
        await handleWaterSensorEvent(payload);
        break;
      case DeviceType.POWER_METER:
        await handlePowerMeterEvent(payload);
        break;
      case DeviceType.MOTION_SENSOR:
        await handleMotionSensorEvent(payload);
        break;
      case DeviceType.SMOKE_DETECTOR:
        await handleSmokeDetectorEvent(payload);
        break;
      case DeviceType.SECURITY_CAMERA:
        await handleSecurityCameraEvent(payload);
        break;
      case DeviceType.TEMPERATURE_SENSOR:
        await handleTemperatureSensorEvent(payload);
        break;
      case DeviceType.DOOR_SENSOR:
        await handleDoorSensorEvent(payload);
        break;
      case DeviceType.FLOOD_SENSOR:
        await handleFloodSensorEvent(payload);
        break;
      case DeviceType.GAS_DETECTOR:
        await handleGasDetectorEvent(payload);
        break;
      default:
        console.log(`Unknown device type: ${payload.deviceType}`);
    }
    
    return true;
  } catch (error) {
    console.error('IoT event processing error:', error);
    return false;
  }
}

export default {
  processIoTEvent,
  validateIoTPayload,
  verifyWebhookSignature,
  generateAccessCode,
  createTemporaryAccess,
  DeviceType,
};
