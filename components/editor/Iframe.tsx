import { NodeViewProps, Plugin, RawSpecs } from '@bangle.dev/core';
import { EditorState, EditorView, Node, Schema, Slice, Transaction } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import PreviewIcon from '@mui/icons-material/Preview';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import { ListItem, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { HTMLAttributes, useState } from 'react';
import BlockAligner from './BlockAligner';
import IFrameSelector from './IFrameSelector';
import Resizer from './Resizer';

const MAX_EMBED_WIDTH = 750; const
  MIN_EMBED_WIDTH = 100; const
  ASPECT_RATIO = 1.77;

const name = 'iframe';

function extractEmbedLink (url: string) {
  const isYoutubeLink = url.match(/(?:https:\/\/www.youtube.com\/watch\?v=(.*)|https:\/\/youtu.be\/(.*))/);
  const isIframeEmbed = url.startsWith('<iframe ');
  let embedUrl = url;

  if (isYoutubeLink) {
    /* eslint-disable-next-line */
    embedUrl = `https://www.youtube.com/embed/${isYoutubeLink[1] ?? isYoutubeLink[2]}`;
  }
  else if (isIframeEmbed) {
    const indexOfSrc = url.indexOf('src');
    const indexOfFirstQuote = url.indexOf('"', indexOfSrc);
    const indexOfLastQuote = url.indexOf('"', indexOfFirstQuote + 1);
    embedUrl = url.slice(indexOfFirstQuote + 1, indexOfLastQuote);
  }

  return embedUrl;
}

interface DispatchFn {
  (tr: Transaction): void;
}

// inject a real iframe node when pasting embed codes

export const iframePlugin = new Plugin({
  props: {
    handlePaste: (view: EditorView, rawEvent: ClipboardEvent, slice: Slice) => {
      // @ts-ignore
      const contentRow = slice.content.content?.[0].content.content;
      const embedUrl = extractEmbedLink(contentRow?.[0]?.text);
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
        },
        size: {
          default: (MIN_EMBED_WIDTH + MAX_EMBED_WIDTH) / 2
        },
        // Type of iframe, it could either be video or embed
        type: {
          default: 'embed'
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

function EmptyIFrameContainer (props: HTMLAttributes<HTMLDivElement> & {type: 'video' | 'embed'}) {
  const theme = useTheme();
  const { type, ...rest } = props;
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
      {...rest}
    >
      <StyledEmptyIFrameContainer>
        {type === 'embed' ? <PreviewIcon fontSize='small' /> : <VideoLibraryIcon fontSize='small' /> }
        <Typography>
          {type === 'video' ? 'Insert a video' : 'Insert an embed'}
        </Typography>
      </StyledEmptyIFrameContainer>
    </ListItem>
  );
}

const StyledIFrame = styled(Box)`
  object-fit: contain;
  width: 100%;
  height: 100%;
  min-height: 250px;
  user-select: none;
  &:hover {
    cursor: initial;
  }
  border-radius: ${({ theme }) => theme.spacing(1)};
`;

export default function IFrame ({ node, updateAttrs, onResizeStop }:
  NodeViewProps & {onResizeStop?: (view: EditorView) => void }) {
  const theme = useTheme();
  const [size, setSize] = useState(node.attrs.size);
  const view = useEditorViewContext();

  // If there are no source for the node, return the image select component
  if (!node.attrs.src) {
    return (
      <IFrameSelector
        type={node.attrs.type}
        onIFrameSelect={(videoLink) => {
          updateAttrs({
            src: extractEmbedLink(videoLink)
          });
        }}
      >
        <EmptyIFrameContainer type={node.attrs.type} />
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
      <BlockAligner
        onDelete={() => {
          updateAttrs({
            src: null
          });
        }}
        size={size}
      >
        <Resizer
          onResizeStop={(_, data) => {
            updateAttrs({
              size: data.size.width
            });
            if (onResizeStop) {
              onResizeStop(view);
            }
          }}
          width={size}
          height={size / ASPECT_RATIO}
          onResize={(_, data) => {
            setSize(data.size.width);
          }}
          maxConstraints={[MAX_EMBED_WIDTH, MAX_EMBED_WIDTH / ASPECT_RATIO]}
          minConstraints={[MIN_EMBED_WIDTH, MIN_EMBED_WIDTH / ASPECT_RATIO]}
        >
          <StyledIFrame>
            <iframe allowFullScreen title='iframe' src={node.attrs.src} style={{ height: '100%', border: '0 solid transparent', width: '100%' }} />
          </StyledIFrame>
        </Resizer>
      </BlockAligner>
    </Box>
  );
}
