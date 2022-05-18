
import { createElement } from '@bangle.dev/core';
import { Plugin, PluginKey } from '@bangle.dev/pm';

// inspiration for this plugin: https://discuss.prosemirror.net/t/creating-a-wrapper-for-all-blocks/3310/9

interface PluginState {
  domElement: HTMLElement;
}

export function plugins () {

  const handlesKey = new PluginKey<PluginState>('handles');
  const domElement = createElement(['div', { class: 'row-handle' }]);

  return [

    new Plugin({
      key: handlesKey,
      // state: {
      //   init: () => {

      //     console.log('init state', domElement);
      //     return {
      //       domElement
      //     };
      //   },
      //   apply (_, pluginState) {
      //     return pluginState;
      //   }
      // },
      view: (view) => {
        // console.log(view.dom.parentNode);
        // view.dom.appendChild(createElement(['div']));
        // console.log('view dom', view.dom, view.dom.getBoundingClientRect());

        // const state = handlesKey.getState(view.state);

        // if (!state) {
        //   throw new Error('handles plugin state is undefined');
        // }
        view.dom.parentNode?.appendChild(domElement);

        function onMouseOver (e: MouseEventInit) {
          const ob = view.posAtCoords({ left: e.clientX!, top: e.clientY! });

          if (ob) {
            // grab the top-most editor position of what is being hovered
            let topPos = view.state.doc.resolve(ob.pos);
            while (topPos.parentOffset !== 0 && topPos.depth > 1) {
              topPos = view.state.doc.resolve(topPos.parentOffset);
            }

            // grab the related DOM element and find the top-most child DOM element
            let { node: hoveredElement } = view.domAtPos(topPos.pos);
            let levels = 10; // pre-caution to prevent infinite loop
            // eslint-disable-next-line no-plusplus
            while (hoveredElement.parentNode !== view.dom && levels > 0) {
              levels -= 1;
              if (hoveredElement.parentNode && view.dom.contains(hoveredElement.parentNode)) {
                hoveredElement = hoveredElement.parentNode;
              }
            }
            // @ts-ignore pm types are wrong
            if (hoveredElement.getBoundingClientRect) {
              // @ts-ignore pm types are wrong
              const box = hoveredElement.getBoundingClientRect();
              const viewBox = view.dom.getBoundingClientRect();
              const top = box.top - viewBox.top;
              domElement.style.top = `${top}px`;
              // console.log('row to hover', box.top, viewBox.top, topPos.pos, dom);
            }

            const node = view.state.doc.nodeAt(topPos.pos);

            // dom.node.addEventListener('mouseleave', () => {
            //   console.log('leave');
            //  // handle.remove();
            // });
          }
        }

        view.dom.addEventListener('mouseover', onMouseOver);

        return {
          destroy () {
            view.dom.removeEventListener('mouseover', onMouseOver);
          }
        };
      }
    })
  ];
}

