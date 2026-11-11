import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

// Stand-in for the payment provider's SDK; tests replace `provider`.
export const provider = {
  async charge(amountCents) {
    return { ref: `ch_${randomUUID()}`, capturedCents: amountCents };
  },
};

export function isValidSignature(rawBody, signature, secret = process.env.WEBHOOK_SECRET) {
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  return expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
