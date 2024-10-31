'use client';

import type { Scout } from '@charmverse/core/prisma';
import EditIcon from '@mui/icons-material/Edit';
import { Box, CircularProgress, IconButton, Stack, TextField, Typography } from '@mui/material';
import Image from 'next/image';
import { useState } from 'react';
import { Controller, useController, type Control } from 'react-hook-form';

import { useIsMounted } from 'hooks/useIsMounted';
import { useMdScreen } from 'hooks/useMediaScreens';
import { useS3UploadInput } from 'hooks/useS3UploadInput';

export type UserProfileData = Pick<Scout, 'id' | 'path'> & {
  avatar: string;
  displayName: string;
  githubLogin?: string;
  farcasterName?: string | null;
};

type UserProfileProps = {
  user: UserProfileData;
  control: Control<
    {
      avatar: string;
      displayName: string;
    } & any,
    any
  >;
};

export function EditableUserProfile({ user, control }: UserProfileProps) {
  const isDesktop = useMdScreen();
  const { displayName } = user;
  const isMounted = useIsMounted();
  const [isEditingName, setIsEditingName] = useState(false);

  const { field } = useController({
    name: 'avatar',
    control
  });

  const { inputRef, isUploading, onFileChange } = useS3UploadInput({
    onFileUpload: ({ url }) => {
      field.onChange(url);
    }
  });

  // We are using the mounted flag here because MUI media query returns false on the server and true on the client and it throws warnings
  if (!isMounted) {
    return null;
  }

  return (
    <Stack
      display='flex'
      gap={2}
      alignItems='center'
      flexDirection='row'
      my={1}
      p={{
        xs: 1,
        md: 2
      }}
    >
      <Controller
        name='avatar'
        control={control}
        render={() => (
          <Box
            sx={{
              position: 'relative',
              width: 75,
              minWidth: 75,
              height: 75,
              minHeight: 75,
              borderRadius: '50%',
              backgroundColor: 'inputBackground.main'
            }}
          >
            <input
              disabled={isUploading}
              type='file'
              accept={'image/*'}
              ref={inputRef}
              onChange={onFileChange}
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                opacity: 0,
                zIndex: 1,
                cursor: 'pointer',
                borderRadius: '50%'
              }}
            />
            <IconButton
              sx={{
                position: 'absolute',
                top: -5,
                right: -5,
                zIndex: 1,
                backgroundColor: 'white',
                p: 0.25
              }}
              onClick={() => {
                inputRef.current?.click();
              }}
              color='primary'
            >
              <EditIcon fontSize='small' />
            </IconButton>
            {isUploading ? (
              <CircularProgress color='secondary' size={25} sx={{ position: 'absolute', top: '35%', left: '35%' }} />
            ) : (
              <Image
                src={field.value as string}
                alt='avatar'
                width={75}
                height={75}
                sizes='100vw'
                style={{
                  objectFit: 'cover',
                  borderRadius: '50%'
                }}
              />
            )}
          </Box>
        )}
      />
      <Stack direction='row' alignItems='center' flexWrap='wrap' justifyContent='space-between' width='100%' gap={1}>
        <Stack maxWidth='85%'>
          {isEditingName ? (
            <Controller
              name='displayName'
              control={control}
              render={({ field: displayNameField, fieldState: { error } }) => (
                <TextField
                  required
                  {...displayNameField}
                  fullWidth
                  error={!!error?.message}
                  sx={{
                    '& .MuiInputBase-input': {
                      padding: 1,
                      fontSize: isDesktop
                        ? (theme) => theme.typography.h5.fontSize
                        : (theme) => theme.typography.h6.fontSize
                    }
                  }}
                />
              )}
            />
          ) : (
            <Typography variant={isDesktop ? 'h5' : 'h6'}>{displayName}</Typography>
          )}
        </Stack>
        <EditIcon fontSize='small' onClick={() => setIsEditingName(true)} />
      </Stack>
    </Stack>
  );
}
