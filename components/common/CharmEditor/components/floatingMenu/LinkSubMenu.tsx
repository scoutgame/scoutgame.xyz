import { link } from '@bangle.dev/base-components';
import type { EditorView } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { MenuList, Stack, TextField } from '@mui/material';
import React, { useState } from 'react';

import FieldLabel from 'components/common/form/FieldLabel';

export function LinkSubMenu() {
  const view = useEditorViewContext();
  const result = link.queryLinkAttrs()(view.state);
  const originalHref = (result && result.href) || '';

  return (
    <LinkMenu
      // (hackish) Using the key to unmount then mount
      // the linkmenu so that it discards any preexisting state
      // in its `href` and starts fresh
      key={originalHref}
      originalHref={originalHref}
      view={view}
    />
  );
}

function LinkMenu({ view, originalHref = '' }: { view: EditorView; originalHref?: string }) {
  const [href, setHref] = useState(originalHref);
  const isSavedDisabled = href === originalHref || !/^(ipfs|http(s?)):\/\//i.test(href);
  const handleSubmit = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isSavedDisabled && e.code === 'Enter') {
      e.preventDefault();
      link.updateLink(href)(view.state, view.dispatch);
      view.focus();
    }
  };

  return (
    <Stack
      sx={{
        backgroundColor: 'background.light',
        px: 1
      }}
      py={1}
    >
      <FieldLabel variant='subtitle2'>Link</FieldLabel>
      <TextField value={href} onChange={(e) => setHref(e.target.value)} autoFocus onKeyDown={handleSubmit} />
    </Stack>
  );
}
