import {
  Body, Controller, Delete, Get, Head, HttpCode, Param, Patch, Post, Put, Query, Req, Res, UseGuards
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AdminGuard, adminSession, signIn, signOut, type AdminRequest } from './auth';
import {
  catalogForm, categories, deleteCategory, deleteOffer, deleteProduct, offers, offersTab,
  products, saveCategory, saveOffer, saveOffersTab, saveProduct
} from './catalog';
import { get, run } from './db';
import { freeShippingAt, orders, placeOrder, quoteCart, shippingCharge, updateOrder, validEmail } from './orders';
import { recordVisit, trafficSummary } from './traffic';
import { identifier, integer, record, requireValue } from './validation';

async function catalog(admin = false) {
  const [categoryList, productList, offerList, tab] = await Promise.all([categories(), products(admin), offers(admin), offersTab()]);
  return { categories: categoryList, products: productList, offers: offerList, offersTab: tab };
}

@Controller('api')
export class ShopController {
  @Get('catalog')
  async catalog() {
    return { ...await catalog(), shipping: { freeAt: freeShippingAt, charge: shippingCharge } };
  }

  @Post('checkout/quote')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  quote(@Body() body: unknown) {
    return quoteCart(record(body).items);
  }

  @Post('checkout/orders')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  checkout(@Body() body: unknown) {
    return placeOrder(record(body));
  }

  @Post('traffic')
  @HttpCode(204)
  traffic(@Req() request: Request, @Res({ passthrough: true }) response: Response, @Body() body: unknown) {
    return recordVisit(request, response, record(body).page);
  }

  @Post('newsletter')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async newsletter(@Body() body: unknown) {
    await run('INSERT IGNORE INTO newsletter VALUES (?, ?)', validEmail(record(body).email), Date.now());
    return { subscribed: true };
  }

  @Post('admin/login')
  @HttpCode(200)
  @Throttle({ default: { limit: 8, ttl: 900_000 } })
  login(@Req() request: Request, @Res({ passthrough: true }) response: Response, @Body() body: unknown) {
    return signIn(record(body), request, response);
  }
}

const editableCollections = new Set(['categories', 'products', 'offers']);

@Controller('api/admin')
@UseGuards(AdminGuard)
export class AdminController {
  @Get('session')
  session(@Req() request: AdminRequest) {
    const { username, csrf } = request.shopAdmin;
    return { username, csrf };
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Req() request: AdminRequest, @Res({ passthrough: true }) response: Response) {
    return signOut(request, response);
  }

  @Get('catalog')
  catalog() { return catalog(true); }

  @Get('orders')
  orders(@Query('status') status: unknown, @Query('page') page: unknown) {
    requireValue(status == null || typeof status === 'string', 'Invalid status filter.');
    requireValue(page == null || typeof page === 'string', 'Invalid page.');
    return orders(status ?? undefined, integer(Number(page ?? '1'), 'Page', 1, 100_000));
  }

  @Get('traffic')
  traffic() { return trafficSummary(); }

  @Put('offers-tab')
  @HttpCode(204)
  offersTab(@Body() body: unknown) { return saveOffersTab(record(body)); }

  @Patch('orders/:id')
  @HttpCode(204)
  updateOrder(@Param('id') id: string, @Body() body: unknown) {
    requireValue(/^OW-[0-9A-F]{16}$/.test(id), 'Order not found.', 404);
    return updateOrder(id, record(body));
  }

  @Post(':collection')
  async create(@Param('collection') collection: string, @Req() request: Request) {
    return { id: await this.save(collection, request) };
  }

  @Put(':collection/:id')
  async update(@Param('collection') collection: string, @Param('id') id: string, @Req() request: Request) {
    return { id: await this.save(collection, request, identifier(id)) };
  }

  @Delete(':collection/:id')
  @HttpCode(204)
  remove(@Param('collection') collection: string, @Param('id') rawId: string) {
    requireValue(editableCollections.has(collection), 'Endpoint not found.', 404);
    const id = identifier(rawId);
    if (collection === 'products') return deleteProduct(id);
    if (collection === 'offers') return deleteOffer(id);
    return deleteCategory(id);
  }

  private async save(collection: string, request: Request, id?: string) {
    requireValue(editableCollections.has(collection), 'Endpoint not found.', 404);
    if (collection === 'categories') return saveCategory(record(request.body), id);
    if (collection === 'products') return saveProduct(await catalogForm(request), id);
    return saveOffer(await catalogForm(request, true), id);
  }
}

type Media = { type: string; size: number; published: number };

@Controller('media')
export class MediaController {
  @Head(':id')
  head(@Param('id') id: string, @Req() request: Request, @Res() response: Response) {
    return this.send(id, request, response);
  }

  @Get(':id')
  async send(@Param('id') id: string, @Req() request: Request, @Res() response: Response) {
    requireValue(/^[a-f0-9-]{36}$/.test(id), 'Media not found.', 404);
    const file = await get<Media>(`SELECT type, OCTET_LENGTH(data) AS size,
      (EXISTS (SELECT 1 FROM products WHERE media_id = ? AND active = 1) OR
       EXISTS (SELECT 1 FROM offer_media om JOIN offers o ON o.id = om.offer_id WHERE om.media_id = ? AND o.active = 1)) AS published
      FROM media WHERE id = ?`, id, id, id);
    requireValue(file && (file.published || await adminSession(request)), 'Media not found.', 404);
    response.set({
      'Content-Type': file.type, 'Accept-Ranges': 'bytes',
      'Cache-Control': file.published ? 'public, max-age=300' : 'private, no-store'
    });
    const range = request.get('range');
    let start = 0;
    let end = file.size - 1;
    if (range) {
      const match = range.match(/^bytes=(\d*)-(\d*)$/);
      if (match?.[1]) {
        start = Number(match[1]);
        if (match[2]) end = Math.min(end, Number(match[2]));
      } else if (match?.[2]) {
        start = Math.max(0, file.size - Number(match[2]));
      } else start = file.size;
      if (start > end) return response.status(416).set('Content-Range', `bytes */${file.size}`).end();
      response.status(206).set('Content-Range', `bytes ${start}-${end}/${file.size}`);
    }
    const length = end - start + 1;
    if (request.method === 'HEAD') return response.set('Content-Length', String(length)).end();
    const data = await get<{ bytes: Buffer }>('SELECT SUBSTRING(data, ?, ?) AS bytes FROM media WHERE id = ?', start + 1, length, id);
    requireValue(data, 'Media not found.', 404);
    return response.end(data.bytes);
  }
}
