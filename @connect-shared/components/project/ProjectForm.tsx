import { MultiTextInputField } from '@connect-shared/components/common/MultiTextInputField';
import type { FormValues } from '@connect-shared/lib/projects/projectSchema';
import { CATEGORIES } from '@connect-shared/lib/projects/projectSchema';
import { FormLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { ProjectImageField } from './ProjectImageField';

export function ProjectForm({
  control,
  showCategory,
  isCategoryRequired = true,
  isDescriptionRequired = true,
  isWebsitesRequired = true
}: {
  control: Control<FormValues>;
  showCategory?: boolean;
  isDescriptionRequired?: boolean;
  isWebsitesRequired?: boolean;
  isCategoryRequired?: boolean;
}) {
  return (
    <Stack gap={2}>
      <Stack>
        <FormLabel id='project-avatar-and-cover-image'>Project avatar and cover image</FormLabel>
        <Stack direction='row' gap={1}>
          <ProjectImageField type='avatar' name='avatar' control={control} />
          <ProjectImageField type='cover' name='coverImage' control={control} />
        </Stack>
      </Stack>
      <Stack>
        <Controller
          control={control}
          name='name'
          render={({ field, fieldState }) => (
            <TextField
              data-test='project-form-name'
              autoFocus
              placeholder='Charmverse'
              aria-labelledby='project-name'
              error={!!fieldState.error}
              {...field}
            />
          )}
        />
      </Stack>
      <Stack>
        <FormLabel required={isDescriptionRequired} id='project-description'>
          Description
        </FormLabel>
        <Controller
          control={control}
          name='description'
          render={({ field }) => (
            <TextField
              data-test='project-form-description'
              multiline
              rows={3}
              aria-labelledby='project-description'
              placeholder='A description of your project'
              {...field}
            />
          )}
        />
      </Stack>

      <MultiTextInputField
        control={control}
        name='websites'
        label='Websites'
        data-test='project-form-websites'
        placeholder='https://charmverse.io'
        required={isWebsitesRequired}
      />

      {showCategory && (
        <Stack>
          <FormLabel required={isCategoryRequired} id='project-category'>
            Category
          </FormLabel>
          <Controller
            control={control}
            name='optimismCategory'
            render={({ field, fieldState }) => (
              <Select
                displayEmpty
                fullWidth
                aria-labelledby='project-category'
                data-test='project-form-category'
                renderValue={(value) => value || <Typography color='secondary'>Select a category</Typography>}
                error={!!fieldState.error}
                {...field}
              >
                {CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </Stack>
      )}

      <MultiTextInputField
        control={control}
        name='farcasterValues'
        label='Farcaster'
        required
        data-test='project-form-farcaster-values'
        placeholder='https://warpcast.com/charmverse'
      />

      <Stack>
        <FormLabel id='project-twitter'>X</FormLabel>
        <Stack direction='row' gap={1} alignItems='center'>
          <Typography color='secondary' width={250}>
            https://x.com/
          </Typography>
          <Controller
            control={control}
            name='twitter'
            render={({ field, fieldState }) => (
              <TextField
                fullWidth
                placeholder='charmverse'
                data-test='project-form-twitter'
                aria-labelledby='project-twitter'
                error={!!fieldState.error}
                {...field}
              />
            )}
          />
        </Stack>
      </Stack>
      <Stack>
        <FormLabel id='project-github'>Github</FormLabel>
        <Stack direction='row' gap={1} alignItems='center'>
          <Typography color='secondary' width={250}>
            https://github.com/
          </Typography>
          <Controller
            control={control}
            name='github'
            render={({ field, fieldState }) => (
              <TextField
                fullWidth
                placeholder='charmverse'
                aria-labelledby='project-github'
                data-test='project-form-github'
                error={!!fieldState.error}
                {...field}
              />
            )}
          />
        </Stack>
      </Stack>
    </Stack>
  );
}
