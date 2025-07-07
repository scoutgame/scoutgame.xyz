'use client';

import { log } from '@charmverse/core/log';
import type { ScoutPartner, ScoutPartnerStatus } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import {
  Stack,
  TextField,
  Typography,
  FormControl,
  FormHelperText,
  Box,
  Button,
  Switch,
  FormControlLabel,
  CircularProgress,
  MenuItem,
  Select,
  InputLabel
} from '@mui/material';
import { uploadToS3 } from '@packages/aws/uploadToS3Browser';
import { useFilePicker } from '@packages/scoutgame-ui/hooks/useFilePicker';
import { DEFAULT_MAX_FILE_SIZE_MB, encodeFilename } from '@packages/utils/file';
import { replaceS3Domain } from '@packages/utils/url';
import Image from 'next/image';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { useCreateScoutPartner, useGetScoutPartnerUploadToken } from 'hooks/api/scout-partners';
import type { CreateScoutPartnerPayload } from 'lib/scout-partners/createScoutPartnerSchema';
import { createScoutPartnerSchema } from 'lib/scout-partners/createScoutPartnerSchema';

import { ChainSelector } from './ChainSelector';
import { IssueTagAmountFields } from './IssueTagAmountFields';

type Props = {
  onClose: () => void;
  onSuccess: (partner: ScoutPartner) => void;
};

type ImageUploadFieldProps = {
  label: string;
  value?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  imageSize?: { width: number; height: number };
  required?: boolean;
};

function ImageUploadField({
  label,
  value,
  inputRef,
  isUploading,
  onFileChange,
  error,
  imageSize = { width: 60, height: 60 },
  required
}: ImageUploadFieldProps) {
  return (
    <FormControl error={!!error} sx={{ width: 'fit-content' }}>
      <Typography variant='subtitle2' gutterBottom>
        {label}
        {required && (
          <Box component='span' sx={{ color: 'error.main', ml: 0.5 }}>
            *
          </Box>
        )}
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
          <Box
            sx={{
              position: 'relative',
              cursor: 'pointer',
              width: imageSize.width,
              height: imageSize.height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1
            }}
            onClick={() => inputRef.current?.click()}
          >
            <Image
              src={value}
              alt={label}
              width={imageSize.width}
              height={imageSize.height}
              style={{ objectFit: 'contain' }}
            />
          </Box>
        ) : (
          <Button
            variant='outlined'
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            startIcon={isUploading ? <CircularProgress size={16} /> : <AddCircleOutlineIcon />}
            sx={{
              width: imageSize.width === 48 ? undefined : '100%',
              height: 48,
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

const statusOptions: { value: ScoutPartnerStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' }
];

export function CreateScoutPartnerForm({ onClose, onSuccess }: Props) {
  const { trigger: createScoutPartner } = useCreateScoutPartner();
  const { trigger: getUploadToken } = useGetScoutPartnerUploadToken();
  const [isTokenEnabled, setIsTokenEnabled] = useState(false);

  // Upload states
  const [isIconUploading, setIsIconUploading] = useState(false);
  const [isBannerUploading, setIsBannerUploading] = useState(false);
  const [isInfoPageUploading, setIsInfoPageUploading] = useState(false);
  const [isTokenImageUploading, setIsTokenImageUploading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting, isDirty }
  } = useForm<CreateScoutPartnerPayload>({
    defaultValues: {
      name: '',
      icon: '',
      bannerImage: '',
      infoPageImage: '',
      status: 'active',
      tokenChain: 0,
      tokenAddress: '',
      tokenAmountPerPullRequest: 0,
      tokenDecimals: 0,
      tokenImage: '',
      tokenSymbol: '',
      issueTagTokenAmounts: []
    },
    resolver: yupResolver(createScoutPartnerSchema),
    mode: 'onChange',
    context: { isTokenEnabled }
  });

  async function handleRequestUploadToken(file: File) {
    return getUploadToken({ filename: encodeFilename(file.name) });
  }

  async function handleFileUpload(
    file: File,
    fieldName: keyof CreateScoutPartnerPayload,
    setUploading: (value: boolean) => void
  ) {
    if (file.size > DEFAULT_MAX_FILE_SIZE_MB * 1024 ** 2) {
      log.error(`File size must be less than ${DEFAULT_MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setUploading(true);

    try {
      const { url } = await uploadToS3(handleRequestUploadToken, file, {});
      setValue(fieldName, replaceS3Domain(url), {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
    } catch (error) {
      log.error('Error uploading file', { error });
    } finally {
      setUploading(false);
    }
  }

  const iconUploadProps = useFilePicker((file) => handleFileUpload(file, 'icon', setIsIconUploading));
  const bannerUploadProps = useFilePicker((file) => handleFileUpload(file, 'bannerImage', setIsBannerUploading));
  const infoPageUploadProps = useFilePicker((file) => handleFileUpload(file, 'infoPageImage', setIsInfoPageUploading));
  const tokenImageUploadProps = useFilePicker((file) => handleFileUpload(file, 'tokenImage', setIsTokenImageUploading));

  const { iconUpload, bannerUpload, infoPageUpload, tokenImageUpload } = {
    iconUpload: { ...iconUploadProps, isUploading: isIconUploading },
    bannerUpload: { ...bannerUploadProps, isUploading: isBannerUploading },
    infoPageUpload: { ...infoPageUploadProps, isUploading: isInfoPageUploading },
    tokenImageUpload: { ...tokenImageUploadProps, isUploading: isTokenImageUploading }
  };

  const onSubmit = async (data: CreateScoutPartnerPayload) => {
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

      const newPartner = await createScoutPartner(payload);
      onSuccess(newPartner);
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
          name='name'
          control={control}
          rules={{ required: 'Name is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label={
                <Box component='span'>
                  Name
                  <Box component='span' sx={{ color: 'error.main', ml: 0.5 }}>
                    *
                  </Box>
                </Box>
              }
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />

        <Controller
          name='status'
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel id='status-label'>Status</InputLabel>
              <Select {...field} labelId='status-label' label='Status' error={!!errors.status}>
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.status && <FormHelperText error>{errors.status.message}</FormHelperText>}
            </FormControl>
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
              required
            />
          )}
        />

        <Controller
          name='bannerImage'
          control={control}
          render={({ field: { value } }) => (
            <ImageUploadField
              label='Banner Image'
              value={value}
              inputRef={bannerUpload.inputRef}
              isUploading={bannerUpload.isUploading}
              onFileChange={bannerUpload.onFileChange}
              error={errors.bannerImage?.message}
              imageSize={{ width: 300, height: 200 }}
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
              imageSize={{ width: 300, height: 200 }}
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
                <ChainSelector
                  value={field.value}
                  onChange={field.onChange}
                  error={!!errors.tokenChain}
                  helperText={errors.tokenChain?.message}
                />
              )}
            />

            <Controller
              name='tokenAmountPerPullRequest'
              control={control}
              rules={{ required: isTokenEnabled ? 'Token amount per PR is required' : false }}
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

            <IssueTagAmountFields control={control} errors={errors} />
          </>
        )}

        <Stack direction='row' spacing={2} justifyContent='flex-end'>
          <Button variant='outlined' onClick={onClose}>
            Cancel
          </Button>
          <Button
            type='submit'
            variant='contained'
            color='primary'
            disabled={
              !isValid || isIconUploading || isBannerUploading || isInfoPageUploading || isSubmitting || !isDirty
            }
          >
            Create Partner
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
