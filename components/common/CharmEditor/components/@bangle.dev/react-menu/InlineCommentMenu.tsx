import { useEditorViewContext } from '@bangle.dev/react';
import { hideSelectionTooltip } from '@bangle.dev/tooltip/selection-tooltip';
import { Box, Button } from '@mui/material';
import charmClient from 'charmClient';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import { checkForEmpty } from 'components/common/CharmEditor/utils';
import { usePages } from 'hooks/usePages';
import { PageContent } from 'models';
import { PluginKey, TextSelection } from 'prosemirror-state';
import React, { useState } from 'react';
import { mutate } from 'swr';
import { updateInlineComment } from '../../InlineComment';

export function InlineCommentSubMenu({pluginKey}: {pluginKey: PluginKey}) {
  const view = useEditorViewContext();
  const [commentContent, setCommentContent] = useState<PageContent>({
    type: 'doc',
    content: [
      {
        type: 'paragraph'
      }
    ]
  });
  const {currentPageId} = usePages()
  const isEmpty = checkForEmpty(commentContent);
  const handleSubmit = async (e: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (!isEmpty) {
      e.preventDefault();
      const {thread} = await charmClient.startThread({
        content: commentContent,
        // Get the context from current selection
        context: view.state.doc.cut(view.state.selection.from, view.state.selection.to).textContent,
        pageId: currentPageId
      });
      mutate(`pages/${currentPageId}/threads`)
      updateInlineComment(thread.id)(view.state, view.dispatch);
      hideSelectionTooltip(pluginKey)(view.state, view.dispatch, view)
      const tr = view.state.tr.setSelection(new TextSelection(view.state.doc.resolve(view.state.selection.$to.pos)))
      view.dispatch(tr)
      view.focus();
    }
  };

  return (
    <Box sx={{
      display: "flex"
    }}>
      <InlineCharmEditor content={commentContent} onContentChange={({doc}) => {
        setCommentContent(doc);
      }}/>
      <Button size="small" onClick={(e) => {
        handleSubmit(e)
      }} sx={{
        fontSize: 14
      }} disabled={isEmpty}>
        Start
      </Button>
    </Box>
  );
}