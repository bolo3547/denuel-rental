/**
 * Firebase Client SDK Configuration
 * For use in client-side React components and pages
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase is configured
export const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  );
};

// Initialize Firebase app (singleton pattern)
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let analytics: Analytics | undefined;

/**
 * Get or initialize Firebase app
 */
export const getFirebaseApp = (): FirebaseApp | null => {
  if (!isFirebaseConfigured()) {
    console.warn('Firebase is not configured. Please add Firebase environment variables.');
    return null;
  }

  if (!app) {
    // Initialize Firebase only if not already initialized
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
  }

  return app;
};

/**
 * Get Firebase Auth instance
 */
export const getFirebaseAuth = (): Auth | null => {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!auth) {
    auth = getAuth(firebaseApp);
  }

  return auth;
};

/**
 * Get Firestore instance
 */
export const getFirebaseFirestore = (): Firestore | null => {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!db) {
    db = getFirestore(firebaseApp);
  }

  return db;
};

/**
 * Get Firebase Storage instance
 */
export const getFirebaseStorage = (): FirebaseStorage | null => {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!storage) {
    storage = getStorage(firebaseApp);
  }

  return storage;
};

/**
 * Get Firebase Analytics instance (client-side only)
 */
export const getFirebaseAnalytics = async (): Promise<Analytics | null> => {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  // Check if analytics is supported (only works in browser)
  const supported = await isSupported();
  if (!supported) return null;

  if (!analytics) {
    analytics = getAnalytics(firebaseApp);
  }

  return analytics;
};

// Export initialized instances for convenience
export { app as firebaseApp, auth as firebaseAuth, db as firebaseDb, storage as firebaseStorage };
