import type Koa from 'koa';
import Router from 'koa-router';

async function healthCheck(ctx: Koa.Context) {
  ctx.body = {
    status: 'ok'
  };
  ctx.status = 200;
}

export const healthCheckRouter = new Router({
  prefix: '/api/health'
}).get('/', healthCheck);
