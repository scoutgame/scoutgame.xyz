import type { IdentityType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import CheckIcon from '@mui/icons-material/Check';
import MoreHoriz from '@mui/icons-material/MoreHoriz';
import { Divider, IconButton, Menu, Stack, Tooltip, Typography } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';

import { Button } from 'components/common/Button';

const IntegrationName = styled(Typography)`
  background-color: ${({ theme }) => theme.palette.background.dark};
  display: inline-block;
  border-radius: 7px;
  padding: 3px 7px;
`;

type IntegrationProps = {
  isInUse: boolean;
  icon: ReactNode;
  action?: ReactNode;
  menuActions?: ReactNode[];
  identityType: IdentityType;
  name: string;
  username: string;
  // Used for showing email for Google accounts, and wallet address for shortened wallet names or ens names
  secondaryUserName?: string;
  selectIntegration: (id: string, type: IdentityType) => void;
};

function Integration(props: IntegrationProps) {
  const {
    isInUse,
    icon,
    action,
    menuActions = [],
    username,
    name,
    identityType,
    selectIntegration,
    secondaryUserName
  } = props;
  const identityMenuState = usePopupState({ variant: 'popover', popupId: `identity-menu-${identityType}` });
  return (
    <Stack>
      <Stack flexDirection='row' justifyContent='space-between' width='100%' alignItems='center'>
        <Stack>
          <Stack display='flex' flexDirection='row' gap={1} alignItems='center' mb={0.5}>
            {icon}
            <Tooltip title={secondaryUserName ?? ''}>
              <Typography component='span' fontSize='1.25em' fontWeight={700}>
                {username}
                {action}
              </Typography>
            </Tooltip>
          </Stack>
          <IntegrationName width='fit-content' variant='caption'>
            {name}
          </IntegrationName>
        </Stack>

        <Stack flexDirection='row' gap={1} alignItems='center'>
          {isInUse ? (
            <Stack flexDirection='row'>
              <CheckIcon fontSize='small' />
              <Typography ml={1} variant='body2'>
                Selected
              </Typography>
            </Stack>
          ) : (
            <Button
              size='small'
              color='secondary'
              variant='outlined'
              onClick={() => selectIntegration(username, identityType)}
            >
              Select
            </Button>
          )}
          <IconButton
            aria-label={`Open ${identityType.toLowerCase()} identity options`}
            {...bindTrigger(identityMenuState)}
            disabled={menuActions.length === 0}
          >
            <MoreHoriz fontSize='small' />
          </IconButton>

          <Menu
            {...bindMenu(identityMenuState)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
            onClick={identityMenuState.close}
          >
            {menuActions}
          </Menu>
        </Stack>
      </Stack>
      <Divider
        sx={{
          my: 2
        }}
      />
    </Stack>
  );
}

export default Integration;
