import { createTooltipDOM, SuggestTooltipRenderOpts } from '@bangle.dev/tooltip';
import { NodeSelection, Plugin, PluginKey, TextSelection } from '@bangle.dev/pm';
import { insertNestedPage } from 'lib/prosemirror/insertNestedPage';
import { NodeView } from '@bangle.dev/core';
import { nestedPageNodeName, nestedPageSuggestMarkName } from './nestedPage.constants';
import { NestedPagePluginState } from './nestedPage.interfaces';
import * as suggestTooltip from '../@bangle.dev/tooltip/suggest-tooltip';

export function nestedPagePlugins ({
  key,
  markName = nestedPageSuggestMarkName,
  tooltipRenderOpts = {
    placement: 'bottom-start'
  }
}: {
  markName?: string;
  key: PluginKey<NestedPagePluginState>;
  tooltipRenderOpts?: SuggestTooltipRenderOpts;
}) {
  return () => {
    const suggestTooltipKey = new PluginKey('suggestTooltipKey');

    // We are converting to DOM elements so that their instances
    // can be shared across plugins.
    const tooltipDOMSpec = createTooltipDOM(tooltipRenderOpts.tooltipDOMSpec);

    return [
      new Plugin({
        key,
        state: {
          init () {
            return {
              tooltipContentDOM: tooltipDOMSpec.contentDOM,
              markName,
              suggestTooltipKey
            };
          },
          apply (_, pluginState) {
            return pluginState;
          }
        }
      }), new Plugin({
        key: new PluginKey('nestedPage-drop'),
        props: {
          handleDOMEvents: {
            dragenter (view, event) {
              // console.log({ event });
              return true;
            },
            dragend (view, event) {
              const nodeSelection = (view.state.selection as NodeSelection);
              const draggedNode = nodeSelection.node;
              if (event && draggedNode.type.name === nestedPageNodeName) {
                const draggedNodeStartPos = nodeSelection.ranges[0].$from.pos;
                const draggedNodeEndPos = nodeSelection.ranges[0].$to.pos;
                const containerXOffset = (event?.target as Element)?.getBoundingClientRect().left;
                const clientX = event.clientX!;
                const left = (clientX - containerXOffset) < 50 ? clientX + 50 : clientX;
                const ob = view.posAtCoords({ left, top: event.clientY });
                if (ob) {
                  const destinationPos = ob.inside > 0 ? ob.inside : ob.pos;
                  const node = view.state.doc.nodeAt(destinationPos);
                  if (node) {
                    if (draggedNodeEndPos < destinationPos) {
                      view.dispatch(view.state.tr
                        .deleteRange(draggedNodeStartPos, draggedNodeEndPos));
                      const cutDoc = view.state.doc.cut(draggedNodeEndPos, destinationPos);
                      view.dispatch(view.state.tr.replaceRangeWith(draggedNodeStartPos, destinationPos + 1, cutDoc)
                        .insert(destinationPos - 1, draggedNode));
                      view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.tr.doc.resolve(destinationPos))));
                    }
                    // else if (draggedNodeEndPos === destinationPos) {
                    //   const cutDoc = view.state.doc.cut(draggedNodeEndPos, destinationPos);
                    //   view.dispatch(view.state.tr
                    //     .deleteRange(draggedNodeStartPos, draggedNodeEndPos).replaceRangeWith(draggedNodeStartPos, destinationPos - 1, cutDoc)
                    //     .replaceRangeWith(destinationPos, destinationPos + 1, draggedNode));
                    // }
                    else {
                      view.dispatch(view.state.tr
                        .deleteRange(draggedNodeStartPos, draggedNodeEndPos));

                      const cutDoc = view.state.doc.cut(destinationPos, draggedNodeEndPos - 1);
                      view.dispatch(view.state.tr.replaceRangeWith(destinationPos - 1, draggedNodeStartPos, cutDoc)
                        .insert(destinationPos, draggedNode));
                      view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.tr.doc.resolve(destinationPos))));
                    }
                  }
                }
              }
              return true;
            }
          }
        }
      }),
      suggestTooltip.plugins({
        key: suggestTooltipKey,
        markName,
        onEnter (_, __, view) {
          const selectedMenuItem = document.querySelector('.mention-selected');
          const value = selectedMenuItem?.getAttribute('data-value');

          if (view && value) {
            insertNestedPage(key, view, value);
          }
          return false;
        },
        tooltipRenderOpts: {
          ...tooltipRenderOpts,
          tooltipDOMSpec
        }
      }),
      NodeView.createPlugin({
        name: 'page',
        containerDOM: ['div', { class: 'page-container' }]
      })
    ];
  };
}
