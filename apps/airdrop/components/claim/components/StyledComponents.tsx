import { Card, Stack, styled } from '@mui/material';

export const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'selected'
})<{ selected?: boolean }>(({ theme, selected }) => ({
  width: 'fit-content',
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
