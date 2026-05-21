import { describe, it, expect, afterEach, vi } from 'vitest';
import { checkPassword, mintAuthToken, isValidAuthToken, AUTH_COOKIE_NAME } from './auth';

afterEach(() => vi.unstubAllEnvs());

describe('checkPassword', () => {
  it('accepts the correct password', () => {
    vi.stubEnv('DASHBOARD_PASSWORD', 'secret123');
    expect(checkPassword('secret123')).toBe(true);
  });

  it('rejects a wrong password', () => {
    vi.stubEnv('DASHBOARD_PASSWORD', 'secret123');
    expect(checkPassword('wrong')).toBe(false);
  });

  it('rejects an empty submission', () => {
    vi.stubEnv('DASHBOARD_PASSWORD', 'secret123');
    expect(checkPassword('')).toBe(false);
  });

  it('rejects everything when DASHBOARD_PASSWORD is unset', () => {
    vi.stubEnv('DASHBOARD_PASSWORD', '');
    expect(checkPassword('anything')).toBe(false);
  });
});

describe('mintAuthToken / isValidAuthToken', () => {
  it('a freshly minted token validates', () => {
    vi.stubEnv('DASHBOARD_PASSWORD', 'secret123');
    expect(isValidAuthToken(mintAuthToken())).toBe(true);
  });

  it('rejects an undefined or empty token', () => {
    vi.stubEnv('DASHBOARD_PASSWORD', 'secret123');
    expect(isValidAuthToken(undefined)).toBe(false);
    expect(isValidAuthToken('')).toBe(false);
  });

  it('rejects a garbage token', () => {
    vi.stubEnv('DASHBOARD_PASSWORD', 'secret123');
    expect(isValidAuthToken('not-a-real-token')).toBe(false);
  });

  it('a token minted under the old password fails after rotation', () => {
    vi.stubEnv('DASHBOARD_PASSWORD', 'oldpass');
    const old = mintAuthToken();
    vi.stubEnv('DASHBOARD_PASSWORD', 'newpass');
    expect(isValidAuthToken(old)).toBe(false);
  });

  it('rejects all tokens when DASHBOARD_PASSWORD is unset', () => {
    vi.stubEnv('DASHBOARD_PASSWORD', '');
    expect(isValidAuthToken('anything')).toBe(false);
  });

  it('exports a stable cookie name', () => {
    expect(typeof AUTH_COOKIE_NAME).toBe('string');
    expect(AUTH_COOKIE_NAME.length).toBeGreaterThan(0);
  });
});
