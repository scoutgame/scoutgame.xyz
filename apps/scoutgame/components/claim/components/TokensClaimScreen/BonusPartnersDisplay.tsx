'use client';

import { Stack, Tooltip } from '@mui/material';
import type { BonusPartner, PartnerReward } from '@packages/scoutgame/partnerRewards/constants';
import { bonusPartnersRecord, partnerRewardRecord } from '@packages/scoutgame/partnerRewards/constants';
import Image from 'next/image';

export function BonusPartnersDisplay({
  bonusPartners = [],
  size = 20
}: {
  bonusPartners?: (BonusPartner | PartnerReward)[];
  size?: number;
}) {
  if (bonusPartners.length === 0) {
    return null;
  }

  return (
    <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='flex-end'>
      {bonusPartners.map((partner) => (
        <Tooltip
          open
          key={partner}
          title={
            partnerRewardRecord[partner as PartnerReward]?.label || bonusPartnersRecord[partner as BonusPartner]?.name
          }
        >
          <Image
            width={size}
            height={size}
            src={
              partnerRewardRecord[partner as PartnerReward]?.icon || bonusPartnersRecord[partner as BonusPartner]?.icon
            }
            alt=''
          />
        </Tooltip>
      ))}
    </Stack>
  );
}
