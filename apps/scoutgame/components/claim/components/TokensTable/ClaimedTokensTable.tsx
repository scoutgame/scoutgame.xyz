import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { IconButton, Stack, Typography } from '@mui/material';
import { getCurrentSeasonStart, getNextSeason, getPreviousSeason, getSeasonConfig } from '@packages/dates/utils';
import { getUserFromSession } from '@packages/nextjs/session/getUserFromSession';
import { safeAwaitSSRData } from '@packages/nextjs/utils/async';
import { getPartnerRewards } from '@packages/scoutgame/partnerRewards/getPartnerRewardsForScout';
import { getTokensReceiptsRewards } from '@packages/scoutgame/tokens/getTokensReceiptsRewards';
import Link from 'next/link';

import { TokensTable } from './TokensTable';

export async function ClaimedTokensTable({ claimedSeason }: { claimedSeason?: string }) {
  const user = await getUserFromSession();

  if (!user) {
    return null;
  }

  const [error, data] = await safeAwaitSSRData(
    Promise.all([
      getTokensReceiptsRewards({
        userId: user.id,
        isClaimed: true,
        season: claimedSeason || getCurrentSeasonStart()
      }),
      getPartnerRewards({
        userId: user.id,
        isClaimed: true,
        season: getCurrentSeasonStart()
      })
    ])
  );

  if (error) {
    return null;
  }

  const [tokensReceiptRewards, partnerRewards] = data;

  claimedSeason = claimedSeason || getCurrentSeasonStart();
  const lastSeason = getPreviousSeason(claimedSeason);
  const nextSeason = getNextSeason(claimedSeason);
  const currentSeason = getSeasonConfig(claimedSeason);

  return (
    <TokensTable
      emptyMessage='History yet to be made.'
      tokensReceiptRewards={tokensReceiptRewards}
      partnerRewards={partnerRewards}
      title={
        <Stack direction='column' alignItems='center' gap={0.5}>
          <Stack direction='row' alignItems='center' gap={0.5}>
            Claimed
          </Stack>
          <Stack>
            <Stack direction='row' gap={1} alignItems='center'>
              <Link href={lastSeason ? `/claim?claimedSeason=${lastSeason}` : ''}>
                <IconButton disabled={!lastSeason} size='small'>
                  <ChevronLeftIcon />
                </IconButton>
              </Link>
              <Typography>{currentSeason.title}</Typography>
              <Link href={nextSeason ? `/claim?claimedSeason=${nextSeason}` : ''}>
                <IconButton disabled={!nextSeason} size='small'>
                  <ChevronRightIcon />
                </IconButton>
              </Link>
            </Stack>
          </Stack>
        </Stack>
      }
      processingPayouts={false}
    />
  );
}
