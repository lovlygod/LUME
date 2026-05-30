import { describe, it, expect } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { verifyWebhookSignature } = require('./services/coinPurchaseService');
const crypto = require('crypto');

describe('coin purchase webhook signature contract', () => {
  it('accepts valid signature', () => {
    const provider = 'test';
    const payload = { a: 1, b: 'x' };
    const secret = 'secret';
    const digest = crypto.createHmac('sha256', secret).update(`${provider}:${JSON.stringify(payload)}`).digest('hex');
    expect(verifyWebhookSignature({ provider, signature: digest, payload, secret })).toBe(true);
  });

  it('rejects invalid signature', () => {
    expect(verifyWebhookSignature({ provider: 'test', signature: 'bad', payload: { a: 1 }, secret: 'secret' })).toBe(false);
  });
});

