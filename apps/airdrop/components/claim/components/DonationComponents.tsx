import { Button, Stack, Typography } from '@mui/material';

import { StyledCard } from './StyledComponents';

interface DonationOptionProps {
  isDesktop: boolean;
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  leftIcon?: string;
  rightIcon?: string;
}

export function DonationOption({
  isDesktop,
  selected,
  onClick,
  title,
  description,
  leftIcon,
  rightIcon
}: DonationOptionProps) {
  return (
    <StyledCard selected={selected} onClick={onClick}>
      <Stack flexDirection='row' gap={1} alignItems='center'>
        {leftIcon && <img src={leftIcon} alt='Left Icon' width={isDesktop ? 45 : 35} height={isDesktop ? 45 : 35} />}
        <Typography variant={isDesktop ? 'h5' : 'h6'} fontWeight={600}>
          {title}
        </Typography>
        {rightIcon && <img src={rightIcon} alt='Right Icon' width={isDesktop ? 75 : 35} height={isDesktop ? 75 : 35} />}
      </Stack>
      <Typography>{description}</Typography>
    </StyledCard>
  );
}

interface DonationSelectionProps {
  isDesktop: boolean;
  devTokenAmount: number;
  donationPercentage: 'donate_full' | 'donate_half' | 'donate_none';
  onDonationChange: (percentage: 'donate_full' | 'donate_half' | 'donate_none') => void;
  onSelect: () => void;
}

export function DonationSelection({
  isDesktop,
  devTokenAmount,
  donationPercentage,
  onDonationChange,
  onSelect
}: DonationSelectionProps) {
  return (
    <Stack gap={3} alignItems='center'>
      <Typography variant='h4' color='secondary'>
        How would you like your {devTokenAmount} DEV tokens?
      </Typography>
      <Stack
        flexDirection={{
          xs: 'column',
          md: 'row'
        }}
        gap={1}
        alignItems='center'
      >
        <DonationOption
          isDesktop={isDesktop}
          selected={donationPercentage === 'donate_full'}
          onClick={() => onDonationChange('donate_full')}
          title='Donate 100% to Open Source'
          description='This will donate all of your DEV tokens to the Scout Game Open Source Grants program. This makes you an Open Source Legend.'
          leftIcon='/images/quest-icon.svg'
        />
        <DonationOption
          isDesktop={isDesktop}
          selected={donationPercentage === 'donate_half'}
          onClick={() => onDonationChange('donate_half')}
          title='Donate 50% & Keep 50%'
          description='Donate half of your DEV tokens to the Grants program and keep half of it to play the game.'
          leftIcon='/images/quest-icon.svg'
          rightIcon='/images/scout-icon.svg'
        />
        <DonationOption
          isDesktop={isDesktop}
          selected={donationPercentage === 'donate_none'}
          onClick={() => onDonationChange('donate_none')}
          title='Keep 100% to play'
          description='Use your DEV tokens to Draft hardworking developers and rake in the rewards!'
          leftIcon='/images/scout-icon.svg'
        />
      </Stack>
      <Button variant='contained' sx={{ width: 'fit-content', mb: 2 }} onClick={onSelect}>
        Select
      </Button>
    </Stack>
  );
}

interface DonationConfirmationProps {
  isDesktop: boolean;
  donationPercentage: 'donate_full' | 'donate_half' | 'donate_none';
  devTokenAmount: number;
  onCancel: () => void;
  onClaim: () => void;
}

export function DonationConfirmation({
  isDesktop,
  donationPercentage,
  devTokenAmount,
  onCancel,
  onClaim
}: DonationConfirmationProps) {
  const donationAmount =
    donationPercentage === 'donate_full'
      ? devTokenAmount
      : donationPercentage === 'donate_half'
        ? devTokenAmount / 2
        : 0;
  const playAmount = devTokenAmount - donationAmount;

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
        <Typography variant='h5' color='secondary'>
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
                  sx={{ width: isDesktop ? 150 : 100, mt: { xs: 1, md: 2 } }}
                  onClick={onCancel}
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
                  sx={{ width: isDesktop ? 150 : 100, mt: { xs: 1, md: 2 } }}
                  onClick={onClaim}
                >
                  Claim
                </Button>
              ) : null}
            </Stack>
          ) : null}
        </Stack>

        {donationPercentage !== 'donate_half' ? (
          <Stack flexDirection='row' gap={4} alignItems='center'>
            <Button variant='outlined' sx={{ width: isDesktop ? 150 : 100 }} onClick={onCancel}>
              Cancel
            </Button>
            <Button variant='contained' sx={{ width: isDesktop ? 150 : 100 }} onClick={onClaim}>
              Claim
            </Button>
          </Stack>
        ) : null}
      </Stack>
      <img
        src={donationPercentage === 'donate_full' ? '/images/legendary.png' : '/images/scout-switch.png'}
        alt='Scout Switch'
        width={isDesktop ? 350 : 300}
        height={isDesktop ? 350 : 300}
      />
    </Stack>
  );
}
