import { pricingGetter } from '@root/lib/crypto-price/getters';

import { Carousel } from 'components/common/Carousel/Carousel';
import { getTodaysHotBuilders } from 'lib/builders/getTodaysHotBuilders';

import { BuilderCard } from '../../common/Card/BuilderCard/BuilderCard';

export async function TodaysHotBuildersCarousel({ user }: { user?: { username: string } | null }) {
  const builders = await getTodaysHotBuilders({ limit: 10 });

  const price = await pricingGetter.getQuote('ETH', 'USD').catch(() => ({
    base: 'ETH',
    quote: 'USD',
    amount: 2544.5,
    receivedOn: 1726868673193
  }));

  return (
    <Carousel>
      {builders.map((builder) => (
        <BuilderCard
          key={builder.id}
          builder={{
            ...builder,
            price: Math.round((Number(builder.price) / 18) * price!.amount)
          }}
          showPurchaseButton
          user={user}
        />
      ))}
    </Carousel>
  );
}