import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { atomic, get, run } from './db';
import { cleanText, requireValue } from './validation';

const derive = promisify(scrypt);
const cookieName = 'shop_admin';
const sessionSeconds = 8 * 60 * 60;
const opaqueToken = () => randomBytes(32).toString('hex');
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
export const publicOrigin = process.env.SHOP_ORIGIN ? new URL(process.env.SHOP_ORIGIN).origin : undefined;

type Session = { token_hash: string; username: string; csrf: string };
export type AdminRequest = Request & { shopAdmin: Session };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password, salt, 64) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}

const dummyHash = hashPassword(opaqueToken());

async function verifyPassword(password: string, encoded: string) {
  const [salt, saved] = encoded.split(':');
  const hash = await derive(password, salt, 64) as Buffer;
  return timingSafeEqual(hash, Buffer.from(saved, 'hex'));
}

export function cookie(request: Request, name: string) {
  return (request.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))?.[1];
}

export function setCookie(response: Response, request: Request, name: string, value: string, maxAge: number) {
  response.cookie(name, value, {
    path: '/', httpOnly: true, sameSite: 'lax', maxAge: maxAge * 1000,
    secure: request.secure || publicOrigin?.startsWith('https:') === true
  });
}

export async function adminSession(request: Request) {
  const token = cookie(request, cookieName);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return undefined;
  return get<Session>('SELECT token_hash, username, csrf FROM admin_sessions WHERE token_hash = ? AND expires_at > ?',
    digest(token), Date.now());
}

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const session = await adminSession(request);
    requireValue(session, 'Sign in to manage the shop.', 401);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const submitted = request.get('x-csrf-token') || '';
      requireValue(/^[a-f0-9]{64}$/.test(submitted) &&
        timingSafeEqual(Buffer.from(submitted), Buffer.from(session.csrf)), 'Refresh the admin page and try again.', 403);
    }
    request.shopAdmin = session;
    return true;
  }
}

export async function signIn(body: Record<string, unknown>, request: Request, response: Response) {
  const username = cleanText(body.username, 'Username', 80, 1).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  requireValue(password.length >= 1 && password.length <= 256, 'Enter your password.');
  const admin = await get<{ password_hash: string }>('SELECT password_hash FROM admins WHERE username = ?', username);
  const matches = await verifyPassword(password, admin?.password_hash || await dummyHash);
  requireValue(admin && matches, 'Username or password is incorrect.', 401);

  const token = opaqueToken();
  const csrf = opaqueToken();
  const now = Date.now();
  await atomic(async () => {
    const current = await get<{ password_hash: string }>('SELECT password_hash FROM admins WHERE username = ? FOR UPDATE', username);
    requireValue(current?.password_hash === admin.password_hash, 'Username or password is incorrect.', 401);
    const existing = await adminSession(request);
    if (existing) await run('DELETE FROM admin_sessions WHERE token_hash = ?', existing.token_hash);
    await run('INSERT INTO admin_sessions VALUES (?, ?, ?, ?)', digest(token), username, csrf, now + sessionSeconds * 1000);
  }, false)();
  setCookie(response, request, cookieName, token, sessionSeconds);
  return { username, csrf };
}

export async function signOut(request: AdminRequest, response: Response) {
  await run('DELETE FROM admin_sessions WHERE token_hash = ?', request.shopAdmin.token_hash);
  setCookie(response, request, cookieName, '', 0);
}
