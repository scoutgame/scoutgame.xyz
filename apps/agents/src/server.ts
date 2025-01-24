import cors from '@koa/cors'; // CORS middleware
import Koa from 'koa';
import koaBody from 'koa-bodyparser';

import { builderAgentTelegramRouter } from './api/builder-agent/telegram';
import { healthCheckRouter } from './api/health';
import { globalApiErrorHandler } from './middleware';

export const app = new Koa();

// Global Error Handler
app.use(globalApiErrorHandler);

// CORS Middleware
app.use(cors());

// JSON Parser Middleware
app.use(koaBody());

app.use(healthCheckRouter.routes());

app.use(builderAgentTelegramRouter.routes());
