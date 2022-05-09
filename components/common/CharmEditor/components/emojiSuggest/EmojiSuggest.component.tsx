import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { useTheme } from '@emotion/react';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Popper from '@mui/material/Popper';
import { BaseEmoji, Picker } from 'emoji-mart';
import styled from '@emotion/styled';
import { useCallback } from 'react';
import { PluginKey } from 'prosemirror-state';
import { selectEmoji } from './emojiSuggest.plugins';

const StyledPopper = styled(Popper)`
  z-index: var(--z-index-modal);
`;

export default function EmojiSuggest ({ pluginKey }: {pluginKey: PluginKey}) {
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    suggestTooltipKey
  } = usePluginState(pluginKey);

  const {
    show: isVisible
  } = usePluginState(suggestTooltipKey);

  const theme = useTheme();

  function closeTooltip () {
    if (view.dispatch) {
      view.dispatch(
        // Chain transactions together
        view.state.tr.setMeta(suggestTooltipKey, { type: 'HIDE_TOOLTIP' }).setMeta('addToHistory', false)
      );
    }
  }

  const onSelectEmoji = useCallback(
    (emojiAlias: string) => {
      selectEmoji(pluginKey, emojiAlias)(view.state, view.dispatch, view);
      closeTooltip();
    },
    [view, pluginKey]
  );

  return isVisible && (
    <StyledPopper
      open={true}
      anchorEl={tooltipContentDOM}
      placement='bottom-start'
    >
      {/* <ClickAwayListener onClickAway={closeTooltip}> */}
      <Picker
        theme={theme.palette.mode}
        onSelect={(emoji: BaseEmoji) => {
          onSelectEmoji(emoji.native);
        }}
      />
      {/* </ClickAwayListener> */}
    </StyledPopper>
  );
}
