import { all, atomic, get, run } from './db';
import type { Request } from 'express';
import { cleanText, identifier, integer, record, requireValue } from './validation';

const fallbackImage = '/assets/images/hero-wooden-toys.jpg';
type Category = { id: string; name: string; position: number };
export type ProductRow = { id: string; category_id: string; name: string; price: number; original_price: number | null; stock: number; active: number; engravable: number; image: string; media_id: string | null; details: string };
type OfferRow = { id: string; title: string; description: string; price: number; active: number };
type OfferItemRow = Pick<ProductRow, "id" | "name" | "price" | "stock" | "active" | "image" | "media_id"> & { quantity: number };
type MediaRow = { id: string; type: string };
type Upload = MediaRow & { data: Buffer };
type CatalogForm = { body: Record<string, unknown>; uploads: Upload[] };

const productDetails: Record<string, [string, number]> = {
  subtitle: ['Subtitle', 180], badge: ['Badge', 60], woodType: ['Wood type', 120],
  recommendedAge: ['Recommended age', 80], dimensions: ['Dimensions', 100], weight: ['Weight', 80],
  finish: ['Finish', 120], leadTime: ['Dispatch estimate', 160], description: ['Description', 4000]
};

export const categories = () => all<Category>('SELECT id, name, sort_order AS position FROM categories ORDER BY sort_order, name');
export const productRow = (id: string) => get<ProductRow>('SELECT * FROM products WHERE id = ?', id);
const mediaUrl = (id: string) => `/media/${id}`;

function productData(row: ProductRow) {
  return {
    ...JSON.parse(row.details),
    id: row.id, category: row.category_id, name: row.name, inStock: row.stock,
    price: row.price / 100, originalPrice: row.original_price == null ? null : row.original_price / 100,
    active: Boolean(row.active), engravable: Boolean(row.engravable),
    image: row.media_id ? mediaUrl(row.media_id) : row.image
  };
}

export async function products(admin = false) {
  const rows = await all<ProductRow>(admin ? 'SELECT * FROM products ORDER BY created_at, id' : 'SELECT * FROM products WHERE active = 1 ORDER BY created_at, id');
  return rows.map(productData);
}

export async function offerData(id: string) {
  const offer = await get<OfferRow>('SELECT * FROM offers WHERE id = ?', id);
  if (!offer) return null;
  const items = await all<OfferItemRow>(`SELECT p.id, p.name, p.price, p.stock, p.active,
                            p.image, p.media_id, op.quantity
                     FROM offer_products op JOIN products p ON p.id = op.product_id
                     WHERE op.offer_id = ? ORDER BY op.position`, id);
  const retail = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const eligible = items.length > 0 && items.every(item => item.active) && offer.price < retail;
  const media = (await all<MediaRow>(`SELECT m.id, m.type FROM offer_media om JOIN media m ON m.id = om.media_id
                     WHERE om.offer_id = ? ORDER BY om.position`, id))
    .map(item => ({ id: item.id, type: item.type, url: mediaUrl(item.id) }));
  return {
    id: offer.id, title: offer.title, description: offer.description, active: Boolean(offer.active), eligible,
    price: offer.price / 100, originalPrice: retail / 100,
    inStock: eligible ? Math.min(...items.map(item => Math.floor(item.stock / item.quantity))) : 0,
    image: media.find(item => item.type.startsWith('image/'))?.url
      ?? (items[0]?.media_id ? mediaUrl(items[0].media_id) : items[0]?.image || fallbackImage),
    media, items: items.map(({ id, name, quantity }) => ({ id, name, quantity }))
  };
}

export async function offers(admin = false) {
  const rows = await all<{ id: string }>('SELECT id FROM offers ORDER BY created_at, id');
  const result = [];
  for (const row of rows) {
    const offer = await offerData(row.id);
    if (offer && (admin || (offer.active && offer.eligible))) result.push(offer);
  }
  return result;
}

export async function offersTab() {
  const rows = await all<{ setting_key: string; value: string }>(
    "SELECT setting_key, value FROM settings WHERE setting_key IN ('offers_title', 'offers_description')"
  );
  const settings = Object.fromEntries(rows.map(row => [row.setting_key, row.value]));
  return { title: settings.offers_title, description: settings.offers_description };
}

export function saveOffersTab(body: Record<string, unknown>) {
  const title = cleanText(body.title, 'Tab title', 80, 1);
  const description = cleanText(body.description, 'Tab description', 350);
  return atomic(async () => {
    await run("UPDATE settings SET value = ? WHERE setting_key = 'offers_title'", title);
    await run("UPDATE settings SET value = ? WHERE setting_key = 'offers_description'", description);
  })();
}

export function saveCategory(body: Record<string, unknown>, id?: string) {
  const name = cleanText(body.name, 'Category name', 80, 1);
  const position = integer(body.position, 'Sort order', 0, 999);
  return atomic(async () => {
    requireValue(!await get('SELECT id FROM categories WHERE name = ? AND id <> ?', name, id || ''), 'A category with that name already exists.', 409);
    if (id) {
      requireValue((await run('UPDATE categories SET name = ?, sort_order = ? WHERE id = ?', name, position, id)).affectedRows, 'Category not found.', 404);
    } else {
      id = crypto.randomUUID();
      await run('INSERT INTO categories (id, name, sort_order) VALUES (?, ?, ?)', id, name, position);
    }
    return id;
  })();
}

export function deleteCategory(id: string) {
  return atomic(async () => {
    requireValue(!await get('SELECT id FROM products WHERE category_id = ? LIMIT 1', id), 'Move the products to another category before deleting this one.', 409);
    requireValue((await run('DELETE FROM categories WHERE id = ?', id)).affectedRows, 'Category not found.', 404);
  })();
}

const formats: Record<string, (data: Buffer) => boolean> = {
  'image/jpeg': bytes => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  'image/png': bytes => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  'image/webp': bytes => bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP',
  'video/mp4': bytes => bytes.toString('ascii', 4, 8) === 'ftyp',
  'video/webm': bytes => bytes.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163]))
};
const megabyte = 1024 * 1024;

export async function catalogForm(request: Request, allowVideo = false): Promise<CatalogForm> {
  const contentType = request.get('content-type') || '';
  requireValue(contentType.toLowerCase().startsWith('multipart/form-data;'), 'Expected a file upload form.', 415);
  const limit = (allowVideo ? 45 : 6) * megabyte;
  requireValue(Number(request.get('content-length') || 0) <= limit, 'Request is too large.', 413);
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    requireValue(size <= limit, 'Request is too large.', 413);
    chunks.push(chunk);
  }
  const bytes = new Uint8Array(Buffer.concat(chunks, size));
  let form: FormData;
  let body: Record<string, unknown>;
  try {
    form = await new Response(bytes, { headers: { 'Content-Type': contentType } }).formData();
    const data = form.get('data');
    requireValue(typeof data === 'string', 'Missing catalog data.');
    body = record(JSON.parse(data));
  } catch {
    requireValue(false, 'Invalid catalog form.');
  }
  const files = form.getAll('media').filter((file): file is File => file instanceof File && Boolean(file.name));
  requireValue(files.length <= (allowVideo ? 8 : 1), 'Too many files.');
  const uploads: Upload[] = [];
  for (const file of files) {
    const type = file.type;
    requireValue(Object.hasOwn(formats, type) && (allowVideo || type.startsWith('image/')), 'Use JPEG, PNG or WebP photos, or MP4 or WebM videos for offers.');
    const limit = type.startsWith('video/') ? 30 : 5;
    requireValue(file.size > 0 && file.size <= limit * megabyte, `Each ${type.split('/')[0]} may be at most ${limit} MB.`, 413);
    const data = Buffer.from(await file.arrayBuffer());
    requireValue(formats[type](data), 'The file content does not match its format.');
    uploads.push({ id: crypto.randomUUID(), type, data });
  }
  return { body, uploads };
}

async function saveMedia(upload: Upload) {
  await run('INSERT INTO media (id, type, data) VALUES (?, ?, ?)', upload.id, upload.type, upload.data);
}

export function saveProduct({ body, uploads }: CatalogForm, id?: string) {
  const name = cleanText(body.name, 'Product name', 150, 1);
  const category = identifier(body.category);
  const price = integer(body.price, 'Price in paise', 1, 100_000_000);
  const originalPrice = body.originalPrice == null ? null : integer(body.originalPrice, 'Original price in paise', price, 100_000_000);
  const requestedStock = integer(body.inStock, 'Stock', 0, 100_000);

  return atomic(async () => {
    const existing = id ? await productRow(id) : null;
    requireValue(!id || existing, 'Product not found.', 404);
    const baselineStock = existing ? integer(body.expectedStock, 'Previous stock', 0, 100_000) : null;
    const stock = existing && requestedStock === baselineStock ? existing.stock : requestedStock;
    requireValue(!existing || requestedStock === baselineStock || baselineStock === existing.stock,
      'Stock changed while this product was open. Reopen it before changing stock.', 409);
    requireValue(await get('SELECT id FROM categories WHERE id = ?', category), 'Choose an existing category.');
    const details = existing ? JSON.parse(existing.details) : {};
    for (const [key, [label, limit]] of Object.entries(productDetails)) {
      details[key] = cleanText(body[key], label, limit);
    }

    const upload = uploads[0];
    if (upload) await saveMedia(upload);
    const mediaId = upload?.id ?? (body.removeImage ? null : existing?.media_id ?? null);
    const image = body.removeImage ? fallbackImage : existing?.image ?? fallbackImage;
    const values = [category, name, price, originalPrice, stock, Number(body.active === true),
      Number(body.engravable === true), image, mediaId, JSON.stringify(details)];
    if (existing) {
      await run(`UPDATE products SET category_id = ?, name = ?, price = ?, original_price = ?, stock = ?,
           active = ?, engravable = ?, image = ?, media_id = ?, details = ? WHERE id = ?`, ...values, existing.id);
      if (existing.media_id && existing.media_id !== mediaId) await run('DELETE FROM media WHERE id = ?', existing.media_id);
    } else {
      id = crypto.randomUUID();
      await run(`INSERT INTO products (category_id, name, price, original_price, stock, active, engravable, image, media_id, details, id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, ...values, id, Date.now());
    }
    return id;
  })();
}

export function deleteProduct(id: string) {
  return atomic(async () => {
    const product = await productRow(id);
    requireValue(product, 'Product not found.', 404);
    requireValue(!await get('SELECT 1 FROM offer_products WHERE product_id = ?', id), 'Remove this product from its combo offers first.', 409);
    const openOrder = await get(`SELECT 1 FROM order_stock os JOIN orders o ON o.id = os.order_id
                           WHERE os.product_id = ? AND o.status IN ('pending', 'confirmed', 'processing') LIMIT 1`, id);
    requireValue(!openOrder, 'This product is reserved by an open order. Unpublish it to hide it from the shop.', 409);
    await run('DELETE FROM products WHERE id = ?', id);
    if (product.media_id) await run('DELETE FROM media WHERE id = ?', product.media_id);
  })();
}

export function saveOffer({ body, uploads }: CatalogForm, id?: string) {
  const title = cleanText(body.title, 'Offer name', 150, 1);
  const description = cleanText(body.description, 'Description', 2500);
  const price = integer(body.price, 'Combo price in paise', 1, 100_000_000);
  requireValue(Array.isArray(body.items) && body.items.length >= 1 && body.items.length <= 20, 'Choose between 1 and 20 products.');
  const items = body.items.map(value => {
    const item = record(value);
    return { id: identifier(item.id), quantity: integer(item.quantity, 'Combo quantity', 1, 20) };
  });
  requireValue(items.reduce((count, item) => count + item.quantity, 0) >= 2, 'A combo must contain at least two toys.');
  requireValue(new Set(items.map(item => item.id)).size === items.length, 'List each product once and set its quantity.');
  const removeMedia = new Set(Array.isArray(body.removeMedia) ? body.removeMedia : []);

  return atomic(async () => {
    const existing = id ? await offerData(id) : null;
    requireValue(!id || existing, 'Offer not found.', 404);
    const offerId = existing?.id ?? crypto.randomUUID();
    let retail = 0;
    for (const item of items) {
      const product = await productRow(item.id);
      requireValue(product, 'A selected product no longer exists.');
      requireValue(body.active !== true || product.active, 'Publish the products before publishing this combo.');
      retail += product.price * item.quantity;
    }
    requireValue(body.active !== true || price < retail, 'The combo price must be below the combined retail price.');
    const retained = (existing?.media || []).filter(media => !removeMedia.has(media.id));
    requireValue(retained.length + uploads.length <= 8, 'An offer can have up to 8 photos and videos.');

    const values = [title, description, price, Number(body.active === true)];
    if (existing) {
      await run('UPDATE offers SET title = ?, description = ?, price = ?, active = ? WHERE id = ?', ...values, offerId);
      await run('DELETE FROM offer_products WHERE offer_id = ?', offerId);
      for (const media of existing.media) {
        if (removeMedia.has(media.id)) {
          await run('DELETE FROM offer_media WHERE offer_id = ? AND media_id = ?', offerId, media.id);
          await run('DELETE FROM media WHERE id = ?', media.id);
        }
      }
    } else {
      await run('INSERT INTO offers (title, description, price, active, id, created_at) VALUES (?, ?, ?, ?, ?, ?)', ...values, offerId, Date.now());
    }
    for (const [position, item] of items.entries()) {
      await run('INSERT INTO offer_products (offer_id, product_id, quantity, position) VALUES (?, ?, ?, ?)', offerId, item.id, item.quantity, position);
    }
    const position = Number((await get<{ next_position: number }>('SELECT coalesce(max(position), -1) + 1 AS next_position FROM offer_media WHERE offer_id = ?', offerId))?.next_position ?? 0);
    for (const [offset, upload] of uploads.entries()) {
      await saveMedia(upload);
      await run('INSERT INTO offer_media (offer_id, media_id, position) VALUES (?, ?, ?)', offerId, upload.id, position + offset);
    }
    return offerId;
  })();
}

export function deleteOffer(id: string) {
  return atomic(async () => {
    const offer = await offerData(id);
    requireValue(offer, 'Offer not found.', 404);
    await run('DELETE FROM offers WHERE id = ?', id);
    for (const media of offer.media) await run('DELETE FROM media WHERE id = ?', media.id);
  })();
}
