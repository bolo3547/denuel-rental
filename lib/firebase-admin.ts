/**
 * Firebase Admin SDK Configuration
 * For use in server-side API routes and server components
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

// Check if Firebase Admin is configured
export const isFirebaseAdminConfigured = () => {
  return !!(
    process.env.FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_SERVICE_ACCOUNT
  );
};

// Initialize Firebase Admin (singleton pattern)
let adminApp: App | undefined;

/**
 * Get or initialize Firebase Admin app
 */
export const getFirebaseAdminApp = (): App | null => {
  if (!isFirebaseAdminConfigured()) {
    console.warn('Firebase Admin is not configured. Please add Firebase service account credentials.');
    return null;
  }

  if (!adminApp) {
    // Check if already initialized
    if (getApps().length === 0) {
      try {
        // Option 1: Use service account JSON (preferred for production)
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          adminApp = initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          });
        }
        // Option 2: Use individual credentials (easier for development)
        else if (
          process.env.FIREBASE_PROJECT_ID &&
          process.env.FIREBASE_PRIVATE_KEY &&
          process.env.FIREBASE_CLIENT_EMAIL
        ) {
          adminApp = initializeApp({
            credential: cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            }),
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          });
        } else {
          console.error('Firebase Admin credentials not properly configured');
          return null;
        }
      } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
        return null;
      }
    } else {
      adminApp = getApps()[0];
    }
  }

  return adminApp;
};

/**
 * Get Firebase Admin Auth instance
 */
export const getFirebaseAdminAuth = (): Auth | null => {
  const app = getFirebaseAdminApp();
  if (!app) return null;

  try {
    return getAuth(app);
  } catch (error) {
    console.error('Error getting Firebase Admin Auth:', error);
    return null;
  }
};

/**
 * Get Firebase Admin Firestore instance
 */
export const getFirebaseAdminFirestore = (): Firestore | null => {
  const app = getFirebaseAdminApp();
  if (!app) return null;

  try {
    return getFirestore(app);
  } catch (error) {
    console.error('Error getting Firebase Admin Firestore:', error);
    return null;
  }
};

/**
 * Get Firebase Admin Storage instance
 */
export const getFirebaseAdminStorage = (): Storage | null => {
  const app = getFirebaseAdminApp();
  if (!app) return null;

  try {
    return getStorage(app);
  } catch (error) {
    console.error('Error getting Firebase Admin Storage:', error);
    return null;
  }
};

/**
 * Get Firebase Admin Messaging instance (for push notifications)
 */
export const getFirebaseAdminMessaging = (): Messaging | null => {
  const app = getFirebaseAdminApp();
  if (!app) return null;

  try {
    return getMessaging(app);
  } catch (error) {
    console.error('Error getting Firebase Admin Messaging:', error);
    return null;
  }
};

/**
 * Verify Firebase ID token
 */
export async function verifyFirebaseToken(idToken: string) {
  const auth = getFirebaseAdminAuth();
  if (!auth) {
    throw new Error('Firebase Admin Auth not initialized');
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
}

/**
 * Get user by Firebase UID
 */
export async function getFirebaseUser(uid: string) {
  const auth = getFirebaseAdminAuth();
  if (!auth) {
    throw new Error('Firebase Admin Auth not initialized');
  }

  try {
    const user = await auth.getUser(uid);
    return user;
  } catch (error) {
    console.error('Error getting Firebase user:', error);
    return null;
  }
}

// Export for convenience
export { adminApp as firebaseAdminApp };
