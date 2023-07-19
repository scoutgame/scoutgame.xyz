import { Grid } from '@mui/material';
import useSWR from 'swr';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import { useMemberCollections } from '../../hooks/useMemberCollections';
import { useMemberPropertyValues } from '../../hooks/useMemberPropertyValues';

import { CollectionWidget } from './CollectionWidget';
import { EnsWidget } from './EnsWidget';
import { LensProfileWidget } from './LensProfileWidget';
import { MemberPropertiesWidget } from './MemberPropertiesWidget';
import { SummonProfileWidget } from './SummonProfileWidget';

const profileWidgets = ['charmverse', 'collection', 'ens', 'lens', 'summon'] as const;

export function ProfileWidgets({ userId }: { userId: string }) {
  const { space } = useCurrentSpace();
  const { memberPropertyValues = [], isLoading: isLoadingMemberPropertiesValues } = useMemberPropertyValues(userId);

  const { data: ensProfile, isLoading: isLoadingEnsProfile } = useSWR(`public/profile/${userId}/ens`, () =>
    charmClient.publicProfile.getEnsProfile(userId)
  );

  const { data: lensProfile, isLoading: isLoadingLensProfile } = useSWR(`public/profile/${userId}/lens`, () =>
    charmClient.publicProfile.getLensProfile(userId)
  );

  const { data: summonProfile, isLoading: isLoadingSummonProfile } = useSWR(`public/profile/${userId}/summon`, () =>
    charmClient.publicProfile.getSummonProfile(userId)
  );

  const { isFetchingNfts, isFetchingPoaps, mutateNfts, nfts, nftsError, poaps, poapsError } = useMemberCollections({
    memberId: userId
  });

  const pinnedNfts = nfts.filter((nft) => nft.isPinned);
  const hideCollections = pinnedNfts.length === 0 && poaps.length === 0;
  const isLoading =
    isLoadingSummonProfile &&
    isLoadingEnsProfile &&
    isFetchingPoaps &&
    isFetchingNfts &&
    isLoadingMemberPropertiesValues &&
    isLoadingLensProfile;

  if (isLoading) {
    return <LoadingComponent isLoading />;
  }

  return (
    <Grid container spacing={4}>
      {profileWidgets.map((profileWidget) => {
        switch (profileWidget) {
          case 'ens':
            return (
              ensProfile && (
                <Grid item xs={12} md={6} alignItems='stretch' key={profileWidget}>
                  <EnsWidget ensProfile={ensProfile} />
                </Grid>
              )
            );

          case 'collection':
            return (
              !hideCollections &&
              (!nftsError || !poapsError) && (
                <Grid item xs={12} md={6} alignItems='stretch' key={profileWidget}>
                  <CollectionWidget mutateNfts={mutateNfts} nfts={nfts} poaps={poaps} userId={userId} />
                </Grid>
              )
            );

          case 'charmverse':
            return space ? (
              <Grid item xs={12} md={6} alignItems='stretch' key={profileWidget}>
                <MemberPropertiesWidget memberPropertyValues={memberPropertyValues} userId={userId} />
              </Grid>
            ) : null;

          case 'summon': {
            return (
              summonProfile && (
                <Grid item xs={12} md={6} alignItems='stretch' key={profileWidget}>
                  <SummonProfileWidget summonProfile={summonProfile} />
                </Grid>
              )
            );
          }

          case 'lens':
            return (
              lensProfile && (
                <Grid item xs={12} md={6} alignItems='stretch' key={profileWidget}>
                  <LensProfileWidget lensProfile={lensProfile} />
                </Grid>
              )
            );

          default:
            return null;
        }
      })}
    </Grid>
  );
}
