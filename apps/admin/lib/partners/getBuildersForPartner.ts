import { getBuilderEventsForPartnerRewards } from '@packages/scoutgame/partnerRewards/getBuilderEventsForPartnerReward';

export async function getBuildersForPartner({
  week,
  scoutPartnerId,
  includeIssueTier = false
}: {
  includeIssueTier?: boolean;
  week: string;
  scoutPartnerId: string;
}) {
  const builderEvents = await getBuilderEventsForPartnerRewards({ week, scoutPartnerId });

  return builderEvents.map((event) => ({
    'User Name': event.githubUser.builder!.displayName,
    'Profile Link': `https://scoutgame.xyz/u/${event.githubUser.builder!.path}`,
    Email: event.githubUser.builder!.email,
    Repo: `${event.repo.owner}/${event.repo.name}`,
    Date: event.completedAt?.toDateString(),
    Link: event.url,
    ...(event.issues.length
      ? {
          Issue: `https://github.com/${event.repo.owner}/${event.repo.name}/issues/${event.issues[0].issueNumber}`,
          ...(includeIssueTier ? { Tier: event.issues[0].tags.join(', ') } : {})
        }
      : {})
  }));
}
