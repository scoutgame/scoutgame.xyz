import { processDuneAnalytics } from '../apps/cron/src/tasks/processDuneAnalytics';
import Koa from 'koa';

processDuneAnalytics({} as Koa.Context);
