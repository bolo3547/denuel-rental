/**
 * Firebase Integration Tests
 */

import { isFirebaseConfigured, getFirebaseApp, getFirebaseAuth, getFirebaseFirestore, getFirebaseStorage } from '../lib/firebase';
import { isFirebaseAdminConfigured, getFirebaseAdminApp } from '../lib/firebase-admin';
import { generatePropertyImagePath, generateUserPhotoPath, generateDocumentPath, uploadFileToFirebase } from '../lib/firebase-storage';
import { notificationTemplates, sendFirebasePushNotification, sendFirebasePushToMultiple } from '../lib/firebase-messaging';
import { createConversation, sendMessage, subscribeToMessages, subscribeToUserConversations } from '../lib/firebase-chat';

describe('Firebase Configuration', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_PROJECT_ID;
  });

  describe('isFirebaseConfigured', () => {
    it('should return false when Firebase env vars are not set', () => {
      expect(isFirebaseConfigured()).toBe(false);
    });

  });

  describe('getFirebaseApp', () => {
    it('should return null when Firebase is not configured', () => {
      const app = getFirebaseApp();
      expect(app).toBeNull();
    });

    it('should not throw error when Firebase is not configured', () => {
      expect(() => getFirebaseApp()).not.toThrow();
    });
  });

  describe('getFirebaseAuth', () => {
    it('should return null when Firebase is not configured', () => {
      const auth = getFirebaseAuth();
      expect(auth).toBeNull();
    });
  });

  describe('getFirebaseFirestore', () => {
    it('should return null when Firebase is not configured', () => {
      const db = getFirebaseFirestore();
      expect(db).toBeNull();
    });
  });

  describe('getFirebaseStorage', () => {
    it('should return null when Firebase is not configured', () => {
      const storage = getFirebaseStorage();
      expect(storage).toBeNull();
    });
  });
});

describe('Firebase Admin Configuration', () => {
  beforeEach(() => {
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_SERVICE_ACCOUNT;
  });

  describe('isFirebaseAdminConfigured', () => {
    it('should return false when Firebase Admin env vars are not set', () => {
      expect(isFirebaseAdminConfigured()).toBe(false);
    });
  });

  describe('getFirebaseAdminApp', () => {
    it('should return null when Firebase Admin is not configured', () => {
      const app = getFirebaseAdminApp();
      expect(app).toBeNull();
    });

    it('should not throw error when Firebase Admin is not configured', () => {
      expect(() => getFirebaseAdminApp()).not.toThrow();
    });
  });
});

describe('Firebase Storage Utilities', () => {
  describe('generatePropertyImagePath', () => {
    it('should generate valid path for property images', () => {
      const path = generatePropertyImagePath('prop-123', 'image.jpg');
      
      expect(path).toMatch(/^properties\/prop-123\/\d+_image\.jpg$/);
    });

    it('should sanitize filename', () => {
      const path = generatePropertyImagePath('prop-123', 'my image (1).jpg');
      
      expect(path).toMatch(/^properties\/prop-123\/\d+_my_image__1_\.jpg$/);
    });
  });

  describe('generateUserPhotoPath', () => {
    it('should generate valid path for user photos', () => {
      const path = generateUserPhotoPath('user-456', 'profile.png');
      
      expect(path).toMatch(/^users\/user-456\/profile_\d+_profile\.png$/);
    });
  });

  describe('generateDocumentPath', () => {
    it('should generate valid path for documents', () => {
      const path = generateDocumentPath('rental-789', 'contract', 'agreement.pdf');
      
      expect(path).toMatch(/^rentals\/rental-789\/contract\/\d+_agreement\.pdf$/);
    });
  });

  describe('uploadFileToFirebase', () => {
    it('should return null when Firebase Storage is not initialized', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await uploadFileToFirebase(mockFile, 'test/path.jpg');
      
      expect(result).toBeNull();
    });
  });
});

describe('Firebase Messaging Utilities', () => {
  describe('notificationTemplates', () => {
    it('should have newBooking template', () => {
      const notification = notificationTemplates.newBooking('Test Property');
      
      expect(notification).toHaveProperty('title');
      expect(notification).toHaveProperty('body');
      expect(notification.body).toContain('Test Property');
    });

    it('should have bookingConfirmed template', () => {
      const notification = notificationTemplates.bookingConfirmed('Test Property');
      
      expect(notification.body).toContain('Test Property');
      expect(notification.body).toContain('confirmed');
    });

    it('should have priceDropAlert template', () => {
      const notification = notificationTemplates.priceDropAlert('Test Property', 'K2,500');
      
      expect(notification.body).toContain('Test Property');
      expect(notification.body).toContain('K2,500');
    });

    it('should have rentReminder template', () => {
      const notification = notificationTemplates.rentReminder('Test Property', 5);
      
      expect(notification.body).toContain('Test Property');
      expect(notification.body).toContain('5 days');
    });
  });

  describe('sendFirebasePushNotification', () => {
    it('should return false when Firebase Messaging is not initialized', async () => {
      const result = await sendFirebasePushNotification(
        'test-token',
        { title: 'Test', body: 'Test message' }
      );
      
      expect(result).toBe(false);
    });
  });

  describe('sendFirebasePushToMultiple', () => {
    it('should return failure count when Firebase Messaging is not initialized', async () => {
      const result = await sendFirebasePushToMultiple(
        ['token1', 'token2'],
        { title: 'Test', body: 'Test message' }
      );
      
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(2);
    });
  });
});

describe('Firebase Chat Utilities', () => {
  describe('createConversation', () => {
    it('should return null when Firebase Firestore is not initialized', async () => {
      const result = await createConversation({
        propertyId: 'prop-123',
        propertyTitle: 'Test Property',
        landlordId: 'landlord-1',
        tenantId: 'tenant-1'
      });
      
      expect(result).toBeNull();
    });
  });

  describe('sendMessage', () => {
    it('should return null when Firebase Firestore is not initialized', async () => {
      const result = await sendMessage({
        conversationId: 'conv-123',
        senderId: 'user-1',
        senderName: 'Test User',
        message: 'Hello'
      });
      
      expect(result).toBeNull();
    });
  });

  describe('subscribeToMessages', () => {
    it('should return empty unsubscribe function when Firestore is not initialized', () => {
      const unsubscribe = subscribeToMessages('conv-123', () => {});
      
      expect(typeof unsubscribe).toBe('function');
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('subscribeToUserConversations', () => {
    it('should return empty unsubscribe function when Firestore is not initialized', () => {
      const unsubscribe = subscribeToUserConversations('user-123', () => {});
      
      expect(typeof unsubscribe).toBe('function');
      expect(() => unsubscribe()).not.toThrow();
    });
  });
});
