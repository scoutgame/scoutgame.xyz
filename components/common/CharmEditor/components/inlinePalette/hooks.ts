import type { EditorState, EditorView, PluginKey, Transaction } from '@bangle.dev/pm';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { useCallback, useEffect } from 'react';

import { suggestTooltip } from '../@bangle.dev/tooltip';

import { getSuggestTooltipKey } from './inlinePalette';
import type { PromisedCommand } from './paletteItem';

export interface InlinePaletteItem {
  editorExecuteCommand: (arg: { item: InlinePaletteItem; itemIndex: number }) => PromisedCommand;
}

export function useInlinePaletteQuery(inlinePaletteKey: PluginKey) {
  const view = useEditorViewContext();
  // TODO show is a bad name
  const {
    triggerText: query,
    counter,
    show: isVisible
  } = usePluginState(getSuggestTooltipKey(inlinePaletteKey)(view.state), true);
  const { tooltipContentDOM } = usePluginState(inlinePaletteKey);

  return { query, counter, isVisible, tooltipContentDOM };
}
/**
 * Hook which takes a function to get the items to render.
 * returns the properties needed to get on click and enter working
 * on these items.
 * TODO this api can be improved currently its unituitive
 * @param {*} param0
 * @returns
 */
export function useInlinePaletteItems<T extends InlinePaletteItem>(
  inlinePaletteKey: PluginKey,
  items: T[],
  counter: number,
  isItemDisabled?: (item: T) => boolean
): {
  getItemProps: (
    item: T,
    index: number
  ) => {
    isActive: boolean;
    onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  };
  dismissPalette: () => boolean;
} {
  const { setExecuteItemCommand } = usePluginState(inlinePaletteKey);
  const view = useEditorViewContext();

  const dismissPalette = useCallback(() => {
    return suggestTooltip.removeSuggestMark(inlinePaletteKey)(view.state, view.dispatch, view);
  }, [view, inlinePaletteKey]);

  const activeIndex = getActiveIndex(counter, items.length);

  const executeHandler = useCallback(
    (itemIndex) => {
      const item = items[itemIndex];

      if (!item) {
        return suggestTooltip.removeSuggestMark(inlinePaletteKey);
      }

      if (isItemDisabled?.(item)) {
        // still handle the key
        return () => true;
      }

      return (state: EditorState, dispatch: ((tr: Transaction<any>) => void) | undefined, _view: EditorView) => {
        return item.editorExecuteCommand({
          item,
          itemIndex
        })(state, dispatch, _view);
      };
    },
    [inlinePaletteKey, items, isItemDisabled]
  );

  useEffect(() => {
    // Save the callback to get the active item so that the plugin
    // can execute an enter on the active item
    setExecuteItemCommand(
      (state: EditorState, dispatch: ((tr: Transaction<any>) => void) | undefined, _view: EditorView) => {
        const result = executeHandler(getActiveIndex(counter, items.length))(state, dispatch, _view);
        return result;
      }
    );
    return () => {
      setExecuteItemCommand(undefined);
    };
  }, [setExecuteItemCommand, executeHandler, items, counter]);

  const getItemProps = useCallback(
    (item: T, index: number) => {
      return {
        isActive: activeIndex === index,
        onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          if (executeHandler(index)(view.state, view.dispatch, view)) {
            e.preventDefault();
          }
        }
      };
    },
    [activeIndex, executeHandler, view]
  );

  return {
    getItemProps,
    dismissPalette
  };
}

function getActiveIndex(counter: number, size: number): number {
  const r = counter % size;
  return r < 0 ? r + size : r;
}
