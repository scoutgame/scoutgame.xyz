import type { ApplicationStatus, BountyStatus as RewardStatus } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ModeStandbyIcon from '@mui/icons-material/ModeStandby';
import PaidIcon from '@mui/icons-material/Paid';
import type { ChipProps } from '@mui/material/Chip';
import Chip from '@mui/material/Chip';
import type { ReactNode } from 'react';

import type { BrandColor } from 'theme/colors';

const REWARD_STATUS_LABELS: Record<RewardStatus, string> = {
  suggestion: 'Suggestion',
  open: 'Open',
  inProgress: 'In Progress',
  complete: 'Approved',
  paid: 'Paid'
};

const REWARD_STATUS_COLORS: Record<RewardStatus, BrandColor> = {
  suggestion: 'purple',
  open: 'teal',
  inProgress: 'yellow',
  complete: 'blue',
  paid: 'green'
};

const isRewardStatus = (status: RewardStatus): status is RewardStatus => status in REWARD_STATUS_COLORS;

const StyledStatusChip = styled(Chip)`
  .MuiChip-icon {
    display: flex;
    opacity: 0.5;
  }
  .MuiChip-iconSmall svg {
    font-size: 1.2rem;
  }
  .MuiChip-label {
    font-weight: 600;
  }
  .MuiChip-labelMedium {
    font-size: 0.98rem;
  }
`;

const StyledRewardStatusChip = styled(StyledStatusChip)<{ status?: RewardStatus }>`
  background-color: ${({ status, theme }) => {
    if (status && isRewardStatus(status)) {
      return theme.palette[REWARD_STATUS_COLORS[status]].main;
    } else {
      return 'initial';
    }
  }};
  .MuiChip-icon {
    display: flex;
    opacity: 0.5;
  }
  .MuiChip-iconSmall svg {
    font-size: 1.2rem;
  }
  .MuiChip-label {
    font-weight: 600;
  }
  .MuiChip-labelMedium {
    font-size: 0.98rem;
  }
`;

export const REWARD_STATUS_ICONS: Record<RewardStatus, ReactNode> = {
  suggestion: <LightbulbIcon />,
  open: <ModeStandbyIcon />,
  inProgress: <AssignmentIndIcon />,
  complete: <CheckCircleOutlineIcon />,
  paid: <PaidIcon />
};

export function RewardStatusChip({
  status,
  size = 'small',
  showIcon = true,
  showEmptyStatus = false
}: {
  size?: ChipProps['size'];
  status?: RewardStatus;
  showIcon?: boolean;
  showEmptyStatus?: boolean;
}) {
  if (!status && !showEmptyStatus) {
    return null;
  }
  return (
    <StyledRewardStatusChip
      size={size}
      status={status}
      label={REWARD_STATUS_LABELS[status || 'open']}
      variant={status ? 'filled' : 'outlined'}
      icon={showIcon ? <span>{REWARD_STATUS_ICONS[status || 'open']}</span> : undefined}
    />
  );
}
