import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import type { PostCategory } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import Button from 'components/common/Button';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import Link from 'components/common/Link';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import { useForumFilters } from 'hooks/useForumFilters';
import isAdmin from 'hooks/useIsAdmin';

import { FilterCategory } from './FilterCategory';
import type { FilterProps } from './FilterSelect';

const StyledBox = styled(Box)`
  ${hoverIconsStyle({ marginForIcons: false })}
`;

export default function FilterList({ selectedCategory }: FilterProps) {
  const { getLinkUrl, categories, sortList, error } = useForumFilters();
  const addCategoryPopupState = usePopupState({ variant: 'popover', popupId: 'add-category' });
  const currentSpace = useCurrentSpace();
  const admin = isAdmin();
  const [forumCategoryName, setForumCategoryName] = useState('');
  const { createForumCategory, deleteForumCategory, updateForumCategory } = useForumCategories();

  function createCategory() {
    createForumCategory(forumCategoryName);
    setForumCategoryName('');
    addCategoryPopupState.close();
  }

  if (error) {
    return <Alert severity='error'>An error occurred while loading the categories</Alert>;
  }

  if (!currentSpace) {
    return null;
  }

  return (
    <Card variant='outlined'>
      <CardContent
        sx={{
          px: 0
        }}
      >
        {/** TODO - Enable sorting 
        <Box display='flex' sx={{ alignItems: 'flex-start', flexDirection: 'column' }} gap={2}>
          {sortList.map((sort) => (
            <Link
              key={sort}
              href={getLinkUrl(sort)}
              
              color='inherit'
            >
              {sort}
            </Link>
          ))}
        </Box>
        <Divider sx={{ pt: '10px', mb: '10px' }} />
        <Stack gap={1} my={1}>
          {
            // <Link
            //   key={category.name}
            //   // sx={{ fontWeight: category.name === query.category ? 'bold' : 'initial' }}
            //   color='inherit'
            // >
            // </Link>
                <Divider sx={{ pt: '10px', mb: '10px' }} />
        */}
        <Stack mb={2}>
          {[{ id: 'all-categories', name: 'All categories' }, ...(categories ?? [])]?.map((category) => (
            <StyledBox key={category.id}>
              <MenuItem
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Link
                  href={{
                    pathname: `/${currentSpace!.domain}/forum`,
                    query:
                      category.id !== 'all-categories'
                        ? {
                            categoryIds: category.id
                          }
                        : {}
                  }}
                  sx={{
                    cursor: 'pointer',
                    wordBreak: 'break-all',
                    pr: 3.5
                  }}
                >
                  <Typography
                    color='initial'
                    fontWeight={
                      (category.id === 'all-categories' && selectedCategory === undefined) ||
                      selectedCategory === category.id
                        ? 'bold'
                        : 'initial'
                    }
                  >
                    {category.name}
                  </Typography>
                </Link>
                {admin && category.id !== 'all-categories' && (
                  <Box className='icons'>
                    <FilterCategory
                      category={category as PostCategory}
                      onChange={updateForumCategory}
                      onDelete={deleteForumCategory}
                    />
                  </Box>
                )}
              </MenuItem>
            </StyledBox>
          ))}
        </Stack>
        <Button
          sx={{
            ml: 2
          }}
          disabled={!admin}
          startIcon={<AddIcon />}
          onClick={addCategoryPopupState.open}
          variant='outlined'
        >
          Add category
        </Button>
      </CardContent>
      <Modal
        open={addCategoryPopupState.isOpen}
        onClose={() => {
          addCategoryPopupState.close();
        }}
        title='Add forum category'
      >
        <TextField
          sx={{
            mb: 1
          }}
          fullWidth
          value={forumCategoryName}
          onChange={(e) => {
            setForumCategoryName(e.target.value);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              createCategory();
            }
          }}
        />
        <Button
          disabled={
            forumCategoryName.length === 0 || categories?.find((category) => category.name === forumCategoryName)
          }
          onClick={createCategory}
        >
          Add
        </Button>
      </Modal>
    </Card>
  );
}
