import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { isValidSignature } from '../server/payments.js';

test('accepts a correctly signed payload and rejects others', () => {
  const body = '{"type":"charge.captured"}';
  const signature = createHmac('sha256', 'whsec_test').update(body).digest('hex');
  assert.equal(isValidSignature(body, signature, 'whsec_test'), true);
  assert.equal(isValidSignature(body, 'bad', 'whsec_test'), false);
  assert.equal(isValidSignature(body, signature, undefined), false);
});
