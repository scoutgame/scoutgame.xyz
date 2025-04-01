import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useS3UploadInput } from '@packages/scoutgame-ui/hooks/useS3UploadInput';
import Image from 'next/image';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';
import * as yup from 'yup';

const avatarSchema = yup.object({
  avatar: yup.string().notRequired()
});

type ProjectAvatarFieldProps = {
  control: Control<yup.InferType<typeof avatarSchema>>;
  avatarSize?: number;
  disabled?: boolean;
  onAvatarChange?: (url: string) => void;
};

export function ProjectAvatarField({ control, avatarSize = 150, disabled, onAvatarChange }: ProjectAvatarFieldProps) {
  const {
    field: avatarField,
    fieldState: { error }
  } = useController({
    name: 'avatar',
    control
  });

  const { inputRef, isUploading, onFileChange } = useS3UploadInput({
    onFileUpload: ({ url }) => {
      avatarField.onChange(url);
      onAvatarChange?.(url);
    }
  });

  return (
    <Box
      sx={{
        position: 'relative',
        width: avatarSize,
        minWidth: avatarSize,
        height: avatarSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: avatarSize,
        backgroundColor: 'inputBackground.main',
        border: error ? '1px solid red' : ''
      }}
    >
      <input
        disabled={isUploading || disabled}
        type='file'
        accept='image/*'
        ref={inputRef}
        onChange={onFileChange}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          opacity: 0,
          zIndex: 1,
          cursor: 'pointer'
        }}
      />
      {isUploading ? (
        <CircularProgress color='secondary' size={25} />
      ) : avatarField.value ? (
        <Image
          src={avatarField.value}
          alt='avatar'
          width={avatarSize}
          height={avatarSize}
          sizes='100vw'
          style={{
            objectFit: 'cover'
          }}
          onClick={() => {
            if (disabled) return;
            inputRef.current?.click();
          }}
        />
      ) : (
        <Stack flexDirection='row' alignItems='center' justifyContent='center' gap={0.5}>
          <AddCircleOutlineIcon fontSize='small' color={error ? 'error' : 'inherit'} />
          <Typography variant='body2' color={error ? 'error' : 'textPrimary'}>
            Image
          </Typography>
        </Stack>
      )}
    </Box>
  );
}
