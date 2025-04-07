import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';
import { getScoutedBuilders } from '@packages/scoutgame/scouts/getScoutedBuilders';

export async function getMyDevelopersForMatchup({ scoutId }: { scoutId: string }) {
  const developers = await getScoutedBuilders({ loggedInScoutId: scoutId, scoutIdInView: scoutId });
  const nftsByType = developers.reduce(
    (acc, developer) => {
      acc[developer.nftType] = acc[developer.nftType] || [];
      acc[developer.nftType].push(developer);
      return acc;
    },
    {} as Record<string, BuilderInfo[]>
  );
  return (
    developers
      // remove starter cards if they own a standard already
      .filter((developer) => {
        if (developer.nftType === 'starter_pack') {
          return !nftsByType.default.some((nft) => nft.id === developer.id);
        }
        return true;
      })
      .map((developer) => {
        const starterCard = nftsByType.starter_pack.find((nft) => nft.id === developer.id);
        return {
          ...developer,
          showAdditionalStarterCard: !!starterCard,
          // use developer image if no starter card image, just in case
          starterCardImage: starterCard ? starterCard?.nftImageUrl || developer.nftImageUrl : undefined
        };
      })
  );
}
