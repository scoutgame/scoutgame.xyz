import { log } from '@charmverse/core/log';
import type { NextApiRequest, NextApiResponse } from 'next';

import { gauge, count } from 'lib/metrics';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ health: 'ok ok' });
}

// need to add a router to this.
export function testDDGauge(req: NextApiRequest, res: NextApiResponse) {
  gauge('health.dd.gauge', 99);
  res.status(200).json({ gauge: 'sent 99 as gauge' });
}

export function testDDCount(req: NextApiRequest, res: NextApiResponse) {
  count('health.dd.count', 1);
  res.status(200).json({ count: 'adding 1 to count' });
}
