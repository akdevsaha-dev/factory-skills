import { DatabaseSync } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';

const migrationsDir = new URL('../db/migrations/', import.meta.url);

export function openDatabase(path = process.env.DB_PATH ?? ':memory:') {
  const db = new DatabaseSync(path);
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)');
  const applied = new Set(db.prepare('SELECT name FROM schema_migrations').all().map((row) => row.name));
  for (const name of readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort()) {
    if (applied.has(name)) continue;
    db.exec(readFileSync(new URL(name, migrationsDir), 'utf8'));
    db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(name);
  }
  return db;
}

export function seed(db) {
  const insert = db.prepare('INSERT INTO products (name, price_cents, stock) VALUES (?, ?, ?)');
  insert.run('Coffee beans', 1450, 12);
  insert.run('Pour-over kettle', 4999, 0);
  insert.run('Paper filters', 650, 40);
}
