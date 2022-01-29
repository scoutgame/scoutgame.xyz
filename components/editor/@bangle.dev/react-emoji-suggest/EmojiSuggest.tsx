import type { EditorView } from '@bangle.dev/pm';
import { PluginKey } from '@bangle.dev/pm';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { GetEmojiGroupsType, selectEmoji } from '@bangle.dev/react-emoji-suggest/emoji-suggest';
import { getSquareDimensions, resolveCounter } from '@bangle.dev/react-emoji-suggest/utils';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/system';
import GroupLabel from 'components/editor/GroupLabel';
import { useScrollbarStyling } from 'hooks/useScrollbarStyling';
import React, { useCallback, useMemo } from 'react';
import reactDOM from 'react-dom';

const StyledEmojiSuggest = styled(Box)`
  height: 350px;
  overflow: auto;
  overflow-x: hidden;
  width: fit-content;
  background-color: ${({ theme }) => theme.palette.background.light}
`;

export function EmojiSuggest({
  emojiSuggestKey,
}: {
  emojiSuggestKey: PluginKey;
}) {
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    getEmojiGroups,
    maxItems,
    squareSide,
    squareMargin,
    rowWidth,
    selectedEmojiSquareId,
    suggestTooltipKey,
  } = usePluginState(emojiSuggestKey);
  const theme = useTheme();
  const {
    counter,
    triggerText,
    show: isVisible,
  } = usePluginState(suggestTooltipKey);
  const scrollbarStyling = useScrollbarStyling();
  const width = rowWidth + (parseInt(theme.spacing(1).replace("px", "")) * 2);

  return reactDOM.createPortal(
    <StyledEmojiSuggest className="bangle-emoji-suggest" sx={scrollbarStyling}>
      <div
        style={{
          width,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {isVisible && (
          <EmojiSuggestContainer
            view={view}
            rowWidth={width}
            squareMargin={squareMargin}
            squareSide={squareSide}
            maxItems={maxItems}
            emojiSuggestKey={emojiSuggestKey}
            getEmojiGroups={getEmojiGroups}
            triggerText={triggerText}
            counter={counter}
            selectedEmojiSquareId={selectedEmojiSquareId}
          />
        )}
      </div>
    </StyledEmojiSuggest>,
    tooltipContentDOM,
  );
}

export function EmojiSuggestContainer({
  view,
  rowWidth,
  squareMargin,
  squareSide,
  emojiSuggestKey,
  getEmojiGroups,
  triggerText,
  counter,
  selectedEmojiSquareId,
  maxItems,
}: {
  view: EditorView;
  rowWidth: number;
  squareMargin: number;
  squareSide: number;
  emojiSuggestKey: PluginKey;
  getEmojiGroups: GetEmojiGroupsType;
  triggerText: string;
  counter: number;
  selectedEmojiSquareId: string;
  maxItems: number;
}) {
  const emojiGroups = useMemo(
    () => getEmojiGroups(triggerText),
    [getEmojiGroups, triggerText],
  );
  const { containerWidth } = getSquareDimensions({
    rowWidth,
    squareMargin,
    squareSide,
  });
  const theme = useTheme();

  const { item: activeItem } = resolveCounter(counter, emojiGroups);
  const onSelectEmoji = useCallback(
    (emojiAlias: string) => {
      selectEmoji(emojiSuggestKey, emojiAlias)(view.state, view.dispatch, view);
    },
    [view, emojiSuggestKey],
  );

  return (
    <div
      className="bangle-emoji-suggest-container"
      style={{
        width: containerWidth + (parseInt(theme.spacing(1).replace("px", "")) * 2),
      }}
    >
      {emojiGroups.map(({ name: groupName, emojis }, i) => {
        return (
          <Box p={1} className="bangle-emoji-suggest-group" key={groupName || i}>
            <GroupLabel sx={{
              margin: 1
            }} label={groupName} />
            <Box sx={{
              marginBottom: 1.5
            }}>
              {emojis.slice(0, maxItems).map(([emojiAlias, emoji]) => (
                <EmojiSquare
                  key={emojiAlias}
                  isSelected={activeItem?.[0] === emojiAlias}
                  emoji={emoji}
                  emojiAlias={emojiAlias}
                  onSelectEmoji={onSelectEmoji}
                  selectedEmojiSquareId={selectedEmojiSquareId}
                  style={{
                    margin: squareMargin,
                    width: squareSide,
                    height: squareSide,
                    lineHeight: squareSide + 'px',
                    fontSize: Math.max(squareSide - 10, 4),
                  }}
                />
              ))}
            </Box>
          </Box>
        );
      })}
    </div>
  );
}

const StyledEmojiSquare = styled.button<{ isSelected: boolean }>`
  border: none;
  padding: 0px !important;
  ${props => props.isSelected && `background-color: rgb(0, 0, 0, 0.125);`};
  transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;

  &:hover {
    cursor: pointer;
    background-color: ${({ theme }) => theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04);"};
    transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  }
`

function EmojiSquare({
  isSelected,
  emoji,
  emojiAlias,
  onSelectEmoji,
  style,
  selectedEmojiSquareId,
}: {
  isSelected: boolean;
  emoji: string;
  emojiAlias: string;
  onSelectEmoji: (alias: string) => void;
  style: any;
  selectedEmojiSquareId: string;
}) {
  return (
    <StyledEmojiSquare
      isSelected={isSelected}
      className={`bangle-emoji-square`}
      id={isSelected ? selectedEmojiSquareId : undefined}
      onClick={(e) => {
        e.preventDefault();
        onSelectEmoji(emojiAlias);
      }}
      style={style}
    >
      <span style={{
        position: "relative",
        right: -1
      }}>
        {emoji}
      </span>
    </StyledEmojiSquare>
  );
}
