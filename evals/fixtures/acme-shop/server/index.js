import { createApp } from './app.js';
import { openDatabase, seed } from './db.js';

const db = openDatabase();
if (!db.prepare('SELECT 1 FROM products LIMIT 1').get()) seed(db);

const port = Number(process.env.PORT ?? 3000);
createApp(db).listen(port, () => console.log(`acme-shop listening on http://localhost:${port}`));
