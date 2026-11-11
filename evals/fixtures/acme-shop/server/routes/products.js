import { sendJson } from '../http.js';

export function listProducts(db, req, res) {
  const products = db.prepare('SELECT id, name, price_cents, stock FROM products ORDER BY id').all();
  sendJson(res, 200, products.map(toProductResponse));
}

function toProductResponse(product) {
  return {
    id: product.id,
    name: product.name,
    price: (product.price_cents / 100).toFixed(2),
    stock: product.stock,
  };
}
