import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link, Stack, TableCell, TableRow, Typography } from '@mui/material';
import { getChainById } from '@packages/blockchain/chains';
import type {
  OptimismNewScoutPartnerReward,
  OptimismReferralChampionReward,
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

function NewScoutPartnerRewardRow({ newScoutPartnerReward }: { newScoutPartnerReward: OptimismNewScoutPartnerReward }) {
  const blockExplorerUrl = getChainById(newScoutPartnerReward.chainId)?.blockExplorerUrls[0];
  return (
    <TableRow>
      <TableCell align='left'>
        <Stack direction='row' alignItems='center' justifyContent='flex-start' gap={0.5}>
          <Typography>New Scout {getOrdinal(newScoutPartnerReward.position)}</Typography>
          {newScoutPartnerReward.txHash && blockExplorerUrl ? (
            <Link
              href={`${blockExplorerUrl}/tx/${newScoutPartnerReward.txHash}`}
              target='_blank'
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </Link>
          ) : null}
        </Stack>
      </TableCell>
      <TableCell align='center'>
        <Typography>{newScoutPartnerReward.week}</Typography>
      </TableCell>
      <TableCell align='right'>
        <Stack direction='row' alignItems='center' justifyContent='flex-end' gap={0.5}>
          <Typography>{newScoutPartnerReward.points}</Typography>
          <Image alt='crypto icon' src='/images/crypto/op.png' width={20} height={20} />
        </Stack>
      </TableCell>
    </TableRow>
  );
}

function ReferralChampionRewardRow({
  referralChampionReward
}: {
  referralChampionReward: OptimismReferralChampionReward;
}) {
  const blockExplorerUrl = getChainById(referralChampionReward.chainId)?.blockExplorerUrls[0];
  return (
    <TableRow>
      <TableCell align='left'>
        <Stack direction='row' alignItems='center' justifyContent='flex-start' gap={0.5}>
          <Typography>
            Referrals {DateTime.fromJSDate(new Date(referralChampionReward.date)).toFormat('d/MM/yy')}
          </Typography>
          {referralChampionReward.txHash && blockExplorerUrl ? (
            <Link
              href={`${blockExplorerUrl}/tx/${referralChampionReward.txHash}`}
              target='_blank'
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </Link>
          ) : null}
        </Stack>
      </TableCell>
      <TableCell align='center'>
        <Typography>{referralChampionReward.week}</Typography>
      </TableCell>
      <TableCell align='right'>
        <Stack direction='row' alignItems='center' justifyContent='flex-end' gap={0.5}>
          <Typography>{referralChampionReward.points}</Typography>
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
    return <NewScoutPartnerRewardRow newScoutPartnerReward={pointsReceiptReward} />;
  } else if (pointsReceiptReward.type === 'optimism_referral_champion') {
    return <ReferralChampionRewardRow referralChampionReward={pointsReceiptReward} />;
  }

  return null;
}
