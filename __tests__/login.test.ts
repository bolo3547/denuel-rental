import { hashPassword, verifyPassword } from '../lib/auth';

describe('login password verification', () => {
  it('verifyPassword returns true for correct password', () => {
    const password = 'Admin#1234';
    const hash = hashPassword(password);
    expect(verifyPassword(password, hash)).toBe(true);
  });

  it('verifyPassword returns false for wrong password', () => {
    const password = 'Admin#1234';
    const hash = hashPassword(password);
    expect(verifyPassword('WrongPass#1234', hash)).toBe(false);
  });

  it('hashPassword produces valid bcrypt hash', () => {
    const hash = hashPassword('TestPassword#1');
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/);
    expect(hash.length).toBe(60);
  });

  it('verifyPassword works with trimmed and untrimmed passwords consistently', () => {
    const password = 'MyPassword#1234';
    const hash = hashPassword(password);
    // Trimmed version should match since there are no leading/trailing spaces
    expect(verifyPassword(password.trim(), hash)).toBe(true);

    // Password with spaces: hash of padded password won't match trimmed input
    const paddedPassword = '  MyPassword#1234  ';
    const paddedHash = hashPassword(paddedPassword);
    expect(verifyPassword(paddedPassword, paddedHash)).toBe(true);
    expect(verifyPassword(paddedPassword.trim(), paddedHash)).toBe(false);
  });
});
