import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { atomic, get, pool, run } from './db';

type SeedProduct = {
  id: string; category: string; categoryLabel: string; name: string; price: number;
  originalPrice: number; inStock: number; image: string; fallbackImage?: string;
};

const categories = {
  heirloom: 'Heirloom Nursery', vehicles: 'Vehicles & Locomotives', montessori: 'Montessori & Sensory',
  puzzles: 'Puzzles & Wadas', musical: 'Acoustic Musical'
};

const initialiseCatalog = atomic(async (seed: SeedProduct[]) => {
  if (await get("SELECT setting_key FROM settings WHERE setting_key = 'catalog_seeded'")) return;
  for (const [position, [id, name]] of Object.entries(categories).entries()) {
    await run('INSERT INTO categories (id, name, sort_order) VALUES (?, ?, ?)', id, name, position);
  }
  const engravable = new Set(['toy-vintage-car', 'toy-rocking-horse', 'toy-train']);
  for (const [position, product] of seed.entries()) {
    const { id, category, categoryLabel, name, price, originalPrice, inStock, image, fallbackImage, ...details } = product;
    await run(`INSERT INTO products (id, category_id, name, price, original_price, stock, active, engravable, image, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`, id, category, name, Math.round(price * 100),
      Math.round(originalPrice * 100), inStock, Number(engravable.has(id)), image, JSON.stringify(details), position);
  }
  await run(`INSERT INTO settings (setting_key, value) VALUES ('offers_title', 'Combo & Special Offers'),
    ('offers_description', 'Pair workshop favourites and save when you buy them together.'), ('catalog_seeded', '1')`);
  await run(`INSERT INTO offers (id, title, description, price, active)
    VALUES ('deccan-discovery', 'Deccan Discovery Duo', 'Take the Royal Roadster and Deccan Express on a wooden adventure.', 279900, 1)`);
  await run(`INSERT INTO offer_products (offer_id, product_id, quantity, position)
    VALUES ('deccan-discovery', 'toy-train', 1, 0), ('deccan-discovery', 'toy-vintage-car', 1, 1)`);
});

async function migrate() {
  const schema = await readFile(resolve(__dirname, '../../shop/schema.sql'), 'utf8');
  for (const statement of schema.split(';').map(sql => sql.trim()).filter(Boolean)) await pool.query(statement);
  await run("INSERT IGNORE INTO settings (setting_key, value) VALUES ('commerce_lock', '1')");
  const seed: SeedProduct[] = JSON.parse(await readFile(resolve(__dirname, '../../shop/catalog-seed.json'), 'utf8'));
  await initialiseCatalog(seed);
  console.log('Shop database is ready.');
}

migrate().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
