import HomePageIcon from '@mui/icons-material/Home';
import NotHomePageIcon from '@mui/icons-material/HomeOutlined';
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material';

import { useUpdateSpace } from 'charmClient/hooks/spaces';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';

export function SetAsHomePageAction({ pageId, onComplete }: { pageId: string; onComplete: VoidFunction }) {
  const { space } = useCurrentSpace();
  const isAdmin = useIsAdmin();
  const { trigger: updateSpace } = useUpdateSpace(space?.id);
  const isHomePage = space?.homePageId === pageId;

  function onClick() {
    updateSpace({ homePageId: isHomePage ? null : pageId }).then(() => {
      onComplete();
    });
  }
  if (!isAdmin) {
    return null;
  }

  return (
    <MenuItem onClick={onClick}>
      <ListItemIcon>{isHomePage ? <HomePageIcon /> : <NotHomePageIcon />}</ListItemIcon>
      <ListItemText primary={isHomePage ? 'Unset as Home' : 'Set as Home'} />
    </MenuItem>
  );
}
