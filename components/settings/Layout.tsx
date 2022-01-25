import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { PageLayout } from '../common/page-layout';
import Container from './ContentContainer';
import { lighterGreyColor } from 'theme/colors';
import AccountIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/WorkOutline';
import PersonIcon from '@mui/icons-material/Group';

const SETTINGS_TABS = [
  { icon: <AccountIcon fontSize='small' />, path: '/settings/account', label: 'My account' },
  { icon: <SettingsIcon fontSize='small' />, path: '/settings/workspace', label: 'Workspace' },
  { icon: <PersonIcon fontSize='small' />, path: '/settings/members', label: 'Members' },
];

const NavigationContainer = styled(Box)`
  background-color: ${lighterGreyColor};
  padding-top: ${({ theme }) => theme.spacing(6)};
`;

export default function SettingsLayout ({ children }: { children: React.ReactNode }) {

  const router = useRouter();
  const [tab, setTab] = useState(getCurrentTabValue(router.pathname));

  useEffect(() => {
    setTab(getCurrentTabValue(router.pathname));
  }, [router.pathname]);

  function getCurrentTabValue (pathname: string) {
    const tabConfig = SETTINGS_TABS.find(tab => tab.path === pathname) || SETTINGS_TABS[0];
    return SETTINGS_TABS.indexOf(tabConfig);
  }

  return (
    <PageLayout>
      <NavigationContainer>
        <Container>
          <Tabs value={tab} indicatorColor='primary'>
            {/* combining next links with MUI tabs - https://stackoverflow.com/questions/65471275/material-ui-tabs-with-nextjs */}
            {SETTINGS_TABS.map(({ icon, path, label }) => (
              <Link href={path} passHref key={label}>
                <Tab icon={icon} iconPosition='start' component='a' disableRipple label={label} sx={{ minHeight: 0}} />
              </Link>
            ))}
          </Tabs>
        </Container>
      </NavigationContainer>
      <Container>
        {children}
      </Container>
    </PageLayout>
  )
}
