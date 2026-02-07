/**
 * Web Push Notifications using VAPID
 */

// VAPID Configuration
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@denuel.com';

// Dev mode detection
const DEV_MODE = !VAPID_PRIVATE_KEY;

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Push Notification Templates
 */
export const PUSH_TEMPLATES = {
  MESSAGE: (sender: string, preview: string) => ({
    title: `New message from ${sender}`,
    body: preview,
    icon: '/icons/message.png',
    tag: 'message',
    requireInteraction: false,
  }),
  
  BOOKING_CONFIRMED: (propertyName: string) => ({
    title: 'Booking Confirmed',
    body: `Your booking for ${propertyName} has been confirmed!`,
    icon: '/icons/booking.png',
    tag: 'booking',
    requireInteraction: true,
  }),
  
  BOOKING_CANCELED: (propertyName: string) => ({
    title: 'Booking Canceled',
    body: `Your booking for ${propertyName} has been canceled.`,
    icon: '/icons/booking.png',
    tag: 'booking',
  }),
  
  APPLICATION_APPROVED: (propertyName: string) => ({
    title: 'Application Approved! 🎉',
    body: `Your application for ${propertyName} has been approved!`,
    icon: '/icons/success.png',
    tag: 'application',
    requireInteraction: true,
  }),
  
  APPLICATION_REJECTED: (propertyName: string) => ({
    title: 'Application Update',
    body: `Your application for ${propertyName} was not approved.`,
    icon: '/icons/info.png',
    tag: 'application',
  }),
  
  PRICE_DROP: (propertyName: string, oldPrice: number, newPrice: number) => ({
    title: 'Price Drop Alert! 💰',
    body: `${propertyName}: K${oldPrice} → K${newPrice}/month`,
    icon: '/icons/price-drop.png',
    tag: 'price-alert',
    requireInteraction: true,
  }),
  
  PROPERTY_MATCH: (propertyName: string, matchScore: number) => ({
    title: 'New Property Match',
    body: `${propertyName} matches your saved search (${matchScore}% match)`,
    icon: '/icons/property.png',
    tag: 'property-match',
  }),
  
  DRIVER_ASSIGNED: (driverName: string, eta: string) => ({
    title: 'Driver Assigned',
    body: `${driverName} is on the way. ETA: ${eta} minutes`,
    icon: '/icons/driver.png',
    tag: 'transport',
    requireInteraction: true,
  }),
  
  TRIP_COMPLETED: (fare: string) => ({
    title: 'Trip Completed',
    body: `Fare: K${fare}. Thank you for using DENUEL!`,
    icon: '/icons/trip.png',
    tag: 'transport',
  }),
  
  MAINTENANCE_SCHEDULED: (date: string, type: string) => ({
    title: 'Maintenance Scheduled',
    body: `${type} maintenance on ${date}`,
    icon: '/icons/maintenance.png',
    tag: 'maintenance',
  }),
  
  RENT_DUE: (amount: string, dueDate: string) => ({
    title: 'Rent Reminder',
    body: `K${amount} due on ${dueDate}`,
    icon: '/icons/payment.png',
    tag: 'payment',
    requireInteraction: true,
  }),
  
  PAYMENT_RECEIVED: (amount: string) => ({
    title: 'Payment Received',
    body: `Your payment of K${amount} has been confirmed.`,
    icon: '/icons/success.png',
    tag: 'payment',
  }),
};

/**
 * Check if subscription is expired
 */
function isSubscriptionExpired(subscription: PushSubscription): boolean {
  // Check if endpoint is valid
  if (!subscription.endpoint) return true;
  
  // Simple heuristic: if endpoint doesn't start with https, it's invalid
  if (!subscription.endpoint.startsWith('https://')) return true;
  
  // Additional checks can be added here
  return false;
}

/**
 * Send push notification using web-push
 * Note: This requires the 'web-push' package to be installed
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushNotificationPayload
): Promise<boolean> {
  // Check for expired subscription
  if (isSubscriptionExpired(subscription)) {
    console.warn('Push subscription expired:', subscription.endpoint);
    return false;
  }
  
  // Dev mode
  if (DEV_MODE) {
    console.log('🔔 [DEV MODE] Push notification would be sent:');
    console.log('  Endpoint:', subscription.endpoint);
    console.log('  Title:', payload.title);
    console.log('  Body:', payload.body);
    return true;
  }
  
  try {
    // Dynamically import web-push only when needed
    const webpush = await import('web-push');
    
    // Configure VAPID details
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY!,
      VAPID_PRIVATE_KEY!
    );
    
    // Send notification
    const result = await webpush.sendNotification(
      subscription as any,
      JSON.stringify(payload),
      {
        TTL: 24 * 60 * 60, // 24 hours
      }
    );
    
    return result.statusCode === 201;
  } catch (error: any) {
    console.error('Push notification error:', error);
    
    // Check for expired subscription error
    if (error?.statusCode === 410 || error?.statusCode === 404) {
      console.warn('Push subscription no longer valid, should be removed');
      return false;
    }
    
    return false;
  }
}

/**
 * Send push notification to multiple subscriptions
 */
export async function broadcastPush(
  subscriptions: PushSubscription[],
  payload: PushNotificationPayload
): Promise<{ success: number; failed: number; expired: number }> {
  const results = {
    success: 0,
    failed: 0,
    expired: 0,
  };
  
  for (const subscription of subscriptions) {
    if (isSubscriptionExpired(subscription)) {
      results.expired++;
      continue;
    }
    
    const success = await sendPushNotification(subscription, payload);
    if (success) {
      results.success++;
    } else {
      results.failed++;
    }
    
    // Rate limiting - wait 50ms between sends
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  return results;
}

/**
 * Get VAPID public key for client-side subscription
 */
export function getVapidPublicKey(): string | undefined {
  return VAPID_PUBLIC_KEY;
}

/**
 * Verify push subscription format
 */
export function validatePushSubscription(subscription: any): subscription is PushSubscription {
  return (
    subscription &&
    typeof subscription.endpoint === 'string' &&
    subscription.keys &&
    typeof subscription.keys.p256dh === 'string' &&
    typeof subscription.keys.auth === 'string'
  );
}

export default {
  sendPushNotification,
  broadcastPush,
  getVapidPublicKey,
  validatePushSubscription,
  PUSH_TEMPLATES,
};
