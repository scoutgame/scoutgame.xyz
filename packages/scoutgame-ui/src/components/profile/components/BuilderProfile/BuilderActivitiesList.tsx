import { Paper, Stack, Typography } from '@mui/material';
import type { BonusPartner } from '@packages/scoutgame/bonus';
import { bonusPartnersRecord } from '@packages/scoutgame/bonus';
import type { BuilderActivity, OnchainAchievementActivity } from '@packages/scoutgame/builders/getBuilderActivities';
import { getRelativeTime } from '@packages/utils/dates';
import { capitalize } from '@packages/utils/strings';
import Image from 'next/image';
import Link from 'next/link';
import { BiLike } from 'react-icons/bi';
import { LuBookMarked } from 'react-icons/lu';

import { GemsIcon, TransactionIcon } from '../../../common/Icons';

export function getActivityLabel(activity: BuilderActivity, shorten = false) {
  if (activity.type === 'onchain_achievement') {
    return `${capitalize(activity.tier)} Tier!`;
  }
  return activity.type === 'github_event'
    ? activity.contributionType === 'first_pr'
      ? shorten
        ? 'First PR!'
        : 'First contribution!'
      : activity.contributionType === 'regular_pr'
        ? shorten
          ? 'Verified PR!'
          : 'Verified contribution!'
        : activity.contributionType === 'regular_pr_unreviewed'
          ? shorten
            ? 'Regular PR!'
            : 'Contribution accepted!'
          : activity.contributionType === 'third_pr_in_streak'
            ? shorten
              ? 'PR Streak!'
              : 'Contribution streak!'
            : activity.contributionType === 'daily_commit'
              ? shorten
                ? 'Commit!'
                : 'Daily commit!'
              : null
    : activity.type === 'nft_purchase'
      ? 'Scouted by'
      : null;
}

function BuilderActivityLabel({ activity }: { activity: BuilderActivity }) {
  return <Typography component='span'>{getActivityLabel(activity)}</Typography>;
}

function BuilderActivityDetail({ activity }: { activity: BuilderActivity }) {
  return (
    <Stack component='span' flexDirection='row' gap={0.5} alignItems='center'>
      {activity.type === 'nft_purchase' ? (
        <Link href={`/u/${activity.scout.path}`} target='_blank'>
          {activity.scout.displayName}
        </Link>
      ) : activity.type === 'github_event' ? (
        <Link href={activity.url} target='_blank'>
          {activity.repo}
        </Link>
      ) : activity.type === 'onchain_achievement' ? (
        <Link href={`/p/${activity.project.path}`} target='_blank'>
          {activity.project.name}
        </Link>
      ) : null}
    </Stack>
  );
}

export function BuilderActivityGems({
  activity,
  showEmpty = false,
  size = 'medium'
}: {
  activity: BuilderActivity;
  showEmpty?: boolean;
  size?: 'small' | 'medium';
}) {
  return (
    <Stack component='span' flexDirection='row' gap={0.5} alignItems='center'>
      {activity.type === 'github_event' || activity.type === 'onchain_achievement' ? (
        <>
          <Typography component='span' variant={size === 'small' ? 'body2' : 'body1'}>
            +{activity.gems}
          </Typography>
          <GemsIcon size={size === 'small' ? 16 : 20} color={(activity as OnchainAchievementActivity).tier} />
        </>
      ) : showEmpty ? (
        '-'
      ) : null}
    </Stack>
  );
}

function BuilderActivityBonusPartner({
  activity,
  showEmpty = false
}: {
  activity: BuilderActivity;
  showEmpty?: boolean;
}) {
  return activity.type === 'github_event' &&
    activity.bonusPartner &&
    bonusPartnersRecord[activity.bonusPartner as BonusPartner] ? (
    <Image
      width={20}
      height={20}
      src={bonusPartnersRecord[activity.bonusPartner as BonusPartner].icon}
      alt='Bonus Partner'
    />
  ) : showEmpty ? (
    '-'
  ) : null;
}

export function BuilderActivitiesList({ activities }: { activities: BuilderActivity[] }) {
  return (
    <Stack gap={0.5}>
      {activities.map((activity) => {
        return (
          <Paper
            key={activity.id}
            sx={{
              px: {
                xs: 2,
                md: 3
              },
              py: {
                xs: 1.5,
                md: 2
              }
            }}
          >
            <Stack
              gap={{
                xs: 1,
                md: 0.5
              }}
            >
              <Stack flexDirection='row' justifyContent='space-between'>
                <Stack flexDirection='row' gap={0.5} alignItems='center' width='60%'>
                  {activity.type === 'github_event' ? (
                    <LuBookMarked size='15px' />
                  ) : activity.type === 'nft_purchase' ? (
                    <BiLike size='15px' />
                  ) : activity.type === 'onchain_achievement' ? (
                    <TransactionIcon size={15} />
                  ) : null}
                  <BuilderActivityLabel activity={activity} />
                </Stack>
                <BuilderActivityGems activity={activity} />
                <BuilderActivityBonusPartner activity={activity} />
                <Typography width={75} textAlign='right' variant='body2'>
                  {getRelativeTime(activity.createdAt)}
                </Typography>
              </Stack>
              <BuilderActivityDetail activity={activity} />
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
