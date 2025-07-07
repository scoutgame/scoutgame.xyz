import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link, Stack, TableCell, TableRow, Typography } from '@mui/material';
import { getChainById } from '@packages/blockchain/chains';
import type {
  OptimismReferralChampionPartnerReward,
  OctantBaseContributionPartnerReward,
  PartnerReward,
  GooddollarContributionPartnerReward
} from '@packages/scoutgame/partnerRewards/getPartnerRewardsForScout';
import type {
  DeveloperTokensReceiptReward,
  LeaderboardRankTokensReceiptReward,
  TokensReceiptReward,
  MatchupWinnerTokensReceiptReward,
  SoldNftsTokensReceiptReward
} from '@packages/scoutgame/tokens/getTokensReceiptsRewards';
import { DateTime } from 'luxon';
import Image from 'next/image';

import { TokensCell } from '../common/TokensCell';

function getOrdinal(n: number): string {
  const ordinal = new Intl.PluralRules('en', { type: 'ordinal' }).select(n);
  const suffix = { zero: '', one: 'st', two: 'nd', few: 'rd', many: 'th', other: 'th' }[ordinal];
  return `${n}${suffix}`;
}

function DeveloperRewardRow({ developerReward }: { developerReward: DeveloperTokensReceiptReward }) {
  return (
    <TableRow>
      <TableCell align='left'>
        <Typography>Developer rewards</Typography>
      </TableCell>
      <TableCell align='center'>
        <Typography>{developerReward.week}</Typography>
      </TableCell>
      <TableCell align='right'>
        <TokensCell tokens={developerReward.tokens} />
      </TableCell>
    </TableRow>
  );
}

function LeaderboardRankRewardRow({
  leaderboardRankReward
}: {
  leaderboardRankReward: LeaderboardRankTokensReceiptReward;
}) {
  return (
    <TableRow>
      <TableCell align='left'>
        <Typography>Finished {getOrdinal(leaderboardRankReward.rank)}</Typography>
      </TableCell>
      <TableCell align='center'>
        <Typography>{leaderboardRankReward.week}</Typography>
      </TableCell>
      <TableCell align='right'>
        <TokensCell tokens={leaderboardRankReward.tokens} />
      </TableCell>
    </TableRow>
  );
}

function SoldNftsRewardRow({ soldNftsReward }: { soldNftsReward: SoldNftsTokensReceiptReward }) {
  return (
    <TableRow>
      <TableCell align='left'>
        <Stack direction='row' alignItems='center' justifyContent='flex-start' gap={0.5}>
          <Typography>Sold {soldNftsReward.quantity}</Typography>
          <Image alt='card' src='/images/profile/icons/card.svg' width={18} height={18} />
        </Stack>
      </TableCell>
      <TableCell align='center'>
        <Typography>{soldNftsReward.week}</Typography>
      </TableCell>
      <TableCell align='right'>
        <TokensCell tokens={soldNftsReward.tokens} />
      </TableCell>
    </TableRow>
  );
}

function OctantBaseContributionPartnerRewardRow({
  partnerReward
}: {
  partnerReward: OctantBaseContributionPartnerReward;
}) {
  const blockExplorerUrl = getChainById(partnerReward.chainId)?.blockExplorerUrls[0];
  const OrgOrUser = partnerReward.prLink.split('/').at(-4);
  const repoName = partnerReward.prLink.split('/').at(-3);
  const prNumber = partnerReward.prLink.split('/').at(-1);

  return (
    <TableRow>
      <TableCell align='left'>
        <Stack direction='row' alignItems='center' justifyContent='flex-start' gap={0.5}>
          <Typography>
            Octant & Base Contribution
            <br />
            <Link href={partnerReward.prLink} target='_blank'>
              {OrgOrUser}/{repoName}#{prNumber}
            </Link>
          </Typography>
          {partnerReward.txHash && blockExplorerUrl ? (
            <Link
              href={`${blockExplorerUrl}/tx/${partnerReward.txHash}`}
              target='_blank'
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </Link>
          ) : null}
        </Stack>
      </TableCell>
      <TableCell align='center'>
        <Typography>{partnerReward.week}</Typography>
      </TableCell>
      <TableCell align='right'>
        <Stack direction='row' alignItems='center' justifyContent='flex-end' gap={0.5}>
          <Typography>{partnerReward.tokens}</Typography>
          <Image alt='' src='/images/crypto/usdc.png' width={20} height={20} />
        </Stack>
      </TableCell>
    </TableRow>
  );
}

function GooddollarContributionPartnerRewardRow({
  partnerReward
}: {
  partnerReward: GooddollarContributionPartnerReward;
}) {
  const blockExplorerUrl = getChainById(partnerReward.chainId)?.blockExplorerUrls[0];
  const OrgOrUser = partnerReward.prLink.split('/').at(-4);
  const repoName = partnerReward.prLink.split('/').at(-3);
  const prNumber = partnerReward.prLink.split('/').at(-1);

  return (
    <TableRow>
      <TableCell align='left'>
        <Stack direction='row' alignItems='center' justifyContent='flex-start' gap={0.5}>
          <Typography>
            Gooddollar Contribution
            <br />
            <Link href={partnerReward.prLink} target='_blank'>
              {OrgOrUser}/{repoName}#{prNumber}
            </Link>
          </Typography>
          {partnerReward.txHash && blockExplorerUrl ? (
            <Link
              href={`${blockExplorerUrl}/tx/${partnerReward.txHash}`}
              target='_blank'
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </Link>
          ) : null}
        </Stack>
      </TableCell>
      <TableCell align='center'>
        <Typography>{partnerReward.week}</Typography>
      </TableCell>
      <TableCell align='right'>
        <Stack direction='row' alignItems='center' justifyContent='flex-end' gap={0.5}>
          <Typography>{partnerReward.tokens}</Typography>
          <Image alt='' src='/images/logos/gooddollar.png' width={20} height={20} />
        </Stack>
      </TableCell>
    </TableRow>
  );
}

function ReferralChampionPartnerRewardRow({ partnerReward }: { partnerReward: OptimismReferralChampionPartnerReward }) {
  const blockExplorerUrl = getChainById(partnerReward.chainId)?.blockExplorerUrls[0];
  return (
    <TableRow>
      <TableCell align='left'>
        <Stack direction='row' alignItems='center' justifyContent='flex-start' gap={0.5}>
          <Typography>
            Referral Champion{' '}
            {partnerReward.date ? DateTime.fromJSDate(new Date(partnerReward.date)).toFormat('d/MM/yy') : ''}
          </Typography>
          {partnerReward.txHash && blockExplorerUrl ? (
            <Link
              href={`${blockExplorerUrl}/tx/${partnerReward.txHash}`}
              target='_blank'
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </Link>
          ) : null}
        </Stack>
      </TableCell>
      <TableCell align='center'>
        <Typography>{partnerReward.week}</Typography>
      </TableCell>
      <TableCell align='right'>
        <Stack direction='row' alignItems='center' justifyContent='flex-end' gap={0.5}>
          <Typography>{partnerReward.tokens}</Typography>
          <Image alt='' src='/images/crypto/op.png' width={20} height={20} />
        </Stack>
      </TableCell>
    </TableRow>
  );
}

function MatchupWinnerRewardRow({ reward }: { reward: MatchupWinnerTokensReceiptReward }) {
  return (
    <TableRow>
      <TableCell align='left'>
        <Stack direction='row' alignItems='center' justifyContent='flex-start' gap={0.5}>
          <Typography>Matchup Winner</Typography>
        </Stack>
      </TableCell>
      <TableCell align='center'>
        <Typography>{reward.week}</Typography>
      </TableCell>
      <TableCell align='right'>
        <Stack direction='row' alignItems='center' justifyContent='flex-end' gap={0.5}>
          <Typography sx={{ ml: 1 }}>{reward.opAmount}</Typography>
          <Image alt='' src='/images/crypto/op.png' width={20} height={20} />
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export function TokensReceiptRewardRow({
  tokensReceiptReward
}: {
  tokensReceiptReward: TokensReceiptReward | PartnerReward;
}) {
  if (tokensReceiptReward.type === 'developer') {
    return <DeveloperRewardRow developerReward={tokensReceiptReward} />;
  } else if (tokensReceiptReward.type === 'leaderboard_rank') {
    return <LeaderboardRankRewardRow leaderboardRankReward={tokensReceiptReward} />;
  } else if (tokensReceiptReward.type === 'sold_nfts') {
    return <SoldNftsRewardRow soldNftsReward={tokensReceiptReward} />;
  } else if (tokensReceiptReward.type === 'matchup_winner') {
    return <MatchupWinnerRewardRow reward={tokensReceiptReward} />;
  } else if (tokensReceiptReward.type === 'optimism_referral_champion') {
    return <ReferralChampionPartnerRewardRow partnerReward={tokensReceiptReward} />;
  } else if (tokensReceiptReward.type === 'octant') {
    return (
      <OctantBaseContributionPartnerRewardRow
        partnerReward={tokensReceiptReward as OctantBaseContributionPartnerReward}
      />
    );
  } else if (tokensReceiptReward.type === 'gooddollar') {
    return (
      <GooddollarContributionPartnerRewardRow
        partnerReward={tokensReceiptReward as GooddollarContributionPartnerReward}
      />
    );
  }

  return null;
}
