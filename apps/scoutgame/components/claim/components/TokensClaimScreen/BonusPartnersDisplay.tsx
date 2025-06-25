'use client';

import { Stack, Tooltip } from '@mui/material';
import type { PartnerReward } from '@packages/scoutgame/partnerRewards/constants';
import { partnerRewardRecord } from '@packages/scoutgame/partnerRewards/constants';
import type { ScoutPartnerInfo } from '@packages/scoutgame/scoutPartners/getScoutPartnersInfo';
import Image from 'next/image';

export function BonusPartnersDisplay({
  bonusPartners = [],
  size = 20,
  scoutPartners
}: {
  scoutPartners: ScoutPartnerInfo[];
  bonusPartners?: string[];
  size?: number;
}) {
  if (bonusPartners.length === 0) {
    return null;
  }

  return (
    <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='flex-end'>
      {bonusPartners.map((partner) => {
        const scoutPartner = scoutPartners.find((_partner) => _partner.id === partner);

        return (
          <Tooltip
            open
            key={partner}
            title={partnerRewardRecord[partner as PartnerReward]?.label || scoutPartner?.text}
          >
            <Image
              width={size}
              height={size}
              src={partnerRewardRecord[partner as PartnerReward]?.icon || scoutPartner?.image || ''}
              alt=''
            />
          </Tooltip>
        );
      })}
    </Stack>
  );
}
