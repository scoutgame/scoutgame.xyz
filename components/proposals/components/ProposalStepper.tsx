import { useTheme } from '@emotion/react';
import CheckIcon from '@mui/icons-material/Check';
import { Divider, Stack, Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { ProposalStatus } from '@prisma/client';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import type { ProposalUserGroup } from 'lib/proposal/proposalStatusTransition';
import { proposalStatusTransitionPermission, proposalStatusTransitionRecord, PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';

const proposalStatuses = Object.keys(proposalStatusTransitionRecord) as ProposalStatus[];

export default function ProposalStepper ({ proposal, proposalUserGroups }: {proposalUserGroups: ProposalUserGroup[], proposal: ProposalWithUsers}) {
  const { status: currentStatus } = proposal;
  const theme = useTheme();

  const currentStatusIndex = proposalStatuses.indexOf(currentStatus);

  return (
    <Box display='flex' gap={1}>
      {proposalStatuses.map((status, statusIndex) => {
        const canChangeStatus = proposalUserGroups.some(
          proposalUserGroup => proposalStatusTransitionPermission[currentStatus]?.[proposalUserGroup]?.includes(status)
        );
        return (
          <Box display='flex' position='relative' gap={1} alignItems='center'>
            <Stack
              alignItems='center'
              gap={1}
              sx={{
                flexGrow: 1
              }}
            >
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: status === currentStatus
                    ? theme.palette.purple.main : canChangeStatus
                      ? theme.palette.teal.main : theme.palette.gray.main
                }}
              >
                {currentStatusIndex >= statusIndex ? <CheckIcon />
                  : (
                    <Typography sx={{
                      fontWeight: 500
                    }}
                    >
                      {statusIndex}
                    </Typography>
                  )}
              </Box>
              <Typography sx={{
                fontWeight: currentStatusIndex === statusIndex ? 'bold' : 'initial'
              }}
              >
                {PROPOSAL_STATUS_LABELS[status as ProposalStatus]}
              </Typography>
            </Stack>
            <Divider sx={{
              position: 'absolute'
            }}
            />
          </Box>
        );
      })}
    </Box>
  );
}
