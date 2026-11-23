import type { Request, Response } from 'express';
import { all, get, run } from './db';
import { cookie, setCookie } from './auth';
import { requireValue } from './validation';

const day = 24 * 60 * 60 * 1000;
const cookieName = 'shop_visit';
const pages = new Set(['Storefront', 'Collections', 'Combo offers', 'Engraving studio', 'Checkout']);

export async function recordVisit(request: Request, response: Response, page: unknown) {
  requireValue(typeof page === 'string' && pages.has(page), 'Unknown storefront page.');
  if (request.get('sec-gpc') === '1' || request.get('dnt') === '1') return;
  const visitor = cookie(request, cookieName);
  const knownVisitor = typeof visitor === 'string' && /^[a-f0-9-]{36}$/.test(visitor);
  const id = knownVisitor ? visitor : crypto.randomUUID();
  const now = Date.now();
  await run('INSERT INTO visits (visitor, page, seen_at) VALUES (?, ?, ?)', id, page, now);
  if (!knownVisitor) setCookie(response, request, cookieName, id, 30 * 24 * 60 * 60);
}

export type TrafficCounts = { views: number; visitors: number; recent: number };

export async function trafficSummary() {
  const now = Date.now();
  const since = now - 30 * day;
  const [totals, pages, days] = await Promise.all([
    get<TrafficCounts>(`SELECT count(*) AS views, count(DISTINCT visitor) AS visitors,
      count(DISTINCT CASE WHEN seen_at >= ? THEN visitor END) AS recent FROM visits WHERE seen_at >= ?`, now - 5 * 60_000, since),
    all(`SELECT page, count(*) AS views FROM visits WHERE seen_at >= ? GROUP BY page ORDER BY views DESC, page`, since),
    all(`SELECT DATE_FORMAT(TIMESTAMPADD(MICROSECOND, (seen_at + 19800000) * 1000, '1970-01-01'), '%Y-%m-%d') AS day,
      count(*) AS views FROM visits WHERE seen_at >= ? GROUP BY day ORDER BY day DESC`, since)
  ]);
  return { ...totals, pages, days };
}

export async function expireOldRecords() {
  await run('DELETE FROM visits WHERE seen_at < ?', Date.now() - 90 * day);
  await run('DELETE FROM admin_sessions WHERE expires_at <= ?', Date.now());
}
