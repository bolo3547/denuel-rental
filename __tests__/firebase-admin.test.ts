// Mock firebase-admin/app before importing
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn().mockReturnValue({ name: '[DEFAULT]' }),
  getApps: jest.fn().mockReturnValue([]),
  getApp: jest.fn(),
  cert: jest.fn().mockReturnValue({ projectId: 'test' }),
}));

describe('Firebase Admin SDK', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns null when not configured', () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
    const { getFirebaseAdminApp, isFirebaseAdminConfigured } = require('../lib/firebase-admin');
    expect(isFirebaseAdminConfigured()).toBe(false);
    expect(getFirebaseAdminApp()).toBeNull();
  });

  it('initializes from individual env vars', () => {
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
    process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN RSA PRIVATE KEY-----\\ntest\\n-----END RSA PRIVATE KEY-----';
    const { getFirebaseAdminApp, isFirebaseAdminConfigured } = require('../lib/firebase-admin');
    expect(isFirebaseAdminConfigured()).toBe(true);
    const app = getFirebaseAdminApp();
    expect(app).toBeTruthy();
  });

  it('initializes from base64 service account', () => {
    const serviceAccount = { project_id: 'test-project', client_email: 'test@test.iam.gserviceaccount.com', private_key: 'key' };
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY = Buffer.from(JSON.stringify(serviceAccount)).toString('base64');
    const { getFirebaseAdminApp, isFirebaseAdminConfigured } = require('../lib/firebase-admin');
    expect(isFirebaseAdminConfigured()).toBe(true);
    const app = getFirebaseAdminApp();
    expect(app).toBeTruthy();
  });
});
