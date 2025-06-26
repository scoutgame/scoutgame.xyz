'use client';

import { log } from '@charmverse/core/log';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
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
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import { useS3UploadInput } from '@packages/scoutgame-ui/hooks/useS3UploadInput';
import Image from 'next/image';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { useCreateScoutPartner } from 'hooks/api/scout-partners';

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

type ImageUploadFieldProps = {
  label: string;
  value?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  imageSize?: { width: number; height: number };
};

function ImageUploadField({
  label,
  value,
  inputRef,
  isUploading,
  onFileChange,
  error,
  imageSize = { width: 60, height: 60 }
}: ImageUploadFieldProps) {
  return (
    <FormControl error={!!error} sx={{ width: 'fit-content' }}>
      <Typography variant='subtitle2' gutterBottom>
        {label}
      </Typography>
      <Box sx={{ position: 'relative' }}>
        <input
          type='file'
          accept='image/*'
          ref={inputRef}
          onChange={onFileChange}
          style={{
            display: 'none'
          }}
          disabled={isUploading}
        />
        {value ? (
          <Box sx={{ position: 'relative', cursor: 'pointer' }} onClick={() => inputRef.current?.click()}>
            <Image
              src={value}
              alt={label}
              width={imageSize.width}
              height={imageSize.height}
              style={{ objectFit: 'cover', borderRadius: 4 }}
            />
          </Box>
        ) : (
          <Button
            variant='outlined'
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            startIcon={isUploading ? <CircularProgress size={16} /> : <AddCircleOutlineIcon />}
            sx={{
              minWidth: imageSize.width,
              height: imageSize.height,
              borderColor: error ? 'error.main' : undefined
            }}
          >
            Upload
          </Button>
        )}
      </Box>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </FormControl>
  );
}

export function CreateScoutPartnerForm({ onClose }: Props) {
  const { trigger: createScoutPartner } = useCreateScoutPartner();
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

  const { iconUpload, bannerUpload, infoPageUpload, tokenImageUpload } = {
    iconUpload: useS3UploadInput({
      onFileUpload: ({ url }) => setValue('icon', url),
      onError: (error) => log.error('Error uploading file', { error })
    }),
    bannerUpload: useS3UploadInput({
      onFileUpload: ({ url }) => setValue('bannerImage', url),
      onError: (error) => log.error('Error uploading file', { error })
    }),
    infoPageUpload: useS3UploadInput({
      onFileUpload: ({ url }) => setValue('infoPageImage', url),
      onError: (error) => log.error('Error uploading file', { error })
    }),
    tokenImageUpload: useS3UploadInput({
      onFileUpload: ({ url }) => setValue('tokenImage', url),
      onError: (error) => log.error('Error uploading file', { error })
    })
  };

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

        <Controller
          name='icon'
          control={control}
          rules={{ required: 'Icon is required' }}
          render={({ field: { value } }) => (
            <ImageUploadField
              label='Icon'
              value={value}
              inputRef={iconUpload.inputRef}
              isUploading={iconUpload.isUploading}
              onFileChange={iconUpload.onFileChange}
              error={errors.icon?.message}
              imageSize={{ width: 48, height: 48 }}
            />
          )}
        />

        <Controller
          name='bannerImage'
          control={control}
          rules={{ required: 'Banner image is required' }}
          render={({ field: { value } }) => (
            <ImageUploadField
              label='Banner Image'
              value={value}
              inputRef={bannerUpload.inputRef}
              isUploading={bannerUpload.isUploading}
              onFileChange={bannerUpload.onFileChange}
              error={errors.bannerImage?.message}
              imageSize={{ width: 300, height: 48 }}
            />
          )}
        />

        <Controller
          name='infoPageImage'
          control={control}
          rules={{ required: 'Info page image is required' }}
          render={({ field: { value } }) => (
            <ImageUploadField
              label='Info Page Image'
              value={value}
              inputRef={infoPageUpload.inputRef}
              isUploading={infoPageUpload.isUploading}
              onFileChange={infoPageUpload.onFileChange}
              error={errors.infoPageImage?.message}
              imageSize={{ width: 300, height: 48 }}
            />
          )}
        />

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

            <Controller
              name='tokenImage'
              control={control}
              render={({ field: { value } }) => (
                <ImageUploadField
                  label='Token Image'
                  value={value}
                  inputRef={tokenImageUpload.inputRef}
                  isUploading={tokenImageUpload.isUploading}
                  onFileChange={tokenImageUpload.onFileChange}
                  error={errors.tokenImage?.message}
                  imageSize={{ width: 48, height: 48 }}
                />
              )}
            />
          </>
        )}

        <Stack direction='row' spacing={2} justifyContent='flex-end'>
          <Button variant='outlined' onClick={onClose}>
            Cancel
          </Button>
          <Button type='submit' variant='contained' color='primary'>
            Create Partner
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
