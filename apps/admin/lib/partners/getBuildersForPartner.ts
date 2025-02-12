import type { BonusPartner } from '@packages/scoutgame/bonus';
import { getBuilderEventsForPartnerRewards } from '@packages/scoutgame/partnerReward/getBuilderEventsForPartnerReward';

export async function getBuildersForPartner({ week, bonusPartner }: { week: string; bonusPartner: BonusPartner }) {
  const builderEvents = await getBuilderEventsForPartnerRewards({ week, bonusPartner });

  return builderEvents.map((event) => ({
    'User Name': event.githubUser.builder!.displayName,
    'Profile Link': `https://scoutgame.xyz/u/${event.githubUser.builder!.path}`,
    Email: event.githubUser.builder!.email,
    Repo: `${event.repo.owner}/${event.repo.name}`,
    Date: event.completedAt?.toDateString(),
    Link: event.url
  }));
}
