import { Box, Card, Chip, Divider, Stack, Typography } from '@mui/material';
import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import { NftData, ExtendedPoap } from 'lib/blockchain/interfaces';
import useSWRImmutable from 'swr/immutable';
import AggregatedData from './components/AggregatedData';
import CollablandCredentials from './components/CollablandCredentials';
import CommunityRow, { CommunityDetails } from './components/CommunityRow';
import ProfileItemRow, { Collective } from './components/ProfileItemRow';
import UserDetails, { isPublicUser, UserDetailsProps } from './components/UserDetails';
import { useCollablandCredentials } from './hooks/useCollablandCredentials';

function transformPoap (poap: ExtendedPoap): Collective {
  return {
    type: 'poap',
    date: poap.created as string,
    id: poap.id,
    image: poap.imageURL,
    title: poap.name,
    link: `https://app.poap.xyz/token/${poap.tokenId}`,
    isHidden: poap.isHidden
  };
}

function transformNft (nft: NftData): Collective {
  return {
    type: 'nft',
    date: nft.timeLastUpdated,
    id: nft.id,
    image: nft.image ?? nft.imageThumb,
    title: nft.title,
    link: `https://opensea.io/assets/ethereum/${nft.contract}/${nft.tokenId}`,
    isHidden: nft.isHidden
  };
}

export default function PublicProfile (props: UserDetailsProps) {

  const { user } = props;

  const { aeToken } = useCollablandCredentials();
  const { data: credentials, error } = useSWRImmutable(() => !!aeToken, () => charmClient.collabland.importCredentials(aeToken as string));

  const { data, mutate, isValidating: isAggregatedDataValidating } = useSWRImmutable(user ? `userAggregatedData/${user.id}` : null, () => {
    return charmClient.getAggregatedData(user.id);
  });
  const readOnly = isPublicUser(user);

  const { data: poapData, mutate: mutatePoaps, isValidating: isPoapDataValidating } = useSWRImmutable(`/poaps/${user.id}/${readOnly}`, () => {
    return readOnly
      ? Promise.resolve(user.visiblePoaps as ExtendedPoap[])
      : charmClient.getUserPoaps();
  });

  const { data: nftData, mutate: mutateNfts, isValidating: isNftDataValidating } = useSWRImmutable(`/nfts/${user.id}/${readOnly}`, () => {
    return readOnly
      ? Promise.resolve(user.visibleNfts)
      : charmClient.blockchain.listNFTs(user.id);
  });

  const isLoading = !data || !poapData || !nftData || isNftDataValidating || isPoapDataValidating || isAggregatedDataValidating;

  const collectives: Collective[] = [];

  poapData?.forEach(poap => {
    collectives.push(transformPoap(poap));
  });

  nftData?.forEach(nft => {
    collectives.push(transformNft(nft));
  });

  collectives.sort((collectiveA, collectiveB) => new Date(collectiveB.date) > new Date(collectiveA.date) ? 1 : -1);

  async function toggleCommunityVisibility (community: CommunityDetails) {
    await charmClient.profile.updateProfileItem({
      profileItems: [{
        id: community.id,
        isHidden: !community.isHidden,
        type: 'community',
        metadata: null
      }]
    });
    mutate((aggregateData) => {
      return aggregateData ? {
        ...aggregateData,
        communities: aggregateData.communities.map(comm => {
          if (comm.id === community.id) {
            return {
              ...comm,
              isHidden: !community.isHidden
            };
          }
          return comm;
        })
      } : undefined;
    }, {
      revalidate: false
    });
  }

  async function toggleCollectibleVisibility (collective: Collective) {
    await charmClient.profile.updateProfileItem({
      profileItems: [{
        id: collective.id,
        isHidden: !collective.isHidden,
        type: collective.type,
        metadata: null
      }]
    });
    if (collective.type === 'nft') {
      mutateNfts((_nftData) => {
        return _nftData?.map(nft => {
          if (nft.id === collective.id) {
            return {
              ...nft,
              isHidden: !collective.isHidden
            };
          }
          return nft;
        });
      }, {
        revalidate: false
      });
    }
    else {
      mutatePoaps((_poapData) => {
        return _poapData?.map(poap => {
          if (poap.id === collective.id) {
            return {
              ...poap,
              isHidden: !collective.isHidden
            };
          }
          return poap;
        });
      }, {
        revalidate: false
      });
    }
  }

  const bountyEvents = credentials?.bountyEvents ?? [];

  const communities = (data?.communities ?? [])
    .filter((community) => readOnly ? !community.isHidden : true)
    .map((community) => {
      return {
        ...community,
        bounties: bountyEvents.filter(event => event.subject.workspaceId === community.id)
      };
    });

  const discordCommunities = (credentials?.discordEvents ?? []).map((credential): CommunityDetails => ({
    isHidden: false,
    joinDate: credential.createdAt,
    id: credential.subject.discordGuildId,
    name: credential.subject.discordGuildName,
    logo: credential.subject.discordGuildAvatar,
    votes: [],
    proposals: [],
    bounties: []
    // roles: credential.subject.discordRoles.map((role, i) => <><strong>{role.name} </strong>{i < credential.subject.discordRoles.length - 1 && ' and '}</>)} issued on {toMonthDate(credential.createdAt)
  }));

  const allCommunities = communities.concat(discordCommunities)
    .sort((commA, commB) => commB.joinDate > commA.joinDate ? 1 : -1);

  return (
    <Stack spacing={2}>
      <UserDetails {...props} />
      <Divider />
      <LoadingComponent isLoading={isLoading} minHeight={300}>
        <AggregatedData
          totalBounties={data?.bounties || 0}
          totalCommunities={communities.length}
          totalProposals={data?.totalProposals || 0}
          totalVotes={data?.totalVotes || 0}
        />
        {allCommunities.length > 0 ? (
          <>
            <SectionHeader title='Communities' count={allCommunities.length} />
            <Stack gap={2}>
              {allCommunities.map(community => (
                <CommunityRow
                  key={community.id}
                  onClick={() => {
                    toggleCommunityVisibility(community);
                  }}
                  visible={!community.isHidden}
                  showVisibilityIcon={!readOnly}
                  community={community}
                />
              ))}
            </Stack>
          </>
        ) : null}

        {collectives.length > 0 ? (
          <>
            <SectionHeader title='NFTs & POAPs' count={collectives.length} />
            <Stack gap={2}>
              {collectives.map(collective => (
                <ProfileItemRow
                  key={collective.id}
                  showVisibilityIcon={!readOnly}
                  visible={!collective.isHidden}
                  onClick={() => {
                    toggleCollectibleVisibility(collective);
                  }}
                  collective={collective}
                />
              ))}
            </Stack>
          </>
        ) : null}
        <Card>
          <Box p={2} pb={0}>
            <Typography fontWeight={700} fontSize={20}>Verified Credentials</Typography>
          </Box>
          <CollablandCredentials error={error} />
        </Card>
      </LoadingComponent>
    </Stack>
  );
}

function SectionHeader ({ title, count }: { title: string, count: number }) {
  return (
    <Stack flexDirection='row' justifyContent='space-between' alignItems='center' my={2}>
      <Typography
        sx={{
          fontSize: {
            sm: '2em',
            xs: '1.2em'
          },
          fontWeight: 700
        }}
      >
        {title}
      </Typography>
      <Chip label={count} />
    </Stack>
  );
}
