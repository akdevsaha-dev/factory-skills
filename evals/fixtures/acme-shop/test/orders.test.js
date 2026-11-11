import { test } from 'node:test';
import assert from 'node:assert/strict';
import { postJson, startTestServer } from './helpers.js';

test('creates a paid order and captures the total', async () => {
  const app = await startTestServer();
  try {
    const response = await postJson(`${app.baseUrl}/api/orders`, { productId: 1, quantity: 2 });
    assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { id: 1, totalCents: 2900, status: 'paid' });
    const payment = app.db.prepare('SELECT captured_cents, status FROM payments WHERE order_id = 1').get();
    assert.deepEqual({ ...payment }, { captured_cents: 2900, status: 'captured' });
  } finally {
    await app.close();
  }
});

test('rejects unauthenticated orders', async () => {
  const app = await startTestServer();
  try {
    const response = await postJson(`${app.baseUrl}/api/orders`, { productId: 1, quantity: 1 }, 'bad-token');
    assert.equal(response.status, 401);
  } finally {
    await app.close();
  }
});

test('rejects orders beyond stock', async () => {
  const app = await startTestServer();
  try {
    const response = await postJson(`${app.baseUrl}/api/orders`, { productId: 2, quantity: 1 });
    assert.equal(response.status, 409);
  } finally {
    await app.close();
  }
});
