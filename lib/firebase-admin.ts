import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';

function getAdminConfig() {
  // Option 1: Full service account JSON (base64-encoded)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(decoded);
      return { credential: cert(serviceAccount), projectId: serviceAccount.project_id };
    } catch {
      // fall through to individual fields
    }
  }

  // Option 2: Individual environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return {
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    };
  }

  return null;
}

function isConfigured(): boolean {
  return getAdminConfig() !== null;
}

let adminApp: App | null = null;

export function getFirebaseAdminApp(): App | null {
  if (!isConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Firebase Admin] Not configured — set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY');
    }
    return null;
  }

  if (!adminApp) {
    adminApp = getApps().length ? getApp() : initializeApp(getAdminConfig()!);
  }
  return adminApp;
}

export { isConfigured as isFirebaseAdminConfigured };
