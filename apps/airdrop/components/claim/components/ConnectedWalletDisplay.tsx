import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { Stack, styled, Typography } from '@mui/material';
import { shortenHex } from '@packages/utils/strings';
import { useAccount } from 'wagmi';

export const StyledAccountStack = styled(Stack)(({ theme }) => ({
  borderColor: theme.palette.text.disabled,
  borderWidth: '1px',
  borderStyle: 'solid',
  borderRadius: theme.spacing(2),
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1),
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  gap: theme.spacing(1),
  alignItems: 'center',
  flexDirection: 'row',
  width: 'fit-content'
}));

export function ConnectedWalletDisplay() {
  const { address = '' } = useAccount();
  return (
    <StyledAccountStack>
      <AccountBalanceWalletOutlinedIcon fontSize='small' color='disabled' />
      <Typography variant='subtitle2' color='textDisabled'>
        Connected: {shortenHex(address, 4)}
      </Typography>
    </StyledAccountStack>
  );
}
