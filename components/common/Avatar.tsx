import styled from '@emotion/styled';
import Avatar from '@mui/material/Avatar';
import { stringToColor } from 'lib/utilities/strings';

const StyledAvatar = styled(Avatar)`
  color: white;
  font-weight: 500;
`;

export default function InitialAvatar ({ className, name, variant }: { className?: string, name?: string | null, variant?: 'circular' | 'rounded' | 'square' }) {
  const nameStr = (name || '').replace('0x', ''); // ignore the universal prefix of addresses
  return (
    <StyledAvatar
      className={className}
      sx={{ backgroundColor: stringToColor(nameStr) }}
      variant={variant}
    >
      {nameStr.charAt(0).toUpperCase()}
    </StyledAvatar>
  );
}
