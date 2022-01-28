import { useState } from 'react';
import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SettingsIcon from '@mui/icons-material/Settings';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MuiLink from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import Avatar from '../Avatar';
import Link from '../Link';
import WorkspaceAvatar from '../WorkspaceAvatar';
import Header from './Header';
import { isTruthy } from 'lib/types';
import { useUser } from 'hooks/useUser';
import { useSpace } from 'hooks/useSpace';
import { useSpaces } from 'hooks/useSpaces';
import { usePages } from 'hooks/usePages';
import { Contributor, Space } from 'models';
import { shortenedWeb3Address } from 'lib/strings';
import EmojiCon from '../Emoji';
import ModalContainer from '../ModalContainer';
import CreateWorkspaceForm from './CreateWorkspaceForm';

const AvatarLink = styled(NextLink)`
  cursor: pointer;
`;

const WorkspacesContainer = styled.div`
  float: left;
  height: 100%;
  border-right: 1px solid ${({ theme }) => theme.palette.divider};
  padding: ${({ theme }) => theme.spacing(1)};
`;

interface SidebarProps {
  closeSidebar: () => void;
  favorites: Contributor['favorites'];
}

export default function Sidebar({ closeSidebar, favorites }: SidebarProps) {

  const router = useRouter();
  const [user] = useUser();
  const [space] = useSpace();
  const [spaces, setSpaces] = useSpaces();
  const [pages] = usePages();
  const [spaceFormOpen, setSpaceFormOpen] = useState(false);

  const favoritePages = favorites.map(fav => pages.find(page => page.id === fav.pageId)).filter(isTruthy);

  function showSpaceForm () {
    setSpaceFormOpen(true);
  }

  function addSpace (space: Space) {
    setSpaces([...spaces, space]);
    router.push(`/${space.domain}`);
  }

  return (<Box display='flex' sx={{ bgcolor: 'sidebar.background', height: '100%' }}>
    <WorkspacesContainer>
      <Grid container spacing={2} flexDirection='column'>
        {spaces.map(workspace => (
          <Grid item key={workspace.domain}>
            <AvatarLink href={`/${workspace.domain}`} passHref>
              <MuiLink>
                <WorkspaceAvatar active={space.domain === workspace.domain} name={workspace.name} />
              </MuiLink>
            </AvatarLink>
          </Grid>
        ))}
        <Grid item>
          <IconButton sx={{ borderRadius: '8px' }} onClick={showSpaceForm}><AddIcon /></IconButton>
        </Grid>
      </Grid>
      <Modal open={spaceFormOpen} onClose={() => setSpaceFormOpen(false)}>
        <ModalContainer>
          <CreateWorkspaceForm onSubmit={addSpace} onCancel={() => setSpaceFormOpen(false)} />
        </ModalContainer>
      </Modal>
    </WorkspacesContainer>
    <Box display='flex' flexDirection='column' sx={{ height: '100%', flexGrow: 1 }}>
      <Box sx={{ flexGrow: 1 }}>
        <Header>
          <Typography><strong>{space.name}</strong></Typography>
          <IconButton onClick={closeSidebar}>
            <ChevronLeftIcon />
          </IconButton>
        </Header>
        <Divider sx={{ mb: 3 }} />
        {/* <Box>
          <List>
            <NextLink href='' passHref>
              <ListItem button component='a' disableRipple sx={{ py: 1, color: greyColor + ' !important' }}>
                <ListItemText disableTypography>
                    <Box sx={{ fontSize: 14, fontWeight: 500 }}>Settings</Box>
                </ListItemText>
              </ListItem>
            </NextLink>
          </List>
        </Box> */}
        {favoritePages.length > 0 && <>
          <Typography sx={{ color: '#777', fontSize: 12, letterSpacing: '0.03em', fontWeight: 600, px: 2 }}>
            FAVORITES
          </Typography>
          <List>
            {favoritePages.map(page => (
              <NextLink href={`/${space.domain}/${page.path}`} key={page.id} passHref>
                <ListItem button component='a' disableRipple sx={{ py: 0 }}>
                  <ListItemText disableTypography>
                    <Box sx={{ fontSize: 14, fontWeight: 500, ml: 2 }}>
                      <EmojiCon sx={{ display: 'inline-block', width: 20 }}>{page.icon || '📄 '}</EmojiCon> {page.title}
                    </Box>
                  </ListItemText>
                </ListItem>
              </NextLink>
            ))}
          </List>
        </>}
        <Typography sx={{ color: '#777', fontSize: 12, letterSpacing: '0.03em', fontWeight: 600, px: 2 }}>
          WORKSPACE
        </Typography>
        <List>
          {pages.map(page => (
            <NextLink href={`/${space.domain}/${page.path}`} key={page.id} passHref>
              <ListItem button component='a' disableRipple sx={{ py: 0 }}>
                <ListItemText disableTypography>
                  <Box sx={{ fontSize: 14, fontWeight: 500, ml: 2 }}>
                    <EmojiCon sx={{ display: 'inline-block', width: 20 }}>{page.icon || '📄 '}</EmojiCon> {page.title}
                  </Box>
                </ListItemText>
              </ListItem>
            </NextLink>
          ))}
        </List>
        {/* <List>
          {['WORKSPACE', 'PRIVATE'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemText disableTypography>
                <Typography variant='caption'>{text}</Typography>
              </ListItemText>
            </ListItem>
          ))}
        </List> */}
      </Box>
      <Box>
        <Divider />
        <Box p={1} display='flex' alignItems='center' justifyContent='space-between'>
          {user && <Box display='flex' alignItems='center'>
            <Avatar name={user.username} />
            <Box pl={1}>
              <Typography variant='caption' sx={{ display: 'block' }}>
                <strong>{user.username}</strong><br />
                {shortenedWeb3Address(user.address)}
              </Typography>
            </Box>
          </Box>}
          <Link href={`/${space.domain}/settings/account`}>
            <IconButton>
              <SettingsIcon color='secondary' />
            </IconButton>
          </Link>
        </Box>
      </Box>
    </Box>
  </Box>);
}