'use client';

import { log } from '@charmverse/core/log';
import {
  Stack,
  TextField,
  Typography,
  FormControl,
  FormHelperText,
  Box,
  Button,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import { uploadToS3 } from '@packages/aws/uploadToS3Browser';
import { useS3UploadInput } from '@packages/scoutgame-ui/hooks/useS3UploadInput';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { useCreateScoutPartner, useS3Upload } from 'hooks/api/scout-partners';

type FormData = {
  id: string;
  name: string;
  icon: string;
  bannerImage: string;
  infoPageImage: string;
  tokenAmountPerPullRequest?: number;
  tokenAddress?: string;
  tokenChain?: number;
  tokenSymbol?: string;
  tokenDecimals?: number;
  tokenImage?: string;
};

type Props = {
  onClose: () => void;
};

export function CreateScoutPartnerForm({ onClose }: Props) {
  const { trigger: createScoutPartner } = useCreateScoutPartner();
  const { getUploadToken } = useS3Upload();
  const [isTokenEnabled, setIsTokenEnabled] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      id: '',
      name: '',
      icon: '',
      bannerImage: '',
      infoPageImage: ''
    }
  });

  const iconUpload = useS3UploadInput({
    onFileUpload: ({ url }) => setValue('icon', url),
    onError: (error) => log.error('Error uploading file', { error })
  });

  const bannerUpload = useS3UploadInput({
    onFileUpload: ({ url }) => setValue('bannerImage', url),
    onError: (error) => log.error('Error uploading file', { error })
  });

  const infoPageUpload = useS3UploadInput({
    onFileUpload: ({ url }) => setValue('infoPageImage', url),
    onError: (error) => log.error('Error uploading file', { error })
  });

  const tokenImageUpload = useS3UploadInput({
    onFileUpload: ({ url }) => setValue('tokenImage', url),
    onError: (error) => log.error('Error uploading file', { error })
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = isTokenEnabled
        ? data
        : {
            ...data,
            tokenAmountPerPullRequest: undefined,
            tokenAddress: undefined,
            tokenChain: undefined,
            tokenSymbol: undefined,
            tokenDecimals: undefined,
            tokenImage: undefined
          };

      await createScoutPartner(payload);
      onClose();
    } catch (error) {
      log.error('Error creating scout partner', { error });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        <Typography variant='h6'>Create Scout Partner</Typography>

        <Controller
          name='id'
          control={control}
          rules={{ required: 'ID is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label='ID'
              error={!!errors.id}
              helperText={errors.id?.message || 'Unique identifier for the partner'}
            />
          )}
        />

        <Controller
          name='name'
          control={control}
          rules={{ required: 'Name is required' }}
          render={({ field }) => (
            <TextField {...field} label='Name' error={!!errors.name} helperText={errors.name?.message} />
          )}
        />

        <FormControl>
          <Typography variant='subtitle2' gutterBottom>
            Icon Image
          </Typography>
          <Box>
            <Button variant='outlined' component='label' {...iconUpload}>
              Upload Icon
            </Button>
          </Box>
          <Controller
            name='icon'
            control={control}
            rules={{ required: 'Icon is required' }}
            render={({ field: { value } }) => (
              <FormHelperText error={!!errors.icon}>
                {errors.icon?.message || (value && `Uploaded: ${value}`)}
              </FormHelperText>
            )}
          />
        </FormControl>

        <FormControl>
          <Typography variant='subtitle2' gutterBottom>
            Banner Image
          </Typography>
          <Box>
            <Button variant='outlined' component='label' {...bannerUpload}>
              Upload Banner
            </Button>
          </Box>
          <Controller
            name='bannerImage'
            control={control}
            rules={{ required: 'Banner image is required' }}
            render={({ field: { value } }) => (
              <FormHelperText error={!!errors.bannerImage}>
                {errors.bannerImage?.message || (value && `Uploaded: ${value}`)}
              </FormHelperText>
            )}
          />
        </FormControl>

        <FormControl>
          <Typography variant='subtitle2' gutterBottom>
            Info Page Image
          </Typography>
          <Box>
            <Button variant='outlined' component='label' {...infoPageUpload}>
              Upload Info Page Image
            </Button>
          </Box>
          <Controller
            name='infoPageImage'
            control={control}
            rules={{ required: 'Info page image is required' }}
            render={({ field: { value } }) => (
              <FormHelperText error={!!errors.infoPageImage}>
                {errors.infoPageImage?.message || (value && `Uploaded: ${value}`)}
              </FormHelperText>
            )}
          />
        </FormControl>

        <FormControlLabel
          control={<Switch checked={isTokenEnabled} onChange={(e) => setIsTokenEnabled(e.target.checked)} />}
          label='Enable Token Fields'
        />

        {isTokenEnabled && (
          <>
            <Controller
              name='tokenAmountPerPullRequest'
              control={control}
              rules={{ required: isTokenEnabled ? 'Token amount is required' : false }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type='number'
                  label='Token Amount per PR'
                  error={!!errors.tokenAmountPerPullRequest}
                  helperText={errors.tokenAmountPerPullRequest?.message}
                />
              )}
            />

            <Controller
              name='tokenAddress'
              control={control}
              rules={{ required: isTokenEnabled ? 'Token address is required' : false }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='Token Address'
                  error={!!errors.tokenAddress}
                  helperText={errors.tokenAddress?.message}
                />
              )}
            />

            <Controller
              name='tokenChain'
              control={control}
              rules={{ required: isTokenEnabled ? 'Token chain is required' : false }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type='number'
                  label='Token Chain'
                  error={!!errors.tokenChain}
                  helperText={errors.tokenChain?.message}
                />
              )}
            />

            <Controller
              name='tokenSymbol'
              control={control}
              rules={{ required: isTokenEnabled ? 'Token symbol is required' : false }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='Token Symbol'
                  error={!!errors.tokenSymbol}
                  helperText={errors.tokenSymbol?.message}
                />
              )}
            />

            <Controller
              name='tokenDecimals'
              control={control}
              rules={{ required: isTokenEnabled ? 'Token decimals is required' : false }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type='number'
                  label='Token Decimals'
                  error={!!errors.tokenDecimals}
                  helperText={errors.tokenDecimals?.message}
                />
              )}
            />

            <FormControl>
              <Typography variant='subtitle2' gutterBottom>
                Token Image
              </Typography>
              <Box>
                <Button variant='outlined' component='label' {...tokenImageUpload}>
                  Upload Token Image
                </Button>
              </Box>
              <Controller
                name='tokenImage'
                control={control}
                render={({ field: { value } }) => <FormHelperText>{value && `Uploaded: ${value}`}</FormHelperText>}
              />
            </FormControl>
          </>
        )}

        <Stack direction='row' spacing={2} justifyContent='flex-end'>
          <Button onClick={onClose}>Cancel</Button>
          <Button type='submit' variant='contained'>
            Create Partner
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
