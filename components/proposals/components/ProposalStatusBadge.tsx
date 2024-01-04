import styled from '@emotion/styled';
import type { ChipProps } from '@mui/material';
import { Chip } from '@mui/material';

import type { ProposalEvaluationStatus } from 'lib/proposal/interface';
import { PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';
import type { BrandColor } from 'theme/colors';

export const ProposalStatusColors: Record<ProposalEvaluationStatus, BrandColor> = {
  complete: 'green',
  declined: 'red',
  in_progress: 'yellow',
  passed: 'green',
  unpublished: 'gray',
  published: 'green'
};

const StyledProposalStatusChipNormalText = styled(Chip)<{ status: ProposalEvaluationStatus }>`
  background-color: ${({ status, theme }) => {
    // @ts-ignore
    return theme.palette[ProposalStatusColors[status]]?.main;
  }};
  .MuiChip-icon {
    display: flex;
    opacity: 0.5;
  }
  .MuiChip-iconSmall svg {
    font-size: 1rem;
  }
  .MuiChip-label {
    font-weight: normal;
  }
  .MuiChip-labelMedium {
    font-size: 0.98rem;
  }
`;

export function ProposalStatusChipTextOnly({
  status,
  size = 'small'
}: {
  size?: ChipProps['size'];
  status: ProposalEvaluationStatus;
}) {
  return (
    <StyledProposalStatusChipNormalText
      data-test='proposal-status-badge'
      size={size}
      status={status}
      label={PROPOSAL_STATUS_LABELS[status]}
      variant='filled'
    />
  );
}
