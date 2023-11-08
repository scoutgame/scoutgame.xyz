import type { Command, EditorView, Node, NodeType, Schema } from '@bangle.dev/pm';
import { InputRule, NodeSelection, Plugin, PluginKey } from '@bangle.dev/pm';

import type { RawPlugins } from 'components/common/CharmEditor/components/@bangle.dev/core/plugin-loader';
import { uploadToS3 } from 'lib/aws/uploadToS3Browser';

import { safeInsert } from '../../prosemirror/prosemirror-utils/transforms';

export const plugins = pluginsFactory;
export const commands = {};

const name = 'image';

const getTypeFromSchema = (schema: Schema) => schema.nodes[name];

export interface ImageNodeSchemaAttrs {
  caption: null | string;
  src: null | string;
  alt: null | string;
}

function pluginsFactory({
  handleDragAndDrop = true,
  acceptFileType = 'image/*',
  createImageNodes = defaultCreateImageNodes
}: {
  handleDragAndDrop?: boolean;
  acceptFileType?: string;
  createImageNodes?: (files: File[], imageType: NodeType, view: EditorView) => Promise<Node[]>;
} = {}): RawPlugins {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    return [
      new InputRule(/!\[(.+|:?)]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/, (state, match, start, end) => {
        const [, alt, src] = match;
        if (!src) {
          return null;
        }
        return state.tr.replaceWith(
          start,
          end,
          type.create({
            src,
            alt
          })
        );
      }),

      handleDragAndDrop &&
        new Plugin({
          key: new PluginKey(`${name}-drop-paste`),
          props: {
            handleDOMEvents: {
              drop(view, event) {
                if (event.dataTransfer == null) {
                  return false;
                }
                const files = getFileData(event.dataTransfer, acceptFileType, true);

                // TODO should we handle all drops but just show error?
                // returning false here would just default to native behaviour
                // But then any drop handler would fail to work.
                if (!files || files.length === 0) {
                  return false;
                }
                event.preventDefault();
                const coordinates = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY
                });

                if (coordinates?.pos) {
                  createImageNodes(files, getTypeFromSchema(view.state.schema), view).then((imageNodes) => {
                    addImagesToView(view, coordinates.pos, imageNodes);
                  });
                }
                return true;
              }
            },

            handlePaste: (view, rawEvent) => {
              const event = rawEvent;
              if (!event.clipboardData) {
                return false;
              }
              const files = getFileData(event.clipboardData, acceptFileType, true);
              if (!files || files.length === 0) {
                return false;
              }
              createImageNodes(files, getTypeFromSchema(view.state.schema), view).then((imageNodes) => {
                addImagesToView(view, view.state.selection.from, imageNodes);
              });

              return true;
            }
          }
        })
    ];
  };
}

async function defaultCreateImageNodes(files: File[], imageType: NodeType, _view: EditorView) {
  const { url } = await uploadToS3(files[0]);
  return [
    imageType.create({
      src: url
    })
  ];
}

function addImagesToView(view: EditorView, pos: number, imageNodes: Node[]) {
  for (const node of imageNodes) {
    const { tr } = view.state;
    const newTr = safeInsert(node, pos)(tr);
    if (newTr !== tr) {
      view.dispatch(newTr);
    }
  }
}

function getFileData(data: DataTransfer, accept: string, multiple: boolean) {
  const dragDataItems = getMatchingItems(data.items, accept, multiple);
  const files: File[] = [];

  dragDataItems.forEach((item) => {
    const file = item && item.getAsFile();
    if (file == null) {
      return;
    }
    files.push(file);
  });

  return files;
}

function getMatchingItems(list: DataTransferItemList, accept: string, multiple: boolean) {
  const dataItems = Array.from(list);
  let results;

  // Return the first item (or undefined) if our filter is for all files
  if (accept === '') {
    results = dataItems.filter((item) => item.kind === 'file');
    return multiple ? results : [results[0]];
  }

  const accepts = accept
    .toLowerCase()
    .split(',')
    .map((_accept) => {
      return _accept.split('/').map((part) => part.trim());
    })
    .filter((acceptParts) => acceptParts.length === 2); // Filter invalid values

  const predicate = (item: DataTransferItem) => {
    if (item.kind !== 'file') {
      return false;
    }

    const [typeMain, typeSub] = item.type
      .toLowerCase()
      .split('/')
      .map((s) => s.trim());

    for (const [acceptMain, acceptSub] of accepts) {
      // Look for an exact match, or a partial match if * is accepted, eg image/*.
      if (typeMain === acceptMain && (acceptSub === '*' || typeSub === acceptSub)) {
        return true;
      }
    }
    return false;
  };

  results = dataItems.filter(predicate);
  if (multiple === false) {
    results = [results[0]];
  }

  return results;
}

export const updateImageNodeAttribute =
  (attr: Node['attrs'] = {}): Command =>
  (state, dispatch) => {
    if (!(state.selection instanceof NodeSelection) || !state.selection.node) {
      return false;
    }
    const { node } = state.selection;
    if (node.type !== getTypeFromSchema(state.schema)) {
      return false;
    }

    if (dispatch) {
      dispatch(
        state.tr.setNodeMarkup(state.selection.$from.pos, undefined, {
          ...node.attrs,
          ...attr
        })
      );
    }
    return true;
  };
