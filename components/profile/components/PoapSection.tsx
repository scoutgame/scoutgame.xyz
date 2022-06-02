import { useContext } from 'react';
import useSWR from 'swr';
import charmClient from 'charmClient';
import { Box, Grid, Link, SvgIcon, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import styled from '@emotion/styled';
import { usePopupState } from 'material-ui-popup-state/hooks';
import PoapIcon from 'public/images/poap_logo.svg';
import { LoggedInUser } from 'models';
import type { PublicUser } from 'pages/api/public/profile/[userPath]';
import Button from 'components/common/Button';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import ManagePOAPModal from './ManagePOAPModal';

const StyledBox = styled(Box)`
    background-color: #E9EDF5;
    border-radius: 5px;
`;

const StyledButton = styled(Button)`
  cursor: pointer;
`;

const StyledImage = styled.img`
  width: 100%;
  border-radius: 50%;
`;

type PoapSectionProps = {
  user: PublicUser | LoggedInUser;
};

const isPublicUser = (user: PublicUser | LoggedInUser): user is PublicUser => user.hasOwnProperty('profile');

function PoapSection (props: PoapSectionProps) {
  const { user } = props;
  const managePoapModalState = usePopupState({ variant: 'popover', popupId: 'poap-modal' });
  const { openWalletSelectorModal } = useContext(Web3Connection);
  const isPublic = isPublicUser(user);
  const { data: poapData, mutate: mutatePoaps } = useSWR(`/poaps/${user.id}`, () => {
    return isPublicUser(user) ? Promise.resolve({ visiblePoaps: [], hiddenPoaps: [] }) : charmClient.getUserPoaps();
  });

  const hasConnectedWallet: boolean = !isPublic && user.addresses.length !== 0;

  let poaps = poapData?.visiblePoaps || [];

  if (isPublic) {
    poaps = user.visiblePoaps;
  }

  return (
    <StyledBox p={2}>
      <Grid container>
        <Grid item xs={8} pl={1}>
          {
            !isPublic && (hasConnectedWallet ? <Typography fontWeight={700} fontSize={20}>My POAPs</Typography>
              : <Typography fontWeight={700}>Connect and showcase your POAP collection</Typography>)
          }
          {
            isPublic && <Typography fontWeight={700} fontSize={20}>POAPs</Typography>
          }
        </Grid>
        <Grid item container xs={4} justifyContent='space-around'>
          <SvgIcon
            viewBox='0 0 39 51'
            sx={{ width: '50px', height: '70px', marginTop: '-40%' }}
          >
            <PoapIcon />
          </SvgIcon>
        </Grid>
        <Grid item xs={12}>
          {
            !isPublic && (
            <Box
              sx={{ alignItems: 'center', cursor: 'pointer', display: 'inline-flex' }}
              onClick={managePoapModalState.open}
            >
              <StyledButton variant='text' endIcon={<EditIcon />}>
                Manage
              </StyledButton>
            </Box>
            )
        }
        </Grid>
        {
            poaps.length !== 0 && (
            <Grid item container xs={12} py={2}>
              {
                poaps.map(poap => (
                  <Grid item xs={4} p={1} key={poap.tokenId}>
                    <Link href={`https://app.poap.xyz/token/${poap.tokenId}`} target='_blank' display='flex'>
                      <StyledImage src={poap.imageURL} />
                    </Link>
                  </Grid>
                ))
              }
            </Grid>
            )
        }
        {
          !poaps.length && (
          <Grid item container xs={12} justifyContent='center' py={2}>
            {
              isPublic && <Typography>There are no POAPs</Typography>
            }
            {
              !isPublic && !hasConnectedWallet && <Button onClick={openWalletSelectorModal}>Connect Wallet</Button>
            }
            {
              !isPublic && hasConnectedWallet && <Typography>You have no POAPs</Typography>
            }
          </Grid>
          )
        }
      </Grid>
      {
        !isPublic && poapData && (
        <ManagePOAPModal
          isOpen={managePoapModalState.isOpen}
          close={managePoapModalState.close}
          save={async () => {
            mutatePoaps();
            managePoapModalState.close();
          }}
          visiblePoaps={poapData.visiblePoaps}
          hiddenPoaps={poapData.hiddenPoaps}
        />
        )
      }
    </StyledBox>
  );
}

export default PoapSection;
