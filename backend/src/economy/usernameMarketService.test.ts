import { describe, it, expect } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { validateUsernameHandle } = require('./services/usernameMarketService');

describe('username market validation', () => {
  it('accepts valid usernames by section 29 rules', () => {
    expect(validateUsernameHandle('abc')).toBe('abc');
    expect(validateUsernameHandle('User_123')).toBe('User_123');
  });

  it('rejects usernames with double underscore', () => {
    expect(() => validateUsernameHandle('ab__cd')).toThrow();
  });

  it('rejects usernames ending with underscore', () => {
    expect(() => validateUsernameHandle('abcd_')).toThrow();
  });

  it('rejects usernames outside 3..32 length', () => {
    expect(() => validateUsernameHandle('ab')).toThrow();
    expect(() => validateUsernameHandle('a'.repeat(33))).toThrow();
  });
});

