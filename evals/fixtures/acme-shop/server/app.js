import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { sendJson } from './http.js';
import { listProducts } from './routes/products.js';
import { createOrder } from './routes/orders.js';

const webDir = new URL('../web/', import.meta.url);
const staticFiles = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'] };

export function createApp(db) {
  return createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    try {
      if (req.method === 'GET' && pathname === '/api/products') return listProducts(db, req, res);
      if (req.method === 'POST' && pathname === '/api/orders') return await createOrder(db, req, res);
      const file = req.method === 'GET' && staticFiles[pathname];
      if (file) {
        res.writeHead(200, { 'content-type': file[1] });
        return res.end(readFileSync(new URL(file[0], webDir)));
      }
      sendJson(res, 404, { error: 'not found' });
    } catch (error) {
      console.error(error);
      sendJson(res, 500, { error: 'internal error' });
    }
  });
}
