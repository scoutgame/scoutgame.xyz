import { Button, Stack, Typography } from '@mui/material';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';

import { StyledCard } from './StyledComponents';

type DonationOptionProps = {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  leftIcon?: string;
  rightIcon?: string;
};

function DonationOption({ selected, onClick, title, description, leftIcon, rightIcon }: DonationOptionProps) {
  const isDesktop = useMdScreen();

  return (
    <StyledCard selected={selected} onClick={onClick}>
      <Stack flexDirection='row' gap={1} alignItems='center'>
        {leftIcon && <img src={leftIcon} alt='Left Icon' width={isDesktop ? 45 : 35} height={isDesktop ? 45 : 35} />}
        <Typography variant={isDesktop ? 'h5' : 'h6'} fontWeight={600}>
          {title}
        </Typography>
        {rightIcon && <img src={rightIcon} alt='Right Icon' width={isDesktop ? 45 : 35} height={isDesktop ? 45 : 35} />}
      </Stack>
      <Typography>{description}</Typography>
    </StyledCard>
  );
}

export type DonationPercentage = 'donate_full' | 'donate_half' | 'donate_none';

type DonationSelectionProps = {
  devTokenAmount: number;
  donationPercentage: DonationPercentage;
  onDonationChange: (percentage: DonationPercentage) => void;
  onSelect: () => void;
};

export function DonationSelectionStep({
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
          selected={donationPercentage === 'donate_full'}
          onClick={() => onDonationChange('donate_full')}
          title='Donate 100% to Open Source'
          description='This will donate all of your DEV tokens to the Scout Game Open Source Grants program. This makes you an Open Source Legend.'
          leftIcon='/images/quest-icon.svg'
        />
        <DonationOption
          selected={donationPercentage === 'donate_half'}
          onClick={() => onDonationChange('donate_half')}
          title='Donate 50% & Keep 50%'
          description='Donate half of your DEV tokens to the Grants program and keep half of it to play the game.'
          leftIcon='/images/quest-icon.svg'
          rightIcon='/images/scout-icon.svg'
        />
        <DonationOption
          selected={donationPercentage === 'donate_none'}
          onClick={() => onDonationChange('donate_none')}
          title='Keep 100% to play'
          description='Use your DEV tokens to Draft hardworking developers and rake in the rewards!'
          leftIcon='/images/scout-icon.svg'
        />
      </Stack>
      <Button variant='contained' sx={{ width: 250, py: 1, borderRadius: 2 }} onClick={onSelect}>
        Select
      </Button>
    </Stack>
  );
}
