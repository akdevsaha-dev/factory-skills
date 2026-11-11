import { createApp } from '../server/app.js';
import { openDatabase, seed } from '../server/db.js';

export async function startTestServer() {
  const db = openDatabase(':memory:');
  seed(db);
  const server = createApp(db);
  await new Promise((resolve) => server.listen(0, resolve));
  const baseUrl = `http://localhost:${server.address().port}`;
  return { db, baseUrl, close: () => new Promise((resolve) => server.close(resolve)) };
}

export function postJson(url, body, token = 'token-alice') {
  return fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}
