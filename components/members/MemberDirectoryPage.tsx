import styled from '@emotion/styled';
import { MoreHoriz } from '@mui/icons-material';
import { Box, IconButton, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import { iconForViewType } from 'components/common/BoardEditor/focalboard/src/components/viewMenu';
import Button from 'components/common/Button';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';

import { MemberDirectoryGalleryView } from './MemberDirectoryGalleryView';
import { MemberDirectoryTableView } from './MemberDirectoryTableView';
import { MemberPropertiesSidebar } from './MemberPropertiesSidebar';

const StyledButton = styled(Button)`
  padding: ${({ theme }) => theme.spacing(0.5, 1)};

  .Icon {
    width: 20px;
    height: 20px;
  }
`;

const views = ['gallery', 'table'] as const;

export default function MemberDirectoryPage () {
  const { members } = useMembers();
  const [searchedMembers, setSearchedMembers] = useState<Member[]>(members);
  const { properties } = useMemberProperties();
  const [currentView, setCurrentView] = useState<typeof views[number]>('gallery');
  const [isPropertiesDrawerVisible, setIsPropertiesDrawerVisible] = useState(false);
  const [space] = useCurrentSpace();

  useEffect(() => {
    setSearchedMembers(members);
  }, [members]);

  const debouncedSearchMembers = useMemo(() => debounce(async (searchedContent: string) => {
    if (space) {
      const searchResult = await charmClient.members.getMembers(space.id, searchedContent);
      setSearchedMembers(searchResult);
    }
  }, 1000), []);

  return properties && searchedMembers ? (
    <CenteredPageContent style={{
      height: '100%'
    }}
    >
      <Typography variant='h1' my={2}>Member Directory</Typography>
      <TextField
        placeholder='Search for members, roles, skills, interests, etc'
        fullWidth
        sx={{
          my: 2
        }}
        onChange={(e) => {
          const search = e.target.value;
          if (search.length !== 0) {
            debouncedSearchMembers(search);
          }
          else {
            setSearchedMembers(members);
          }
        }}
      />
      <Stack flexDirection='row' justifyContent='space-between'>
        <Tabs textColor='primary' indicatorColor='secondary' value={currentView} sx={{ minHeight: 0, height: 'fit-content' }}>
          {views.map(view => (
            <Tab
              component='div'
              disableRipple
              key={view}
              label={(
                <StyledButton
                  startIcon={iconForViewType(view)}
                  onClick={() => {
                    setCurrentView(view);
                  }}
                  variant='text'
                  size='small'
                  color={currentView === view ? 'textPrimary' : 'secondary'}
                >
                  {view[0].toUpperCase() + view.slice(1)}
                </StyledButton>
              )}
              sx={{ p: 0, mb: '5px' }}
              value={view}
            />
          ))}
        </Tabs>
        <IconButton onClick={() => {
          setTimeout(() => {
            setIsPropertiesDrawerVisible(!isPropertiesDrawerVisible);
          });
        }}
        >
          <MoreHoriz color='secondary' />
        </IconButton>
      </Stack>
      <Box position='relative' display='flex' height='100%'>
        <Box width='100%'>
          {currentView === 'table' && <MemberDirectoryTableView members={searchedMembers} />}
          {currentView === 'gallery' && <MemberDirectoryGalleryView members={searchedMembers} />}
        </Box>
        <MemberPropertiesSidebar
          isOpen={isPropertiesDrawerVisible}
          onClose={() => {
            setIsPropertiesDrawerVisible(false);
          }}
        />
      </Box>
    </CenteredPageContent>
  ) : null;
}
