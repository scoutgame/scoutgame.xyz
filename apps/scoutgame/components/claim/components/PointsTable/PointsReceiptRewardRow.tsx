import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link, Stack, TableCell, TableRow, Typography } from '@mui/material';
import { getChainById } from '@packages/blockchain/chains';
import type {
  OptimismNewScoutPartnerReward,
  OptimismReferralChampionPartnerReward,
  OctantBaseContributionPartnerReward,
  PartnerReward
} from '@packages/scoutgame/points/getPartnerRewards';
import type {
  BuilderPointsReceiptReward,
  LeaderboardRankPointsReceiptReward,
  PointsReceiptReward,
  SeasonPointsReceiptsReward,
  SoldNftsPointsReceiptReward
} from '@packages/scoutgame/points/getPointsReceiptsRewards';
import { DateTime } from 'luxon';
import Image from 'next/image';

import { PointsCell } from '../common/PointsCell';

function getOrdinal(n: number): string {
  const ordinal = new Intl.PluralRules('en', { type: 'ordinal' }).select(n);
  const suffix = { zero: '', one: 'st', two: 'nd', few: 'rd', many: 'th', other: 'th' }[ordinal];
  return `${n}${suffix}`;
}

function BuilderRewardRow({ builderReward }: { builderReward: BuilderPointsReceiptReward }) {
  return (
    <TableRow>
      <TableCell align='left'>
        <Typography>Developer rewards</Typography>
      </TableCell>
      <TableCell align='center'>
        <Typography>{builderReward.week}</Typography>
      </TableCell>
      <TableCell align='right'>
        <PointsCell points={builderReward.points} />
      </TableCell>
    </TableRow>
  );
}

function LeaderboardRankRewardRow({
  leaderboardRankReward
}: {
  leaderboardRankReward: LeaderboardRankPointsReceiptReward;
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
        <PointsCell points={leaderboardRankReward.points} />
      </TableCell>
    </TableRow>
  );
}

function SoldNftsRewardRow({ soldNftsReward }: { soldNftsReward: SoldNftsPointsReceiptReward }) {
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
        <PointsCell points={soldNftsReward.points} />
      </TableCell>
    </TableRow>
  );
}

function SeasonRewardRow({ seasonReward }: { seasonReward: SeasonPointsReceiptsReward }) {
  return (
    <TableRow>
      <TableCell align='left'>
        <Typography>{seasonReward.title}</Typography>
      </TableCell>
      <TableCell align='center'>
        <Typography>-</Typography>
      </TableCell>
      <TableCell align='right'>
        <PointsCell points={seasonReward.points} />
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
          <Typography>{partnerReward.points}</Typography>
          <Image alt='crypto icon' src='/images/crypto/usdc.png' width={20} height={20} />
        </Stack>
      </TableCell>
    </TableRow>
  );
}

function NewScoutPartnerRewardRow({ partnerReward }: { partnerReward: OptimismNewScoutPartnerReward }) {
  const blockExplorerUrl = getChainById(partnerReward.chainId)?.blockExplorerUrls[0];
  return (
    <TableRow>
      <TableCell align='left'>
        <Stack direction='row' alignItems='center' justifyContent='flex-start' gap={0.5}>
          <Typography>New Scout {getOrdinal(partnerReward.position)}</Typography>
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
          <Typography>{partnerReward.points}</Typography>
          <Image alt='crypto icon' src='/images/crypto/op.png' width={20} height={20} />
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
          <Typography>{partnerReward.points}</Typography>
          <Image alt='crypto icon' src='/images/crypto/op.png' width={20} height={20} />
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export function PointsReceiptRewardRow({
  pointsReceiptReward
}: {
  pointsReceiptReward: PointsReceiptReward | PartnerReward;
}) {
  if (pointsReceiptReward.type === 'builder') {
    return <BuilderRewardRow builderReward={pointsReceiptReward} />;
  } else if (pointsReceiptReward.type === 'leaderboard_rank') {
    return <LeaderboardRankRewardRow leaderboardRankReward={pointsReceiptReward} />;
  } else if (pointsReceiptReward.type === 'sold_nfts') {
    return <SoldNftsRewardRow soldNftsReward={pointsReceiptReward} />;
  } else if (pointsReceiptReward.type === 'season') {
    return <SeasonRewardRow seasonReward={pointsReceiptReward} />;
  } else if (pointsReceiptReward.type === 'optimism_new_scout') {
    return <NewScoutPartnerRewardRow partnerReward={pointsReceiptReward} />;
  } else if (pointsReceiptReward.type === 'optimism_referral_champion') {
    return <ReferralChampionPartnerRewardRow partnerReward={pointsReceiptReward} />;
  } else if (pointsReceiptReward.type === 'octant_base_contribution') {
    return <OctantBaseContributionPartnerRewardRow partnerReward={pointsReceiptReward} />;
  }

  return null;
}
