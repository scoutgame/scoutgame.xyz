import styled from '@emotion/styled';
import Avatar from '@mui/material/Avatar';
import { Box } from '@mui/system';
import { stringToColor } from 'lib/utilities/strings';
import React from 'react';

const SizeStyleMap: Record<'xSmall' | 'small' | 'medium' | 'large', React.CSSProperties> = {
  large: {
    height: 54,
    width: 54,
    fontSize: '1.5rem'
  },
  medium: {
    height: 40,
    width: 40,
    fontSize: '1.25rem'
  },
  small: {
    height: 24,
    width: 24,
    fontSize: '1rem !important'
  },
  xSmall: {
    height: 20,
    width: 20,
    fontSize: '.9rem !important'
  }
};

const StyledAvatar = styled(Avatar)`
  color: white !important; // override CSS from Chip avatar
  font-weight: 500;
`;

const HexagonWrapper = styled(Box)`
  clip-path: url(#hexagon-avatar);
  overflow: hidden;
`;

export type InitialAvatarProps = {
  avatar: string | null | undefined;
  className?: string;
  name?: string;
  variant?: 'circular' | 'rounded' | 'square' | 'hexagon';
  size?: 'xSmall' | 'small' | 'medium' | 'large';
};

export default function InitialAvatar ({ avatar, className, name, variant, size = 'medium' }: InitialAvatarProps) {
  const nameStr = (name || '').replace('0x', ''); // ignore the universal prefix of addresses
  const isHexagonal = variant === 'hexagon';
  const muiVariant = isHexagonal ? 'square' : variant;
  const Wrapper = isHexagonal ? HexagonWrapper : Box;

  return (
    <Wrapper>
      <StyledAvatar
        className={className}
        sx={{ backgroundColor: avatar ? 'initial' : stringToColor(nameStr), ...SizeStyleMap[size] }}
        variant={muiVariant}
        src={avatar ?? undefined}
      >
        {nameStr.charAt(0).toUpperCase()}
      </StyledAvatar>
    </Wrapper>
  );
}
