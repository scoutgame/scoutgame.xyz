
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SettingsIcon from '@mui/icons-material/Settings';
import NextLink from 'next/link';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Link from '../Link';
import Header from './Header';
import Avatar from '../Avatar';

interface SidebarProps {
  closeSidebar: () => void;
}

export default function Sidebar ({ closeSidebar }: SidebarProps) {
  return (
    <Box display='flex' flexDirection='column' sx={{ height: '100%' }}>
      <Box sx={{ flexGrow: 1 }}>
        <Header>
          <Typography>Acme</Typography>
          <IconButton onClick={closeSidebar}>
            <ChevronLeftIcon />
          </IconButton>
        </Header>
        <Divider sx={{ mb: 3 }} />
        {/* <Box>
          <List>
            <NextLink href='/settings/account' passHref>
              <ListItem button component='a' disableRipple sx={{ py: 1, color: greyColor + ' !important' }}>
                <ListItemText disableTypography>
                    <Box sx={{ fontSize: 14, fontWeight: 500 }}>Settings</Box>
                </ListItemText>
              </ListItem>
            </NextLink>
          </List>
        </Box> */}
        <Typography sx={{ color: '#999', fontSize: 12, letterSpacing: '0.03em', fontWeight: 600, px: 2 }}>
          FAVORITES
        </Typography>
        <List>
          <NextLink href='/blocks' passHref>
            <ListItem button component='a' sx={{ py: 0 }}>
              <ListItemText disableTypography>
                  <Box sx={{ fontSize: 14, fontWeight: 500, ml: 2 }}>First Page</Box>
              </ListItemText>
            </ListItem>
          </NextLink>
        </List>
        <Typography sx={{ color: '#999', fontSize: 12, letterSpacing: '0.03em', fontWeight: 600, px: 2 }}>
          WORKSPACE
        </Typography>
        <List>
          <NextLink href='/blocks' passHref>
            <ListItem button component='a' sx={{ py: 0 }}>
              <ListItemText disableTypography>
                  <Box sx={{ fontSize: 14, fontWeight: 500, ml: 2 }}>First Page</Box>
              </ListItemText>
            </ListItem>
          </NextLink>
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
          <Box display='flex' alignItems='center'>
            <Avatar name='dolemite' />
            <Box pl={1}>
              <Typography variant='caption' sx={{ display: 'block' }}>
                <strong>dolemite</strong><br />
                0x141...fBf4
              </Typography>
            </Box>
          </Box>
          <Link href='/settings/account'>
            <IconButton>
              <SettingsIcon />
            </IconButton>
          </Link>
        </Box>
      </Box>
    </Box>
  );
}