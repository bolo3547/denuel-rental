/**
 * Analytics Event Tracker
 * Tracks user interactions and property views with non-blocking error handling
 */

import prisma from './prisma';

export enum EventCategory {
  PROPERTY = 'PROPERTY',
  USER = 'USER',
  SEARCH = 'SEARCH',
  BOOKING = 'BOOKING',
  PAYMENT = 'PAYMENT',
  TRANSPORT = 'TRANSPORT',
  SERVICE = 'SERVICE',
  AUTH = 'AUTH',
  SYSTEM = 'SYSTEM',
}

export interface AnalyticsEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  userId?: string;
  metadata?: any;
}

// In-memory cache for IP-based deduplication (1 hour window)
const viewCache = new Map<string, number>();
const DEDUP_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Clean up expired cache entries periodically
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, timestamp] of viewCache.entries()) {
    if (now - timestamp > DEDUP_WINDOW) {
      viewCache.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupCache, 5 * 60 * 1000);

/**
 * Track a generic analytics event
 * Non-blocking - never throws errors
 */
export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  try {
    // Check if AnalyticsEvent table exists in schema
    // If not, just log the event
    // @ts-ignore - Table may not exist in schema yet
    if (!prisma.analyticsEvent) {
      console.log('📊 Analytics:', event.category, event.action, event.label);
      return;
    }
    
    // @ts-ignore - Table may not exist in schema yet
    await prisma.analyticsEvent.create({
      data: {
        category: event.category,
        action: event.action,
        label: event.label || null,
        value: event.value || null,
        userId: event.userId || null,
        metadata: event.metadata || {},
        createdAt: new Date(),
      },
    });
  } catch (error) {
    // Non-blocking: log but don't throw
    console.error('Analytics tracking error:', error);
  }
}

/**
 * Track property view with IP deduplication
 * Only counts unique views from same IP within 1 hour window
 */
export async function trackPropertyView(
  propertyId: string,
  userId?: string,
  ipAddress?: string
): Promise<boolean> {
  try {
    // Generate cache key
    const cacheKey = `${propertyId}:${ipAddress || userId || 'anonymous'}`;
    
    // Check if already viewed recently
    const lastView = viewCache.get(cacheKey);
    const now = Date.now();
    
    if (lastView && (now - lastView) < DEDUP_WINDOW) {
      // Already counted within dedup window
      return false;
    }
    
    // Update cache
    viewCache.set(cacheKey, now);
    
    // Track the event
    await trackEvent({
      category: EventCategory.PROPERTY,
      action: 'view',
      label: propertyId,
      userId,
      metadata: { ipAddress },
    });
    
    // Increment view count on property (if PropertyView table exists)
    // @ts-ignore - Table may not exist in schema yet
    if (prisma.propertyView) {
      try {
        // @ts-ignore - Fields may not match schema
        await (prisma.propertyView as any).create({
          data: {
            propertyId,
            userId: userId || null,
            ipAddress: ipAddress || null,
            viewedAt: new Date(),
          },
        });
      } catch (e) {
        // Table might not have the expected structure
      }
    } else {
      // Fallback: try to increment views on property directly
      try {
        // @ts-ignore - Field may not exist
        await (prisma.property as any).update({
          where: { id: propertyId },
          data: {
            views: {
              increment: 1,
            },
          },
        });
      } catch (e) {
        // Property might not have views field, that's okay
      }
    }
    
    return true;
  } catch (error) {
    console.error('Property view tracking error:', error);
    return false;
  }
}

/**
 * Track search query
 */
export async function trackSearch(
  query: string,
  filters: any,
  resultsCount: number,
  userId?: string
): Promise<void> {
  await trackEvent({
    category: EventCategory.SEARCH,
    action: 'search',
    label: query,
    value: resultsCount,
    userId,
    metadata: { filters },
  });
}

/**
 * Track user registration
 */
export async function trackUserRegistration(userId: string, method: string = 'email'): Promise<void> {
  await trackEvent({
    category: EventCategory.AUTH,
    action: 'register',
    label: method,
    userId,
  });
}

/**
 * Track user login
 */
export async function trackUserLogin(userId: string, method: string = 'email'): Promise<void> {
  await trackEvent({
    category: EventCategory.AUTH,
    action: 'login',
    label: method,
    userId,
  });
}

/**
 * Track booking creation
 */
export async function trackBookingCreated(
  bookingId: string,
  propertyId: string,
  userId: string,
  amount: number
): Promise<void> {
  await trackEvent({
    category: EventCategory.BOOKING,
    action: 'created',
    label: propertyId,
    value: amount,
    userId,
    metadata: { bookingId },
  });
}

/**
 * Track booking confirmation
 */
export async function trackBookingConfirmed(bookingId: string, userId: string): Promise<void> {
  await trackEvent({
    category: EventCategory.BOOKING,
    action: 'confirmed',
    userId,
    metadata: { bookingId },
  });
}

/**
 * Track payment initiation
 */
export async function trackPaymentInitiated(
  amount: number,
  method: string,
  userId: string,
  reference: string
): Promise<void> {
  await trackEvent({
    category: EventCategory.PAYMENT,
    action: 'initiated',
    label: method,
    value: amount,
    userId,
    metadata: { reference },
  });
}

/**
 * Track payment completion
 */
export async function trackPaymentCompleted(
  amount: number,
  method: string,
  userId: string,
  transactionId: string
): Promise<void> {
  await trackEvent({
    category: EventCategory.PAYMENT,
    action: 'completed',
    label: method,
    value: amount,
    userId,
    metadata: { transactionId },
  });
}

/**
 * Track payment failure
 */
export async function trackPaymentFailed(
  amount: number,
  method: string,
  userId: string,
  reason: string
): Promise<void> {
  await trackEvent({
    category: EventCategory.PAYMENT,
    action: 'failed',
    label: method,
    value: amount,
    userId,
    metadata: { reason },
  });
}

/**
 * Track transport trip request
 */
export async function trackTripRequested(
  userId: string,
  vehicleType: string,
  estimatedFare: number
): Promise<void> {
  await trackEvent({
    category: EventCategory.TRANSPORT,
    action: 'trip_requested',
    label: vehicleType,
    value: estimatedFare,
    userId,
  });
}

/**
 * Track transport trip completion
 */
export async function trackTripCompleted(
  tripId: string,
  userId: string,
  fare: number,
  distance: number
): Promise<void> {
  await trackEvent({
    category: EventCategory.TRANSPORT,
    action: 'trip_completed',
    value: fare,
    userId,
    metadata: { tripId, distance },
  });
}

/**
 * Funnel tracking for conversion analysis
 */
export const funnelEvents = {
  /**
   * User views property listing
   */
  propertyViewed: (propertyId: string, userId?: string) =>
    trackEvent({
      category: EventCategory.PROPERTY,
      action: 'funnel_view',
      label: propertyId,
      userId,
    }),
  
  /**
   * User clicks contact/inquiry button
   */
  inquiryStarted: (propertyId: string, userId?: string) =>
    trackEvent({
      category: EventCategory.PROPERTY,
      action: 'funnel_inquiry_start',
      label: propertyId,
      userId,
    }),
  
  /**
   * User submits inquiry form
   */
  inquirySubmitted: (propertyId: string, userId: string) =>
    trackEvent({
      category: EventCategory.PROPERTY,
      action: 'funnel_inquiry_submit',
      label: propertyId,
      userId,
    }),
  
  /**
   * User starts application
   */
  applicationStarted: (propertyId: string, userId: string) =>
    trackEvent({
      category: EventCategory.PROPERTY,
      action: 'funnel_application_start',
      label: propertyId,
      userId,
    }),
  
  /**
   * User completes application
   */
  applicationCompleted: (propertyId: string, userId: string) =>
    trackEvent({
      category: EventCategory.PROPERTY,
      action: 'funnel_application_complete',
      label: propertyId,
      userId,
    }),
  
  /**
   * Application approved and lease created
   */
  leaseCreated: (propertyId: string, userId: string, amount: number) =>
    trackEvent({
      category: EventCategory.PROPERTY,
      action: 'funnel_lease_created',
      label: propertyId,
      value: amount,
      userId,
    }),
};

export default {
  trackEvent,
  trackPropertyView,
  trackSearch,
  trackUserRegistration,
  trackUserLogin,
  trackBookingCreated,
  trackBookingConfirmed,
  trackPaymentInitiated,
  trackPaymentCompleted,
  trackPaymentFailed,
  trackTripRequested,
  trackTripCompleted,
  funnelEvents,
  EventCategory,
};
