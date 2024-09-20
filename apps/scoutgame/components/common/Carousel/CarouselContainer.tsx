import 'server-only';

import type { Scout } from '@charmverse/core/prisma-client';
import { pricingGetter } from '@root/lib/crypto-price/getters';
import { delay } from '@root/lib/utils/async';
import dynamic from 'next/dynamic';

import { getTopBuilders } from 'lib/builders/getTopBuilders';
import { getUserFromSession } from 'lib/session/getUserFromSession';

const Carousel = dynamic(() => import('components/common/Carousel/Carousel').then((mod) => mod.Carousel));

export async function CarouselContainer() {
  const scout = await getUserFromSession();
  const price = await pricingGetter.getQuote('ETH', 'USD').catch(() => ({
    base: 'ETH',
    quote: 'USD',
    amount: 2544.5,
    receivedOn: 1726868673193
  }));

  const accounts = await getTopBuilders().then((accs) =>
    accs.map((a) => ({ ...a, price: Math.round(a.price * price!.amount) }))
  );

  return <Carousel items={accounts} scout={scout} />;
}
