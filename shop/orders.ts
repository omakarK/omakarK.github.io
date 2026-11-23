import { createHash, randomBytes } from 'node:crypto';
import { all, atomic, get, run } from './db';
import { offerData, productRow } from './catalog';
import { cleanText, identifier, integer, record, requireValue } from './validation';

export const freeShippingAt = 149_900;
const configuredShipping = Number(process.env.SHOP_SHIPPING_PAISE ?? 9900);
if (!Number.isSafeInteger(configuredShipping) || configuredShipping < 0 || configuredShipping > 100_000) {
  throw new Error('SHOP_SHIPPING_PAISE must be an integer between 0 and 100000.');
}
export const shippingCharge = configuredShipping;
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const finishes = new Set(['Natural CP Sagwan (Teak)', 'Golden Haldu Wood', 'Pure Indian Sheesham']);
const statusOptions: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
};

type Personalization = { name: string; date: string; finish: string; font: string };
type Line = {
  id: string; name: string; quantity: number; unitPrice: number;
  personalization?: Personalization | null; components?: { id: string; name: string; quantity: number }[];
};
type OrderRow = {
  id: string; status: string; subtotal: number; shipping: number; customer: string;
  created_at: number; tracking: string; request_hash: string;
};

async function resolveCart(items: unknown) {
  requireValue(Array.isArray(items) && items.length >= 1 && items.length <= 40, 'Your basket must have between 1 and 40 lines.');
  const stock = new Map<string, number>();
  const addStock = (id: string, name: string, available: number, quantity: number) => {
    const required = (stock.get(id) || 0) + quantity;
    requireValue(required <= available, `Only ${available} available for ${name}. Update your basket and try again.`, 409);
    stock.set(id, required);
  };

  const lines: Line[] = [];
  for (const value of items) {
    const item = record(value);
    const id = identifier(item.id);
    const quantity = integer(item.quantity, 'Quantity', 1, 99);
    if (item.kind === 'offer') {
      const offer = await offerData(id);
      requireValue(offer?.active && offer.eligible, 'A combo in your basket is no longer available.', 409);
      for (const component of offer.items) {
        const product = await productRow(component.id);
        requireValue(product, 'A combo in your basket is no longer available.', 409);
        addStock(product.id, product.name, product.stock, quantity * component.quantity);
      }
      lines.push({ id, name: offer.title, quantity, unitPrice: Math.round(offer.price * 100), components: offer.items });
      continue;
    }

    requireValue(item.kind === 'product', 'Invalid basket item.');
    const product = await productRow(id);
    requireValue(product?.active, 'A product in your basket is no longer available.', 409);
    let personalization: Personalization | null = null;
    if (item.personalization) {
      requireValue(product.engravable, `${product.name} is no longer available with engraving.`, 409);
      const options = record(item.personalization);
      requireValue(typeof options.finish === 'string' && finishes.has(options.finish), 'Choose a valid wood finish.');
      requireValue(options.font === 'serif' || options.font === 'script', 'Choose a valid engraving font.');
      personalization = {
        name: cleanText(options.name, 'Engraved name', 16, 1),
        date: cleanText(options.date, 'Engraved year or town', 18),
        finish: options.finish,
        font: options.font
      };
    }
    addStock(id, product.name, product.stock, quantity);
    lines.push({
      id, name: personalization ? `${product.name} (Personalized)` : product.name,
      quantity, unitPrice: product.price, personalization
    });
  }

  const subtotal = lines.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  const shipping = subtotal >= freeShippingAt ? 0 : shippingCharge;
  return { lines, stock, subtotal, shipping, total: subtotal + shipping, quote: hash({ lines, shipping }) };
}

export const quoteCart = atomic(async (items: unknown) => {
  const { stock, ...quote } = await resolveCart(items);
  return quote;
});

function cleanCustomer(value: unknown) {
  const customer = record(value);
  const phone = cleanText(customer.phone, 'Phone', 18, 10).replace(/[\s()-]/g, '');
  const email = validEmail(customer.email);
  const postalCode = cleanText(customer.postalCode, 'PIN code', 6, 6);
  requireValue(/^(?:\+91)?[6-9]\d{9}$/.test(phone), 'Enter a valid Indian mobile number.');
  requireValue(/^[1-9]\d{5}$/.test(postalCode), 'Enter a valid six-digit Indian PIN code.');
  return {
    name: cleanText(customer.name, 'Full name', 100, 2), phone, email,
    address: cleanText(customer.address, 'Street address', 350, 5),
    city: cleanText(customer.city, 'City', 80, 2),
    state: cleanText(customer.state, 'State or union territory', 80, 2),
    postalCode,
    country: 'India'
  };
}

export function validEmail(value: unknown) {
  const email = cleanText(value, 'Email', 254, 3).toLowerCase();
  requireValue(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Enter a valid email address.');
  return email;
}

export const placeOrder = atomic(async (body: Record<string, unknown>) => {
  const requestKey = cleanText(body.requestKey, 'Order request key', 64, 32);
  requireValue(/^[0-9a-f-]+$/i.test(requestKey), 'Invalid order request key.');
  const customer = cleanCustomer(body.customer);
  const requestHash = hash({ customer, items: body.items, quote: body.quote });
  const previous = await get<OrderRow>('SELECT id, request_hash, subtotal, shipping FROM orders WHERE request_key = ?', requestKey);
  if (previous) {
    requireValue(previous.request_hash === requestHash, 'This checkout request already belongs to a different order.', 409);
    return { id: previous.id, total: previous.subtotal + previous.shipping };
  }

  const cart = await resolveCart(body.items);
  requireValue(body.quote === cart.quote, 'Your basket details changed. Review the updated total before placing the order.', 409);
  const id = `OW-${randomBytes(8).toString('hex').toUpperCase()}`;
  const now = Date.now();
  await run(`INSERT INTO orders (id, request_key, request_hash, created_at, updated_at, status, customer, subtotal, shipping)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)`, id, requestKey, requestHash, now, now,
    JSON.stringify(customer), cart.subtotal, cart.shipping);
  for (const [position, item] of cart.lines.entries()) {
    await run('INSERT INTO order_items (order_id, position, item) VALUES (?, ?, ?)', id, position, JSON.stringify(item));
  }
  for (const [productId, quantity] of cart.stock) {
    await run('UPDATE products SET stock = stock - ? WHERE id = ?', quantity, productId);
    await run('INSERT INTO order_stock (order_id, product_id, quantity) VALUES (?, ?, ?)', id, productId, quantity);
  }
  return { id, total: cart.total };
});

export async function orders(status: string | undefined, page: number) {
  requireValue(!status || Object.hasOwn(statusOptions, status), 'Invalid status filter.');
  const offset = (page - 1) * 25;
  const where = status ? 'WHERE status = ?' : '';
  const parameters = status ? [status] : [];
  const rows = await all<OrderRow>(`SELECT id, created_at, status, subtotal, shipping, customer, tracking
    FROM orders ${where} ORDER BY created_at DESC, id DESC LIMIT 25 OFFSET ?`, ...parameters, offset);
  const count = await get<{ count: number }>(`SELECT count(*) AS count FROM orders ${where}`, ...parameters);
  return {
    total: count?.count ?? 0,
    page,
    orders: await Promise.all(rows.map(async ({ customer, ...row }) => {
      const items = await all<{ item: string }>('SELECT item FROM order_items WHERE order_id = ? ORDER BY position', row.id);
      return { ...row, customer: JSON.parse(customer), nextStatuses: statusOptions[row.status],
        items: items.map(item => JSON.parse(item.item)) };
    }))
  };
}

export const updateOrder = atomic(async (id: string, body: Record<string, unknown>) => {
  const order = await get<{ status: string }>('SELECT status FROM orders WHERE id = ?', id);
  requireValue(order, 'Order not found.', 404);
  requireValue(body.expectedStatus === order.status, 'The order was already updated. Reload and try again.', 409);
  const status = body.status;
  requireValue(typeof status === 'string' && (status === order.status || statusOptions[order.status].includes(status)), 'This order cannot move to that status.', 409);
  const tracking = cleanText(body.tracking, 'Tracking details', 240);
  if (status === 'cancelled' && order.status !== 'cancelled') {
    for (const item of await all<{ product_id: string | null; quantity: number }>('SELECT product_id, quantity FROM order_stock WHERE order_id = ?', id)) {
      await run('UPDATE products SET stock = stock + ? WHERE id = ?', item.quantity, item.product_id);
    }
  }
  await run('UPDATE orders SET status = ?, tracking = ?, updated_at = ? WHERE id = ?', status, tracking, Date.now(), id);
});
