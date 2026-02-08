// Mock firebase/app before importing
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn().mockReturnValue({ name: '[DEFAULT]' }),
  getApps: jest.fn().mockReturnValue([]),
  getApp: jest.fn(),
}));

describe('Firebase client SDK', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns null when not configured', () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const { getFirebaseApp, isFirebaseConfigured } = require('../lib/firebase');
    expect(isFirebaseConfigured()).toBe(false);
    expect(getFirebaseApp()).toBeNull();
  });

  it('initializes app when configured', () => {
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-key';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
    const { getFirebaseApp, isFirebaseConfigured } = require('../lib/firebase');
    expect(isFirebaseConfigured()).toBe(true);
    const app = getFirebaseApp();
    expect(app).toBeTruthy();
  });
});
