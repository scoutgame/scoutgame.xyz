import styled from '@emotion/styled';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Chip, Divider, IconButton, Link, Stack, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';
import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import { GetNftsResponse, NftData } from 'lib/nft/interfaces';
import { GetPoapsResponse } from 'lib/poap';
import { showDateWithMonthAndYear } from 'lib/utilities/dates';
import { ExtendedPoap } from 'models';
import { KeyedMutator } from 'swr';
import useSWRImmutable from 'swr/immutable';
import { isPublicUser, UserDetailsProps } from './UserDetails';

interface Collective {
  title: string
  date: string
  id: string
  image: string
  type: 'poap' | 'nft'
  link: string
  isHidden: boolean
}

const StyledStack = styled(Stack)`
  flex-direction: ${({ theme }) => theme.breakpoints.down('sm') ? 'row' : 'column'};
  &:hover .action {
    opacity: 1;
    transition: ${({ theme }) => `${theme.transitions.duration.short}ms opacity ${theme.transitions.easing.easeInOut}`};
  }

  .action {
    opacity: 0;
    transition: ${({ theme }) => `${theme.transitions.duration.short}ms opacity ${theme.transitions.easing.easeInOut}`};
  }

  gap: ${({ theme }) => theme.spacing(2)};
`;

interface ProfileItemProps {
  onClick: () => void,
  visible: boolean,
  showVisibilityIcon: boolean,
  collective: Collective
}

function ProfileItem ({ onClick, collective, visible, showVisibilityIcon }: ProfileItemProps) {
  return (
    <StyledStack>
      {collective.type === 'poap' ? (
        <Link href={collective.link} target='_blank' display='flex'>
          <Avatar size='large' avatar={collective.image} />
        </Link>
      ) : <Avatar isNft size='large' avatar={collective.image} />}
      <Stack justifyContent='center'>
        <Box
          display='flex'
          gap={1}
          alignItems='center'
        >
          <Typography
            fontWeight='bold'
            sx={{
              fontSize: {
                sm: '1.15rem',
                xs: '1.05rem'
              }
            }}
          >{collective.title}
          </Typography>
          {showVisibilityIcon && (
            <IconButton size='small' onClick={onClick}>
              {visible ? (
                <Tooltip title={`Hide ${collective.type.toUpperCase()} from profile`}>
                  <VisibilityIcon className='action' fontSize='small' />
                </Tooltip>
              ) : (
                <Tooltip title={`Show ${collective.type.toUpperCase()} in profile`}>
                  <VisibilityOffIcon className='action' fontSize='small' />
                </Tooltip>
              )}
            </IconButton>
          )}
        </Box>
        <Typography variant='subtitle2'>{showDateWithMonthAndYear(collective.date) ?? '?'}</Typography>
      </Stack>
    </StyledStack>
  );
}

function transformPoap (poap: ExtendedPoap, isHidden: boolean): Collective {
  return {
    type: 'poap',
    date: poap.created as string,
    id: poap.tokenId,
    image: poap.imageURL,
    title: poap.name,
    link: `https://app.poap.xyz/token/${poap.tokenId}`,
    isHidden
  };
}

function transformNft (nft: NftData, isHidden: boolean): Collective {
  return {
    type: 'nft',
    date: nft.timeLastUpdated,
    id: nft.tokenId,
    image: nft.image ?? nft.imageThumb,
    title: nft.title,
    link: '',
    isHidden
  };
}

interface ProfileItemsListProps {
  mutateNfts: KeyedMutator<GetNftsResponse>,
  mutatePoaps: KeyedMutator<GetPoapsResponse>,
  isPublic: boolean,
  title: string,
  collectives: Collective[]
}

function ProfileItemsList ({ collectives, title, isPublic, mutateNfts, mutatePoaps }: ProfileItemsListProps) {

  return (
    <Box>
      <Stack flexDirection='row' justifyContent='space-between' alignItems='center' my={2}>
        <Stack flexDirection='row' gap={1} alignItems='center'>
          <Typography
            sx={{
              typography: {
                sm: 'h1',
                xs: 'h2'
              }
            }}
          >{title}
          </Typography>
        </Stack>
        <Chip label={collectives.length} />
      </Stack>
      <Stack gap={2}>
        {collectives.map(collective => (
          <Box
            key={collective.id}
          >
            <ProfileItem
              showVisibilityIcon={!isPublic}
              visible={!collective.isHidden}
              onClick={async () => {
                await charmClient.profile.updateProfileItem({
                  profileItems: [{
                    id: collective.id,
                    isHidden: !collective.isHidden,
                    type: collective.type,
                    metadata: null
                  }]
                });
                if (collective.type === 'nft') {
                  mutateNfts();
                }
                else {
                  mutatePoaps();
                }
              }}
              collective={collective}
            />
            <Divider sx={{
              mt: 2
            }}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export default function ProfileItems ({ user }: Pick<UserDetailsProps, 'user'>) {
  const isPublic = isPublicUser(user);
  const { data: poapData, mutate: mutatePoaps } = useSWRImmutable(`/poaps/${user.id}/${isPublic}`, () => {
    return isPublicUser(user)
      ? Promise.resolve({ visiblePoaps: user.visiblePoaps, hiddenPoaps: [] } as GetPoapsResponse)
      : charmClient.getUserPoaps();
  });

  const { data: nftData, mutate: mutateNfts } = useSWRImmutable(`/nfts/${user.id}/${isPublic}`, () => {
    return isPublicUser(user)
      ? Promise.resolve({ visibleNfts: user.visibleNfts, hiddenNfts: [] } as GetNftsResponse)
      : charmClient.nft.list(user.id);
  });

  const hiddenPoaps = poapData?.hiddenPoaps ?? [];
  const visiblePoaps = poapData?.visiblePoaps ?? [];
  const visibleNfts = nftData?.visibleNfts ?? [];
  const hiddenNfts = nftData?.hiddenNfts ?? [];

  const hiddenCollectives: Collective[] = [
    ...hiddenPoaps.map(poap => transformPoap(poap, true)),
    ...hiddenNfts.map(poap => transformNft(poap, true))
  ];

  const visibleCollectives: Collective[] = [
    ...visiblePoaps.map(poap => transformPoap(poap, false)),
    ...visibleNfts.map(poap => transformNft(poap, false))
  ];

  return (
    <Stack gap={3}>
      {visibleCollectives.length ? (
        <ProfileItemsList
          collectives={visibleCollectives.sort((collectiveA, collectiveB) => new Date(collectiveB.date) > new Date(collectiveA.date) ? 1 : -1)}
          isPublic={isPublic}
          mutateNfts={mutateNfts}
          mutatePoaps={mutatePoaps}
          title='NFTs & POAPs'
        />
      ) : null}

      {hiddenCollectives.length ? (
        <ProfileItemsList
          collectives={hiddenCollectives.sort((collectiveA, collectiveB) => new Date(collectiveB.date) > new Date(collectiveA.date) ? 1 : -1)}
          isPublic={isPublic}
          mutateNfts={mutateNfts}
          mutatePoaps={mutatePoaps}
          title='NFTs & POAPs (hidden)'
        />
      ) : null}
    </Stack>
  );
}
