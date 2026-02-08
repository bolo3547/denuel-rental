/**
 * SMS Notifications via Africa's Talking
 * Handles Zambian phone number formatting and SMS sending
 */

import axios from 'axios';

// Environment variables
const AFRICASTALKING_API_KEY = process.env.AFRICASTALKING_API_KEY;
const AFRICASTALKING_USERNAME = process.env.AFRICASTALKING_USERNAME || 'sandbox';
const AFRICASTALKING_SHORTCODE = process.env.AFRICASTALKING_SHORTCODE;
const SMS_FALLBACK_URL = process.env.SMS_FALLBACK_URL;

// Dev mode detection
const DEV_MODE = !AFRICASTALKING_API_KEY;

/**
 * Format Zambian phone number to international format (+260)
 */
export function formatZambianPhone(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('260')) {
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    return '+260' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    // Assume it's missing country code and leading 0
    return '+260' + cleaned;
  }
  
  return '+' + cleaned;
}

/**
 * Validate Zambian phone number
 * Valid prefixes: 095, 096, 097, 076, 077 (9 digits after 0)
 */
export function validateZambianPhone(phone: string): boolean {
  const formatted = formatZambianPhone(phone);
  const regex = /^\+260(95|96|97|76|77)\d{7}$/;
  return regex.test(formatted);
}

/**
 * SMS Templates
 */
export const SMS_TEMPLATES = {
  OTP: (code: string, expiresIn: number = 10) => 
    `Your DENUEL verification code is: ${code}. Valid for ${expiresIn} minutes. Do not share this code.`,
  
  BOOKING_CONFIRMED: (propertyName: string, date: string) =>
    `Your booking for ${propertyName} on ${date} has been confirmed. Check the app for details.`,
  
  BOOKING_CANCELED: (propertyName: string, reason?: string) =>
    `Your booking for ${propertyName} has been canceled${reason ? `: ${reason}` : ''}. Contact support if needed.`,
  
  APPLICATION_APPROVED: (propertyName: string) =>
    `Congratulations! Your rental application for ${propertyName} has been approved. Login to proceed.`,
  
  APPLICATION_REJECTED: (propertyName: string) =>
    `Your rental application for ${propertyName} was not approved. Check the app for details.`,
  
  INQUIRY_RESPONSE: (propertyName: string) =>
    `You have a new response to your inquiry about ${propertyName}. Check the app for details.`,
  
  PAYMENT_RECEIVED: (amount: string, reference: string) =>
    `Payment of K${amount} received. Reference: ${reference}. Thank you!`,
  
  PAYMENT_DUE: (amount: string, dueDate: string) =>
    `Reminder: Your payment of K${amount} is due on ${dueDate}. Pay via the app or mobile money.`,
  
  DRIVER_ASSIGNED: (driverName: string, vehicleInfo: string, eta: string) =>
    `Driver ${driverName} (${vehicleInfo}) has been assigned. ETA: ${eta} minutes.`,
  
  TRIP_COMPLETED: (fare: string, distance: string) =>
    `Trip completed. Distance: ${distance}km. Fare: K${fare}. Thank you for using DENUEL!`,
  
  PRICE_DROP: (propertyName: string, oldPrice: string, newPrice: string) =>
    `Price drop alert! ${propertyName} reduced from K${oldPrice} to K${newPrice}/month. View now!`,
  
  RENT_REMINDER: (amount: string, dueDate: string) =>
    `Rent reminder: K${amount} due on ${dueDate}. Login to pay via mobile money.`,
  
  MAINTENANCE_SCHEDULED: (propertyName: string, date: string, type: string) =>
    `Maintenance scheduled for ${propertyName} on ${date}. Type: ${type}. You will be notified when complete.`,
  
  WELCOME: (name: string) =>
    `Welcome to DENUEL, ${name}! Find your perfect home or transport in Zambia. Start exploring now.`,
  
  SERVICE_BOOKING: (serviceName: string, date: string, provider: string) =>
    `Your ${serviceName} service with ${provider} is booked for ${date}. Check app for details.`,
};

/**
 * Send SMS via Africa's Talking API
 */
async function sendViaAfricasTalking(to: string, message: string): Promise<boolean> {
  try {
    const url = 'https://api.africastalking.com/version1/messaging';
    const response = await axios.post(
      url,
      new URLSearchParams({
        username: AFRICASTALKING_USERNAME,
        to,
        message,
        ...(AFRICASTALKING_SHORTCODE ? { from: AFRICASTALKING_SHORTCODE } : {}),
      }),
      {
        headers: {
          'apiKey': AFRICASTALKING_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      }
    );
    
    return response.data?.SMSMessageData?.Recipients?.[0]?.status === 'Success';
  } catch (error) {
    console.error('Africa\'s Talking SMS error:', error);
    return false;
  }
}

/**
 * Send SMS via generic HTTP fallback
 */
async function sendViaFallback(to: string, message: string): Promise<boolean> {
  if (!SMS_FALLBACK_URL) return false;
  
  try {
    const response = await axios.post(
      SMS_FALLBACK_URL,
      { phone: to, message },
      { timeout: 10000 }
    );
    
    return response.status === 200;
  } catch (error) {
    console.error('SMS fallback error:', error);
    return false;
  }
}

/**
 * Main function to send SMS
 * @param to - Phone number (will be formatted to Zambian format)
 * @param message - SMS message content
 * @returns Promise<boolean> - true if sent successfully
 */
export async function sendSMS(to: string, message: string): Promise<boolean> {
  // Format and validate phone number
  const formattedPhone = formatZambianPhone(to);
  
  if (!validateZambianPhone(formattedPhone)) {
    console.error('Invalid Zambian phone number:', to);
    return false;
  }
  
  // Dev mode - just log
  if (DEV_MODE) {
    console.log('📱 [DEV MODE] SMS would be sent to:', formattedPhone);
    console.log('📱 [DEV MODE] Message:', message);
    return true;
  }
  
  // Try Africa's Talking first
  if (AFRICASTALKING_API_KEY) {
    const success = await sendViaAfricasTalking(formattedPhone, message);
    if (success) {
      console.log('SMS sent via Africa\'s Talking to:', formattedPhone);
      return true;
    }
  }
  
  // Fallback to generic HTTP endpoint
  if (SMS_FALLBACK_URL) {
    const success = await sendViaFallback(formattedPhone, message);
    if (success) {
      console.log('SMS sent via fallback to:', formattedPhone);
      return true;
    }
  }
  
  console.error('Failed to send SMS to:', formattedPhone);
  return false;
}

/**
 * Bulk SMS sending
 */
export async function sendBulkSMS(recipients: Array<{ phone: string; message: string }>): Promise<number> {
  let successCount = 0;
  
  for (const recipient of recipients) {
    const success = await sendSMS(recipient.phone, recipient.message);
    if (success) successCount++;
    
    // Rate limiting - wait 100ms between messages
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return successCount;
}

export default {
  sendSMS,
  sendBulkSMS,
  formatZambianPhone,
  validateZambianPhone,
  SMS_TEMPLATES,
};
