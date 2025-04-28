import { capitalize } from '@packages/utils/strings';

import type { BuilderActivity } from './getDeveloperActivities';

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
