import { useRouter } from 'next/router';
import { Space } from '@prisma/client';
import { useCallback, useMemo } from 'react';
import { useSpaces } from './useSpaces';

export function useCurrentSpace () {

  const router = useRouter();
  const [spaces, setSpaces] = useSpaces();

  // Support for extracting domain from logged in view or shared bounties view
  // The other part of this logic, which retrieves list of spaces in public mode is in components/share/PublicPage
  const domain = router.query.domain ?? router.query.pageId?.[0];

  const space = useMemo(() => spaces.find(w => w.domain === domain), [domain, spaces]);

  const setSpace = useCallback((_space: Space) => {

    const spaceExists = spaces.findIndex(s => s.id === _space.id) !== -1;

    if (!spaceExists) {
      setSpaces([...spaces, _space]);
    }
    else {
      const newSpaces = spaces.map(s => s.id === _space.id ? _space : s);
      setSpaces(newSpaces);
    }
  }, [spaces, setSpaces]);

  return [space, setSpace] as const;
}
