import { prisma } from '@charmverse/core/prisma-client';
import { getBuilderEventsForPartnerRewards } from '@packages/scoutgame/partnerRewards/getBuilderEventsForPartnerReward';

import type { IssueTagAmount } from 'components/partners/IssueTagAmountFields';

export async function getBuildersForPartner({
  week,
  scoutPartnerId,
  includeIssueTier = false
}: {
  includeIssueTier?: boolean;
  week: string;
  scoutPartnerId: string;
}) {
  const partner = await prisma.scoutPartner.findUnique({
    where: {
      id: scoutPartnerId
    },
    select: {
      issueTagTokenAmounts: true
    }
  });

  const issueTags = ((partner?.issueTagTokenAmounts as unknown as IssueTagAmount[]) || []).map(
    (issueTag) => issueTag.tag
  );

  const builderEvents = await getBuilderEventsForPartnerRewards({ week, scoutPartnerId });

  return builderEvents.map((event) => ({
    'User Name': event.githubUser.builder!.displayName,
    'Profile Link': `https://scoutgame.xyz/u/${event.githubUser.builder!.path}`,
    Email: event.githubUser.builder!.email,
    Repo: `${event.repo.owner}/${event.repo.name}`,
    Date: event.completedAt?.toDateString(),
    Link: event.url,
    Issue: event.issues.length
      ? `https://github.com/${event.repo.owner}/${event.repo.name}/issues/${event.issues[0].issueNumber}`
      : '',
    ...(includeIssueTier
      ? {
          Tier: event.issues.length ? event.issues[0].tags.filter((tag) => issueTags.includes(tag)).join(', ') : ''
        }
      : {})
  }));
}
