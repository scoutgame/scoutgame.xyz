import type Koa from 'koa';
import Router from 'koa-router';

async function healthCheck(ctx: Koa.Context) {
  ctx.body = {
    status: 'ok',
    uptime: `${Math.floor(process.uptime()).toLocaleString()} seconds`
  };
  ctx.status = 200;
}

export const healthCheckRouter = new Router({
  prefix: '/api/health'
}).get('/', healthCheck);
