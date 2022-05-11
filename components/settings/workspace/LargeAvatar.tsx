import styled from '@emotion/styled';
import { useRef, useState, ReactNode } from 'react';
import { AvatarWithIcons } from 'components/common/Avatar';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { uploadToS3 } from 'lib/aws/uploadToS3Browser';

const StyledBox = styled(Box)`
  display: inline-block;
`;

const StyledAvatar = styled(AvatarWithIcons)`
  font-size: 90px;
  width: 150px;
  height: 150px;
  ${({ variant }) => variant === 'rounded' && 'border-radius: 25px'};

  &:hover .edit-avatar-icon, .delete-avatar-icon {
      display: initial;
    }
`;

type LargeAvatarProps = {
  name: string;
  variant?: 'circular' | 'rounded' | 'square';
};

const getIcons = (editIcon: ReactNode, deleteIcon: ReactNode, avatar?: string) => {
  if (!avatar) {
    return [editIcon];
  }

  return [editIcon, deleteIcon];
};

export default function LargeAvatar (props: LargeAvatarProps) {
  const { name = '' } = props;
  const [isHovered, setIsHovered] = useState(false);
  const [avatar, setAvatar] = useState();
  const inputFile = useRef(null);

  return (
    <StyledBox
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <input
        type='file'
        hidden
        accept='image/*'
        ref={inputFile}
        onChange={async (e) => {
          const firstFile = e.target.files?.[0];

          if (firstFile) {
            const { url } = await uploadToS3(firstFile); setAvatar(url);
          }
        }}
      />
      <StyledAvatar
        avatar={avatar}
        isHovered={isHovered}
        icons={
          getIcons(
            <EditIcon
              onClick={() => inputFile.current.click()}
              fontSize='small'
              key='edit-avatar'
            />,
            <DeleteIcon fontSize='small' key='delete-avatar' />,
            avatar
          )
        }
        {...props}
      >
        {name.charAt(0).toUpperCase()}
      </StyledAvatar>
    </StyledBox>
  );
}
