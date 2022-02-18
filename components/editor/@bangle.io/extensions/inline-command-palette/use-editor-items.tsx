import {
  bulletList, orderedList,
  paragraph
} from '@bangle.dev/base-components';
import { EditorState, Fragment, Node, setBlockType, Transaction } from '@bangle.dev/pm';
import { rafCommandExec, safeInsert } from '@bangle.dev/utils';
import ImageIcon from '@mui/icons-material/Image';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { replaceSuggestionMarkWith } from '../../js-lib/inline-palette';
import {
  isList
} from './commands';
import { palettePluginKey } from './config';
import { PaletteItem, PaletteItemType } from './palette-item';

const { convertToParagraph } = paragraph;
const {
  toggleTodoList,
  queryIsBulletListActive,
  queryIsTodoListActive,
  toggleBulletList
} = bulletList;
const { toggleOrderedList, queryIsOrderedListActive } = orderedList;

const setHeadingBlockType = (level: number) => (state: EditorState, dispatch: ((tr: Transaction<any>) => void) | undefined) => {
  const type = state.schema.nodes.heading;
  return setBlockType(type, { level })(state, dispatch);
};

function createTableCell(state: EditorState, text: string) {
  return state.schema.nodes.table_cell.create(undefined, Fragment.fromArray([
    state.schema.nodes.paragraph.create(undefined, Fragment.fromArray([
      state.schema.text(text)
    ]))
  ]))
}

function createTableHeader(state: EditorState, text: string) {
  return state.schema.nodes.table_header.create(undefined, Fragment.fromArray([
    state.schema.nodes.paragraph.create(undefined, Fragment.fromArray([
      state.schema.text(text)
    ]))
  ]))
}

function insertNode(state: EditorState, dispatch: ((tr: Transaction<any>) => void) | undefined, nodeToInsert: Node) {
  const insertPos = state.selection.$from.after();
  
  const tr = state.tr;
  const newTr = safeInsert(nodeToInsert, insertPos)(state.tr);

  if (tr === newTr) {
    return false;
  }

  if (dispatch) {
    dispatch(newTr.scrollIntoView());
  }

  return true;
}

function createColumnPaletteItem(colCount: number): Omit<PaletteItemType, "group"> {
  return {
    uid: `column ${colCount}`,
    title: `${colCount} Columns`,
    icon: <ViewColumnIcon
      sx={{ fontSize: 16 }}
    />,
    description: `${colCount} Column Layout`,
    editorExecuteCommand: () => {
      return (state, dispatch, view) => {
        rafCommandExec(view!, (state, dispatch) => {
          const columnBlocks: Node[] = [];
          for (let index = 0; index < colCount; index++) {
            columnBlocks.push(
              state.schema.nodes.columnBlock.create(undefined, Fragment.fromArray([
                state.schema.nodes.paragraph.create()
              ]))
            )
          }
          return insertNode(state, dispatch, state.schema.nodes.columnLayout.create(
            undefined,
            Fragment.fromArray(columnBlocks)
          ))
        })
        return replaceSuggestionMarkWith(palettePluginKey, '')(
          state,
          dispatch,
          view,
        );
      };
    },
  }
}

const paletteGroupItemsRecord: Record<string, Omit<PaletteItemType, "group">[]> = {
  crypto: [
    {
      uid: 'price',
      title: 'Crypto price',
      icon: <InsertChartIcon sx={{ fontSize: 16 }}
      />,
      description: 'Display a crypto price',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          // Execute the animation
          rafCommandExec(view!, (state, dispatch) => {
            return insertNode(state, dispatch, state.schema.nodes.cryptoPrice.create())
          })
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );

        };
      },
    }
  ],
  media: [
    {
      uid: 'image',
      title: 'Image',
      icon: <ImageIcon
        sx={{ fontSize: 16 }}
      />,
      description: 'Insert a image block in the line below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (state, dispatch) => {
            return insertNode(state, dispatch, state.schema.nodes.paragraph.create(
              undefined,
              Fragment.fromArray([
                state.schema.nodes.image.create({
                  src: null
                })
              ])
            ))
          })
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    },
    {
      uid: 'video',
      title: 'Video',
      icon: <VideoLibraryIcon
        sx={{ fontSize: 16 }}
      />,
      description: 'Insert a video block in the line below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (state, dispatch) => {
            return insertNode(state, dispatch, state.schema.nodes.paragraph.create(
              undefined,
              Fragment.fromArray([
                state.schema.nodes.iframe.create({
                  src: null,
                  type: "video"
                })
              ])
            ))
          })
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    },
    {
      uid: 'embed',
      title: 'Embed',
      icon: <svg viewBox="0 0 30 30" className="compass" height="1em" width="1em" style={{display: 'block', fill: 'currentColor', flexShrink: 0, backfaceVisibility: 'hidden'}}><path d="M18,4.361V3c0-1.657-1.343-3-3-3s-3,1.343-3,3v1.361C6.27,5.718,2,10.854,2,17c0,7.18,5.82,13,13,13s13-5.82,13-13 C28,10.854,23.73,5.718,18,4.361z M14,3c0-0.552,0.448-1,1-1s1,0.448,1,1v1.051C15.669,4.025,15.338,4,15,4s-0.669,0.025-1,0.051V3z M16,27.949V26h-2v1.949C8.724,27.474,4.526,23.276,4.051,18H6v-2H4.051C4.526,10.724,8.724,6.526,14,6.051V8h2V6.051 c5.276,0.476,9.474,4.673,9.949,9.949H24v2h1.949C25.474,23.276,21.276,27.474,16,27.949z M8,24l10-4l4-10l-10,4L8,24z M18.41,13.59 l-1.949,4.871L11.59,20.41l1.949-4.871L18.41,13.59z" /></svg>,
      description: 'Insert an embed block in the line below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (state, dispatch) => {
            return insertNode(state, dispatch, state.schema.nodes.paragraph.create(
              undefined,
              Fragment.fromArray([
                state.schema.nodes.iframe.create({
                  src: null,
                  type: "embed"
                })
              ])
            ))
          })
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    },
    {
      uid: 'insertSimpleTable',
      icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M464 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V80c0-26.51-21.49-48-48-48zM224 416H64v-96h160v96zm0-160H64v-96h160v96zm224 160H288v-96h160v96zm0-160H288v-96h160v96z" /></svg>,
      title: 'Table',
      keywords: ['table'],
      description: 'Insert a simple table below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (state, dispatch, view) => {
            return insertNode(state, dispatch, state.schema.nodes.table.create(
              undefined,
              Fragment.fromArray([
                state.schema.nodes.table_row.create(undefined, Fragment.fromArray([
                  createTableHeader(state, "Header 1"),
                  createTableHeader(state, "Header 2"),
                  createTableHeader(state, "Header 3"),
                ])),
                state.schema.nodes.table_row.create(undefined, Fragment.fromArray([
                  createTableCell(state, "Cell 1"),
                  createTableCell(state, "Cell 2"),
                  createTableCell(state, "Cell 3"),
                ]))
              ])
            ))
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    },
    createColumnPaletteItem(2),
    createColumnPaletteItem(3),
  ],
  text: [
    {
      uid: 'paraConvert',
      keywords: ['paragraph', 'text'],
      title: 'Text',
      icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z" /><path d="M2.5 4v3h5v12h3V7h5V4h-13zm19 5h-9v3h3v7h3v-7h3V9z" /></svg>,
      description: 'Convert the current block to paragraph',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (state, dispatch, view) => {
            if (queryIsTodoListActive()(state)) {
              return toggleTodoList()(state, dispatch, view);
            }
            if (queryIsBulletListActive()(state)) {
              return toggleBulletList()(state, dispatch, view);
            }
            if (queryIsOrderedListActive()(state)) {
              return toggleOrderedList()(state, dispatch, view);
            }
            return convertToParagraph()(state, dispatch, view);
          });

          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    },
    {
      uid: 'code',
      title: 'Code',
      icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 384 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M384 121.941V128H256V0h6.059c6.365 0 12.47 2.529 16.971 7.029l97.941 97.941A24.005 24.005 0 0 1 384 121.941zM248 160c-13.2 0-24-10.8-24-24V0H24C10.745 0 0 10.745 0 24v464c0 13.255 10.745 24 24 24h336c13.255 0 24-10.745 24-24V160H248zM123.206 400.505a5.4 5.4 0 0 1-7.633.246l-64.866-60.812a5.4 5.4 0 0 1 0-7.879l64.866-60.812a5.4 5.4 0 0 1 7.633.246l19.579 20.885a5.4 5.4 0 0 1-.372 7.747L101.65 336l40.763 35.874a5.4 5.4 0 0 1 .372 7.747l-19.579 20.884zm51.295 50.479l-27.453-7.97a5.402 5.402 0 0 1-3.681-6.692l61.44-211.626a5.402 5.402 0 0 1 6.692-3.681l27.452 7.97a5.4 5.4 0 0 1 3.68 6.692l-61.44 211.626a5.397 5.397 0 0 1-6.69 3.681zm160.792-111.045l-64.866 60.812a5.4 5.4 0 0 1-7.633-.246l-19.58-20.885a5.4 5.4 0 0 1 .372-7.747L284.35 336l-40.763-35.874a5.4 5.4 0 0 1-.372-7.747l19.58-20.885a5.4 5.4 0 0 1 7.633-.246l64.866 60.812a5.4 5.4 0 0 1-.001 7.879z" /></svg>,
      description: 'Insert a code block in the line below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (state, dispatch) => {
            return insertNode(state, dispatch, state.schema.nodes.codeBlock.create(
              { language: "Javascript" },
              Fragment.fromArray([
                state.schema.text("console.log('Hello World');")
              ])
            ))
          })
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    },
    {
      uid: 'callout',
      title: 'Callout',
      icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M256 64C141.1 64 48 139.2 48 232c0 64.9 45.6 121.2 112.3 149.2-5.2 25.8-21 47-33.5 60.5-2.3 2.5.2 6.5 3.6 6.3 11.5-.8 32.9-4.4 51-12.7 21.5-9.9 40.3-30.1 46.3-36.9 9.3 1 18.8 1.6 28.5 1.6 114.9 0 208-75.2 208-168C464 139.2 370.9 64 256 64z" /></svg>,
      description: 'Insert a callout block in the line below',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (state, dispatch) => {
            return insertNode(state, dispatch, state.schema.nodes.blockquote.create(
              undefined,
              Fragment.fromArray([
                state.schema.nodes.paragraph.create(undefined, Fragment.fromArray([
                  state.schema.text("Hello World")
                ]))
              ])
            ))
          })
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    },
    ...Array.from({ length: 3 }, (_, i) => {
      const level = i + 1;
      return {
        uid: 'headingConvert' + level,
        icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M448 96v320h32a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H320a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h32V288H160v128h32a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H32a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h32V96H32a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16h160a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16h-32v128h192V96h-32a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16h160a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16z" /></svg>,
        title: 'Heading ' + level,
        description: 'Convert the current block to heading level ' + level,
        disabled: (state) => {
          const result = isList()(state);
          return result;
        },
        editorExecuteCommand: () => {
          return (state, dispatch, view) => {
            rafCommandExec(view!, setHeadingBlockType(level));
            return replaceSuggestionMarkWith(palettePluginKey, '')(
              state,
              dispatch,
              view,
            );
          };
        },
      } as Omit<PaletteItemType, "group">;
    })
  ],
  "list": [
    {
      uid: 'bulletListConvert',
      title: 'Bullet List',
      icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} version="1.1" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M6 1h10v2h-10v-2zM6 7h10v2h-10v-2zM6 13h10v2h-10v-2zM0 2c0-1.105 0.895-2 2-2s2 0.895 2 2c0 1.105-0.895 2-2 2s-2-0.895-2-2zM0 8c0-1.105 0.895-2 2-2s2 0.895 2 2c0 1.105-0.895 2-2 2s-2-0.895-2-2zM0 14c0-1.105 0.895-2 2-2s2 0.895 2 2c0 1.105-0.895 2-2 2s-2-0.895-2-2z" /></svg>,
      keywords: ['unordered', 'lists'],
      description: 'Convert the current block to bullet list',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (state, dispatch, view) => {
            setBlockType(state.schema.nodes.paragraph)(state, dispatch);
            return toggleBulletList()(view!.state, view!.dispatch, view);
          });

          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    },
    {
      uid: 'todoListConvert',
      title: 'Todo List',
      icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><g><path fill="none" d="M0 0h24v24H0z" /><path d="M7 7V3a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-4v3.993c0 .556-.449 1.007-1.007 1.007H3.007A1.006 1.006 0 0 1 2 20.993l.003-12.986C2.003 7.451 2.452 7 3.01 7H7zm2 0h6.993C16.549 7 17 7.449 17 8.007V15h3V4H9v3zm-.497 11l5.656-5.657-1.414-1.414-4.242 4.243L6.38 13.05l-1.414 1.414L8.503 18z" /></g></svg>,
      keywords: ['todo', 'lists', 'checkbox', 'checked'],
      description: 'Convert the current block to todo list',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (state, dispatch, view) => {
            setBlockType(state.schema.nodes.paragraph)(state, dispatch);
            return toggleTodoList()(view!.state, view!.dispatch, view);
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    },
    {
      uid: 'orderedListConvert',
      icon: <svg stroke="currentColor" fill="currentColor" strokeWidth={0} version="1.1" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M6 13h10v2h-10zM6 7h10v2h-10zM6 1h10v2h-10zM3 0v4h-1v-3h-1v-1zM2 8.219v0.781h2v1h-3v-2.281l2-0.938v-0.781h-2v-1h3v2.281zM4 11v5h-3v-1h2v-1h-2v-1h2v-1h-2v-1z" /></svg>,
      title: 'Ordered List',
      keywords: ['numbered', 'lists'],
      description: 'Convert the current block to ordered list',
      editorExecuteCommand: () => {
        return (state, dispatch, view) => {
          rafCommandExec(view!, (state, dispatch, view) => {
            setBlockType(state.schema.nodes.paragraph)(state, dispatch);
            return toggleOrderedList()(view!.state, view!.dispatch, view);
          });
          return replaceSuggestionMarkWith(palettePluginKey, '')(
            state,
            dispatch,
            view,
          );
        };
      },
    }
  ]
};

const paletteItems: PaletteItem[] = [];

Object.entries(paletteGroupItemsRecord).forEach(([group, paletteItemsWithoutGroup]) => {
  paletteItemsWithoutGroup.forEach(paletteItem => {
    paletteItems.push(PaletteItem.create({
      ...paletteItem,
      group
    }))
  })
})

export function useEditorItems() {
  return paletteItems;
}