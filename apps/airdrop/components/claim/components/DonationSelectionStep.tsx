import { Button, Card, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useMdScreen } from '@packages/scoutgame-ui/hooks/useMediaScreens';
import type { ReactNode } from 'react';

type DonationOptionProps = {
  selected: boolean;
  onClick: () => void;
  title: ReactNode;
  description: string | ReactNode;
  leftIcon?: string;
  rightIcon?: string;
};

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'selected'
})<{ selected?: boolean }>(({ theme, selected }) => ({
  width: theme.breakpoints.down('md') ? '100%' : 'fit-content',
  padding: theme.breakpoints.down('md') ? theme.spacing(1.5) : theme.spacing(2),
  borderRadius: theme.breakpoints.down('md') ? theme.spacing(1) : theme.spacing(2),
  borderWidth: theme.breakpoints.down('md') ? theme.spacing(0.125) : theme.spacing(0.25),
  borderColor: theme.palette.primary.main,
  flex: 1,
  flexDirection: 'column',
  gap: theme.breakpoints.down('md') ? theme.spacing(0.5) : theme.spacing(1),
  display: 'flex',
  cursor: 'pointer',
  backgroundColor: selected ? theme.palette.primary.main : theme.palette.background.paper,
  height: 175,
  justifyContent: 'center',
  alignItems: 'center',
  transition: theme.transitions.create(['background-color', 'border-color'], {
    duration: 150,
    easing: 'ease-in-out'
  }),
  '&:hover': selected
    ? undefined
    : {
        transition: theme.transitions.create(['background-color', 'border-color'], {
          duration: 150,
          easing: 'ease-in-out'
        }),
        backgroundColor: theme.palette.background.light
      }
}));

function DonationOption({ selected, onClick, title, description, leftIcon, rightIcon }: DonationOptionProps) {
  const isDesktop = useMdScreen();
  const iconSize = isDesktop ? 60 : 35;

  return (
    <StyledCard selected={selected} onClick={onClick}>
      <Stack flexDirection='row' gap={2} alignItems='center' mb={1}>
        {leftIcon && <img src={leftIcon} alt='Left Icon' width={iconSize} height={iconSize} />}
        <Typography variant={isDesktop ? 'h5' : 'h6'} fontWeight={600} lineHeight={1.2}>
          {title}
        </Typography>
        {rightIcon && <img src={rightIcon} alt='Right Icon' width={iconSize} height={iconSize} />}
      </Stack>
      <Typography fontSize={18} lineHeight={1.2}>
        {description}
      </Typography>
    </StyledCard>
  );
}

export type DonationPercentage = 'donate_full' | 'donate_half' | 'donate_none';

type DonationSelectionProps = {
  claimableAmount: number;
  donationPercentage: DonationPercentage;
  onDonationChange: (percentage: DonationPercentage) => void;
  onSelect: () => void;
};

export function DonationSelectionStep({
  claimableAmount,
  donationPercentage,
  onDonationChange,
  onSelect
}: DonationSelectionProps) {
  return (
    <Stack
      gap={{
        xs: 2,
        md: 3
      }}
      alignItems='center'
    >
      <Typography variant='h4' color='secondary'>
        How would you like your {claimableAmount} DEV tokens?
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
          title={
            <>
              Donate 100%
              <br />
              to Open Source
            </>
          }
          description='Donate all of your DEV tokens to the Scout Game Grants program. This makes you an Open Source Legend.'
          leftIcon='/images/quest-icon.svg'
        />
        <DonationOption
          selected={donationPercentage === 'donate_half'}
          onClick={() => onDonationChange('donate_half')}
          title={
            <>
              Donate 50%
              <br />& Keep 50%
            </>
          }
          description='Donate half of your DEV tokens to the Grants program and keep half of it to play the game.'
          leftIcon='/images/quest-icon.svg'
          rightIcon='/images/scout-icon.svg'
        />
        <DonationOption
          selected={donationPercentage === 'donate_none'}
          onClick={() => onDonationChange('donate_none')}
          title={
            <>
              Keep 100%
              <br />
              to play
            </>
          }
          description={
            <>
              Use your DEV tokens to Draft
              <br /> hardworking developers and rake in the rewards!
            </>
          }
          leftIcon='/images/scout-icon.svg'
        />
      </Stack>
      <Button variant='contained' sx={{ width: 250, py: 1, borderRadius: 2, mb: 2 }} onClick={onSelect}>
        Select
      </Button>
    </Stack>
  );
}
