import { log } from '@charmverse/core/log';
import type Koa from 'koa';

export async function globalApiErrorHandler(ctx: Koa.Context, next: () => Promise<any>) {
  try {
    await next();
  } catch (err: any) {
    log.error('API Error', { status: err.status, error: err.message, errorRaw: err });
    ctx.status = err.status || 500;
    ctx.body = {
      message: err.message || 'Internal Server Error'
    };
  }
}
