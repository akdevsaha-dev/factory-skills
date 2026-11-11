import { currentUser } from '../auth.js';
import { readJson, sendJson } from '../http.js';
import { provider } from '../payments.js';

export async function createOrder(db, req, res) {
  const userId = currentUser(req);
  if (!userId) return sendJson(res, 401, { error: 'unauthorized' });

  const { productId, quantity } = await readJson(req);
  if (!Number.isInteger(productId) || !Number.isInteger(quantity)) {
    return sendJson(res, 400, { error: 'productId and quantity must be integers' });
  }

  const product = db.prepare('SELECT id, price_cents, stock FROM products WHERE id = ?').get(productId);
  if (!product) return sendJson(res, 404, { error: 'product not found' });
  if (product.stock < quantity) return sendJson(res, 409, { error: 'not enough stock' });

  const totalCents = product.price_cents * quantity;
  const charge = await provider.charge(totalCents);
  const order = db
    .prepare("INSERT INTO orders (user_id, product_id, quantity, total_cents, status) VALUES (?, ?, ?, ?, 'paid') RETURNING id")
    .get(userId, productId, quantity, totalCents);
  db.prepare("INSERT INTO payments (order_id, provider_ref, captured_cents, status) VALUES (?, ?, ?, 'captured')")
    .run(order.id, charge.ref, charge.capturedCents);
  db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(quantity, productId);

  sendJson(res, 201, { id: order.id, totalCents, status: 'paid' });
}
