import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer } from './helpers.js';

test('lists products with prices and stock', async () => {
  const app = await startTestServer();
  try {
    const products = await (await fetch(`${app.baseUrl}/api/products`)).json();
    assert.deepEqual(products[0], { id: 1, name: 'Coffee beans', price: '14.50', stock: 12 });
  } finally {
    await app.close();
  }
});
