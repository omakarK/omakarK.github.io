import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { APP_GUARD, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import express from 'express';
import { resolve } from 'node:path';
import { AdminGuard, publicOrigin } from './auth';
import { AdminController, MediaController, ShopController } from './controllers';
import { get, pool } from './db';
import { expireOldRecords } from './traffic';

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }])],
  controllers: [ShopController, AdminController, MediaController],
  providers: [AdminGuard, { provide: APP_GUARD, useClass: ThrottlerGuard }]
})
class ShopModule {}

async function bootstrap() {
  const version = await get("SELECT value FROM settings WHERE setting_key = 'catalog_seeded'");
  if (!version) throw new Error('Run npm run db:setup before starting the shop.');
  await expireOldRecords();
  const app = await NestFactory.create<NestExpressApplication>(ShopModule, { bodyParser: false });
  const server = app.getHttpAdapter().getInstance() as express.Express;
  const client = resolve(__dirname, '../client');
  if (process.env.SHOP_TRUST_PROXY === '1') server.set('trust proxy', 'loopback');
  server.disable('x-powered-by');
  app.use((request: express.Request, response: express.Response, next: express.NextFunction) => {
    response.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
    if (request.path.startsWith('/api/')) {
      response.set('Cache-Control', 'no-store');
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        const origin = request.get('origin');
        const allowed = publicOrigin || `${request.protocol}://${request.get('host')}`;
        if ((origin && origin !== allowed) || request.get('sec-fetch-site') === 'cross-site') {
          return response.status(403).json({ message: 'Open the shop directly to submit this request.' });
        }
        if (request.method !== 'DELETE' && request.path !== '/api/admin/logout' &&
            !request.is(['application/json', 'multipart/form-data'])) {
          return response.status(415).json({ message: 'Expected JSON or a file upload.' });
        }
      }
    }
    if (['/admin', '/admin/', '/admin.html'].includes(request.path)) {
      response.set({ 'Cache-Control': 'no-store', 'Content-Security-Policy':
        "default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'" });
    }
    next();
  });
  app.use(express.json({ limit: '64kb', strict: true }));
  server.get(['/admin', '/admin/'], (_request, response) => response.sendFile(resolve(client, 'admin.html')));
  app.use(express.static(client, { index: 'index.html' }));
  const cleanup = setInterval(() => {
    expireOldRecords().catch(error => console.error('Could not expire old shop records:', error.message));
  }, 60 * 60 * 1000);
  cleanup.unref();
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1');
}

bootstrap().catch(async error => {
  console.error(`Shop startup failed: ${error.message}`);
  await pool.end();
  process.exitCode = 1;
});
