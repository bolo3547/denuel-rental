/**
 * Firebase Cloud Messaging (FCM) Integration
 * For sending push notifications via Firebase
 */

import { getFirebaseAdminMessaging } from './firebase-admin';
import type { Message, MulticastMessage, MessagingPayload } from 'firebase-admin/messaging';

/**
 * Send a push notification to a single device
 */
export async function sendFirebasePushNotification(
  token: string,
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: { [key: string]: string }
): Promise<boolean> {
  const messaging = getFirebaseAdminMessaging();
  if (!messaging) {
    console.warn('Firebase Messaging not initialized');
    return false;
  }

  const message: Message = {
    token,
    notification: {
      title: notification.title,
      body: notification.body,
      ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
    },
    ...(data && { data }),
    // Android-specific options
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
      },
    },
    // iOS-specific options
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
    // Web-specific options
    webpush: {
      notification: {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
      },
    },
  };

  try {
    await messaging.send(message);
    return true;
  } catch (error: any) {
    console.error('Error sending Firebase push notification:', error);
    
    // Handle invalid token
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      console.log('Invalid or unregistered FCM token:', token);
      // In production, you'd want to remove this token from your database
    }
    
    return false;
  }
}

/**
 * Send push notifications to multiple devices
 */
export async function sendFirebasePushToMultiple(
  tokens: string[],
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: { [key: string]: string }
): Promise<{ successCount: number; failureCount: number }> {
  const messaging = getFirebaseAdminMessaging();
  if (!messaging) {
    console.warn('Firebase Messaging not initialized');
    return { successCount: 0, failureCount: tokens.length };
  }

  const message: MulticastMessage = {
    tokens,
    notification: {
      title: notification.title,
      body: notification.body,
      ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
    },
    ...(data && { data }),
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
  };

  try {
    const response = await messaging.sendEachForMulticast(message);
    
    // Log any failures
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
        }
      });
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('Error sending multicast Firebase push:', error);
    return { successCount: 0, failureCount: tokens.length };
  }
}

/**
 * Send push notification to a topic
 */
export async function sendFirebasePushToTopic(
  topic: string,
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  },
  data?: { [key: string]: string }
): Promise<boolean> {
  const messaging = getFirebaseAdminMessaging();
  if (!messaging) {
    console.warn('Firebase Messaging not initialized');
    return false;
  }

  const message: Message = {
    topic,
    notification: {
      title: notification.title,
      body: notification.body,
      ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
    },
    ...(data && { data }),
    android: {
      priority: 'high',
    },
  };

  try {
    await messaging.send(message);
    return true;
  } catch (error) {
    console.error('Error sending Firebase push to topic:', error);
    return false;
  }
}

/**
 * Subscribe tokens to a topic
 */
export async function subscribeToTopic(
  tokens: string | string[],
  topic: string
): Promise<boolean> {
  const messaging = getFirebaseAdminMessaging();
  if (!messaging) {
    console.warn('Firebase Messaging not initialized');
    return false;
  }

  const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

  try {
    await messaging.subscribeToTopic(tokenArray, topic);
    return true;
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    return false;
  }
}

/**
 * Unsubscribe tokens from a topic
 */
export async function unsubscribeFromTopic(
  tokens: string | string[],
  topic: string
): Promise<boolean> {
  const messaging = getFirebaseAdminMessaging();
  if (!messaging) {
    console.warn('Firebase Messaging not initialized');
    return false;
  }

  const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

  try {
    await messaging.unsubscribeFromTopic(tokenArray, topic);
    return true;
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    return false;
  }
}

// Notification templates
export const notificationTemplates = {
  newBooking: (propertyName: string) => ({
    title: 'New Booking Request',
    body: `You have a new booking request for ${propertyName}`,
  }),
  bookingConfirmed: (propertyName: string) => ({
    title: 'Booking Confirmed',
    body: `Your booking for ${propertyName} has been confirmed`,
  }),
  bookingCanceled: (propertyName: string) => ({
    title: 'Booking Canceled',
    body: `Your booking for ${propertyName} has been canceled`,
  }),
  newMessage: (senderName: string) => ({
    title: 'New Message',
    body: `${senderName} sent you a message`,
  }),
  priceDropAlert: (propertyName: string, newPrice: string) => ({
    title: 'Price Drop Alert',
    body: `${propertyName} is now ${newPrice}`,
  }),
  rentReminder: (propertyName: string, daysLeft: number) => ({
    title: 'Rent Reminder',
    body: `Your rent for ${propertyName} is due in ${daysLeft} days`,
  }),
  maintenanceUpdate: (propertyName: string, status: string) => ({
    title: 'Maintenance Update',
    body: `Maintenance for ${propertyName} is ${status}`,
  }),
};
