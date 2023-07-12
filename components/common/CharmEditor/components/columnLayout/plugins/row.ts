import { createElement } from '@bangle.dev/core';
import { log } from '@charmverse/core/log';
import type { PluginKey } from 'prosemirror-state';
import { Plugin } from 'prosemirror-state';
import type { NodeView } from 'prosemirror-view';

export function RowNodeView({ key, name }: { key: PluginKey; name: string }) {
  return new Plugin({
    key,
    props: {
      nodeViews: {
        [name]: function nodeViewFactory(node, view, getPos) {
          const element = createElement(['div', { class: 'charm-column-row' }]);

          // load lib externally so it's not loaded on Server-side
          const columnResizerPromise = import('@column-resizer/core').then(({ ColumnResizer }) => {
            return new ColumnResizer({ vertical: false });
          });

          async function resizeCallback(event: any) {
            event.preventDefault();
            event.stopPropagation();
            const columnResizer = await columnResizerPromise;
            const sizes = columnResizer
              .getResizer()
              .getResult()
              .sizeInfoArray.filter((sizeInfo) => !sizeInfo.isSolid) // remove the 'bar' resizer info
              .map((sizeInfo) => sizeInfo.currentSize);
            const columnUpdates = sizes.map((size) => ({ size, pos: -1 }));

            const startPos = getPos();

            let index = 0;

            // iterate the children of this node, which are 'columnBlock' type
            view.state.doc.nodesBetween(startPos, startPos + node.nodeSize, (child, pos) => {
              if (child.type.name === 'columnBlock' && columnUpdates[index]) {
                columnUpdates[index].pos = pos;
                index += 1;
              }
              if (child.type.name === 'columnLayout') {
                // descend into the columnBlock nodes
                return true;
              }
              return false;
            });
            // console.log('save column sizes', getPos(), columnUpdates);
            const tr = view.state.tr;
            log.info('dispatch updates to prosemirror', element);
            columnUpdates.forEach((update) => {
              if (update.pos > -1) {
                tr.setNodeMarkup(update.pos, undefined, { size: update.size });
              }
            });
            view.dispatch(tr);
          }

          // trigger this after child nodes are rendered
          setTimeout(async () => {
            log.info('init resizer on load', element);
            const columnResizer = await columnResizerPromise;
            columnResizer.init(element);
            element.addEventListener('column:after-resizing' as any, resizeCallback);
          }, 0);

          const nodeView: NodeView = {
            contentDOM: element,
            dom: element,
            update(newNode) {
              // dont update if the update is from another node type
              if (newNode.type.name !== name) {
                return false;
              }

              // if the node has been updated, we need to re-init the column resizer as Prosemirror has re-rendered the decorations
              // An alternative would be to create a unique key for each column resizer, but this is easier
              setTimeout(async () => {
                log.info('init resizer on view update', element);
                const columnResizer = await columnResizerPromise;
                columnResizer.init(element);
              });
              // always return true, or else prosemirror will re-create the entire node view
              return true;
            },
            // we need to ignore mutations caused by column-resizer (the style attribute is changed by column-resizer)
            ignoreMutation(mutation) {
              // @ts-ignore donot ignore a selection type mutation
              // if (mutation.type === 'selection') {
              //   log.info('selection mutation');
              //   return false;
              // }

              // ref bangle.dev: https://discuss.prosemirror.net/t/nodeviews-with-contentdom-stops-the-cursor-movement-for-a-node-with-text-content/3208/6
              // if a child of this.dom (the one handled by PM)
              // has any mutation, do not ignore it
              if (this.dom.contains(mutation.target)) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                  return true;
                }
                return false;
              }

              return true;
            },
            destroy() {
              element.removeEventListener('column:after-resizing' as any, resizeCallback);
              columnResizer.dispose();
            }
          };

          return nodeView;
        }
      }
    }
  });
}
