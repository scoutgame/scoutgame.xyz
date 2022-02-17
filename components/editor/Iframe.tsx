import { NodeViewProps, Plugin, RawSpecs } from '@bangle.dev/core';
import { EditorState, EditorView, Node, Schema, Slice, Transaction } from '@bangle.dev/pm';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import { ListItem, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { HTMLAttributes } from 'react';
import BlockAligner from './BlockAligner';
import IFrameSelector from './IFrameSelector';
import Resizer from './Resizer';

const name = 'iframe';

interface DispatchFn {
  (tr: Transaction): void;
}

// inject a real iframe node when pasting embed codes

export const iframePlugin = new Plugin({
  props: {
    handlePaste: (view: EditorView, rawEvent: ClipboardEvent, slice: Slice) => {
      // @ts-ignore
      const contentRow = slice.content.content?.[0].content.content;
      const isIframeEmbed = contentRow?.[0]?.text.startsWith('<iframe ');
      const isYoutubeLink = contentRow?.[0]
        ?.text.match(/(?:https:\/\/www.youtube.com\/watch\?v=(.*)|https:\/\/youtu.be\/(.*))/);
      let embedUrl: null | string = null;

      if (isYoutubeLink) {
        /* eslint-disable-next-line */
        embedUrl = `https://www.youtube.com/embed/${isYoutubeLink[1] ?? isYoutubeLink[2]}`;
      }
      else if (isIframeEmbed) {
        const urlContent = contentRow.find((row: any) => row.marks[0]?.type.name === 'link');
        if (urlContent) {
          embedUrl = urlContent.marks[0].attrs.href;
        }
      }

      if (embedUrl) {
        insertIframeNode(view.state, view.dispatch, view, { src: embedUrl });
        return true;
      }
      return false;
    }
  }
});

const getTypeFromSchema = (schema: Schema) => schema.nodes[name];

function insertIframeNode (state: EditorState, dispatch: DispatchFn, view: EditorView, attrs?: { [key: string]: any }) {
  const type = getTypeFromSchema(state.schema);
  const newTr = type.create(attrs);
  const { tr } = view.state;
  const cursorPosition = state.selection.$head.pos;
  tr.insert(cursorPosition, newTr);
  if (dispatch) {
    dispatch(state.tr.replaceSelectionWith(newTr));
  }
}

export function iframeSpec (): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        src: {
          default: ''
        }
      },
      group: 'block',
      inline: false,
      draggable: false,
      isolating: true, // dont allow backspace to delete
      parseDOM: [
        {
          tag: 'iframe',
          getAttrs: (dom: any) => {
            return {
              src: dom.getAttribute('src')
            };
          }
        }
      ],
      toDOM: (node: Node) => {
        return ['iframe', { class: 'ns-embed', style: `height: ${node.attrs.height};`, ...node.attrs }];
      }
    }
  };
}

const StyledEmptyIFrameContainer = styled(Box)`
  display: flex;
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
  align-items: center;
  opacity: 0.5;
`;

function EmptyIFrameContainer (props: HTMLAttributes<HTMLDivElement>) {
  const theme = useTheme();

  return (
    <ListItem
      button
      disableRipple
      sx={{
        backgroundColor: theme.palette.background.light,
        p: 2,
        display: 'flex',
        borderRadius: theme.spacing(0.5)
      }}
      {...props}
    >
      <StyledEmptyIFrameContainer>
        <VideoLibraryIcon fontSize='small' />
        <Typography>
          Embed an iframe
        </Typography>
      </StyledEmptyIFrameContainer>
    </ListItem>
  );
}

const StyledIFrame = styled(Box)`
  object-fit: contain;
  width: 100%;
  min-height: 250px;
  user-select: none;
  &:hover {
    cursor: initial;
  }
  border-radius: ${({ theme }) => theme.spacing(1)};
`;

export default function IFrame ({ node, updateAttrs }: NodeViewProps) {
  const theme = useTheme();
  // If there are no source for the node, return the image select component
  if (!node.attrs.src) {
    return (
      <IFrameSelector onIFrameSelect={(videoLink) => {
        updateAttrs({
          src: videoLink
        });
      }}
      >
        <EmptyIFrameContainer />
      </IFrameSelector>
    );
  }

  return (
    <Box style={{
      margin: theme.spacing(3, 0),
      display: 'flex',
      flexDirection: 'column'
    }}
    >
      <Box sx={{
        margin: theme.spacing(1, 0)
      }}
      >
        <a
          href={node.attrs.src}
          rel='noopener noreferrer nofollow'
          target='_blank'
        >
          {node.attrs.src}
        </a>

      </Box>
      <BlockAligner onDelete={() => {
        updateAttrs({
          src: null
        });
      }}
      >
        <Resizer initialSize={1.77 * 250} maxSize={750} minSize={1.77 * 250} aspectRatio={1.77}>
          <StyledIFrame>

            <iframe allowFullScreen title='iframe' src={node.attrs.src} style={{ height: '100%', border: '0 solid transparent', width: '100%' }} />
          </StyledIFrame>
        </Resizer>
      </BlockAligner>
    </Box>
  );
}
