import { Button, Stack, Typography } from '@mui/material';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';

type DonationConfirmationProps = {
  donationPercentage: 'donate_full' | 'donate_half' | 'donate_none';
  claimableAmount: number;
  onCancel: () => void;
  onClaim: () => void;
  isLoading: boolean;
};

export function DonationConfirmationStep({
  donationPercentage,
  claimableAmount,
  onCancel,
  onClaim,
  isLoading
}: DonationConfirmationProps) {
  const isDesktop = useMdScreen();

  const donationAmount =
    donationPercentage === 'donate_full'
      ? claimableAmount
      : donationPercentage === 'donate_half'
        ? claimableAmount / 2
        : 0;
  const playAmount = claimableAmount - donationAmount;

  return (
    <Stack
      flexDirection={{
        xs: 'column-reverse',
        md: 'row'
      }}
      justifyContent='space-between'
      alignItems='center'
      px={{
        xs: 2,
        md: 8
      }}
      mb={{
        xs: 2,
        md: 4
      }}
    >
      <Stack flex={1} gap={4} justifyContent='center' alignItems='center'>
        <Typography variant='h4' color='secondary'>
          Your Selection
        </Typography>
        <Stack
          gap={{
            xs: 4,
            md: 10
          }}
          flexDirection='row'
          alignItems='center'
        >
          {donationAmount ? (
            <Stack
              gap={{
                xs: 1,
                md: 1.5
              }}
              flex={1}
              alignItems='center'
            >
              <img
                src='/images/quest-icon-primary.svg'
                alt='Quest Icon'
                width={isDesktop ? 75 : 50}
                height={isDesktop ? 75 : 50}
              />
              <Typography variant='h6' textAlign='center'>
                Donate {donationPercentage === 'donate_full' ? '100%' : '50%'} <br />
                to Open Source
              </Typography>
              <Stack flexDirection='row' gap={1} alignItems='center'>
                <Typography variant={isDesktop ? 'h4' : 'h5'} fontWeight={600}>
                  {donationAmount}
                </Typography>
                <img
                  src='/images/dev-token-logo.png'
                  alt='DEV Icon'
                  width={isDesktop ? 35 : 25}
                  height={isDesktop ? 35 : 25}
                />
              </Stack>
              {donationPercentage !== 'donate_full' ? (
                <Button
                  variant='outlined'
                  sx={{ width: isDesktop ? 150 : 100, mt: { xs: 1, md: 2 }, py: 1, borderRadius: 2 }}
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              ) : null}
            </Stack>
          ) : null}

          {playAmount ? (
            <Stack
              gap={{
                xs: 1,
                md: 1.5
              }}
              alignItems='center'
            >
              <img
                src='/images/scout-icon-primary.svg'
                alt='Scout Icon'
                width={isDesktop ? 75 : 50}
                height={isDesktop ? 75 : 50}
              />
              <Typography variant='h6' textAlign='center'>
                Claim {donationPercentage === 'donate_none' ? '100%' : '50%'} <br />
                to Play
              </Typography>
              <Stack flexDirection='row' gap={1} alignItems='center'>
                <Typography variant={isDesktop ? 'h4' : 'h5'} fontWeight={600}>
                  {playAmount}
                </Typography>
                <img
                  src='/images/dev-token-logo.png'
                  alt='DEV Icon'
                  width={isDesktop ? 35 : 25}
                  height={isDesktop ? 35 : 25}
                />
              </Stack>
              {donationPercentage !== 'donate_none' ? (
                <Button
                  variant='contained'
                  sx={{ width: isDesktop ? 150 : 100, mt: { xs: 1, md: 2 }, py: 1, borderRadius: 2 }}
                  onClick={onClaim}
                  loading={isLoading}
                >
                  Claim
                </Button>
              ) : null}
            </Stack>
          ) : null}
        </Stack>

        {donationPercentage !== 'donate_half' ? (
          <Stack flexDirection='row' gap={4} alignItems='center'>
            <Button variant='outlined' sx={{ width: isDesktop ? 150 : 100, py: 1, borderRadius: 2 }} onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant='contained'
              sx={{ width: isDesktop ? 150 : 100, py: 1, borderRadius: 2 }}
              onClick={onClaim}
              loading={isLoading}
            >
              Claim
            </Button>
          </Stack>
        ) : null}
      </Stack>
      {isDesktop ? (
        <img
          src={donationPercentage === 'donate_full' ? '/images/legendary.png' : '/images/scout-switch.png'}
          alt='Scout Switch'
          width={isDesktop ? 350 : 300}
          height={isDesktop ? 350 : 300}
        />
      ) : null}
    </Stack>
  );
}
