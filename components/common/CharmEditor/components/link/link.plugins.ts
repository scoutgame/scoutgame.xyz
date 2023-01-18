import type { PluginKey } from '@bangle.dev/pm';
import { Plugin } from '@bangle.dev/pm';

import { createTooltipDOM, tooltipPlacement } from '../@bangle.dev/tooltip';
import {
  hideSuggestionsTooltip,
  referenceElement,
  renderSuggestionsTooltip
} from '../@bangle.dev/tooltip/suggest-tooltip';
import type { SuggestionPluginState } from '../suggestions/suggestions.plugins';

export type LinkPluginState = {
  show: boolean;
  href: string;
  tooltipContentDOM: HTMLElement;
  ref: HTMLElement | null;
};

export function plugins({ key }: { key: PluginKey }) {
  const tooltipDOMSpec = createTooltipDOM();

  return [
    new Plugin<SuggestionPluginState>({
      key,
      state: {
        init() {
          return {
            show: false,
            href: null,
            tooltipContentDOM: tooltipDOMSpec.contentDOM
          };
        },
        apply(tr, pluginState) {
          const meta = tr.getMeta(key);
          if (meta === undefined) {
            return pluginState;
          }
          if (meta.type === 'RENDER_TOOLTIP') {
            return {
              ...pluginState,
              ...meta.value,
              show: true
            };
          }
          if (meta.type === 'HIDE_TOOLTIP') {
            if (pluginState.show === false) {
              return pluginState;
            }
            return {
              ...pluginState,
              href: null,
              ref: null,
              show: false
            };
          }
          throw new Error('Unknown type');
        }
      },
      props: {
        handleDOMEvents: {
          mouseover: (view, event) => {
            const target = event.target as HTMLAnchorElement;
            const parentElement = target?.parentElement;
            if (parentElement) {
              const href = parentElement?.getAttribute('href');
              if (href) {
                renderSuggestionsTooltip(key, {
                  href,
                  ref: parentElement
                })(view.state, view.dispatch, view);
              }

              parentElement.onmouseleave = (ev) => {
                hideSuggestionsTooltip(key)(view.state, view.dispatch, view);
              };
            }
            return false;
          }
        }
      }
    }),
    tooltipPlacement.plugins({
      stateKey: key,
      renderOpts: {
        placement: 'bottom',
        tooltipDOMSpec,
        getReferenceElement: referenceElement(key, (state) => {
          const { selection } = state;
          return {
            end: selection.to,
            start: selection.from
          };
        })
      }
    })
  ];
}
