import { BaseRawMarkSpec, SpecRegistry } from '@bangle.dev/core';
import { Command, EditorState, Plugin, PluginKey, Schema } from '@bangle.dev/pm';
import { EmojiGroupType } from '@bangle.dev/react-emoji-suggest/types';
import { getSquareDimensions, resolveCounter, resolveRowJump } from '@bangle.dev/react-emoji-suggest/utils';
import { createTooltipDOM, SuggestTooltipRenderOpts } from '@bangle.dev/tooltip';
import {
  bangleWarn,
  rafCommandExec,
  uuid
} from '@bangle.dev/utils';
import * as suggestTooltip from "components/editor/@bangle.dev/tooltip/suggest-tooltip";

const {
  decrementSuggestTooltipCounter,
  incrementSuggestTooltipCounter,
  updateSuggestTooltipCounter,
  removeSuggestMark,
  resetSuggestTooltipCounter,
  defaultKeys,
} = suggestTooltip;

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  queryTriggerText,
  selectEmoji,
};

const defaultTrigger = ':';
const defaultMaxItems = 2000;
function specFactory({
  markName,
  trigger = defaultTrigger,
}: {
  markName: string;
  trigger?: string;
}): BaseRawMarkSpec {
  const spec = suggestTooltip.spec({ markName, trigger });

  return {
    ...spec,
    options: {
      trigger,
    },
  };
}

export type GetEmojiGroupsType = (queryText: string) => EmojiGroupType;

function pluginsFactory({
  key = new PluginKey('emojiSuggestMenu'),
  markName,
  tooltipRenderOpts = {},
  getEmojiGroups,
  maxItems = defaultMaxItems,
  squareSide = 32,
  squareMargin = 2,
  rowWidth = 400,
}: {
  markName: string;
  key?: PluginKey;
  tooltipRenderOpts?: SuggestTooltipRenderOpts;
  getEmojiGroups: GetEmojiGroupsType;
  maxItems?: number;
  squareSide?: number;
  squareMargin?: number;
  rowWidth?: number;
}) {
  return ({
    schema,
    specRegistry,
  }: {
    schema: Schema;
    specRegistry: SpecRegistry;
  }) => {
    const { trigger } = specRegistry.options[markName as any] as any;

    const suggestTooltipKey = new PluginKey('suggestTooltipKey');

    // We are converting to DOM elements so that their instances
    // can be shared across plugins.
    const tooltipDOMSpec = createTooltipDOM(tooltipRenderOpts.tooltipDOMSpec);

    const getIsTop = () =>
      tooltipDOMSpec.dom.getAttribute('data-popper-placement') === 'top-start';

    if (!schema.marks[markName]) {
      bangleWarn(
        `Couldn't find the markName:${markName}, please make sure you have initialized to use the same markName you initialized the spec with`,
      );
      throw new Error(`markName ${markName} not found`);
    }

    const selectedEmojiSquareId = uuid(6);

    const updateCounter = (
      keyType: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN',
    ): Command => {
      return (state, dispatch, view) => {
        requestAnimationFrame(() => {
          const selectedEmoji = document.getElementById(selectedEmojiSquareId);
          if (selectedEmoji) {
            if ('scrollIntoViewIfNeeded' in document.body) {
              (selectedEmoji as any).scrollIntoViewIfNeeded(false);
            } else if (selectedEmoji.scrollIntoView) {
              selectedEmoji.scrollIntoView(false);
            }
          }
          view?.focus();
        });
        if (keyType === 'LEFT') {
          return decrementSuggestTooltipCounter(suggestTooltipKey)(
            state,
            dispatch,
            view,
          );
        }
        if (keyType === 'RIGHT') {
          return incrementSuggestTooltipCounter(suggestTooltipKey)(
            state,
            dispatch,
            view,
          );
        }

        const goUp = keyType === 'UP' ? !getIsTop() : getIsTop();
        const namedEmojiGroups = getEmojiGroups(queryTriggerText(key)(state));

        const { counter } = suggestTooltipKey.getState(state);
        const { rowCount } = getSquareDimensions({
          rowWidth,
          squareMargin,
          squareSide,
        });

        const newCounter = resolveRowJump(
          counter,
          goUp ? -1 : 1,
          rowCount,
          namedEmojiGroups,
        );

        if (newCounter == null) {
          return false;
        }

        return updateSuggestTooltipCounter(suggestTooltipKey, newCounter)(
          state,
          dispatch,
          view,
        );
      };
    };

    return [
      new Plugin({
        key,
        state: {
          init() {
            return {
              getEmojiGroups,
              maxItems,
              tooltipContentDOM: tooltipDOMSpec.contentDOM,
              markName,
              squareSide,
              squareMargin,
              selectedEmojiSquareId,
              rowWidth,
              suggestTooltipKey,
              insideCallout: false,
              getPos: null,
              updateAttrs: null,
            };
          },
          apply(tr, pluginState) {
            const meta = tr.getMeta(key);
            if (meta === undefined) {
              return pluginState;
            }
            if (meta.type === "INSIDE_CALLOUT") {
              return {
                ...pluginState,
                insideCallout: true,
                updateAttrs: meta.updateAttrs,
                getPos: meta.getPos
              }
            }

            if (meta.type === "OUTSIDE_CALLOUT") {
              return {
                ...pluginState,
                insideCallout: false,
                updateAttrs: null,
                getPos: null
              }
            }
          },
        },
      }),
      suggestTooltip.plugins({
        key: suggestTooltipKey,
        markName,
        trigger,
        tooltipRenderOpts: {
          ...tooltipRenderOpts,
          tooltipDOMSpec,
        },

        keybindings: {
          ...defaultKeys,
          left: 'ArrowLeft',
          right: 'ArrowRight',
        },

        onEnter: (state, dispatch, view) => {
          const emojiGroups = getEmojiGroups(queryTriggerText(key)(state));
          const matchedEmojis = emojiGroups.flatMap((r) => r.emojis);

          if (matchedEmojis.length === 0) {
            return removeSuggestMark(key)(state, dispatch, view);
          }

          const { counter } = suggestTooltipKey.getState(state);
          const { item: activeItem } = resolveCounter(counter, emojiGroups);

          if (!activeItem) {
            return removeSuggestMark(key)(state, dispatch, view);
          }

          const emojiAlias = activeItem[0];
          view &&
            rafCommandExec(view, resetSuggestTooltipCounter(suggestTooltipKey));
          return selectEmoji(key, emojiAlias)(state, dispatch, view);
        },

        onArrowDown: updateCounter('DOWN'),
        onArrowUp: updateCounter('UP'),
        onArrowLeft: updateCounter('LEFT'),
        onArrowRight: updateCounter('RIGHT'),
      }),
    ];
  };
}

export function getSuggestTooltipKey(key: PluginKey) {
  return (state: EditorState) => {
    return key.getState(state).suggestTooltipKey as PluginKey;
  };
}

/** Commands */
export function queryTriggerText(key: PluginKey) {
  return (state: EditorState) => {
    const suggestKey = getSuggestTooltipKey(key)(state);
    return suggestTooltip.queryTriggerText(suggestKey)(state);
  };
}

export function selectEmoji(key: PluginKey, emojiAlias: string): Command {
  return (state, dispatch, view) => {
    const emojiNode = state.schema.nodes.emoji.create({
      emojiAlias: emojiAlias,
    });

    const suggestKey = getSuggestTooltipKey(key)(state);

    return suggestTooltip.replaceSuggestMarkWith(suggestKey, emojiNode)(
      state,
      dispatch,
      view,
    );
  };
}
